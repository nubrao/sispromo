from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status, serializers
from drf_spectacular.utils import extend_schema
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.crypto import get_random_string
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


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
            200: {"type": "object", "properties": {"message": {"type": "string"}}},
            400: {"type": "object", "properties": {"error": {"type": "string"}}}
        }
    )
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)

            # Gera token único
            token = get_random_string(64)

            # Salva o token e a data de expiração no perfil do usuário
            profile = user.userprofile
            profile.reset_token = token
            profile.reset_token_expiry = timezone.now() + timedelta(hours=24)
            profile.save()

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
                "message": "Se o email existir em nossa base, você receberá instruções para redefinir sua senha."
            })
        except User.DoesNotExist:
            # Retorna a mesma mensagem para não revelar se o email existe
            return Response({
                "message": "Se o email existir em nossa base, você receberá instruções para redefinir sua senha."
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
            200: {"type": "object", "properties": {"message": {"type": "string"}}},
            400: {"type": "object", "properties": {"error": {"type": "string"}}}
        }
    )
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        token = serializer.validated_data['token']
        password = serializer.validated_data['password']

        try:
            profile = UserProfile.objects.get(
                reset_token=token,
                reset_token_expiry__gt=timezone.now()
            )

            user = profile.user
            user.set_password(password)
            user.save()

            # Limpa o token após o uso
            profile.reset_token = None
            profile.reset_token_expiry = None
            profile.save()

            return Response({"message": "Senha redefinida com sucesso."})
        except UserProfile.DoesNotExist:
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
