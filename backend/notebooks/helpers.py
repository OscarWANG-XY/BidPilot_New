from django.core.serializers import serialize
import json
import pandas as pd

def queryset_to_dataframe(queryset):
    """将 Django QuerySet 转换为 pandas DataFrame"""
    data = serialize('json', queryset)
    return pd.DataFrame(json.loads(data))

def reset_test_db():
    """重置测试数据"""
    User.objects.all().delete()
    VerificationCode.objects.all().delete()
    # ... 其他清理代码 ...
