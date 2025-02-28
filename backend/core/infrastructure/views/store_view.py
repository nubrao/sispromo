from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.infrastructure.models.store_model import StoreModel
from core.infrastructure.serializers.store_serializer import StoreSerializer
import logging

logger = logging.getLogger(__name__)


class StoreViewSet(viewsets.ModelViewSet):
    """ ViewSet para gerenciar Lojas """

    queryset = StoreModel.objects.all()
    serializer_class = StoreSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        """ Lista todas as lojas """
        try:
            stores = self.get_queryset()
            serializer = self.get_serializer(stores, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Erro ao listar lojas: {e}")
            return Response(
                {"error": "Erro ao buscar lojas."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        """ Cria uma nova loja """
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            try:
                store = serializer.save()
                return Response(self.get_serializer(store).data, status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.error(f"Erro ao criar loja: {e}")
                return Response(
                    {"error": "Erro ao criar loja."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            logger.warning(
                f"Erro de validação ao criar loja: {serializer.errors}")
            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        """ Atualiza uma loja existente """
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=True)

        if serializer.is_valid():
            try:
                store = serializer.save()
                return Response(self.get_serializer(store).data, status=status.HTTP_200_OK)
            except Exception as e:
                logger.error(f"Erro ao atualizar loja: {e}")
                return Response(
                    {"error": "Erro ao atualizar loja."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            logger.warning(
                f"Erro de validação ao atualizar loja: {serializer.errors}")
            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        """ Deleta uma loja """
        instance = self.get_object()

        try:
            instance.delete()
            return Response({"message": "Loja excluída com sucesso."}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Erro ao excluir loja: {e}")
            return Response(
                {"error": "Erro ao excluir loja."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
