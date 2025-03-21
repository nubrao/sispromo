from rest_framework import serializers
from core.infrastructure.models.promoter_brand_model import PromoterBrand
from core.infrastructure.serializers.brand_serializer import BrandSerializer
from core.infrastructure.serializers.user_serializer import UserSerializer


class PromoterBrandSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    promoter = UserSerializer(read_only=True)
    brand_id = serializers.IntegerField(write_only=True)
    promoter_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = PromoterBrand
        fields = ['id', 'brand', 'promoter', 'brand_id',
                  'promoter_id', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        return PromoterBrand.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
