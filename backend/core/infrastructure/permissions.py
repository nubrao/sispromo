from rest_framework import permissions


class IsManagerOrAnalyst(permissions.BasePermission):
    """
    Permissão personalizada para permitir apenas gerentes e analistas.
    """

    def has_permission(self, request, view):
        """
        Verifica se o usuário tem permissão para acessar a view.
        Apenas gerentes e analistas têm acesso.
        """
        if not request.user.is_authenticated:
            return False
        return request.user.role in [2, 3]  # 2 = Analista, 3 = Gestor
