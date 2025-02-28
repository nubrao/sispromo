from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status, serializers
from core.infrastructure.models.state_model import StateChoices
from drf_spectacular.utils import extend_schema


class StateSerializer(serializers.Serializer):
    """ Serializer para documentar a resposta da lista de estados """
    states = serializers.ListField(
        child=serializers.ListField(
            child=serializers.CharField()
        )
    )


class StateListView(APIView):
    """
    Endpoint para obter a lista de estados disponíveis no sistema.
    """

    @extend_schema(
        responses={200: StateSerializer}
    )
    def get(self, request):
        """
        Retorna uma lista de estados.

        Resposta esperada:
        - 200: {"states": [["SP", "São Paulo"], ["RJ", "Rio de Janeiro"], ...]}
        """
        return Response({"states": StateChoices.choices}, status=status.HTTP_200_OK)
