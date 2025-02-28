from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status, serializers
from drf_spectacular.utils import extend_schema

import logging

logger = logging.getLogger(__name__)


class LogoutSerializer(serializers.Serializer):
    """ Serializer para documentar a resposta do logout """
    message = serializers.CharField()


class LogoutView(APIView):
    """
    Endpoint para realizar logout e invalidar o token de atualização.
    Requer autenticação.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=None,  # O logout não precisa de dados no request
        responses={
            200: LogoutSerializer,
            400: serializers.DictField(),  # Erros são dicionários com mensagens
        }
    )
    def post(self, request):
        """
        Invalida o refresh token e desloga o usuário.

        Retorna:
        - 200: {"message": "Logout realizado com sucesso."}
        - 400: {"error": "Nenhum token de atualização fornecido."} ou {"error": "Token inválido ou já expirado."}
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
