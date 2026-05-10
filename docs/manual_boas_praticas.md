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

### 6.2. Diagnóstico de Drift em Banco de Dados de Produção (P2022 / P3005)
**Data:** 07/05/2026
**Módulo:** Prisma / Banco de Dados / Produção

#### O Problema
Em ambientes de produção, o backend pode retornar erro 500 (Internal Server Error) com a mensagem `Column X does not exist` (P2022) mesmo após um deploy de sucesso. Isso ocorre porque o código e o Prisma Client foram atualizados, mas o banco físico não acompanhou a mudança (Drift). Tentar rodar `prisma migrate deploy` pode falhar com `P3005` (Database not empty), criando um impasse onde o banco não aceita a migração mas o código exige a coluna nova.

#### A Solução (Padrão Adotado)
Adotamos o protocolo de **Recuperação por Sincronização Direta (`db push`)**:

1. **Isolamento via Trace**: Injetar logs granulares (`console.log`) em cada linha do middleware de autenticação e da rota para confirmar se o crash ocorre exatamente na chamada ao banco.
2. **Identificação de Fatal Crash**: Se os logs pararem subitamente sem disparar o `catch`, o processo do Node sofreu um crash fatal (Segfault) causado por dessincronia entre o binário do Prisma Client e a estrutura do banco.
3. **Sincronização de Emergência**: Se o `migrate deploy` falhar por `P3005` em um banco que deveria estar sincronizado, use `npx prisma db push`. Isso sincroniza o banco com o schema ignorando o histórico de migrações (use apenas se não houver renomeação de colunas/tabelas).
4. **Prevenção (Audit Level -1)**: Validar a presença física de colunas novas na VPS antes de liberar o acesso, especialmente em tabelas centrais como `TechnicalDesign`.

#### Regra de Ouro
> "Nunca assuma que um deploy de sucesso no container significa que o banco de dados físico foi atualizado. Se o log acusar 'Column does not exist', use `db push` para forçar a sincronia em produção quando o histórico de migrações estiver corrompido ou ausente."

#### Referência
- `kurupira/backend/src/middleware/auth.js` (Lógica de rastro)
- Skill: `vps-debug`
- Skill: `data-integrity-auditor`

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

### 2.3. Cockpit de Auditoria Humanizado (UX Writing Técnico)
**Data:** 08/05/2026
**Módulo:** Sumaúma Frontend / Sistema & Segurança

#### O Problema
Interfaces de auditoria e reconciliação (drifts, órfãos, integridade) tendem a usar uma linguagem fria de infraestrutura. Termos como "Orphan", "Membership Mismatch" ou "Deep Sync" podem ser intimidadores e pouco intuitivos para operadores de plataforma que não são desenvolvedores.

#### A Solução (Padrão Adotado)
Adotamos o equilíbrio entre **Densidade de Engenharia** e **Clareza de Negócio**:

1. **Micro-copy Acessível**: Substituir jargões por conceitos operacionais:
   - `Orphan User` → **Conta sem Vínculo**
   - `Membership Mismatch` → **Pendência de Acesso**
   - `Attribute Drift` → **Dados Desatualizados**
   - `Live Audit` → **Verificação Ativa**

2. **Hierarquia de Dados**: 
   - O rótulo primário é humanizado (ex: "Contas sem Vínculo").
   - O detalhe técnico permanece disponível em metadados secundários (ex: `authProviderId`) ou tooltips em `font-mono`.

3. **Status Semântico (Glow)**: Uso do sistema 10-20-400 para indicar saúde sem depender apenas do texto, permitindo que o operador entenda o status em um relance visual.

#### Regra de Ouro
> "Mantenha a densidade de um cockpit de engenharia (4-8px grid) para velocidade operacional, mas utilize micro-copy humanizado para reduzir a carga cognitiva. O operador deve saber o que fazer ('Sincronizar Dados') sem precisar entender como o dado é estruturado no backend ('Reconciliar Drifts')."

#### Referência
- `sumauma/frontend/src/components/system/IdentityAuditTab.tsx`
- Skill: `ux-technical-writer`

---

## 11. Ambiente de Desenvolvimento Local (Local Dev)

