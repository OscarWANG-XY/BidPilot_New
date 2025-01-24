#_02_xml_parser.py

# 模块功能：解析docx文件的XML结构 

# 主要依赖库：
#  - lxml、
#  其他依赖：typing、logging

# 类和函数：
# 1. DocxXMLParser：解析docx文件的XML结构 
    # 定义命名空间  
    # 1.1. __init__：解析XML内容，创建DocxXMLParser实例
    # 1.2. _parse_xml_content：解析XML内容，创建DocxXMLParser实例
    # 1.3. xpath：执行XPath查询，返回匹配的元素列表
    # 1.4. get_elements_by_tag：根据标签名获取元素
    # 1.5. get_element_text：获取元素的文本内容
    # 1.6. get_attribute：获取元素的属性值
    # 1.7. get_structure_tree：获取文档的基础结构树

#使用实例：
#loader = DocxXMLLoader(doc_path)  # 创建DocxXMLLoader 加载器 实例 
#raw_content = loader.extract_raw()  # 加载原始文档内容
#parser = DocxXMLParser(raw_content)  # 创建DocxXMLParser 解析器 实例 

# 更新历史：
# 2024-12-17 创建
# 2024-12-18 更新 弃用ET.ElementTree，使用lxml库




from lxml import etree   #提供强大的XML的解析和查询功能，之后会用到XPath查询功能就来自lxml
from typing import List, Dict, Any, Optional  #提供类型注解和类型检查功能 
from ._00_utils import setup_logger, DocxParserError, DocxContent

logger = setup_logger(__name__)  #设置日志记录器

