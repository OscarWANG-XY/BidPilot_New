from django.contrib import admin
from .models import SubscriptionPlan, UserSubscription, Payment, SubscriptionLog


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'plan_type', 'price', 'project_limit', 'is_active')
    list_filter = ('plan_type', 'is_active')
    search_fields = ('name', 'description')
    ordering = ('price',)


@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'plan', 'start_date', 'end_date', 'status', 'remaining_projects')
    list_filter = ('status', 'plan')
    search_fields = ('user__username', 'user__email')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    raw_id_fields = ('user',)


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('user', 'subscription', 'amount', 'payment_method', 'status', 'payment_time')
    list_filter = ('status', 'payment_method')
    search_fields = ('user__username', 'user__email', 'transaction_id')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    raw_id_fields = ('user', 'subscription')


@admin.register(SubscriptionLog)
class SubscriptionLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'subscription', 'action', 'created_at')
    list_filter = ('action',)
    search_fields = ('user__username', 'user__email', 'description')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    raw_id_fields = ('user', 'subscription')