from rest_framework import serializers
from .models import testground

class testgroundSerializer(serializers.ModelSerializer):
    class Meta:
        model = testground
        fields = '__all__'
