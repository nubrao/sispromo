from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .infrastructure.views.user_view import UserViewSet
from .infrastructure.views.auth_view import (
    LoginView, LogoutView, CheckAuthView, ChangePasswordView
)
from .infrastructure.views.promoter_view import PromoterViewSet
from .infrastructure.views.store_view import StoreViewSet
from .infrastructure.views.brand_view import BrandViewSet
from .infrastructure.views.visit_view import VisitViewSet
from .infrastructure.views.promoter_brand_view import PromoterBrandViewSet
from .infrastructure.views.visit_price_view import VisitPriceViewSet

router = DefaultRouter()
router.register(r'promoters', PromoterViewSet, basename='promoter')
router.register(r'stores', StoreViewSet)
router.register(r'visits', VisitViewSet)
router.register(r'brands', BrandViewSet)
router.register(r'visit-prices', VisitPriceViewSet)
router.register(r'users', UserViewSet)
router.register(r'promoter-brands', PromoterBrandViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/check/', CheckAuthView.as_view(), name='check-auth'),
    path('auth/change-password/',
         ChangePasswordView.as_view(), name='change-password'),
]
