from rest_framework import serializers
from core.infrastructure.models.visit_model import VisitModel
from core.infrastructure.models.brand_model import BrandStore


class VisitSerializer(serializers.ModelSerializer):
    promoter_name = serializers.CharField(
        source="promoter.name", read_only=True)
    store_display = serializers.SerializerMethodField()
    brand = serializers.SerializerMethodField()

    class Meta:
        model = VisitModel
        fields = ["id", "promoter", "store", "promoter_name",
                  "store_display", "brand", "visit_date"]
        extra_kwargs = {
            "promoter": {"required": True},
            "store": {"required": True},
        }

    def get_store_display(self, obj):
        return f"{obj.store.name} - {obj.store.number}"

    def get_brand(self, obj):
        brand_store = BrandStore.objects.filter(
            store=obj.store, brand=obj.brand).first()
        return brand_store.brand.name if brand_store else "Marca não encontrada"
