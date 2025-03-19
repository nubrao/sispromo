"""
Este arquivo está sendo descontinuado.
Os campos do PromoterModel foram movidos para o UserProfile.
"""

from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from validate_docbr import CPF
from .user_profile_model import UserProfileModel
import logging

logger = logging.getLogger(__name__)


def validate_cpf(value):
    cpf = CPF()
    if not cpf.validate(value):
        raise ValidationError("CPF inválido.")


class PromoterModel(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    cpf = models.CharField(max_length=14, unique=True,
                           validators=[validate_cpf])
    phone = models.CharField(max_length=20)
    user_profile = models.OneToOneField(
        UserProfileModel,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='promoter'
    )

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.cpf}"

    @property
    def name(self):
        """Retorna o nome completo do promotor"""
        return f"{self.first_name} {self.last_name}".strip()

    def save(self, *args, **kwargs):
        logger.info(f"Salvando promotor com CPF: {self.cpf}")
        # Se o promotor está sendo criado e tem CPF
        if not self.pk and self.cpf:
            logger.info(
                "Novo promotor sendo criado, procurando usuário existente")
            try:
                # Tenta encontrar um usuário com o mesmo CPF no username
                user = User.objects.get(username=self.cpf)
                logger.info(f"Usuário encontrado com CPF {self.cpf}")
                # Se encontrar, vincula o promotor ao perfil do usuário
                self.user_profile = user.userprofile
                logger.info(
                    "Promotor vinculado ao perfil do usuário existente")
            except User.DoesNotExist:
                logger.info(
                    "Usuário não encontrado, procurando perfil de promotor disponível")  # noqa: E501
                # Se não encontrar, tenta encontrar um usuário com role de promotor sem promotor vinculado   # noqa: E501
                try:
                    user_profile = UserProfileModel.objects.get(
                        role='promoter',
                        promoter__isnull=True
                    )
                    self.user_profile = user_profile
                    logger.info("Promotor vinculado a perfil disponível")
                except UserProfileModel.DoesNotExist:
                    logger.info(
                        "Nenhum perfil de promotor disponível encontrado")
                    pass

        super().save(*args, **kwargs)
        logger.info(f"Promotor salvo com sucesso. ID: {self.pk}")

    @classmethod
    def get_promoter_by_user(cls, user):
        """Retorna o promotor associado ao usuário"""
        try:
            return cls.objects.get(user_profile=user.userprofile)
        except cls.DoesNotExist:
            return None

    @classmethod
    def link_promoter_to_user(cls, promoter_id, user_id):
        """Vincula um promotor a um usuário específico"""
        try:
            promoter = cls.objects.get(id=promoter_id)
            user = User.objects.get(id=user_id)
            promoter.user_profile = user.userprofile
            promoter.save()
            return True
        except (cls.DoesNotExist, User.DoesNotExist):
            return False

    @classmethod
    def auto_link_promoters(cls):
        """Vincula automaticamente promotores disponíveis a usuários promotores sem vínculo"""  # noqa: E501
        # Obtém todos os promotores sem vínculo
        available_promoters = cls.objects.filter(user_profile__isnull=True)

        # Obtém todos os usuários promotores sem vínculo
        unlinked_promoter_users = UserProfileModel.objects.filter(
            role='promoter',
            promoter__isnull=True
        )

        # Para cada usuário promotor sem vínculo
        for user_profile in unlinked_promoter_users:
            # Se houver promotores disponíveis
            if available_promoters.exists():
                # Pega o primeiro promotor disponível
                promoter = available_promoters.first()
                # Vincula o promotor ao perfil do usuário
                promoter.user_profile = user_profile
                promoter.save()
                # Remove o promotor da lista de disponíveis
                available_promoters = available_promoters.exclude(
                    id=promoter.id)

        return True
