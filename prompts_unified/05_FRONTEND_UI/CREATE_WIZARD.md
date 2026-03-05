# 🧙 Criar Wizard Multi-Etapas - Neonorte | Nexus 2.0

> **🎯 Cenário de Uso**
>
> Você precisa criar um fluxo multi-etapas (wizard) para guiar o usuário através de um processo complexo (ex: cadastro, configuração, proposta).
>
> **⏱️ Tempo Estimado:** 45-60 minutos

---

## 📖 Exemplo Real: Wizard do Módulo Solar (6 Etapas)

O módulo Solar do Neonorte | Nexus usa um wizard para criar propostas fotovoltaicas:

1. **Cliente** - Dados do cliente
2. **Localização** - Endereço + mapa
3. **Consumo** - Histórico de energia
4. **Dimensionamento** - Cálculos técnicos
5. **Equipamentos** - Seleção de módulos/inversores
6. **Proposta** - Geração de PDF

---

## ✂️ PROMPT PRÉ-CONFIGURADO

```xml
<system_role>
  Atue como Frontend Engineer especializado em UX de formulários complexos.

  Stack:
  - React 19.2 + TypeScript
  - React Hook Form + Zod
  - TailwindCSS
  - Shadcn/UI
</system_role>

<mission>
  Criar wizard multi-etapas para: {{NOME_DO_PROCESSO}}

  Exemplo: "Criar wizard de onboarding de clientes com 4 etapas"
</mission>

<nexus_context>
  <file path="c:/Users/Neonorte Tecnologia/Documents/Meus Projetos/Neonorte/Neonorte/nexus-monolith/frontend/src/modules/{{modulo}}/" />
  <reference path="nexus-monolith/frontend/src/modules/solar/" description="Exemplo de wizard completo" />
</nexus_context>

<wizard_specification>
  **Nome do Wizard:** {{NOME}}
  **Número de Etapas:** {{NUMERO}}

  **Etapas:**
  1. {{ETAPA_1}}: {{DESCRICAO}} - Campos: {{CAMPOS}}
  2. {{ETAPA_2}}: {{DESCRICAO}} - Campos: {{CAMPOS}}
  3. {{ETAPA_3}}: {{DESCRICAO}} - Campos: {{CAMPOS}}

  **Validação:** {{POR_ETAPA|FINAL}}
  **Persistência:** {{LOCAL_STORAGE|API|AMBOS}}
  **Navegação:** {{LINEAR|LIVRE}}
</wizard_specification>

<execution_protocol>
  1. **Criar Tipos TypeScript:**
     - Interface para dados de cada etapa
     - Interface para dados completos do wizard

  2. **Criar Componentes de Etapa:**
     - Um componente por etapa
     - Validação Zod por etapa
     - React Hook Form

  3. **Criar Componente Principal (Wizard):**
     - State management (currentStep, formData)
     - Navegação entre etapas
     - Progress indicator
     - Botões Voltar/Próximo/Finalizar

  4. **Implementar Persistência:**
     - LocalStorage para rascunhos
     - API call ao finalizar

  5. **Adicionar Feedback Visual:**
     - Loading states
     - Validação em tempo real
     - Mensagens de erro claras
</execution_protocol>

<expected_output>
  1. Tipos TypeScript completos
  2. Componentes de cada etapa
  3. Componente principal do wizard
  4. Validação Zod por etapa
  5. Persistência implementada
  6. Exemplo de uso
</expected_output>
```

---

## 📝 Implementação Passo-a-Passo

### 1. Tipos TypeScript

```typescript
// types/wizard.ts
export interface Step1Data {
  clientName: string;
  email: string;
  phone: string;
}

export interface Step2Data {
  address: string;
  city: string;
  state: string;
}

export interface Step3Data {
  preferences: string[];
  notes?: string;
}

export interface WizardData {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
}

export interface WizardStep {
  id: number;
  title: string;
  description?: string;
  component: React.ComponentType<StepProps>;
}

export interface StepProps {
  data: Partial<WizardData>;
  onNext: (stepData: any) => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
}
```

### 2. Validação Zod por Etapa

```typescript
// validation/wizard.schemas.ts
import { z } from "zod";

export const step1Schema = z.object({
  clientName: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "Telefone inválido"),
});

export const step2Schema = z.object({
  address: z.string().min(5, "Endereço muito curto"),
  city: z.string().min(2),
  state: z.string().length(2, "UF deve ter 2 caracteres"),
});

export const step3Schema = z.object({
  preferences: z.array(z.string()).min(1, "Selecione pelo menos uma opção"),
  notes: z.string().max(500).optional(),
});
```

