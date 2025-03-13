from rest_framework import serializers
from core.infrastructure.models.visit_model import VisitModel
from core.infrastructure.models.visit_price_model import VisitPriceModel
from drf_spectacular.utils import extend_schema_field
from decimal import Decimal


class VisitSerializer(serializers.ModelSerializer):
    promoter = serializers.SerializerMethodField(read_only=True)
    store = serializers.SerializerMethodField(read_only=True)
    brand = serializers.SerializerMethodField(read_only=True)
    visit_price = serializers.SerializerMethodField(read_only=True)
    total_price = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = VisitModel
        fields = [
            "id", "promoter", "store", "brand", "visit_date",
            "visit_price", "total_price"
        ]

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
                    "Promotores não podem criar visitas retroativas.")
        return data

    @extend_schema_field(serializers.DictField())
    def get_promoter(self, obj) -> dict:
        """Retorna um dicionário com ID e nome do promotor."""
        return (
            {"id": obj.promoter.id, "name": obj.promoter.name}
            if obj.promoter
            else None
        )

    @extend_schema_field(serializers.DictField())
    def get_store(self, obj) -> dict:
        """Retorna um dicionário com ID, nome e número da loja."""
        return (
            {
                "id": obj.store.id,
                "name": obj.store.name,
                "number": obj.store.number,
            }
            if obj.store
            else None
        )

    @extend_schema_field(serializers.DictField())
    def get_brand(self, obj) -> dict:
        """Retorna um dicionário com ID e nome da marca."""
        return (
            {"id": obj.brand.id, "name": obj.brand.name}
            if obj.brand
            else None
        )

    @extend_schema_field(serializers.FloatField())
    def get_visit_price(self, obj) -> float:
        """Obtém o valor da visita a partir do relacionamento entre
        Marca e Loja."""
        try:
            price_entry = VisitPriceModel.objects.get(
                brand=obj.brand, store=obj.store
            )
            return float(price_entry.price)
        except VisitPriceModel.DoesNotExist:
            return 0.0

    @extend_schema_field(serializers.FloatField())
    def get_total_price(self, obj) -> float:
        """Calcula o total para todas as visitas do mesmo promotor, loja e
        marca."""
        visits = VisitModel.objects.filter(
            promoter=obj.promoter, brand=obj.brand, store=obj.store
        )
        visit_price = self.get_visit_price(obj)
        return float(visits.count() * Decimal(str(visit_price)))
