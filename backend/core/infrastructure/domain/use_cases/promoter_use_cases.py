from typing import List, Optional
from ..entities.promoter import Promoter
from ..repositories.promoter_repository import PromoterRepository


class PromoterUseCases:
    def __init__(self, repository: PromoterRepository):
        self.repository = repository

    def list_promoters(self) -> List[Promoter]:
        """Lista todos os promotores"""
        return self.repository.get_all()

    def get_promoter(self, promoter_id: int) -> Optional[Promoter]:
        """Obtém um promotor pelo ID"""
        return self.repository.get_by_id(promoter_id)

    def create_promoter(self, promoter: Promoter) -> Promoter:
        """Cria um novo promotor"""
        return self.repository.create(promoter)

    def update_promoter(self, promoter: Promoter) -> Promoter:
        """Atualiza um promotor existente"""
        return self.repository.update(promoter)

    def delete_promoter(self, promoter_id: int) -> bool:
        """Remove um promotor"""
        try:
            self.repository.delete(promoter_id)
            return True
        except Exception:
            return False

    def get_promoter_by_cpf(self, cpf: str) -> Optional[Promoter]:
        """Obtém um promotor pelo CPF"""
        return self.repository.get_by_cpf(cpf)

    def get_promoter_by_user_id(self, user_id: int) -> Optional[Promoter]:
        """Obtém um promotor pelo ID do usuário"""
        return self.repository.get_by_user_id(user_id)

    def get_promoters_by_filters(
        self,
        name: Optional[str] = None,
        cpf: Optional[str] = None,
        phone: Optional[str] = None
    ) -> List[Promoter]:
        """Obtém promotores com base em filtros"""
        return self.repository.get_by_filters(name, cpf, phone)

    def link_promoter_to_user(self, promoter_id: int, user_id: int) -> bool:
        """Vincula um promotor a um usuário"""
        return self.repository.link_to_user(promoter_id, user_id)
