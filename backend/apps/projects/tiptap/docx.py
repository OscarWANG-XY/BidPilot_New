import mammoth
import tempfile
import os
import logging

logger = logging.getLogger(__name__)

def docx_to_html(docx_file):
    """
    将 DOCX 文件转换为 HTML
    
    参数:
        docx_file: 可以是文件路径、文件对象或字节内容
        
    返回:
        包含HTML内容的字符串
    """
    try:
        # 处理不同类型的输入
        if isinstance(docx_file, str):  # 文件路径
            with open(docx_file, 'rb') as f:
                result = mammoth.convert_to_html(f)
        elif hasattr(docx_file, 'read'):  # 文件对象
            result = mammoth.convert_to_html(docx_file)
        else:  # 字节内容
            # 创建临时文件
            with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as temp:
                temp.write(docx_file)
                temp_path = temp.name
            
            # 处理文件
            with open(temp_path, 'rb') as f:
                result = mammoth.convert_to_html(f)
            
            # 删除临时文件
            os.unlink(temp_path)
        
        html = result.value
        messages = result.messages  # 警告和错误消息
        
        if messages:
            for message in messages:
                logger.warning(f"DOCX转换警告: {message}")
        
        return html
    except Exception as e:
        logger.error(f"DOCX转换失败: {str(e)}")
        raise Exception(f"DOCX转换失败: {str(e)}")

def docx_to_tiptap_json(docx_file):
    """
    直接将 DOCX 转换为 Tiptap JSON
    
    参数:
        docx_file: 可以是文件路径、文件对象或字节内容
        
    返回:
        Tiptap JSON 对象
    """
    from .client import TiptapClient
    
    # 首先转换为 HTML
    html = docx_to_html(docx_file)
    
    # 然后使用 Tiptap 服务转换为 JSON
    client = TiptapClient()
    result = client.html_to_json(html)
    
    if result.get('success'):
        return result.get('data')
    else:
        raise Exception(f"HTML转换为Tiptap JSON失败: {result.get('error', '未知错误')}")