from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status

import logging

logger = logging.getLogger(__name__)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist() 
            return Response({"message": "Logout realizado com sucesso."},
                            status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Erro ao fazer logout: {e}")
            return Response({"error": "Token inválido ou já expirado."},
                            status=status.HTTP_400_BAD_REQUEST)
