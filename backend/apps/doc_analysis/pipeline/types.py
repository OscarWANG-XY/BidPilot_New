from dataclasses import dataclass, field
from datetime import datetime
from django.db.models import Model
from typing import TypeVar, Generic, Type, Optional, Dict, List, Union
from ..models import DocumentAnalysis
import json, tiktoken
from apps.doc_analysis.LLM_services._llm_data_types import LLMRequest, BatchResult

#定义泛型Model类型 【通用的框架代码】
DjangoModel = TypeVar('DjangoModel', bound=Model)

def count_tokens(text: str) -> int:
    """计算文本的token数量"""
    encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
    return len(encoding.encode(text))

## ---- to support example template -----
@dataclass
class EXAMPLE_INPUT:
    example_input: str

@dataclass
class EXAMPLE_OUPUT:
    example_out:str
## ------- example template --------


@dataclass
class ModelData(Generic[DjangoModel]):
    model: Type[DjangoModel]
    instance: DjangoModel

# 使用： ModelData(模型名)

# ------------------补充说明-----------------------
# 如果需要针对特定模型的子类进行支持，可以使用以下方式，
# 例如：
#OrderModel = TypeVar('OrderModel', bound=Order)
#PaymentModel = TypeVar('PaymentModel', bound=Payment)
# 使用： ModelData(OrderModel); ModelData(PaymentModel)

# _01_extrac_docx_elements的输出，数据存储在模型DocumentAnalysis的extracted_elements字段
@dataclass   
class DocxElements:
    """包含所有文档元素的集合类"""
    elements: List[Dict]  # 每个元素存储为字典
    document_analysis: ModelData[DocumentAnalysis]

    def add_element(self, 
                    element_type: str, 
                    position: int, 
                    content: str, 
                    is_toc: bool = False, 
                    toc_level: Optional[int] = None,
                    is_heading: bool = False,
                    heading_level: Optional[int] = None):
        """添加一个新元素"""
        element = {
            'type': element_type,
            'position': position,
            'content': content,
            'is_toc': is_toc,
            'toc_level': toc_level,
            'is_heading': is_heading,
            'heading_level': heading_level
        }
        self.elements.append(element)

    @staticmethod
    def clean_content(content: str) -> str:
        """
        清理文本内容中的多余空格
        1. 去除首尾空格
        2. 将多个连续空格替换为单个空格
        3. 去除换行符前后的多余空格
        """
        if not content:
            return content
            
        # 去除首尾空格
        content = content.strip()
        # 将多个连续空格替换为单个空格
        content = ' '.join(content.split())
        # 处理换行符前后的空格
        content = '\n'.join(line.strip() for line in content.splitlines())
        
        return content

    def to_model(self) -> Dict:
        """将DocxElements转换为可序列化的字典, 存储在extracted_elements字段中"""
        return {
            'elements': self.elements,
            'document_analysis': {
                'model': 'DocumentAnalysis',
                'instance': self.document_analysis.instance.pk
            }
        }

    @classmethod
    def from_model(cls, data: Dict) -> 'DocxElements':
        """从字典创建DocxElements实例"""
        from ..models import DocumentAnalysis
        return cls(
            elements=data['elements'],
            document_analysis=ModelData(
                model=DocumentAnalysis,
                instance=DocumentAnalysis.objects.get(pk=data['document_analysis']['instance'])
            )
        )

    def filter_by_type(self, element_type: str) -> 'List[Dict]':
        """按元素类型过滤"""
        return [element for element in self.elements if element['type'] == element_type]

    def get_headings(self) -> 'List[Dict]':
        """获取所有标题元素"""
        return [element for element in self.elements if element.get('is_heading', False)]

    def get_toc(self) -> 'List[Dict]':
        """获取所有目录元素"""
        return [element for element in self.elements if element.get('is_toc', False)]

    def format_toc_chapters(self) -> str:
        """格式化所有chapter级别的目录元素为字符串"""
        formatted_toc = [
            f'title:{self.clean_content(elem["content"])}, level:{elem["toc_level"]}, position:{elem["position"]}'
            for elem in self.elements
            if elem.get('toc_level') == 1 and elem.get('is_toc', False)
        ]
        return "\n".join(formatted_toc)

    def format_heading_chapters(self) -> str:
        """格式化所有chapter级别的标题元素为字符串"""
        formatted_headings = [
            f'title:{self.clean_content(elem["content"])}, level:{elem["heading_level"]}, position:{elem["position"]}'
            for elem in self.elements
            if elem.get('heading_level') == 1 and elem.get('is_heading', False)
        ]
        return "\n".join(formatted_headings)

    def format_toc_sections(self) -> str:
        """格式化所有section级别的目录元素为字符串"""
        formatted_toc = [
            f'title:{self.clean_content(elem["content"])}, level:{elem["toc_level"]}, position:{elem["position"]}'
            for elem in self.elements
            if elem.get('toc_level') == 2 and elem.get('is_toc', False)
        ]
        return "\n".join(formatted_toc)

    def format_heading_sections(self) -> str:
        """格式化所有section级别的标题元素为字符串"""
        formatted_headings = [
            f'title:{self.clean_content(elem["content"])}, level:{elem["heading_level"]}, position:{elem["position"]}'
            for elem in self.elements
            if elem.get('heading_level') == 2 and elem.get('is_heading', False)
        ]
        return "\n".join(formatted_headings)
    
    def format_toc_subsections(self) -> str:
        """格式化所有subsection级别的目录元素为字符串"""
        formatted_toc = [
            f'title:{self.clean_content(elem["content"])}, level:{elem["toc_level"]}, position:{elem["position"]}'
            for elem in self.elements
            if elem.get('toc_level') == 3 and elem.get('is_toc', False)
        ]
        return "\n".join(formatted_toc)

    def format_heading_subsections(self) -> str:
        """格式化所有subsection级别的标题元素为字符串"""
        formatted_headings = [
            f'title:{self.clean_content(elem["content"])}, level:{elem["heading_level"]}, position:{elem["position"]}'
            for elem in self.elements
            if elem.get('heading_level') == 3 and elem.get('is_heading', False)
        ]
        return "\n".join(formatted_headings)


