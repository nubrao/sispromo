from rest_framework import viewsets, status, serializers
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema, extend_schema_view
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter
from ..serializers.promoter_serializer import (
    PromoterSerializer, PromoterUpdateSerializer
)
from ..repositories.promoter_repository import DjangoPromoterRepository
from ..domain.use_cases.promoter_use_cases import PromoterUseCases
from ..models.promoter_model import PromoterModel
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
    repository = DjangoPromoterRepository()
    use_cases = PromoterUseCases(repository)

    def get_serializer_class(self):
        if self.request.method == 'PATCH':
            return PromoterUpdateSerializer
        return PromoterSerializer

    def list(self, request):
        """Lista todos os promotores com filtros opcionais"""
        try:
            promoters = self.use_cases.list_promoters()
            serializer = self.get_serializer_class()(promoters, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Erro ao listar promotores: {str(e)}")
            return Response(
                {"error": "Erro ao listar promotores"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request):
        """Cria um novo promotor"""
        try:
            logger.info(
                f"Iniciando criação de promotor com dados: {request.data}")
            serializer = self.get_serializer_class()(data=request.data)
            serializer.is_valid(raise_exception=True)
            promoter = serializer.save()
            logger.info(
                f"Promotor criado com sucesso. ID: {promoter.id}")
            return Response(
                PromoterSerializer(promoter).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            logger.error(f"Erro ao criar promotor: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def retrieve(self, request, pk=None):
        """Obtém um promotor específico"""
        try:
            promoter = self.use_cases.get_promoter(pk)
            if not promoter:
                return Response(
                    {"error": "Promotor não encontrado"},
                    status=status.HTTP_404_NOT_FOUND
                )
            serializer = self.get_serializer_class()(promoter)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Erro ao buscar promotor: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, pk=None):
        """Atualiza um promotor existente"""
        try:
            promoter = self.use_cases.get_promoter(pk)
            if not promoter:
                return Response(
                    {"error": "Promotor não encontrado"},
                    status=status.HTTP_404_NOT_FOUND
                )

            serializer = self.get_serializer_class()(data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)

            # Atualiza os dados da entidade
            for field, value in serializer.validated_data.items():
                setattr(promoter, field, value)

            # Usa o caso de uso para atualizar
            updated_promoter = self.use_cases.update_promoter(promoter)
            return Response(PromoterSerializer(updated_promoter).data)
        except Exception as e:
            logger.error(f"Erro ao atualizar promotor: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, pk=None):
        """Remove um promotor"""
        try:
            success = self.use_cases.delete_promoter(pk)
            if not success:
                return Response(
                    {"error": "Promotor não encontrado"},
                    status=status.HTTP_404_NOT_FOUND
                )
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Erro ao excluir promotor: {str(e)}")
            return Response(
                {"error": str(e)},
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
                serializer = self.get_serializer_class()(promoter)
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
