from rest_framework import viewsets, status, serializers
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from ..models.promoter_model import PromoterModel
from ..serializers.promoter_serializer import PromoterSerializer
from ..permissions import IsManagerOrAnalyst
from django.contrib.auth.models import User
import logging

logger = logging.getLogger(__name__)


class LinkUserSerializer(serializers.Serializer):
    """Serializer para vincular usuário ao promotor"""
    user_id = serializers.IntegerField(required=True)


@extend_schema_view(
    list=extend_schema(
        description="Lista todos os promotores cadastrados",
        responses={
            200: PromoterSerializer(many=True),
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    ),
    create=extend_schema(
        description="Cria um novo promotor e seu usuário associado",
        request=PromoterSerializer,
        responses={
            201: PromoterSerializer,
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
        description="Atualiza um promotor existente",
        request=PromoterSerializer,
        responses={
            200: PromoterSerializer,
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
        description="Deleta um promotor",
        responses={
            204: None,
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    ),
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
class PromoterViewSet(viewsets.ModelViewSet):
    """ ViewSet para gerenciar Promotores """

    queryset = PromoterModel.objects.all()
    serializer_class = PromoterSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAnalyst]

    def get_queryset(self):
        """
        Retorna o queryset de promotores filtrado com base no papel do usuário.
        Se o usuário for um promotor, retorna apenas seu próprio registro.
        Se for analista ou gerente, retorna todos os promotores.
        """
        user = self.request.user
        queryset = self.queryset.select_related(
            'user_profile', 'user_profile__user'
        )

        # Se o usuário for um promotor, filtra apenas seu próprio registro
        if user.userprofile.role == 'promoter':
            queryset = queryset.filter(user_profile=user.userprofile)

        return queryset

    def list(self, request, *args, **kwargs):
        """ Lista todos os promotores """
        try:
            promoters = self.get_queryset()
            serializer = self.get_serializer(promoters, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Erro ao listar promotores: {e}")
            return Response(
                {"error": "Erro ao buscar promotores."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        """ Cria um novo promotor e seu usuário associado """
        # Apenas analistas e gerentes podem criar promotores
        if request.user.userprofile.role == 'promoter':
            return Response(
                {"error": "Você não tem permissão para criar promotores."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            try:
                promoter = serializer.save()
                response_data = self.get_serializer(promoter).data
                # Inclui a senha temporária apenas na resposta de criação
                if hasattr(promoter, 'temporary_password'):
                    response_data['temporary_password'] = promoter.temporary_password

                return Response(
                    response_data,
                    status=status.HTTP_201_CREATED
                )
            except Exception as e:
                logger.error(f"Erro ao criar promotor: {e}")
                return Response(
                    {"error": "Erro ao criar promotor."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            logger.warning(
                f"Erro de validação ao criar promotor: {serializer.errors}"
            )
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):
        """ Atualiza um promotor existente """
        instance = self.get_object()

        # Verifica se o usuário tem permissão para atualizar este promotor
        if request.user.userprofile.role == 'promoter':
            try:
                user_promoter = PromoterModel.objects.get(
                    user_profile=request.user.userprofile)
                if instance.id != user_promoter.id:
                    return Response(
                        {"error": "Você não tem permissão para atualizar outros promotores."},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except PromoterModel.DoesNotExist:
                return Response(
                    {"error": "Promotor não encontrado."},
                    status=status.HTTP_404_NOT_FOUND
                )

        serializer = self.get_serializer(
            instance, data=request.data, partial=True)

        if serializer.is_valid():
            try:
                promoter = serializer.save()
                return Response(
                    self.get_serializer(promoter).data,
                    status=status.HTTP_200_OK
                )
            except Exception as e:
                logger.error(f"Erro ao atualizar promotor: {e}")
                return Response(
                    {"error": "Erro ao atualizar promotor."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            logger.warning(
                f"Erro de validação ao atualizar promotor: {serializer.errors}")
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, *args, **kwargs):
        """ Deleta um promotor """
        # Apenas analistas e gerentes podem deletar promotores
        if request.user.userprofile.role == 'promoter':
            return Response(
                {"error": "Você não tem permissão para deletar promotores."},
                status=status.HTTP_403_FORBIDDEN
            )

        instance = self.get_object()

        try:
            # Se houver um usuário vinculado, mantém ele mas remove o vínculo
            if instance.user_profile:
                user_profile = instance.user_profile
                instance.user_profile = None
                instance.save()

            instance.delete()
            return Response(
                {"message": "Promotor excluído com sucesso."},
                status=status.HTTP_204_NO_CONTENT
            )
        except Exception as e:
            logger.error(f"Erro ao excluir promotor: {e}")
            return Response(
                {"error": "Erro ao excluir promotor."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        description="Vincula um promotor a um usuário específico",
        request={
            "type": "object",
            "properties": {
                "user_id": {"type": "integer"}
            },
            "required": ["user_id"]
        },
        responses={
            200: PromoterSerializer,
            400: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            },
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
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
                promoter = self.get_object()
                serializer = self.get_serializer(promoter)
                return Response(serializer.data)
            else:
                return Response(
                    {"error": "Erro ao vincular promotor ao usuário."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
