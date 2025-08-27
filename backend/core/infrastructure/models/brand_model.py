from django.db import models


class BrandModel(models.Model):
    name = models.CharField(max_length=255)
    stores = models.ManyToManyField(
        'core.StoreModel', through="BrandStore", related_name="brands")

    def __str__(self):
        return self.name


class BrandStore(models.Model):
    brand = models.ForeignKey(BrandModel, on_delete=models.CASCADE)
    store = models.ForeignKey('core.StoreModel', on_delete=models.CASCADE)
    visit_frequency = models.IntegerField(
        default=1)

    class Meta:
        unique_together = ('brand', 'store')
