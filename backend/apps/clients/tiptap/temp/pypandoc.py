import pypandoc

def convert_docx_to_html(docx_path, output_html_path=None):
    """
    使用 pypandoc 将 DOCX 转换为 HTML
    :param docx_path: 输入 DOCX 文件路径
    :param output_html_path: 可选，保存 HTML 输出文件路径
    :return: 转换后的 HTML 字符串
    """
    try:
        # 调用 pypandoc 进行转换
        html_content = pypandoc.convert_file(docx_path, 'html', format='docx')

        # 如果指定了输出路径，则保存 HTML 文件
        if output_html_path:
            with open(output_html_path, 'w', encoding='utf-8') as f:
                f.write(html_content)

        return html_content  # 返回 HTML 字符串

    except Exception as e:
        print(f"DOCX 转换失败: {e}")
        return None

# 示例使用
docx_file = "example.docx"  # 你的 DOCX 文件路径
html_file = "output.html"  # 可选：输出 HTML 文件路径

html_result = convert_docx_to_html(docx_file, html_file)

if html_result:
    print("转换成功！HTML 内容已保存到", html_file)
else:
    print("转换失败！")