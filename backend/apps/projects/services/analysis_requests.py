# 请根据需要为我import 功能包
from langchain.prompts import PromptTemplate #ChatPromptTemplate, MessagesPlaceholder

class PromptProvider:
    def __init__(self):
        # 共享的input_variables
        self.common_inputs = ["context", "requirement"]
    
    def get_analysis_prompt(self) -> PromptTemplate:
        """获取文档分析prompt"""
        return PromptTemplate(
            input_variables=self.common_inputs,
            template="""
            请分析以下招标文档的内容，并根据要求给出分析结果：
            
            招标文档内容:
            {context}
            
            分析要求:
            {requirement}
            
            请给出详细的分析结果。
            """
        )
    
    def get_summary_prompt(self) -> PromptTemplate:
        """获取文档总结prompt"""
        return PromptTemplate(
            input_variables=self.common_inputs,
            template="""
            请根据以下内容生成总结：
            
            内容:
            {context}
            
            总结要求:
            {requirement}
            
            请生成简洁明了的总结。
            """
        )
    
    def get_qa_prompt(self) -> PromptTemplate:
        """获取问答prompt"""
        return PromptTemplate(
            input_variables=self.common_inputs,
            template="""
            根据以下内容回答问题：
            
            内容:
            {context}
            
            问题:
            {requirement}
            
            请给出准确的回答。
            """
        )


    def get_prompt(self, ):
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
    

















