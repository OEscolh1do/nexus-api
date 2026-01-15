# 📘 Guia de Onboarding - Vendedores NEXUS

**Para:** Equipe Comercial Neonorte  
**Sistema:** NEXUS - CRM de Gestão de Projetos Solares  
**Arquiteto:** Tecnologia Neonorte
**Versão:** Piloto 1.1

---

## 👋 Bem-vindo ao NEXUS!

O NEXUS é o seu novo sistema de gestão comercial. Aqui você vai:

- ✅ Cadastrar **leads** (novos contatos)
- ✅ Acompanhar **propostas** enviadas
- ✅ Gerenciar o **pipeline de vendas**
- ✅ Ver **status de projetos** em tempo real

**Diferença para planilhas:**

- Sem duplicação de dados
- Todo mundo vê a mesma informação
- Histórico completo de cada cliente
- Atualizações instantâneas

---

## 🔑 Acesso ao Sistema

### URL do Sistema Piloto

```
https://neonorte-nexus.vercel.app
```

### Credenciais (temporárias)

**Vendedor 1:**

- Email: `vendedor1@neonorte.com`
- Senha: `vendedor123`

**Vendedor 2:**

- Email: `vendedor2@neonorte.com`
- Senha: `vendedor123`

**Vendedor 3:**

- Email: `vendedor3@neonorte.com`
- Senha: `vendedor123`

⚠️ **Importante:** Troque sua senha no primeiro acesso!

---

## 🎯 Tour Rápido (5 minutos)

### Tela Inicial: Kanban

Ao fazer login, você verá:

```
┌────────────────────────────────────────────────────┐
│  [Quadro Kanban] [Base de Clientes] [Dashboard]   │
├────────────────────────────────────────────────────┤
│                                                    │
│  Comercial   10 projetos                          │
│  ┌────────┬────────┬────────┬────────┬─────────┐  │
│  │Qualif. │Proposta│Negocia │Aprovação│Fechamento│
│  │        │Enviada │        │         │  ➡️      │
│  │ Card1  │ Card2  │        │         │          │
│  │ Card3  │        │        │         │          │
│  └────────┴────────┴────────┴────────┴─────────┘  │
└────────────────────────────────────────────────────┘
```

### O que é cada coluna?

| Coluna               | O que significa             | Ação típica           |
| -------------------- | --------------------------- | --------------------- |
| **Qualificação**     | Lead novo, primeiro contato | Ligar, WhatsApp, site |
| **Proposta Enviada** | Cliente recebeu proposta    | Aguardar resposta     |
| **Negociação**       | Cliente pediu ajustes       | Revisar preço/prazos  |
| **Aprovação**        | Cliente está decidindo      | Follow-up próximo     |
| **Fechamento ➡️**    | VENDA!                      | Passa para Engenharia |

---

## 🆕 Como Cadastrar um Lead (2 minutos)

### Cenário: Cliente ligou pedindo orçamento

**Passo 1:** Clique no botão **"+ Novo"** (canto superior direito)

**Passo 2:** Preencha o formulário:

```
┌─────────────────────────────────────┐
│  Criar Novo Lead                    │
├─────────────────────────────────────┤
│                                     │
│  Cliente Existente: [Selecionar ▼] │
│       OU                            │
│  → Novo Cliente:                    │
│    Nome: [João Silva Comércio]     │
│    Email: [joao@empresa.com]       │
│    Telefone: [(85) 99999-8888]     │
│                                     │
│  Descrição (opcional):              │
│  [Cliente quer orçamento para       │
│   posto de gasolina, 150kWh/mês]   │
│                                     │
│  [Cancelar]  [Criar Lead]          │
└─────────────────────────────────────┘
```

**Passo 3:** Clique **"Criar Lead"**

**Resultado:** Card aparece na coluna "Qualificação"! ✅

---

## 📋 Como Gerenciar Leads (Dia a Dia)

### Ver Detalhes de um Lead

1. **Clique no card** do cliente
2. Abre modal com 4 abas:

#### Aba 1: Visão Geral

- Status atual
- Dados do cliente (telefone, email)
- Histórico de atividades:
  ```
  📝 12/01 15:30 - Status alterado para "Proposta Enviada"
  📝 10/01 09:15 - Lead criado por Vendedor1
  ```

#### Aba 2: Técnico

- Consumo mensal (kWh)
- Localização
- Tipo de telhado
- (Deixe vazio por enquanto - Engenharia preenche depois)

#### Aba 3: Financeiro

- Preço da proposta: `R$ 28.500,00`
- Tarifa de energia: `R$ 0,85/kWh`

#### Aba 4: Anexos

- Upload de documentos:
  - Conta de energia (PDF)
  - Fotos do local
  - Proposta assinada

---

## 🎯 Workflow Comercial Completo

### Exemplo Prático: João da Silva

**Dia 1 - Terça, 09:00:**

1. João liga pedindo orçamento
2. Você cria o lead (2 minutos)
3. Card aparece em **"Qualificação"**

**Dia 1 - Terça, 14:00:**

1. Você monta proposta no Excel/Word
2. Envia por email/WhatsApp para João
3. **Arrasta o card** para **"Proposta Enviada"**
4. Adiciona nota: "Proposta enviada via WhatsApp"

