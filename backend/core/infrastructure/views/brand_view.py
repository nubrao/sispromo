from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from core.infrastructure.models.brand_model import BrandModel, BrandStore
from core.infrastructure.models.store_model import StoreModel
from core.infrastructure.serializers.brand_serializer import BrandSerializer
from core.infrastructure.repositories.brand_repository import BrandRepository
from drf_spectacular.utils import extend_schema, extend_schema_view
import logging
from core.infrastructure.permissions import IsManagerOrAnalyst

logger = logging.getLogger(__name__)


@extend_schema_view(
    list=extend_schema(
        description="Lista todas as marcas com suas lojas e periodicidade",
        responses={
            200: {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "brand_id": {"type": "integer"},
                        "brand_name": {"type": "string"},
                        "store_id": {"type": "integer"},
                        "store_name": {"type": "string"},
                        "visit_frequency": {"type": "integer"}
                    }
                }
            },
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    ),
    create=extend_schema(
        description="Cria uma nova marca",
        request={
            "type": "object",
            "properties": {
                "brand_name": {"type": "string"},
                "store_id": {"type": "integer"},
                "visit_frequency": {"type": "integer"}
            },
            "required": ["brand_name", "store_id", "visit_frequency"]
        },
        responses={
            201: {
                "type": "object",
                "properties": {
                    "brand_id": {"type": "integer"},
                    "brand_name": {"type": "string"},
                    "stores": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "store_id": {"type": "integer"},
                                "store_name": {"type": "string"},
                                "visit_frequency": {"type": "integer"}
                            }
                        }
                    }
                }
            },
            400: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            },
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    ),
    update=extend_schema(
        description="Atualiza uma marca existente",
        request={
            "type": "object",
            "properties": {
                "brand_name": {"type": "string"},
                "store_id": {"type": "integer"},
                "visit_frequency": {"type": "integer"}
            }
        },
        responses={
            200: {
                "type": "object",
                "properties": {
                    "brand_id": {"type": "integer"},
                    "brand_name": {"type": "string"},
                    "stores": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "store_id": {"type": "integer"},
                                "store_name": {"type": "string"},
                                "visit_frequency": {"type": "integer"}
                            }
                        }
                    }
                }
            },
            400: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            },
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    ),
    destroy=extend_schema(
        description="Deleta uma marca",
        responses={
            204: None,
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    )
)
class BrandViewSet(viewsets.ModelViewSet):
    """ ViewSet para gerenciar Marcas e seu relacionamento com Lojas """

    queryset = BrandModel.objects.prefetch_related('stores').all()
    serializer_class = BrandSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAnalyst]

    def get_permissions(self):
        return [IsAuthenticated()]

    def check_manager_analyst_permission(self):
        """Verifica se o usuário é gerente ou analista"""
        user_role = self.request.user.role
        if user_role not in [2, 3]:  # 2 = Analista, 3 = Gestor
            raise PermissionError(
                "Apenas gerentes e analistas podem realizar esta operação."
            )

    def list(self, request, *args, **kwargs):
        """ Lista todas as marcas com suas lojas e periodicidade """
        try:
            # Busca todos os registros de BrandStore com suas relações
            brand_stores = BrandStore.objects.select_related(
                'brand', 'store').all()

            # Formata os dados para o response
            results = []
            for brand_store in brand_stores:
                results.append({
                    "brand_id": brand_store.brand.id,
                    "brand_name": brand_store.brand.name,
                    "store_id": brand_store.store.id,
                    "store_name": brand_store.store.name,
                    "visit_frequency": brand_store.visit_frequency,
                })

            return Response(results, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Erro ao listar marcas: {e}")
            return Response(
                {"error": "Erro ao buscar marcas."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        """ Cria uma nova marca e associa a uma loja """
        try:
            self.check_manager_analyst_permission()
        except PermissionError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(
            data=request.data,
            context={
                "store_id": request.data.get("store_id"),
                "visit_frequency": request.data.get("visit_frequency")
            }
        )

        if serializer.is_valid():
            try:
                brand = serializer.save()
                response_data = self.get_serializer(brand).data
                return Response(response_data, status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.error(f"Erro ao criar marca: {e}")
                return Response(
                    {"error": "Erro ao criar marca."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            logger.warning(
                f"Erro de validação ao criar marca: {serializer.errors}")
            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        """ Atualiza uma marca existente """
        try:
            self.check_manager_analyst_permission()
        except PermissionError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_403_FORBIDDEN
            )

        instance = self.get_object()
        serializer = self.get_serializer(
            instance,
            data=request.data,
            context={
                "store_id": request.data.get("store_id"),
                "visit_frequency": request.data.get("visit_frequency")
            }
        )

        if serializer.is_valid():
            try:
                brand = serializer.save()
                response_data = self.get_serializer(brand).data
                return Response(response_data, status=status.HTTP_200_OK)
            except Exception as e:
                logger.error(f"Erro ao atualizar marca: {e}")
                return Response(
                    {"error": "Erro ao atualizar marca."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            logger.warning(
                f"Erro de validação ao atualizar marca: {serializer.errors}")
            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        """ Deleta uma marca """
        try:
            self.check_manager_analyst_permission()
        except PermissionError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_403_FORBIDDEN
            )

        instance = self.get_object()

        try:
            BrandRepository.delete_brand(instance.id)
            return Response(
                {"message": "Marca excluída com sucesso."},
                status=status.HTTP_204_NO_CONTENT
            )
        except Exception as e:
            logger.error(f"Erro ao excluir marca: {e}")
            return Response(
                {"error": "Erro ao excluir marca."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
