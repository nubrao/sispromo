from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.contrib.auth.base_user import BaseUserManager
from django.db import models
from django.utils import timezone


class CustomUserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError('O e-mail é obrigatório')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('status', 1)
        extra_fields.setdefault('role', 3)  # Manager
        return self.create_user(username, email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    STATUS_CHOICES = [
        (0, 'Inativo'),
        (1, 'Ativo'),
    ]

    ROLE_CHOICES = [
        (1, 'Promotor'),
        (2, 'Analista'),
        (3, 'Gestor'),
    ]

    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    cpf = models.CharField(max_length=14, unique=True)
    phone = models.CharField(max_length=15)

    # Campos de controle
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    status = models.IntegerField(choices=STATUS_CHOICES, default=1)
    role = models.IntegerField(choices=ROLE_CHOICES, default=1)

    # Campos de auditoria
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)
    last_password_change = models.DateTimeField(null=True, blank=True)
    failed_login_attempts = models.IntegerField(default=0)

    # Campos de recuperação de senha
    reset_token = models.CharField(max_length=100, null=True, blank=True)
    reset_token_expiry = models.DateTimeField(null=True, blank=True)

    # Campo de imagem de perfil
    profile_image = models.ImageField(
        upload_to='profile_images/', null=True, blank=True)

    # Relacionamentos
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name='custom_user_set',
        related_query_name='custom_user'
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='custom_user_set',
        related_query_name='custom_user'
    )

    objects = CustomUserManager()

    USERNAME_FIELD = 'username'
    EMAIL_FIELD = 'email'
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name', 'cpf', 'phone']

    class Meta:
        verbose_name = 'usuário'
        verbose_name_plural = 'usuários'
        db_table = 'users'

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    def save(self, *args, **kwargs):
        if self.password and (not self.pk or self._password_changed()):
            self.last_password_change = timezone.now()
        super().save(*args, **kwargs)

    def _password_changed(self):
        if not self.pk:
            return True
        old_password = User.objects.get(pk=self.pk).password
        return old_password != self.password

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    def get_short_name(self):
        return self.first_name

    @property
    def is_active_user(self):
        return self.status == 1

    def increment_failed_login(self):
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 3:
            self.status = 0  # Inativa o usuário após 3 tentativas falhas
        self.save(update_fields=['failed_login_attempts', 'status'])

    def reset_failed_login(self):
        self.failed_login_attempts = 0
        self.save(update_fields=['failed_login_attempts'])
