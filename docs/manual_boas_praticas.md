# Manual de Boas Práticas e Lições Aprendidas — Ecossistema Ywara

Este documento serve como um caderno de campo para registrar decisões arquiteturais, soluções de problemas complexos e padrões de engenharia adotados no projeto. O objetivo é facilitar a manutenção e antecipar soluções em futuros projetos ou módulos.

---

## 1. Autenticação e Gestão de Sessão

### 1.1. Resolvendo Loops de Redirecionamento e Tokens "Zumbi"
**Data:** 06/05/2026
**Módulo:** Sumaúma Frontend / Kurupira Frontend

#### O Problema
Em aplicações que persistem o estado de autenticação (Zustand + Persist) e utilizam SSO (Logto), surge o problema do **Token Zumbi**:
1. O token JWT antigo fica salvo no LocalStorage.
2. Ao recarregar o app, o interceptor de API detecta o token expirado e força um redirecionamento para `/login`.
3. Na `/login`, o provedor SSO (Logto) detecta que a sessão do navegador ainda é válida e tenta re-autenticar automaticamente.
4. O app tenta notificar o backend ou buscar dados do usuário usando o token expirado do store, o interceptor bloqueia a requisição e força o logout novamente.
5. **Resultado:** Loop infinito de redirecionamentos ou falha silenciosa na tela de login.

#### A Solução (Padrão Adotado)
Para resolver isso de forma definitiva e transparente para o usuário:

1.  **Interceptor de Request Tolerante:**
    - O interceptor deve ignorar a verificação de expiração se a requisição já trouxer um cabeçalho `Authorization` definido manualmente (ex: `api.post(url, data, { headers: { Authorization: 'Bearer ...' } })`).
    - Isso permite que o processo de login use o token novo antes de ele ser sincronizado com o store global.

2.  **Sensibilidade ao Contexto (Login Guard):**
    - O interceptor **nunca** deve disparar um `sessionStorage.setItem('force_logout', 'true')` ou redirecionar o usuário se ele já estiver na URL de login. Se houver falha de token lá, apenas limpamos o store local.

3.  **Limpeza Proativa na Montagem (Proactive Cleanup):**
    - No `useEffect` da página de login, se o usuário não estiver autenticado no SSO, devemos disparar o `logout()` do store global para limpar qualquer resíduo do LocalStorage imediatamente.

4.  **Guarda de Efeito (Audit Guard):**
    - Ao realizar ações pós-login (como auditoria ou fetch de perfil), use estados locais (`isAuditing`, `auditFailed`) para evitar que falhas nessas requisições disparem re-renderizações infinitas do efeito de login.
    - Se a auditoria falhar, o sistema deve interromper o fluxo e forçar o logout do SSO para limpar a sessão no provedor de identidade.

5.  **Tolerância de Relógio (Clock Skew):**
    - Em ambientes Docker/WSL, é comum haver dessincronização de relógios. Utilize uma `clockTolerance` (ex: 60s) na verificação de JWT no backend e frontend para evitar que tokens recém-emitidos sejam considerados expirados antes mesmo de chegarem ao cliente.

#### Regra de Ouro
> "Se um efeito colateral pós-login pode falhar e resetar o estado global, use guardas de componente para impedir loops infinitos. Nunca limpe a sessão local de forma agressiva antes de confirmar a falha do provedor de identidade, e sempre permita uma margem de manobra (clock skew) para validação de tempo."

### 1.2. Barreira Definitiva contra "Estado Zumbi" no Boot
**Data:** 07/05/2026
**Módulo:** Sumaúma Frontend (Refatoração)

#### O Problema
Mesmo com interceptores de API configurados, o primeiro render da aplicação pode falhar se o Zustand hidratar um token expirado do LocalStorage. O `ProtectedRoute` vê `isAuthenticated: true` (baseado no token velho) e deixa o app carregar, disparando requisições que só então falharão no interceptor, causando redirecionamentos tardios e loops se o LoginPage não estiver perfeitamente sincronizado.

#### A Solução (Padrão Adotado)
Utilizar o hook `onRehydrateStorage` do middleware `persist` do Zustand para realizar uma **validação atômica e síncrona** antes da aplicação renderizar:

