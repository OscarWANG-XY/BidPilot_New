# agents/document_analysis.py

class DocumentAnalysisAgent:
    """文档分析智能体 - 核心业务逻辑组件"""
    
    def __init__(self, config=None):
        """初始化Agent及其组件"""
        self.config = config or {}
        # 初始化各功能模块
        self.document_processor = self._init_document_processor()
        self.understanding_engine = self._init_understanding_engine()
        self.information_extractor = self._init_information_extractor()
        self.structure_converter = self._init_structure_converter()
        self.output_generator = self._init_output_generator()
        self.evaluator = self._init_self_evaluator()
    
    def _init_document_processor(self):
        """初始化文档处理模块"""
        from .modules.document_processor import DocumentProcessor
        return DocumentProcessor(self.config.get('document_processor', {}))
    
    def _init_understanding_engine(self):
        """初始化理解引擎模块"""
        from .modules.understanding_engine import UnderstandingEngine
        return UnderstandingEngine(self.config.get('understanding_engine', {}))
    
    def _init_information_extractor(self):
        """初始化信息提取模块"""
        from .modules.information_extractor import InformationExtractor
        return InformationExtractor(self.config.get('information_extractor', {}))
    
    def _init_structure_converter(self):
        """初始化结构转换模块"""
        from .modules.structure_converter import StructureConverter
        return StructureConverter(self.config.get('structure_converter', {}))
    
    def _init_output_generator(self):
        """初始化输出生成模块"""
        from .modules.output_generator import OutputGenerator
        return OutputGenerator(self.config.get('output_generator', {}))
    
    def _init_self_evaluator(self):
        """初始化自我评估模块"""
        from .modules.self_evaluator import SelfEvaluator
        return SelfEvaluator(self.config.get('self_evaluator', {}))
    
    # 核心业务方法 - 提供给Celery任务调用
    def process_document(self, document_path, context=None):
        """处理文档并返回结构化结果"""
        try:
            # 进行文档处理
            processed_doc = self.document_processor.process(document_path)
            
            # 返回可序列化的处理结果摘要
            return {
                'status': 'success',
                'document_type': processed_doc.get_document_type(),
                'page_count': processed_doc.get_page_count(),
                'structure': processed_doc.get_structure_summary(),
                'key_sections': processed_doc.get_key_sections(),
                'processing_metadata': processed_doc.get_metadata(),
                # 包含必要的可序列化数据
                'internal_representation': processed_doc.to_serializable_dict()
            }
        except Exception as e:
            return {
                'status': 'error',
                'error_type': type(e).__name__,
                'error_message': str(e),
                'traceback': traceback.format_exc()
            }
    
    def analyze_processed_document(self, processed_doc_data):
        """分析已处理的文档"""
        try:
            # 从序列化数据重建处理后的文档对象
            from .modules.document_processor import ProcessedDocument
            processed_doc = ProcessedDocument.from_dict(processed_doc_data['internal_representation'])
            
            # 执行文档理解分析
            understanding_result = self.understanding_engine.analyze(processed_doc)
            
            # 返回分析结果摘要
            return {
                'status': 'success',
                'document_category': understanding_result.get_category(),
                'domain': understanding_result.get_domain(),
                'key_entities': understanding_result.get_key_entities(),
                'context_understanding': understanding_result.get_context_summary(),
                # 包含可序列化的内部表示
                'internal_representation': understanding_result.to_serializable_dict()
            }
        except Exception as e:
            return {
                'status': 'error',
                'error_type': type(e).__name__,
                'error_message': str(e),
                'traceback': traceback.format_exc()
            }
    
    def extract_information(self, understanding_result_data):
        """从理解结果中提取信息"""
        try:
            # 从序列化数据重建理解结果对象
            from .modules.understanding_engine import UnderstandingResult
            understanding_result = UnderstandingResult.from_dict(
                understanding_result_data['internal_representation']
            )
            
            # 执行信息提取
            extracted_info = self.information_extractor.extract(understanding_result)
            
            # 返回提取结果
            return {
                'status': 'success',
                'basic_info': extracted_info.get_basic_info(),
                'requirements': extracted_info.get_requirements(),
                'scoring_standards': extracted_info.get_scoring_standards(),
                'risk_factors': extracted_info.get_risk_factors(),
                'internal_representation': extracted_info.to_serializable_dict()
            }
        except Exception as e:
            return {
                'status': 'error',
                'error_type': type(e).__name__,
                'error_message': str(e),
                'traceback': traceback.format_exc()
            }
    
    def convert_to_structure(self, extracted_info_data):
        """将提取的信息转换为结构化数据"""
        try:
            # 从序列化数据重建提取信息对象
            from .modules.information_extractor import ExtractedInformation
            extracted_info = ExtractedInformation.from_dict(
                extracted_info_data['internal_representation']
            )
            
            # 执行结构转换
            structured_data = self.structure_converter.convert(extracted_info)
            
            # 返回结构化数据
            return {
                'status': 'success',
                'knowledge_graph': structured_data.get_knowledge_graph(),
                'relationships': structured_data.get_relationships(),
                'standardized_format': structured_data.get_standardized_format(),
                'internal_representation': structured_data.to_serializable_dict()
            }
        except Exception as e:
            return {
                'status': 'error',
                'error_type': type(e).__name__,
                'error_message': str(e),
                'traceback': traceback.format_exc()
            }
    
    def generate_output(self, structured_data_dict):
        """生成最终输出"""
        try:
            # 从序列化数据重建结构化数据对象
            from .modules.structure_converter import StructuredData
            structured_data = StructuredData.from_dict(
                structured_data_dict['internal_representation']
            )
            
            # 生成最终输出
            output = self.output_generator.generate(structured_data)
            
            # 返回输出结果
            return {
                'status': 'success',
                'structured_data': output.get_structured_data(),
                'summary': output.get_summary(),
                'attention_points': output.get_attention_points(),
                'internal_representation': output.to_serializable_dict()
            }
        except Exception as e:
            return {
                'status': 'error',
                'error_type': type(e).__name__,
                'error_message': str(e),
                'traceback': traceback.format_exc()
            }
    
    def evaluate_results(self, analysis_result_dict, original_document_path):
        """评估分析结果"""
        try:
            # 从序列化数据重建分析结果对象
            from .modules.output_generator import AnalysisOutput
            analysis_result = AnalysisOutput.from_dict(
                analysis_result_dict['internal_representation']
            )
            
            # 执行评估
            evaluation = self.evaluator.evaluate(analysis_result, original_document_path)
            
            # 返回评估结果
            return {
                'status': 'success',
                'completeness_score': evaluation.get_completeness_score(),
                'accuracy_score': evaluation.get_accuracy_score(),
                'uncertainty_areas': evaluation.get_uncertainty_areas(),
                'suggestions': evaluation.get_suggestions(),
                'internal_representation': evaluation.to_serializable_dict()
            }
        except Exception as e:
            return {
                'status': 'error',
                'error_type': type(e).__name__,
                'error_message': str(e),
                'traceback': traceback.format_exc()
            }