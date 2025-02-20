from typing import List, Any
import asyncio
import logging
from ._generic_llm_services import GenericLLMService, LLMRequest, LLMConfig

logger = logging.getLogger(__name__)

class BatchLLMService(GenericLLMService):
    """批量LLM服务实现"""
    
    async def batch_process(self, requests: List[LLMRequest], stream: bool = False) -> List[Any]:
        """
        批量处理LLM请求
        :param requests: LLM请求列表
        :param stream: 是否启用流式输出
        :return: 处理结果列表
        """
        try:
            logger.info(f"批量处理请求: {len(requests)} 个任务")
            
            # 将异步任务包装为同步函数，以便在线程池中运行
            def _run_process(request: LLMRequest):
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    return loop.run_until_complete(self.process(request))
                finally:
                    loop.close()

            # 使用线程池并发执行任务
            results = list(self.executor.map(_run_process, requests))
            
            return results

        except Exception as e:
            logger.error(f"批量处理请求失败: {str(e)}")
            raise 