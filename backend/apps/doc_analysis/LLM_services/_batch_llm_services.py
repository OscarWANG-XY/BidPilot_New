from typing import List
from ._generic_llm_services import GenericLLMService, LLMRequest
from ._llm_data_types import BatchResult, LLMRequest
import asyncio, logging, json


logger = logging.getLogger(__name__)


class BatchLLMService(GenericLLMService):
    """批量LLM服务实现"""
    
    async def batch_process(self, requests: List[LLMRequest], parallel: str = "asyncio") -> List[BatchResult]:
        """
        批量处理LLM请求
        :param requests: LLM请求列表
        :param parallel: 使用哪种并行处理方式
        :return: 处理结果列表
        """
        try:
            logger.info(f"批量处理请求: {len(requests)} 个任务")
            
            # 选择并发执行方式 - thread(多线程) 或 asyncio(异步)
            if parallel == "thread":    
                def _run_process(request: LLMRequest, idx: int):
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    try:
                        result = loop.run_until_complete(self.process(request))
                        return BatchResult(
                            result=result,
                            success=True,
                            request_index=idx,
                            approach="thread",
                            task_id=request.task_id
                        )
                    except Exception as e:
                        return BatchResult(
                            result=None,
                            success=False,
                            error=e,
                            request_index=idx,
                            approach="thread",
                            task_id=request.task_id
                        )
                    finally:
                        #loop.close()  # 关闭事件循环， 缺点是当请求量大时，会占用大量内存。 
                        pass

                # 使用线程池并发执行任务
                results = list(self.executor.map(
                    lambda x: _run_process(x[1], x[0]), 
                    enumerate(requests)
                ))
            
            elif parallel == "asyncio":
                async def _wrapped_process(request: LLMRequest, idx: int):
                    try:
                        result = await self.process(request)
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

                # 创建任务列表
                tasks = [_wrapped_process(request, idx) 
                        for idx, request in enumerate(requests)]

                # 使用 asyncio 并发执行任务
                results = await asyncio.gather(*tasks, return_exceptions=False)

            return results

        except Exception as e:
            logger.error(f"批量处理请求失败: {str(e)}")
            raise 