# _02_outline_analysis的输出，数据存储在模型DocumentAnalysis的outline_analysis_result字段

@dataclass
class OutlineAnalysisResult:
    """目录分析结果"""
    document_analysis: ModelData[DocumentAnalysis]
    analysis_result: BatchResult  # 存储完整的大模型分析结果
    user_confirm: bool = False  # 初始状态为False

    def to_model(self) -> Dict:
        """转换为可序列化的字典"""
        return {
            'document_analysis': {
                'model': 'DocumentAnalysis',
                'instance': self.document_analysis.instance.pk
            },
            'analysis_result': {
                'result': self.analysis_result.result,
                'success': self.analysis_result.success,
                'error': str(self.analysis_result.error) if self.analysis_result.error else None,
                'request_index': self.analysis_result.request_index,
                'approach': self.analysis_result.approach,
                'task_id': self.analysis_result.task_id,
                'probability': self.analysis_result.probability,
                'repeat_index': self.analysis_result.repeat_index,
            },
            'user_confirm': self.user_confirm,
        }

    @classmethod
    def from_model(cls, data: Union[Dict, str]) -> 'OutlineAnalysisResult':
        """从字典创建实例"""
        # 重建 BatchResult
        batch_result = BatchResult(
            result=data['analysis_result']['result'],
            success=data['analysis_result']['success'],
            error=Exception(data['analysis_result']['error']) if data['analysis_result']['error'] else None,
            request_index=data['analysis_result']['request_index'],
            approach=data['analysis_result']['approach'],
            task_id=data['analysis_result']['task_id'],
            probability=data['analysis_result']['probability'],
            repeat_index=data['analysis_result']['repeat_index'],
        )

        return cls(
            document_analysis=ModelData(
                model=DocumentAnalysis,
                instance=DocumentAnalysis.objects.get(pk=data['document_analysis']['instance'])
            ),
            analysis_result=batch_result,
            user_confirm=data.get('user_confirm',[])
        )

    @property
    def toc_only_elements(self) -> List[Dict]:
        """提取目录独有的元素"""
        elements = []
        if self.analysis_result and self.analysis_result.result:
            for item in self.analysis_result.result:
                data = json.loads(item['value'])
                elements.extend(data.get('toc_only_titles', []))
        return elements

    @property
    def heading_only_elements(self) -> List[Dict]:
        """提取正文独有的元素"""
        elements = []
        if self.analysis_result and self.analysis_result.result:
            for item in self.analysis_result.result:
                data = json.loads(item['value'])
                elements.extend(data.get('heading_only_titles', []))
        return elements


    @staticmethod
    def get_prompt_specification() -> str:
        """
        OutlineAnalysis会按chapter,section,subsection逐个层级比较<目录标题列表> 与 <正文标题列表>
        以下定义了，大模型返回的输出格式的规范说明
        """
        return """
请严格按照以下JSON格式输出目录分析结果，不要包含任何额外的解释或说明：
{
    "toc_only_titles": [
        {
            "title": "标题内容",
            "position": "目录中的位置",
            "level": "标题层级"
        }
    ],
    "heading_only_titles": [
        {
            "title": "标题内容",
            "position": "正文中的位置",
            "level": "标题层级"
        }
    ],
}
"""

