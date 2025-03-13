# 导入Django内置的用户模型基类、用户管理器基类和权限混入类
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
# 导入Django的模型类
from django.db import models
# 导入Django的时区工具
from django.utils import timezone
# 导入Python的UUID模块，用于生成唯一标识符
import uuid

# 自定义用户管理器类，继承自Django的BaseUserManager
class CustomUserManager(BaseUserManager):
    # 创建普通用户的方法
    def create_user(self, phone, password=None, **extra_fields):
        # 检查手机号是否提供，如果没有提供则抛出异常
        if not phone:
            raise ValueError('手机号是必填项')
        # 使用提供的手机号和额外字段创建用户对象
        user = self.model(phone=phone, **extra_fields)
        # 如果提供了密码，则使用Django的set_password方法设置密码
        if password:
            user.set_password(password)
        # 保存用户对象到数据库
        user.save(using=self._db)
        # 返回创建的用户对象 （注意这里返回的是完整的用户对象）
        return user

    # 创建超级用户的方法
    def create_superuser(self, phone, password=None, **extra_fields):
        # 设置默认的超级用户属性
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        # 调用create_user方法创建超级用户
        return self.create_user(phone, password, **extra_fields)

# 自定义用户模型类，继承自Django的AbstractBaseUser和PermissionsMixin
class User(AbstractBaseUser, PermissionsMixin):
    # 定义用户角色的选择项
    ROLE_CHOICES = (
        ('user', '普通用户'),
        ('admin', '管理员'),
    )

    # 用户ID字段，使用UUID作为主键，默认值为uuid.uuid4生成的唯一标识符
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # 手机号字段，最大长度为11，唯一且不能为空
    phone = models.CharField(max_length=11, unique=True, verbose_name='手机号')
    # 邮箱字段，最大长度为255，可以为空
    email = models.EmailField(max_length=255, blank=True, null=True, verbose_name='邮箱')
    # 用户名字段，最大长度为255，可以为空
    username = models.CharField(max_length=255, blank=True, null=True, verbose_name='用户名')
    # 微信ID字段，最大长度为255，可以为空
    wechat_id = models.CharField(max_length=255, blank=True, null=True, verbose_name='微信ID')
    # 用户角色字段，从ROLE_CHOICES中选择，默认为普通用户
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user', verbose_name='用户角色')
    
    # 用户是否激活字段，默认为True
    is_active = models.BooleanField(default=True)
    # 用户是否为员工字段，默认为False
    is_staff = models.BooleanField(default=False)
    # 用户创建时间字段，默认为当前时间
    created_at = models.DateTimeField(default=timezone.now)
    # 用户更新时间字段，每次保存时自动更新为当前时间
    updated_at = models.DateTimeField(auto_now=True)

    # 使用自定义的用户管理器
    objects = CustomUserManager()

    # 指定用户名字段为手机号
    USERNAME_FIELD = 'phone'
    # 指定创建超级用户时需要额外提供的字段
    REQUIRED_FIELDS = []

    # 定义模型的元数据
    class Meta:
        # 定义模型在管理后台中的单数名称
        verbose_name = '用户'
        # 定义模型在管理后台中的复数名称
        verbose_name_plural = '用户'

    # 定义对象的字符串表示形式
    def __str__(self):
        return self.phone


# 用于存储验证码的模型类
class VerificationCode(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # 定义验证码类型的选择项
    TYPE_CHOICES = (
        ('login', '登录'),
        ('register', '注册'),
        ('resetPassword', '重置密码'),
    )

    # 手机号字段，最大长度为11，用于关联用户
    phone = models.CharField(max_length=11, verbose_name='手机号')
    # 验证码字段，最大长度为6
    code = models.CharField(max_length=6, verbose_name='验证码')
    # 验证码类型字段，从TYPE_CHOICES中选择
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name='验证码类型')
    # 验证码创建时间字段，自动设置为当前时间
    created_at = models.DateTimeField(auto_now_add=True)
    # 验证码过期时间字段
    expires_at = models.DateTimeField()
    # 验证码是否已使用字段，默认为False
    is_used = models.BooleanField(default=False)

    # 定义模型的元数据
    class Meta:
        # 定义模型在管理后台中的单数名称
        verbose_name = '验证码'
        # 定义模型在管理后台中的复数名称
        verbose_name_plural = '验证码'

    # 定义对象的字符串表示形式
    def __str__(self):
        return f"{self.phone} - {self.type}"