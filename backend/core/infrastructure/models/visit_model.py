from django.db import models
from core.infrastructure.models.promoter_model import PromoterModel
from core.infrastructure.models.store_model import StoreModel
from core.infrastructure.models.brand_model import BrandModel


class VisitModel(models.Model):
    promoter = models.ForeignKey(PromoterModel, on_delete=models.CASCADE)
    store = models.ForeignKey(StoreModel, on_delete=models.CASCADE)
    brand = models.ForeignKey(BrandModel, on_delete=models.CASCADE, null=False)
    visit_date = models.DateField()

    def __str__(self):
        return f"{self.promoter.name} - {self.store.name} - {self.brand.name} ({self.visit_date})"
