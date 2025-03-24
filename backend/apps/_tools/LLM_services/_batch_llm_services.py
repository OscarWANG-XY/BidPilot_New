from typing import List
from ._generic_llm_services import GenericLLMService, LLMRequest
from ._llm_data_types import BatchResult, LLMRequest
import asyncio, logging, json


logger = logging.getLogger(__name__)


class BatchLLMService(GenericLLMService):
    """批量LLM服务实现"""
    
    async def batch_process(self, requests: List[LLMRequest], max_concurrent: int = 10, repeat: int = 1) -> List[BatchResult]:
        """
        批量处理LLM请求
        :param requests: LLM请求列表
        :param max_concurrent: 最大并发数量，默认为30
        :return: 处理结果列表
        """
        try:
            # 打印请求列表
            logger.info(f"批量处理请求: {len(requests)} 个任务，最大并发数: {max_concurrent}")
            
            #！！！！！ 限制最大并发量
            if max_concurrent > 10:
                max_concurrent = 10

            async def _wrapped_process(request: LLMRequest, idx: int):
                try:
                    result = await self.process(request)  # 调用父类方法，从GenericLLMService中继承

                    # # 标准化输出格式
                    # if isinstance(result, str):
                    #     try:
                    #         processed_result = json.loads(result)
                    #     except json.JSONDecodeError:
                    #         # 解析失败，提供默认结构
                    #         processed_result = {"titles_to_detail": []}
                    # elif isinstance(result, dict) and "titles_to_detail" in result:
                    #     # 已经是正确格式的字典
                    #     processed_result = result
                    # else:
                    #     # 其他情况，提供默认结构
                    #     processed_result = {"titles_to_detail": []}

                    return BatchResult(
                        result=result,
                        success=True,
                        request_index=idx,
                        approach="asyncio",
                        task_id=request.task_id
                    )
                except Exception as e:
                    return BatchResult(
                        result=None,
                        success=False,
                        error=e,
                        request_index=idx,
                        approach="asyncio",
                        task_id=request.task_id
                    )

            # 使用信号量控制并发数
            semaphore = asyncio.Semaphore(max_concurrent)
                
            async def _controlled_process(request: LLMRequest, idx: int):
                async with semaphore:
                    return await _wrapped_process(request, idx)

            # 创建任务列表
            tasks = [_controlled_process(request, idx) 
                    for idx, request in enumerate(requests)]

            # 使用 asyncio 并发执行任务
            results = await asyncio.gather(*tasks, return_exceptions=False)

            return results

        except Exception as e:
            logger.error(f"批量处理请求失败: {str(e)}")
            raise 