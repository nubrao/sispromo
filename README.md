# Sistema de Gestão de Visitas - MVP1

Sistema para gerenciamento de visitas de promotores em lojas, desenvolvido com Django e React.

## Funcionalidades Implementadas (MVP1)

### Autenticação e Autorização
- Login e logout de usuários
- Três níveis de acesso:
  - Promotor: Acesso limitado às suas próprias visitas
  - Analista: Acesso a todas as visitas e relatórios
  - Gestor: Acesso total ao sistema

### Gestão de Promotores
- Cadastro de promotores com validação de CPF
- Vinculação automática de promotores a usuários
- Visualização de promotores cadastrados
- Edição e exclusão de promotores

### Gestão de Lojas
- Cadastro de lojas com informações básicas
- Visualização de lojas cadastradas
- Edição e exclusão de lojas

### Gestão de Marcas
- Cadastro de marcas
- Vinculação de marcas com lojas
- Visualização de marcas cadastradas
- Edição e exclusão de marcas

### Gestão de Visitas
- Registro de visitas por promotor
- Data automática para promotores (dia atual)
- Seleção manual de data para gestores/analistas
- Validação de visitas duplicadas
- Visualização de visitas em formato de tabela
- Exclusão de visitas

### Relatórios
- Visualização de visitas em formato de tabela
- Visualização de visitas em formato de calendário
- Filtros por:
  - Promotor
  - Marca
  - Loja
  - Data
- Exportação de relatórios em Excel e PDF
- Cálculo automático de totais por promotor

### Dashboard
- Visão geral das visitas por marca
- Progresso de visitas por loja
- Métricas de visitas realizadas vs. esperadas
- Visualização em cards com cores indicativas

## Tecnologias Utilizadas

### Backend
- Python 3.11
- Django 5.0
- Django REST Framework
- PostgreSQL
- Django CORS Headers
- Django Spectacular (Documentação API)

### Frontend
- React 18
- Vite
- Axios
- React Router DOM
- React Calendar
- Context API
- PropTypes

## Requisitos do Sistema

- Python 3.11 ou superior
- Node.js 18 ou superior
- PostgreSQL 14 ou superior
- NPM ou Yarn

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/sispromo.git
cd sispromo
```

2. Configure o ambiente virtual Python:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

3. Instale as dependências do backend:
```bash
cd backend
pip install -r requirements.txt
```

4. Configure as variáveis de ambiente do backend:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

5. Execute as migrações do banco de dados:
```bash
python manage.py migrate
```

6. Instale as dependências do frontend:
```bash
cd ../frontend
npm install
```

7. Configure as variáveis de ambiente do frontend:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

## Executando o Projeto

1. Inicie o servidor backend:
```bash
cd backend
python manage.py runserver
```

2. Em outro terminal, inicie o servidor frontend:
```bash
cd frontend
npm run dev
```

3. Acesse o sistema em:
```
http://localhost:5173
```

## Comandos Úteis

### Backend
- Criar superusuário:
```bash
python manage.py createsuperuser
```

- Vincular promotores automaticamente:
```bash
python manage.py link_promoters
```

### Frontend
- Build para produção:
```bash
npm run build
```

- Preview do build:
```bash
npm run preview
```

## Estrutura do Projeto

```
sispromo/
├── backend/
│   ├── core/
│   │   ├── infrastructure/
│   │   │   ├── models/
│   │   │   ├── serializers/
│   │   │   └── views/
│   │   └── management/
│   │       └── commands/
│   ├── requirements.txt
│   └── manage.py
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── hooks/
    │   ├── pages/
    │   └── styles/
    ├── package.json
    └── vite.config.js
```

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