1.  **Validação no Boot**: No momento em que o Zustand lê o LocalStorage, decodificamos o JWT e verificamos o campo `exp`.
2.  **Descarte Imediato**: Se o token estiver expirado, o estado é resetado (`token: null`, `isAuthenticated: false`) **antes** de retornar o estado para a aplicação.
3.  **Benefício**: O primeiro render já nasce com `isAuthenticated: false`, fazendo com que o `react-router` redirecione para o `/login` de forma limpa, sem disparar interceptores de API desnecessários.

#### Regra de Ouro
> "Nunca confie em um estado persistido no LocalStorage para o primeiro render. Valide a integridade e expiração de tokens críticos no hook de hidratação (`onRehydrateStorage`) para garantir que o 'Estado Zumbi' seja eliminado antes de afetar o ciclo de vida dos componentes."

#### Referência
- `sumauma/frontend/src/stores/authStore.ts`
- `sumauma/frontend/src/pages/LoginPage.tsx` (Limpeza de flag antes do signOut)

### 1.3. Normalização de Logout OIDC e URIs de Redirecionamento
**Data:** 07/05/2026
**Módulo:** Kurupira Frontend / Sumaúma Frontend / Logto Cloud

#### O Problema
Em ecossistemas multi-app que compartilham o mesmo App ID no provedor de identidade (Logto), surgem falhas intermitentes no logout com o erro `post_logout_redirect_uri not registered`. Isso ocorre devido a:
1.  **Divergência de String**: Variações como `http://localhost:5174` (sem barra) vs `http://localhost:5174/` (com barra) são tratadas como URIs diferentes pelo OIDC.
2.  **Inconsistência de Endpoint**: Endpoints com barras finais no `.env` (`LOGTO_ENDPOINT=.../`) podem causar construções de URL malformadas internamente na biblioteca.
3.  **Manual SignOut Construction**: Tentar passar a URI manualmente na chamada `signOut(uri)` aumenta o risco de erro humano e dessincronia com o console.

#### A Solução (Padrão Adotado)
Adotamos a **Centralização de Origem via Configuração**:

1.  **Explícitos em LogtoConfig**: Definimos `postLogoutRedirectUri: window.location.origin` diretamente no objeto `LogtoConfig` no root da aplicação (`main.tsx`). Isso garante que o valor seja dinâmico mas consistente com a origem real.
2.  **SignOut sem Argumentos**: Refatoramos as chamadas para `signOut()` (sem parâmetros). O SDK do Logto utiliza automaticamente o valor definido na configuração, garantindo que a URI enviada seja exatamente a que foi inicializada.
3.  **Sanitização de `.env`**: Removemos barras finais de todas as variáveis `LOGTO_ENDPOINT` para garantir que o SDK construa os caminhos de descoberta (`/.well-known/...`) de forma limpa.
4.  **Alinhamento com o Console**: As URIs no Logto Console devem ser cadastradas **sem barra final**, combinando com a saída de `window.location.origin`.

#### Regra de Ouro
> "Para evitar erros de registro de logout em ambientes OIDC, nunca passe a URI manualmente na função de saída. Defina-a uma única vez no `LogtoConfig` usando `window.location.origin` e chame `signOut()` sem argumentos. Mantenha o console do provedor e as variáveis de ambiente livres de barras finais (`/`) redundantes."

#### Referência
- `kurupira/frontend/src/main.tsx`
- `sumauma/frontend/src/main.tsx`
- `kurupira/frontend/src/core/auth/AuthProvider.tsx`
- `sumauma/frontend/.env.local`

---

## 2. Padrões de Interface de Engenharia (Engineering UI)

### 2.1. Buffer de Estado para Inputs de Alta Performance
**Data:** 06/05/2026
**Módulo:** Kurupira Frontend (Módulo de Engenharia)

#### O Problema
Em telas de engenharia complexas (ex: Consumption View), os inputs numéricos costumam estar vinculados diretamente a um store global (Zustand) que dispara múltiplos efeitos colaterais:
1. Re-renderização de gráficos pesados (Recharts/Canvas).
2. Recálculo imediato de metas (kWp alvo).
3. Disparo de modais de confirmação (ex: "Ajuste manual detectado").

**Consequência:** O usuário não consegue apagar o campo para digitar um novo valor (o store força o retorno para 0 ou para o valor anterior), e a experiência de digitação fica travada ou interrompida por popups constantes.

