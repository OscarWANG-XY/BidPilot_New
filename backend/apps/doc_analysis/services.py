from typing import List, Dict, Any
from langchain_openai import ChatOpenAI
from langchain_core.callbacks import AsyncCallbackManager
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
import os, asyncio
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass

@dataclass
class AnalysisRequest:
    context: str
    requirement: str

@dataclass
class AnalysisResponse:
    result: str
    context: str
    requirement: str

class BidAnalysisService:
    def __init__(self, callback_handler=None):
    
        callback_manager = AsyncCallbackManager([callback_handler]) if callback_handler else None

        self.llm = ChatOpenAI(
            model_name="qwen-plus",
            temperature=0.7,
            streaming=True,
            callback_manager=callback_manager,
            api_key=os.getenv("ALIBABA_API_KEY"),
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
        )

        self.executor = ThreadPoolExecutor(max_workers=5)
        
        # 定义基础prompt模板
        self.base_prompt = PromptTemplate(
            input_variables=["context", "requirement"],
            template="""
            请分析以下招标文档内容，并根据要求给出分析结果：
            
            招标文档内容:
            {context}
            
            分析要求:
            {requirement}
            
            请给出详细的分析结果。
            """
        )
        
        self.chain = LLMChain(llm=self.llm, prompt=self.base_prompt)

    async def analyze_single(self, request: AnalysisRequest) -> AnalysisResponse:
        """场景1：单个context，单个要求的分析"""
        try:
            result = await self.chain.arun(
                context=request.context,
                requirement=request.requirement
            )
            return AnalysisResponse(
                result=result,
                context=request.context,
                requirement=request.requirement
            )
        except Exception as e:
            raise Exception(f"分析过程发生错误: {str(e)}")

    async def analyze_multi_context(
        self, 
        contexts: List[str], 
        requirement: str
    ) -> List[AnalysisResponse]:
        """场景2：多个不同context，相同requirement的并发分析"""
        requests = [
            AnalysisRequest(context=ctx, requirement=requirement)
            for ctx in contexts
        ]
        
        async def process_request(request: AnalysisRequest) -> AnalysisResponse:
            return await self.analyze_single(request)
        
        # 使用asyncio.gather进行并发处理
        tasks = [process_request(req) for req in requests]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 处理可能的异常
        valid_results = []
        for result in results:
            if isinstance(result, Exception):
                print(f"分析过程中发生错误: {str(result)}")
            else:
                valid_results.append(result)
                
        return valid_results

    async def analyze_multi_requirements(
        self, 
        context: str, 
        requirements: List[str]
    ) -> List[AnalysisResponse]:
        """场景3：相同context，多个不同requirement的并发分析"""
        requests = [
            AnalysisRequest(context=context, requirement=req)
            for req in requirements
        ]
        
        async def process_request(request: AnalysisRequest) -> AnalysisResponse:
            return await self.analyze_single(request)
        
        # 使用asyncio.gather进行并发处理
        tasks = [process_request(req) for req in requests]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 处理可能的异常
        valid_results = []
        for result in results:
            if isinstance(result, Exception):
                print(f"分析过程中发生错误: {str(result)}")
            else:
                valid_results.append(result)
                
        return valid_results

# 使用示例
async def main():
    # 初始化LLM（这里需要替换为实际的LLM实现）
    from langchain.llms import OpenAI
    llm = OpenAI()
    
    # 创建服务实例
    service = BidAnalysisService(llm)
    
    # 场景1：单个分析
    single_request = AnalysisRequest(
        context="这是一份测试招标文档...",
        requirement="分析投标资质要求"
    )
    result1 = await service.analyze_single(single_request)
    print("场景1结果:", result1)
    
    # 场景2：多context分析
    contexts = [
        "招标文档1...",
        "招标文档2...",
        "招标文档3..."
    ]
    results2 = await service.analyze_multi_context(
        contexts=contexts,
        requirement="分析投标资质要求"
    )
    print("场景2结果:", results2)
    
    # 场景3：多requirement分析
    requirements = [
        "分析投标资质要求",
        "分析技术规格要求",
        "分析商务要求"
    ]
    results3 = await service.analyze_multi_requirements(
        context="这是待分析的招标文档...",
        requirements=requirements
    )
    print("场景3结果:", results3)

if __name__ == "__main__":
    asyncio.run(main())