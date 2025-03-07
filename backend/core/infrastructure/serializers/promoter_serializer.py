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
        Valida se o CPF é numérico, tem 11 dígitos e passa na validação oficial do CPF.
        """
        if not value.isdigit() or len(value) != 11:
            raise serializers.ValidationError(
                "CPF inválido. Deve conter exatamente 11 dígitos numéricos."
            )

        # Converte para lista de inteiros
        cpf_numbers = list(map(int, value))

        # Verifica se todos os números são iguais (ex: 111.111.111-11), o que é inválido
        if cpf_numbers == cpf_numbers[::-1]:
            raise serializers.ValidationError("CPF inválido.")

        # Cálculo do primeiro dígito verificador
        sum1 = sum(a * b for a, b in zip(cpf_numbers[:9], range(10, 1, -1)))
        digit1 = (sum1 * 10 % 11) % 10

        # Cálculo do segundo dígito verificador
        sum2 = sum(a * b for a, b in zip(cpf_numbers[:10], range(11, 1, -1)))
        digit2 = (sum2 * 10 % 11) % 10

        if cpf_numbers[9] != digit1 or cpf_numbers[10] != digit2:
            raise serializers.ValidationError("CPF inválido.")

        return value

    def validate_phone(self, value):
        """
        Valida se o telefone contém apenas números e tem um tamanho válido.
        """
        if not value.isdigit():
            raise serializers.ValidationError(
                "Telefone deve conter apenas números."
            )
        if len(value) < 10 or len(value) > 15:
            raise serializers.ValidationError(
                "Telefone deve ter entre 10 e 15 dígitos."
            )
        return value
