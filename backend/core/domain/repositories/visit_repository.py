from abc import ABC, abstractmethod
from core.domain.entities.visit import Visit


class VisitRepository(ABC):
    @abstractmethod
    def get_by_id(self, visit_id: int) -> Visit:
        pass

    @abstractmethod
    def create(self, visit: Visit) -> Visit:
        pass

    @abstractmethod
    def update(self, visit: Visit) -> Visit:
        pass

    @abstractmethod
    def delete(self, visit_id: int) -> None:
        pass
