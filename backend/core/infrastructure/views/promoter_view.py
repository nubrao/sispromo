from rest_framework import viewsets, status, serializers
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema, extend_schema_view
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter
from core.infrastructure.serializers.promoter_serializer import (
    PromoterSerializer
)
from core.infrastructure.repositories.promoter_repository import (
    DjangoPromoterRepository
)
from core.infrastructure.models.promoter_model import PromoterModel
import logging

logger = logging.getLogger(__name__)


class LinkUserSerializer(serializers.Serializer):
    """Serializer para vincular usuário ao promotor"""
    user_id = serializers.IntegerField(required=True)


@extend_schema_view(
    list=extend_schema(description='Lista todos os promotores'),
    create=extend_schema(description='Cria um novo promotor'),
    retrieve=extend_schema(description='Obtém um promotor específico'),
    update=extend_schema(description='Atualiza um promotor'),
    destroy=extend_schema(description='Remove um promotor'),
    link_user=extend_schema(
        description="Vincula um usuário a um promotor",
        request=LinkUserSerializer,
        responses={
            200: PromoterSerializer,
            400: None,
            404: None
        },
        parameters=[
            OpenApiParameter(
                name="id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description="ID do promotor"
            )
        ]
    )
)
class PromoterViewSet(viewsets.ViewSet):
    """
    ViewSet para gerenciar promotores.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = PromoterSerializer

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.repository = DjangoPromoterRepository()

    def list(self, request):
        """Lista todos os promotores com filtros opcionais"""
        try:
            name = request.query_params.get('name')
            cpf = request.query_params.get('cpf')
            phone = request.query_params.get('phone')

            promoters = self.repository.get_by_filters(
                name=name, cpf=cpf, phone=phone)
            serializer = self.serializer_class(promoters, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Erro ao listar promotores: {str(e)}")
            return Response(
                {"error": "Erro ao listar promotores."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request):
        """Cria um novo promotor"""
        try:
            logger.info(
                f"Iniciando criação de promotor com dados: {request.data}")
            serializer = self.serializer_class(data=request.data)

            logger.info("Validando dados do promotor...")
            if serializer.is_valid():
                logger.info("Dados válidos, criando promotor...")
                try:
                    promoter = serializer.create(serializer.validated_data)
                    logger.info(
                        f"Promotor criado com sucesso. ID: {promoter.id}")
                    return Response(
                        self.serializer_class(promoter).data,
                        status=status.HTTP_201_CREATED
                    )
                except Exception as create_error:
                    logger.error(
                        f"Erro durante a criação do promotor: {str(create_error)}")
                    raise create_error

            logger.error(f"Erro de validação: {serializer.errors}")
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        except serializers.ValidationError as e:
            logger.error(f"Erro de validação ao criar promotor: {str(e)}")
            return Response(
                e.detail,
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Erro não esperado ao criar promotor: {str(e)}")
            return Response(
                {"error": "Erro ao criar promotor."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, pk=None):
        """Obtém um promotor específico"""
        try:
            promoter = self.repository.get_by_id(pk)
            if promoter:
                serializer = self.serializer_class(promoter)
                return Response(serializer.data)
            return Response(
                {'error': 'Promotor não encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Erro ao obter promotor: {str(e)}")
            return Response(
                {"error": "Erro ao obter promotor."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, pk=None):
        """Atualiza um promotor existente"""
        try:
            promoter = self.repository.get_by_id(pk)
            if not promoter:
                return Response(
                    {'error': 'Promotor não encontrado.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            serializer = self.serializer_class(promoter, data=request.data)
            if serializer.is_valid():
                updated_promoter = self.repository.update(
                    pk, serializer.validated_data)
                return Response(self.serializer_class(updated_promoter).data)
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        except serializers.ValidationError as e:
            return Response(
                e.detail,
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Erro ao atualizar promotor: {str(e)}")
            return Response(
                {"error": "Erro ao atualizar promotor."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, pk=None):
        """Remove um promotor"""
        try:
            promoter = self.repository.get_by_id(pk)
            if not promoter:
                return Response(
                    {'error': 'Promotor não encontrado.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            self.repository.delete(pk)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Erro ao excluir promotor: {str(e)}")
            return Response(
                {"error": "Erro ao excluir promotor."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def link_user(self, request, pk=None):
        """Vincula um promotor a um usuário específico"""
        try:
            user_id = request.data.get('user_id')
            if not user_id:
                return Response(
                    {"error": "ID do usuário não fornecido."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            success = PromoterModel.link_promoter_to_user(pk, user_id)
            if success:
                promoter = self.repository.get_by_id(pk)
                serializer = self.serializer_class(promoter)
                return Response(serializer.data)
            else:
                return Response(
                    {"error": "Erro ao vincular promotor ao usuário."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            logger.error(f"Erro ao vincular promotor: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
