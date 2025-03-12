from django.db import models
from django.core.exceptions import ObjectDoesNotExist
from core.infrastructure.models.promoter_model import PromoterModel
from core.infrastructure.models.store_model import StoreModel
from core.infrastructure.models.brand_model import BrandModel
from core.infrastructure.models.visit_price_model import VisitPriceModel


class VisitModel(models.Model):
    promoter = models.ForeignKey(PromoterModel, on_delete=models.CASCADE)
    store = models.ForeignKey(StoreModel, on_delete=models.CASCADE)
    brand = models.ForeignKey(BrandModel, on_delete=models.CASCADE, null=False)
    visit_date = models.DateField()
    price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )

    def save(self, *args, **kwargs):
        """
        Preenche automaticamente o preço da visita com base na loja e marca.
        """
        if not self.price:  # Apenas define se não foi manualmente preenchido
            try:
                visit_price = VisitPriceModel.objects.get(
                    store=self.store, brand=self.brand)
                self.price = visit_price.price
            except ObjectDoesNotExist:
                self.price = None  # Se não houver preço definido, deixa nulo

        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.promoter.name} - {self.store.name} - "
            f"{self.brand.name} ({self.visit_date})"
        )
