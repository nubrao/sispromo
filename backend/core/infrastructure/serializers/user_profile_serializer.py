from rest_framework import serializers
from django.contrib.auth.models import User
from ..models.user_profile_model import UserProfile
from ..models.promoter_model import PromoterModel


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['role']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(source='userprofile', read_only=True)
    role = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=True)
    password_confirm = serializers.CharField(write_only=True, required=True)
    cpf = serializers.CharField(write_only=True, required=True)
    phone = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'password_confirm',
                  'first_name', 'last_name', 'profile', 'role', 'cpf', 'phone']
        read_only_fields = ['id']

    def validate(self, data):
        if 'password' in data and 'password_confirm' in data:
            if data['password'] != data['password_confirm']:
                raise serializers.ValidationError({
                    'password_confirm': 'As senhas não coincidem.'
                })
        return data

    def create(self, validated_data):
        # Removendo campos extras antes de criar o usuário
        role = validated_data.pop('role', 'promoter')
        cpf = validated_data.pop('cpf')
        phone = validated_data.pop('phone')
        validated_data.pop('password_confirm', None)
        password = validated_data.pop('password')

        # Criando o usuário
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()

        # Criando o perfil do usuário
        profile = user.userprofile
        profile.role = role
        profile.save()

        # Criando o promotor associado
        PromoterModel.objects.create(
            name=f"{user.first_name} {user.last_name}",
            cpf=cpf,
            phone=phone
        )

        return user

    def update(self, instance, validated_data):
        role = validated_data.pop('role', None)
        if role:
            profile = instance.userprofile
            profile.role = role
            profile.save()

        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)

        return super().update(instance, validated_data)