#### A Solução (Padrão Adotado)
Implementar o padrão de **Deferred Store Sync** (Sincronização Adiada do Store):

1. **Estado Local de Buffer:** Utilize um `useState<string>` local para controlar o valor do input como texto puro. Isso permite que o campo fique vazio (`''`) enquanto o usuário edita.
2. **Proteção de Foco (Focus Guard):** Utilize um `useRef` (ex: `isFocused`) para monitorar o foco do input. O `useEffect` que sincroniza o Store para o Local State deve ser interrompido se `isFocused.current` for verdadeiro. Isso evita que o valor no store "atropele" a digitação do usuário.
3. **Escrita Condicional (Local -> Store):**
   - **Live Update:** Atualize o store em tempo real apenas se a alteração for trivial e não disparar efeitos bloqueantes.
   - **Deferred Sync (onBlur / Enter):** Se a alteração exigir confirmação do usuário ou for pesada, execute a atualização do store global apenas no evento `onBlur` ou ao pressionar `Enter`.
4. **Tratamento de Vazio:** Trate o valor vazio (`''`) no local state como `0` ou `null` apenas no momento de enviar para o store, nunca durante a digitação.

#### Regra de Ouro
> "Se um input numérico vinculado a um store global dispara efeitos colaterais ou possui sincronização bidirecional, use um buffer local (`useState`) com proteção de foco (`useRef`), e sincronize apenas no término da edição (`onBlur`), para evitar o travamento ('locking') do campo."

---

## 6. Validação e Robustez de API (API Robustness)

### 6.1. Integridade de Schemas Zod e Erros Crípticos
**Data:** 06/05/2026
**Módulo:** Kurupira Backend (Middleware de Validação)

#### O Problema
Edições manuais rápidas em schemas complexos de validação (ex: Zod) podem corromper a estrutura do objeto (nesting incorreto, referências a variáveis indefinidas). Isso resulta em erros crípticos no middleware como `Cannot read properties of undefined (reading '_zod')`, que derrubam o processo ou retornam `500` sem explicação clara, mascarando o fato de que o próprio schema de validação está quebrado, e não os dados enviados.

#### A Solução (Padrão Adotado)
1.  **Try/Catch no Middleware:** O middleware de validação deve envolver o `safeParse` em um bloco `try/catch` e logar falhas estruturais do schema separadamente de falhas de dados.
2.  **Schema Check:** Antes de validar, verifique se o objeto do schema está definido.
3.  **Sanitização de Erros em Produção:** Use uma função `safeError` para garantir que detalhes da pilha de erro (stack trace) não vazem para o cliente em produção, mas forneça logs ricos no servidor.

#### Regra de Ouro
> "Se a validação falhar com um erro interno da biblioteca (ex: '_zod' is undefined), o problema está na definição do seu schema (código), não no payload do usuário. Proteja seu middleware com try/catch para não derrubar o servidor por erro de sintaxe no schema."

---

## 7. Estabilidade de Renderização Geoespacial (Geospatial Stability)

### 7.1. Prevenção de Crashes por Coordenadas Inválidas (NaN)
**Data:** 06/05/2026
**Módulo:** Kurupira Frontend (Leaflet / Google Maps)

#### O Problema
Dados corrompidos no banco (latitude/longitude como `NaN` ou strings inválidas) ou cálculos matemáticos que resultam em `NaN` no frontend causam crashes fatais em bibliotecas de mapa. Métodos como `map.flyTo([lat, lng])` lançam exceções imediatas se os valores não forem números finitos, impedindo a renderização do componente e travando a interface de engenharia.

#### A Solução (Padrão Adotado)
Implementar **Sanitização de Duplo Fator (Double-Factor Sanitization)**:

1.  **Sanitização na Persistência:** No serviço de salvamento (ex: `ProjectService`), valide se as coordenadas são números finitos (`!isNaN`) antes de enviar ao backend. Converta valores inválidos para `null` explicitamente.
2.  **Guarda no Viewport (Consumer-Side Guard):** Nos componentes que interagem com o mapa, adicione verificações rigorosas de `isNaN`, `null` e `undefined` antes de chamar qualquer método da API de mapa (FlyTo, Marker placement).
3.  **Fallback de Coordenadas:** Sempre defina coordenadas de fallback seguras (ex: Centro da Cidade ou [0,0]) se o valor do store for inválido, mas prefira apenas ignorar o comando de movimento para evitar saltos bruscos no mapa.

