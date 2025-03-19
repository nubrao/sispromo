from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.infrastructure.models.user_profile_model import UserProfileModel


class Command(BaseCommand):
    help = 'Atualiza o papel de um usuário'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username do usuário')
        parser.add_argument(
            'role', type=str, help='Novo papel (manager, analyst, promoter)')

    def handle(self, *args, **options):
        username = options['username']
        role = options['role']

        try:
            user = User.objects.get(username=username)

            # Verifica se o usuário tem um perfil
            try:
                profile = user.userprofile
            except UserProfileModel.DoesNotExist:
                profile = UserProfileModel.objects.create(
                    user=user,
                    role=role
                )

            # Atualiza o papel
            profile.role = role
            profile.save()

            self.stdout.write(
                self.style.SUCCESS(
                    f'Papel do usuário {username} atualizado para {role}'
                )
            )
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Usuário {username} não encontrado')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Erro ao atualizar papel: {str(e)}')
            )
