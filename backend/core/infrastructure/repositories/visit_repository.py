from typing import List, Optional
from datetime import datetime
from django.db.models import QuerySet
from core.domain.repositories.visit_repository import VisitRepository
from core.domain.entities.visit import Visit
from core.infrastructure.models.visit_model import VisitModel
from core.infrastructure.models.promoter_model import PromoterModel
from core.infrastructure.cache.cache_config import CacheConfig


class DjangoVisitRepository(VisitRepository):
    def get_by_id(self, visit_id: int) -> Optional[Visit]:
        """Busca uma visita pelo ID, primeiro no cache, depois no banco"""
        cache_key = CacheConfig.get_key(CacheConfig.VISIT_PREFIX, visit_id)
        cached_visit = CacheConfig.get(cache_key)

        if cached_visit:
            return self._to_entity(cached_visit)

        try:
            visit = VisitModel.objects.get(id=visit_id)
            CacheConfig.set(cache_key, visit)
            return self._to_entity(visit)
        except VisitModel.DoesNotExist:
            return None

    def create(self, visit: Visit) -> Visit:
        """Cria uma nova visita"""
        visit_model = VisitModel(
            promoter_id=visit.promoter_id,
            store_id=visit.store_id,
            brand_id=visit.brand_id,
            visit_date=visit.visit_date
        )
        visit_model.save()

        # Atualiza o cache
        cache_key = CacheConfig.get_key(
            CacheConfig.VISIT_PREFIX, visit_model.id)
        CacheConfig.set(cache_key, visit_model)

        return self._to_entity(visit_model)

    def update(self, visit: Visit) -> Visit:
        """Atualiza uma visita existente"""
        try:
            visit_model = VisitModel.objects.get(id=visit.id)
            visit_model.promoter_id = visit.promoter_id
            visit_model.store_id = visit.store_id
            visit_model.brand_id = visit.brand_id
            visit_model.visit_date = visit.visit_date
            visit_model.save()

            # Atualiza o cache
            cache_key = CacheConfig.get_key(CacheConfig.VISIT_PREFIX, visit.id)
            CacheConfig.set(cache_key, visit_model)

            return self._to_entity(visit_model)
        except VisitModel.DoesNotExist:
            raise ValueError(f"Visita com ID {visit.id} não encontrada")

    def delete(self, visit_id: int) -> None:
        """Remove uma visita"""
        try:
            visit = VisitModel.objects.get(id=visit_id)
            visit.delete()

            # Remove do cache
            cache_key = CacheConfig.get_key(CacheConfig.VISIT_PREFIX, visit_id)
            CacheConfig.delete(cache_key)
        except VisitModel.DoesNotExist:
            raise ValueError(f"Visita com ID {visit_id} não encontrada")

    def list_all(self) -> List[Visit]:
        """Lista todas as visitas"""
        visits = VisitModel.objects.all()
        return [self._to_entity(visit) for visit in visits]

    def get_visits_by_filters(
        self,
        promoter_id: Optional[int] = None,
        store_id: Optional[int] = None,
        brand_id: Optional[int] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> List[Visit]:
        """
        Busca visitas aplicando filtros

        Args:
            promoter_id: ID do promotor
            store_id: ID da loja
            brand_id: ID da marca
            start_date: Data inicial (YYYY-MM-DD)
            end_date: Data final (YYYY-MM-DD)
            user_id: ID do usuário (para filtrar visitas de um promotor específico)
        """
        queryset = VisitModel.objects.select_related(
            "promoter", "store", "brand"
        ).all()

        if user_id:
            try:
                promoter = PromoterModel.objects.get(
                    user_profile__user_id=user_id
                )
                queryset = queryset.filter(promoter=promoter)
            except PromoterModel.DoesNotExist:
                return []

        if promoter_id:
            queryset = queryset.filter(promoter_id=promoter_id)
        if store_id:
            queryset = queryset.filter(store_id=store_id)
        if brand_id:
            queryset = queryset.filter(brand_id=brand_id)
        if start_date:
            queryset = queryset.filter(visit_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(visit_date__lte=end_date)

        return [self._to_entity(visit) for visit in queryset]

    def get_visits_for_dashboard(
        self,
        start_date: datetime,
        end_date: datetime,
        user_id: Optional[int] = None
    ) -> QuerySet:
        """
        Retorna visitas para o dashboard com métricas

        Args:
            start_date: Data inicial
            end_date: Data final
            user_id: ID do usuário (para filtrar visitas de um promotor)
        """
        queryset = VisitModel.objects.filter(
            visit_date__gte=start_date,
            visit_date__lte=end_date
        ).select_related("promoter", "store", "brand")

        if user_id:
            try:
                promoter = PromoterModel.objects.get(
                    user_profile__user_id=user_id
                )
                queryset = queryset.filter(promoter=promoter)
            except PromoterModel.DoesNotExist:
                return VisitModel.objects.none()

        return queryset

    def _to_entity(self, model: VisitModel) -> Visit:
        """Converte um modelo do Django para uma entidade do domínio"""
        return Visit(
            id=model.id,
            promoter_id=model.promoter_id,
            store_id=model.store_id,
            brand_id=model.brand_id,
            visit_date=str(model.visit_date)
        )
