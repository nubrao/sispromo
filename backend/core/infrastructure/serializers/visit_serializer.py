from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from ..models.visit_model import VisitModel


class VisitSerializer(serializers.ModelSerializer):
    promoter = serializers.SerializerMethodField()
    store = serializers.SerializerMethodField()
    brand = serializers.SerializerMethodField()
    visit_price = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = VisitModel
        fields = [
            "id", "promoter", "store", "brand", "visit_date",
            "visit_price", "total_price"
        ]

    @extend_schema_field(serializers.CharField())
    def get_promoter(self, obj):
        """Retorna os dados do promotor"""
        promoter_data = {
            "id": obj.promoter.id,
            "name": obj.promoter.name,
            "email": (
                obj.promoter.user_profile.user.email
                if obj.promoter.user_profile and obj.promoter.user_profile.user
                else None
            )
        }
        return promoter_data

    @extend_schema_field(serializers.CharField())
    def get_store(self, obj):
        """Retorna os dados da loja"""
        store_data = {
            "id": obj.store.id,
            "name": obj.store.name,
            "number": obj.store.number,
            "address": obj.store.address,
            "city": obj.store.city,
            "state": obj.store.state
        }
        return store_data

    @extend_schema_field(serializers.CharField())
    def get_brand(self, obj):
        """Retorna os dados da marca"""
        brand_data = {
            "id": obj.brand.id,
            "name": obj.brand.brand_name,
            "store_id": obj.brand.store.id,
            "store_name": obj.brand.store.name,
            "store_number": obj.brand.store.number
        }
        return brand_data

    @extend_schema_field(serializers.DecimalField(max_digits=10, decimal_places=2))
    def get_visit_price(self, obj):
        """Retorna o preço da visita"""
        if obj.price:
            return str(obj.price)
        return "0.00"

    @extend_schema_field(serializers.DecimalField(max_digits=10, decimal_places=2))
    def get_total_price(self, obj):
        """Calcula o preço total da visita"""
        if obj.price:
            return str(obj.price)
        return "0.00"

    def to_internal_value(self, data):
        """
        Converte os dados recebidos para o formato interno do Django.
        """
        internal_data = {}
        if "store" in data:
            internal_data["store_id"] = data["store"]
        if "brand" in data:
            internal_data["brand_id"] = data["brand"]

        # Se o usuário for promotor, usa a data atual
        if self.context['request'].user.userprofile.role == 'promoter':
            from datetime import date
            internal_data["visit_date"] = date.today()
        elif "visit_date" in data:
            internal_data["visit_date"] = data["visit_date"]

        return internal_data

    def validate(self, data):
        """
        Validação adicional para garantir que promotores não possam criar visitas retroativas
        """
        if self.context['request'].user.userprofile.role == 'promoter':
            from datetime import date
            if data.get('visit_date') != date.today():
                raise serializers.ValidationError(
                    "Promotores não podem criar visitas retroativas."
                )
        return data
