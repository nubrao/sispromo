from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.infrastructure.models.visit_model import VisitModel
from core.infrastructure.serializers.visit_serializer import VisitSerializer
import logging

logger = logging.getLogger(__name__)


class VisitViewSet(viewsets.ModelViewSet):
    """ ViewSet para gerenciar Visitas """

    queryset = VisitModel.objects.select_related(
        "promoter", "store", "brand").all()
    serializer_class = VisitSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        """ Lista todas as visitas """
        try:
            visits = self.get_queryset()
            serializer = self.get_serializer(visits, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Erro ao listar visitas: {e}")
            return Response(
                {"error": "Erro ao buscar visitas."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        """ Cria uma nova visita """
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            try:
                visit = serializer.save()
                return Response(
                    self
                    .get_serializer(visit)
                    .data, status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.error(f"Erro ao criar visita: {e}")
                return Response(
                    {"error": "Erro ao criar visita."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            logger.warning(
                f"Erro de validação ao criar visita: {serializer.errors}")
            return Response(
                {"error": serializer.errors}, status=status
                .HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        """ Atualiza uma visita existente """
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=True)

        if serializer.is_valid():
            try:
                visit = serializer.save()
                return Response(self
                                .get_serializer(visit)
                                .data, status=status.HTTP_200_OK)
            except Exception as e:
                logger.error(f"Erro ao atualizar visita: {e}")
                return Response(
                    {"error": "Erro ao atualizar visita."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            logger.warning(
                f"Erro de validação ao atualizar visita: {serializer.errors}")
            return Response({"error": serializer.errors}, status=status
                            .HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        """ Deleta uma visita """
        instance = self.get_object()

        try:
            instance.delete()
            return Response(
                {"message": "Visita excluída com sucesso."}, status=status
                .HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Erro ao excluir visita: {e}")
            return Response(
                {"error": "Erro ao excluir visita."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
