from abc import ABC, abstractmethod
from typing import List, Optional
from ..entities.promoter import Promoter


class PromoterRepository(ABC):
    @abstractmethod
    def get_by_id(self, promoter_id: int) -> Optional[Promoter]:
        """Busca um promotor pelo ID"""
        pass

    @abstractmethod
    def get_by_cpf(self, cpf: str) -> Optional[Promoter]:
        """Busca um promotor pelo CPF"""
        pass

    @abstractmethod
    def get_by_user_id(self, user_id: int) -> Optional[Promoter]:
        """Busca um promotor pelo ID do usuário"""
        pass

    @abstractmethod
    def get_all(self) -> List[Promoter]:
        """Retorna todos os promotores"""
        pass

    @abstractmethod
    def create(self, promoter: Promoter) -> Promoter:
        """Cria um novo promotor"""
        pass

    @abstractmethod
    def update(self, promoter: Promoter) -> Promoter:
        """Atualiza um promotor existente"""
        pass

    @abstractmethod
    def delete(self, promoter_id: int) -> None:
        """Remove um promotor"""
        pass

    @abstractmethod
    def get_by_filters(
        self,
        name: Optional[str] = None,
        cpf: Optional[str] = None,
        phone: Optional[str] = None
    ) -> List[Promoter]:
        """Retorna promotores filtrados"""
        pass

    @abstractmethod
    def link_to_user(self, promoter_id: int, user_id: int) -> bool:
        """Vincula um promotor a um usuário"""
        pass
