from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from ..models.visit_model import VisitModel
from ..models.visit_price_model import VisitPriceModel
from .visit_price_serializer import VisitPriceSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


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
            "visit_price", "total_price", "status"
        ]

    @extend_schema_field(serializers.CharField())
    def get_promoter(self, obj):
        """Retorna os dados do promoter"""
        try:
            promoter = User.objects.get(id=obj.promoter_id)
            return {
                "id": promoter.id,
                "name": promoter.get_full_name(),
                "email": promoter.email,
                "role": promoter.role,
                "role_display": promoter.get_role_display()
            }
        except User.DoesNotExist:
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
        """
        Busca o preço da visita baseado na marca e loja.
        Retorna 0 se não encontrar preço configurado.
        """
        try:
            price = VisitPriceModel.objects.filter(
                brand_id=obj.brand_id,
                store_id=obj.store_id
            ).first()
            
            if price:
                return price.price
            return 0
        except Exception as e:
            logger.error(f"Erro ao buscar preço da visita: {str(e)}")
            return 0

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
        if self.context['request'].user.role == 1:  # Promotor
            from datetime import date
            internal_data["visit_date"] = date.today()
        elif "visit_date" in data:
            internal_data["visit_date"] = data["visit_date"]

        return internal_data

    def validate(self, data):
        """Valida os dados da visita"""
        user = self.context['request'].user

        # Se o usuário for promotor, força o uso do próprio usuário
        if user.role == 1:  # Promotor
            data['promoter'] = user
        else:
            # Se for gestor ou analista, valida o promotor informado
            if 'promoter' not in data:
                raise serializers.ValidationError(
                    "O campo promoter é obrigatório."
                )

        return data
