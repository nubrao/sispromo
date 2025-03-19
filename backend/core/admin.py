from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from core.infrastructure.models.user_profile_model import UserProfileModel
from core.infrastructure.models.promoter_model import PromoterModel
from core.infrastructure.models.brand_model import BrandModel
from core.infrastructure.models.store_model import StoreModel
from core.infrastructure.models.visit_model import VisitModel


class UserProfileInline(admin.StackedInline):
    model = UserProfileModel
    can_delete = False
    verbose_name_plural = 'Perfil'


class CustomUserAdmin(UserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'get_role')
    search_fields = ('username', 'email', 'first_name', 'last_name')

    def get_role(self, obj):
        return obj.userprofile.get_role_display()
    get_role.short_description = 'Papel'


@admin.register(PromoterModel)
class PromoterAdmin(admin.ModelAdmin):
    list_display = ('name', 'cpf', 'phone', 'get_email')
    search_fields = ('first_name', 'last_name', 'cpf', 'phone')
    list_filter = ('user_profile__role',)

    def get_email(self, obj):
        if obj.user_profile and obj.user_profile.user:
            return obj.user_profile.user.email
        return '-'
    get_email.short_description = 'Email'


@admin.register(BrandModel)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'id')
    search_fields = ('name', 'id')


@admin.register(StoreModel)
class StoreAdmin(admin.ModelAdmin):
    list_display = ('name', 'number', 'city', 'state', 'cnpj')
    search_fields = ('name', 'number', 'city', 'state', 'cnpj')
    list_filter = ('state',)


@admin.register(VisitModel)
class VisitAdmin(admin.ModelAdmin):
    list_display = ('promoter', 'store', 'brand', 'visit_date')
    search_fields = ('promoter__first_name',
                     'promoter__last_name', 'store__name')
    list_filter = ('visit_date', 'brand__name')
    date_hierarchy = 'visit_date'


# Desregistra o UserAdmin padrão e registra o CustomUserAdmin
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
