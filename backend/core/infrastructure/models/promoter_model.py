from django.db import models
from django.core.exceptions import ValidationError
from validate_docbr import CPF


def validate_cpf(value):
    cpf = CPF()
    if not cpf.validate(value):
        raise ValidationError("CPF inválido.")


class PromoterModel(models.Model):
    name = models.CharField(max_length=255)
    cpf = models.CharField(max_length=14, unique=True,
                           validators=[validate_cpf])
    phone = models.CharField(max_length=20)
    city = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        city_str = f" - {self.city}" if self.city else ""
        return f"{self.name}{city_str} - {self.cpf}"
