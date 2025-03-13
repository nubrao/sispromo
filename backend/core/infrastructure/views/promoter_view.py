from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.infrastructure.models.promoter_model import PromoterModel
from core.infrastructure.serializers.promoter_serializer import PromoterSerializer
from drf_spectacular.utils import extend_schema, extend_schema_view
import logging

logger = logging.getLogger(__name__)


@extend_schema_view(
    list=extend_schema(
        description="Lista todos os promotores cadastrados",
        responses={
            200: PromoterSerializer(many=True),
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    ),
    create=extend_schema(
        description="Cria um novo promotor",
        request=PromoterSerializer,
        responses={
            201: PromoterSerializer,
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
    update=extend_schema(
        description="Atualiza um promotor existente",
        request=PromoterSerializer,
        responses={
            200: PromoterSerializer,
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
        description="Deleta um promotor",
        responses={
            204: None,
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    )
)
class PromoterViewSet(viewsets.ModelViewSet):
    """ ViewSet para gerenciar Promotores """

    queryset = PromoterModel.objects.all()
    serializer_class = PromoterSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        """ Lista todos os promotores """
        try:
            promoters = self.get_queryset()
            serializer = self.get_serializer(promoters, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Erro ao listar promotores: {e}")
            return Response(
                {"error": "Erro ao buscar promotores."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        """ Cria um novo promotor """
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            try:
                promoter = serializer.save()
                return Response(self.get_serializer(promoter).data, status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.error(f"Erro ao criar promotor: {e}")
                return Response(
                    {"error": "Erro ao criar promotor."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            logger.warning(
                f"Erro de validação ao criar promotor: {serializer.errors}")
            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        """ Atualiza um promotor existente """
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=True)

        if serializer.is_valid():
            try:
                promoter = serializer.save()
                return Response(self.get_serializer(promoter).data, status=status.HTTP_200_OK)
            except Exception as e:
                logger.error(f"Erro ao atualizar promotor: {e}")
                return Response(
                    {"error": "Erro ao atualizar promotor."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            logger.warning(
                f"Erro de validação ao atualizar promotor: {serializer.errors}")
            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        """ Deleta um promotor """
        instance = self.get_object()

        try:
            instance.delete()
            return Response({"message": "Promotor excluído com sucesso."}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Erro ao excluir promotor: {e}")
            return Response(
                {"error": "Erro ao excluir promotor."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