# _03_outline_improvement的输出，数据存储在模型DocumentAnalysis的improved_docx_elements字段
@dataclass
class ImprovedDocxElements(DocxElements):
    """改进后的文档元素，包含用户确认状态"""
    user_confirm: bool = False  # 用户是否确认了推荐内容

    def to_model(self) -> Dict:
        """将ImprovedDocxElements转换为可序列化的字典"""
        data = super().to_model()
        data['user_confirm'] = self.user_confirm
        return data

    @classmethod
    def from_model(cls, data: Dict) -> 'ImprovedDocxElements':
        """从字典创建ImprovedDocxElements实例"""
        from ..models import DocumentAnalysis
        return cls(
            elements=data['elements'],
            document_analysis=ModelData(
                model=DocumentAnalysis,
                instance=DocumentAnalysis.objects.get(pk=data['document_analysis']['instance'])
            ),
            user_confirm=data.get('user_confirm', False)
        )

    def get_headings(self) -> List[Dict]:
        """获取文档中的所有标题"""
        return super().get_headings()  # 直接调用父类的get_headings方法   
    

    def format_headings(self) -> str:
        formatted_headings = [
            f"[{elem['position']}], Lvl:{elem['heading_level']}, 标题：{elem['content']}"
            for elem in self.elements
            if  elem.get('is_heading', False)
        ]
        return "\n".join(formatted_headings)
    
    def normalize_heading_levels(self) -> None:
        """
        检查所有标题元素，将heading_level > 4的标题转换为普通元素
        通过移除is_heading和heading_level字段来实现转换
        """
        for element in self.elements:
            if element.get('is_heading', False) and element.get('heading_level', 0) > 4:
                # 移除标题相关字段
                element.pop('is_heading', None)
                element.pop('heading_level', None)
                # 将type设置为paragraph（如果之前不是其他特殊类型）
                if element.get('type') == 'heading':
                    element['type'] = 'paragraph'

@dataclass
class SimpleDocxNode:
    """简化版文档树节点"""
    node_id: int
    content: str
    node_type: str = "content"  # "title" 或 "content"
    level: Optional[int] = None  # 标题级别，非标题节点为None
    content_type: Optional[str] = None  # "paragraph", "table", "image" 等，仅当 node_type 为 "content" 时有值
    children: List['SimpleDocxNode'] = field(default_factory=list)
    parent: Optional['SimpleDocxNode'] = None
    prev_sibling: Optional[int] = None  # 同级前一节点的ID
    next_sibling: Optional[int] = None  # 同级后一节点的ID
    path_sequence: List[int] = field(default_factory=list)  # 从根节点到当前节点的ID路径
    path_titles: str = ""  # 从根节点到当前节点的标题路径，如"第1章 > 第1节"

    def __post_init__(self):
        """初始化后的处理"""
        # 如果是内容节点，但没有指定content_type，则默认为paragraph
        if self.node_type == "content" and self.content_type is None:
            self.content_type = "paragraph"
        # 如果是标题节点，确保content_type为None
        elif self.node_type == "title":
            self.content_type = None

    def __repr__(self):
        """自定义节点的字符串表示"""
        if self.node_type == "title":
            return (f"Node({self.node_id}, "
                    f"'{self.content[:30]}...', "  # 只显示内容的前30个字符
                    f"[{self.node_type}], "
                    f"[Lvl: {self.level}], "
                    f"[{len(self.children)} children])")
        else:
            return (f"Node({self.node_id}, "
                    f"'{self.content[:30]}...', "  # 只显示内容的前30个字符
                    f"[{self.content_type}])")

