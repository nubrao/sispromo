from rest_framework import serializers
from core.infrastructure.models.store_model import StoreModel


class StoreSerializer(serializers.ModelSerializer):
    # Garante que o CNPJ tenha tamanho adequado
    cnpj = serializers.CharField(min_length=14, max_length=18)

    class Meta:
        model = StoreModel
        fields = ['id', 'name', 'number', 'city', 'state', 'cnpj']
