import pytest
import json
from app.clients.tiptap.helpers import TiptapUtils
from conftest import skip_if_no_tiptap

pytestmark = [pytest.mark.tiptap]

class TestTiptapUtils:
    @pytest.fixture
    def sample_doc(self):
        """基本文档结构"""
        return {
            "type": "doc",
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": 1},
                    "content": [{"type": "text", "text": "第一章 标题"}]
                },
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "这是第一段内容"}]
                },
                {
                    "type": "heading",
                    "attrs": {"level": 2},
                    "content": [{"type": "text", "text": "1.1 子标题"}]
                },
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "这是第二段内容"}]
                }
            ]
        }

    @pytest.fixture
    def sample_doc_with_table(self):
        """包含表格的文档结构"""
        return {
            "type": "doc",
            "content": [
                {
                    "type": "table",
                    "content": [
                        {
                            "type": "tableRow",
                            "content": [
                                {
                                    "type": "tableCell",
                                    "content": [{"type": "text", "text": "表头1"}]
                                },
                                {
                                    "type": "tableCell",
                                    "content": [{"type": "text", "text": "表头2"}]
                                }
                            ]
                        },
                        {
                            "type": "tableRow",
                            "content": [
                                {
                                    "type": "tableCell",
                                    "content": [{"type": "text", "text": "内容1"}]
                                },
                                {
                                    "type": "tableCell",
                                    "content": [{"type": "text", "text": "内容2"}]
                                }
                            ]
                        }
                    ]
                }
            ]
        }

    @pytest.mark.tiptap
    @skip_if_no_tiptap
    def test_load_from_string(self):
        """测试从字符串加载文档"""
        # 测试正常JSON
        json_str = '{"type": "doc", "content": []}'
        result = TiptapUtils.load_from_string(json_str)
        assert result == {"type": "doc", "content": []}

        # 测试无效JSON
        with pytest.raises(json.JSONDecodeError):
            TiptapUtils.load_from_string("invalid json")

    @pytest.mark.tiptap
    @skip_if_no_tiptap
    def test_to_string(self):
        """测试文档转字符串"""
        doc = {"type": "doc", "content": []}
        
        # 测试无缩进
        result = TiptapUtils.to_string(doc)
        assert json.loads(result) == doc
        
        # 测试带缩进
        result = TiptapUtils.to_string(doc, indent=2)
        assert json.loads(result) == doc  # 验证 JSON 内容相同
        assert "  " in result  # 验证缩进存在

    @pytest.mark.tiptap
    @skip_if_no_tiptap
    def test_extract_indexed_paragraphs(self, sample_doc):
        """测试提取带索引的段落"""
        paragraphs, index_path_map = TiptapUtils.extract_indexed_paragraphs(sample_doc)
        
        # 验证段落数量
        assert len(paragraphs.split('\n')) == 2  # 两个段落
        
        # 验证内容
        assert "这是第一段内容" in paragraphs
        assert "这是第二段内容" in paragraphs
        
        # 验证索引映射
        assert len(index_path_map) == 2

    @pytest.mark.tiptap
    @skip_if_no_tiptap
    def test_extract_indexed_paragraphs_with_table(self, sample_doc_with_table):
        """测试提取带表格的段落"""
        paragraphs, index_path_map = TiptapUtils.extract_indexed_paragraphs(sample_doc_with_table)
        
        # 验证表格内容
        assert "表头1 | 表头2" in paragraphs
        assert "内容1 | 内容2" in paragraphs

    @pytest.mark.tiptap
    @skip_if_no_tiptap
    def test_extract_indexed_paragraphs_with_max_length(self, sample_doc):
        """测试带最大长度限制的段落提取"""
        max_length = 5
        paragraphs, _ = TiptapUtils.extract_indexed_paragraphs(sample_doc, max_length=max_length)
        
        # 验证内容被截断
        assert "..." in paragraphs
        
        # 获取第一行的内容部分
        first_line = paragraphs.split('\n')[0]
        content_part = first_line.split('content: ')[1].split(' | index:')[0]
        
        # 验证内容长度（不包括省略号）
        assert len(content_part) <= max_length + 3  # +3 for "..."

    @pytest.mark.tiptap
    @skip_if_no_tiptap
    def test_extract_chapters(self, sample_doc):
        """测试章节提取"""
        chapters, index_path_map = TiptapUtils.extract_chapters(sample_doc)
        
        # 验证章节数量
        assert len(chapters) == 2
        
        # 验证章节内容
        assert chapters[0]["title"] == "第一章 标题"
        assert chapters[1]["title"] == "1.1 子标题"
        
        # 验证段落内容
        assert "这是第一段内容" in chapters[0]["paragraphs"]
        assert "这是第二段内容" in chapters[1]["paragraphs"]

    @pytest.mark.tiptap
    @skip_if_no_tiptap
    def test_find_all_headings(self, sample_doc):
        """测试查找所有标题"""
        headings = TiptapUtils.find_all_headings(sample_doc)
        
        # 验证标题数量
        assert len(headings) == 2
        
        # 验证标题内容
        assert headings[0]["title"] == "第一章 标题"
        assert headings[0]["level"] == 1
        assert headings[1]["title"] == "1.1 子标题"
        assert headings[1]["level"] == 2

    @pytest.mark.tiptap
    @skip_if_no_tiptap
    def test_print_headings(self, sample_doc):
        """测试打印标题"""
        result = TiptapUtils.print_headings(sample_doc)
        
        # 验证输出格式
        assert "[H1] 第一章 标题" in result
        assert "[H2] 1.1 子标题" in result
        
        # 测试带缩进
        result_indented = TiptapUtils.print_headings(sample_doc, indent=True)
        assert "  [H2]" in result_indented  # 验证子标题有缩进

    @pytest.mark.tiptap
    @skip_if_no_tiptap
    def test_add_captions_to_nodes(self, sample_doc):
        """测试添加说明信息"""
        captions = [
            {"index": 0, "caption": "第一段说明"},
            {"index": 1, "caption": "第二段说明"}
        ]
        
        # 创建索引路径映射
        _, index_path_map = TiptapUtils.extract_indexed_paragraphs(sample_doc)
        
        # 添加说明
        updated_doc = TiptapUtils.add_captions_to_nodes(sample_doc, captions, index_path_map)
        
        # 验证说明是否添加成功
        paragraphs = updated_doc["content"]
        assert paragraphs[1]["attrs"]["caption"] == "第一段说明"
        assert paragraphs[3]["attrs"]["caption"] == "第二段说明"

    @pytest.mark.tiptap
    @skip_if_no_tiptap
    def test_print_enhanced_toc(self, sample_doc):
        """测试打印增强型目录"""
        # 先添加一些说明
        captions = [{"index": 0, "caption": "段落说明"}]
        _, index_path_map = TiptapUtils.extract_indexed_paragraphs(sample_doc)
        doc_with_captions = TiptapUtils.add_captions_to_nodes(sample_doc, captions, index_path_map)
        
        # 测试打印目录
        result = TiptapUtils.print_enhanced_toc(doc_with_captions)
        
        # 验证输出
        assert "[H1] 第一章 标题" in result
        assert "[H2] 1.1 子标题" in result
        assert "段落说明" in result

    @pytest.mark.tiptap
    @skip_if_no_tiptap
    def test_add_introduction_headings(self, sample_doc):
        """测试添加前言标题"""
        # 创建一个需要添加前言的文档
        doc_without_intro = {
            "type": "doc",
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": 1},
                    "content": [{"type": "text", "text": "第一章"}]
                },
                {
                    "type": "heading",
                    "attrs": {"level": 2},
                    "content": [{"type": "text", "text": "1.1"}]
                }
            ]
        }
        
        # 添加前言
        updated_doc = TiptapUtils.add_introduction_headings(doc_without_intro)
        
        # 验证前言是否添加成功
        assert len(updated_doc["content"]) == 3
        assert updated_doc["content"][1]["type"] == "heading"
        assert updated_doc["content"][1]["content"][0]["text"] == "前言"

    @pytest.mark.tiptap
    @skip_if_no_tiptap
    def test_locate_paragraph_by_index(self, sample_doc):
        """测试通过索引定位段落"""
        # 创建索引路径映射
        _, index_path_map = TiptapUtils.extract_indexed_paragraphs(sample_doc)
        
        # 测试定位段落
        paragraph = TiptapUtils.locate_paragraph_by_index(sample_doc, 0, index_path_map)
        assert paragraph is not None
        assert "这是第一段内容" in TiptapUtils._extract_text_from_node(paragraph)
        
        # 测试无效索引
        paragraph = TiptapUtils.locate_paragraph_by_index(sample_doc, 999, index_path_map)
        assert paragraph is None

    @pytest.mark.tiptap
    @skip_if_no_tiptap
    def test_locate_paragraph_by_path(self, sample_doc):
        """测试通过路径定位段落"""
        # 测试有效路径
        path = [1]  # 第一段内容的路径（索引1对应第二个元素，即段落）
        paragraph = TiptapUtils.locate_paragraph_by_path(sample_doc, path)
        
        # 打印文档结构以便调试
        print("\nDocument structure:")
        print(json.dumps(sample_doc, indent=2, ensure_ascii=False))
        print(f"\nTrying to locate path: {path}")
        
        assert paragraph is not None
        assert "这是第一段内容" in TiptapUtils._extract_text_from_node(paragraph)
        
        # 测试无效路径
        paragraph = TiptapUtils.locate_paragraph_by_path(sample_doc, [999])
        assert paragraph is None 