#### Regra de Ouro
> "Nunca assuma que uma coordenada vinda do banco ou do store é um número válido. Verifique `isNaN` e `null` antes de qualquer interação com APIs de Mapa para evitar que um dado corrompido 'mate' o frontend da aplicação."

---

## 3. Infraestrutura e Deployment (Docker + Vite)

### 3.1. Injeção de Variáveis `VITE_` em Tempo de Build
**Data:** 06/05/2026
**Módulo:** Kurupira Frontend / Sumaúma Frontend

#### O Problema
Variáveis de ambiente prefixadas com `VITE_` são injetadas estaticamente no código durante o comando `npm run build`. Em ambientes Docker:
1. Definir variáveis no `docker-compose.yml` ou no `.env` em tempo de execução **não afeta** o frontend já buildado.
2. O frontend tenta carregar valores padrão (geralmente `localhost`) se o build foi feito sem as variáveis corretas, causando erros de "API Not Found" ou falhas de mapas.

#### A Solução (Padrão Adotado)
1.  **Build Dinâmico na VPS:** Realizar o build do frontend diretamente na VPS (ou no CI/CD) garantindo que as variáveis de produção estejam presentes no ambiente no momento da execução do `npm run build`.
2.  **Arquivo `.env.production` Temporário:** Criar um arquivo `.env.production` na raiz do frontend antes do build para garantir que o Vite capture todos os segredos e URLs corretas.
3.  **Higiene Pós-Build:** Remover arquivos `.env` temporários após a geração da pasta `dist/` para evitar vazamento de segredos.

#### Regra de Ouro
> "Se você alterou uma URL de API ou chave de serviço no frontend e nada mudou, você esqueceu de refazer o build. Variáveis Vite são estáticas após o build."

### 3.3. Escape de Cifrão em Docker Compose ($$ vs $)
**Data:** 07/05/2026
**Módulo:** Infraestrutura / Docker Compose

#### O Problema
No Docker Compose, o caractere `$` é reservado para interpolação de variáveis do ambiente host ou do arquivo `.env`. Para passar um cifrão literal para dentro do container (ex: em um script shell), usa-se o escape `$$`. 
**O Erro:** Se você usar `$$` em uma string de conexão (ex: `DATABASE_URL: "mysql://$${DB_USER}..."`), o Docker injetará a string literal `$DB_USER` no container em vez do valor da variável. Bibliotecas como o Prisma não expandem essas variáveis internamente, resultando em erros de "Authentication failed for user ${DB_USER}".

#### A Solução (Padrão Adotado)
Utilize apenas um único `$` para permitir que o Docker Compose realize a interpolação **antes** de criar o container:
```yaml
environment:
  DATABASE_URL: "mysql://${DB_USER}:${DB_PASS}@host:3306/db"
```

#### Regra de Ouro
> "No `docker-compose.yml`, use `$` (único) para injetar valores do `.env`. Use `$$` (duplo) apenas se precisar que o caractere cifrão literal chegue ao processo dentro do container. Se o Prisma reclamar de um usuário que parece o nome de uma variável, você errou o escape."

#### Referência
- `docker-compose.production.yml`

### 3.2. Gestão de Permissões em Volumes Docker (Erro EACCES)
**Data:** 06/05/2026
**Módulo:** Infraestrutura / Deploy VPS

#### O Problema
Ao utilizar Docker com volumes mapeados para o host (ex: `-v /srv/ywara/frontend:/app`), arquivos criados dentro do container (como a pasta `dist` ou `node_modules`) podem ter a posse atribuída ao usuário `root`. 
**Consequência:** Quando o usuário da VPS (`neonorte`) tenta realizar um build manual posterior, o comando falha com `EACCES: Permission denied` ao tentar limpar a pasta `dist/assets` ou sobrescrever arquivos.