### 3. Componentes de Etapa

```tsx
// components/Step1.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step1Schema } from "../validation/wizard.schemas";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { StepProps, Step1Data } from "../types/wizard";

export function Step1({ data, onNext, isFirst }: StepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: data.step1 || {},
  });

  const onSubmit = (stepData: Step1Data) => {
    onNext({ step1: stepData });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dados do Cliente</h2>
        <p className="text-gray-600 mt-1">Preencha as informações básicas</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="clientName">Nome Completo *</Label>
          <Input
            id="clientName"
            {...register("clientName")}
            placeholder="Ex: João Silva"
          />
          {errors.clientName && (
            <p className="text-sm text-red-500 mt-1">
              {errors.clientName.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="joao@exemplo.com"
          />
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Telefone *</Label>
          <Input
            id="phone"
            {...register("phone")}
            placeholder="(11) 98765-4321"
          />
          {errors.phone && (
            <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit">Próximo →</Button>
      </div>
    </form>
  );
}
```

```tsx
// components/Step2.tsx (similar structure)
export function Step2({ data, onNext, onBack }: StepProps) {
  // Similar implementation with step2Schema
}

// components/Step3.tsx (similar structure)
export function Step3({ data, onNext, onBack, isLast }: StepProps) {
  // Similar implementation with step3Schema
  // Button "Finalizar" instead of "Próximo"
}
```

### 4. Componente Principal do Wizard

```tsx
// Wizard.tsx
import { useState, useEffect } from "react";
import { Step1 } from "./components/Step1";
import { Step2 } from "./components/Step2";
import { Step3 } from "./components/Step3";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { WizardData, WizardStep } from "./types/wizard";
import { toast } from "sonner";

const STORAGE_KEY = "wizard_draft";

export function Wizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<WizardData>>({});
  const [loading, setLoading] = useState(false);

  const steps: WizardStep[] = [
    {
      id: 1,
      title: "Cliente",
      description: "Dados básicos",
      component: Step1,
    },
    {
      id: 2,
      title: "Localização",
      description: "Endereço",
      component: Step2,
    },
    {
      id: 3,
      title: "Preferências",
      description: "Configurações",
      component: Step3,
    },
  ];

  // Carregar rascunho do localStorage
  useEffect(() => {
    const draft = localStorage.getItem(STORAGE_KEY);
    if (draft) {
      try {
        setFormData(JSON.parse(draft));
        toast.info("Rascunho carregado");
      } catch (error) {
        console.error("Erro ao carregar rascunho:", error);
      }
    }
  }, []);

  // Salvar rascunho automaticamente
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData]);

  const handleNext = (stepData: any) => {
    const updatedData = { ...formData, ...stepData };
    setFormData(updatedData);

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish(updatedData);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async (finalData: Partial<WizardData>) => {
    try {
      setLoading(true);

      // Enviar para API
      const response = await fetch("/api/v2/wizards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalData),
      });

      if (!response.ok) throw new Error("Erro ao salvar");

      // Limpar rascunho
      localStorage.removeItem(STORAGE_KEY);

      toast.success("Wizard concluído com sucesso!");

      // Redirecionar ou resetar
      setFormData({});
      setCurrentStep(1);
    } catch (error) {
      toast.error("Erro ao finalizar wizard");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const CurrentStepComponent = steps[currentStep - 1].component;
  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex-1 text-center ${
                index + 1 === currentStep
                  ? "text-blue-600 font-semibold"
                  : index + 1 < currentStep
                    ? "text-green-600"
                    : "text-gray-400"
              }`}
            >
              <div className="text-sm">{step.title}</div>
              {step.description && (
                <div className="text-xs">{step.description}</div>
              )}
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                Etapa {currentStep} de {steps.length}
              </h3>
            </div>
            <div className="text-sm text-gray-500">
              {Math.round(progress)}% concluído
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Finalizando...</p>
            </div>
          ) : (
            <CurrentStepComponent
              data={formData}
              onNext={handleNext}
              onBack={handleBack}
              isFirst={currentStep === 1}
              isLast={currentStep === steps.length}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation Dots (Optional) */}
      <div className="flex justify-center gap-2 mt-6">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(index + 1)}
            className={`h-2 rounded-full transition-all ${
              index + 1 === currentStep
                ? "w-8 bg-blue-600"
                : index + 1 < currentStep
                  ? "w-2 bg-green-600"
                  : "w-2 bg-gray-300"
            }`}
            aria-label={`Ir para ${step.title}`}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## ✅ Checklist de Verificação

