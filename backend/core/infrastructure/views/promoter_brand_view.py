from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema, extend_schema_view
import logging
from ..models.promoter_brand_model import PromoterBrandModel
from ..serializers.promoter_brand_serializer import PromoterBrandSerializer
from ..permissions import IsManagerOrAnalyst

logger = logging.getLogger(__name__)


@extend_schema_view(
    list=extend_schema(
        description="Lista todas as atribuições de marcas a promotores",
        responses={200: PromoterBrandSerializer(many=True)}
    ),
    create=extend_schema(
        description="Cria uma nova atribuição de marca a promotor",
        request=PromoterBrandSerializer,
        responses={201: PromoterBrandSerializer}
    ),
    destroy=extend_schema(
        description="Remove uma atribuição de marca a promotor",
        responses={204: None}
    )
)
class PromoterBrandViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar atribuições de marcas a promotores"""
    queryset = PromoterBrandModel.objects.all()
    serializer_class = PromoterBrandSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAnalyst]

    def get_queryset(self):
        """Retorna o queryset de todas as atribuições."""
        return self.queryset.select_related('promoter', 'brand', 'brand__store')

    def create(self, request, *args, **kwargs):
        """Cria uma nova atribuição verificando duplicatas."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Verifica se já existe uma atribuição igual
        if PromoterBrandModel.objects.filter(
            promoter=serializer.validated_data['promoter'],
            brand=serializer.validated_data['brand']
        ).exists():
            return Response(
                {"error": "Esta marca já está atribuída a este promotor."},
                status=status.HTTP_400_BAD_REQUEST
            )

        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Atualiza uma atribuição existente"""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(
                instance,
                data=request.data,
                partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Erro ao atualizar atribuição: {str(e)}")
            return Response(
                {"error": "Erro ao atualizar atribuição"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, *args, **kwargs):
        """Remove uma atribuição"""
        try:
            instance = self.get_object()
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Erro ao remover atribuição: {str(e)}")
            return Response(
                {"error": "Erro ao remover atribuição"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def my_brands(self, request):
        """Retorna as marcas atribuídas ao promotor"""
        try:
            promoter = request.user.userprofile.promoter
            assignments = PromoterBrandModel.objects.filter(promoter=promoter)
            serializer = self.get_serializer(assignments, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Erro ao buscar marcas do promotor: {str(e)}")
            return Response(
                {"error": "Erro ao buscar marcas do promotor"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
