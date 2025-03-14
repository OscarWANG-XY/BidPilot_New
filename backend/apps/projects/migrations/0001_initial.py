# Generated by Django 5.1.4 on 2025-03-13 16:05

import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='BaseTask',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100, verbose_name='任务名称')),
                ('description', models.TextField(blank=True, verbose_name='描述')),
                ('type', models.CharField(choices=[('UPLOAD_TENDER_FILE', '上传招标文件'), ('DOCX_EXTRACTION_TASK', '提取文档信息'), ('DOCX_TREE_BUILD_TASK', '构建文档树'), ('OTHER', '其他')], default='OTHER', max_length=50, verbose_name='任务类型')),
                ('status', models.CharField(choices=[('PENDING', '待处理'), ('PROCESSING', '处理中'), ('COMPLETED', '已完成'), ('FAILED', '失败'), ('CONFIRMED', '已确认'), ('BLOCKED', '阻塞中')], default='PENDING', max_length=20, verbose_name='状态')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新时间')),
                ('lock_status', models.CharField(choices=[('LOCKED', '锁定'), ('UNLOCKED', '解锁')], default='UNLOCKED', max_length=20, verbose_name='锁定状态')),
            ],
            options={
                'verbose_name': '基础任务',
                'verbose_name_plural': '基础任务',
            },
        ),
        migrations.CreateModel(
            name='DocxExtractionTask',
            fields=[
                ('basetask_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='projects.basetask')),
                ('extracted_elements', models.JSONField(blank=True, help_text='存储从文档中提取的结构化元素', null=True, verbose_name='提取的文档元素')),
                ('outline_analysis_result', models.JSONField(blank=True, help_text='存储大纲分析的结果', null=True, verbose_name='大纲分析结果')),
                ('improved_docx_elements', models.JSONField(blank=True, help_text='存储从经过初步大纲优化的结构化元素', null=True, verbose_name='初步大纲优化后的文档元素')),
            ],
            bases=('projects.basetask',),
        ),
        migrations.CreateModel(
            name='DocxTreeBuildTask',
            fields=[
                ('basetask_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='projects.basetask')),
                ('docxtree', models.JSONField(blank=True, help_text='存储从经过初步大纲优化的结构化元素', null=True, verbose_name='初步大纲优化后的文档元素')),
                ('more_subtitles', models.JSONField(blank=True, help_text='存储从经过初步大纲优化的结构化元素', null=True, verbose_name='更多子标题')),
            ],
            options={
                'verbose_name': '文档树构建任务',
                'verbose_name_plural': '文档树构建任务',
            },
            bases=('projects.basetask',),
        ),
        migrations.CreateModel(
            name='TenderFileUploadTask',
            fields=[
                ('basetask_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='projects.basetask')),
            ],
            bases=('projects.basetask',),
        ),
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('project_name', models.CharField(max_length=200, verbose_name='项目名称')),
                ('tenderee', models.CharField(max_length=200, verbose_name='招标单位')),
                ('bidder', models.CharField(blank=True, default='', max_length=200, verbose_name='投标单位')),
                ('project_type', models.CharField(choices=[('WELFARE', '企业福利'), ('FSD', '食材配送'), ('OTHER', '其他')], default='OTHER', max_length=20, verbose_name='项目类型')),
                ('bid_deadline', models.DateTimeField(blank=True, null=True, verbose_name='投标截止时间')),
                ('status', models.CharField(choices=[('IN_PROGRESS', '进行中'), ('COMPLETED', '已完成'), ('CANCELLED', '已取消')], default='IN_PROGRESS', max_length=20, verbose_name='项目状态')),
                ('is_urgent', models.BooleanField(default=False, verbose_name='是否紧急')),
                ('current_active_stage', models.CharField(choices=[('TENDER_ANALYSIS', '招标文件分析'), ('BID_WRITING', '投标文件编写')], default='TENDER_ANALYSIS', max_length=20, verbose_name='当前活动阶段')),
                ('create_time', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
                ('last_update_time', models.DateTimeField(auto_now=True, verbose_name='最后更新时间')),
                ('creator', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='created_projects', to=settings.AUTH_USER_MODEL, verbose_name='创建者')),
            ],
            options={
                'verbose_name': '项目',
                'verbose_name_plural': '项目',
                'ordering': ['-create_time'],
            },
        ),
        migrations.CreateModel(
            name='ProjectStage',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('stage_type', models.CharField(choices=[('TENDER_ANALYSIS', '招标文件分析'), ('BID_WRITING', '投标文件编写')], max_length=20, verbose_name='阶段类型')),
                ('name', models.CharField(max_length=100, verbose_name='阶段名称')),
                ('stage_status', models.CharField(choices=[('NOT_STARTED', '未开始'), ('IN_PROGRESS', '进行中'), ('COMPLETED', '已完成'), ('BLOCKED', '阻塞中')], default='NOT_STARTED', max_length=20, verbose_name='状态')),
                ('description', models.TextField(blank=True, verbose_name='描述')),
                ('progress', models.IntegerField(default=0, verbose_name='进度')),
                ('remarks', models.TextField(blank=True, verbose_name='备注')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新时间')),
                ('metadata', models.JSONField(blank=True, default=dict, verbose_name='元数据')),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='stages', to='projects.project', verbose_name='项目')),
            ],
            options={
                'verbose_name': '项目阶段',
                'verbose_name_plural': '项目阶段',
            },
        ),
        migrations.AddField(
            model_name='basetask',
            name='stage',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tasks', to='projects.projectstage', verbose_name='所属阶段'),
        ),
        migrations.CreateModel(
            name='StageChangeHistory',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('operation_id', models.UUIDField(db_index=True, default=uuid.uuid4, help_text='同一操作中的多个字段变更共享相同的操作ID', verbose_name='操作ID')),
                ('field_name', models.CharField(max_length=100, verbose_name='变更字段')),
                ('old_value', models.TextField(blank=True, null=True, verbose_name='旧值')),
                ('new_value', models.TextField(blank=True, null=True, verbose_name='新值')),
                ('changed_at', models.DateTimeField(auto_now_add=True, verbose_name='变更时间')),
                ('remarks', models.TextField(blank=True, verbose_name='备注')),
                ('changed_by', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='stage_changes', to=settings.AUTH_USER_MODEL, verbose_name='操作人')),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='stage_change_histories', to='projects.project', verbose_name='项目')),
                ('stage', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='change_histories', to='projects.projectstage', verbose_name='阶段')),
            ],
            options={
                'verbose_name': '阶段变更历史',
                'verbose_name_plural': '阶段变更历史',
                'ordering': ['-changed_at'],
            },
        ),
        migrations.CreateModel(
            name='TaskChangeHistory',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('operation_id', models.UUIDField(db_index=True, default=uuid.uuid4, help_text='同一操作中的多个字段变更共享相同的操作ID', verbose_name='操作ID')),
                ('task_type', models.CharField(choices=[('UPLOAD_TENDER_FILE', '上传招标文件'), ('DOCX_EXTRACTION_TASK', '提取文档信息'), ('DOCX_TREE_BUILD_TASK', '构建文档树'), ('OTHER', '其他')], default='OTHER', max_length=50, verbose_name='任务类型')),
                ('field_name', models.CharField(max_length=100, verbose_name='变更字段')),
                ('old_value', models.TextField(blank=True, null=True, verbose_name='旧值')),
                ('new_value', models.TextField(blank=True, null=True, verbose_name='新值')),
                ('is_complex_field', models.BooleanField(default=False, verbose_name='是否复杂字段')),
                ('change_summary', models.TextField(blank=True, null=True, verbose_name='变更摘要')),
                ('changed_at', models.DateTimeField(auto_now_add=True, verbose_name='变更时间')),
                ('remarks', models.TextField(blank=True, verbose_name='备注')),
                ('changed_by', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='task_changes', to=settings.AUTH_USER_MODEL, verbose_name='操作人')),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='task_change_histories', to='projects.project', verbose_name='项目')),
                ('stage', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='task_change_histories', to='projects.projectstage', verbose_name='阶段')),
                ('task', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='change_histories', to='projects.basetask', verbose_name='任务')),
            ],
            options={
                'verbose_name': '任务变更历史',
                'verbose_name_plural': '任务变更历史',
                'ordering': ['-changed_at'],
            },
        ),
        migrations.CreateModel(
            name='ProjectChangeHistory',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('operation_id', models.UUIDField(db_index=True, default=uuid.uuid4, help_text='同一操作中的多个字段变更共享相同的操作ID', verbose_name='操作ID')),
                ('field_name', models.CharField(max_length=100, verbose_name='变更字段')),
                ('old_value', models.TextField(blank=True, null=True, verbose_name='旧值')),
                ('new_value', models.TextField(blank=True, null=True, verbose_name='新值')),
                ('changed_at', models.DateTimeField(auto_now_add=True, verbose_name='变更时间')),
                ('remarks', models.TextField(blank=True, verbose_name='备注')),
                ('changed_by', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='project_changes', to=settings.AUTH_USER_MODEL, verbose_name='操作人')),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='change_histories', to='projects.project', verbose_name='项目')),
            ],
            options={
                'verbose_name': '项目变更历史',
                'verbose_name_plural': '项目变更历史',
                'ordering': ['-changed_at'],
                'indexes': [models.Index(fields=['project', 'changed_at'], name='projects_pr_project_285a64_idx'), models.Index(fields=['field_name'], name='projects_pr_field_n_c50492_idx')],
            },
        ),
        migrations.AddIndex(
            model_name='projectstage',
            index=models.Index(fields=['project', 'stage_type'], name='projects_pr_project_4db5a0_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='projectstage',
            unique_together={('project', 'stage_type')},
        ),
        migrations.AddIndex(
            model_name='stagechangehistory',
            index=models.Index(fields=['stage', 'changed_at'], name='projects_st_stage_i_a1ff70_idx'),
        ),
        migrations.AddIndex(
            model_name='stagechangehistory',
            index=models.Index(fields=['project', 'changed_at'], name='projects_st_project_3eb6c9_idx'),
        ),
        migrations.AddIndex(
            model_name='stagechangehistory',
            index=models.Index(fields=['field_name'], name='projects_st_field_n_c2c213_idx'),
        ),
        migrations.AddIndex(
            model_name='taskchangehistory',
            index=models.Index(fields=['task', 'changed_at'], name='projects_ta_task_id_5b5cb2_idx'),
        ),
        migrations.AddIndex(
            model_name='taskchangehistory',
            index=models.Index(fields=['stage', 'changed_at'], name='projects_ta_stage_i_ff1fd2_idx'),
        ),
        migrations.AddIndex(
            model_name='taskchangehistory',
            index=models.Index(fields=['project', 'changed_at'], name='projects_ta_project_d90e0f_idx'),
        ),
        migrations.AddIndex(
            model_name='taskchangehistory',
            index=models.Index(fields=['task_type'], name='projects_ta_task_ty_78a373_idx'),
        ),
        migrations.AddIndex(
            model_name='taskchangehistory',
            index=models.Index(fields=['field_name'], name='projects_ta_field_n_2eb07c_idx'),
        ),
    ]
