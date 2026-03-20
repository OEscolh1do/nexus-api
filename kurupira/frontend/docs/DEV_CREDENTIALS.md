# Credenciais de Desenvolvimento & Testes

Este documento lista os acessos padrão criados durante o setup inicial do banco de dados (Supabase) para facilitar o login e testes locais do sistema Lumi.

A plataforma agora utiliza um sistema multi-tenant baseado em perfis e RLS (Row Level Security). O sistema carrega as interfaces e permissões dependendo da *role* do usuário logado.

## Contas Padrão (Ambiente de Dev)

Estas contas foram configuradas no script SQL inicial (`supabase_setup.sql`) e estão atreladas ao Tenant "Neonorte Engenharia" (IDs e uuids fictícios pré-gerados).

Use qualquer uma das contas abaixo na tela inicial de Login.

| Perfil | Email | Senha | Acesso no App |
| :--- | :--- | :--- | :--- |
| **Vendedor** | `sales@neonorte.com.br` | `sales123` | Cria projetos na aba CRM (Formulário do Cliente) e envia projetos com o status "DRAFT" para a fila da engenharia. Não visualiza o módulo Técnico. |
| **Engenharia** | `engineer@neonorte.com.br` | `engineer123` | Acessa a Fila de Projetos (Project Queue). Pode "Abrir Projeto", preencher Módulos, Inversores e BOS (Balanço de Sistema) e alterar status para "APPROVED_FOR_PROPOSAL". |
| **Administrador** | `admin@neonorte.com.br` | `admin123` | Acesso mestre a todas as abas. Único perfil capaz de acessar o painel de **Premissas Gerais** (SettingsModule) para alterar margem de lucro, juros de financiamento e custo do Watt, as quais refletem imediatamente para toda a equipe. |

> **Nota:** Se estiver rodando um novo projeto no Supabase do zero, não se esqueça de criar estes usuários na aba `Authentication > Users` do Supabase e rodar os comandos `INSERT` na tabela `user_profiles` apontando para o Tenant da Neonorte, conforme descrito na documentação de banco de dados.
