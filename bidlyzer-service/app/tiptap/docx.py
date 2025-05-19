import mammoth
import tempfile
import os
import logging
import base64
from .client import TiptapClient

logger = logging.getLogger(__name__)

async def docx_to_html(docx_file, preserve_formatting=True):
    """
    Convert DOCX file to HTML
    
    Args:
        docx_file: Can be a file path, file object or byte content
        preserve_formatting: Whether to preserve original document indentation and format
        
    Returns:
        String containing HTML content
    """
    try:
        # Set conversion options
        options = {}
        if preserve_formatting:
            # Create detailed style mapping to preserve more original formatting
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
                p[style-name='Body Text'] => p.body-text
                p[style-name='Table Text'] => p.table-text
                p[style-name='Title'] => h1.title
            """
            
            # Correctly handle image conversion
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
        
        # Handle different types of input
        if isinstance(docx_file, str):  # File path
            with open(docx_file, 'rb') as f:
                result = mammoth.convert_to_html(f, **options)
        elif hasattr(docx_file, 'read'):  # File object
            result = mammoth.convert_to_html(docx_file, **options)
        else:  # Byte content
            # Create temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as temp:
                temp.write(docx_file)
                temp_path = temp.name
            
            # Process file
            with open(temp_path, 'rb') as f:
                result = mammoth.convert_to_html(f, **options)
            
            # Delete temporary file
            os.unlink(temp_path)
        
        html = result.value
        messages = result.messages  # Warning and error messages
        
        # Filter out common harmless warnings
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
                # Ignore known harmless warnings
                continue
            filtered_messages.append(message)
            logger.warning(f"DOCX conversion warning: {message}")
        
        return html
    except Exception as e:
        logger.error(f"DOCX conversion failed: {str(e)}")
        raise Exception(f"DOCX conversion failed: {str(e)}")

async def docx_to_tiptap_json(docx_file):
    """
    Convert DOCX directly to Tiptap JSON
    
    Args:
        docx_file: Can be a file path, file object or byte content
        
    Returns:
        Tiptap JSON object
    """
    # First convert to HTML
    html = await docx_to_html(docx_file)
    
    # Then use Tiptap service to convert to JSON
    client = TiptapClient()
    result = await client.html_to_json(html)
    
    if isinstance(result, dict) and result.get('success', False):
        return result.get('data')
    return result 