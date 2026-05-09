---
name: mock-sweeper
description: Caçador de mocks e placeholders esquecidos na UI que causam 'cliques vazios'. Ative quando a interface finge sucesso mas não executa mutação.
---

# Skill: Mock Sweeper

## Gatilho Semântico

Ative esta skill quando o desenvolvedor relatar:
- "O botão finge que carrega e dá sucesso, mas não salva"
- "O evento onClick não chama a API, só muda estado local"
- "Procure botões que estão usando setTimeout para simular rede"
- "Fizemos a UI, agora precisa conectar o componente XYZ no backend"

## Protocolo de Limpeza (Sweeping)

1. **Rastrear Falsos Positivos**: Procure por usos de `setTimeout`, `setLoading(true)` sem chamada `await` a um serviço, ou botões que apenas alteram uma cor/toast para dar falsa sensação de operação concluída (Ex: botões "Salvar" sem conexão).
2. **Conexão Real**: Altere o evento do componente para invocar a camada real de serviço correspondente (ex: `ProjectService`, `CatalogService`, `NexusClient`).
3. **Tratamento Real de Estado**: 
   - Ao iniciar, definir `isSaving = true`.
   - Dentro de um bloco `try`, executar a mutação com `await`.
   - Se for bem-sucedido, exibir sucesso genuíno.
   - Em caso de falha (`catch`), mudar o estado para erro e não ocultar a falha com fallbacks de UI vazios.
4. **Remover "Mocks Visuais"**: Apague qualquer `setTimeout` que simule delay de API. O delay deve ser o tempo natural do request.

## Limitações e Boas Práticas

- ❌ Não remova `setTimeout` legítimos usados para debounce de inputs de busca ou atrasos de animação (ex: tooltips). Foco apenas em **mocks de rede**.
- ❌ Não assuma que o serviço existe. Se a camada de API ainda não foi implementada, não conecte o mock-sweeper. Em vez disso, coloque um `alert("Em desenvolvimento")` para deixar claro ao usuário que a funcionalidade não está viva.
