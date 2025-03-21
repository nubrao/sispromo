"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView
from core.infrastructure.views.store_view import StoreViewSet
from core.infrastructure.views.visit_view import VisitViewSet
from core.infrastructure.views.auth_view import LogoutView
from core.infrastructure.views.state_view import StateListView
from core.infrastructure.views.brand_view import BrandViewSet
from core.infrastructure.views.user_view import UserViewSet
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

router = DefaultRouter()
router.register(r"stores", StoreViewSet)
router.register(r"visits", VisitViewSet, basename="visit")
router.register(r'brands', BrandViewSet)
router.register(r"users", UserViewSet, basename="user")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path(
        "api/token/",
        TokenObtainPairView.as_view(),
        name="token_obtain_pair"
    ),
    path(
        "api/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh"
    ),
    path("api/logout/", LogoutView.as_view(), name="logout"),
    path("api/states/", StateListView.as_view(), name="state-list"),

    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("swagger/", SpectacularSwaggerView.as_view(url_name="schema"),
         name="swagger-ui"),
    path(
        "redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc-ui"
    ),
]
