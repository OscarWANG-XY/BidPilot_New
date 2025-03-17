from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import testground
from .serializers import testgroundSerializer
from drf_spectacular.utils import extend_schema, extend_schema_view

@extend_schema_view(
    list=extend_schema(
        tags=['testground'],
        summary='获取testground列表',
        description='获取testground列表'
    ),
    retrieve=extend_schema(
        tags=['testground'],
        summary='获取testground详情',
        description='获取testground详情'
    ),
    create=extend_schema(
        tags=['testground'],
        summary='创建testground',
        description='创建testground'
    ),
    update=extend_schema(
        tags=['testground'],
        summary='更新testground',
        description='更新testground'
    ),
    destroy=extend_schema(
        tags=['testground'],
        summary='删除testground',
        description='删除testground'
    )
)
class testgroundViewSet(viewsets.ModelViewSet):
    queryset = testground.objects.all()
    serializer_class = testgroundSerializer
