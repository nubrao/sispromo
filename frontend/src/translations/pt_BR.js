export const pt_BR = {
    login: {
        title: 'Login',
        username: {
            placeholder: 'CPF',
            required: 'Por favor, insira seu CPF'
        },
        password: {
            placeholder: 'Senha',
            required: 'Por favor, insira sua senha'
        },
        submit: 'Entrar',
        success: 'Login realizado com sucesso!',
        error: 'Erro ao fazer login. Por favor, tente novamente.'
    },
    register: {
        title: 'Criar Conta no SisPromo',
        firstName: {
            placeholder: 'Nome',
            required: 'Por favor, insira seu nome'
        },
        lastName: {
            placeholder: 'Sobrenome',
            required: 'Por favor, insira seu sobrenome'
        },
        cpf: {
            placeholder: 'CPF (000.000.000-00)',
            required: 'Por favor, insira seu CPF',
            invalid: 'CPF inválido',
            format: 'CPF deve conter 11 dígitos numéricos',
            exists: 'Já existe um usuário cadastrado com este CPF'
        },
        phone: {
            placeholder: 'Telefone ((00) 00000-0000)',
            required: 'Por favor, insira seu telefone',
            invalid: 'Telefone inválido',
            format: 'Telefone deve ter entre 10 e 11 dígitos'
        },
        username: {
            placeholder: 'Nome de usuário',
            required: 'Por favor, insira um nome de usuário',
            exists: 'Já existe um usuário com este nome de usuário'
        },
        email: {
            placeholder: 'E-mail',
            required: 'Por favor, insira seu e-mail',
            invalid: 'Digite um endereço de e-mail válido'
        },
        password: {
            placeholder: 'Senha',
            required: 'Por favor, insira uma senha',
            tooShort: 'A senha é muito curta',
            tooCommon: 'A senha é muito comum',
            numeric: 'A senha não pode ser totalmente numérica',
            mismatch: 'As senhas não coincidem'
        },
        confirmPassword: {
            placeholder: 'Confirmar senha',
            required: 'Por favor, confirme sua senha'
        },
        submit: 'Criar Conta',
        success: 'Cadastro realizado com sucesso! Você já pode fazer login.',
        error: 'Erro ao realizar cadastro. Por favor, tente novamente.',
        loginLink: 'Já tem uma conta? Faça login'
    },
    validation: {
        required: 'Este campo é obrigatório',
        blank: 'Este campo não pode estar vazio'
    },
    errors: {
        connection: 'Erro ao conectar com o servidor',
        promoter: {
            create: 'Erro ao cadastrar promotor. Verifique os dados',
            update: 'Erro ao atualizar promotor'
        },
        store: {
            create: 'Erro ao cadastrar loja. Verifique os dados',
            update: 'Erro ao atualizar loja'
        },
        visit: {
            create: 'Erro ao cadastrar visita. Verifique os dados',
            update: 'Erro ao atualizar visita'
        },
        assignment: {
            create: 'Erro ao criar atribuição',
            delete: 'Erro ao excluir atribuição'
        },
        user: {
            update: 'Erro ao atualizar usuário',
            resetPassword: 'Erro ao solicitar redefinição de senha. Por favor, tente novamente'
        }
    }
}; 