- [ ] **Tipos TypeScript:** Interfaces criadas para cada etapa
- [ ] **Validação Zod:** Schema por etapa funcionando
- [ ] **Componentes de Etapa:** Todos criados e validados
- [ ] **Navegação:** Próximo/Voltar funcionando
- [ ] **Progress Bar:** Indicador visual atualizado
- [ ] **Persistência:** LocalStorage salvando rascunhos
- [ ] **API Integration:** Envio ao finalizar funcionando
- [ ] **Loading States:** Spinners implementados
- [ ] **Error Handling:** Mensagens de erro claras
- [ ] **Responsivo:** Funciona em mobile
- [ ] **Acessibilidade:** Labels e ARIA corretos

---

## 🎨 Variações e Melhorias

### Navegação Livre (Não Linear)

```tsx
const handleStepClick = (stepId: number) => {
  // Validar etapas anteriores antes de permitir pulo
  if (stepId <= currentStep || allPreviousStepsValid(stepId)) {
    setCurrentStep(stepId);
  }
};
```

### Validação em Tempo Real

```tsx
const { watch } = useForm();
const watchedFields = watch();

useEffect(() => {
  // Salvar automaticamente a cada mudança
  const timer = setTimeout(() => {
    setFormData({ ...formData, step1: watchedFields });
  }, 500);

  return () => clearTimeout(timer);
}, [watchedFields]);
```

### Resumo Final

```tsx
// components/StepReview.tsx
export function StepReview({ data }: { data: WizardData }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Revise suas informações</h3>

      <div className="border rounded-lg p-4">
        <h4 className="font-semibold">Cliente</h4>
        <p>{data.step1.clientName}</p>
        <p>{data.step1.email}</p>
      </div>

      <div className="border rounded-lg p-4">
        <h4 className="font-semibold">Localização</h4>
        <p>{data.step2.address}</p>
        <p>
          {data.step2.city}, {data.step2.state}
        </p>
      </div>

      {/* ... outras etapas */}
    </div>
  );
}
```

### Animações Entre Etapas

```tsx
import { motion, AnimatePresence } from "framer-motion";

<AnimatePresence mode="wait">
  <motion.div
    key={currentStep}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    <CurrentStepComponent {...stepProps} />
  </motion.div>
</AnimatePresence>;
```

---

## 🔗 Templates Relacionados

- **Base:** `00_FOUNDATION/TEMPLATE_02_ENGINEER.md`
- **Formulários:** `03_FRONTEND_UI/ADD_FORM_FIELD.md`
- **Validação:** `02_BACKEND_API/ADD_ZOD_VALIDATION.md`

---

## 💡 Dicas de UX

### Quando Usar Wizard?

- ✅ Processo tem 3+ etapas
- ✅ Dados são complexos e precisam ser divididos
- ✅ Usuário precisa de orientação passo-a-passo
- ❌ Processo é simples (use formulário único)
- ❌ Usuário precisa ver tudo de uma vez

### Número Ideal de Etapas

- **3-5 etapas:** Ideal
- **6-8 etapas:** Aceitável se bem justificado
- **9+ etapas:** Considere agrupar ou simplificar

### Feedback Visual

- ✅ Progress bar sempre visível
- ✅ Indicar etapa atual claramente
- ✅ Mostrar etapas concluídas (checkmark)
- ✅ Salvar automaticamente (rascunho)
- ✅ Permitir voltar sem perder dados

---

## ⚠️ Armadilhas Comuns

### ❌ Não Fazer

1. **Validar apenas no final**
   - Valide cada etapa antes de avançar

2. **Perder dados ao voltar**
   - Sempre preserve dados das etapas anteriores

3. **Não salvar rascunhos**
   - Usuário pode fechar navegador acidentalmente

4. **Etapas muito longas**
   - Máximo 5-7 campos por etapa

### ✅ Fazer

1. **Permitir navegação livre** (se fizer sentido)
2. **Mostrar resumo antes de finalizar**
3. **Dar feedback de progresso**
4. **Permitir salvar e continuar depois**
