from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema, extend_schema_view
import logging
from ..serializers import user_profile_serializer as user_serializers
from ..models.user_profile_model import UserProfileModel

logger = logging.getLogger(__name__)


@extend_schema_view(
    list=extend_schema(
        description="Lista todos os usuários",
        responses={
            200: user_serializers.UserSerializer(many=True),
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    ),
    update=extend_schema(
        description="Atualiza um usuário existente",
        request=user_serializers.UserUpdateSerializer,
        responses={
            200: user_serializers.UserUpdateSerializer,
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
        description="Deleta um usuário",
        responses={
            204: None,
            403: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            },
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    )
)
class UserViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar Usuários"""

    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_serializer_class(self):
        if self.action in ['partial_update', 'update']:
            return user_serializers.UserUpdateSerializer
        return user_serializers.UserSerializer

    def get_queryset(self):
        """
        Retorna o queryset de usuários com seus perfis relacionados.
        Garante que os dados venham da tabela core_userprofile.
        """
        return User.objects.select_related('userprofile').all()

    def get_permissions(self):
        if self.action == 'register':
            return [AllowAny()]
        return [IsAuthenticated()]

    def list(self, request):
        """Lista todos os usuários"""
        try:
            # Verifica se o usuário é um gestor
            if request.user.userprofile.role != 'manager':
                return Response(
                    {"error": "Apenas gestores podem listar usuários."},
                    status=status.HTTP_403_FORBIDDEN
                )

            users = self.get_queryset()
            serializer = self.get_serializer(users, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Erro ao listar usuários: {str(e)}")
            return Response(
                {"error": "Erro ao listar usuários"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def partial_update(self, request, *args, **kwargs):
        """Atualiza parcialmente um usuário"""
        try:
            # Verifica se o usuário é um gestor
            if request.user.userprofile.role != 'manager':
                return Response(
                    {"error": "Apenas gestores podem atualizar usuários."},
                    status=status.HTTP_403_FORBIDDEN
                )

            instance = self.get_object()
            serializer = self.get_serializer(
                instance,
                data=request.data,
                partial=True
            )

            if serializer.is_valid():
                user = serializer.save()
                # Recarrega o usuário para garantir que temos os dados atualizados  # noqa: E501
                user.refresh_from_db()
                return Response(
                    self.get_serializer(user).data,
                    status=status.HTTP_200_OK
                )
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Erro ao atualizar usuário: {e}")
            return Response(
                {"error": "Erro ao atualizar usuário."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, *args, **kwargs):
        """Deleta um usuário"""
        try:
            # Verifica se o usuário é um gestor
            if request.user.userprofile.role != 'manager':
                return Response(
                    {"error": "Apenas gestores podem excluir usuários."},
                    status=status.HTTP_403_FORBIDDEN
                )

            instance = self.get_object()

            # Não permite que o usuário exclua a si mesmo
            if instance.id == request.user.id:
                return Response(
                    {"error": "Você não pode excluir seu próprio usuário."},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Se o usuário for um promotor, exclui o promotor associado
            try:
                if instance.userprofile.role == 'promoter':
                    promoter = instance.userprofile.promoter
                    if promoter:
                        promoter.delete()
            except Exception as e:
                logger.warning(f"Erro ao excluir promotor associado: {e}")

            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Erro ao excluir usuário: {e}")
            return Response(
                {"error": "Erro ao excluir usuário."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        description="Atualiza o papel do usuário",
        request=user_serializers.UserSerializer,
        responses={
            200: user_serializers.UserSerializer,
            400: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    )
    @action(detail=True, methods=['patch'])
    def update_role(self, request, pk=None):
        try:
            # Verifica se o usuário é um gestor
            if request.user.userprofile.role != 'manager':
                return Response(
                    {"error": "Apenas gestores podem atualizar papéis de usuários."},  # noqa: E501
                    status=status.HTTP_403_FORBIDDEN
                )

            user = self.get_object()
            new_role = request.data.get('role')

            if new_role not in dict(UserProfileModel.ROLE_CHOICES):
                return Response(
                    {"error": "Papel inválido"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Atualiza o papel diretamente na tabela core_userprofile
            profile = user.userprofile
            profile.role = new_role
            profile.save()

            # Recarrega o usuário para garantir que temos os dados atualizados
            user.refresh_from_db()
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Erro ao atualizar papel do usuário: {str(e)}")
            return Response(
                {"error": "Erro ao atualizar papel do usuário"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        description="Retorna os dados do usuário logado",
        responses={200: user_serializers.UserSerializer}
    )
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Retorna os dados do usuário logado"""
        try:
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Erro ao obter dados do usuário: {str(e)}")
            return Response(
                {"error": "Erro ao obter dados do usuário"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        description="Registra um novo usuário",
        request=user_serializers.UserSerializer,
        responses={
            201: user_serializers.UserSerializer,
            400: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    )
    @action(detail=False, methods=['post'])
    def register(self, request):
        """Registra um novo usuário"""
        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                # Recarrega o usuário para garantir que temos os dados atualizados  # noqa: E501
                user.refresh_from_db()
                return Response(
                    self.get_serializer(user).data,
                    status=status.HTTP_201_CREATED
                )
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Erro ao registrar usuário: {str(e)}")
            return Response(
                {"error": "Erro ao registrar usuário"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
