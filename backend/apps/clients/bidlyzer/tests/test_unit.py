import json
from unittest import mock
from django.test import TestCase
from django.conf import settings
from requests.exceptions import Timeout, RequestException

from apps.clients.bidlyzer.client import BidlyzerAPIClient


class MockResponse:
    """Mock requests.Response object"""
    def __init__(self, json_data, status_code):
        self.json_data = json_data
        self.status_code = status_code
        self.text = json.dumps(json_data) if json_data else ""
    
    def json(self):
        return self.json_data
    
    def raise_for_status(self):
        if self.status_code >= 400:
            from requests import HTTPError
            raise HTTPError(f"HTTP Error: {self.status_code}")


class BidlyzerAPIClientTests(TestCase):
    def setUp(self):
        """Setup test client and test data"""
        self.client = BidlyzerAPIClient(base_url="http://testserver:8001")
        self.project_id = "test-project-123"
        self.test_document = {
            "type": "doc",
            "content": [
                {"type": "paragraph", "content": [
                    {"type": "text", "text": "测试文档内容"}
                ]}
            ]
        }
    
    def test_init_defaults(self):
        """Test client initialization with default values"""
        client = BidlyzerAPIClient()
        self.assertEqual(client.base_url, getattr(settings, 'BIDLYZER_API_URL', 'http://localhost:8001'))
        self.assertEqual(client.timeout, 30)
        self.assertEqual(client.api_prefix, '/api/v1')
    
    def test_get_url(self):
        """Test URL construction"""
        url = self.client._get_url('/test-endpoint')
        self.assertEqual(url, "http://testserver:8001/api/v1/test-endpoint")
    
    @mock.patch('requests.post')
    def test_submit_document_analysis_success(self, mock_post):
        """Test successful document analysis submission"""
        # Mock response
        mock_response = MockResponse({
            "status": "success", 
            "message": "文档分析请求已接收", 
            "project_id": self.project_id
        }, 200)
        mock_post.return_value = mock_response
        
        # Call method
        result = self.client.submit_document_analysis(self.project_id, self.test_document)
        
        # Verify results
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["project_id"], self.project_id)
        
        # Verify request was made correctly
        mock_post.assert_called_once_with(
            url='http://testserver:8001/api/v1/django/analyze',
            json={
                'project_id': self.project_id,
                'document': self.test_document
            },
            timeout=30
        )
    
    @mock.patch('requests.post')
    def test_submit_document_analysis_http_error(self, mock_post):
        """Test HTTP error handling in document submission"""
        # Mock error response
        mock_response = MockResponse({
            "detail": "文档存储失败"
        }, 500)
        mock_post.return_value = mock_response
        
        # Call method and verify exception
        with self.assertRaises(ValueError) as context:
            self.client.submit_document_analysis(self.project_id, self.test_document)
        
        self.assertIn("HTTP错误", str(context.exception))
        self.assertIn("文档存储失败", str(context.exception))
    
    @mock.patch('requests.post')
    def test_submit_document_analysis_timeout(self, mock_post):
        """Test timeout handling in document submission"""
        # Mock timeout
        mock_post.side_effect = Timeout("Connection timed out")
        
        # Call method and verify exception
        with self.assertRaises(ValueError) as context:
            self.client.submit_document_analysis(self.project_id, self.test_document)
        
        self.assertIn("请求超时", str(context.exception))
    
    @mock.patch('requests.post')
    def test_submit_document_analysis_request_exception(self, mock_post):
        """Test request exception handling in document submission"""
        # Mock general request exception
        mock_post.side_effect = RequestException("Connection error")
        
        # Call method and verify exception
        with self.assertRaises(ValueError) as context:
            self.client.submit_document_analysis(self.project_id, self.test_document)
        
        self.assertIn("请求异常", str(context.exception))
    
    @mock.patch('requests.get')
    def test_get_document_success(self, mock_get):
        """Test successful document retrieval"""
        # Mock response
        mock_response = MockResponse({
            "project_id": self.project_id,
            "document": self.test_document
        }, 200)
        mock_get.return_value = mock_response
        
        # Call method
        result = self.client.get_document(self.project_id)
        
        # Verify results
        self.assertEqual(result["project_id"], self.project_id)
        self.assertEqual(result["document"], self.test_document)
        
        # Verify request was made correctly
        mock_get.assert_called_once_with(
            url=f'http://testserver:8001/api/v1/django/documents/{self.project_id}',
            timeout=30
        )
    
    @mock.patch('requests.get')
    def test_get_document_not_found(self, mock_get):
        """Test document not found case"""
        # Mock 404 response
        mock_response = MockResponse({"detail": "文档未找到"}, 404)
        mock_get.return_value = mock_response
        
        # Call method
        result = self.client.get_document(self.project_id)
        
        # Verify None is returned for 404
        self.assertIsNone(result)
    
    @mock.patch('requests.get')
    def test_get_document_exception(self, mock_get):
        """Test exception handling in document retrieval"""
        # Mock exception
        mock_get.side_effect = RequestException("Connection error")
        
        # Call method
        result = self.client.get_document(self.project_id)
        
        # Verify None is returned on exception
        self.assertIsNone(result)
