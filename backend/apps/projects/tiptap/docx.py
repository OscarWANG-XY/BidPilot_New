import mammoth
import tempfile
import os
import logging
import base64

logger = logging.getLogger(__name__)

def docx_to_html(docx_file, preserve_formatting=True):
    """
    将 DOCX 文件转换为 HTML
    
    参数:
        docx_file: 可以是文件路径、文件对象或字节内容
        preserve_formatting: 是否保留原文档的缩进和格式
        
    返回:
        包含HTML内容的字符串
    """
    try:
        # 设置转换选项
        options = {}
        if preserve_formatting:
            # 创建详细的样式映射，保留更多原始格式
            style_map = """
                p[style-name='Normal Indent'] => p.indent
                p[style-name='Heading 1'] => h1:fresh
                p[style-name='Heading 2'] => h2:fresh
                p[style-name='Heading 3'] => h3:fresh
                p[style-name='Heading 4'] => h4:fresh
                p[style-name='Heading 5'] => h5:fresh
                p[style-name='Heading 6'] => h6:fresh
                p[style-name='Quote'] => blockquote:fresh
                p[style-name='Intense Quote'] => blockquote.intense:fresh
                r[style-name='Strong'] => strong
                r[style-name='Emphasis'] => em
                r[style-name='Intense Emphasis'] => em.intense
                r[style-name='Code'] => code
                p[style-name='List Paragraph'] => p.list-paragraph
                table => table.docx-table
                r[style-name='Hyperlink'] => a
                p[style-name='Footnote Text'] => p.footnote-text
                p[style-name='Endnote Text'] => p.endnote-text
                p[style-name='Caption'] => p.caption
                r[style-name='Subtle Emphasis'] => span.subtle-emphasis
                p[style-name='TOC Heading'] => h1.toc-heading
                p[style-name='TOC 1'] => p.toc-1
                p[style-name='TOC 2'] => p.toc-2
                p[style-name='TOC 3'] => p.toc-3
                p[style-name='No Spacing'] => p.no-spacing
                
                /* 添加警告中提到的样式 */
                p[style-name='Body Text'] => p.body-text
                p[style-id='2'] => p.body-text
                p[style-name='Table Text'] => p.table-text
                p[style-id='6'] => p.table-text
            """
            
            # 正确处理图片转换
            def convert_image(image):
                with image.open() as image_bytes:
                    encoded_src = base64.b64encode(image_bytes.read()).decode("ascii")
                    return {
                        "src": f"data:{image.content_type};base64,{encoded_src}",
                        "alt": image.alt_text or "",
                        "class": "docx-image"
                    }
            
            options = {
                "style_map": style_map,
                "include_default_style_map": True,
                "ignore_empty_paragraphs": False,
                "convert_image": mammoth.images.img_element(convert_image)
            }
        
        # 处理不同类型的输入
        if isinstance(docx_file, str):  # 文件路径
            with open(docx_file, 'rb') as f:
                result = mammoth.convert_to_html(f, **options)
        elif hasattr(docx_file, 'read'):  # 文件对象
            result = mammoth.convert_to_html(docx_file, **options)
        else:  # 字节内容
            # 创建临时文件
            with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as temp:
                temp.write(docx_file)
                temp_path = temp.name
            
            # 处理文件
            with open(temp_path, 'rb') as f:
                result = mammoth.convert_to_html(f, **options)
            
            # 删除临时文件
            os.unlink(temp_path)
        
        html = result.value
        messages = result.messages  # 警告和错误消息
        
        # 过滤掉常见的无害警告
        filtered_messages = []
        ignored_warnings = [
            'An unrecognised element was ignored: w:tblPrEx',
            'An unrecognised element was ignored: v:path',
            'An unrecognised element was ignored: v:fill',
            'An unrecognised element was ignored: v:stroke',
            'A v:imagedata element without a relationship ID was ignored',
            'An unrecognised element was ignored: {urn:schemas-microsoft-com:office:office}lock',
            'An unrecognised element was ignored: office-word:anchorlock'
        ]
        
        for message in messages:
            if message.type == 'warning' and message.message in ignored_warnings:
                # 忽略已知的无害警告
                continue
            filtered_messages.append(message)
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