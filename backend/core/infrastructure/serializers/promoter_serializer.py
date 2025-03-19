from rest_framework import serializers
from core.domain.entities.promoter import Promoter
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from ..models.user_profile_model import UserProfileModel
from ..models.promoter_model import PromoterModel
import logging
from django.db import transaction

logger = logging.getLogger(__name__)


class PromoterSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    name = serializers.CharField(read_only=True)
    cpf = serializers.CharField(min_length=11, max_length=11)
    phone = serializers.CharField(min_length=10, max_length=15)
    email = serializers.EmailField(required=True)
    user_id = serializers.IntegerField(read_only=True)
    temporary_password = serializers.CharField(read_only=True)

    def validate_cpf(self, value):
        """Valida se o CPF contém apenas números e se já não existe usuário/promotor"""
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

        # Verifica se já existe um promotor com este CPF
        if PromoterModel.objects.filter(cpf=cpf_numbers).exists():
            raise serializers.ValidationError(
                "Já existe um promotor cadastrado com este CPF."
            )

        return cpf_numbers

    def validate_phone(self, value):
        """Valida se o telefone contém apenas números"""
        # Remove caracteres especiais do telefone
        phone_numbers = ''.join(filter(str.isdigit, value))

        if len(phone_numbers) < 10 or len(phone_numbers) > 11:
            raise serializers.ValidationError(
                "Telefone deve ter entre 10 e 11 dígitos."
            )

        return phone_numbers

    def to_entity(self, validated_data) -> Promoter:
        """Converte os dados validados para uma entidade"""
        return Promoter(
            id=validated_data.get('id'),
            first_name=validated_data.get('first_name'),
            last_name=validated_data.get('last_name'),
            cpf=validated_data.get('cpf'),
            phone=validated_data.get('phone'),
            email=validated_data.get('email'),
            user_id=validated_data.get('user_id')
        )

    def create(self, validated_data):
        """Cria um novo promotor e seu usuário associado"""
        logger.info("Iniciando criação de promotor no serializer")
        email = validated_data.get('email')
        cpf = validated_data.get('cpf')
        temp_password = cpf[:6]  # Usa os 6 primeiros dígitos do CPF como senha

        try:
            logger.info(f"Criando usuário com CPF: {cpf} e email: {email}")
            # Cria o usuário com o CPF como username
            user = User.objects.create(
                username=cpf,
                first_name=validated_data.get('first_name'),
                last_name=validated_data.get('last_name'),
                email=email,
                password=make_password(temp_password)
            )

            logger.info(f"Usuário criado com ID: {user.id}")

            # Aguarda um momento para garantir que o signal tenha executado
            transaction.commit()

            # Recarrega o usuário para obter o perfil criado pelo signal
            user = User.objects.select_related('userprofile').get(id=user.id)

            if not hasattr(user, 'userprofile'):
                logger.error("Perfil não encontrado após criar usuário")
                raise serializers.ValidationError({
                    "cpf": ["Erro ao criar perfil do usuário."]
                })

            logger.info("Atualizando perfil do usuário...")
            profile = user.userprofile
            profile.role = 'promoter'
            profile.cpf = cpf
            profile.phone = validated_data.get('phone')
            profile.save()
            logger.info(f"Perfil atualizado com sucesso. ID: {profile.id}")

            # Cria o promotor vinculado ao perfil
            logger.info("Criando registro de promotor...")
            promoter = PromoterModel.objects.create(
                first_name=validated_data.get('first_name'),
                last_name=validated_data.get('last_name'),
                cpf=cpf,
                phone=validated_data.get('phone'),
                user_profile=profile
            )
            logger.info(f"Promotor criado com ID: {promoter.id}")

            # Retorna a entidade com os dados do usuário
            entity = self.to_entity(validated_data)
            entity.id = promoter.id
            entity.user_id = user.id
            entity.temporary_password = temp_password
            logger.info("Processo de criação concluído com sucesso")
            return entity

        except Exception as e:
            logger.error(
                f"Erro durante a criação do promotor/usuário: {str(e)}")
            # Se algo der errado, remove o usuário criado para evitar inconsistências
            if 'user' in locals():
                logger.info(f"Removendo usuário {user.id} devido a erro")
                user.delete()
            raise serializers.ValidationError({
                "cpf": ["Erro ao criar usuário/promotor. Por favor, tente novamente."]
            })

    def update(self, instance, validated_data):
        """Atualiza um promotor existente"""
        try:
            # Atualiza o promotor
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            # Se houver um usuário vinculado, atualiza seus dados também
            if instance.user_profile and instance.user_profile.user:
                user = instance.user_profile.user
                user.first_name = validated_data.get(
                    'first_name', user.first_name)
                user.last_name = validated_data.get(
                    'last_name', user.last_name)
                user.email = validated_data.get('email', user.email)
                user.save()

                profile = user.userprofile
                profile.phone = validated_data.get('phone', profile.phone)
                profile.save()

            # Retorna a entidade atualizada
            entity = self.to_entity(validated_data)
            entity.id = instance.id
            entity.user_id = instance.user_profile.user.id if instance.user_profile else None
            return entity

        except Exception as e:
            raise serializers.ValidationError({
                "error": str(e)
            })