class DocxXMLParser:
    """DOCX XML基础解析器：处理XML的基础结构和查询"""
    
    NAMESPACES = {
        'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
        'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
        'm': 'http://schemas.openxmlformats.org/officeDocument/2006/math',
        'pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture',
        'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
        'c': 'http://schemas.openxmlformats.org/drawingml/2006/chart',
        'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
        'mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
        'wps': 'http://schemas.microsoft.com/office/word/2010/wordprocessingShape',
        'wpg': 'http://schemas.microsoft.com/office/word/2010/wordprocessingGroup',
        'w14': 'http://schemas.microsoft.com/office/word/2010/wordml',
        'w15': 'http://schemas.microsoft.com/office/word/2012/wordml',
        'v': 'urn:schemas-microsoft-com:vml',
        'o': 'urn:schemas-microsoft-com:office:office',
        'cp': 'http://schemas.openxmlformats.org/package/2006/metadata/core-properties',
        'dc': 'http://purl.org/dc/elements/1.1/',
        'dcterms': 'http://purl.org/dc/terms/',
        'dcmitype': 'http://purl.org/dc/dcmitype/',
        'xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'rel': 'http://schemas.openxmlformats.org/package/2006/relationships'
    }

    def __init__(self, content: DocxContent):
        """
        初始化解析器
        :param content: DocxContent对象，包含原始XML内容
        """
        self.xml_content = self._parse_xml_content(content)
        self.document = self.xml_content.get('document')
        self.styles = self.xml_content.get('styles')
        self.numbering = self.xml_content.get('numbering')
        logger.info("DocxXMLParser initialized successfully")

    def _parse_xml_content(self, content: DocxContent) -> Dict[str, etree._Element]:
        """
        解析XML内容
        :param content: DocxContent对象
        :return: 解析后的XML元素字典
        """
        try:
            xml_content = {}

            # 解析主文档
            xml_content['document'] = etree.fromstring(content.document.encode('utf-8'))
            
            # 解析样式（如果存在）
            if content.styles:
                xml_content['styles'] = etree.fromstring(content.styles.encode('utf-8'))
                
            # 解析编号（如果存在）
            if content.numbering:
                xml_content['numbering'] = etree.fromstring(content.numbering.encode('utf-8'))
            
            logger.info("Successfully parsed XML content")
            return xml_content
            
        except etree.ParseError as e:
            raise DocxParserError(f"XML parsing error: {str(e)}")
        except Exception as e:
            raise DocxParserError(f"Unexpected error during XML parsing: {str(e)}")

    def xpath(self, xpath_expr: str, element: Optional[etree._Element] = None) -> List[etree._Element]:
        """
        执行XPath查询
        :param xpath_expr: XPath表达式
        :param element: 可选的特定元素，如果不指定则在document上查询
        :return: 匹配的元素列表
        """
        # 赋值target （查询对象，从选定元素开始查询，如果为None则从document开始查询）
        target = element if element is not None else self.document
        # 检查target是否存在
        if target is None:
            logger.warning("No target element for XPath query")
            return []
        # 执行XPath查询
        try:
            # 执行XPath()方法，传入xpath_expr和namespaces, 返回匹配的元素列表
            return target.xpath(xpath_expr, namespaces=self.NAMESPACES)
        except etree.XPathError as e:
            logger.error(f"XPath error: {str(e)}")
            return []

    def get_elements_by_tag(self, tag: str, element: Optional[etree._Element] = None) -> List[etree._Element]:
        """
        根据标签名获取元素
        :param tag: 标签名（包含命名空间前缀）
        :param element: 可选的特定元素，如果不指定则在document上查询
        :return: 匹配的元素列表
        """
        xpath_expr = f'.//{tag}'
        return self.xpath(xpath_expr, element) # 返回匹配tag的元素列表 

    def get_element_text(self, element: etree._Element) -> str:
        """
        获取元素的文本内容
        :param element: XML元素
        :return: 元素的文本内容
        """
        if element is None:
            return ""
        # 使用itertext()获取元素文本，使用join()将文本内容连接，使用strip()方法去除首尾空格
        # ''改为' '则， # 输出: 'Hello, world!This is a test.' 变为# 输出: 'Hello, world! This is a test.'
        return ''.join(element.itertext()).strip() 
    

    def get_attribute(self, element: etree._Element, attr_name: str, namespace: str = 'w') -> Optional[str]:
        """
        获取元素的属性值
        :param element: XML元素
        :param attr_name: 属性名
        :param namespace: 命名空间前缀
        :return: 属性值或None
        """
        if element is None:
            return None
        return element.get(f'{{{self.NAMESPACES[namespace]}}}{attr_name}') # 返回属性值或None

    def get_structure_tree(self, max_depth: int = 3, max_children: int = 5) -> Dict[str, Any]:
        """
        获取文档的基础结构树
        :param max_depth: 最大深度
        :param max_children: 每个节点最多显示的子节点数
        :return: 结构树字典
        """
        def _build_tree(element: etree._Element, current_depth: int) -> Dict[str, Any]:
            if element is None or current_depth > max_depth:
                return None
                
            # 获取不带命名空间的标签名
            tag = element.tag.split('}')[-1] if '}' in element.tag else element.tag
            
            # 获取关键属性
            attrs = {}
            for key, value in element.attrib.items():
                attr_name = key.split('}')[-1] if '}' in key else key
                attrs[attr_name] = value
            
            # 构建节点信息
            node = {
                'tag': tag,
                'attributes': attrs if attrs else None
            }
            
            # 处理子节点
            children = list(element)
            if children:
                node['children_count'] = len(children)
                if current_depth < max_depth:
                    node['children'] = [
                        _build_tree(child, current_depth + 1)
                        for child in children[:max_children]
                    ]
                    if len(children) > max_children:
                        node['children'].append({'tag': '...', 'note': f'{len(children) - max_children} more items'})
            
            return node
        
        return {
            'document': _build_tree(self.document, 0) if self.document is not None else None,
            'styles': _build_tree(self.styles, 0) if self.styles is not None else None,
            'numbering': _build_tree(self.numbering, 0) if self.numbering is not None else None
        }

    def element_to_string(self, element: Any) -> str:
        """将XML元素转换为字符串"""
        try:
            return etree.tostring(element, encoding='unicode', pretty_print=True)
        except Exception as e:
            logger.error(f"Error converting element to string: {e}")
            return ""
