from django.core.cache import cache
from django.db.models import Prefetch
from core.infrastructure.models.promoter_brand_model import PromoterBrand


class PromoterBrandRepository:
    CACHE_KEY_ALL = 'all_promoter_brands'
    CACHE_KEY_BY_PROMOTER = 'promoter_brands_{}'
    CACHE_TIMEOUT = 300  # 5 minutos em segundos

    @staticmethod
    def get_all_promoter_brands():
        """
        Retorna todas as associações entre promotores e marcas.
        Utiliza cache para melhorar a performance.
        """
        # Tenta buscar do cache
        cached_data = cache.get(PromoterBrandRepository.CACHE_KEY_ALL)
        if cached_data is not None:
            return cached_data

        # Se não estiver em cache, busca do banco de dados
        promoter_brands = PromoterBrand.objects.select_related(
            'promoter',
            'brand'
        ).prefetch_related(
            Prefetch(
                'brand__stores',
                to_attr='store_list'
            )
        ).all()

        # Salva no cache
        cache.set(
            PromoterBrandRepository.CACHE_KEY_ALL,
            promoter_brands,
            PromoterBrandRepository.CACHE_TIMEOUT
        )

        return promoter_brands

    @staticmethod
    def get_promoter_brands_by_promoter(promoter_id):
        """
        Retorna todas as marcas associadas a um promotor específico.
        Utiliza cache para melhorar a performance.
        """
        cache_key = PromoterBrandRepository.CACHE_KEY_BY_PROMOTER.format(
            promoter_id)

        # Tenta buscar do cache
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        # Se não estiver em cache, busca do banco de dados
        promoter_brands = PromoterBrand.objects.select_related(
            'promoter',
            'brand'
        ).prefetch_related(
            Prefetch(
                'brand__stores',
                to_attr='store_list'
            )
        ).filter(promoter_id=promoter_id)

        # Salva no cache
        cache.set(
            cache_key,
            promoter_brands,
            PromoterBrandRepository.CACHE_TIMEOUT
        )

        return promoter_brands

    @staticmethod
    def create_promoter_brand(promoter_id, brand_id):
        """
        Cria uma nova associação entre promotor e marca.
        Limpa o cache após a criação.
        """
        promoter_brand = PromoterBrand.objects.create(
            promoter_id=promoter_id,
            brand_id=brand_id
        )

        # Limpa os caches relacionados
        PromoterBrandRepository.clear_cache(promoter_id)

        return promoter_brand

    @staticmethod
    def delete_promoter_brand(promoter_brand_id):
        """
        Remove uma associação entre promotor e marca.
        Limpa o cache após a remoção.
        """
        promoter_brand = PromoterBrand.objects.get(id=promoter_brand_id)
        promoter_id = promoter_brand.promoter_id
        promoter_brand.delete()

        # Limpa os caches relacionados
        PromoterBrandRepository.clear_cache(promoter_id)

    @staticmethod
    def clear_cache(promoter_id=None):
        """
        Limpa o cache do repositório.
        Se promoter_id for fornecido, limpa apenas o cache daquele promotor.
        """
        cache.delete(PromoterBrandRepository.CACHE_KEY_ALL)
        if promoter_id:
            cache_key = PromoterBrandRepository.CACHE_KEY_BY_PROMOTER.format(
                promoter_id)
            cache.delete(cache_key)

    @staticmethod
    def update_promoter_brands(promoter_id, brand_ids):
        """
        Atualiza as marcas de um promotor.
        Remove as associações antigas e cria as novas.
        """
        # Remove todas as associações existentes
        PromoterBrand.objects.filter(promoter_id=promoter_id).delete()

        # Cria as novas associações
        promoter_brands = []
        for brand_id in brand_ids:
            promoter_brands.append(
                PromoterBrand(
                    promoter_id=promoter_id,
                    brand_id=brand_id
                )
            )

        # Salva todas as novas associações de uma vez
        if promoter_brands:
            PromoterBrand.objects.bulk_create(promoter_brands)

        # Limpa os caches relacionados
        PromoterBrandRepository.clear_cache(promoter_id)
