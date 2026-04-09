# Especificação: Editor da Biblioteca de Componentes e Upload de Thumbnails (Catálogo Kurupira)

## 1. O Quê (Business Problem)
**Problema**: Atualmente, o ecossistema de dados dos equipamentos no Kurupira (módulos e inversores) é estático, dificultando atualizações paramétricas sem intervenção no banco de dados. Adicionalmente, os cards do catálogo exibem apenas mockups de fallback, o que diminui a distinção visual. Não existe uma interface administrativa robusta para criar novos componentes manualmente ou editar todas as características elétricas e dimensionais de peças já existentes.

**Solução**: Desenvolver o "Editor da Biblioteca" (Catalog Editor), uma área administrativa com formulários abrangentes para Criação, Edição e Visualização (CRUD completo) de Inversores e Módulos. Esse editor deverá incluir campos técnicos detalhados e um fluxo robusto para upload e gerenciamento de thumbnails reais de cada produto.

## 2. Usuários Finais
- **Admin / Engenheiro Sênior**: Tem acesso ao painel de administração da biblioteca, encarregado de adicionar novos fabricantes, rever especificações elétricas, cadastrar novos lançamentos e anexar imagens reais.
- **Engenheiro de Dimensionamento**: Consome os dados validados e usa os thumbnails em seus laudos e no projetor de usinas.

## 3. Critérios de Aceitação
1. **Interface do Editor**: Uma tabela principal/grid gerenciador da "Biblioteca" contendo os registros do catálogo (Módulos e Inversores).
2. **Formulário Dinâmico e Técnico**:
   - Um formulário que permite a Criação de Novos Inversores/Módulos e Atualização dos existentes.
   - Deve cobrir todos os campos do Schema (Pmax, Voc, Isc, peso, dimensões, quantidade de MPPTs, Vmax, eficiência, etc).
3. **Upload de Thumbnails (Integrado ao Form)**:
   - Input do tipo `file` ou "Drag-and-drop" no próprio modal/tela de edição/criação.
   - Compressão automática front-end (max 200KB, WebP preferencialmente, ou JPEG) antes do envio.
4. **Armazenamento e Integração**:
   - O endereço da imagem deve ficar salvo no campo `imageUrl` (ou correspondente) nos models `ModuleCatalog` e `InverterCatalog`.
   - Nas listagens voltadas ao engenheiro (Project Explorer / Inventory), caso haja uma `imageUrl`, renderizar a miniatura fotográfica; se não, manter a imagem vetorial de fallback genérica.
5. **Ações Imediatas**: O item salvo reflete em tempo real no inventário da plataforma.

## 4. Fora de Escopo
- Galeria com múltiplas perspectivas/fotos por equipamento (será limitado a 1 imagem Principal/Thumbnail).
- Edição de Crop (corte)/Filtros fotográficos direto no navegador. O upload é "as is" com redimensionamento simples.
- Deleção (Hard Delete) de equipamentos já utilizados em projetos; implementaremos restrição ou "Soft Delete" (arquivamento).

## 5. Detalhes Técnicos e Impactos
- **Banco de Dados (Schema)**: 
  - Validar/Atualizar `ModuleCatalog` e `InverterCatalog` no Prisma para suportarem o campo estendido, caso a base atual não suporte edição livre.
- **Back-end (API)**: 
  - Novas rotas ou rotas atualizadas para suportar o CRUD `POST /api/v1/catalog/...`, `PUT /api/v1/catalog/...`.
  - Tratamento de Multipart form-data ou base64 na rota do editor em si.
  - Storage Local (Fly.io volume ou persistente) para a pasta `/uploads/catalog/`.
- **Front-end**: 
  - Painel Administrativo ou Tab no Kurupira com Form (Zod + React Hook Form).
  - Alteração nos Cards (`InverterInventoryItem`, `ModuleInventoryItem`) preexistentes para mapeamento dinâmico.

---
*Status: Especificação (O Quê) - Aguardando aprovação.*
