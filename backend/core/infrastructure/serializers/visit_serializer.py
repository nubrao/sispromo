from rest_framework import serializers
from core.infrastructure.models.visit_model import VisitModel
from core.infrastructure.models.brand_model import BrandModel
from drf_spectacular.utils import extend_schema_field


class VisitSerializer(serializers.ModelSerializer):
    promoter_name = serializers.CharField(
        source="promoter.name", read_only=True)
    store_display = serializers.SerializerMethodField()
    brand = serializers.PrimaryKeyRelatedField(
        queryset=BrandModel.objects.all())

    class Meta:
        model = VisitModel
        fields = ["id", "promoter", "store", "brand",
                  "promoter_name", "store_display", "visit_date"]
        extra_kwargs = {
            "promoter": {"required": True},
            "store": {"required": True},
            "brand": {"required": True},
        }

    @extend_schema_field(serializers.CharField())
    def get_store_display(self, obj):
        """Retorna o nome e número da loja formatados."""
        return f"{obj.store.name} - {obj.store.number}"

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_brand_name(self, obj):
        """Retorna o nome da marca ou None se não existir."""
        return obj.brand.name if obj.brand else None
