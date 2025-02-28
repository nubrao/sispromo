from rest_framework import serializers
from core.infrastructure.models.promoter_model import PromoterModel


class PromoterSerializer(serializers.ModelSerializer):
    # CPF sempre com 11 números
    cpf = serializers.CharField(min_length=11, max_length=11)
    # Telefone entre 10 e 15 caracteres
    phone = serializers.CharField(min_length=10, max_length=15)

    class Meta:
        model = PromoterModel
        fields = ["id", "name", "cpf", "phone"]

    def validate_cpf(self, value):
        """
        Valida se o CPF contém apenas números e tem 11 dígitos.
        """
        if not value.isdigit() or len(value) != 11:
            raise serializers.ValidationError(
                "CPF inválido. Deve conter apenas 11 dígitos numéricos.")
        return value

    def validate_phone(self, value):
        """
        Valida se o telefone contém apenas números e tem um tamanho válido.
        """
        if not value.isdigit():
            raise serializers.ValidationError(
                "Telefone deve conter apenas números.")
        if len(value) < 10 or len(value) > 15:
            raise serializers.ValidationError(
                "Telefone deve ter entre 10 e 15 dígitos.")
        return value
