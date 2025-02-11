from rest_framework import serializers
from core.infrastructure.models.visit_model import VisitModel


class VisitSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitModel
        fields = '__all__'
