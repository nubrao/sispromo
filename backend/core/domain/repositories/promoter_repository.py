from abc import ABC, abstractmethod
from core.domain.entities.promoter import Promoter


class PromoterRepository(ABC):
    @abstractmethod
    def get_by_id(self, promoter_id: int) -> Promoter:
        pass

    @abstractmethod
    def create(self, promoter: Promoter) -> Promoter:
        pass

    @abstractmethod
    def update(self, promoter: Promoter) -> Promoter:
        pass

    @abstractmethod
    def delete(self, promoter_id: int) -> None:
        pass
