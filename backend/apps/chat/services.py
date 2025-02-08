from typing import List, Dict, Optional
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.memory.chat_memory import BaseChatMessageHistory
from langchain.schema import AIMessage, HumanMessage, SystemMessage, BaseMessage
from langchain_core.runnables import RunnableWithMessageHistory
from langchain.chains import ConversationChain, LLMChain
from langchain_core.callbacks import AsyncCallbackManager
from langchain.schema import StrOutputParser
from django.utils import timezone
import os
from .models import ChatMessage


import logging
logger = logging.getLogger(__name__)



class CustomChatMessageHistory(BaseChatMessageHistory):
    """自定义的消息历史管理器"""
    """
    和数据库交互时，需要将消息类型转换为字符串
    通过role字段来区分消息类型
    在models侧，使用与langchain消息相同的类型命名，会大大简化代码（如下）
    这个简化过程，需要使用到BaseMessage类型
    """
    

    # 创建消息类型映射
    MESSAGE_TYPES = {
        'user': HumanMessage,
        'assistant': AIMessage,
        'system': SystemMessage
    }
    # 创建反向映射，用于保存消息时的角色转换
    ROLE_MAP = {
        HumanMessage: 'user',
        AIMessage: 'assistant',
        SystemMessage: 'system'
    }

    def __init__(self, session_id: str):
        super().__init__()  # 调用父类初始化
        self.session_id = session_id

    def add_message(self, message: BaseMessage) -> None:
        """添加新消息"""
        logger.debug(f"Adding message of type: {message.__class__.__name__}")
        logger.debug(f"Message content: {message.content}")
        try:
            role = self.ROLE_MAP[message.__class__]
            ChatMessage.objects.create(
                session_id=self.session_id,
                role=role,
                content=message.content
            )

        except Exception as e:
            logger.error(f"Error creating ChatMessage: {str(e)}")
            logger.error(f"Session ID: {self.session_id}")
            logger.error(f"Role: {message.__class__.__name__}")
            raise

    def add_user_message(self, message: str) -> None:
        """添加用户消息 (必需的接口方法)"""
        self.add_message(HumanMessage(content=message))


    def add_ai_message(self, message: str) -> None:
        """添加AI消息 (必需的接口方法)"""
        self.add_message(AIMessage(content=message))


    def clear(self) -> None:
        """清除所有消息 (必需的接口方法)"""
        ChatMessage.objects.filter(session_id=self.session_id).delete()

    @property
    def messages(self) -> List[BaseMessage]:
        """获取所有消息 (必需的接口属性)"""
        messages = ChatMessage.objects.filter(
            session_id=self.session_id
        ).order_by('sequence')
        
        logger.debug(f"Retrieved messages from DB: {[msg.role for msg in messages]}")
        
        try:
            return [
                self.MESSAGE_TYPES[msg.role](content=msg.content)
                for msg in messages
            ]
        except KeyError as e:
            logger.error(f"Invalid role found in messages: {e}")
            logger.error(f"Available roles: {list(self.MESSAGE_TYPES.keys())}")
            logger.error(f"Message roles in DB: {[msg.role for msg in messages]}")
            raise

    def get_messages(self):
        """获取所有消息 (用于API返回)"""
        messages = ChatMessage.objects.filter(
            session_id=self.session_id
        ).order_by('sequence')
        
        logger.debug(f"Getting messages for API return: {[msg.role for msg in messages]}")
        
        try:
            return [
                {
                    "role": msg.role,  # 直接使用数据库中的role
                    "content": msg.content
                } for msg in messages
            ]
        except Exception as e:
            logger.error(f"Error in get_messages: {str(e)}")
            raise

class EnhancedLLMService:
    """使用 LangChain 链式结构的 LLM 服务"""
    def __init__(self, callback_handler=None):
        callback_manager = AsyncCallbackManager([callback_handler]) if callback_handler else None


        self.chat_model = ChatOpenAI(
            model_name="qwen-plus",
            temperature=0.7,
            streaming=True,
            callback_manager=callback_manager,
            api_key=os.getenv("ALIBABA_API_KEY"),
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
        )

    # 由于以下各方法的提示词构建的方式不同，放在init里无法形成复用，所以self.prompt_template就不必要了。
 
    def create_conversation_chain(self, session_id: str) -> ConversationChain:
        """创建基于记忆的对话链"""
        
        # 创建提示模板
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a helpful AI assistant. 
                        Your responses should be informative and engaging."""),
            MessagesPlaceholder(variable_name="chat_history"), # memory里提供了调用的变量名。
            ("human", "{input}")
        ]) 
        
        # 使用新的 RunnableWithMessageHistory
        conversation_chain = RunnableWithMessageHistory(
            prompt | self.chat_model | StrOutputParser(),
            # 使用自定义的消息历史管理器, 加lambda: 是因为RunnableWithMessageHistory需要一个函数作为参数。
            lambda:CustomChatMessageHistory(session_id=session_id),
            input_messages_key="input",
            history_messages_key="chat_history"
        )

        return conversation_chain
    
    def create_rag_chain(self, documents: List[str]) -> LLMChain:

        """创建检索增强生成链（RAG）"""
        # 定义 RAG 提示模板
        rag_prompt = ChatPromptTemplate.from_messages([
            ("system", """Based on the following context, provide a comprehensive answer.
            
            Context: {context}
            
            Question: {question}
            """)
        ])
        
        # 创建 RAG 链
        rag_chain = rag_prompt | self.chat_model | StrOutputParser()
        
        return rag_chain
    
    def create_analysis_chain(self) -> LLMChain:
        """创建分析链，用于深度分析用户输入"""
        # 定义分析提示模板
        analysis_prompt = ChatPromptTemplate.from_messages([
            ("system", """Analyze the user's input for:
            1. Main topics
            2. Sentiment
            3. Key questions or requests
            
            User input: {input}
            """)
        ])
        
        # 创建分析链
        analysis_chain = analysis_prompt | self.chat_model | StrOutputParser()
        return analysis_chain

class ChainBasedChatService:
    """基于 LangChain 链式结构的聊天服务"""
    def __init__(self):
        self.llm_service = EnhancedLLMService()
        
    async def process_message(
        self,
        session_id: str,
        content: str,
        context: Optional[Dict] = None,
        documents: Optional[List[str]] = None
    ) -> Dict:
        """处理用户消息，使用多个链组合"""
        try:
            # 1. 输入分析
            analysis_chain = self.llm_service.create_analysis_chain()
            analysis_result = await analysis_chain.ainvoke({"input": content})
            


            # 2. 如果有相关文档，使用 RAG 链
            rag_result = None
            if documents:
                rag_chain = self.llm_service.create_rag_chain(documents)
                rag_result = await rag_chain.ainvoke({
                    "context": "\n".join(documents),
                    "question": content
                })
            
            # 3. 使用对话链生成最终响应
            conversation_chain = self.llm_service.create_conversation_chain(
                session_id
            )
            
            # 组合上下文信息 (下面的conversation_chain.ainvoke()需要一个input作为输入)
            # 准备输入
            chain_input = {
                "input": content,
                "context": context or {},
                "analysis": analysis_result,
                "rag_result": rag_result
            }
            
            # 生成最终响应
            response = await conversation_chain.ainvoke(chain_input)
            

            return {
                "response": response,
                "metadata": {
                    "analysis": analysis_result,
                    "rag_used": bool(rag_result),
                    "timestamp": timezone.now().isoformat()
                }
            }
            

        except Exception as e:
            logger.error(f"Chain processing error: {str(e)}")
            raise