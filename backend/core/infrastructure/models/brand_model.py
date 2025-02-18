from django.db import models
from core.infrastructure.models.promoter_model import PromoterModel
from core.infrastructure.models.store_model import StoreModel


class BrandModel(models.Model):
    name = models.CharField(max_length=255)
    promoters = models.ManyToManyField(PromoterModel, related_name="brands")
    stores = models.ManyToManyField(
        StoreModel, through="BrandStore", related_name="brands")

    def __str__(self):
        return self.name


class BrandStore(models.Model):
    brand = models.ForeignKey(BrandModel, on_delete=models.CASCADE)
    store = models.ForeignKey(StoreModel, on_delete=models.CASCADE)
    visit_frequency = models.IntegerField(
        default=1)

    class Meta:
        unique_together = ('brand', 'store')
