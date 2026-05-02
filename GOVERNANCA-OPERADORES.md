# 🛡️ Guia de Governança de Identidade (Poka-Yoke)

Este documento descreve os procedimentos operacionais para gestão de usuários de alta criticidade (Operadores de Plataforma) no ecossistema Ywara/Sumaúma. Seguindo o princípio **Poka-Yoke** (à prova de erros), certas operações são deliberadamente restritas ao nível de servidor para garantir a integridade da infraestrutura.

---

## 1. Operadores de Plataforma (`PLATFORM_ADMIN`)

Operadores possuem acesso irrestrito ao painel Sumaúma e visibilidade sobre todos os Tenants (Organizações).

### ➕ Criar Novo Operador
**Por que não na UI?** Para evitar que um atacante com acesso ao frontend (via XSS ou sequestro de sessão) possa criar um novo usuário administrativo "backdoor".

**Procedimento:**
1. Acesse o servidor via SSH.
2. Navegue até o diretório do backend: `cd sumauma/backend`.
3. Execute o script de criação:
   ```bash
   node scripts/create-operator.js
   ```
4. Siga as instruções no terminal:
   - **Senha**: Mínimo de 12 caracteres.
   - **Motivo**: Obrigatório para logs de auditoria.

### 🚫 Bloquear/Desativar Operador
Pode ser feito diretamente pela interface para resposta rápida a incidentes.
1. Acesse **Sumaúma** > **🛡️ Operadores**.
2. Localize o operador na lista.
3. Clique no botão **Bloquear**.
   - *Nota: O bloqueio é instantâneo e invalida sessões ativas.*

### ✏️ Editar Operador
Por segurança, a alteração de dados de operadores (como `username` ou `role`) é bloqueada na UI. 
- Se um operador precisar mudar de nome ou cargo, recomenda-se criar um novo e bloquear o antigo para manter a rastreabilidade histórica.

### 🗑️ Apagar Operador
**Não deletamos operadores.** Para garantir a integridade dos logs de auditoria (quem fez o quê), os operadores são apenas **bloqueados**. Isso impede o acesso mas preserva o histórico de ações vinculado ao ID do usuário.

---

## 2. Usuários de Organização (`ADMIN`, `ENGINEER`, `VIEWER`)

Estes são os usuários dos clientes (Tenants), que acessam o Iaçã ou Kurupira.

### ➕ Criar Usuário
Pode ser feito via UI por um Operador ou pelo Admin da própria organização.
1. Acesse **Sumaúma** > **Organizações** > Selecione o Tenant.
2. Na aba **Usuários**, clique em **Adicionar Usuário**.

### 🔑 Reset de Senha
1. Localize o usuário no Drawer lateral.
2. Clique em **Reset de Senha**.
3. O sistema gerará uma senha temporária (ou link, dependendo da configuração de e-mail).

---

## 3. Promoção de Nível de Acesso

### ⚠️ Regra de Ouro (Poka-Yoke)
**É impossível promover um usuário comum a `PLATFORM_ADMIN` via interface web.** 

Se um usuário de um cliente precisar se tornar um operador da plataforma:
1. Bloqueie o usuário atual dele na organização.
2. Crie um novo perfil de operador usando o script CLI mencionado na seção 1.

---

## 4. Auditoria e Logs

Todas as operações críticas (incluindo tentativas de acesso negadas) são registradas.
- Visualize em: **Sumaúma** > **📜 Logs de Auditoria**.
- Os logs incluem: `Ação`, `Operador`, `IP` (em prod), `Timestamp` e `Justificativa` (para ações via CLI).

---
**Segurança Ywara**: *Isolamento físico é a última linha de defesa.*
