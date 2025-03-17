from rest_framework import permissions


class IsManagerOrAnalyst(permissions.BasePermission):
    """
    Permissão personalizada para permitir apenas gerentes e analistas.
    """

    def has_permission(self, request, view):
        # Verifica se o usuário está autenticado
        if not request.user.is_authenticated:
            return False

        # Verifica se o usuário tem um perfil
        if not hasattr(request.user, 'userprofile'):
            return False

        # Verifica se o papel do usuário é manager ou analyst
        return request.user.userprofile.role in ['manager', 'analyst']
