from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from core.infrastructure.models.promoter_model import PromoterModel
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password


class PromoterSerializer(serializers.ModelSerializer):
    email = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    # CPF sempre com 11 números
    cpf = serializers.CharField(min_length=11, max_length=11)
    # Telefone entre 10 e 15 caracteres
    phone = serializers.CharField(min_length=10, max_length=15)
    # Campo para armazenar a senha temporária gerada
    temporary_password = serializers.CharField(read_only=True)

    class Meta:
        model = PromoterModel
        fields = [
            "id", "name", "first_name", "last_name", "cpf", "phone",
            "email", "temporary_password"
        ]

    @extend_schema_field(serializers.EmailField())
    def get_email(self, obj):
        """Retorna o email do usuário associado ao promotor"""
        if obj.user_profile and obj.user_profile.user:
            return obj.user_profile.user.email
        return None

    @extend_schema_field(serializers.CharField())
    def get_name(self, obj):
        """Retorna o nome completo do promotor"""
        return obj.name

    def validate(self, data):
        """Valida os dados, incluindo o email obrigatório"""
        email = self.context['request'].data.get('email')
        if not email:
            raise serializers.ValidationError({
                'email': 'O email é obrigatório.'
            })
        return data

    def validate_cpf(self, value):
        """Valida se o CPF contém apenas números."""
        # Remove caracteres especiais do CPF
        cpf_numbers = ''.join(filter(str.isdigit, value))

        if len(cpf_numbers) != 11:
            raise serializers.ValidationError(
                "CPF deve conter 11 dígitos numéricos."
            )

        # Verifica se já existe um usuário com este CPF como username
        if User.objects.filter(username=cpf_numbers).exists():
            raise serializers.ValidationError(
                "Já existe um usuário cadastrado com este CPF."
            )

        return cpf_numbers

    def validate_phone(self, value):
        """Valida se o telefone contém apenas números."""
        # Remove caracteres especiais do telefone
        phone_numbers = ''.join(filter(str.isdigit, value))

        if len(phone_numbers) < 10 or len(phone_numbers) > 11:
            raise serializers.ValidationError(
                "Telefone deve ter entre 10 e 11 dígitos."
            )

        return phone_numbers

    def create(self, validated_data):
        # Obtém o email dos dados da requisição
        email = self.context['request'].data.get('email')

        # Usa os 6 primeiros dígitos do CPF como senha temporária
        temp_password = validated_data['cpf'][:6]

        # Cria o usuário com o CPF como username
        user = User.objects.create(
            username=validated_data['cpf'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            email=email,
            password=make_password(temp_password)
        )

        # Garante que o perfil foi criado e está configurado como promotor
        user.refresh_from_db()
        profile = user.userprofile
        profile.role = 'promoter'
        profile.cpf = validated_data['cpf']
        profile.phone = validated_data['phone']
        profile.save()

        # Cria o promotor vinculado ao perfil
        promoter = PromoterModel.objects.create(
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            cpf=validated_data['cpf'],
            phone=validated_data['phone'],
            user_profile=profile
        )

        # Armazena a senha temporária para retornar na resposta
        promoter.temporary_password = temp_password

        return promoter