### 11.1. Banco de Dados Ywara é Docker-Only — Sempre Subir Antes dos Backends
**Data:** 08/05/2026
**Módulo:** Infraestrutura Local / Docker

#### O Problema
Ao reiniciar o computador e tentar rodar `npm run dev` nos backends, o Prisma retorna `P1001: Can't reach database server at 127.0.0.1:3306`. O MySQL **não está instalado nativamente** no Windows — ele roda exclusivamente via container Docker (`nexus-db`), que não reinicia automaticamente com o sistema.

#### A Solução (Padrão Adotado)
```powershell
# SEMPRE executar na raiz do projeto antes de qualquer npm run dev
docker compose up -d nexus-db

# Verificar saúde
docker ps --filter name=neonorte_db
# Esperado: STATUS = "Up X seconds (healthy)", PORTS = "0.0.0.0:3306->3306/tcp"
```

#### Regra de Ouro
> "Se `netstat -ano | findstr :3306` retornar vazio, o banco está desligado — `docker compose up -d nexus-db` na raiz do projeto resolve. Não perca tempo investigando rede ou credenciais."

**Referência:** `docker-compose.yml` (serviço `nexus-db`), Skill: `local-dev-bootstrap`

---

### 11.2. Kurupira Tem Dois Prisma Clients — Ambos Precisam Ser Gerados
**Data:** 08/05/2026
**Módulo:** Kurupira Backend / Prisma

#### O Problema
Backend do Kurupira crasha com `MODULE_NOT_FOUND: Cannot find module '../../node_modules/.prisma/client-sumauma'` após uma instalação limpa de dependências. O `npm install` não gera os clients Prisma — apenas instala o CLI.

#### Causa Raiz
O Kurupira usa multi-schema Prisma:
- `prisma/schema.prisma` → gera `node_modules/@prisma/client` (banco `db_kurupira`)
- `prisma/schema-sumauma.prisma` → gera `node_modules/.prisma/client-sumauma` (leitura RO do `db_sumauma` para AuthZ)

O segundo client tem um output customizado e **não é gerado automaticamente** pelo postinstall padrão.

#### A Solução (Padrão Adotado)
```powershell
# Em kurupira/backend, após qualquer npm install limpo:
npx prisma generate                                          # client principal
npx prisma generate --schema=./prisma/schema-sumauma.prisma # client sumauma RO
```

#### Regra de Ouro
> "Se o Kurupira crashar com MODULE_NOT_FOUND no `client-sumauma`, gere o client customizado com `npx prisma generate --schema=./prisma/schema-sumauma.prisma`. São dois clientes independentes — ambos precisam ser gerados."

**Referência:** `kurupira/backend/prisma/schema-sumauma.prisma`, `kurupira/backend/src/lib/prismaSumauma.js`

---

### 11.3. P1001 do Prisma é Enganoso — Diagnosticar com mysql2 Antes de Investigar Config
**Data:** 08/05/2026
**Módulo:** Prisma / Local Dev

#### O Problema
O erro `P1001: Can't reach database server` é genérico e não distingue entre banco desligado, senha incorreta ou banco inexistente. Isso gera ciclos de investigação improdutivos (trocar host, remover aspas, url-encode de senha) quando o problema real é simplesmente o container parado.

#### A Solução (Padrão Adotado)
Usar um script Node com `mysql2` para isolar se o problema é rede ou Prisma:

```javascript
// scratch/test-db.js
const mysql = require('mysql2/promise');
require('dotenv').config();
async function test() {
  try {
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('✅ Conexão bem-sucedida via mysql2!');
    await conn.end();
  } catch (err) { console.error('❌', err.message); }
}
test();
```

- `ECONNREFUSED` → banco desligado → `docker compose up -d nexus-db`
- `Access denied` → credenciais erradas → revisar `.env`
- Sucesso → problema é de schema/migrations do Prisma

#### Regra de Ouro
> "Antes de investigar rede, aspas ou URL encoding no `.env`, confirme com `netstat -ano | findstr :3306` se há algo ouvindo na porta. Se vazio, o banco está desligado — não é problema de configuração."

---

### 11.4. Sumaúma Esconde Falhas de Banco — Kurupira É o Canário da Mina
**Data:** 08/05/2026
**Módulo:** Sumaúma Backend / Kurupira Backend

