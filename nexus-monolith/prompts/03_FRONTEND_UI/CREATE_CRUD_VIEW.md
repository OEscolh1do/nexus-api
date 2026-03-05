# 🎨 Criar View CRUD Completa - Neonorte | Nexus 2.0

> **🎯 Cenário de Uso**
>
> Você precisa criar uma view completa de gerenciamento (Create, Read, Update, Delete) para um recurso (ex: gerenciar Assets/Patrimônio).
>
> **⏱️ Tempo Estimado:** 20-30 minutos

---

## ✂️ PROMPT PRÉ-CONFIGURADO

```xml
<system_role>
  Atue como Desenvolvedor Frontend para Neonorte Neonorte | Nexus 2.0.

  Stack:
  - Framework: React 19.2
  - Language: TypeScript 5.9
  - Styling: TailwindCSS 4.x
  - Components: Shadcn/UI (Radix UI)
  - Forms: React Hook Form + Zod
  - State: React hooks (useState, useEffect)
</system_role>

<mission>
  Criar view CRUD completa para o recurso: "{{NOME_DO_RECURSO}}"

  Exemplo: Criar view de gerenciamento de Assets (Patrimônio)
</mission>

<nexus_context>
  <file path="c:/Users/Neonorte Tecnologia/Documents/Meus Projetos/Neonorte/Neonorte/nexus-monolith/frontend/src/" />
  <file path="c:/Users/Neonorte Tecnologia/Documents/Meus Projetos/Neonorte/Neonorte/nexus-monolith/backend/prisma/schema.prisma" />
  <file path="c:/Users/Neonorte Tecnologia/Documents/Meus Projetos/Neonorte/Neonorte/CONTEXT.md" />
</nexus_context>

<view_specification>
  **Recurso:** {{NOME_DO_RECURSO}}
  **Modelo Prisma:** {{NOME_DO_MODELO}}
  **Endpoint API:** /api/{{recursos}}

  **Funcionalidades:**
  - [ ] Listar todos os registros (tabela)
  - [ ] Criar novo registro (modal)
  - [ ] Editar registro existente (modal)
  - [ ] Deletar registro (confirmação)
  - [ ] Busca/Filtro (opcional)
  - [ ] Paginação (opcional)

  **Campos do Formulário:**
  - {{CAMPO_1}}: {{TIPO_INPUT}} - {{VALIDACAO}}
  - {{CAMPO_2}}: {{TIPO_INPUT}} - {{VALIDACAO}}
  - {{CAMPO_3}}: {{TIPO_INPUT}} - {{VALIDACAO}}
</view_specification>

<execution_protocol>
  1. **Criar Tipos TypeScript:**
     - Arquivo: `frontend/src/types/{{recurso}}.ts`
     - Interface principal + DTOs (Create, Update)

  2. **Criar Cliente API:**
     - Arquivo: `frontend/src/lib/api/{{recurso}}.ts`
     - Funções: getAll, getById, create, update, delete

  3. **Criar Componentes:**
     - `{{Recurso}}View.tsx` - View principal
     - `{{Recurso}}Table.tsx` - Tabela de listagem
     - `{{Recurso}}FormModal.tsx` - Modal de criação/edição

  4. **Implementar Validação:**
     - Schema Zod no FormModal
     - React Hook Form com zodResolver

  5. **Adicionar Rota:**
     - Atualizar `frontend/src/App.tsx` ou router
     - Adicionar link na sidebar (se aplicável)

  6. **Testar:**
     - Criar registro
     - Editar registro
     - Deletar registro
     - Verificar validação de formulário
</execution_protocol>

<safety_checks>
  - ✅ Validação Zod sincronizada com backend
  - ✅ Estados de loading implementados
  - ✅ Tratamento de erros com toast/mensagem
  - ✅ Confirmação antes de deletar
  - ✅ Formulário limpa após sucesso
  - ✅ Tabela atualiza após CRUD
  - ✅ Responsivo (mobile-friendly)
</safety_checks>

<expected_output>
  1. Tipos TypeScript completos
  2. Cliente API com todas as operações CRUD
  3. View principal com tabela
  4. Modal de formulário com validação
  5. Integração completa funcionando
  6. Exemplo de uso documentado
</expected_output>
```

