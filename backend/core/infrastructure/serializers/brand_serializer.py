from rest_framework import serializers
from core.infrastructure.models.brand_model import BrandModel, BrandStore
from core.infrastructure.models.store_model import StoreModel
from core.infrastructure.models.promoter_model import PromoterModel


class BrandStoreSerializer(serializers.ModelSerializer):
    store_id = serializers.IntegerField(source="store.id", read_only=True)
    store_name = serializers.CharField(source="store.name", read_only=True)
    visit_frequency = serializers.IntegerField(source="visit_frequency")

    class Meta:
        model = BrandStore
        fields = ["store_id", "store_name", "visit_frequency"]


class BrandPromoterSerializer(serializers.ModelSerializer):
    promoter_id = serializers.IntegerField(source="id", read_only=True)
    promoter_name = serializers.CharField(source="name", read_only=True)

    class Meta:
        model = PromoterModel
        fields = ["promoter_id", "promoter_name"]


class BrandSerializer(serializers.ModelSerializer):
    brand_id = serializers.IntegerField(source="id", read_only=True)
    brand_name = serializers.CharField(source="name")
    promoter_name = serializers.CharField(write_only=True)
    store_name = serializers.CharField(write_only=True)
    visit_frequency = serializers.IntegerField(write_only=True)
    promoters = BrandPromoterSerializer(many=True, read_only=True)
    stores = BrandStoreSerializer(source="brandstore_set", many=True,
                                  read_only=True)

    class Meta:
        model = BrandModel
        fields = ["brand_id", "brand_name", "promoter_name", "store_name",
                  "visit_frequency", "promoters", "stores"]

    def create(self, validated_data):
        import logging
        logger = logging.getLogger(__name__)

        try:
            brand_name = validated_data.get("name")
            promoter_name = validated_data.get("promoter_name")
            store_name = validated_data.get("store_name")
            visit_frequency = validated_data.get("visit_frequency")

            if not brand_name:
                raise serializers.ValidationError(
                    {"brand_name": "O nome da marca é obrigatório."})

            brand, _ = BrandModel.objects.get_or_create(name=brand_name)

            try:
                promoter = PromoterModel.objects.get(name=promoter_name)
            except PromoterModel.DoesNotExist:
                raise serializers.ValidationError(
                    {"error": "Promotor não encontrado"})

            try:
                store = StoreModel.objects.get(name=store_name)
            except StoreModel.DoesNotExist:
                raise serializers.ValidationError(
                    {"error": "Loja não encontrada"})

            brand_store, created = BrandStore.objects.get_or_create(
                brand=brand,
                store=store,
                defaults={"visit_frequency": visit_frequency}
            )

            if not created:
                brand_store.visit_frequency = visit_frequency
                brand_store.save()

            brand.promoters.add(promoter)

            return brand

        except Exception as e:
            import traceback
            logger.error(f"Erro ao criar marca: {e}\n{traceback.format_exc()}")
            raise serializers.ValidationError(
                {"error": "Erro interno no servidor"})
