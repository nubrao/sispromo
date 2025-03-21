from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth import get_user_model
from core.infrastructure.models import (
    BrandModel,
    StoreModel,
    VisitModel
)

User = get_user_model()

# Se o User já estiver registrado, remove antes de registrar novamente
if User in admin.site._registry:
    admin.site.unregister(User)


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
            'fields': ('is_active', 'is_staff', 'is_superuser', 'role', 'status')
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
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(StoreModel)
class StoreAdmin(admin.ModelAdmin):
    list_display = ('name', 'number', 'city', 'state')
    search_fields = ('name', 'number', 'city')
    list_filter = ('state',)


@admin.register(VisitModel)
class VisitAdmin(admin.ModelAdmin):
    list_display = ('promoter', 'store', 'visit_date', 'status')
    search_fields = ('promoter__first_name',
                     'promoter__last_name', 'store__name')
    list_filter = ('status', 'visit_date')


# Registra o modelo User com o CustomUserAdmin
admin.site.register(User, CustomUserAdmin)
