# Generated by Django 5.1.4 on 2025-04-16 14:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0006_project_outline_l1_project_outline_l2_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="index_path_map_L1",
            field=models.JSONField(
                blank=True,
                help_text="存储大纲L1索引路径映射",
                null=True,
                verbose_name="大纲L1索引路径映射",
            ),
        ),
        migrations.AddField(
            model_name="project",
            name="index_path_map_L2",
            field=models.JSONField(
                blank=True,
                help_text="存储大纲L2索引路径映射",
                null=True,
                verbose_name="大纲L2索引路径映射",
            ),
        ),
        migrations.AddField(
            model_name="project",
            name="index_path_map_L3",
            field=models.JSONField(
                blank=True,
                help_text="存储大纲L3索引路径映射",
                null=True,
                verbose_name="大纲L3索引路径映射",
            ),
        ),
    ]
