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

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        data = request.data.copy()

        try:
            if "store_id" in data:
                from core.infrastructure.models.store_model import StoreModel
                store = StoreModel.objects.get(id=data["store_id"])
                instance.stores.set([store])

            if "brand_name" in data:
                instance.name = data["brand_name"]

            instance.save()  # Salva as alterações no banco
            serializer = self.get_serializer(instance)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