#### A Solução (Padrão Adotado)
1. **Handover de Permissão:** Antes de cada build manual na VPS, execute um comando de correção de posse: `sudo chown -R $USER:$USER ./dist`.
2. **Docker User Mapping:** Sempre que possível, configure o container Docker para rodar com o UID/GID do usuário do host, mas como solução pragmática de deploy, a correção de permissão pré-build é o método mais resiliente.
3. **Limpeza Profunda:** Se o erro persistir, remova a pasta `dist` com `sudo rm -rf dist` antes de iniciar o `npm run build`.

#### Regra de Ouro
> "Se o build falhar por 'Permission Denied' em um servidor que usa Docker, você está sofrendo de conflito de UID. Retome a posse dos arquivos com `chown` antes de tentar novamente."

---

## 4. Conectividade e CORS em Microserviços

### 4.1. Paridade de Variáveis no Docker Compose
**Data:** 06/05/2026
**Módulo:** Backend (Kurupira/Sumaúma)

#### O Problema
Mesmo definindo `ALLOWED_ORIGINS` no arquivo `.env`, o container do backend pode não receber esse valor se ele não estiver explicitamente mapeado na seção `environment` do `docker-compose.yml`. Isso gera erros `500` silenciosos ou bloqueios de CORS, mesmo com a configuração parecendo correta no código.

#### A Solução (Padrão Adotado)
1.  **Mapeamento Explícito:** Sempre mapear variáveis críticas de infraestrutura no `docker-compose.production.yml`:
    ```yaml
    environment:
      ALLOWED_ORIGINS: "${ALLOWED_ORIGINS}"
    ```
2.  **Whitelist Dinâmica:** O backend deve converter a string `ALLOWED_ORIGINS` em um array e sanitizar os domínios (removendo barras finais) para evitar erros de comparação de string.

### 4.2 Padronização de URLs de API (VITE_API_URL)
**Cenário**: Erros de 404 por URLs duplicadas (ex: `/api/api/v1`).
**Padrão**: A variável `VITE_API_URL` deve conter apenas o origin (ex: `https://kurupira.neonorte-ywara.tech`). O código do frontend é o único responsável por adicionar o prefixo `/api/v1` ou similares.
**Consequência**: Evita que mudanças na configuração do Nginx quebrem o frontend.

### 4.3 Proteção contra Zombie Tokens (Login Loop)
**Cenário**: Usuário autenticado no SSO mas não provisionado no banco de dados local.
**Padrão**: 
1. Implementar rota pública `/access-denied`.
2. O interceptor de API deve detectar erro 403 de provisionamento e redirecionar para esta página.
3. A página deve forçar um `signOut()` global para limpar a sessão no Identity Provider.
**Consequência**: Previne loops de redirecionamento infinito que "travam" o navegador do usuário.

#### Regra de Ouro
> "Nunca assuma que o Docker carregou seu .env global. Se o backend precisa da variável, ela deve estar listada no environment do serviço no compose."

---

## 5. Integridade de Dados de Engenharia (Engineering Data Integrity)

### 5.1. Sincronização Top-Level vs. JSON Metadata (Merge-on-Save)
**Data:** 06/05/2026
**Módulo:** Sumaúma Catalog / Kurupira Engine

#### O Problema
Em sistemas de engenharia onde os dados de equipamento evoluem, é comum adotar uma estrutura de banco de dados híbrida:
1. **Campos de Topo (Flattened):** Campos comuns indexáveis e fáceis de filtrar (ex: `powerWp`, `efficiency`).
2. **JSON Blob (`electricalData`):** Metadados técnicos densos (curvas de eficiência, coeficientes, limites de hardware) usados pelos motores de simulação (ex: PVSyst .PAN/.OND).

**O Problema:** Ao editar um campo de topo na UI (ex: atualizar a Potência de 550 para 555Wp), o JSON técnico interno (`electricalData.pmax`) permanece com o valor antigo. Se o motor de simulação ler apenas o JSON para os cálculos pesados, ele usará dados obsoletos, quebrando a consistência técnica e a confiança do usuário no resultado.

#### A Solução (Padrão Adotado)
Implementar o padrão de **Sincronização Unidirecional de Metadados (Metadata Syncing)** no momento da persistência:

