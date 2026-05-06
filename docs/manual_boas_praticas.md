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
    - Em ambientes Docker/WSL, é comum haver dessincronização de relógios. Utilize uma `clockTolerance` (ex: 60s) na verificação de JWT no backend para evitar que tokens recém-emitidos sejam considerados expirados.

#### Regra de Ouro
> "Se um efeito colateral pós-login pode falhar e resetar o estado global, use guardas de componente para impedir loops infinitos e sempre permita uma margem de manobra (clock skew) para validação de tempo no backend."

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
2. **Sincronização Unidirecional (Store -> Local):** Sincronize o estado local com o valor do store apenas no `useEffect` de montagem ou quando a entidade ativa mudar (ex: mudar de Unidade Consumidora).
3. **Escrita Condicional (Local -> Store):**
   - **Live Update:** Atualize o store em tempo real apenas se a alteração for trivial e não disparar efeitos bloqueantes.
   - **Deferred Sync (onBlur / Enter):** Se a alteração exigir confirmação do usuário ou for pesada, execute a atualização do store global apenas no evento `onBlur` ou ao pressionar `Enter`.
4. **Tratamento de Vazio:** Trate o valor vazio (`''`) no local state como `0` ou `null` apenas no momento de enviar para o store, nunca durante a digitação.

#### Regra de Ouro
> "Se um input numérico vinculado a um store global dispara efeitos colaterais ou validações complexas, use um buffer local (`useState`) e sincronize apenas no término da edição (`onBlur`), para garantir fluidez e evitar disparos falsos."

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
3.  **Evitar URL Relativa no Build:** No build do frontend, a `VITE_API_URL` deve ser o domínio completo (`https://...`). Se o código já adiciona `/api/v1`, a variável **não** deve conter `/api` no final para evitar o erro de rota duplicada (`/api/api/v1`).

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
