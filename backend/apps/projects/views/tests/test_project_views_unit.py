import uuid
import json
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status

from apps.projects.models import Project, ProjectStatus, ProjectType, StageType
from apps.projects.views.project_views import ProjectViewSet
from apps.files.models import FileRecord
from django.contrib.auth import get_user_model

User = get_user_model()

class ProjectViewSetUnitTests(TestCase):
    def setUp(self):
        # 创建测试用户
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword',
            phone='13800138000'  # 添加手机号参数
        )
        
        # 创建测试项目
        self.project_id = uuid.uuid4()
        self.project = Project.objects.create(
            id=self.project_id,
            project_name='测试项目',
            tenderee='测试招标单位',
            bidder='测试投标单位',
            project_type=ProjectType.WELFARE,
            status=ProjectStatus.IN_PROGRESS,
            current_active_stage=StageType.TENDER_ANALYSIS,
            creator=self.user
        )
        
        # 设置API请求工厂
        self.factory = APIRequestFactory()

    def test_list_projects(self):
        """测试获取项目列表"""
        url = reverse('project-list')
        request = self.factory.get(url)
        force_authenticate(request, user=self.user)
        
        view = ProjectViewSet.as_view({'get': 'list'})
        response = view(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(str(response.data[0]['id']), str(self.project_id))

    def test_retrieve_project(self):
        """测试获取单个项目详情"""
        url = reverse('project-detail', kwargs={'pk': self.project_id})
        request = self.factory.get(url)
        force_authenticate(request, user=self.user)
        
        view = ProjectViewSet.as_view({'get': 'retrieve'})
        response = view(request, pk=self.project_id)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(str(response.data['id']), str(self.project_id))
        self.assertEqual(response.data['project_name'], '测试项目')

    def test_create_project(self):
        """测试创建项目"""
        url = reverse('project-list')
        data = {
            'project_name': '新测试项目',
            'tenderee': '新招标单位',
            'bidder': '新投标单位',
            'project_type': ProjectType.FSD,
            'current_active_stage': StageType.TENDER_ANALYSIS
        }
        request = self.factory.post(url, data=data, format='json')
        force_authenticate(request, user=self.user)
        
        view = ProjectViewSet.as_view({'post': 'create'})
        response = view(request)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['project_name'], '新测试项目')

    def test_update_project(self):
        """测试更新项目"""
        url = reverse('project-detail', kwargs={'pk': self.project_id})
        data = {
            'project_name': '更新的项目名称',
            'tenderee': '更新的招标单位',
        }
        request = self.factory.patch(url, data=data, format='json')
        force_authenticate(request, user=self.user)
        
        view = ProjectViewSet.as_view({'patch': 'partial_update'})
        response = view(request, pk=self.project_id)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['project_name'], '更新的项目名称')
        self.assertEqual(response.data['tenderee'], '更新的招标单位')

    def test_delete_project_cancelled(self):
        """测试删除已取消的项目"""
        # 先将项目状态设为已取消
        self.project.status = ProjectStatus.CANCELLED
        self.project.save()
        
        url = reverse('project-detail', kwargs={'pk': self.project_id})
        request = self.factory.delete(url)
        force_authenticate(request, user=self.user)
        
        view = ProjectViewSet.as_view({'delete': 'destroy'})
        response = view(request, pk=self.project_id)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Project.objects.filter(id=self.project_id).count(), 0)

    def test_delete_project_in_progress(self):
        """测试删除进行中的项目（应该失败）"""
        # 确保项目是进行中状态
        self.project.status = ProjectStatus.IN_PROGRESS
        self.project.save()
        
        url = reverse('project-detail', kwargs={'pk': self.project_id})
        request = self.factory.delete(url)
        force_authenticate(request, user=self.user)
        
        view = ProjectViewSet.as_view({'delete': 'destroy'})
        response = view(request, pk=self.project_id)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Project.objects.filter(id=self.project_id).count(), 1)

    def test_update_project_status(self):
        """测试更新项目状态"""
        url = reverse('project-update-status', kwargs={'pk': self.project_id})
        data = {'status': ProjectStatus.COMPLETED}
        request = self.factory.patch(url, data=data, format='json')
        force_authenticate(request, user=self.user)
        
        view = ProjectViewSet.as_view({'patch': 'update_status'})
        response = view(request, pk=self.project_id)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertEqual(self.project.status, ProjectStatus.COMPLETED)

    def test_update_active_stage(self):
        """测试更新项目活动阶段"""
        url = reverse('project-update-active-stage', kwargs={'pk': self.project_id})
        data = {'current_active_stage': StageType.TENDER_ANALYSIS}
        request = self.factory.patch(url, data=data, format='json')
        force_authenticate(request, user=self.user)
        
        view = ProjectViewSet.as_view({'patch': 'update_active_stage'})
        response = view(request, pk=self.project_id)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertEqual(self.project.current_active_stage, data['current_active_stage'])

    def test_update_tender_file_extraction(self):
        """测试更新项目招标文件提取信息"""
        url = reverse('project-update-tender-file-extraction', kwargs={'pk': self.project_id})
        data = {'tender_file_extraction': {'key': 'value'}}
        request = self.factory.patch(url, data=data, format='json')
        force_authenticate(request, user=self.user)
        
        view = ProjectViewSet.as_view({'patch': 'update_tender_file_extraction'})
        response = view(request, pk=self.project_id)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertEqual(self.project.tender_file_extraction, {'key': 'value'})

    @patch('apps.files.models.FileRecord.get_presigned_url')
    def test_get_tender_file_url_with_files(self, mock_get_presigned_url):
        """测试获取项目招标文件URL（有文件）"""
        # 模拟预签名URL
        mock_get_presigned_url.return_value = "https://example.com/presigned-url"
        
        # 创建测试文件记录
        file_id = uuid.uuid4()
        file_record = FileRecord.objects.create(
            id=file_id,
            name="测试文件.pdf",
            size=1024,
            type="PDF",
            mime_type="application/pdf",
            created_by=self.user.username,
            owner=self.user,
            project=self.project
        )
        
        url = reverse('project-get-tender-file-url', kwargs={'pk': self.project_id})
        request = self.factory.get(url)
        force_authenticate(request, user=self.user)
        
        view = ProjectViewSet.as_view({'get': 'get_tender_file_url'})
        response = view(request, pk=self.project_id)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['files']), 1)
        self.assertEqual(response.data['files'][0]['name'], "测试文件.pdf")
        self.assertEqual(response.data['files'][0]['url'], "https://example.com/presigned-url")

    def test_get_tender_file_url_no_files(self):
        """测试获取项目招标文件URL（没有文件）"""
        # 确保项目没有关联文件
        FileRecord.objects.filter(project=self.project).delete()
        
        url = reverse('project-get-tender-file-url', kwargs={'pk': self.project_id})
        request = self.factory.get(url)
        force_authenticate(request, user=self.user)
        
        view = ProjectViewSet.as_view({'get': 'get_tender_file_url'})
        response = view(request, pk=self.project_id)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['detail'], "该项目没有关联的招标文件")
