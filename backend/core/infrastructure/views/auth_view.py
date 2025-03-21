from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status, serializers
from drf_spectacular.utils import extend_schema
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.crypto import get_random_string
from django.utils import timezone
from datetime import timedelta
import logging
from rest_framework import viewsets
from rest_framework.decorators import action
from django.contrib.auth import authenticate

from ..serializers.user_serializer import UserSerializer

logger = logging.getLogger(__name__)
User = get_user_model()


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField()
    password_confirm = serializers.CharField()

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'As senhas não coincidem.'
            })
        return data


class LogoutSerializer(serializers.Serializer):
    """ Serializer para documentar a resposta do logout """
    message = serializers.CharField()


class PasswordResetRequestView(APIView):
    """
    Endpoint para solicitar redefinição de senha.
    Não requer autenticação.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        request=PasswordResetRequestSerializer,
        responses={
            200: {"type": "object", "properties": {"message": {"type": "string"}}},  # noqa: E501
            400: {"type": "object", "properties": {"error": {"type": "string"}}}   # noqa: E501
        }
    )
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)  # noqa: E501

        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)

            # Gera token único
            token = get_random_string(64)

            # Salva o token e a data de expiração no usuário
            user.reset_token = token
            user.reset_token_expiry = timezone.now() + timedelta(hours=24)
            user.save()

            # Envia email com o link de redefinição
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
            context = {
                'user': user,
                'reset_url': reset_url
            }

            html_message = render_to_string(
                'reset_password_email.html', context)

            send_mail(
                'Redefinição de Senha',
                'Clique no link para redefinir sua senha',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                html_message=html_message,
                fail_silently=False
            )

            return Response({
                "message": "Se o email existir em nossa base, você receberá instruções para redefinir sua senha."  # noqa: E501
            })
        except User.DoesNotExist:
            # Retorna a mesma mensagem para não revelar se o email existe
            return Response({
                "message": "Se o email existir em nossa base, você receberá instruções para redefinir sua senha."   # noqa: E501
            })
        except Exception as e:
            logger.error(
                f"Erro ao processar solicitação de redefinição de senha: {e}")
            return Response(
                {"error": "Erro ao processar solicitação."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PasswordResetConfirmView(APIView):
    """
    Endpoint para confirmar a redefinição de senha.
    Não requer autenticação.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        request=PasswordResetConfirmSerializer,
        responses={
            200: {"type": "object", "properties": {"message": {"type": "string"}}},   # noqa: E501
            400: {"type": "object", "properties": {"error": {"type": "string"}}}   # noqa: E501
        }
    )
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)   # noqa: E501

        token = serializer.validated_data['token']
        password = serializer.validated_data['password']

        try:
            user = User.objects.get(
                reset_token=token,
                reset_token_expiry__gt=timezone.now()
            )

            user.set_password(password)
            user.reset_token = None
            user.reset_token_expiry = None
            user.save()

            return Response({"message": "Senha redefinida com sucesso."})
        except User.DoesNotExist:
            return Response(
                {"error": "Token inválido ou expirado."},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Erro ao redefinir senha: {e}")
            return Response(
                {"error": "Erro ao redefinir senha."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LogoutView(APIView):
    """
    Endpoint para realizar logout e invalidar o token de atualização.
    Requer autenticação.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=None,
        responses={
            200: LogoutSerializer,
            400: LogoutSerializer,
        }
    )
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"error": "Nenhum token de atualização fornecido."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response(
                {"message": "Logout realizado com sucesso."},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Erro ao fazer logout: {e}")
            return Response(
                {"error": "Token inválido ou já expirado."},
                status=status.HTTP_400_BAD_REQUEST
            )


class AuthViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]
    serializer_class = UserSerializer

    @extend_schema(
        description="Login do usuário",
        request={
            "type": "object",
            "properties": {
                "username": {"type": "string", "description": "CPF do usuário"},
                "password": {"type": "string", "description": "Senha do usuário"}
            },
            "required": ["username", "password"]
        },
        responses={
            200: {
                "type": "object",
                "properties": {
                    "access": {"type": "string", "description": "Token de acesso JWT"},
                    "refresh": {"type": "string", "description": "Token de atualização JWT"},
                    "user": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "integer"},
                            "username": {"type": "string"},
                            "email": {"type": "string"},
                            "first_name": {"type": "string"},
                            "last_name": {"type": "string"},
                            "role": {"type": "integer", "description": "1=Promotor, 2=Analista, 3=Gestor"},
                            "role_display": {"type": "string"},
                            "status": {"type": "integer", "description": "0=Inativo, 1=Ativo"},
                            "status_display": {"type": "string"},
                            "cpf": {"type": "string"},
                            "phone": {"type": "string"}
                        }
                    }
                }
            },
            401: {
                "type": "object",
                "properties": {
                    "error": {
                        "type": "string",
                        "description": "Mensagem de erro de autenticação"
                    }
                }
            }
        }
    )
    @action(detail=False, methods=['post'])
    def login(self, request):
        """
        Endpoint para login do usuário.
        Retorna tokens JWT e dados do usuário.
        """
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {"error": "Credenciais incompletas."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=username, password=password)

        if not user:
            return Response(
                {"error": "Credenciais inválidas."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {"error": "Usuário inativo."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)
        serializer = self.serializer_class(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': serializer.data
        })

    @extend_schema(
        description="Logout do usuário",
        request={
            "type": "object",
            "properties": {
                "refresh": {"type": "string"}
            },
            "required": ["refresh"]
        },
        responses={
            200: {
                "type": "object",
                "properties": {
                    "message": {"type": "string"}
                }
            }
        }
    )
    @action(detail=False, methods=['post'])
    def logout(self, request):
        """
        Endpoint para logout do usuário.
        Invalida o token de atualização.
        """
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"error": "Nenhum token de atualização fornecido."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response(
                {"message": "Logout realizado com sucesso."},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Erro ao fazer logout: {e}")
            return Response(
                {"error": "Token inválido ou já expirado."},
                status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        description="Verifica se o token é válido",
        responses={
            200: {
                "type": "object",
                "properties": {
                    "is_authenticated": {"type": "boolean"},
                    "user": UserSerializer
                }
            }
        }
    )
    @action(detail=False, methods=['get'])
    def check(self, request):
        """
        Endpoint para verificar se o token é válido.
        Retorna dados do usuário se autenticado.
        """
        if not request.user.is_authenticated:
            return Response({
                'is_authenticated': False,
                'user': None
            })

        serializer = self.serializer_class(request.user)
        return Response({
            'is_authenticated': True,
            'user': serializer.data
        })
