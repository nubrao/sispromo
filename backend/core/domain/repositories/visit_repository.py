from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime
from core.domain.entities.visit import Visit


class VisitRepository(ABC):
    @abstractmethod
    def get_by_id(self, visit_id: int) -> Optional[Visit]:
        """Busca uma visita pelo ID"""
        pass

    @abstractmethod
    def create(self, visit: Visit) -> Visit:
        """Cria uma nova visita"""
        pass

    @abstractmethod
    def update(self, visit: Visit) -> Visit:
        """Atualiza uma visita existente"""
        pass

    @abstractmethod
    def delete(self, visit_id: int) -> None:
        """Remove uma visita"""
        pass

    @abstractmethod
    def list_all(self) -> List[Visit]:
        """Lista todas as visitas"""
        pass

    @abstractmethod
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
            user_id: ID do usuário (para filtrar visitas de um promotor)
        """
        pass

    @abstractmethod
    def get_visits_for_dashboard(
        self,
        start_date: datetime,
        end_date: datetime,
        user_id: Optional[int] = None
    ) -> List[Visit]:
        """
        Retorna visitas para o dashboard com métricas

        Args:
            start_date: Data inicial
            end_date: Data final
            user_id: ID do usuário (para filtrar visitas de um promotor)
        """
        pass
