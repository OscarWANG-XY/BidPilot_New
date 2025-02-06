from rest_framework import serializers
from .models import DocumentAnalysis, InvalidStatusTransition
from django.utils import timezone
from apps.files.models import FileRecord
from apps.projects.models import Project
from apps.files.models import FileProjectLink


# 基础序列化器
class DocumentAnalysisBaseSerializer(serializers.ModelSerializer):
    """文档分析基础序列化器"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = DocumentAnalysis
        fields = [
            'id', 
            'title',
            'status',
            'status_display',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['status', 'created_at', 'updated_at']

# 创建用（上传文档）
class DocumentAnalysisCreateSerializer(DocumentAnalysisBaseSerializer):
    """文档分析创建序列化器"""
    project_id = serializers.IntegerField(write_only=True)
    file_record_id = serializers.IntegerField(write_only=True)
    analysis_questions = serializers.ListField(
        child=serializers.CharField(max_length=500),
        write_only=True,
        help_text="需要分析的问题列表，例如：['资质要求', '技术参数']"
    )

    class Meta(DocumentAnalysisBaseSerializer.Meta):
        fields = DocumentAnalysisBaseSerializer.Meta.fields + [
            'project_id',
            'file_record_id',
            'analysis_questions'
        ]

    def validate(self, attrs):
        try:
            # 获取并验证文件记录
            file_record = FileRecord.objects.get(id=attrs['file_record_id'])
            if not file_record.name.lower().endswith('.docx'):
                raise serializers.ValidationError({
                    "file_record_id": "目前仅支持DOCX格式文件"
                })
            
            # 获取并验证项目
            project = Project.objects.get(id=attrs['project_id'])
            
            # 验证文件是否与项目关联
            if not FileProjectLink.objects.filter(
                file_record=file_record,
                project=project,
                is_deleted=False
            ).exists():
                raise serializers.ValidationError({
                    "file_record_id": "文件不属于指定项目"
                })
            
            # 验证分析问题
            if not attrs['analysis_questions']:
                raise serializers.ValidationError({
                    "analysis_questions": "分析问题不能为空"
                })
            
            # 验证文件是否已被分析
            if DocumentAnalysis.objects.filter(
                project=project,
                file_record=file_record
            ).exists():
                raise serializers.ValidationError("该文件已在此项目中进行过分析")
            
            # 保存验证后的对象引用
            attrs['file_record'] = file_record
            attrs['project'] = project
            
            # 添加文件信息
            attrs['file_type'] = 'DOCX'
            attrs['file_size'] = file_record.size
            
        except (FileRecord.DoesNotExist, Project.DoesNotExist) as e:
            raise serializers.ValidationError(str(e))
            
        return attrs

    def create(self, validated_data):
        # 移除ID字段
        project = validated_data.pop('project')
        file_record = validated_data.pop('file_record')
        project_id = validated_data.pop('project_id')
        file_record_id = validated_data.pop('file_record_id')
        
        # 创建分析记录
        return DocumentAnalysis.objects.create(
            project=project,
            file_record=file_record,
            created_by=self.context['request'].user,
            **validated_data
        )

# 分析结果更新用（大模型返回结果）
class AnalysisResultUpdateSerializer(serializers.Serializer):
    """分析结果更新序列化器"""
    question = serializers.CharField(required=True)
    answer = serializers.CharField(required=True)
    context = serializers.ListField(
        child=serializers.CharField(),
        help_text="用于生成答案的文档上下文片段"
    )
    confidence = serializers.FloatField(
        required=False,
        min_value=0,
        max_value=1,
        default=0.8,
        help_text="答案的置信度（0-1）"
    )

    def validate(self, attrs):
        instance = self.instance
        if not instance.can_transition_to(DocumentAnalysis.AnalysisStatus.COMPLETED):
            raise serializers.ValidationError("当前状态不允许更新分析结果")
        return attrs

    def update(self, instance, validated_data):
        if not instance.analysis_result:
            instance.analysis_result = []
        
        instance.analysis_result.append({
            "question": validated_data['question'],
            "answer": validated_data['answer'],
            "context": validated_data['context'],
            "confidence": validated_data.get('confidence', 0.8),
            "timestamp": timezone.now().isoformat()
        })
        instance.save()
        return instance

# 用户确认用
class AnalysisConfirmationSerializer(serializers.Serializer):
    """分析结果确认序列化器"""
    confirmed_answers = serializers.ListField(
        child=serializers.DictField(),
        help_text="需要确认的答案列表（格式：[{question: 'Q1', answer: 'A1', comment: '备注'}]）"
    )
    comment = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        instance = self.instance
        
        # 验证状态
        if not instance.can_transition_to(DocumentAnalysis.AnalysisStatus.CONFIRMED):
            raise serializers.ValidationError("当前状态不允许确认")
        
        # 验证确认的问题是否都存在于原分析结果中
        existing_questions = {item['question'] for item in instance.analysis_result}
        confirming_questions = {answer['question'] for answer in attrs['confirmed_answers']}
        
        invalid_questions = confirming_questions - existing_questions
        if invalid_questions:
            raise serializers.ValidationError(f"问题 {invalid_questions} 不存在于原分析结果中")
        
        # 验证所有问题是否都已确认
        if len(confirming_questions) != len(existing_questions):
            raise serializers.ValidationError("必须确认所有分析问题")
            
        return attrs

    def update(self, instance, validated_data):
        try:
            instance.confirm_analysis(
                user=self.context['request'].user,
                confirmed_results=validated_data['confirmed_answers']
            )
            return instance
        except InvalidStatusTransition as e:
            raise serializers.ValidationError(str(e))

# 前端展示用
class DocumentAnalysisDisplaySerializer(DocumentAnalysisBaseSerializer):
    """文档分析展示序列化器"""
    project = serializers.StringRelatedField()
    file_record = serializers.StringRelatedField()
    created_by = serializers.StringRelatedField()
    confirmed_by = serializers.StringRelatedField()
    processing_time_display = serializers.SerializerMethodField()
    analysis_result = serializers.SerializerMethodField()

    class Meta(DocumentAnalysisBaseSerializer.Meta):
        fields = DocumentAnalysisBaseSerializer.Meta.fields + [
            'project',
            'file_record',
            'file_type',
            'file_size',
            'processing_time_display',
            'analysis_result',
            'created_by',
            'confirmed_by',
            'confirmed_at',
            'error_message'
        ]

    def get_processing_time_display(self, obj):
        """格式化处理时间"""
        if obj.processing_time:
            seconds = obj.processing_time.total_seconds()
            return f"{seconds:.2f}秒"
        return None

    def get_analysis_result(self, obj):
        """格式化分析结果供前端展示"""
        if not obj.analysis_result:
            return []
            
        return [
            {
                "question": item['question'],
                "raw_answer": item['answer'],
                "confirmed_answer": item.get('confirmed_answer'),
                "confidence": item.get('confidence', 0.8),
                "context_snippets": item.get('context', []),
                "confirmation_info": item.get('confirmation'),
            }
            for item in obj.analysis_result
        ]