#### O Problema
O Sumaúma backend parece "saudável" (porta 3003 ouvindo, sem crash) mesmo quando o banco está desligado, pois usa lazy loading — o Prisma Client só conecta na primeira requisição.

#### A Solução (Padrão Adotado)
Usar o **log de startup do Kurupira** como indicador de saúde do banco:
- `[kurupira] Cache warm-up concluído { modules: X, inverters: Y }` → banco ✅
- `[kurupira] Cache warm-up falhou — cache partirá frio` → banco ❌

O Kurupira executa `warmUpCache()` no startup, carregando o catálogo imediatamente. Qualquer falha de conexão aparece nos primeiros segundos.

#### Regra de Ouro
> "Não confie no status do Sumaúma para avaliar a saúde do banco. Olhe para o Kurupira — ele é o canário da mina de dados."

**Referência:** `kurupira/backend/src/server.js` (função `warmUpCache`)

---

### 11.5. Variáveis de Ambiente sem Aspas no .env do Windows
**Data:** 08/05/2026
**Módulo:** Todos os backends / .env

#### O Problema
URLs de conexão de banco com aspas duplas no `.env` causam falha silenciosa de parsing no Windows com algumas versões do `dotenv`, incluindo o `dotenvx` usado nos backends Ywara.

#### A Solução (Padrão Adotado)
```bash
# ✅ Correto (padrão do ecossistema Ywara)
DATABASE_URL=mysql://user:pass@127.0.0.1:3306/db_name

# ❌ Evitar (pode falhar no Windows com Prisma/dotenvx)
DATABASE_URL="mysql://user:pass@127.0.0.1:3306/db_name"
```

Caracteres especiais em senhas devem ser URL-encoded na connection string:
```bash
# Senha com '!' → encode como '%21'
DATABASE_URL=mysql://user:senha%21@127.0.0.1:3306/db
```

#### Regra de Ouro
> "Nos `.env` do Ywara: sem aspas, IP explícito (`127.0.0.1`), caracteres especiais URL-encoded (`!` → `%21`). Essas três regras evitam 90% dos erros de conexão locais."

**Referência:** `kurupira/backend/.env`, `sumauma/backend/.env`

---

## 12. Consistência de Rotas e baseURL no Frontend
**Data:** 09/05/2026
**Módulo:** Sumaúma Frontend (Axios / useSystemHealth)

#### O Problema
Ao utilizar um cliente de API (Axios) configurado com uma `baseURL` (ex: `/admin`), existe o risco de introduzir prefixos redundantes nas chamadas de rota. Se o código chamar `api.post('/admin/rota')`, o Axios concatenará a base com o path, resultando em `/admin/admin/rota`. Isso causa erros **404 (Not Found)** silenciosos ou visíveis apenas no console do navegador, quebrando funcionalidades críticas sem uma mensagem de erro clara no servidor.

#### A Solução (Padrão Adotado)
1. **Rotas Relativas à Base**: Todas as chamadas ao cliente de API devem omitir o prefixo já contido na `baseURL`. Ex: use `api.post('/system/health')` em vez de `api.post('/admin/system/health')`.
2. **Auditoria de Prefixo**: Ao refatorar ou criar novos hooks de API, verifique se o primeiro segmento da rota não duplica o segmento final da `baseURL`.
3. **Trace de Rede**: Em caso de 404 inesperado, verifique a URL final no console/network tab para identificar segmentos duplicados.

#### Regra de Ouro
> "A `baseURL` do seu cliente de API é o alicerce de todas as chamadas. Nunca repita o prefixo da base nos paths individuais; trate cada chamada como relativa à raiz da API definida na configuração do cliente."

#### Referência
- `sumauma/frontend/src/lib/api.ts` (Definição da `baseURL`)
- `sumauma/frontend/src/hooks/useSystemHealth.ts` (Local da correção)

---

## 13. Sincronização de Metadados (Merge-on-Save) e Erradicação de Mocks na UI
**Data:** 09/05/2026
**Módulo:** Kurupira (Backend / Frontend)

