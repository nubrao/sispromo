from django.db import models


class StoreModel(models.Model):
    name = models.CharField(max_length=255)
    number = models.IntegerField(null=True, blank=True)
    city = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    cnpj = models.CharField(max_length=20, unique=True)
