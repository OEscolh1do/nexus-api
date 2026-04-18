# Competências Backend — Kurupira

O backend do Kurupira é o motor de persistência e orquestração de catálogos que alimenta o workspace de engenharia.

## 🟢 Node.js & Express 5
- **Estrutura de Middleware**: Implementar autenticação, validação de inputs e rate limiting.
- **Async/Await**: Garantir o tratamento correto de erros assíncronos em todas as rotas da API.
- **RESTful Design**: Manter uma API limpa e bem documentada para o consumo do frontend.

## 💎 Prisma ORM & MySQL
- **Modelagem de Dados**: Entender relações complexas entre Projetos, Clientes e Catálogos de Equipamentos.
- **Migrations**: Capacidade de criar e aplicar migrações de banco de dados sem perda de dados.
- **Query Performance**: Otimizar consultas para retornar grandes volumes de dados de catálogo de forma performante.

## 🛡 Segurança e Validação
- **Zod (Backend)**: Validação rígida de schemas para garantir que apenas dados válidos entrem no banco.
- **JWT & Auth**: Gestão de tokens de acesso, refresh tokens e controle de permissões (RBAC).
- **OWASP**: Aplicação de boas práticas de segurança contra Injeção SQL, XSS e CSRF.

## ⚙ Serviços e Workers
- **Node-Cron**: Agendamento de tarefas de manutenção ou limpeza de banco.
- **Gestão de Arquivos (Multer)**: Upload e processamento de imagens e documentos de projetos.
