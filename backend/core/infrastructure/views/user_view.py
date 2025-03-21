from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
import logging
from django.contrib.auth import get_user_model
from ..serializers.user_serializer import UserSerializer, UserCreateSerializer, UserUpdateSerializer
from ..permissions import IsManagerOrAnalyst

logger = logging.getLogger(__name__)

User = get_user_model()


@extend_schema_view(
    list=extend_schema(
        description="Lista todos os usuários. Requer papel de Gestor (role=3).",
        responses={
            200: UserSerializer(many=True),
            403: {
                "type": "object",
                "properties": {
                    "error": {
                        "type": "string",
                        "description": "Apenas gestores podem listar usuários"
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
        description="Atualiza um usuário existente. Requer autenticação.",
        request=UserUpdateSerializer,
        responses={
            200: UserSerializer,
            400: {
                "type": "object",
                "properties": {
                    "error": {
                        "type": "string",
                        "description": "Detalhes do erro de validação"
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
        description="Deleta um usuário. Requer papel de Gestor (role=3).",
        responses={
            204: None,
            403: {
                "type": "object",
                "properties": {
                    "error": {
                        "type": "string",
                        "description": "Apenas gestores podem deletar usuários"
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
class UserViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar Usuários"""

    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_serializer_class(self):
        if self.action == 'create' or self.action == 'register':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        """Retorna o queryset de usuários"""
        return User.objects.all()

    def get_permissions(self):
        if self.action == 'register' or self.action == 'me':
            return [AllowAny()]
        return [IsAuthenticated()]

    @extend_schema(
        summary="Lista todos os usuários",
        description="Retorna a lista de todos os usuários. Requer papel de Gestor (role=3).",
        responses={
            200: UserSerializer(many=True),
            403: {"description": "Sem permissão para listar usuários"}
        }
    )
    def list(self, request):
        """Lista todos os usuários"""
        try:
            # Verifica se o usuário é um gestor
            if request.user.role != 3:  # 3 = Gestor
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

    @extend_schema(
        summary="Cria um novo usuário",
        description="""
        Cria um novo usuário no sistema.
        
        Regras de validação do CPF:
        - Deve conter exatamente 11 dígitos numéricos
        - Pode ser fornecido com ou sem formatação (XXX.XXX.XXX-XX)
        - Deve ser um CPF válido (dígitos verificadores corretos)
        - Não pode conter apenas dígitos repetidos
        - Deve ser único no sistema
        - Será armazenado sem formatação e retornado formatado
        
        O CPF será usado como username do usuário.
        """,
        responses={
            201: UserSerializer,
            400: {
                "description": "Erro de validação",
                "examples": [
                    OpenApiExample(
                        "CPF Inválido",
                        value={
                            "cpf": ["CPF inválido."]
                        }
                    ),
                    OpenApiExample(
                        "CPF Duplicado",
                        value={
                            "cpf": ["Já existe um usuário cadastrado com este CPF"]
                        }
                    ),
                    OpenApiExample(
                        "CPF Formato Incorreto",
                        value={
                            "cpf": ["CPF deve ter 11 dígitos."]
                        }
                    )
                ]
            }
        }
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        summary="Atualiza um usuário",
        description="""
        Atualiza os dados de um usuário existente.
        
        Regras de validação do CPF:
        - Se fornecido, deve conter exatamente 11 dígitos numéricos
        - Pode ser fornecido com ou sem formatação (XXX.XXX.XXX-XX)
        - Deve ser um CPF válido (dígitos verificadores corretos)
        - Não pode conter apenas dígitos repetidos
        - Deve ser único no sistema (exceto se for o mesmo do usuário atual)
        - Será armazenado sem formatação e retornado formatado
        """,
        responses={
            200: UserSerializer,
            400: {
                "description": "Erro de validação",
                "examples": [
                    OpenApiExample(
                        "CPF Inválido",
                        value={
                            "cpf": ["CPF inválido."]
                        }
                    ),
                    OpenApiExample(
                        "CPF Duplicado",
                        value={
                            "cpf": ["Já existe um usuário cadastrado com este CPF"]
                        }
                    )
                ]
            },
            404: {"description": "Usuário não encontrado"}
        }
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(
        summary="Remove um usuário",
        description="Remove um usuário do sistema. Requer papel de Gestor (role=3).",
        responses={
            204: {"description": "Usuário removido com sucesso"},
            403: {"description": "Sem permissão para remover usuários"},
            404: {"description": "Usuário não encontrado"}
        }
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @extend_schema(
        description="Retorna os dados do usuário logado",
        responses={200: UserSerializer}
    )
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Retorna os dados do usuário logado"""
        try:
            if not request.user.is_authenticated:
                return Response(
                    {"error": "Usuário não autenticado"},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Busca o usuário do banco de dados para garantir dados atualizados
            user = User.objects.get(id=request.user.id)

            # Usa o serializador principal do usuário
            serializer = UserSerializer(
                user,
                context={'request': request}
            )
            return Response(serializer.data)
        except User.DoesNotExist:
            logger.error(f"Usuário não encontrado: {request.user.id}")
            return Response(
                {"error": "Usuário não encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Erro ao obter dados do usuário: {str(e)}")
            logger.error(f"Tipo do erro: {type(e)}")
            logger.error(f"Detalhes do erro: {e.__dict__}")
            error_msg = "Erro ao obter dados do usuário: "
            error_msg += str(e)
            return Response(
                {"error": error_msg},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        description="Atualiza o papel do usuário",
        request=UserSerializer,
        responses={
            200: UserSerializer,
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
            if request.user.role != 3:  # 3 = Gestor
                msg = "Apenas gestores podem atualizar papéis de usuários."
                return Response(
                    {"error": msg},
                    status=status.HTTP_403_FORBIDDEN
                )

            user = self.get_object()
            new_role = request.data.get('role')

            # Verifica se o novo papel é válido (1, 2 ou 3)
            if new_role not in [1, 2, 3]:
                msg = ("Papel inválido. Use 1 para Promotor, "
                       "2 para Analista ou 3 para Gestor.")
                return Response(
                    {"error": msg},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user.role = new_role
            user.save()

            serializer = self.get_serializer(user)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Erro ao atualizar papel do usuário: {str(e)}")
            return Response(
                {"error": "Erro ao atualizar papel do usuário"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        description="Atualiza o status do usuário",
        request=UserSerializer,
        responses={
            200: UserSerializer,
            400: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    )
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        try:
            # Verifica se o usuário é um gestor
            if request.user.role != 3:  # 3 = Gestor
                msg = "Apenas gestores podem atualizar status de usuários."
                return Response(
                    {"error": msg},
                    status=status.HTTP_403_FORBIDDEN
                )

            user = self.get_object()
            new_status = request.data.get('status')

            # Verifica se o novo status é válido (1 ou 2)
            if new_status not in [1, 2]:
                msg = "Status inválido. Use 1 para Ativo ou 2 para Inativo."
                return Response(
                    {"error": msg},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user.status = new_status
            user.save()

            serializer = self.get_serializer(user)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Erro ao atualizar status do usuário: {str(e)}")
            return Response(
                {"error": "Erro ao atualizar status do usuário"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        description="Registra um novo usuário",
        request=UserCreateSerializer,
        responses={
            201: UserSerializer,
            400: {
                "type": "object",
                "properties": {
                    "error": {
                        "type": "string",
                        "description": "Detalhes do erro de validação"
                    },
                    "cpf": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Erros de validação do CPF"
                    },
                    "password_confirm": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Erros de validação da senha"
                    }
                }
            }
        }
    )
    @action(detail=False, methods=['post'])
    def register(self, request):
        """Registra um novo usuário"""
        try:
            serializer = UserCreateSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                return Response(
                    UserSerializer(user).data,
                    status=status.HTTP_201_CREATED
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Erro ao registrar usuário: {str(e)}")
            return Response(
                {"error": "Erro ao registrar usuário"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
