from django.apps import AppConfig


class FilesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.files'

    def ready(self):
        """
        当 Django 应用准备就绪时调用
        """
        from config.storage import initialize_storage
        initialize_storage()
