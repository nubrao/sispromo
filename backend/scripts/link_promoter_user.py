#!/usr/bin/env python
from core.infrastructure.models.promoter_model import PromoterModel
from django.contrib.auth.models import User
import os
import sys
import django

# Configura o ambiente Django
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.insert(0, project_root)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# Importa os modelos após configurar o Django


def link_promoter_to_user(promoter_id, user_id):
    """
    Vincula um promotor a um usuário específico.

    Args:
        promoter_id (int): ID do promotor
        user_id (int): ID do usuário

    Returns:
        bool: True se a vinculação foi bem sucedida, False caso contrário
    """
    try:
        promoter = PromoterModel.objects.get(id=promoter_id)
        user = User.objects.get(id=user_id)

        # Verifica se o usuário já tem um promotor vinculado
        if hasattr(user.userprofile, 'promoter') and user.userprofile.promoter:
            print("Erro: O usuário {} já tem um promotor vinculado.".format(
                user.username))
            return False

        # Vincula o promotor ao perfil do usuário
        promoter.user_profile = user.userprofile
        promoter.save()

        print("Sucesso: Promotor {} vinculado ao usuário {}".format(
            promoter.name, user.username))
        return True

    except PromoterModel.DoesNotExist:
        print(f"Erro: Promotor com ID {promoter_id} não encontrado.")
        return False
    except User.DoesNotExist:
        print(f"Erro: Usuário com ID {user_id} não encontrado.")
        return False
    except Exception as e:
        print(f"Erro ao vincular promotor ao usuário: {str(e)}")
        return False


def list_promoters():
    """Lista todos os promotores cadastrados"""
    promoters = PromoterModel.objects.all()
    print("\nPromotores cadastrados:")
    print("-" * 50)
    for promoter in promoters:
        user = promoter.user_profile.user if promoter.user_profile else None
        status = "Vinculado" if user else "Não vinculado"
        print("ID: {} | Nome: {} | CPF: {} | Status: {}".format(
            promoter.id, promoter.name, promoter.cpf, status))
    print("-" * 50)


def list_users():
    """Lista todos os usuários cadastrados"""
    users = User.objects.all()
    print("\nUsuários cadastrados:")
    print("-" * 50)
    for user in users:
        promoter = user.userprofile.promoter if hasattr(
            user.userprofile, 'promoter') else None
        status = "Vinculado" if promoter else "Não vinculado"
        print("ID: {} | Username: {} | Email: {} | Status: {}".format(
            user.id, user.username, user.email, status))
    print("-" * 50)


def main():
    while True:
        print("\nMenu de Vinculação de Promotor-Usuário")
        print("1. Listar promotores")
        print("2. Listar usuários")
        print("3. Vincular promotor a usuário")
        print("4. Sair")

        opcao = input("\nEscolha uma opção (1-4): ")

        if opcao == "1":
            list_promoters()
        elif opcao == "2":
            list_users()
        elif opcao == "3":
            try:
                promoter_id = int(input("Digite o ID do promotor: "))
                user_id = int(input("Digite o ID do usuário: "))
                link_promoter_to_user(promoter_id, user_id)
            except ValueError:
                print("Erro: Por favor, digite números válidos para os IDs.")
        elif opcao == "4":
            print("Saindo...")
            break
        else:
            print("Opção inválida. Tente novamente.")


if __name__ == "__main__":
    main()
