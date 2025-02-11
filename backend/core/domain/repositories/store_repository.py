from abc import ABC, abstractmethod
from core.domain.entities.store import Store


class StoreRepository(ABC):
    @abstractmethod
    def get_by_id(self, store_id: int) -> Store:
        pass

    @abstractmethod
    def create(self, store: Store) -> Store:
        pass

    @abstractmethod
    def update(self, store: Store) -> Store:
        pass

    @abstractmethod
    def delete(self, store_id: int) -> None:
        pass
