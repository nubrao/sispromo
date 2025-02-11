from rest_framework import serializers
from core.infrastructure.models.promoter_model import PromoterModel


class PromoterSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromoterModel
        fields = '__all__'
