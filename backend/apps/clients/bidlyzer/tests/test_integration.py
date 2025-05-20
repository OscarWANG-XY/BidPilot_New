import pytest
import time
import uuid
from django.test import TestCase
from unittest import skipIf
from django.conf import settings
import requests
from apps.clients.bidlyzer.client import BidlyzerAPIClient

# Check if bidlyzer service is available
def is_service_available():
    try:
        service_url = getattr(settings, 'BIDLYZER_SERVICE_URL', 'http://localhost:8001')
        response = requests.get(f"{service_url}/ping_redis", timeout=2)
        return response.status_code == 200
    except:
        return False

@skipIf(not is_service_available(), "Bidlyzer service is not available")
class BidlyzerIntegrationTests(TestCase):
    def setUp(self):
        """Setup for each test"""
        self.client = BidlyzerAPIClient()
        # Generate a unique project ID for test isolation
        self.project_id = f"test-{uuid.uuid4().hex[:8]}"
        
        # Sample Tiptap document
        self.test_document = {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": "这是一个招标文档的测试内容。"
                        }
                    ]
                },
                {
                    "type": "heading",
                    "attrs": {"level": 1},
                    "content": [
                        {
                            "type": "text",
                            "text": "项目介绍"
                        }
                    ]
                },
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": "本项目旨在测试Bidlyzer服务的文档分析功能。"
                        }
                    ]
                }
            ]
        }
        
    def test_full_analysis_workflow(self):
        """测试完整的文档分析工作流"""
        # 1. 提交文档分析
        result = self.client.submit_document_analysis(
            project_id=self.project_id,
            document=self.test_document
        )
        
        # 验证提交成功
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["project_id"], self.project_id)
        
        # 2. 等待一小段时间，确保服务处理了请求
        time.sleep(1)
        
        # 3. 获取文档
        doc_result = self.client.get_document(self.project_id)
        
        # 验证文档获取成功
        self.assertIsNotNone(doc_result)
        self.assertEqual(doc_result["project_id"], self.project_id)
        self.assertEqual(doc_result["document"]["type"], "doc")
        
        # 验证文档内容正确
        self.assertEqual(
            doc_result["document"]["content"][0]["content"][0]["text"], 
            "这是一个招标文档的测试内容。"
        )
    
    def test_nonexistent_document(self):
        """测试获取不存在的文档"""
        nonexistent_id = f"nonexistent-{uuid.uuid4().hex[:8]}"
        result = self.client.get_document(nonexistent_id)
        self.assertIsNone(result)

    def test_service_health(self):
        """测试服务健康状态"""
        # 直接调用底层requests库测试服务状态
        service_url = self.client.base_url
        
        # 测试Redis ping
        response = requests.get(f"{service_url}/ping_redis", timeout=5)
        self.assertEqual(response.status_code, 200)
        self.assertIn("redis_ping", response.json())
        
        # 测试DB ping (如果有)
        response = requests.get(f"{service_url}/ping_db", timeout=5)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "success")
