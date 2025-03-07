from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.infrastructure.models.visit_model import VisitModel
from core.infrastructure.serializers.visit_serializer import VisitSerializer
from rest_framework.decorators import action
from django.utils.dateparse import parse_date
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

    @action(detail=False, methods=["get"], url_path="reports")
    def get_report(self, request):
        """
        Gera um relatório filtrado com base nos parâmetros passados:
        - promoter: ID do promotor
        - store: ID da loja
        - brand: ID da marca
        - start_date: Data inicial (YYYY-MM-DD)
        - end_date: Data final (YYYY-MM-DD)
        """
        promoter_id = request.query_params.get("promoter")
        store_id = request.query_params.get("store")
        brand_id = request.query_params.get("brand")
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        queryset = VisitModel.objects.select_related("promoter", "store", "brand").all()

        if promoter_id:
            queryset = queryset.filter(promoter_id=promoter_id)
        if store_id:
            queryset = queryset.filter(store_id=store_id)
        if brand_id:
            queryset = queryset.filter(brand_id=brand_id)
        if start_date:
            queryset = queryset.filter(visit_date__gte=parse_date(start_date))
        if end_date:
            queryset = queryset.filter(visit_date__lte=parse_date(end_date))

        queryset = queryset.order_by("visit_date")

        serializer = VisitSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
