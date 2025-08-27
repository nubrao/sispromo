from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.infrastructure.models.store_model import StoreModel
from core.infrastructure.serializers.store_serializer import StoreSerializer
from drf_spectacular.utils import extend_schema, extend_schema_view
import logging

logger = logging.getLogger(__name__)


@extend_schema_view(
    list=extend_schema(
        description="""Lista todas as lojas cadastradas.
        - Todos os usuários autenticados podem listar
        - Não requer papel específico""",
        responses={
            200: StoreSerializer(many=True),
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    ),
    create=extend_schema(
        description="""Cria uma nova loja.
        - Requer papel de Analista (role=2) ou Gestor (role=3)
        - Promotores (role=1) não podem criar""",
        request=StoreSerializer,
        responses={
            201: StoreSerializer,
            400: {
                "type": "object",
                "properties": {
                    "error": {
                        "type": "string",
                        "description": "Detalhes do erro de validação"
                    }
                }
            },
            403: {
                "type": "object",
                "properties": {
                    "error": {
                        "type": "string",
                        "description": "Apenas gestores e analistas podem criar lojas"
                    }
                }
            },
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    ),
    update=extend_schema(
        description="""Atualiza uma loja existente.
        - Requer papel de Analista (role=2) ou Gestor (role=3)
        - Promotores (role=1) não podem atualizar""",
        request=StoreSerializer,
        responses={
            200: StoreSerializer,
            400: {
                "type": "object",
                "properties": {
                    "error": {
                        "type": "string",
                        "description": "Detalhes do erro de validação"
                    }
                }
            },
            403: {
                "type": "object",
                "properties": {
                    "error": {
                        "type": "string",
                        "description": "Apenas gestores e analistas podem atualizar lojas"
                    }
                }
            },
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    ),
    destroy=extend_schema(
        description="""Deleta uma loja.
        - Requer papel de Analista (role=2) ou Gestor (role=3)
        - Promotores (role=1) não podem deletar""",
        responses={
            204: None,
            403: {
                "type": "object",
                "properties": {
                    "error": {
                        "type": "string",
                        "description": "Apenas gestores e analistas podem deletar lojas"
                    }
                }
            },
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    )
)
class StoreViewSet(viewsets.ModelViewSet):
    """ ViewSet para gerenciar Lojas """

    queryset = StoreModel.objects.all()
    serializer_class = StoreSerializer

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
        """ Lista todas as lojas """
        try:
            stores = self.get_queryset()
            serializer = self.get_serializer(stores, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Erro ao listar lojas: {e}")
            return Response(
                {"error": "Erro ao buscar lojas."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        """ Cria uma nova loja """
        try:
            self.check_manager_analyst_permission()
        except PermissionError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            try:
                store = serializer.save()
                return Response(
                    self.get_serializer(store).data,
                    status=status.HTTP_201_CREATED
                )
            except Exception as e:
                logger.error(f"Erro ao criar loja: {e}")
                return Response(
                    {"error": "Erro ao criar loja."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            logger.warning(
                f"Erro de validação ao criar loja: {serializer.errors}")
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):
        """ Atualiza uma loja existente """
        try:
            self.check_manager_analyst_permission()
        except PermissionError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_403_FORBIDDEN
            )

        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=True)

        if serializer.is_valid():
            try:
                store = serializer.save()
                return Response(
                    self.get_serializer(store).data,
                    status=status.HTTP_200_OK
                )
            except Exception as e:
                logger.error(f"Erro ao atualizar loja: {e}")
                return Response(
                    {"error": "Erro ao atualizar loja."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            logger.warning(
                f"Erro de validação ao atualizar loja: {serializer.errors}")
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, *args, **kwargs):
        """ Deleta uma loja """
        try:
            self.check_manager_analyst_permission()
        except PermissionError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_403_FORBIDDEN
            )

        instance = self.get_object()

        try:
            instance.delete()
            return Response(
                {"message": "Loja excluída com sucesso."},
                status=status.HTTP_204_NO_CONTENT
            )
        except Exception as e:
            logger.error(f"Erro ao excluir loja: {e}")
            return Response(
                {"error": "Erro ao excluir loja."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
