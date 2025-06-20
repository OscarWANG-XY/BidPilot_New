# Generated by Django 5.1.4 on 2025-06-20 03:58

import django.core.validators
import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("projects", "__first__"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="FileRecord",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("created_by", models.CharField(max_length=100)),
                ("updated_at", models.DateTimeField(blank=True, null=True)),
                ("updated_by", models.CharField(blank=True, max_length=100, null=True)),
                ("version", models.IntegerField(default=1)),
                ("name", models.CharField(max_length=255)),
                (
                    "file",
                    models.FileField(
                        blank=True, null=True, upload_to="uploads/%Y/%m/%d/"
                    ),
                ),
                ("size", models.BigIntegerField()),
                (
                    "type",
                    models.CharField(
                        choices=[
                            ("PDF", "PDF"),
                            ("WORD", "WORD"),
                            ("EXCEL", "EXCEL"),
                            ("IMAGE", "IMAGE"),
                            ("OTHER", "OTHER"),
                        ],
                        max_length=10,
                    ),
                ),
                ("mime_type", models.CharField(blank=True, max_length=100, null=True)),
                (
                    "processing_status",
                    models.CharField(
                        choices=[
                            ("NONE", "None"),
                            ("UPLOADING", "Uploading"),
                            ("COMPLETED", "Completed"),
                            ("FAILED", "Failed"),
                        ],
                        default="NONE",
                        max_length=20,
                    ),
                ),
                (
                    "processing_progress",
                    models.IntegerField(
                        blank=True,
                        null=True,
                        validators=[
                            django.core.validators.MinValueValidator(0),
                            django.core.validators.MaxValueValidator(100),
                        ],
                    ),
                ),
                ("error_message", models.TextField(blank=True, null=True)),
                ("metadata", models.JSONField(blank=True, null=True)),
                ("remarks", models.TextField(blank=True, null=True)),
                (
                    "owner",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="owned_files",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="files",
                        to="projects.project",
                        verbose_name="关联项目",
                    ),
                ),
            ],
            options={
                "db_table": "file_records",
            },
        ),
    ]
