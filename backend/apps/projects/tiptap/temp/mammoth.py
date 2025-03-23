import mammoth
import re
from bs4 import BeautifulSoup
from django.conf import settings
import os
import logging

logger = logging.getLogger(__name__)

class DocxToHtmlConverter:
    """
    A robust DOCX to HTML converter using mammoth with enhanced formatting preservation.
    Focused on producing clean, well-formatted HTML from Word documents.
    """
    
    def __init__(self, custom_styles=None):
        # Default style map for better conversion quality
        self.style_map = """
            p[style-name='Heading 1'] => h1:fresh
            p[style-name='Heading 2'] => h2:fresh
            p[style-name='Heading 3'] => h3:fresh
            p[style-name='Heading 4'] => h4:fresh
            p[style-name='Heading 5'] => h5:fresh
            p[style-name='Heading 6'] => h6:fresh
            p[style-name='Title'] => h1.title:fresh
            p[style-name='Subtitle'] => h2.subtitle:fresh
            r[style-name='Strong'] => strong
            r[style-name='Emphasis'] => em
            p[style-name='Quote'] => blockquote
            r[style-name='Hyperlink'] => a
            p[style-name='List Paragraph'] => ul > li:fresh
            table => table.table
            p[style-name='TOC Heading'] => h2.toc-heading:fresh
        """
        
        # Apply custom style mappings if provided
        if custom_styles:
            self.style_map += "\n" + custom_styles
            
        # Options for mammoth
        self.options = {
            "style_map": self.style_map,
            "convert_image": self._image_handler,
            "include_default_style_map": True
        }
        
    def _image_handler(self, image):
        """
        Custom image handler to properly extract and save images from docx
        """
        try:
            # Get image content and extension
            image_buffer = image.open()
            content_type = image.content_type
            extension = self._get_extension_for_content_type(content_type)
            
            # If you need to save images in a media directory
            # Adjust this path according to your Django settings
            image_dir = os.path.join(settings.MEDIA_ROOT, 'docx_images')
            os.makedirs(image_dir, exist_ok=True)
            
            # Generate a unique filename based on original name or content hash
            filename = f"image_{abs(hash(image_buffer.read()))}{extension}"
            image_buffer.seek(0)  # Reset buffer position
            
            # Save the image
            image_path = os.path.join(image_dir, filename)
            with open(image_path, 'wb') as f:
                f.write(image_buffer.read())
                
            # Return URL for the image
            image_url = f"{settings.MEDIA_URL}docx_images/{filename}"
            return {"src": image_url}
            
        except Exception as e:
            logger.error(f"Error processing image: {e}")
            return {"src": "", "alt": "Image conversion failed"}
    
    def _get_extension_for_content_type(self, content_type):
        """
        Map content type to file extension
        """
        mapping = {
            "image/png": ".png",
            "image/jpeg": ".jpg",
            "image/jpg": ".jpg",
            "image/gif": ".gif",
            "image/svg+xml": ".svg",
            "image/webp": ".webp"
        }
        return mapping.get(content_type, ".png")
    
    def _clean_html(self, html):
        """
        Post-process the HTML to fix common conversion issues
        """
        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # Fix empty paragraphs
            for p in soup.find_all('p'):
                if not p.get_text(strip=True) and not p.find('img'):
                    p.decompose()
            
            # Fix list structure issues
            self._fix_lists(soup)
            
            # Fix table structure
            for table in soup.find_all('table'):
                if not table.find('tbody'):
                    tbody = soup.new_tag('tbody')
                    for child in list(table.children):
                        if child.name == 'tr':
                            tbody.append(child)
                    table.append(tbody)
                
                # Add appropriate classes
                table['class'] = table.get('class', []) + ['table', 'table-bordered']
            
            # Fix image tags
            for img in soup.find_all('img'):
                if not img.get('alt'):
                    img['alt'] = "Image"
                    
            return str(soup)
        except Exception as e:
            logger.error(f"Error cleaning HTML: {e}")
            return html
    
    def _fix_lists(self, soup):
        """Fix nested list structures that may be incorrectly converted"""
        # Find all list items
        list_items = soup.find_all('li')
        
        # Group consecutive list items into proper ul/ol elements
        current_list = None
        for li in list_items:
            if li.parent.name not in ['ul', 'ol']:
                # This list item isn't in a proper list container
                new_list = soup.new_tag('ul')
                li.wrap(new_list)
                current_list = new_list
            else:
                current_list = li.parent
    
    def convert(self, docx_file):
        """
        Convert a docx file to HTML
        
        Args:
            docx_file: File-like object or path to docx file
            
        Returns:
            tuple: (html_content, messages)
                - html_content: Converted HTML content
                - messages: List of warnings or information messages
        """
        try:
            # Run the conversion with mammoth
            result = mammoth.convert_to_html(docx_file, **self.options)
            
            # Post-process the HTML
            html_content = self._clean_html(result.value)
            
            # Log any warnings
            if result.messages:
                for message in result.messages:
                    logger.warning(f"Mammoth conversion warning: {message}")
            
            return html_content, result.messages
            
        except Exception as e:
            logger.error(f"Error converting DOCX to HTML: {e}", exc_info=True)
            return f"<p>Error converting document: {str(e)}</p>", [str(e)]
    
    def convert_to_tiptap(self, docx_file, tiptap_client=None):
        """
        Convert a docx file to TipTap JSON via HTML
        
        Args:
            docx_file: File-like object or path to docx file
            tiptap_client: Optional TiptapClient instance
            
        Returns:
            tuple: (tiptap_json, messages)
        """
        html_content, messages = self.convert(docx_file)
        
        # If no TipTap client provided or HTML conversion failed
        if not tiptap_client or not html_content:
            return None, messages + ["TipTap conversion failed: No client provided or HTML conversion failed"]
        
        try:
            # Convert HTML to TipTap JSON using your existing infrastructure
            result = tiptap_client.html_to_json(html_content)
            if result.get('success'):
                return result.get('data'), messages
            else:
                return None, messages + [f"TipTap conversion failed: {result.get('error')}"]
        except Exception as e:
            logger.error(f"Error converting to TipTap: {e}", exc_info=True)
            return None, messages + [f"TipTap conversion error: {str(e)}"]


# Usage example:
# converter = DocxToHtmlConverter()
# with open('document.docx', 'rb') as docx:
#     html, messages = converter.convert(docx)