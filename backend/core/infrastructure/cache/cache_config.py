from typing import Any, Optional
from django.core.cache import cache
from datetime import timedelta


class CacheConfig:
    """Configuração centralizada de cache"""

    # Prefixos para diferentes tipos de entidades
    VISIT_PREFIX = "visit:"
    STORE_PREFIX = "store:"
    PROMOTER_PREFIX = "promoter:"
    BRAND_PREFIX = "brand:"

    # Tempos de expiração padrão
    DEFAULT_TIMEOUT = timedelta(hours=1)
    LONG_TIMEOUT = timedelta(hours=24)
    SHORT_TIMEOUT = timedelta(minutes=15)

    @classmethod
    def get_key(cls, prefix: str, identifier: Any) -> str:
        """
        Gera uma chave de cache padronizada

        Args:
            prefix: Prefixo da entidade (ex: "visit:")
            identifier: Identificador único (ex: ID)

        Returns:
            str: Chave formatada para uso no cache
        """
        return f"{prefix}{str(identifier)}"

    @classmethod
    def get(cls, key: str) -> Optional[Any]:
        """
        Busca um valor no cache

        Args:
            key: Chave do cache

        Returns:
            Any: Valor armazenado ou None se não encontrado
        """
        return cache.get(key)

    @classmethod
    def set(cls, key: str, value: Any, timeout: Optional[timedelta] = None) -> None:
        """
        Armazena um valor no cache

        Args:
            key: Chave do cache
            value: Valor a ser armazenado
            timeout: Tempo de expiração (opcional)
        """
        timeout_seconds = int(timeout.total_seconds()) if timeout else int(
            cls.DEFAULT_TIMEOUT.total_seconds())
        cache.set(key, value, timeout_seconds)

    @classmethod
    def delete(cls, key: str) -> None:
        """
        Remove um valor do cache

        Args:
            key: Chave do cache
        """
        cache.delete(key)

    @classmethod
    def clear_entity_cache(cls, prefix: str) -> None:
        """
        Limpa todo o cache de uma entidade específica

        Args:
            prefix: Prefixo da entidade (ex: "visit:")
        """
        keys = cache.keys(f"{prefix}*")
        if keys:
            cache.delete_many(keys)
