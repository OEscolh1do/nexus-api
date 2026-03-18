---
description: Auditoria de Segurança do Frontend (XSS, JWT, etc)
---

# Fluxo de Trabalho: Auditoria de Segurança do Frontend

Execute este workflow após alterações significativas na autenticação, consumo de APIs ou manuseio de inputs de usuário.

1. **Gestão Segura de Sessão (SSO Cookies / JWT)**:
   - Certifique-se de que os tokens JWT sensíveis não estão sendo armazenados em `localStorage` ou `sessionStorage` sem necessidade, preferindo Secure HttpOnly cookies gerenciados pelo backend (onde aplicável) ou armazenamento em memória do frontend.
   - Verifique as transições via URL parameter (ex: `?session=TOKEN`). Assim que o parâmetro for consumido, limpe a URL usando `window.history.replaceState` para evitar vazamento em logs de navegador ou compartilhamento de links.

2. **Prevenção contra XSS (Cross-Site Scripting)**:
   - Evite o uso de `dangerouslySetInnerHTML`. Se for absolutamente necessário, garanta o uso de bibliotecas de sanitização (ex: `DOMPurify`).
   - Todos os inputs de usuário que são renderizados na tela (especialmente de WYSIWYG editors) devem ser escapados pelo próprio React.

3. **Requisições de Rede (CORS e Headers)**:
   - A instância global do Axios (ou fetch) deve estar configurada adequadamente, anexando tokens de autorização quando necessário, sem expor chaves globais indevidamente.
   - Trate os erros globais (interceptors do Axios) garantindo que, em caso de `401 Unauthorized` ou `403 Forbidden`, o usuário seja redirecionado ou receba feedback e sua sessão (estado) local seja limpa.

4. **Tratamento de Dados Expostos**:
   - Não envie *secrets*, chaves de API restritas ou senhas de banco de dados em env vars do Vite que começam com `VITE_` (isso expõe no bundle final).

5. **Lógica de RBAC (Role-Based Access Control) no Frontend**:
   - Omitir um botão baseado na role não é segurança (é UX). Garanta que rotas sensíveis (Protected Routes) verifiquem o papel do usuário no mount do componente.
