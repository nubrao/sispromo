from rest_framework import serializers
from core.infrastructure.models.store_model import StoreModel


class StoreSerializer(serializers.ModelSerializer):
    # Garante que o CNPJ tenha um tamanho adequado
    cnpj = serializers.CharField(min_length=14, max_length=18)

    class Meta:
        model = StoreModel
        fields = ['id', 'name', 'number', 'city', 'state', 'cnpj']

    def validate_cnpj(self, value):
        """
        Valida se o CNPJ contém apenas números, tem 14 dígitos e passa na validação oficial do CNPJ.
        """
        # Remove qualquer caractere que não seja número (caso venha formatado)
        cnpj = ''.join(filter(str.isdigit, value))

        if len(cnpj) != 14:
            raise serializers.ValidationError(
                "CNPJ inválido. Deve conter exatamente 14 dígitos numéricos."
            )

        # Verifica se todos os números são iguais (ex: 11.111.111/1111-11), o que é inválido
        if cnpj == cnpj[0] * 14:
            raise serializers.ValidationError("CNPJ inválido.")

        # Cálculo do primeiro dígito verificador
        weights_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        sum1 = sum(int(cnpj[i]) * weights_1[i] for i in range(12))
        digit1 = 11 - (sum1 % 11)
        digit1 = digit1 if digit1 < 10 else 0

        # Cálculo do segundo dígito verificador
        weights_2 = [6] + weights_1
        sum2 = sum(int(cnpj[i]) * weights_2[i] for i in range(13))
        digit2 = 11 - (sum2 % 11)
        digit2 = digit2 if digit2 < 10 else 0

        if int(cnpj[12]) != digit1 or int(cnpj[13]) != digit2:
            raise serializers.ValidationError("CNPJ inválido.")

        return cnpj
