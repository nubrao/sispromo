from django.core.cache import cache
from core.infrastructure.models.brand_model import BrandModel


class BrandRepository:
    CACHE_KEY_ALL = 'all_brands'
    CACHE_KEY_BY_ID = 'brand_{}'
    CACHE_TIMEOUT = 300  # 5 minutos em segundos

    @staticmethod
    def get_all_brands():
        """
        Retorna todas as marcas.
        Utiliza cache para melhorar a performance.
        """
        # Tenta buscar do cache
        cached_data = cache.get(BrandRepository.CACHE_KEY_ALL)
        if cached_data is not None:
            return cached_data

        # Se não estiver em cache, busca do banco de dados
        brands = BrandModel.objects.all()

        # Salva no cache
        cache.set(
            BrandRepository.CACHE_KEY_ALL,
            brands,
            BrandRepository.CACHE_TIMEOUT
        )

        return brands

    @staticmethod
    def get_brand_by_id(brand_id):
        """
        Retorna uma marca específica pelo ID.
        Utiliza cache para melhorar a performance.
        """
        cache_key = BrandRepository.CACHE_KEY_BY_ID.format(brand_id)

        # Tenta buscar do cache
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        # Se não estiver em cache, busca do banco de dados
        brand = BrandModel.objects.get(id=brand_id)

        # Salva no cache
        cache.set(
            cache_key,
            brand,
            BrandRepository.CACHE_TIMEOUT
        )

        return brand

    @staticmethod
    def create_brand(brand_data):
        """
        Cria uma nova marca.
        Limpa o cache após a criação.
        """
        brand = BrandModel.objects.create(**brand_data)

        # Limpa os caches relacionados
        BrandRepository.clear_cache()

        return brand

    @staticmethod
    def update_brand(brand_id, brand_data):
        """
        Atualiza uma marca existente.
        Limpa o cache após a atualização.
        """
        brand = BrandModel.objects.get(id=brand_id)
        for key, value in brand_data.items():
            setattr(brand, key, value)
        brand.save()

        # Limpa os caches relacionados
        BrandRepository.clear_cache(brand_id)

        return brand

    @staticmethod
    def delete_brand(brand_id):
        """
        Remove uma marca.
        Limpa o cache após a remoção.
        """
        brand = BrandModel.objects.get(id=brand_id)
        brand.delete()

        # Limpa os caches relacionados
        BrandRepository.clear_cache(brand_id)

    @staticmethod
    def clear_cache(brand_id=None):
        """
        Limpa o cache do repositório.
        Se brand_id for fornecido, limpa apenas o cache daquela marca.
        """
        cache.delete(BrandRepository.CACHE_KEY_ALL)
        if brand_id:
            cache_key = BrandRepository.CACHE_KEY_BY_ID.format(brand_id)
            cache.delete(cache_key)
