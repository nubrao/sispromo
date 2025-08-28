from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.views.decorators.cache import never_cache
from django.utils.decorators import method_decorator
from core.infrastructure.models.promoter_brand_model import PromoterBrand
from core.infrastructure.serializers.promoter_brand_serializer import PromoterBrandSerializer
import logging

logger = logging.getLogger(__name__)

@method_decorator(never_cache, name='dispatch')
class PromoterBrandViewSet(viewsets.ModelViewSet):
    serializer_class = PromoterBrandSerializer
    queryset = PromoterBrand.objects.all()

    def get_queryset(self):
        """
        Get fresh data directly from database
        """
        promoter_id = self.request.query_params.get('promoter_id')
        queryset = PromoterBrand.objects.select_related(
            'promoter',
            'brand'
        ).all()

        if promoter_id:
            queryset = queryset.filter(promoter_id=promoter_id)

        logger.info(f"Fetching promoter-brands data. Promoter ID filter: {promoter_id}")
        return queryset.order_by('created_at')

    def list(self, request, *args, **kwargs):
        """Override list method to ensure fresh data"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def sync_promoter_brands(self, request):
        """
        Synchronize all brands for a promoter
        """
        try:
            promoter_id = request.data.get('promoter_id')
            brand_ids = request.data.get('brands', [])

            if not promoter_id:
                return Response(
                    {'error': 'promoter_id is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            logger.info(f"Syncing brands for promoter {promoter_id}: {brand_ids}")

            # Remove existing brand associations
            PromoterBrand.objects.filter(promoter_id=promoter_id).delete()

            # Create new associations
            new_brands = []
            for brand_id in brand_ids:
                new_brands.append(
                    PromoterBrand(
                        promoter_id=promoter_id,
                        brand_id=brand_id
                    )
                )

            if new_brands:
                PromoterBrand.objects.bulk_create(new_brands)

            # Get updated brands
            updated_brands = PromoterBrand.objects.filter(
                promoter_id=promoter_id
            ).select_related('promoter', 'brand')

            serializer = self.get_serializer(updated_brands, many=True)
            return Response(serializer.data)

        except Exception as e:
            logger.error(f"Error syncing brands: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
