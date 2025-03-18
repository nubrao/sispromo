from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from ..models.visit_model import VisitModel
from ..models.visit_price_model import VisitPriceModel
from .visit_price_serializer import VisitPriceSerializer


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
        """Retorna os dados do promoter"""
        from ..models.promoter_model import PromoterModel
        try:
            promoter = PromoterModel.objects.get(id=obj.promoter_id)
            return {
                "id": promoter.id,
                "name": promoter.name,
                "email": (
                    promoter.user_profile.user.email
                    if promoter.user_profile and promoter.user_profile.user
                    else None
                )
            }
        except PromoterModel.DoesNotExist:
            return None

    @extend_schema_field(serializers.CharField())
    def get_store(self, obj):
        """Retorna os dados da loja"""
        from ..models.store_model import StoreModel
        try:
            store = StoreModel.objects.get(id=obj.store_id)
            return {
                "id": store.id,
                "name": store.name,
                "number": store.number,
                "city": store.city,
                "state": store.state
            }
        except StoreModel.DoesNotExist:
            return None

    @extend_schema_field(serializers.CharField())
    def get_brand(self, obj):
        """Retorna os dados da marca"""
        from ..models.brand_model import BrandModel
        try:
            brand = BrandModel.objects.get(id=obj.brand_id)
            return {
                "brand_id": brand.id,
                "brand_name": brand.name
            }
        except BrandModel.DoesNotExist:
            return None

    @extend_schema_field(
        serializers.DecimalField(max_digits=10, decimal_places=2)
    )
    def get_visit_price(self, obj):
        """Retorna o preço da visita com base na relação Loja + Marca"""
        try:
            visit_price = VisitPriceModel.objects.get(
                store_id=obj.store_id,
                brand_id=obj.brand_id
            )
            # Obtém o preço corretamente
            return VisitPriceSerializer(visit_price).data["price"]
        except VisitPriceModel.DoesNotExist:
            return "0.00"  # Retorna um valor padrão caso não haja preço cadastrado

    @extend_schema_field(
        serializers.DecimalField(max_digits=10, decimal_places=2)
    )
    def get_total_price(self, obj):
        """Calcula o preço total da visita"""
        visit_price = self.get_visit_price(obj)
        return visit_price if visit_price else "0.00"

    def to_internal_value(self, data):
        """
        Converte os dados recebidos para o formato interno do Django.
        """
        internal_data = {}

        # Converte store_id
        if "store" in data:
            try:
                internal_data["store_id"] = int(data["store"])
            except (ValueError, TypeError):
                raise serializers.ValidationError(
                    {"store": "ID da loja inválido"}
                )

        # Converte brand_id
        if "brand" in data:
            try:
                internal_data["brand_id"] = int(data["brand"])
            except (ValueError, TypeError):
                raise serializers.ValidationError(
                    {"brand": "ID da marca inválido"}
                )

        # Se o usuário for promotor, usa a data atual
        if self.context['request'].user.userprofile.role == 'promoter':
            from datetime import date
            internal_data["visit_date"] = date.today()
        elif "visit_date" in data:
            internal_data["visit_date"] = data["visit_date"]

        return internal_data

    def validate(self, data):
        """
        Validação adicional dos dados da visita
        """
        from datetime import date
        user = self.context['request'].user

        # Validação da data para promotores
        if user.userprofile.role == 'promoter':
            if data.get('visit_date') and data['visit_date'] != date.today():
                raise serializers.ValidationError(
                    "Promotores não podem criar visitas retroativas."
                )

        # Validação da loja
        if 'store_id' in data:
            from ..models.store_model import StoreModel
            try:
                StoreModel.objects.get(id=data['store_id'])
            except StoreModel.DoesNotExist:
                raise serializers.ValidationError(
                    {"store": "Loja não encontrada"}
                )

        # Validação da marca
        if 'brand_id' in data:
            from ..models.brand_model import BrandModel
            try:
                BrandModel.objects.get(id=data['brand_id'])
            except BrandModel.DoesNotExist:
                raise serializers.ValidationError(
                    {"brand": "Marca não encontrada"}
                )

        return data
