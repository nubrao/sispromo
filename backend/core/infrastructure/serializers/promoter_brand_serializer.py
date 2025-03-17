from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from ..models.promoter_brand_model import PromoterBrandModel
from ..models.brand_model import BrandModel


class PromoterBrandSerializer(serializers.ModelSerializer):
    brand_name = serializers.SerializerMethodField()
    store_name = serializers.SerializerMethodField()
    store_number = serializers.SerializerMethodField()
    visit_frequency = serializers.IntegerField(
        source='brand.visit_frequency', read_only=True)
    promoter_name = serializers.SerializerMethodField()
    promoter_email = serializers.SerializerMethodField()

    class Meta:
        model = PromoterBrandModel
        fields = [
            'id', 'promoter', 'brand', 'brand_name', 'store_name',
            'store_number', 'visit_frequency', 'created_at', 'updated_at',
            'promoter_name', 'promoter_email'
        ]
        read_only_fields = ['created_at', 'updated_at']

    @extend_schema_field(serializers.CharField())
    def get_promoter_name(self, obj):
        """Retorna o nome completo do promotor"""
        if obj.promoter.user_profile and obj.promoter.user_profile.user:
            user = obj.promoter.user_profile.user
            name = f"{user.first_name} {user.last_name}".strip()
            return name or obj.promoter.name
        return obj.promoter.name

    @extend_schema_field(serializers.EmailField())
    def get_promoter_email(self, obj):
        """Retorna o email do promotor"""
        if obj.promoter.user_profile and obj.promoter.user_profile.user:
            return obj.promoter.user_profile.user.email
        return None

    @extend_schema_field(serializers.CharField())
    def get_brand_name(self, obj):
        """Retorna o nome da marca"""
        return obj.brand.brand_name

    @extend_schema_field(serializers.CharField())
    def get_store_name(self, obj):
        """Retorna o nome da loja"""
        return obj.brand.store.name

    @extend_schema_field(serializers.CharField())
    def get_store_number(self, obj):
        """Retorna o número da loja"""
        return obj.brand.store.number

    def validate(self, data):
        """
        Verifica se a marca já está associada a outro promotor
        """
        brand = data.get('brand')
        promoter = data.get('promoter')

        if self.instance:  # Se estiver atualizando
            if PromoterBrandModel.objects.exclude(id=self.instance.id).filter(
                brand=brand
            ).exists():
                raise serializers.ValidationError(
                    "Esta marca já está associada a outro promotor."
                )
        else:  # Se estiver criando
            if PromoterBrandModel.objects.filter(brand=brand).exists():
                raise serializers.ValidationError(
                    "Esta marca já está associada a outro promotor."
                )

        return data
