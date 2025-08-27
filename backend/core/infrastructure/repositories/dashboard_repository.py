from datetime import datetime, timedelta
from django.db.models import Count
from ..domain.entities.dashboard import (
    DashboardData, BrandProgress, StoreProgress, PromoterProgress
)
from ..models.visit_model import VisitModel
from ..models.brand_model import BrandModel
from ..models.store_model import StoreModel
from ..models.user_model import User

class DashboardRepository:
    def get_promoter_dashboard(self, user_id: int, start_date: datetime, end_date: datetime) -> DashboardData:
        visits = VisitModel.objects.filter(
            promoter_id=user_id,
            visit_date__range=[start_date, end_date]
        )

        brands_progress = [
            BrandProgress(
                brand_id=brand.id,
                brand_name=brand.name,
                visits_done=visits.filter(brand=brand, status=3).count(),
                visits_pending=visits.filter(brand=brand, status=1).count(),
                total_visits=visits.filter(brand=brand).count()
            )
            for brand in BrandModel.objects.all()
        ]

        return DashboardData(
            total_visits=visits.count(),
            total_completed=visits.filter(status=3).count(),
            total_pending=visits.filter(status=1).count(),
            brands_progress=brands_progress,
            promoters_progress=[],
            stores_progress=[]
        )

    def get_manager_dashboard(self, start_date: datetime, end_date: datetime) -> DashboardData:
        visits = VisitModel.objects.filter(
            visit_date__range=[start_date, end_date]
        )

        brands_progress = [
            BrandProgress(
                brand_id=brand.id,
                brand_name=brand.name,
                visits_done=visits.filter(brand=brand, status=3).count(),
                visits_pending=visits.filter(brand=brand, status=1).count(),
                total_visits=visits.filter(brand=brand).count()
            )
            for brand in BrandModel.objects.all()
        ]

        promoters_progress = [
            PromoterProgress(
                promoter_id=promoter.id,
                promoter_name=f"{promoter.first_name} {promoter.last_name}",
                visits_done=visits.filter(promoter=promoter, status=3).count(),
                visits_pending=visits.filter(promoter=promoter, status=1).count(),
                total_visits=visits.filter(promoter=promoter).count()
            )
            for promoter in User.objects.filter(role=1)
        ]

        stores_progress = [
            StoreProgress(
                store_id=store.id,
                store_name=store.name,
                store_number=store.number,
                visits_done=visits.filter(store=store, status=3).count(),
                visits_pending=visits.filter(store=store, status=1).count(),
                total_visits=visits.filter(store=store).count()
            )
            for store in StoreModel.objects.all()
        ]

        return DashboardData(
            total_visits=visits.count(),
            total_completed=visits.filter(status=3).count(),
            total_pending=visits.filter(status=1).count(),
            brands_progress=brands_progress,
            promoters_progress=promoters_progress,
            stores_progress=stores_progress
        )