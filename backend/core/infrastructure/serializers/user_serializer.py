from rest_framework import serializers
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes

User = get_user_model()


class BaseUserSerializer(serializers.ModelSerializer):
    """Serializador base para usuários com campos comuns"""
    role_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    full_name = serializers.CharField(source='get_full_name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'is_active', 'is_staff', 'role', 'role_display',
            'status', 'status_display', 'created_at', 'updated_at',
            'last_login', 'phone', 'cpf'
        ]
        read_only_fields = [
            'id', 'last_login', 'is_staff', 'role_display',
            'status_display', 'full_name', 'created_at', 'updated_at'
        ]

    @extend_schema_field(OpenApiTypes.STR)
    def get_role_display(self, obj) -> str:
        return dict(User.ROLE_CHOICES).get(obj.role, '')

    @extend_schema_field(OpenApiTypes.STR)
    def get_status_display(self, obj) -> str:
        return dict(User.STATUS_CHOICES).get(obj.status, '')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['is_active'] = bool(data['is_active'])
        data['is_staff'] = bool(data['is_staff'])
        return data


class UserSerializer(BaseUserSerializer):
    """Serializador para leitura de usuários"""
    pass


class UserCreateSerializer(BaseUserSerializer):
    """Serializador para criação de usuários"""
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    class Meta(BaseUserSerializer.Meta):
        fields = BaseUserSerializer.Meta.fields + \
            ['password', 'password_confirm']

    def validate_cpf(self, value):
        """
        Valida o CPF usando a validação do modelo User
        """
        try:
            if User.objects.filter(cpf=value).exists():
                raise serializers.ValidationError(
                    "Já existe um usuário cadastrado com este CPF")
            return value
        except Exception as e:
            raise serializers.ValidationError(str(e))

    def validate(self, data):
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError({
                'password_confirm': 'As senhas não coincidem.'
            })
        return data

    def create(self, validated_data):
        # Remove campos que não pertencem ao modelo User
        validated_data.pop('password_confirm')

        # Define valores padrão
        # Usa CPF como username
        validated_data['username'] = validated_data['cpf']
        validated_data['role'] = 1  # Promotor por padrão
        validated_data['status'] = 1  # Ativo por padrão

        # Cria o usuário
        user = User.objects.create_user(**validated_data)
        return user


class UserUpdateSerializer(BaseUserSerializer):
    """Serializador para atualização de usuários"""
    password = serializers.CharField(write_only=True, required=False)
    password_confirm = serializers.CharField(write_only=True, required=False)

    class Meta(BaseUserSerializer.Meta):
        fields = BaseUserSerializer.Meta.fields + \
            ['password', 'password_confirm']

    def validate_cpf(self, value):
        """
        Valida o CPF
        """
        try:
            existing_user = User.objects.filter(cpf=value).first()
            if existing_user and existing_user != self.instance:
                raise serializers.ValidationError(
                    "Já existe um usuário cadastrado com este CPF")
            return value
        except Exception as e:
            raise serializers.ValidationError(str(e))

    def validate(self, data):
        if 'password' in data and 'password_confirm' in data:
            if data['password'] != data['password_confirm']:
                raise serializers.ValidationError({
                    'password_confirm': 'As senhas não coincidem.'
                })
        return data

    def update(self, instance, validated_data):
        # Remove campos que precisam de tratamento especial
        password = validated_data.pop('password', None)
        validated_data.pop('password_confirm', None)

        # Atualiza o username se o CPF foi alterado
        if 'cpf' in validated_data:
            validated_data['username'] = validated_data['cpf']

        # Atualiza os campos do usuário
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Atualiza a senha se fornecida
        if password:
            instance.set_password(password)

        # Salva as alterações do usuário
        instance.save()
        return instance
