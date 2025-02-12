from django.db import models
from core.infrastructure.models.state_model import StateChoices
from django.core.exceptions import ValidationError
from validate_docbr import CNPJ


def validate_cnpj(value):
    cnpj = CNPJ()
    if not cnpj.validate(value):
        raise ValidationError("Invalid CNPJ.")


class StoreModel(models.Model):
    name = models.CharField(max_length=255)
    number = models.IntegerField(null=True, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(
        max_length=2,
        choices=StateChoices.choices,
        default=StateChoices.SP
    )
    cnpj = models.CharField(max_length=20, unique=True,
                            validators=[validate_cnpj])

    def __str__(self):
        return f"{self.name} - {self.state}"
