from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .infrastructure.models.user_profile_model import UserProfile


class CustomUserAdmin(UserAdmin):
    list_display = ("username", "first_name", "last_name",
                    "is_staff")
    list_filter = ("is_staff", "is_superuser", "is_active")


class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role')
    list_filter = ('role',)
    search_fields = ('user__username', 'user__email')


admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
admin.site.register(UserProfile, UserProfileAdmin)
