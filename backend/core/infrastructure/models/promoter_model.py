from django.db import models
from django.core.exceptions import ValidationError
from validate_docbr import CPF


def validate_cpf(value):
    cpf = CPF()
    if not cpf.validate(value):
        raise ValidationError("Invalid CPF.")


class PromoterModel(models.Model):
    name = models.CharField(max_length=255)
    cpf = models.CharField(max_length=14, unique=True,
                           validators=[validate_cpf])
    phone = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.name} - {self.cpf}"
