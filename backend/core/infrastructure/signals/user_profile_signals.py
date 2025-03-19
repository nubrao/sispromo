from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from core.infrastructure.models.user_profile_model import UserProfileModel
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Cria um perfil de usuário quando um novo usuário é criado"""
    if created:
        logger.info(f"Criando perfil para novo usuário: {instance.username}")
        try:
            # Verifica se já existe um perfil
            if not hasattr(instance, 'userprofile'):
                UserProfileModel.objects.create(user=instance)
                logger.info(
                    f"Perfil criado com sucesso para: {instance.username}")
            else:
                logger.info(f"Perfil já existe para: {instance.username}")
        except Exception as e:
            logger.error(
                f"Erro ao criar perfil para {instance.username}: {str(e)}")
            raise


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Salva o perfil do usuário quando o usuário é atualizado"""
    try:
        # Verifica se já existe um perfil
        if hasattr(instance, 'userprofile'):
            logger.info(f"Atualizando perfil do usuário: {instance.username}")
            instance.userprofile.save()
            logger.info(
                f"Perfil atualizado com sucesso para: {instance.username}")
        else:
            logger.warning(f"Perfil não encontrado para {instance.username}")
            # Não cria um novo perfil aqui, pois o primeiro signal já deve ter feito isso
    except Exception as e:
        logger.error(
            f"Erro ao salvar perfil para {instance.username}: {str(e)}")
        raise
