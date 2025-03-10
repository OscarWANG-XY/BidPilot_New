from django.contrib import admin

from .models import User, VerificationCode

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'phone', 'email', 'username', 'role', 'is_active', 'is_staff', 'created_at', 'updated_at')
    search_fields = ('phone', 'email', 'username')
    list_filter = ('role', 'is_active', 'is_staff')
    list_editable = ('role', 'is_active', 'is_staff')

@admin.register(VerificationCode)
class VerificationCodeAdmin(admin.ModelAdmin):
    list_display = ('id', 'phone', 'code', 'type', 'created_at', 'expires_at', 'is_used')
    search_fields = ('phone', 'code', 'type')
    list_filter = ('type', 'is_used')

# Register your models here.
