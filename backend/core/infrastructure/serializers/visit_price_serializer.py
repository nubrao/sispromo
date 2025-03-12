from rest_framework import serializers
from core.infrastructure.models.visit_price_model import VisitPriceModel


class VisitPriceSerializer(serializers.ModelSerializer):
    store_name = serializers.CharField(source="store.name", read_only=True)
    store_number = serializers.IntegerField(
        source="store.number", read_only=True)
    brand_name = serializers.CharField(source="brand.name", read_only=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        model = VisitPriceModel
        fields = ["id", "store", "store_name",
                  "store_number", "brand", "brand_name", "price"]

    def validate_price(self, value):
        """
        Valida o preço da visita para garantir que seja um valor positivo.
        """
        if value <= 0:
            raise serializers.ValidationError(
                "O preço deve ser um valor positivo.")
        return float(value)  # Converte para float para garantir o formato

    def to_representation(self, instance):
        """
        Converte o objeto para sua representação serializada.
        """
        data = super().to_representation(instance)
        data['price'] = float(data['price'])  # Garante que o preço seja float
        return data
