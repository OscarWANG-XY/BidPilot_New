from rest_framework import serializers
from apps.projects.models import Project, Task
from apps.internal_server.models import StructuringAgentStorage

class ProjectInternalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['id', 'creator', 'create_time', 'last_update_time']


class TaskInternalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['id', 'creator', 'create_time', 'last_update_time']

class StructuringAgentStorageSerializer(serializers.ModelSerializer):
    class Meta:
        model = StructuringAgentStorage
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

