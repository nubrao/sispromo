from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'
    verbose_name = 'SisPromo'

    def ready(self):
        """Registra os modelos quando o app é inicializado"""
        from .infrastructure.models import (  # noqa: F401 E501
            store_model,
            brand_model,
            visit_model,
            visit_price_model,
            user_model,
            state_model
        )
