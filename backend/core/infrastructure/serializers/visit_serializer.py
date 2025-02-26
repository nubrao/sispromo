from rest_framework import serializers
from core.infrastructure.models.visit_model import VisitModel


class VisitSerializer(serializers.ModelSerializer):
    promoter_name = serializers.CharField(
        source="promoter.name", read_only=True)
    store_display = serializers.SerializerMethodField()
    brand_name = serializers.SerializerMethodField()

    class Meta:
        model = VisitModel
        fields = ["id", "promoter", "store", "promoter_name",
                  "store_display", "brand_name", "visit_date"]
        extra_kwargs = {
            "promoter": {"required": True},
            "store": {"required": True},
        }

    def get_store_display(self, obj):
        return f"{obj.store.name} - {obj.store.number}"

    def get_brand_name(self, obj):
        return obj.brand.name if obj.brand else None