#### O Problema
Foram identificadas duas fontes de falha silenciosa no salvamento de projetos de engenharia:
1. **Frontend Mocks:** Botões de UI construídos com `setTimeout` (simulando estado de `saving` → `success`) deixados como "TODOs" permanentes, dando ao usuário a falsa sensação de que a operação concluiu, enquanto a camada de serviço real (ex: `ProjectService`) nunca foi chamada.
2. **Drift de Coordenadas (DB vs JSON):** O banco de dados possuía colunas físicas para `latitude` e `longitude`, mas as ferramentas de simulação também armazenavam as coordenadas profundamente embutidas em `designData.solar.clientData`. Quando o Frontend enviava atualizações, as colunas físicas dessincronizavam em relação ao JSON.

#### A Solução (Padrão Adotado)
1. **Merge-on-Save no Backend:** Adotamos o JSON (`designData`) como o *Master Data* (Cadeia da Verdade) para o domínio técnico. Se o JSON enviado no `PUT` contém coordenadas, o backend **intercepta e sobrescreve** compulsoriamente os campos relacionais (`latitude`, `longitude`) no payload de update do Prisma. Isso garante que buscas geográficas em SQL puro sempre reflitam o estado exato da engine de simulação.
2. **Mock Sweeping:** Ações de interface que requerem mutação de estado persistente *nunca* devem ser "mockadas" visualmente por mais que a UI esteja sendo desenvolvida. Se a camada de serviço não existe, o botão deve estar `disabled` ou logar um erro, mas nunca simular sucesso de rede.

#### Regra de Ouro
> "Se uma entidade contém metadados em JSON e também em colunas relacionais, o Backend deve executar um Merge-on-Save para alinhar as colunas físicas ao Master Data (JSON) antes do Prisma. Além disso, botões que fingem salvar a aplicação escondem dívidas técnicas cruciais."

**Referência:** `kurupira/backend/src/routes/designs.js`, `kurupira/frontend/src/modules/engineering/ui/navigation/EngineeringNavigation.tsx`

---

## 14. Deploy em Produção: Artefatos de Build e Cache do PWA

### 14.1. `*.tsbuildinfo` Nunca Deve Ser Versionado — Bloqueia `git pull` no VPS
**Data:** 09/05/2026
**Módulo:** Infraestrutura / Deploy VPS / TypeScript

#### O Problema
O TypeScript gera arquivos `*.tsbuildinfo` (ex: `tsconfig.tsbuildinfo`) durante cada execução de `tsc`. Quando esse arquivo é rastreado pelo Git e um build é feito no VPS (gerando uma versão diferente do arquivo), o próximo `git pull` aborta com:

```
error: Your local changes to the following files would be overwritten by merge:
        sumauma/frontend/tsconfig.tsbuildinfo
Please commit your changes or stash them before you merge.
Aborting
```

**Consequência silenciosa:** O build roda após a mensagem de erro (`npm run build` foi encadeado com `&&`), mas usa o código **anterior ao pull** — gerando um bundle com hash idêntico ao build anterior. O Workbox Service Worker não detecta nenhuma mudança e **não se atualiza**, tornando o deploy invisível para o usuário.

#### A Solução (Padrão Adotado)

1. **`.gitignore` Global**: Adicionar `*.tsbuildinfo` ao `.gitignore` raiz do projeto — esses arquivos são cache de compilação e não devem nunca ser versionados.

2. **Correção Imediata no VPS** (quando já está bloqueado):
   ```bash
   git checkout <arquivo>.tsbuildinfo
   git pull origin main
   ```

3. **Remover do tracking** (se já foi versionado acidentalmente):
   ```bash
   git rm --cached **/tsconfig.tsbuildinfo
   git commit -m "chore: remove tsbuildinfo from tracking"
   ```

#### Regra de Ouro
> "Se `git pull` abortar com `tsconfig.tsbuildinfo`, use `git checkout <arquivo> && git pull`. Adicione `*.tsbuildinfo` ao `.gitignore` — esse arquivo de cache TypeScript NUNCA deve ser versionado ou o VPS acumulará conflitos a cada deploy."

