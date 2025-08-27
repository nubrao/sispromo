from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'
    verbose_name = 'SisPromo'

    def ready(self):
        """Registra os modelos quando o app é inicializado"""
        # Importa o modelo User primeiro
        from .infrastructure.models.user_model import User  # noqa: F401

        # Depois importa os outros modelos
        from .infrastructure.models import (  # noqa: F401
            state_model,
            store_model,
            brand_model,
            visit_model,
            visit_price_model,
        )
