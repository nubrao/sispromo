from django.db import models
from django.core.exceptions import ValidationError
from validate_docbr import CNPJ
from .state_model import StateChoices


def validate_cnpj(value):
    if not value:  # Se o valor for vazio, retorna sem validar
        return
    cnpj = CNPJ()
    if not cnpj.validate(value):
        raise ValidationError("CNPJ inválido.")


class StoreModel(models.Model):
    name = models.CharField(max_length=255)
    number = models.IntegerField(null=True, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(
        max_length=2,
        choices=StateChoices.choices,
        default=StateChoices.SP
    )
    cnpj = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        validators=[validate_cnpj]
    )

    def __str__(self):
        store_number = f" - {self.number}" if self.number else ""
        return f"{self.name}{store_number} - {self.city}/{self.state}"