**Dia 3 - Quinta, 10:00:**

1. João responde: "Preço OK, mas prazo?"
2. **Arrasta o card** para **"Negociação"**
3. Vocês ajustam prazo

**Dia 5 - Sábado:**

1. João confirma que vai comprar
2. **Arrasta o card** para **"Aprovação"**
3. Aguarda assinatura do contrato

**Dia 7 - Segunda:**

1. Contrato assinado!
2. **Arrasta o card** para **"Fechamento ➡️"**
3. Sistema pergunta: "Enviar para Engenharia?"
4. Você confirma ✅
5. Card **desaparece do Comercial** e vai para aba "Engenharia"

🎉 **VENDA CONCLUÍDA!**

---

## 🔄 Como Mover Cards (Drag & Drop)

### Método 1: Arrastar com Mouse

1. Clique e segure no card
2. Arraste até a coluna desejada
3. Solte

### Método 2: Mobile (toque)

1. Toque e segure no card (500ms)
2. Arraste até a coluna
3. Solte

**Dica:** Pode reordenar cards dentro da mesma coluna também!

---

## 📊 Outras Funcionalidades

### Base de Clientes

- Lista **todos** os clientes cadastrados
- Buscar por nome, email ou telefone
- Ver **quantos projetos** cada cliente tem
- Ver **última atividade** de cada um

### Dashboard (Apenas Admin)

- Total de projetos
- Valor do pipeline
- Taxa de conversão
- Gráficos de performance

---

## 💡 Dicas de Uso

### ✅ Boas Práticas

1. **Cadastre logo:** Assim que o cliente ligar/chamar
2. **Adicione notas:** "Cliente quer prazo até sexta"
3. **Mova os cards:** Mantenha pipeline atualizado
4. **Anexe documentos:** Conta de energia, fotos

### ❌ Evite

1. ❌ Deixar cards parados (atualiza diariamente!)
2. ❌ Esquecer de adicionar telefone/email
3. ❌ Criar lead duplicado (busque antes)
4. ❌ Não adicionar notas importantes

---

## 🆘 Problemas Comuns

### "Esqueci minha senha"

- Peça ao administrador para resetar
- (Funcionalidade de reset automático vem em breve)

### "Card sumiu!"

- Verifique se não moveu para outra coluna sem querer
- Ou se passou para Engenharia (aba "Engenharia")

### "Não consigo editar um projeto"

- Você pode editar **apenas seus projetos**
- Admin pode editar todos

### "Sistema está lento"

- Backend gratuito "dorme" após 15min sem uso
- Primeira requisição pode levar 30 segundos
- (Depois fica rápido!)

---

## 📞 Suporte

**Durante o Piloto:**

- Grupo WhatsApp: "Piloto NEXUS"
- Email: suporte@neonorte.com
- Telefone: (85) 9999-9999

**Reportar Bug:**

- Tire print da tela
- Descreva o que foi fazer
- Envie no grupo WhatsApp

---

## 🎓 Vídeos de Treinamento (em breve)

- [ ] Como cadastrar lead (2min)
- [ ] Como gerenciar pipeline (3min)
- [ ] Como anexar documentos (2min)
- [ ] Dicas de produtividade (5min)

---

## 📋 Checklist Primeira Semana

**Dia 1:**

- [ ] Fazer login no sistema
- [ ] Trocar senha
- [ ] Cadastrar 1 lead de teste
- [ ] Mover o lead entre colunas
- [ ] Adicionar uma nota

**Dia 2-3:**

- [ ] Cadastrar leads reais
- [ ] Usar busca na Base de Clientes
- [ ] Anexar documento em um projeto

**Dia 4-5:**

- [ ] Fechar primeira venda no sistema
- [ ] Passar projeto para Engenharia
- [ ] Dar feedback no grupo WhatsApp

---

## 🎯 Meta do Piloto

**Objetivo:** Validar se o NEXUS facilita seu dia a dia

**O que vamos medir:**

- Quantos leads você cadastra/semana
- Tempo para cadastrar 1 lead (meta: <2min)
- Quantas vendas fechadas via sistema
- Seu NPS (de 0-10, você recomendaria?)

**Duração:** 1 mês  
**Prêmio:** Vendedor que mais usar ganha brinde! 🏆

---

## ✅ Resumo Rápido (Cole na sua mesa!)

```
┌─────────────────────────────────────┐
│  NEXUS - Cola Cola Rápido          │
├─────────────────────────────────────┤
│  🌐 URL:                            │
│  https://neonorte-nexus.vercel.app  │
│                                     │
│  📞 Novo Cliente?                   │
│  1. Clique "+ Novo"                 │
│  2. Preencha nome/tel/email         │
│  3. Pronto!                         │
│                                     │
│  📧 Enviou Proposta?                │
│  → Arraste card para "Proposta      │
│     Enviada"                        │
│                                     │
│  💰 Cliente Fechou?                 │
│  → Arraste para "Fechamento"        │
│  → Confirma: "Enviar p/ Engenharia" │
│  → VENDA! 🎉                        │
│                                     │
│  🆘 Dúvida?                         │
│  → Grupo WhatsApp "Piloto NEXUS"    │
└─────────────────────────────────────┘
```

---

**Bem-vindo ao futuro da gestão comercial Neonorte! 🚀**
