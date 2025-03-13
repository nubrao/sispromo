from django.core.management.base import BaseCommand
from core.infrastructure.models import PromoterModel


class Command(BaseCommand):
    help = 'Vincula automaticamente promotores disponíveis a usuários promotores sem vínculo'

    def handle(self, *args, **options):
        try:
            PromoterModel.auto_link_promoters()
            self.stdout.write(
                self.style.SUCCESS(
                    'Vinculação automática de promotores concluída com sucesso!')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Erro ao vincular promotores: {str(e)}')
            )
