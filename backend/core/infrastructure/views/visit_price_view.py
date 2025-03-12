from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.infrastructure.models.visit_price_model import VisitPriceModel
from core.infrastructure.serializers.visit_price_serializer import (
    VisitPriceSerializer,
)
import logging

logger = logging.getLogger(__name__)


class VisitPriceViewSet(viewsets.ModelViewSet):
    """ ViewSet para gerenciar Preços de Visita """

    queryset = VisitPriceModel.objects.all()
    serializer_class = VisitPriceSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        """ Lista todos os preços de visita """
        try:
            visit_prices = self.get_queryset()
            serializer = self.get_serializer(visit_prices, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Erro ao listar preços de visita: {e}")
            return Response(
                {"error": "Erro ao buscar preços de visita."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        """ Cria um novo preço de visita """
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            try:
                visit_price = serializer.save()
                return Response(self.get_serializer(visit_price).data,
                                status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.error(f"Erro ao criar preço de visita: {e}")
                return Response(
                    {"error": "Erro ao criar preço de visita."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            logger.warning(
                f"Erro de validação ao criar preço de visita: "
                f"{serializer.errors}")
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):
        """ Atualiza um preço de visita existente """
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=True)

        if serializer.is_valid():
            try:
                visit_price = serializer.save()
                return Response(self.get_serializer(visit_price).data,
                                status=status.HTTP_200_OK)
            except Exception as e:
                logger.error(f"Erro ao atualizar preço de visita: {e}")
                return Response(
                    {"error": "Erro ao atualizar preço de visita."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            logger.warning(
                f"Erro de validação ao atualizar preço de visita: "
                f"{serializer.errors}")
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, *args, **kwargs):
        """ Deleta um preço de visita """
        instance = self.get_object()

        try:
            instance.delete()
            return Response(
                {"message": "Preço de visita excluído com sucesso."},
                status=status.HTTP_204_NO_CONTENT
            )
        except Exception as e:
            logger.error(f"Erro ao excluir preço de visita: {e}")
            return Response(
                {"error": "Erro ao excluir preço de visita."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
