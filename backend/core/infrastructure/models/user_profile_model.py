from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError
from validate_docbr import CPF


def validate_cpf(value):
    if not value:
        return
    cpf = CPF()
    if not cpf.validate(value):
        raise ValidationError("CPF inválido.")


def validate_phone(value):
    if not value:
        return
    # Remove todos os caracteres não numéricos
    phone_numbers = ''.join(filter(str.isdigit, value))
    if len(phone_numbers) < 10 or len(phone_numbers) > 11:
        raise ValidationError("Telefone deve ter entre 10 e 11 dígitos.")


class UserProfileModel(models.Model):
    ROLE_CHOICES = [
        ('promoter', 'Promotor'),
        ('analyst', 'Analista'),
        ('manager', 'Gestor'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='userprofile'
    )
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='promoter'
    )
    cpf = models.CharField(
        max_length=11,
        null=True,
        blank=True,
        validators=[validate_cpf]
    )
    phone = models.CharField(
        max_length=11,
        null=True,
        blank=True,
        validators=[validate_phone]
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reset_token = models.CharField(max_length=64, null=True, blank=True)
    reset_token_expiry = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"

    class Meta:
        db_table = 'core_userprofile'
        ordering = ['user__username']


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Cria um perfil para o usuário quando ele é criado"""
    if created:
        UserProfileModel.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Salva o perfil do usuário"""
    try:
        instance.userprofile.save()
    except UserProfileModel.DoesNotExist:
        UserProfileModel.objects.create(user=instance)
