import re

class DocumentOutlineAnalyzer:
    """文档大纲分析器，用于比较和分析文档的目录(TOC)和大纲(Outline)结构"""

    @staticmethod
    def clean_text(text):
        """清理文本，移除多余空格和特殊字符"""
        # 移除所有标点符号和特殊字符，保留字母、数字和中文
        text = re.sub(r'[^\w\s\u4e00-\u9fff]', '', text)
        # 将多个空格替换为单个空格并去除首尾空格
        return ' '.join(text.split()).lower()

    def __init__(self, elements):
        """
        初始化分析器
        
        Args:
            elements (list): 元素列表
        """
        self.toc_elements = [elem for elem in elements if elem['is_toc'] == True]
        self.outline_elements = [elem for elem in elements if elem['is_heading'] == True]

    def analyze_level_differences(self, matching_elements):
        """分析匹配元素的层级差异"""
        differences = []
        
        for match in matching_elements:
            toc_elem = match['toc_element']
            outline_elem = match['outline_element']
            
            # 获取层级信息，如果不存在则标记为None
            toc_level = toc_elem['toc_info']['toc_level']
            outline_level = outline_elem['heading_level']
            
            if toc_level != outline_level:
                differences.append({
                    'content': toc_elem['content'],
                    'toc_level': toc_level,
                    'outline_level': outline_level,
                    'toc_element': toc_elem,
                'outline_element': outline_elem
            })
        
        return differences

    def compare_toc_and_outline(self):
        """比较目录和大纲结构"""
        # 创建清理后文本到原始元素的映射
        toc_map = {self.clean_text(elem['content']): elem for elem in self.toc_elements}
        outline_map = {self.clean_text(elem['content']): elem for elem in self.outline_elements}
        
        # 1. TOC和Outline都有的元素
        matching_elements = []
        # 2. 只在TOC中有的元素
        toc_only_elements = []
        # 3. 只在Outline中有的元素
        outline_only_elements = []
        
        # 找出匹配的和只在TOC中有的
        for cleaned_toc, toc_elem in toc_map.items():
            if cleaned_toc in outline_map:
                matching_elements.append({
                    'toc_element': toc_elem,
                    'outline_element': outline_map[cleaned_toc]
                })
            else:
                toc_only_elements.append(toc_elem)
        
        # 找出只在Outline中有的
        for cleaned_outline, outline_elem in outline_map.items():
            if cleaned_outline not in toc_map:
                outline_only_elements.append(outline_elem)
        
        # 分析匹配元素的层级差异
        level_differences = self.analyze_level_differences(matching_elements)
        
        return {
            'matching': matching_elements,
            'toc_only': toc_only_elements,
            'outline_only': outline_only_elements,
            'level_differences': level_differences
        }
    
    def outline_suggestions(self, results):
        """
        根据TOC和Outline的差异，生成Outline的建议
        """
        # 0. matching_elements 不需要做任何事情，也无需展示

        # 1. 针对TOC_only的元素，建议找到对应正文元素，改为Outline标题
        suggestions = []
        for elem in results['toc_only']:
            suggestions.append({
                'type': 'toc_only',
                'sequence_number': elem['sequence_number'],
                'content': elem['content'],
                'suggestion': f"建议找到对应正文元素，改为Outline标题",
                'confirmed': False
            })
        
        # 2. 针对outline_only的元素，建议该元素改为正文内容
        for elem in results['outline_only']:
            suggestions.append({
                'type': 'outline_only',
                'sequence_number': elem['sequence_number'],
                'content': elem['content'],
                'suggestion': f"建议该元素改为正文内容",
                'confirmed': False
            })
        # 3. 针对level_differences的元素，建议outline的层级改为TOC的层级
        if results['level_differences']:
            for diff in results['level_differences']: 
                suggestions.append({
                    'type': 'level_difference',
                    'sequence_number': diff['outline_element']['sequence_number'],
                    'content': diff['outline_element']['content'],
                    'toc_level': diff['toc_level'],
                    'outline_level': diff['outline_level'],
                    'suggestion': f"建议outline的层级改为TOC的层级",
                    'confirmed': False
                })
        return suggestions

    def correct_outline(self, elements, confirmed_suggestions):
        """
        根据已确认的建议修正文档大纲
        
        Args:
            elements (list): 原始文档元素列表
            confirmed_suggestions (list): 已确认的建议列表
        
        Returns:
            list: 修正后的文档元素列表
        """
        # 创建元素副本以避免修改原始数据
        corrected_elements = elements.copy()
        
        for suggestion in confirmed_suggestions:
            if not suggestion.get('confirmed', False):
                continue
            
            if suggestion['type'] == 'toc_only':
                # 在正文中查找匹配的内容
                cleaned_suggestion_content = self.clean_text(suggestion['content'])
                target_elem = next(
                    (elem for elem in corrected_elements 
                     if self.clean_text(elem['content']) == cleaned_suggestion_content
                     and not elem.get('is_toc', False)),  # 确保不是TOC元素
                    None
                )
            else:
                # 对于其他类型的建议，使用sequence_number查找
                target_elem = next(
                    (elem for elem in corrected_elements 
                     if elem['sequence_number'] == suggestion['sequence_number']),
                    None
                )
            
            if not target_elem:
                continue
                
            # 根据建议类型执行相应修正
            if suggestion['type'] == 'toc_only':
                # 将找到的正文元素转换为大纲标题
                target_elem['is_heading'] = True
                target_elem['heading_level'] = suggestion['toc_level']
                
            elif suggestion['type'] == 'outline_only':
                # 将大纲标题转换为普通正文
                target_elem['is_heading'] = False
                if 'heading_level' in target_elem:
                    del target_elem['heading_level']
                
            elif suggestion['type'] == 'level_difference':
                # 修改大纲标题的层级
                target_elem['heading_level'] = suggestion['toc_level']
        
        return corrected_elements

    def print_analysis_results(self, results):
        """打印分析结果"""
        print("=== 匹配结果分析 ===\n")
        
        print(f"1. TOC和Outline匹配的元素数：{len(results['matching'])}个")
        print("\n层级差异分析：")
        for diff in results['level_differences']:
            print(f"\n标题: {diff['content']}")
            print(f"TOC层级: {diff['toc_level']}")
            print(f"Outline层级: {diff['outline_level']}")
            if diff['level_mismatch']:
                print("⚠️ 层级不匹配")
        
        print(f"\n2. 只在TOC中存在的元素数：{len(results['toc_only'])}个")
        for elem in results['toc_only']:
            print(f"- [{elem.get('level', 'N/A')}] {elem['content']}")
        
        print(f"\n3. 只在Outline中存在的元素数：{len(results['outline_only'])}个")
        for elem in results['outline_only']:
            print(f"- [{elem.get('level', 'N/A')}] {elem['content']}")

        # 打印层级不匹配的情况
        mismatched_levels = [diff for diff in results['level_differences'] if diff['level_mismatch']]
        if mismatched_levels:
            print("\n=== 需要注意的层级不匹配 ===")
            for mismatch in mismatched_levels:
                print(f"\n标题: {mismatch['content']}")
                print(f"TOC层级: {mismatch['toc_level']}")
                print(f"Outline层级: {mismatch['outline_level']}")