#### Referência
- `.gitignore` (raiz do projeto)
- Skill: `vps-deploy` (Armadilha #4)

---

### 14.2. Workbox Service Worker Auto-Atualiza Apenas Quando o Hash do Bundle Muda
**Data:** 09/05/2026
**Módulo:** Kurupira Frontend / PWA / Vite

#### O Problema
O PWA do Kurupira usa Workbox para precachear assets. Quando um novo deploy é feito, o Workbox compara os hashes dos arquivos no novo `sw.js` com os que estão no cache do browser. Se o hash do bundle principal (`index-*.js`) **não mudar** (porque o build usou código antigo), o SW não detecta diferença e **não notifica o usuário** sobre a nova versão.

Isso acontece exatamente quando o `git pull` é abortado: o build roda com código antigo → mesmo hash → SW "cego" → usuário vê versão antiga.

#### A Solução (Padrão Adotado)

1. **Garantir `git pull` antes do build**: O pull deve ser bem-sucedido antes de qualquer build. Se abortar, corrigir antes de prosseguir.

2. **Workbox auto-update funciona se o hash muda**: Quando o bundle tem código novo → hash diferente → Workbox detecta automaticamente → atualiza sem intervenção do browser. Não é necessário `localStorage.clear()` ou unregister do SW se o deploy foi feito corretamente.

3. **Procedimento manual de emergência** (apenas quando hash não mudou):
   ```javascript
   // No console do browser (F12):
   caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
   navigator.serviceWorker.getRegistrations().then(r => r.forEach(sw => sw.unregister()));
   localStorage.clear();
   setTimeout(() => location.reload(true), 500);
   ```

#### Regra de Ouro
> "Se as mudanças do deploy não aparecem no browser mesmo após hard refresh, verifique se o `git pull` foi bem-sucedido ANTES do build. Um pull abortado gera um bundle com hash idêntico ao anterior, tornando o Workbox SW 'cego' para a nova versão. A solução não é limpar o cache — é garantir que o pull e o build usaram o código correto."

#### Referência
- `.gitignore` (correção de `*.tsbuildinfo`)
- Skill: `vps-deploy` (Playbook 5 e Armadilha #4)

---

## 15. Versionamento e Lançamento de Software

### 15.1. O Padrão Ouro: Semantic Versioning (SemVer)
**Data:** 10/05/2026
**Módulo:** Gestão de Lançamentos

Versioning não é apenas uma sequência de números aleatórios; é uma forma de comunicação entre quem desenvolve e quem usa. Embora existam várias abordagens, a indústria de tecnologia convergiu para um padrão principal que evita o caos total: o Semantic Versioning (SemVer).

Ele segue o formato **MAJOR.MINOR.PATCH** (ex: `2.4.12`).

1. **MAJOR (`2.x.x`)**: Alterações "quebrantes" (Breaking Changes). Se você mudar esse número, significa que quem usa sua aplicação pode precisar alterar o código deles para que tudo continue funcionando.
2. **MINOR (`x.4.x`)**: Novas funcionalidades. Você adicionou algo legal, mas não quebrou o que já existia (Backward Compatible).
3. **PATCH (`x.x.12`)**: Correções de bugs. Nada mudou na interface ou nas funções, apenas "limpamos a casa".

### 15.2. A fase "0.x.x" e as Tags Alpha, Beta e RC
De acordo com o SemVer, a versão `0.y.z` é para o desenvolvimento inicial. Isso significa que a API ainda não é estável e qualquer coisa pode mudar a qualquer momento. No entanto, iniciar com zero não significa automaticamente ser um Alpha ou Beta. A fase de lançamento é definida por **sufixos** de pré-lançamento (ex: `1.0.0-alpha.1`):

- **Alpha**: É uma fase interna. O software tem as funcionalidades básicas, mas ainda está cheio de bugs e pode nem abrir.
- **Beta**: O software está "completo" em termos de recursos, mas precisa de testes em escala real. É aqui que usuários externos começam a testar.
- **RC (Release Candidate)**: É o "quase lá". Se nenhum bug catastrófico aparecer, essa versão vira a `1.0.0`.

#### Regra de Ouro
> "A versão `0.x.x` indica apenas instabilidade de desenvolvimento inicial. O status real de pré-lançamento (Alpha, Beta, RC) é definido pelo sufixo após o hífen. Uma versão `1.0.0-alpha.1` é a forma correta de comunicar a maturidade do release, e não apenas o fato de começar com zero."
