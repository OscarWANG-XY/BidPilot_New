import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

class Project(models.Model):
    # id 是通过Django创建的默认自增主键，效率会比UUID高。在项目管理上，bigint的默认自增就够了。 
    # 除非，我们要在分布式系统中生成唯一ID， 要隐藏记录总数，要防止ID被猜测。 比如用户认证场景。

    # 项目状态选项
    class ProjectStage(models.TextChoices):
        DRAFT = 'DRAFT', '草稿'
        ANALYZING = 'ANALYZING', '分析中'
        PENDING_CONFIRM = 'PENDING_CONFIRM', '待确认'
        WRITING = 'WRITING', '编写中'
        REVIEWING = 'REVIEWING', '审核中'
        REVISING = 'REVISING', '修订中'
        COMPLETED = 'COMPLETED', '已完成'
        CANCELLED = 'CANCELLED', '已取消'

    # 项目类型选项（你可能需要根据实际需求调整）
    class ProjectType(models.TextChoices):
        WELFARE = 'WELFARE', '企业福利'
        FSD = 'FSD', '食材配送'
        OTHER = 'OTHER', '其他'

    project_code = models.CharField('项目编号', max_length=100, unique=True, blank=True)
    project_name = models.CharField('项目名称', max_length=200)
    tenderee = models.CharField('招标单位', max_length=200)
    bidder = models.CharField('投标单位', max_length=200)
    project_type = models.CharField(
        '项目类型',
        max_length=20,
        choices=ProjectType.choices,
        default=ProjectType.OTHER
    )
    bid_deadline = models.DateTimeField('投标截止时间')
    current_stage = models.CharField(
        '当前阶段',
        max_length=20,
        choices=ProjectStage.choices,
        default=ProjectStage.DRAFT
    )
    is_urgent = models.BooleanField('是否紧急', default=False)
    creator = models.ForeignKey(    
        settings.AUTH_USER_MODEL,   #指向用户模型的引用
        on_delete=models.PROTECT,
        related_name='created_projects',
        verbose_name='创建者'
    )
    create_time = models.DateTimeField('创建时间', auto_now_add=True)
    last_update_time = models.DateTimeField('最后更新时间', auto_now=True)

    def save(self, *args, **kwargs):
        # 如果这是一个已存在的项目（不是新创建的）
        if self.pk:
            # 获取数据库中当前的状态
            old_instance = Project.objects.get(pk=self.pk)
            # 如果状态发生了变化
            if old_instance.current_stage != self.current_stage:
                # 创建历史记录
                ProjectHistory.objects.create(
                    project=self,
                    from_stage=old_instance.current_stage,
                    to_stage=self.current_stage,
                    remarks=kwargs.pop('remarks', '')  # 如果有备注信息则使用
                )
        
        # 如果是新项目，生成项目编号
        if not self.project_code:
            # 生成格式：BP-年份-类型-4位序号
            year = timezone.now().strftime('%Y')
            # 获取当年的项目数量
            count = Project.objects.filter(
                create_time__year=timezone.now().year
            ).count()
            # 生成项目编号
            self.project_code = f'BP-{year}-{self.project_type}-{str(count + 1).zfill(4)}'
        
        # 调用父类的 save 方法
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = '项目'
        verbose_name_plural = '项目'
        ordering = ['-create_time']

    def __str__(self):
        return f"{self.project_code} - {self.project_name}"


class ProjectHistory(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='stage_histories',
        verbose_name='项目'
    )
    from_stage = models.CharField(
        '原阶段',
        max_length=20,
        choices=Project.ProjectStage.choices
    )
    to_stage = models.CharField(
        '新阶段',
        max_length=20,
        choices=Project.ProjectStage.choices
    )
    operation_time = models.DateTimeField('操作时间', auto_now_add=True)
    remarks = models.TextField('备注', blank=True)

    class Meta:
        verbose_name = '项目阶段历史'
        verbose_name_plural = '项目阶段历史'
        ordering = ['-operation_time']

    def __str__(self):
        return f"{self.project.project_code} - {self.from_stage} -> {self.to_stage}"
