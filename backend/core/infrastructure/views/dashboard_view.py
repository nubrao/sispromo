from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from core.infrastructure.models.visit_model import VisitModel
from core.infrastructure.models.brand_model import BrandModel
from core.infrastructure.models.store_model import StoreModel
from core.infrastructure.models.user_model import User
from drf_spectacular.utils import extend_schema
import logging

logger = logging.getLogger(__name__)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get_promoter_dashboard(self, user):
        """Retorna dados do dashboard para promotores"""
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=6)

        # Busca visitas da semana atual
        visits = VisitModel.objects.filter(
            promoter=user,
            visit_date__range=[start_of_week, end_of_week]
        )

        # Calcula totais
        total_visits = visits.count()
        pending_visits = visits.filter(status=1).count()
        completed_visits = visits.filter(status=3).count()

        # Busca progresso por marca
        brands_progress = []
        for brand in BrandModel.objects.all():
            brand_visits = visits.filter(brand=brand)
            brand_progress = {
                'brand_id': brand.id,
                'brand_name': brand.name,
                'visits_done': brand_visits.filter(status=3).count(),
                'visits_pending': brand_visits.filter(status=1).count(),
                'total_visits': brand_visits.count()
            }
            brands_progress.append(brand_progress)

        # Busca próximas visitas pendentes
        pending_stores = VisitModel.objects.filter(
            promoter=user,
            status=1
        ).values(
            'store__id',
            'store__name',
            'store__number',
            'brand__name',
            'visit_date'
        ).order_by('visit_date')[:5]

        return {
            'total_visits': total_visits,
            'pending_visits': pending_visits,
            'completed_visits': completed_visits,
            'brands_progress': brands_progress,
            'pending_stores': pending_stores
        }

    def get_manager_dashboard(self):
        """Retorna dados do dashboard para gestores e analistas"""
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=6)

        # Busca visitas da semana atual
        visits = VisitModel.objects.filter(
            visit_date__range=[start_of_week, end_of_week]
        )

        # Calcula totais gerais
        total_visits = visits.count()
        total_completed = visits.filter(status=3).count()
        total_pending = visits.filter(status=1).count()

        # Progresso por marca
        brands_progress = []
        for brand in BrandModel.objects.all():
            brand_visits = visits.filter(brand=brand)
            brand_progress = {
                'brand_id': brand.id,
                'brand_name': brand.name,
                'visits_done': brand_visits.filter(status=3).count(),
                'visits_pending': brand_visits.filter(status=1).count(),
                'total_visits': brand_visits.count()
            }
            brands_progress.append(brand_progress)

        # Progresso por promotor
        promoters_progress = []
        promoters = User.objects.filter(role=1)  # Apenas promotores
        for promoter in promoters:
            promoter_visits = visits.filter(promoter=promoter)
            promoter_progress = {
                'promoter_id': promoter.id,
                'promoter_name': promoter.get_full_name(),
                'visits_done': promoter_visits.filter(status=3).count(),
                'visits_pending': promoter_visits.filter(status=1).count(),
                'total_visits': promoter_visits.count()
            }
            promoters_progress.append(promoter_progress)

        # Progresso por loja
        stores_progress = []
        for store in StoreModel.objects.all():
            store_visits = visits.filter(store=store)
            store_progress = {
                'store_id': store.id,
                'store_name': store.name,
                'store_number': store.number,
                'visits_done': store_visits.filter(status=3).count(),
                'visits_pending': store_visits.filter(status=1).count(),
                'total_visits': store_visits.count()
            }
            stores_progress.append(store_progress)

        return {
            'total_visits': total_visits,
            'total_completed': total_completed,
            'total_pending': total_pending,
            'brands_progress': brands_progress,
            'promoters_progress': promoters_progress,
            'stores_progress': stores_progress
        }

    @extend_schema(
        description="Retorna dados do dashboard baseado no papel do usuário",
        responses={
            200: {
                "type": "object",
                "properties": {
                    "total_visits": {"type": "integer"},
                    "pending_visits": {"type": "integer"},
                    "completed_visits": {"type": "integer"},
                    "brands_progress": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "brand_id": {"type": "integer"},
                                "brand_name": {"type": "string"},
                                "visits_done": {"type": "integer"},
                                "visits_pending": {"type": "integer"},
                                "total_visits": {"type": "integer"}
                            }
                        }
                    }
                }
            },
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    )
    def get(self, request):
        """
        Retorna dados do dashboard baseado no papel do usuário:
        - Promotores: veem apenas suas visitas e progresso
        - Analistas/Gestores: veem dados gerais de todas as visitas
        """
        try:
            user = request.user

            if user.role == 1:  # Promotor
                data = self.get_promoter_dashboard(user)
            else:  # Analista ou Gestor
                data = self.get_manager_dashboard()

            return Response(data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Erro ao gerar dados do dashboard: {e}")
            return Response(
                {"error": "Erro ao gerar dados do dashboard."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
