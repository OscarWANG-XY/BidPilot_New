from typing import List, Any
import re
from dataclasses import dataclass
from docx_parser_package.docx_parser._03_element_extractor import ElementType
from doc_structurer_package.doc_strucuturer._01_doc_node_creater import DocumentNode_v1



def is_non_heading_content(text: str) -> bool:
    """
    判断文本是否为非标题内容
    
    Args:
        text: 待判断的文本内容
        
    Returns:
        bool: True 表示确定是正文内容，False 表示可能是标题
    """
    non_heading_patterns =   [
    # 1. 分隔线和装饰线
    r'^\s*[_\-*=~]+\s*$',  # 合并各类分隔线模式
    r'^\s*[░▒▓█■]+\s*$',   # 特殊字符组成的分隔线
    
    # 2. 列表标记
    #r'^\s*[-•∙⚫○●]\s',     # 扩展无序列表标记
    #r'^\s*\d+[\.、]\s',     # 扩展有序列表标记
    #r'^\s*[（(]\d+[)）]\s',  # 扩展带括号的编号
    #r'^\s*[一二三四五六七八九十]+[\.、]\s',  # 中文数字列表
    
    # 3. 引用和代码
    r'^\s*>+\s',           # 多级引用
    r'^\s*```.*$',         # 代码块开始/结束
    r'^[\t ]+(?=\S)',      # 缩进代码块
    
    # 4. 注释和说明
    r'^\s*[注备说][:：]',    # 合并注释类型
    r'^\s*(?:PS|备注|说明|注意|提示|温馨提示)[:：]',
    r'^\s*附(?=[:：]\s*$)',  # 确保只匹配末尾是冒号且后面没有其他内容的情况
    
    # 5. 标记和格式
    r'^\s*<[\w/][^>]*>',   # 更精确的HTML/XML标签
    r'^\s*\[(?!第)[^\]]+\]',  # 方括号标记(排除"[第X章]"这样的标题)
    r'^\s*\{[^\}]+\}',     # 花括号标记
    
    # 6. 非完整句子开头
    r'^[,，.。、；;]',      # 扩展标点符号
    r'^[而但且并又和与或]',  # 扩展连接词
    r'^[的地得之]',         # 常见助词
    
    # 7. 图表附件标记
    r'^\s*(?:图|表|附图|附表)\s*\d+(?:[-.。、]|$)',  # 扩展图表标记
    r'^\s*(?:附件|附录|附表)(?=\s*\d*[:：]\s*$)',  # 确保只匹配末尾是冒号且后面没有其他内容的情况
    
    # 8. 新增：常见非标题格式
    r'^\s*tel[:：]',        # 电话
    r'^\s*(?:联系方式|电话|传真|邮箱|地址)[:：]',
    r'^\s*\d{4}[-/年]\d{1,2}[-/月]\d{1,2}',  # 日期格式
    r'^\s*(?:签[订署]日期|日期)[:：]',
    
    # 9. 新增：特殊符号开头
    r'^[\d１２３４５６７８９０]+$',  # 纯数字行
    r'^[①②③④⑤⑥⑦⑧⑨⑩]',           # 圆圈数字
    
    # 10. MARKDOWN 表格
    r'^\s*\|[\s\|]*[\w\s]+[\s\|]*$',  # Markdown表格行，匹配以|开头，包含文字和|的行
    
    #11. 签字盖章行
    r'(?i)(签字|签名|盖章|签署|单位公章|授权|投标人名称|投标人|承诺方|法定代表人|甲方|乙方|被授权人)[^：:]*[：:]*\s*(\(\s*.*?公章\s*\)|_+|—+|-+|.*?公章.*?|签字|盖章|签署|签名|签字或盖章|\(.*?公章\)|日期\s*[:：]?\s*(.*?|年\s*月\s*日)|负责人|被授权人姓名)',
    r'(?i)^(特此声明！|特此承诺！|致[:：]\s*招标人|投标人[:：]|单位公章[:：]|甲方[:：]|乙方[:：]|电\s*话[:：]|传\s*真[:：]|邮\s*政\s*编\s*码[:：]|详细通讯地址[:：]|职\s*务[:：]|收件人[:：]|手机号码[:：]|地址[:：]|乙方银行账户信息如下[:：]|单位名称[:：]|甲方合同编号[:：]|乙方合同编号[:：]).*$',

    #12. 表格行, 如 | 序号 | 内容、要求 |
    r'^\|.*?\|.*?\|.*?$',

    #13. 过短或过长的内容
    r'.{1,2}$',              # 过短的内容（1-2个字符）
    r'.{50,}$',             # 过长的内容（超过100个字符）
    r'.*?[。？！.].*?[。？！.].*$',

    ]
    
    return any(re.match(pattern, text) for pattern in non_heading_patterns)

class HeadNodePreScreener:
    def __init__(self, doc_nodes: List[DocumentNode_v1]) -> None:
        # 将 doc_nodes 赋值给 self.nodes
        self.nodes = doc_nodes 

    def pre_screen_nodes(self) -> None:
        """对元素进行初筛，标记明显不是标题的内容"""
        
        # 然后进行预筛选
        for node in self.nodes:
            if node.element.is_heading and re.search(r'附件|附录|附表', node.element.content):
                node.enrich_pre_screened_result = "[附件]"
                continue
            elif node.element.is_heading and node.element.heading_level == 1:
                node.enrich_pre_screened_result = "[章]"   # chapter 章
                continue
            elif node.element.is_heading and node.element.heading_level == 2:
                node.enrich_pre_screened_result = "[节]"   # section 节
                continue
            elif node.element.is_heading and node.element.heading_level == 3:
                node.enrich_pre_screened_result = "[小节]"   # subsection 小节
                continue



            if node.element.element_type != ElementType.PARAGRAPH:
                node.enrich_pre_screened_result = "[表/图]"  # table/picture 表/图
                continue

            if node.element.is_toc:
                node.enrich_pre_screened_result = "[目录]"  # toc 目录
                continue
                
            content = node.element.content.strip()
            node.enrich_pre_screened_result = "[正文]" if is_non_heading_content(content) else "[待定]  "
        
