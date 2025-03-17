from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .infrastructure.views.user_view import UserViewSet
from .infrastructure.views.auth_view import (
    LogoutView,
    PasswordResetRequestView,
    PasswordResetConfirmView
)
from .infrastructure.views.promoter_view import PromoterViewSet
from .infrastructure.views.store_view import StoreViewSet
from .infrastructure.views.brand_view import BrandViewSet
from .infrastructure.views.visit_view import VisitViewSet
from .infrastructure.views.promoter_brand_view import PromoterBrandViewSet
from .infrastructure.views.visit_price_view import VisitPriceViewSet

router = DefaultRouter()
router.register(r'promoters', PromoterViewSet)
router.register(r'stores', StoreViewSet)
router.register(r'visits', VisitViewSet)
router.register(r'brands', BrandViewSet)
router.register(r'visit-prices', VisitPriceViewSet)
router.register(r'users', UserViewSet)
router.register(r'promoter-brands', PromoterBrandViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/logout/', LogoutView.as_view(), name='auth_logout'),
    path('auth/password-reset/',
         PasswordResetRequestView.as_view(), name='password_reset'),
    path('auth/password-reset/confirm/',
         PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]
