docx_parser/
├── _01_xml_loader.py             # XML提取
├── _02_xml_parser.py             # XML解析
├── _03_element_extractor.py      # 元素提取工具
├── _04_structure_builder.py     # 章节结构构建器
├── _05_content_retriever.py     # 章节内容还原与提取
├── _00_utils.py                 # 通用辅助函数
└── notebooks/                 # Jupyter Lab Notebooks
    ├── 01_xml_parsing.ipynb   # XML解析测试
    ├── 02_element_extraction.ipynb  # 元素提取测试
    ├── 03_structure_building.ipynb # 章节结构构建测试
    ├── 04_content_retrieving.ipynb # 内容提取与还原测试
    └── 04_content_retrieving.ipynb # 内容提取与还原测试


职责明确的分工：
ElementExtractor (_03_element_extractor.py):
提取原始元素内容
维护元素顺序
基本属性提取
StructureBuilder (_05_structure_builder.py):
构建章节层级
管理文档结构
添加上下文信息
ContentRetriever (_06_content_retriever.py):
基于结构获取内容
内容重组与导出


数据流：
XML Document
    ↓
ElementExtractor (提取原始元素)
    ↓
StructureBuilder (构建文档结构)
    ↓
ContentRetriever (内容重组与获取)