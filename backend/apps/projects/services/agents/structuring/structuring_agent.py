
from .docx_extractor import DocxExtractor
from .outline_builder import TenderOutlineAnalyzer




class StructuringState(enum.Enum):
    # 初始化
    INIT = "init"
    # 提取投标文件信息
    EXTRACT_DOC = "extract_doc"
    


class DocumentStructureAgent:
    """
    - step 1 - 提取投标文件信息
    - step 2 - 分析文档大纲（一级 + 二、三级 + 前言章节）
    - step 3 - 构建查询跟踪表（添加章节编号）
    - step 4 - 提供查询和跟踪查询
    

    - 先有一个完整的process：但，agent不应该一口气跑到底，而是每走到一个“交互点”，暂停下来，等待用户输入，收到输入之后，继续执行下一步
    - 然后， 再设计交互节点，添加状态state, 交互节点interaction_node, 状态机state_machine
    - 将process改为状态驱动

    """


    def __init__(self):
        # 初始化功能模块
        self.docx_extractor = DocxExtractor()
        self.tender_outline_analyzer = TenderOutlineAnalyzer()
        # 未完成
        pass






    
    def process(self, project_id: str) -> str:

        # 1. 提取投标文件信息
        document = self.docx_extractor.extract_content()

        # 2. 分析文档大纲（一级 + 二、三级 + 前言章节）
        document_outline = self.document_outline_builder(document)

        # 3. 构建查询跟踪表（添加章节编号）
        #query_tracking_table = self.query_tracking_table_builder(document_outline)

        # 4. 提供查询和跟踪查询

        
        pass
        




