from django.db import models
from core.infrastructure.models.promoter_model import PromoterModel
from core.infrastructure.models.store_model import StoreModel


class VisitModel(models.Model):
    promoter = models.ForeignKey(PromoterModel, on_delete=models.CASCADE)
    store = models.ForeignKey(StoreModel, on_delete=models.CASCADE)
    brand = models.CharField(max_length=255)
    visit_date = models.DateTimeField()
