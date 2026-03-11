---
description: How to write quality tests for backend services and frontend components
---

# Padrão de Qualidade em Testes Automatizados

## Contexto do Nexus

Tests automatizados não só garantem que a função opera corretamente hoje, mas blindam o sistema contra refatorações futuras. Eles devem cobrir desde lógica matemática até isolamento de permissões de tenants (RLS).

## Estratégia de Cobertura Backend (Services & Controllers)

Prioridade de teste: **Services >> Validators >> Controllers**.

Escreva os testes verificando estas três facetas universais:

### 1. Happy Path (Caminho Feliz)
A operação primária funciona sob circunstâncias ideais?
- Ex: O Serviço de Faturamento gera a Invoice com base num Lead Fechado.

### 2. Sad Paths (Tratamento de Exceções)
O sistema rejeita e lida educadamente com lixo ou fluxos não naturais?
- Input inválido aciona o `ZodError`?
- Criação referenciando ID inexistente aciona throw de não encontrado?
- Lógica de domínio bloqueia (ex: Tentativa de aprovar orçamento já rejeitado)?

### 3. The Security Path (Isolamento RLS & RBAC)
Este é exclusivo do modelo multitenant Enterprise:
- Acessar o recurso com `tenantId` diferente (via `withTenant`) esconde o dado (retorna array vazio ou NotFound)?
- Papel sem permissão adequadamente rejeitado no Controller?

## Estratégia de Frontend (React Testing)

Testes de Integração e UI devem priorizar **comportamento de usuário** em vez de implementação do código. (ex: Clicar no botão, e não chamar a função interna).

### Padrão de Tela (UI Path)
1. **Renderização Inicial:** Componentes chaves estão visíveis? Tabela exibe skeleton em loading state?
2. **Ciclo de Formulário (Form Journey):** Preencher form → Zod Validar Erros em tela → Efetuar submissão.
3. **Mocks:** Isolar dependências HTTP interceptando `axios` ou chamadas `api.*` sem disparar para a rede real.

## Anatomia de um Bom Arquivo de Teste (AAA)

Seguir estritamente: **A**rrange, **A**ct, **A**ssert.

```javascript
describe('CommercialService.calculateCommission', () => {
  it('should apply 5% commission for standard deals', async () => {
    // 1. Arrange (Preparar terreno)
    const payload = { amount: 100000, type: 'STANDARD' };
    
    // 2. Act (Executar a ação)
    const result = CommercialService.calculateCommission(payload);
    
    // 3. Assert (Verificar resultado exato)
    expect(result.commissionValue).toBe(5000);
  });
})
```

## Regras de Ouro
- O arquivo deve rodar rápido. Se depender de banco SQL real, isole seu banco de teste para ser desmontado e limpo a cada ciclo.
- Nomes de testes não devem usar termos vagos (`should work`). Eles devem dizer o quê e em qual cenário (`should throw ForbiddenError when user tries to delete project without ADMIN role`).
