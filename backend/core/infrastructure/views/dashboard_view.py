from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes
from ..repositories.dashboard_repository import DashboardRepository
from ..serializers.dashboard_serializer import DashboardSerializer
import logging

logger = logging.getLogger(__name__)

class DashboardView(APIView):
    """
    View para obter dados do dashboard
    """
    permission_classes = [IsAuthenticated]
    serializer_class = DashboardSerializer

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.repository = DashboardRepository()

    @extend_schema(
        description="Obtém os dados do dashboard baseado no papel do usuário",
        responses={
            200: DashboardSerializer,
            401: OpenApiTypes.STR,
            403: OpenApiTypes.STR,
            500: OpenApiTypes.STR
        },
        tags=['Dashboard']
    )
    def get(self, request):
        """
        Retorna os dados do dashboard baseado no papel do usuário.
        Para promotores: retorna apenas seus dados.
        Para analistas e gestores: retorna todos os dados.
        """
        try:
            today = timezone.now().date()
            start_of_week = today - timedelta(days=today.weekday())
            end_of_week = start_of_week + timedelta(days=6)

            if request.user.role == 1:  # Promoter
                dashboard_data = self.repository.get_promoter_dashboard(
                    user_id=request.user.id,
                    start_date=start_of_week,
                    end_date=end_of_week
                )
            else:  # Manager or Analyst
                dashboard_data = self.repository.get_manager_dashboard(
                    start_date=start_of_week,
                    end_date=end_of_week
                )

            serializer = self.serializer_class(dashboard_data)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Erro ao gerar dados do dashboard: {e}")
            return Response(
                {"error": "Erro ao gerar dados do dashboard."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
