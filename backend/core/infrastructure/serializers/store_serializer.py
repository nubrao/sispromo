from rest_framework import serializers
from core.infrastructure.models.store_model import StoreModel


class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreModel
        fields = ['id', 'name', 'number', 'city', 'state', 'cnpj']
