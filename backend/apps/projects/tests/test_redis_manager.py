import time
import unittest
from django.test import TestCase
from apps.projects.utils.redis_manager import RedisManager

class RedisManagerTestCase(TestCase):
    def setUp(self):
        self.redis_manager = RedisManager()
        self.stream_id = self.redis_manager.generate_stream_id()
    
    def test_stream_operations(self):
        # 初始化任务
        metadata = {
            "project_id": "test-project",
            "user_id": "test-user",
            "model": "gpt-4"
        }
        self.assertTrue(self.redis_manager.initialize_stream(self.stream_id, metadata))
        
        # 添加流块
        self.assertTrue(self.redis_manager.add_stream_chunk(self.stream_id, "Hello"))
        self.assertTrue(self.redis_manager.add_stream_chunk(self.stream_id, "World"))
        
        # 获取流块
        chunks = self.redis_manager.get_stream_chunks(self.stream_id)
        self.assertEqual(len(chunks), 2)
        self.assertEqual(chunks[0]["content"], "Hello")
        self.assertEqual(chunks[1]["content"], "World")
        
        # 标记完成
        self.assertTrue(self.redis_manager.mark_stream_complete(self.stream_id))
        
        # 检查状态
        status = self.redis_manager.get_stream_status(self.stream_id)
        self.assertEqual(status["status"], "COMPLETED")
        
        # 清理
        self.redis_manager.redis_client.delete(
            self.redis_manager.create_stream_key(self.stream_id),
            self.redis_manager.create_status_key(self.stream_id)
        )

if __name__ == '__main__':
    unittest.main() 