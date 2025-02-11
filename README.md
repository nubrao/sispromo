# 🛒 SisPromo - Sistema de Gestão de Visitas de Promotores

SisPromo é um sistema desenvolvido para gerenciar visitas de promotores em lojas, permitindo o registro, consulta e análise de dados para tomada de decisões estratégicas.

## 📌 **Principais Funcionalidades**

✅ Cadastro e gerenciamento de **Promotores** 
✅ Cadastro de **Lojas** e suas respectivas redes 
✅ Registro de **Visitas** realizadas pelos promotores, incluindo fotos 
✅ Geração de **relatórios** com dados detalhados por promotor, loja e marca 
✅ Exportação dos relatórios para **Excel** 
✅ **Autenticação JWT** para segurança no acesso ao sistema 
✅ **Interface responsiva e amigável** para secretárias e gestores

---

## 🛠 **Tecnologias Utilizadas**

### **Backend**

- Python + Django
- Django REST Framework (DRF)
- Django Simple JWT (Autenticação JWT)
- PostgreSQL / SQLite (banco de dados)
- Pandas (Geração de relatórios em Excel)

### **Frontend**

- React.js + Vite
- React Router Dom (Navegação)
- Axios (Consumo de API)
- TailwindCSS (Estilização)

---

## 🚀 **Como Rodar o Projeto**

### 🔹 **1️⃣ Configurar o Backend (Django)**

```sh
# Clone o repositório
git clone https://github.com/seu-usuario/sispromo.git
cd sispromo/backend

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Criar banco de dados e aplicar migrações
python manage.py migrate

# Criar superusuário para login (opcional)
python manage.py createsuperuser

# Rodar o servidor
python manage.py runserver
```

### 🔹 **2️⃣ Configurar o Frontend (React + Vite)**

```sh
cd ../frontend

# Instalar dependências
npm install

# Rodar o projeto
npm run dev
```

Acesse o frontend no navegador: [http://localhost:5173](http://localhost:5173)

---

## 🔑 **Autenticação e Acesso**

- O sistema utiliza **JWT** para autenticação.
- O login é feito na página inicial com usuário e senha cadastrados no Django.
- Após o login, o sistema redireciona automaticamente para o painel de controle.

---

## 📊 **Geração de Relatórios**

- Os gestores podem gerar **relatórios diários, semanais e mensais**.
- Os relatórios podem ser exportados para **Excel**.
- Análises detalhadas de visitas por **Promotor, Loja e Marca**.

---

## 📌 **Próximos Passos**

🔹 Melhorias na segurança do sistema (refinamento de permissões)\
🔹 Implementação de dashboards gráficos com estatísticas\
🔹 Aprimoramento da experiência do usuário

---

## 📞 **Contato**

Caso tenha dúvidas ou sugestões, entre em contato pelo e-mail [brunomcamara@outlook.com](mailto\:brunomcamara@outlook.com) ou abra uma issue neste repositório.

---

🚀 **Desenvolvido para facilitar a gestão de visitas de promotores!**

