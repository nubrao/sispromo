from typing import List, Optional
from django.db.models import Q
from core.domain.entities.promoter import Promoter
from core.domain.repositories.promoter_repository import PromoterRepository
from core.infrastructure.models.promoter_model import PromoterModel
from django.contrib.auth.models import User
from core.infrastructure.cache.cache_config import CacheConfig


class DjangoPromoterRepository(PromoterRepository):
    def _to_entity(self, model: PromoterModel) -> Promoter:
        """Converte um modelo para entidade"""
        return Promoter(
            id=model.id,
            first_name=model.first_name,
            last_name=model.last_name,
            cpf=model.cpf,
            phone=model.phone,
            email=model.user_profile.user.email if (
                model.user_profile and model.user_profile.user) else None,
            user_id=model.user_profile.user.id if (
                model.user_profile and model.user_profile.user) else None
        )

    def get_by_id(self, promoter_id: int) -> Optional[Promoter]:
        """Busca um promotor pelo ID, primeiro no cache, depois no banco"""
        cache_key = CacheConfig.get_key(
            CacheConfig.PROMOTER_PREFIX, promoter_id)
        cached_promoter = CacheConfig.get(cache_key)

        if cached_promoter:
            return self._to_entity(cached_promoter)

        try:
            model = PromoterModel.objects.select_related(
                'user_profile__user'
            ).get(id=promoter_id)
            CacheConfig.set(cache_key, model)
            return self._to_entity(model)
        except PromoterModel.DoesNotExist:
            return None

    def get_by_cpf(self, cpf: str) -> Optional[Promoter]:
        """Busca um promotor pelo CPF, primeiro no cache, depois no banco"""
        cache_key = CacheConfig.get_key(
            CacheConfig.PROMOTER_PREFIX, f"cpf_{cpf}")
        cached_promoter = CacheConfig.get(cache_key)

        if cached_promoter:
            return self._to_entity(cached_promoter)

        try:
            model = PromoterModel.objects.select_related(
                'user_profile__user'
            ).get(cpf=cpf)
            CacheConfig.set(cache_key, model)
            return self._to_entity(model)
        except PromoterModel.DoesNotExist:
            return None

    def get_by_user_id(self, user_id: int) -> Optional[Promoter]:
        """Busca um promotor pelo ID do usuário, primeiro no cache, depois no banco"""
        cache_key = CacheConfig.get_key(
            CacheConfig.PROMOTER_PREFIX, f"user_{user_id}")
        cached_promoter = CacheConfig.get(cache_key)

        if cached_promoter:
            return self._to_entity(cached_promoter)

        try:
            model = PromoterModel.objects.select_related(
                'user_profile__user'
            ).get(user_profile__user_id=user_id)
            CacheConfig.set(cache_key, model)
            return self._to_entity(model)
        except PromoterModel.DoesNotExist:
            return None

    def get_all(self) -> List[Promoter]:
        """Retorna todos os promotores"""
        cache_key = CacheConfig.get_key(CacheConfig.PROMOTER_PREFIX, "all")
        cached_promoters = CacheConfig.get(cache_key)

        if cached_promoters:
            return [self._to_entity(model) for model in cached_promoters]

        models = PromoterModel.objects.select_related(
            'user_profile__user').all()
        CacheConfig.set(cache_key, list(models))
        return [self._to_entity(model) for model in models]

    def create(self, promoter: Promoter) -> Promoter:
        """Cria um novo promotor e atualiza o cache"""
        model = PromoterModel.objects.create(
            first_name=promoter.first_name,
            last_name=promoter.last_name,
            cpf=promoter.cpf,
            phone=promoter.phone
        )

        # Invalida caches relacionados
        self._invalidate_promoter_caches()

        return self._to_entity(model)

    def update(self, promoter: Promoter) -> Promoter:
        """Atualiza um promotor e o cache"""
        model = PromoterModel.objects.select_related(
            'user_profile__user'
        ).get(id=promoter.id)

        model.first_name = promoter.first_name
        model.last_name = promoter.last_name
        model.cpf = promoter.cpf
        model.phone = promoter.phone
        model.save()

        # Invalida caches relacionados
        self._invalidate_promoter_caches(model)

        return self._to_entity(model)

    def delete(self, promoter_id: int) -> None:
        """Remove um promotor e seus caches"""
        try:
            promoter = PromoterModel.objects.get(id=promoter_id)
            # Invalida caches antes de deletar
            self._invalidate_promoter_caches(promoter)
            promoter.delete()
        except PromoterModel.DoesNotExist:
            pass

    def get_by_filters(
        self,
        name: Optional[str] = None,
        cpf: Optional[str] = None,
        phone: Optional[str] = None
    ) -> List[Promoter]:
        """Retorna promotores filtrados (sem cache devido à natureza dinâmica dos filtros)"""
        query = PromoterModel.objects.select_related(
            'user_profile__user').all()

        if name:
            query = query.filter(
                Q(first_name__icontains=name) |
                Q(last_name__icontains=name)
            )

        if cpf:
            query = query.filter(cpf__icontains=cpf)

        if phone:
            query = query.filter(phone__icontains=phone)

        return [self._to_entity(model) for model in query]

    def link_to_user(self, promoter_id: int, user_id: int) -> bool:
        """Vincula um promotor a um usuário e atualiza o cache"""
        try:
            promoter = PromoterModel.objects.get(id=promoter_id)
            user = User.objects.get(id=user_id)
            promoter.user_profile = user.userprofile
            promoter.save()

            # Invalida caches relacionados
            self._invalidate_promoter_caches(promoter)

            return True
        except (PromoterModel.DoesNotExist, User.DoesNotExist):
            return False

    def _invalidate_promoter_caches(self, promoter: Optional[PromoterModel] = None) -> None:
        """Invalida os caches relacionados a um promotor"""
        # Sempre invalida a lista completa
        cache_key_all = CacheConfig.get_key(CacheConfig.PROMOTER_PREFIX, "all")
        CacheConfig.delete(cache_key_all)

        if promoter:
            # Invalida cache por ID
            cache_key_id = CacheConfig.get_key(
                CacheConfig.PROMOTER_PREFIX, promoter.id)
            CacheConfig.delete(cache_key_id)

            # Invalida cache por CPF
            cache_key_cpf = CacheConfig.get_key(
                CacheConfig.PROMOTER_PREFIX, f"cpf_{promoter.cpf}")
            CacheConfig.delete(cache_key_cpf)

            # Invalida cache por user_id se existir
            if promoter.user_profile and promoter.user_profile.user:
                cache_key_user = CacheConfig.get_key(
                    CacheConfig.PROMOTER_PREFIX, f"user_{promoter.user_profile.user.id}")
                CacheConfig.delete(cache_key_user)
