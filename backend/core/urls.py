from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .infrastructure.views.user_view import UserViewSet
from .infrastructure.views.auth_view import AuthViewSet
from .infrastructure.views.store_view import StoreViewSet
from .infrastructure.views.brand_view import BrandViewSet
from .infrastructure.views.visit_view import VisitViewSet
from .infrastructure.views.visit_price_view import VisitPriceViewSet
from .infrastructure.views.dashboard_view import DashboardView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='users')
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'stores', StoreViewSet, basename='stores')
router.register(r'visits', VisitViewSet, basename='visits')
router.register(r'brands', BrandViewSet, basename='brands')
router.register(r'visit-prices', VisitPriceViewSet, basename='visit-prices')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/dashboard/', DashboardView.as_view(), name='dashboard'),
]