@dataclass
class DocxTree:
    """文档树结构"""
    root: SimpleDocxNode
    document_analysis: ModelData[DocumentAnalysis]
    _ordered_nodes: List[SimpleDocxNode] = field(default_factory=list)





    # -------- 存储到数据库的方法 --------
    def to_model(self) -> Dict:
        """将文档树转换为可序列化的字典"""
        return {
            'root': self._node_to_dict(self.root),
            'document_analysis': {
                'model': 'DocumentAnalysis',
                'instance': self.document_analysis.instance.pk
            },
            'ordered_nodes': [node.node_id for node in self._ordered_nodes]  # 只存储节点ID的顺序
        }

    def _node_to_dict(self, node: SimpleDocxNode) -> Dict:
        """将节点转换为字典（内部辅助方法）"""
        result = {
            'node_id': node.node_id,
            'content': node.content,
            'node_type': node.node_type,
            'level': node.level,
            'children': [self._node_to_dict(child) for child in node.children],
            'prev_sibling': node.prev_sibling,
            'next_sibling': node.next_sibling,
            'path_sequence': node.path_sequence,
            'path_titles': node.path_titles
        }
        # 只有当node_type为content时才添加content_type字段
        if node.node_type == "content":
            result['content_type'] = node.content_type
        return result

    # -------- 从数据库提取的方法 --------
    @classmethod
    def from_model(cls, data: Dict) -> 'DocxTree':
        """从字典创建DocTree实例"""
        from ..models import DocumentAnalysis
        
        # 创建树实例
        tree = cls(
            root=cls._dict_to_node(data['root']),
            document_analysis=ModelData(
                model=DocumentAnalysis,
                instance=DocumentAnalysis.objects.get(pk=data['document_analysis']['instance'])
            )
        )
        
        # 如果存在ordered_nodes数据，重建有序节点列表
        if 'ordered_nodes' in data:
            # 创建node_id到节点的映射
            node_map = {}
            def build_node_map(node: SimpleDocxNode):
                node_map[node.node_id] = node
                for child in node.children:
                    build_node_map(child)
            
            build_node_map(tree.root)
            
            # 按存储的顺序重建_ordered_nodes
            tree._ordered_nodes = [
                node_map[node_id] 
                for node_id in data['ordered_nodes']
                if node_id in node_map
            ]
        else:
            # 如果没有存储的顺序数据，重新构建
            tree._build_ordered_nodes()
        
        return tree

    @staticmethod
    def _dict_to_node(data: Dict) -> SimpleDocxNode:
        """从字典创建节点（内部辅助方法）"""
        node = SimpleDocxNode(
            node_id=data['node_id'],
            content=data['content'],
            node_type=data['node_type'],
            level=data['level'],
            content_type=data.get('content_type') if data['node_type'] == "content" else None,
            prev_sibling=data['prev_sibling'],
            next_sibling=data['next_sibling'],
            path_sequence=data['path_sequence'],
            path_titles=data['path_titles']
        )
        
        # 递归创建子节点
        node.children = [DocxTree._dict_to_node(child_data) for child_data in data['children']]
        
        # 设置子节点的parent引用
        for child in node.children:
            child.parent = node
            
        return node

    # -------- 以string的方式提取全部文档内容 --------
    def format_for_llm(self) -> str:
        """
        将文档树格式化为适合大模型理解的文本格式
        返回格式示例：
        1. 第1章 [标题]
            1.1 第1节 [标题]
                - 段落1 [段落内容]
                - 表格1 [表格内容]
            1.2 第2节 [标题]
        """
        return self._format_node(self.root, level=1)

    def _format_node(self, node: SimpleDocxNode, level: int) -> str:
        """递归格式化单个节点"""
        result = []
        indent = "    " * (level - 1)
        
        # 添加当前节点
        if node.node_type == "title":
            #prefix = ".".join(str(i) for i in node.path_sequence[:level])
            #result.append(f"{indent}{prefix}【标题 {node.level}级】: {node.content}")
            result.append(f"【标题 {node.level}级】: {node.content}")
        else:
            # 对于非标题节点，简化标记
            if node.content_type == "table":
                result.append(f"{indent}【表格】: 内容隐藏")
            elif node.content_type == "figure":
                result.append(f"{indent}【图】: 内容隐藏")
            elif node.content_type == "toc":
                result.append(f"{indent}【目录】: {node.content}")
            else:  # paragraph
                result.append(f"{indent}{node.content[:50]}")
        
        # 递归处理子节点
        for child in node.children:
            result.append(self._format_node(child, level + 1))
        
        return "\n".join(result)


    #查找节点的方法
    def find_node(self, node_id: Optional[int] = None, content: Optional[str] = None) -> Optional[SimpleDocxNode]:
        """通过节点ID或内容查找节点
        
        Args:
            node_id: 要查找的节点ID
            content: 要查找的节点内容（精确匹配）
        
        Returns:
            找到的节点，如果未找到则返回None
        
        Raises:
            ValueError: 如果未提供任何查找条件
        """
        if node_id is None and content is None:
            raise ValueError("必须提供 node_id 或 content 作为查找条件")

        def _search(node: SimpleDocxNode) -> Optional[SimpleDocxNode]:
            # 检查当前节点是否匹配
            if (node_id is not None and node.node_id == node_id) or \
               (content is not None and node.content == content):
                return node
            
            # 递归搜索子节点
            for child in node.children:
                if found := _search(child):
                    return found
            
            return None

        return _search(self.root)

    # 打印文档树结构
    def print_tree(self, node_id: Optional[int] = None, indent: int = 0) -> None:
        """递归打印文档树结构
        
        Args:
            node_id: 要打印的起始节点ID，默认为根节点
            indent: 当前缩进级别，默认为0
        """
        # 确定起始节点
        if node_id is None:
            node = self.root
        else:
            node = next((n for n in self._ordered_nodes if n.node_id == node_id), None)
            if node is None:
                raise ValueError(f"Node with id {node_id} not found")
        
        # 计算缩进空格
        indent_str = "    " * indent
        
        # 打印当前节点
        print(f"{indent_str}{node}")
        
        # 递归打印所有子节点
        for child in node.children:
            self.print_tree(child.node_id, indent + 1)


    # -------- 插入标题节点, 并重建树结构 --------

    def add_title_node(self, content: str, level: int, after_node_id: int) -> SimpleDocxNode:
        """
        添加一个新的标题节点到文档树中
        
        Args:
            content: 标题内容
            level: 标题级别
            after_node_id: 在此节点之后插入新标题节点
            
        Returns:
            新创建的标题节点
            
        Raises:
            ValueError: 如果after_node_id不存在于树中
        """
        # 在_ordered_nodes中查找after_node_id的位置
        insert_position = None
        for i, node in enumerate(self._ordered_nodes):
            if node.node_id == after_node_id:
                insert_position = i + 1  # 在找到的节点后插入
                break
                
        if insert_position is None:
            raise ValueError(f"Node with id {after_node_id} not found in the tree")
        
        # 生成新的node_id (使用时间戳确保唯一性)
        new_node_id = int(datetime.now().timestamp())
        
        # 创建新的标题节点
        new_node = SimpleDocxNode(
            node_id=new_node_id,
            content=content,
            node_type="title",
            level=level,
            path_sequence=[],  # 临时空值，重建树时会更新
            path_titles=""     # 临时空值，重建树时会更新
        )
        
        # 插入到_ordered_nodes的计算出的位置
        self._ordered_nodes.insert(insert_position, new_node)
        
        # 重建树结构
        self._rebuild_tree_from_ordered_nodes()
        
        return new_node
    
    def _rebuild_tree_from_ordered_nodes(self) -> None:
        """
        根据_ordered_nodes重新构建树结构
        使用与from_docx_elements相同的逻辑
        """
        # 重置所有节点的关系字段，但不包括根节点
        for node in self._ordered_nodes:
            node.parent = None
            node.children = []
            node.prev_sibling = None
            node.next_sibling = None
            node.path_sequence = []
            node.path_titles = ""
        
        # 重置根节点的子节点
        self.root.children = []
        self.root.path_sequence = [0]
        self.root.path_titles = ""
        
        # 用于跟踪当前标题级别的节点
        current_levels = {0: self.root}  # level -> node
        last_level = 0
        
        # 确保根节点不在_ordered_nodes中
        if self._ordered_nodes and self._ordered_nodes[0].node_id == self.root.node_id:
            self._ordered_nodes = self._ordered_nodes[1:]
        
        for node in self._ordered_nodes:
            if node.node_type == "title":
                # 处理标题节点
                parent_level = max(l for l in current_levels.keys() if l < node.level)
                parent = current_levels[parent_level]
                
                # 设置兄弟节点关系
                if parent.children:
                    prev_node = parent.children[-1]
                    node.prev_sibling = prev_node.node_id
                    prev_node.next_sibling = node.node_id
                else:
                    node.prev_sibling = None
                node.next_sibling = None
                
                # 更新节点关系
                node.parent = parent
                parent.children.append(node)
                
                # 更新当前级别节点
                current_levels[node.level] = node
                # 移除所有更高级别的节点
                levels_to_remove = [l for l in current_levels.keys() if l > node.level]
                for l in sorted(levels_to_remove, reverse=True):
                    current_levels.pop(l)
                
                last_level = node.level
                
                # 更新路径信息
                node.path_sequence = parent.path_sequence + [node.node_id]
                node.path_titles = (parent.path_titles + " > " + node.content).strip(" > ")
            else:
                # 处理内容节点
                parent = current_levels[last_level]
                
                # 设置兄弟节点关系
                if parent.children:
                    prev_node = parent.children[-1]
                    node.prev_sibling = prev_node.node_id
                    prev_node.next_sibling = node.node_id
                else:
                    node.prev_sibling = None
                node.next_sibling = None
                
                # 更新节点关系
                node.parent = parent
                parent.children.append(node)
                
                # 更新路径信息
                node.path_sequence = parent.path_sequence + [node.node_id]
                node.path_titles = parent.path_titles

    def convert_to_title_node(self, node_id: int, level: int) -> None:
        """将一个非标题节点转换为标题节点
        
        Args:
            node_id (int): 要转换的节点ID
            level (int): 目标标题级别
        """
        # 在_ordered_nodes中查找对应节点
        target_node = next((node for node in self._ordered_nodes if node.node_id == node_id), None)
        
        if target_node is None:
            raise ValueError(f"Node with id {node_id} not found")
        
        # 更新节点属性
        target_node.node_type = "title"
        target_node.level = level
        target_node.content_type = None  # 标题节点的content_type应为None
        
        # 重建树结构
        self._rebuild_tree_from_ordered_nodes()

    # -------- 添加章节前言标题 --------

    def add_introduction_titles(self) -> None:
        """
        识别父标题和第一个子标题之间的前言内容，为其添加"前言文本"子标题。
        这个方法会遍历所有标题节点，检查是否存在前言内容，如果存在则添加相应的子标题。
        """
        def has_content_before_first_title(node: SimpleDocxNode) -> bool:
            """检查是否有内容节点在第一个标题节点之前"""
            first_title_index = next(
                (i for i, child in enumerate(node.children) 
                 if child.node_type == "title"), 
                len(node.children)
            )
            return any(
                child.node_type == "content" 
                for child in node.children[:first_title_index]
            )

        # 收集需要添加前言的节点
        nodes_to_process = []
        def collect_nodes(node: SimpleDocxNode) -> None:
            if node.node_type == "title":
                # 检查是否有子标题且在第一个子标题前有内容
                has_title_children = any(child.node_type == "title" for child in node.children)
                
                if has_title_children and has_content_before_first_title(node):
                    nodes_to_process.append(node)
                
                # 递归处理子标题
                for child in node.children:
                    if child.node_type == "title":
                        collect_nodes(child)
        
        # 从root的子节点开始处理
        for child in self.root.children:
            collect_nodes(child)

        # 然后按顺序处理每个节点
        for node in nodes_to_process:
            self.add_title_node(
                content=f"前言",
                level=node.level + 1,
                after_node_id=node.node_id
            )


    # -------- 以string的方式提取标题 --------
    def format_titles(self) -> str:
        """
        格式化所有标题节点，返回层级结构清晰的标题列表，包含每个章节的token数量
        返回格式示例：
        1. 第1章 [1级] [ID:46] [Tokens:1500]
            1.1 第1节 [2级] [ID:125] [Tokens:800]
            1.2 第2节 [2级] [ID:130] [Tokens:700]
        2. 第2章 [1级] [ID:95] [Tokens:2000]
            2.1 第1节 [2级] [ID:159] [Tokens:1200]
                2.1.1 第1小节 [3级] [ID:175] [Tokens:800]
        """
        return self._format_titles_recursive(self.root, level=1)

    def _format_titles_recursive(self, node: SimpleDocxNode, level: int) -> str:
        """递归格式化标题节点，包含token计算"""
        result = []
        indent = "    " * (level - 1)
        
        # 如果是标题节点，则格式化并计算tokens
        if node.node_type == "title":
            # 计算当前节点及其所有子节点的总token数
            total_tokens = self._calculate_section_tokens(node)
            result.append(f"{indent}{node.content} [Level:{node.level}] [ID:{node.node_id}] [Tokens:{total_tokens}]")
        
        # 递归处理子节点，只处理标题节点
        for child in node.children:
            if child.node_type == "title":
                result.append(self._format_titles_recursive(child, level + 1))
        
        return "\n".join(result)

    def _calculate_section_tokens(self, node: SimpleDocxNode) -> int:
        """计算一个章节（包括其所有子内容）的总token数"""
        total_tokens = count_tokens(node.content)  # 计算当前节点内容的tokens
        
        # 递归计算所有子节点的tokens
        for child in node.children:
            # 如果是内容节点，直接计算其tokens
            if child.node_type == "content":
                total_tokens += count_tokens(child.content)
            # 如果是标题节点，递归计算其所有内容
            else:
                total_tokens += self._calculate_section_tokens(child)
                
        return total_tokens

    # -------- 以JSON格式提取标题 --------
    def titles_to_json(self) -> Dict:
        """将文档树中的标题节点转换为JSON格式
        
        Returns:
            Dict: 包含标题结构的字典，格式如：
            {
                "titles": [
                    {
                        "content": "第一章 绪论",
                        "level": 1,
                        "node_id": 46,
                        "children": [...]
                    },
                    ...
                ]
            }
        """
        def _process_node(node: SimpleDocxNode) -> Optional[Dict]:
            if node.node_type != "title":
                return None
            
            return {
                "content": node.content,
                "level": node.level,
                "node_id": node.node_id,
                "children": [
                    child_data for child in node.children
                    if (child_data := _process_node(child)) is not None
                ]
            }
        
        return {
            "titles": [
                child_data for child in self.root.children
                if (child_data := _process_node(child)) is not None
            ]
        }


    # -------- 获取所有叶标题节点 --------
    def get_leaf_titles(self) -> List[SimpleDocxNode]:
        """获取所有叶标题节点（没有子标题的标题节点）
        
        Returns:
            List[SimpleDocxNode]: 叶标题节点列表
        """
        leaf_titles = []
        
        def _find_leaf_titles(node: SimpleDocxNode):
            if node.node_type == "title":
                # 检查是否有子标题
                has_title_children = any(
                    child.node_type == "title" 
                    for child in node.children
                )
                if not has_title_children:
                    leaf_titles.append(node)
            
            # 递归检查所有子节点
            for child in node.children:
                _find_leaf_titles(child)
        
        _find_leaf_titles(self.root)
        return leaf_titles

    def format_leaf_titles(self) -> List[Dict]:
        """格式化所有叶标题节点为字典列表
        
        Returns:
            List[Dict]: 叶标题列表，每个字典包含 ID、Title、Level、Tokens 信息
            示例：
            [
                {
                    "ID": 175,
                    "Title": "1.1.1 引言",
                    "Level": 3,
                    "Tokens": 800,
                    "Path": "第1章 > 第1节 > 第1小节"
                },
                ...
            ]
        """
        leaf_titles = self.get_leaf_titles()
        formatted_titles = []
        
        for node in leaf_titles:
            # 计算该节点下内容的token数
            total_tokens = self._calculate_section_tokens(node)
            # 构建字典
            formatted_titles.append({
                "ID": node.node_id,
                "Title": node.content,
                "Level": node.level,
                "Tokens": total_tokens,
                "Path": node.path_titles
            })
        
        return formatted_titles

    def format_leaf_node_content_markdown(self, node: SimpleDocxNode) -> str:
        """格式化叶节点的章节内容
        
        Args:
            node (SimpleDocxNode): 要格式化的叶节点
            
        Returns:
            str: 格式化后的内容字符串，包含标题、路径和内容
            
        Raises:
            ValueError: 如果输入节点不是标题节点
        """
        if node.node_type != "title":
            raise ValueError("Input node must be a title node")
            
        # 构建输出字符串
        output = []
        # 第一行：章节标题，[层级]，[ID]
        output.append(f"{'#' * node.level} {node.content} [Level:{node.level}] [ID:{node.node_id}]")
        
        # 第二行：章节路径
        output.append(f"Path: {node.path_titles}")
    
        # 收集该标题下的所有内容
        content_parts = []
        content_parts.append(f"---")

        for child in node.children:
            if child.node_type == "content":
                if child.content_type == "table":
                    content_parts.append("[表格内容]")
                elif child.content_type == "figure":
                    content_parts.append("[图片内容]")
                else:  # paragraph or other text content
                    content_parts.append(f"{child.content} [ID:{child.node_id}]")
        
        # 添加内容（如果有）
        if content_parts:
            output.append("\n".join(content_parts))
        else:
            output.append("[无内容]")
            
        return "\n".join(output)

    def format_leaf_node_content_html(self, node: SimpleDocxNode) -> str:
        """格式化叶节点的章节内容
        
        Args:
            node (SimpleDocxNode): 要格式化的叶节点
            
        Returns:
            str: 格式化后的内容字符串，包含标题、路径和内容
            
        Raises:
            ValueError: 如果输入节点不是标题节点
        """
        if node.node_type != "title":
            raise ValueError("Input node must be a title node")
            
        # 构建输出字符串
        output = []
        # 第一行：章节标题，[层级]，[ID]
        output.append(f'<h{node.level}>{node.content}[ID:{node.node_id}]</h{node.level}>')
        
        # 第二行：章节路径
        output.append(f'<path> {node.path_titles}</path>')
    
        # 收集该标题下的所有内容
        content_parts = []
        content_parts.append(f"<hr/>")  # 使用HTML分隔线

        for child in node.children:
            if child.node_type == "content":
                if child.content_type == "table":
                    content_parts.append('<table>[表格内容]</table>')
                elif child.content_type == "figure":
                    content_parts.append('<figure>[图片内容]</figure>')
                else:  # paragraph or other text content
                    content_parts.append(f'<p>{child.content} [ID:{child.node_id}]</p>')
        
        # 添加内容（如果有）
        if content_parts:
            output.append("\n".join(content_parts))
        else:
            output.append('<div class="content empty">[无内容]</div>')
            
        return "\n".join(output)

