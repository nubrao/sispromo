from rest_framework import serializers
from core.infrastructure.models.brand_model import BrandModel, BrandStore
from core.infrastructure.models.store_model import StoreModel
import logging

logger = logging.getLogger(__name__)


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
    store_id = serializers.IntegerField(write_only=True)
    visit_frequency = serializers.IntegerField(write_only=True)
    stores = BrandStoreSerializer(
        source="brandstore_set", many=True, read_only=True)

    class Meta:
        model = BrandModel
        fields = ["brand_id", "brand_name",
                  "store_id", "visit_frequency", "stores"]

    def to_internal_value(self, data):
        """
        Remove store_id e visit_frequency antes da validação
        """
        internal_value = super().to_internal_value(data)
        store_id = internal_value.pop("store_id", None)
        visit_frequency = internal_value.pop("visit_frequency", None)
        return internal_value

    def create(self, validated_data):
        logger.info(f"Validated data: {validated_data}")

        # Cria a marca apenas com o nome
        try:
            brand = BrandModel.objects.create(**validated_data)
            logger.info(f"Brand created successfully: {brand}")
        except Exception as e:
            logger.error(f"Error creating brand: {e}")
            raise serializers.ValidationError({"error": str(e)})

        # Obtém store_id e visit_frequency do contexto
        store_id = self.context.get("store_id")
        visit_frequency = self.context.get("visit_frequency")

        if store_id and visit_frequency:
            try:
                # Cria a associação com a loja
                store = StoreModel.objects.get(id=store_id)
                brand_store = BrandStore.objects.create(
                    brand=brand,
                    store=store,
                    visit_frequency=visit_frequency
                )
                logger.info(f"BrandStore created successfully: {brand_store}")
            except StoreModel.DoesNotExist:
                brand.delete()
                raise serializers.ValidationError(
                    {"store_id": "Loja não encontrada."})
            except Exception as e:
                brand.delete()
                logger.error(f"Error creating BrandStore: {e}")
                raise serializers.ValidationError({"error": str(e)})

        return brand

    def update(self, instance, validated_data):
        logger.info(f"Update - Validated data: {validated_data}")

        # Atualiza os campos da marca
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Obtém store_id e visit_frequency do contexto
        store_id = self.context.get("store_id")
        visit_frequency = self.context.get("visit_frequency")

        # Atualiza ou cria a associação com a loja
        if store_id is not None and visit_frequency is not None:
            try:
                store = StoreModel.objects.get(id=store_id)
                brand_store, created = BrandStore.objects.get_or_create(
                    brand=instance,
                    store=store,
                    defaults={"visit_frequency": visit_frequency}
                )
                if not created:
                    brand_store.visit_frequency = visit_frequency
                    brand_store.save()
            except StoreModel.DoesNotExist:
                raise serializers.ValidationError(
                    {"store_id": "Loja não encontrada."})

        return instance
