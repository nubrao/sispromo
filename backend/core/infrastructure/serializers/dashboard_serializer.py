from rest_framework import serializers

class BrandProgressSerializer(serializers.Serializer):
    brand_id = serializers.IntegerField()
    brand_name = serializers.CharField()
    visits_done = serializers.IntegerField()
    visits_pending = serializers.IntegerField()
    total_visits = serializers.IntegerField()

class StoreProgressSerializer(serializers.Serializer):
    store_id = serializers.IntegerField()
    store_name = serializers.CharField()
    store_number = serializers.CharField()
    visits_done = serializers.IntegerField()
    visits_pending = serializers.IntegerField()
    total_visits = serializers.IntegerField()

class PromoterProgressSerializer(serializers.Serializer):
    promoter_id = serializers.IntegerField()
    promoter_name = serializers.CharField()
    visits_done = serializers.IntegerField()
    visits_pending = serializers.IntegerField()
    total_visits = serializers.IntegerField()

class DashboardSerializer(serializers.Serializer):
    total_visits = serializers.IntegerField()
    total_completed = serializers.IntegerField()
    total_pending = serializers.IntegerField()
    brands_progress = BrandProgressSerializer(many=True)
    promoters_progress = PromoterProgressSerializer(many=True)
    stores_progress = StoreProgressSerializer(many=True)

    class Meta:
        swagger_schema_fields = {
            "title": "Dashboard Data",
            "description": "Dados completos do dashboard incluindo progresso de marcas, lojas e promotores"
        }