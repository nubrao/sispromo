from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from core.infrastructure.models.store_model import StoreModel
from core.infrastructure.models.brand_model import BrandModel
from core.infrastructure.models.visit_model import VisitModel
from core.infrastructure.models.promoter_brand_model import PromoterBrand
from .infrastructure.models.user_model import User


class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name',
                    'last_name', 'role_display', 'status_display')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'cpf')
    list_filter = ('is_active', 'is_staff')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Informações Pessoais', {
            'fields': ('first_name', 'last_name', 'email', 'cpf', 'phone')
        }),
        ('Permissões', {
            'fields': ('is_active', 'is_staff',
                       'is_superuser', 'role', 'status')
        }),
        ('Datas Importantes', {
            'fields': ('last_login',)
        }),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2', 'email',
                       'first_name', 'last_name', 'cpf', 'phone', 'role')
        }),
    )

    def role_display(self, obj):
        return obj.get_role_display()
    role_display.short_description = 'Papel'

    def status_display(self, obj):
        return obj.get_status_display()
    status_display.short_description = 'Status'


@admin.register(BrandModel)
class BrandModelAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(StoreModel)
class StoreModelAdmin(admin.ModelAdmin):
    list_display = ('name', 'number', 'city', 'state')
    search_fields = ('name', 'number', 'city', 'state')
    list_filter = ('state',)


@admin.register(VisitModel)
class VisitAdmin(admin.ModelAdmin):
    list_display = ('promoter', 'brand', 'visit_date', 'status')
    search_fields = ('promoter__first_name', 'brand__name')
    list_filter = ('visit_date', 'brand', 'status')


@admin.register(PromoterBrand)
class PromoterBrandAdmin(admin.ModelAdmin):
    list_display = ('promoter', 'brand', 'created_at', 'updated_at')
    search_fields = ('promoter__first_name',
                     'promoter__last_name', 'brand__name')
    list_filter = ('brand', 'created_at')


# Registra o modelo User com o CustomUserAdmin
admin.site.register(User, CustomUserAdmin)
