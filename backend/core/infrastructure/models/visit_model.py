from django.db import models
from django.conf import settings
from .store_model import StoreModel
from .brand_model import BrandModel


class VisitModel(models.Model):
    STATUS_CHOICES = [
        (1, 'Pendente'),
        (2, 'Em Andamento'),
        (3, 'Concluída'),
        (4, 'Cancelada')
    ]

    promoter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='promoter_visits',
        limit_choices_to={'role': 1}  # Apenas promotores
    )
    store = models.ForeignKey(
        StoreModel,
        on_delete=models.CASCADE,
        related_name='visits'
    )
    brand = models.ForeignKey(
        BrandModel,
        on_delete=models.CASCADE,
        related_name='visits'
    )
    visit_date = models.DateField()
    status = models.IntegerField(choices=STATUS_CHOICES, default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )

    def __str__(self):
        return (
            f"{self.promoter.get_full_name()} - "
            f"{self.store.name} - "
            f"{self.brand.name} ({self.visit_date})"
        )

    class Meta:
        db_table = 'visits'
        ordering = ['-visit_date']
        verbose_name = 'visita'
        verbose_name_plural = 'visitas'
