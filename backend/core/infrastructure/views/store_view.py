from rest_framework import viewsets
from core.infrastructure.models.store_model import StoreModel
from core.infrastructure.serializers.store_serializer import StoreSerializer
from rest_framework.permissions import IsAuthenticated


class StoreViewSet(viewsets.ModelViewSet):
    queryset = StoreModel.objects.all()
    serializer_class = StoreSerializer
    permission_classes = [IsAuthenticated]
