from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from django.contrib.auth.models import User
from ..models.user_profile_model import UserProfileModel


class UserProfileSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='get_role_display', read_only=True)
    role_value = serializers.CharField(source='role', read_only=True)

    class Meta:
        model = UserProfileModel
        fields = [
            'id', 'role', 'role_value', 'cpf', 'phone', 'is_active',
            'created_at', 'updated_at'
        ]


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(source='userprofile', read_only=True)
    name = serializers.SerializerMethodField()
    current_role = serializers.SerializerMethodField()
    userprofile_id = serializers.SerializerMethodField()
    username = serializers.SerializerMethodField()
    promoter_id = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    cpf = serializers.CharField(write_only=True, min_length=11, max_length=11)
    phone = serializers.CharField(
        write_only=True, min_length=10, max_length=15)
    role = serializers.CharField(write_only=True, default='promoter')
    is_active = serializers.BooleanField(write_only=True, default=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'email', 'password',
            'password_confirm', 'cpf', 'phone', 'role', 'is_active',
            'profile', 'name', 'current_role', 'userprofile_id',
            'username', 'promoter_id'
        ]

    def validate_cpf(self, value):
        """
        Valida se o CPF contém apenas números e se já não existe usuário.
        """
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
        """
        Valida se o telefone contém apenas números.
        """
        # Remove caracteres especiais do telefone
        phone_numbers = ''.join(filter(str.isdigit, value))

        if len(phone_numbers) < 10 or len(phone_numbers) > 11:
            raise serializers.ValidationError(
                "Telefone deve ter entre 10 e 11 dígitos."
            )

        return phone_numbers

    @extend_schema_field(serializers.CharField())
    def get_name(self, obj):
        """Retorna o nome completo do usuário"""
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

    @extend_schema_field(serializers.CharField())
    def get_current_role(self, obj):
        """Retorna o papel atual do usuário"""
        try:
            return obj.userprofile.role
        except UserProfileModel.DoesNotExist:
            return None

    @extend_schema_field(serializers.IntegerField())
    def get_userprofile_id(self, obj):
        """Retorna o ID do perfil do usuário"""
        try:
            return obj.userprofile.id
        except UserProfileModel.DoesNotExist:
            return None

    @extend_schema_field(serializers.CharField())
    def get_username(self, obj):
        """Retorna o username do usuário"""
        try:
            return obj.username
        except UserProfileModel.DoesNotExist:
            return None

    @extend_schema_field(serializers.IntegerField())
    def get_promoter_id(self, obj):
        """Retorna o ID do promotor se o usuário for um promotor"""
        try:
            if (obj.userprofile.role == 'promoter' and
                    hasattr(obj.userprofile, 'promoter')):
                return obj.userprofile.promoter.id
            return None
        except (UserProfileModel.DoesNotExist, AttributeError):
            return None

    def validate(self, data):
        if 'password' in data and 'password_confirm' in data:
            if data['password'] != data['password_confirm']:
                raise serializers.ValidationError({
                    'password_confirm': 'As senhas não coincidem.'
                })
        return data

    def create(self, validated_data):
        cpf = validated_data.pop('cpf')
        phone = validated_data.pop('phone')
        role = validated_data.pop('role', 'promoter')
        password = validated_data.pop('password')
        validated_data.pop('password_confirm', None)
        is_active = validated_data.pop('is_active', True)

        # Usa o CPF como username
        validated_data['username'] = cpf

        # Cria o usuário
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()

        # Garante que temos os dados mais recentes após o signal criar o perfil
        user.refresh_from_db()

        # Atualiza o perfil do usuário que foi criado automaticamente pelo signal # noqa: E501
        profile = user.userprofile
        profile.role = role
        profile.cpf = cpf
        profile.phone = phone
        profile.is_active = is_active
        profile.save()

        # Se o usuário for um promotor, cria automaticamente um registro na tabela de promotores # noqa: E501
        if role == 'promoter':
            from ..models.promoter_model import PromoterModel
            # Verifica se já existe um promotor com este CPF
            existing_promoter = PromoterModel.objects.filter(cpf=cpf).first()
            if existing_promoter:
                # Se existir, apenas vincula ao perfil
                existing_promoter.user_profile = profile
                existing_promoter.save()
            else:
                # Se não existir, cria um novo promotor
                PromoterModel.objects.create(
                    first_name=user.first_name,
                    last_name=user.last_name,
                    cpf=cpf,
                    phone=phone,
                    user_profile=profile
                )

        return user

    def update(self, instance, validated_data):
        """
        Atualiza um usuário existente.
        """
        # Remove campos que precisam de tratamento especial
        cpf = validated_data.pop('cpf', None)
        phone = validated_data.pop('phone', None)
        role = validated_data.pop('role', None)
        password = validated_data.pop('password', None)
        # Não precisamos mais disso
        validated_data.pop('password_confirm', None)
        is_active = validated_data.pop('is_active', None)

        # Atualiza os campos do usuário
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Atualiza a senha se fornecida
        if password:
            instance.set_password(password)

        # Salva as alterações do usuário
        instance.save()

        # Verifica se o usuário tem um perfil, se não tiver, cria um
        try:
            profile = instance.userprofile
        except UserProfileModel.DoesNotExist:
            # Se for superuser, cria como manager, senão como promoter
            default_role = 'manager' if instance.is_superuser else 'promoter'
            profile = UserProfileModel.objects.create(
                user=instance,
                role=default_role
            )

        # Atualiza os campos do perfil
        if cpf:
            instance.username = cpf  # Atualiza o username com o novo CPF
            profile.cpf = cpf
        if phone:
            profile.phone = phone
        if role and not instance.is_superuser:  # Só atualiza o papel se não for superuser
            profile.role = role
        if is_active is not None:
            profile.is_active = is_active

        # Salva as alterações do perfil
        profile.save()

        # Atualiza o promotor se o usuário for um promotor
        if profile.role == 'promoter' and hasattr(profile, 'promoter'):
            promoter = profile.promoter
            if cpf:
                promoter.cpf = cpf
            if phone:
                promoter.phone = phone
            promoter.save()

        # Recarrega o usuário para garantir que temos os dados atualizados
        instance.refresh_from_db()
        return instance


class UserUpdateSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(source='userprofile', read_only=True)
    name = serializers.SerializerMethodField()
    current_role = serializers.SerializerMethodField()
    userprofile_id = serializers.SerializerMethodField()
    username = serializers.SerializerMethodField()
    promoter_id = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False)
    password_confirm = serializers.CharField(write_only=True, required=False)
    cpf = serializers.CharField(
        write_only=True, min_length=11, max_length=11, required=False)
    phone = serializers.CharField(
        write_only=True, min_length=10, max_length=15, required=False)
    role = serializers.CharField(write_only=True, required=False)
    is_active = serializers.BooleanField(write_only=True, required=False)
    email = serializers.EmailField(required=False)

    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'email', 'password',
            'password_confirm', 'cpf', 'phone', 'role', 'is_active',
            'profile', 'name', 'current_role', 'userprofile_id',
            'username', 'promoter_id'
        ]

    def validate(self, data):
        """
        Valida se as senhas coincidem quando ambas são fornecidas.
        """
        if 'password' in data and 'password_confirm' in data:
            if data['password'] != data['password_confirm']:
                raise serializers.ValidationError({
                    'password_confirm': 'As senhas não coincidem.'
                })
        elif 'password' in data and 'password_confirm' not in data:
            raise serializers.ValidationError({
                'password_confirm': 'A confirmação da senha é obrigatória.'
            })
        elif 'password_confirm' in data and 'password' not in data:
            raise serializers.ValidationError({
                'password': 'A senha é obrigatória.'
            })
        return data

    def validate_cpf(self, value):
        """
        Valida se o CPF contém apenas números e se já não existe usuário.
        """
        # Remove caracteres especiais do CPF
        cpf_numbers = ''.join(filter(str.isdigit, value))

        if len(cpf_numbers) != 11:
            raise serializers.ValidationError(
                "CPF deve conter 11 dígitos numéricos."
            )

        # Verifica se já existe um usuário com este CPF como username
        existing_user = User.objects.filter(username=cpf_numbers).first()
        if existing_user and existing_user != self.instance:
            raise serializers.ValidationError(
                "Já existe um usuário cadastrado com este CPF."
            )

        return cpf_numbers

    def update(self, instance, validated_data):
        """
        Atualiza um usuário existente.
        """
        # Remove campos que precisam de tratamento especial
        cpf = validated_data.pop('cpf', None)
        phone = validated_data.pop('phone', None)
        role = validated_data.pop('role', None)
        password = validated_data.pop('password', None)
        # Não precisamos mais disso
        validated_data.pop('password_confirm', None)
        is_active = validated_data.pop('is_active', None)

        # Atualiza os campos do usuário
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Atualiza a senha se fornecida
        if password:
            instance.set_password(password)

        # Salva as alterações do usuário
        instance.save()

        # Verifica se o usuário tem um perfil, se não tiver, cria um
        try:
            profile = instance.userprofile
        except UserProfileModel.DoesNotExist:
            # Se for superuser, cria como manager, senão como promoter
            default_role = 'manager' if instance.is_superuser else 'promoter'
            profile = UserProfileModel.objects.create(
                user=instance,
                role=default_role
            )

        # Atualiza os campos do perfil
        if cpf:
            instance.username = cpf  # Atualiza o username com o novo CPF
            profile.cpf = cpf
        if phone:
            profile.phone = phone
        if role and not instance.is_superuser:  # Só atualiza o papel se não for superuser
            profile.role = role
        if is_active is not None:
            profile.is_active = is_active

        # Salva as alterações do perfil
        profile.save()

        # Atualiza o promotor se o usuário for um promotor
        if profile.role == 'promoter' and hasattr(profile, 'promoter'):
            promoter = profile.promoter
            if cpf:
                promoter.cpf = cpf
            if phone:
                promoter.phone = phone
            promoter.save()

        # Recarrega o usuário para garantir que temos os dados atualizados
        instance.refresh_from_db()
        return instance

    @extend_schema_field(serializers.CharField())
    def get_name(self, obj):
        """Retorna o nome completo do usuário"""
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

    @extend_schema_field(serializers.CharField())
    def get_current_role(self, obj):
        """Retorna o papel atual do usuário"""
        try:
            return obj.userprofile.role
        except UserProfileModel.DoesNotExist:
            return None

    @extend_schema_field(serializers.IntegerField())
    def get_userprofile_id(self, obj):
        """Retorna o ID do perfil do usuário"""
        try:
            return obj.userprofile.id
        except UserProfileModel.DoesNotExist:
            return None

    @extend_schema_field(serializers.CharField())
    def get_username(self, obj):
        """Retorna o username do usuário"""
        try:
            return obj.username
        except UserProfileModel.DoesNotExist:
            return None

    @extend_schema_field(serializers.IntegerField())
    def get_promoter_id(self, obj):
        """Retorna o ID do promotor se o usuário for um promotor"""
        try:
            if (obj.userprofile.role == 'promoter' and
                    hasattr(obj.userprofile, 'promoter')):
                return obj.userprofile.promoter.id
            return None
        except (UserProfileModel.DoesNotExist, AttributeError):
            return None
