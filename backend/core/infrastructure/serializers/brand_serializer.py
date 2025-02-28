from rest_framework import serializers
from core.infrastructure.models.brand_model import BrandModel, BrandStore
from core.infrastructure.models.store_model import StoreModel


class BrandStoreSerializer(serializers.ModelSerializer):
    store_id = serializers.IntegerField()
    store_name = serializers.CharField(source="store.name", read_only=True)
    visit_frequency = serializers.IntegerField()

    class Meta:
        model = BrandStore
        fields = ["store_id", "store_name", "visit_frequency"]


class BrandSerializer(serializers.ModelSerializer):
    brand_id = serializers.IntegerField(source="id", read_only=True)
    brand_name = serializers.CharField(source="name")
    # Alterado de store_name para store_id
    store_id = serializers.IntegerField(write_only=True)
    visit_frequency = serializers.IntegerField(write_only=True)
    stores = BrandStoreSerializer(
        source="brandstore_set", many=True, read_only=True)

    class Meta:
        model = BrandModel
        fields = ["brand_id", "brand_name",
                  "store_id", "visit_frequency", "stores"]

    def create(self, validated_data):
        import logging
        logger = logging.getLogger(__name__)

        try:
            brand_name = validated_data.get("name")
            store_id = validated_data.get("store_id")
            visit_frequency = validated_data.get("visit_frequency")

            if not brand_name:
                raise serializers.ValidationError(
                    {"brand_name": "O nome da marca é obrigatório."})
            if not store_id:
                raise serializers.ValidationError(
                    {"store_id": "O ID da loja é obrigatório."})
            if visit_frequency is None or visit_frequency <= 0:
                raise serializers.ValidationError(
                    {"visit_frequency":
                     "A periodicidade deve ser um número positivo."})

            brand, _ = BrandModel.objects.get_or_create(name=brand_name)

            try:
                store = StoreModel.objects.get(id=store_id)
            except StoreModel.DoesNotExist:
                raise serializers.ValidationError(
                    {"store_id": "Loja não encontrada."})

            brand_store, created = BrandStore.objects.get_or_create(
                brand=brand,
                store=store,
                defaults={"visit_frequency": visit_frequency}
            )

            if not created:
                brand_store.visit_frequency = visit_frequency
                brand_store.save()

            return brand

        except serializers.ValidationError as ve:
            raise ve
        except Exception as e:
            import traceback
            logger.error(f"Erro ao criar marca: {e}\n{traceback.format_exc()}")
            raise serializers.ValidationError(
                {"error": "Erro interno no servidor."})
