from django.db import models
from django.contrib.auth import get_user_model
from core.infrastructure.models.brand_model import BrandModel
from core.infrastructure.models.base_model import BaseModel

User = get_user_model()


class PromoterBrand(BaseModel):
    promoter = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='promoter_brands'
    )
    brand = models.ForeignKey(
        BrandModel,
        on_delete=models.CASCADE,
        related_name='promoter_brands'
    )

    class Meta:
        db_table = 'core_promoter_brand'
        unique_together = ('promoter', 'brand')
        verbose_name = 'Vínculo Promotor-Marca'
        verbose_name_plural = 'Vínculos Promotor-Marca'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.promoter.get_full_name()} - {self.brand.brand_name}"
