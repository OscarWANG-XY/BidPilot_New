# Generated by Django 5.1.4 on 2025-02-17 16:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('doc_analysis', '0004_documentanalysis_outline_analysis_result'),
    ]

    operations = [
        migrations.AddField(
            model_name='documentanalysis',
            name='improved_docx_elements',
            field=models.JSONField(blank=True, help_text='存储从经过初步大纲优化的结构化元素', null=True, verbose_name='初步大纲优化后的文档元素'),
        ),
    ]
