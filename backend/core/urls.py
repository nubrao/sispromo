from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .infrastructure.views.auth_view import LogoutView
from .infrastructure.views.brand_view import BrandViewSet
from .infrastructure.views.promoter_view import PromoterViewSet
from .infrastructure.views.state_view import StateViewSet
from .infrastructure.views.store_view import StoreViewSet
from .infrastructure.views.visit_price_view import VisitPriceViewSet
from .infrastructure.views.visit_view import VisitViewSet
from .infrastructure.views.user_view import UserViewSet

router = DefaultRouter()
router.register(r'brands', BrandViewSet)
router.register(r'promoters', PromoterViewSet)
router.register(r'states', StateViewSet)
router.register(r'stores', StoreViewSet)
router.register(r'visit-prices', VisitPriceViewSet)
router.register(r'visits', VisitViewSet)
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
]
