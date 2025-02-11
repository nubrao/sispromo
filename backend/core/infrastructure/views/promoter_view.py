from rest_framework import viewsets
from core.infrastructure.models.promoter_model import PromoterModel
from core.infrastructure.serializers.promoter_serializer import PromoterSerializer
from rest_framework.permissions import IsAuthenticated


class PromoterViewSet(viewsets.ModelViewSet):
    queryset = PromoterModel.objects.all()
    serializer_class = PromoterSerializer
    permission_classes = [IsAuthenticated]
