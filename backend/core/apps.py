from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'
    verbose_name = 'Sistema de Promoção'

    def ready(self):
        """Registra os sinais quando o app é inicializado"""
        from core.infrastructure.signals import user_profile_signals  # noqa: F401 E501
        from .infrastructure.models import (  # noqa: F401 E501
            user_profile_model,
            store_model,
            brand_model,
            promoter_model,
            promoter_brand_model,
            visit_model
        )
