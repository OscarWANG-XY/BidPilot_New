from django.apps import AppConfig


class SubscriptionConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.subscription"
    verbose_name = "订阅管理"

    def ready(self):
        import apps.subscription.signals  # 导入信号处理器，如果有的话