1.  **Utilitário de Sincronização Centralizado:** Criar funções puras (ex: `syncModuleData`) que recebem os valores de topo e o objeto JSON, devolvendo um JSON atualizado onde as redundâncias são eliminadas em favor dos novos valores de topo.
2.  **Estratégia de Merge-on-Save:**
    - O frontend coleta as edições do usuário em um estado local de formulário.
    - Antes de enviar o `PATCH`, o sistema mescla as alterações manuais avançadas no objeto JSON.
    - Em seguida, aplica a sincronização automática dos campos de topo sobre esse JSON.
3.  **Transparência Técnica:** A interface deve refletir claramente quais campos são de topo e quais são "metadados avançados", mas garantir que a alteração de um reflita no outro para manter a "Cadeia da Verdade".

#### Regra de Ouro
> "A UI é a fonte da verdade para o usuário, mas o JSON é a fonte da verdade para o motor técnico. No momento do salvamento, a UI deve sempre ter precedência e sobrescrever os metadados JSON correspondentes."

---

## 8. Recuperação de Produção Após Reset Destrutivo de Banco

### 8.1. Elevação de Privilégios MySQL para `db push --force-reset`
**Data:** 06/05/2026
**Módulo:** Infraestrutura / Deploy VPS

#### O Problema
Ao executar `npx prisma db push --force-reset` em produção via Docker, o usuário de aplicação (`user_admin`) frequentemente não possui privilégios de `DROP FOREIGN KEY` e `ALTER TABLE` em bancos de terceiros (`db_kurupira`, `db_iaca`). O Prisma falha com `ALTER command denied` sem fallback, bloqueando a sincronização de schema.

#### A Solução (Padrão Adotado)
1. **Identificar a senha root** do MySQL: `cat /srv/ywara/.env | grep MYSQL_ROOT_PASSWORD`
2. **GRANT via senha inline** (sem prompt interativo — essencial em scripts e sessões SSH):
   ```bash
   docker exec -it neonorte_db mysql -u root -p<SENHA_SEM_ESPAÇO> -e \
     "GRANT ALL PRIVILEGES ON *.* TO 'user_admin'@'%'; FLUSH PRIVILEGES;"
   ```
3. **Executar o reset** normalmente após o GRANT:
   ```bash
   docker compose -f docker-compose.production.yml run --rm sumauma-backend \
     npx prisma db push --force-reset --schema=prisma/schema-kurupira.prisma
   ```

**Atenção:** `-p` sem espaço é obrigatório para senhas com caracteres especiais passadas inline. `-p <senha>` (com espaço) é interpretado como senha vazia + argumento.

### 8.2. Bootstrap do Usuário Admin Após Reset do `db_sumauma`
**Data:** 06/05/2026
**Módulo:** Sumaúma Backend / db_sumauma

#### O Problema
Após `db push --force-reset`, todos os registros da tabela `User` são apagados. O operador de plataforma perde acesso imediatamente (403 Forbidden), pois o middleware `platformAuth.js` busca o usuário por `authProviderId` (Logto `sub`) e não o encontra mais.

#### A Solução (Padrão Adotado)
Inserir os registros de fundação diretamente via SQL, respeitando o schema PascalCase do Prisma:

```sql
USE db_sumauma;

-- 1. Tenant Master (obrigatório — User tem FK para Tenant)
INSERT IGNORE INTO Tenant (id, name, type, status, createdAt, updatedAt)
VALUES ('master-tenant', 'Neonorte Global', 'MASTER', 'ACTIVE', NOW(3), NOW(3));

-- 2. Role de Plataforma
INSERT IGNORE INTO Role (id, name, level, tenantId, createdAt, updatedAt)
VALUES ('platform-admin-role', 'PLATFORM_ADMIN', 'PLATFORM', 'master-tenant', NOW(3), NOW(3));

-- 3. Usuário Admin (authProviderId = Logto sub do operador)
INSERT INTO User (id, username, password, fullName, role, roleId, tenantId, authProviderId, status, createdAt, updatedAt)
VALUES ('admin-user-001', 'admin_neonorte', 'placeholder', 'Admin Neonorte',
        'PLATFORM_ADMIN', 'platform-admin-role', 'master-tenant',
        '<LOGTO_SUB_DO_OPERADOR>', 'ACTIVE', NOW(3), NOW(3));
```

**Como encontrar o Logto sub:** `docker logs neonorte_admin --tail 50` — procure por `"sub":"..."` nos logs de warn de acesso negado.

