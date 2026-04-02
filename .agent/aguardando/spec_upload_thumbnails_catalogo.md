# Especificação: Upload de Thumbnails Reais para Catálogo de Equipamentos

## 1. O Quê (Business Problem)
**Problema**: Os cards de inversores e módulos no catálogo exibem imagens genéricas de fallback (`solar-inverter.png` / `solar-module.png`). O engenheiro não consegue distinguir visualmente entre um inversor Growatt e um PHB olhando para o card.

**Solução**: Permitir que administradores/engenheiros façam upload de imagens reais dos produtos, associando-as ao registro de catálogo no banco de dados.

## 2. Usuários Finais
- **Admin/Engenheiro Sênior**: Faz upload da foto do produto ao cadastrar equipamento no catálogo.
- **Engenheiro de Dimensionamento**: Vê a foto real ao selecionar equipamentos.

## 3. Critérios de Aceitação
1. Imagem é uploaded via `<input type="file">` no formulário de edição do equipamento.
2. Imagem é comprimida client-side (max 200KB, JPEG/WebP) antes do upload.
3. A URL da imagem é salva no campo `imageUrl` do `ModuleCatalog`/`InverterCatalog`.
4. Cards exibem a imagem real quando disponível; mantêm fallback quando não.
5. Suporte a drag-and-drop no thumbnail.

## 4. Fora de Escopo
- Galeria de múltiplas imagens por equipamento (apenas 1 thumbnail).
- Edição/crop inline (apenas upload direto).
- CDN dedicado (imagens servidas pelo backend estático do Kurupira via `/uploads/`).

## 5. Detalhes Técnicos
- **Storage**: `/kurupira/backend/uploads/catalog/` com naming `{catalogId}.webp`.
- **API**: `POST /api/v1/catalog/modules/:id/image` (multipart/form-data).
- **Schema**: Adicionar `imageUrl String?` aos models `ModuleCatalog` e `InverterCatalog`.
- **Frontend**: Alterar `InverterInventoryItem` e `ModuleInventoryItem` para consumir `imageUrl` em vez de fallback hardcoded.

---
*Status: Aguardando priorização. Pré-requisito: nenhum.*