---

## 📖 Exemplo Completo: View de Gerenciamento de Assets

### 1. Tipos TypeScript

```typescript
// frontend/src/types/asset.ts
export interface Asset {
  id: string;
  name: string;
  type: string;
  status: string;
  serialNumber?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetDTO {
  name: string;
  type: string;
  status: string;
  serialNumber?: string;
  location?: string;
  notes?: string;
}

export interface UpdateAssetDTO extends Partial<CreateAssetDTO> {}

export type AssetStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "RETIRED";
export type AssetType =
  | "COMPUTER"
  | "VEHICLE"
  | "EQUIPMENT"
  | "FURNITURE"
  | "OTHER";
```

### 2. Cliente API

```typescript
// frontend/src/lib/api/assets.ts
import { api } from "../api";
import type { Asset, CreateAssetDTO, UpdateAssetDTO } from "@/types/asset";

export const assetAPI = {
  async getAll(): Promise<Asset[]> {
    const { data } = await api.get("/api/assets");
    return data;
  },

  async getById(id: string): Promise<Asset> {
    const { data } = await api.get(`/api/assets/${id}`);
    return data;
  },

  async create(dto: CreateAssetDTO): Promise<Asset> {
    const { data } = await api.post("/api/assets", dto);
    return data;
  },

  async update(id: string, dto: UpdateAssetDTO): Promise<Asset> {
    const { data } = await api.put(`/api/assets/${id}`, dto);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/assets/${id}`);
  },
};
```

### 3. View Principal

```tsx
// frontend/src/modules/assets/AssetsView.tsx
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssetTable } from "./AssetTable";
import { AssetFormModal } from "./AssetFormModal";
import { assetAPI } from "@/lib/api/assets";
import type { Asset } from "@/types/asset";
import { toast } from "sonner";

export function AssetsView() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const data = await assetAPI.getAll();
      setAssets(data);
    } catch (error) {
      toast.error("Erro ao carregar patrimônios");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleCreate = () => {
    setEditingAsset(null);
    setIsModalOpen(true);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este patrimônio?")) {
      return;
    }

    try {
      await assetAPI.delete(id);
      toast.success("Patrimônio deletado com sucesso");
      loadAssets();
    } catch (error) {
      toast.error("Erro ao deletar patrimônio");
    }
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    setEditingAsset(null);
    loadAssets();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Patrimônio</h1>
          <p className="text-gray-600 mt-1">
            Gerencie equipamentos, veículos e ativos da empresa
          </p>
        </div>

        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Patrimônio
        </Button>
      </div>

      <AssetTable
        assets={assets}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <AssetFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        asset={editingAsset}
      />
    </div>
  );
}
```

### 4. Tabela de Listagem

```tsx
// frontend/src/modules/assets/AssetTable.tsx
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Asset } from "@/types/asset";

interface Props {
  assets: Asset[];
  loading: boolean;
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
}

const statusColors = {
  AVAILABLE: "bg-green-500",
  IN_USE: "bg-blue-500",
  MAINTENANCE: "bg-yellow-500",
  RETIRED: "bg-gray-500",
};

const statusLabels = {
  AVAILABLE: "Disponível",
  IN_USE: "Em Uso",
  MAINTENANCE: "Manutenção",
  RETIRED: "Desativado",
};