**Atenção Prisma:** O schema do Sumaúma gera tabelas com nomes **PascalCase singular** (`Role`, `User`, `Tenant`). SQL contra esses bancos deve usar os nomes exatos — nunca `roles` ou `operators`.

#### Regra de Ouro
> "Após qualquer `force-reset` em produção, o primeiro passo é recriar os registros de fundação (Tenant Master → Role PLATFORM → User Admin) antes de tentar acessar o painel. O campo crítico é `authProviderId`, não `email` ou `username`."

### 8.3. Baseline de Migrações em Bancos Populados (Erro P3005)
**Data:** 07/05/2026
**Módulo:** Prisma / Banco de Dados

#### O Problema
Ao tentar rodar `prisma migrate deploy` em um banco de produção que já possui tabelas (ex: inicializado por um dump SQL ou `init.sql`) mas não possui a tabela de histórico do Prisma (`_prisma_migrations`), o comando falha com o erro `P3005: The database schema is not empty`. O Prisma bloqueia a operação para evitar perda de dados.

#### A Solução (Padrão Adotado)
Utilizar o comando `resolve --applied` para "ensinar" ao Prisma em que ponto o banco já está:

1. **Identificar Migrações Antigas:** Liste as migrações no projeto e identifique quais já estão refletidas na estrutura atual do banco.
2. **Aplicar Baseline:** Para cada migração antiga, execute:
   ```bash
   npx prisma migrate resolve --applied <NOME_DA_MIGRACAO>
   ```
3. **Executar Deploy:** Após o resolve, o `migrate deploy` funcionará para as migrações que realmente são novas.

#### Regra de Ouro
> "Se o banco de produção já tem tabelas mas o Prisma não sabe disso, não use `db push` (que pode ser destrutivo). Use `migrate resolve --applied` sequencialmente para criar o baseline de histórico e permitir que o deploy de migrações futuras seja seguro."

#### Referência
- `sumauma/backend/prisma/migrations`

---

## 9. Autenticação M2M Entre Serviços (Sumaúma → Kurupira)

### 9.1. Padrão Duplo Header Durante Janela de Migração OAuth2
**Data:** 06/05/2026
**Módulo:** Sumaúma Backend (`m2mClient.js`) / Kurupira Backend (`validateM2M.js`)

#### O Problema
Durante a migração do M2M legado (`X-Service-Token`) para OAuth2 Client Credentials (Logto), o serviço emissor (Sumaúma) pode obter com sucesso um Bearer token do Logto, mas o receptor (Kurupira) rejeita esse token por divergência de `audience` (`LOGTO_M2M_RESOURCE` diferente entre os dois serviços). O middleware original retornava `401` imediatamente sem tentar o fallback legacy, bloqueando toda a comunicação inter-serviços.

#### A Solução (Padrão Adotado)
**Lado Emissor (Sumaúma `m2mClient.js`):** Enviar ambos os headers simultaneamente durante a janela de migração:
```js
if (token) {
  config.headers['Authorization'] = `Bearer ${token}`;
  // Backup durante migração — remover após confirmar Logto M2M estável
  if (process.env.M2M_SERVICE_TOKEN) {
    config.headers['X-Service-Token'] = process.env.M2M_SERVICE_TOKEN;
  }
}
```

**Lado Receptor (Kurupira `validateM2M.js`):** Tentar o legacy antes de rejeitar:
```js
} catch (err) {
  // Durante migração: Bearer falhou → tentar X-Service-Token antes de 401
  if (verifyLegacyToken(req)) return next();
  return res.status(401).json({ error: 'Invalid M2M token' });
}
```

#### Regra de Ouro
> "Se o sistema M2M tem um fallback legacy, o receptor NUNCA deve rejeitar o Bearer sem antes checar se há um X-Service-Token válido no mesmo request. Remova a lógica de fallback apenas após confirmar que 100% das chamadas passam pelo OAuth2 sem erros."

---

## 10. Gestão de Identidades e Acessos (IAM)

### 10.1. Onboarding Atômico e Interface "User-First"
**Data:** 07/05/2026
**Módulo:** Sumaúma Backend / Frontend