@dataclass
class DocxTreeMoreTitles:
    document_analysis: ModelData[DocumentAnalysis]
    analysis_result: BatchResult  # 存储完整的大模型分析结果
    user_confirm: bool = False

    def to_model(self) -> Dict:
        """将DocxTreeMoreTitles转换为可序列化的字典"""
        return {
            'document_analysis': {
                'model': 'DocumentAnalysis',
                'instance': self.document_analysis.instance.pk
            },
            'analysis_result': {
                'result': {
                    'titles_to_detail': [
                        {
                            'ID': title['ID'],
                            'level': title['level'],
                            'occurrences': title['occurrences'],
                            'probability': title['probability'],
                            'repeat_index': title['repeat_index'],
                            'title': title['title'],
                            'user_confirm': title['user_confirm']
                        }
                        for title in self.analysis_result.result.get('titles_to_detail', [])
                    ]
                },
                'success': self.analysis_result.success,
                'error': str(self.analysis_result.error) if self.analysis_result.error else None,
                'request_index': self.analysis_result.request_index,
                'approach': self.analysis_result.approach,
                'task_id': self.analysis_result.task_id,
                'probability': self.analysis_result.probability,
                'repeat_index': self.analysis_result.repeat_index,
            },
            'user_confirm': self.user_confirm
        }

    @classmethod
    def from_model(cls, data: Dict) -> 'DocxTreeMoreTitles':
        """从字典创建DocxTreeMoreTitles实例"""
        from ..models import DocumentAnalysis
        
        # 重建 BatchResult
        analysis_result = BatchResult(
            result={
                'titles_to_detail': [
                    {
                        'ID': title['ID'],
                        'level': title['level'],
                        'occurrences': title['occurrences'],
                        'probability': title['probability'],
                        'repeat_index': title['repeat_index'],
                        'title': title['title'],
                        'user_confirm': title['user_confirm']
                    }
                    for title in data['analysis_result']['result'].get('titles_to_detail', [])
                ]
            },
            success=data['analysis_result']['success'],
            error=Exception(data['analysis_result']['error']) if data['analysis_result']['error'] else None,
            request_index=data['analysis_result']['request_index'],
            approach=data['analysis_result']['approach'],
            task_id=data['analysis_result']['task_id'],
            probability=data['analysis_result']['probability'],
            repeat_index=data['analysis_result']['repeat_index'],
        )

        return cls(
            document_analysis=ModelData(
                model=DocumentAnalysis,
                instance=DocumentAnalysis.objects.get(pk=data['document_analysis']['instance'])
            ),
            analysis_result=analysis_result,
            user_confirm=data.get('user_confirm', False)
        )

    @staticmethod
    def get_prompt_specification() -> str:
        return """
请按以下JSON格式输出分析结果：
{
    "titles_to_detail": [
        {
            "title": "标题内容",
            "ID": "标题ID",
            "level": "标题层级"
        }
    ]
}
"""












    

