from django.db import models
from core.infrastructure.models.store_model import StoreModel
from core.infrastructure.models.brand_model import BrandModel


class VisitPriceModel(models.Model):
    store = models.ForeignKey(
        StoreModel, on_delete=models.CASCADE, related_name="visit_prices")
    brand = models.ForeignKey(
        BrandModel, on_delete=models.CASCADE, related_name="visit_prices")
    price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = ("store", "brand")

    def __str__(self):
        return f"{self.store.name} - {self.brand.name}: R$ {self.price}"
