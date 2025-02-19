from rest_framework.response import Response
from rest_framework import status, viewsets
from core.infrastructure.models.brand_model import BrandModel
from core.infrastructure.serializers.brand_serializer import BrandSerializer
from rest_framework.permissions import IsAuthenticated
import logging

logger = logging.getLogger(__name__)


class BrandViewSet(viewsets.ModelViewSet):
    queryset = BrandModel.objects.prefetch_related('stores').all()
    serializer_class = BrandSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        brands = BrandModel.objects.prefetch_related('stores').all()
        results = []

        for brand in brands:
            for brand_store in brand.brandstore_set.all():
                results.append({
                    "brand_id": brand.id,
                    "brand_name": brand.name,
                    "store_id": brand_store.store.id,
                    "store_name": brand_store.store.name,
                    "visit_frequency": brand_store.visit_frequency,
                })

        return Response(results, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            brand = serializer.save()

            response_data = BrandSerializer(brand).data

            return Response(response_data, status=status.HTTP_201_CREATED)
        else:
            logger.error(f"Erro ao criar marca: {serializer.errors}")
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
