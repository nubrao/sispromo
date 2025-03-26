from django.db import models
from ..models.user_model import User
from .brand_model import BrandModel
from .store_model import StoreModel


class VisitModel(models.Model):
    STATUS_CHOICES = [
        (1, 'Pendente'),
        (2, 'Em Andamento'),
        (3, 'Concluída'),
        (4, 'Cancelada'),
    ]

    visit_date = models.DateField()
    status = models.BigIntegerField(choices=STATUS_CHOICES, default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    brand = models.ForeignKey(
        BrandModel,
        on_delete=models.CASCADE,
        related_name='visits'
    )
    promoter = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        limit_choices_to={'role': 1},
        related_name='promoter_visits'
    )
    store = models.ForeignKey(
        StoreModel,
        on_delete=models.CASCADE,
        related_name='visits'
    )

    class Meta:
        verbose_name = 'visita'
        verbose_name_plural = 'visitas'
        ordering = ['-visit_date']
        db_table = 'core_visitmodel'

    def __str__(self):
        return f'Visita {self.id} - {self.store.name} - {self.visit_date}'