export function AssetTable({ assets, loading, onEdit, onDelete }: Props) {
  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-gray-500">Nenhum patrimônio cadastrado</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Nº Série</TableHead>
            <TableHead>Localização</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => (
            <TableRow key={asset.id}>
              <TableCell className="font-medium">{asset.name}</TableCell>
              <TableCell>{asset.type}</TableCell>
              <TableCell>
                <Badge
                  className={
                    statusColors[asset.status as keyof typeof statusColors]
                  }
                >
                  {statusLabels[asset.status as keyof typeof statusLabels]}
                </Badge>
              </TableCell>
              <TableCell>{asset.serialNumber || "-"}</TableCell>
              <TableCell>{asset.location || "-"}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(asset)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(asset.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### 5. Modal de Formulário

```tsx
// frontend/src/modules/assets/AssetFormModal.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assetAPI } from "@/lib/api/assets";
import type { Asset } from "@/types/asset";
import { toast } from "sonner";

const assetSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  type: z.enum(["COMPUTER", "VEHICLE", "EQUIPMENT", "FURNITURE", "OTHER"]),
  status: z.enum(["AVAILABLE", "IN_USE", "MAINTENANCE", "RETIRED"]),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().max(500, "Notas muito longas").optional(),
});

type AssetFormData = z.infer<typeof assetSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asset?: Asset | null;
}

export function AssetFormModal({ isOpen, onClose, onSuccess, asset }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: asset || {
      status: "AVAILABLE",
      type: "EQUIPMENT",
    },
  });

  const onSubmit = async (data: AssetFormData) => {
    try {
      if (asset) {
        await assetAPI.update(asset.id, data);
        toast.success("Patrimônio atualizado com sucesso");
      } else {
        await assetAPI.create(data);
        toast.success("Patrimônio criado com sucesso");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao salvar patrimônio");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {asset ? "Editar Patrimônio" : "Novo Patrimônio"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Ex: Notebook Dell Latitude"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={watch("type")}
                onValueChange={(value) => setValue("type", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPUTER">Computador</SelectItem>
                  <SelectItem value="VEHICLE">Veículo</SelectItem>
                  <SelectItem value="EQUIPMENT">Equipamento</SelectItem>
                  <SelectItem value="FURNITURE">Mobília</SelectItem>
                  <SelectItem value="OTHER">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status *</Label>
              <Select
                value={watch("status")}
                onValueChange={(value) => setValue("status", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Disponível</SelectItem>
                  <SelectItem value="IN_USE">Em Uso</SelectItem>
                  <SelectItem value="MAINTENANCE">Manutenção</SelectItem>
                  <SelectItem value="RETIRED">Desativado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="serialNumber">Nº de Série</Label>
              <Input
                id="serialNumber"
                {...register("serialNumber")}
                placeholder="Ex: SN123456789"
              />
            </div>

            <div>
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                {...register("location")}
                placeholder="Ex: Sala 201"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Informações adicionais..."
              rows={3}
            />
            {errors.notes && (
              <p className="text-sm text-red-500 mt-1">
                {errors.notes.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### 6. Adicionar Rota

```tsx
// frontend/src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AssetsView } from "./modules/assets/AssetsView";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ... outras rotas */}
        <Route path="/assets" element={<AssetsView />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## ✅ Checklist de Verificação

- [ ] **Tipos TypeScript:** Interface + DTOs criados
- [ ] **Cliente API:** Todas as operações CRUD funcionam
- [ ] **View Principal:** Renderiza tabela e modal
- [ ] **Tabela:** Exibe dados corretamente
- [ ] **Modal:** Abre/fecha corretamente
- [ ] **Formulário:** Validação Zod funciona
- [ ] **Criar:** Novo registro é criado
- [ ] **Editar:** Registro é atualizado
- [ ] **Deletar:** Registro é removido (com confirmação)
- [ ] **Loading States:** Spinners/skeletons implementados
- [ ] **Error Handling:** Toasts de erro exibidos
- [ ] **Responsivo:** Funciona em mobile

---

## 🔗 Templates Relacionados

- **Base:** `00_FOUNDATION/TEMPLATE_02_ENGINEER.md`
- **Backend:** `02_BACKEND_API/CREATE_CUSTOM_ENDPOINT.md`
- **Formulário:** `03_FRONTEND_UI/ADD_FORM_FIELD.md`

---

## ⚠️ Melhorias Opcionais

### Busca/Filtro

```tsx
const [searchTerm, setSearchTerm] = useState("");

const filteredAssets = assets.filter(
  (asset) =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()),
);

<Input
  placeholder="Buscar patrimônio..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>;
```

### Paginação

```tsx
const [page, setPage] = useState(1);
const itemsPerPage = 10;

const paginatedAssets = filteredAssets.slice(
  (page - 1) * itemsPerPage,
  page * itemsPerPage,
);
```

### Loading Skeleton

```tsx
import { Skeleton } from "@/components/ui/skeleton";

if (loading) {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
```
