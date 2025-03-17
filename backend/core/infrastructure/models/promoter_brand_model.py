from django.db import models
from .promoter_model import PromoterModel
from .brand_model import BrandModel


class PromoterBrandModel(models.Model):
    promoter = models.ForeignKey(
        PromoterModel,
        on_delete=models.CASCADE,
        related_name='brand_assignments'
    )
    brand = models.ForeignKey(
        BrandModel,
        on_delete=models.CASCADE,
        related_name='promoter_assignments'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'core_promoter_brand'
        unique_together = ('promoter', 'brand')
        ordering = ['promoter', 'brand']

    def __str__(self):
        return f"{self.promoter.name} - {self.brand.brand_name}"
