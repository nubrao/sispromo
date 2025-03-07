from rest_framework import serializers
from core.infrastructure.models.visit_model import VisitModel
from core.infrastructure.models.brand_model import BrandModel
from drf_spectacular.utils import extend_schema_field


class VisitSerializer(serializers.ModelSerializer):
    promoter = serializers.SerializerMethodField()
    store = serializers.SerializerMethodField()
    brand = serializers.SerializerMethodField()

    class Meta:
        model = VisitModel
        fields = ["id", "promoter", "store", "brand", "visit_date"]

    @extend_schema_field(serializers.DictField())
    def get_promoter(self, obj):
        """Retorna um dicionário com ID e nome do promotor."""
        return {"id": obj.promoter.id, "name": obj.promoter.name} if obj.promoter else None

    @extend_schema_field(serializers.DictField())
    def get_store(self, obj):
        """Retorna um dicionário com ID, nome e número da loja."""
        return {"id": obj.store.id, "name": obj.store.name, "number": obj.store.number} if obj.store else None

    @extend_schema_field(serializers.DictField())
    def get_brand(self, obj):
        """Retorna um dicionário com ID e nome da marca."""
        return {"id": obj.brand.id, "name": obj.brand.name} if obj.brand else None
