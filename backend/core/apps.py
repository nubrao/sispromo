from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        from .infrastructure.models import (
            user_profile_model,
            store_model,
            brand_model,
            promoter_model,
            promoter_brand_model,
            visit_model
        )
