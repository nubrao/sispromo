from rest_framework import viewsets, status
from rest_framework.response import Response
from core.infrastructure.models.promoter_brand_model import PromoterBrand
from core.infrastructure.serializers.promoter_brand_serializer import PromoterBrandSerializer
from core.infrastructure.repositories.promoter_brand_repository import PromoterBrandRepository
from rest_framework.permissions import IsAuthenticated


class PromoterBrandViewSet(viewsets.ModelViewSet):
    serializer_class = PromoterBrandSerializer
    permission_classes = [IsAuthenticated]
    repository = PromoterBrandRepository()

    def get_queryset(self):
        promoter_id = self.request.query_params.get('promoter_id', None)

        if promoter_id:
            return self.repository.get_promoter_brands_by_promoter(promoter_id)
        return self.repository.get_all_promoter_brands()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        promoter_brand = self.repository.create_promoter_brand(
            promoter_id=serializer.validated_data['promoter_id'],
            brand_id=serializer.validated_data['brand_id']
        )

        serializer = self.get_serializer(promoter_brand)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        try:
            self.repository.delete_promoter_brand(kwargs['pk'])
            return Response(status=status.HTTP_204_NO_CONTENT)
        except PromoterBrand.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def update_promoter_brands(self, request, promoter_id):
        """
        Atualiza todas as marcas de um promotor de uma vez.
        """
        brand_ids = request.data.get('brand_ids', [])
        self.repository.update_promoter_brands(promoter_id, brand_ids)
        return Response(status=status.HTTP_200_OK)
