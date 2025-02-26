from rest_framework import viewsets
from core.infrastructure.models.visit_model import VisitModel
from core.infrastructure.serializers.visit_serializer import VisitSerializer
from rest_framework.permissions import IsAuthenticated


class VisitViewSet(viewsets.ModelViewSet):
    queryset = VisitModel.objects.select_related(
        "promoter", "store").all()
    serializer_class = VisitSerializer
    permission_classes = [IsAuthenticated]
