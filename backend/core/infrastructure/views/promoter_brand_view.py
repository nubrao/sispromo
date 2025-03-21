from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from core.infrastructure.models.promoter_brand_model import PromoterBrand
from core.infrastructure.serializers.promoter_brand_serializer import PromoterBrandSerializer


class PromoterBrandViewSet(viewsets.ModelViewSet):
    queryset = PromoterBrand.objects.all()
    serializer_class = PromoterBrandSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = PromoterBrand.objects.all()
        promoter_id = self.request.query_params.get('promoter_id', None)
        brand_id = self.request.query_params.get('brand_id', None)

        if promoter_id:
            queryset = queryset.filter(promoter_id=promoter_id)
        if brand_id:
            queryset = queryset.filter(brand_id=brand_id)

        return queryset