#### O Problema
Em plataformas multi-tenant, é comum forçar um fluxo "Tenant-First", onde o administrador precisa criar uma Organização antes de criar o Usuário. Para usuários autônomos (INDIVIDUAL), isso gera fricção desnecessária (múltiplas etapas e telas). Além disso, misturar Perfis de Acesso (Roles) técnicos com a listagem de usuários e manter uma página separada para Organizações gera fragmentação de contexto e alta carga cognitiva.

#### A Solução (Padrão Adotado)
Adotamos o modelo **User-First** para unificar a gestão de identidades e acessos:

1.  **Criação Atômica (Backend)**: O endpoint de criação de usuários suporta um parâmetro `type: 'INDIVIDUAL'`. Quando presente, o backend realiza em um único request:
    - Criação do Tenant local (com plano padrão).
    - Provisionamento da Organização no Provedor de Identidade (Logto).
    - Criação do Usuário vinculado a esse novo Tenant.
    - Sincronização de IDs entre Logto e Banco Local.

2.  **Unificação de Interface (Frontend)**:
    - **Hub de Contas**: Substituímos as abas separadas por uma visão única de "Contas & Acessos", diferenciando autônomos de membros corporativos via badges e filtros.
    - **Navegação Contextual**: Removemos a página global de Organizações do menu principal. O acesso à gestão da organização (planos, quotas) agora é feito via link contextual ("Ver Organização") dentro do drawer de detalhes do usuário.
    - **Domínio de Sistema**: Movemos a gestão de **Perfis de Acesso (Roles)** para a área de **Sistema**, tratando-a como configuração de infraestrutura/segurança, e não como dado operacional diário.

#### Regra de Ouro
> "Se houver uma dependência 1:1 obrigatória entre entidades no onboarding (como Usuário Autônomo e sua Organização), implemente a criação atômica no backend. Unifique a interface sob a entidade primária (Usuário) e use navegação contextual (links em drawers) para acessar entidades secundárias, reduzindo a poluição no menu principal."

#### Referência
- `sumauma/backend/src/routes/users.js` (Lógica `type === 'INDIVIDUAL'`)
- `sumauma/frontend/src/components/accounts/CreateAccountDrawer.tsx`
- `sumauma/frontend/src/pages/SystemPage.tsx` (Nova morada do RolesTab)

### 2.2. Cockpit de Alta Densidade: Indicadores Verticais em Abas de Navegação
**Data:** 07/05/2026
**Módulo:** Kurupira Frontend (Engineering Navigation)

#### O Problema
Em interfaces de "cockpit" onde o usuário gerencia múltiplos painéis e mapas, indicadores de seleção horizontais (pills na base das abas) tendem a "poluir" a linha de horizonte visual e competir com o conteúdo do canvas logo abaixo. Além disso, a estética horizontal tradicional remete a aplicações web de consumo (B2C), distanciando o software da percepção de uma ferramenta de engenharia profissional (IDE).

#### A Solução (Padrão Adotado)
Adotamos o paradigma de **Navegação Vertical em Eixo Horizontal**:

1. **Indicador Lateral (Indicator Bar)**: A aba ativa é marcada por uma barra vertical de `3px` de largura e `60%` de altura, posicionada no canto esquerdo (`absolute left-0`).
2. **Glow Emissivo**: O indicador possui um glow indigo (`shadow-indigo-500/60`) que reforça a profundidade e a clareza da seleção mesmo em ambientes de baixa luminosidade (Dark Mode).
3. **Alinhamento ao Eixo**: O conteúdo da aba (ícone + label + KPI) deixa de ser centralizado e passa a ser alinhado à esquerda (`items-start`), criando um fluxo de leitura linear que nasce do indicador.
4. **Gradiente de Preenchimento**: A aba ativa recebe um gradiente horizontal sutil (`bg-gradient-to-r`) que se origina no indicador vertical, guiando o olhar para o conteúdo.

#### Regra de Ouro
> "Se você está construindo uma interface de cockpit de alta densidade, utilize indicadores verticais laterais em vez de horizontais. Isso mantém a linha de base limpa para o conteúdo principal (mapas/gráficos) e confere à ferramenta uma estética de 'IDE Profissional', aumentando a confiança técnica do usuário especialista."

#### Referência
- `kurupira/frontend/src/modules/engineering/ui/navigation/EngineeringTabs.tsx`
- `kurupira/frontend/src/modules/engineering/ui/navigation/EngineeringNavigation.tsx`
