# 🧱 TEMPLATE: ENG_COMPONENT (O Frontend Dev)

> **💡 PARA QUE SERVE?**
>
> **O Cenário:** Você precisa de um componente React novo (um Card, um Modal complexo, uma Tabela rica) que seja reutilizável e bonito.
>
> **A Abordagem:** Foca na construção isolada do componente, garantindo que ele seja "burro" (recebe dados via props) e visualmente premium.

---

## ✂️ COPIE ISSO AQUI:

```xml
<system_role>
  Atue como Senior Frontend Engineer.
  Framework: {{FRONTEND_FRAMEWORK: React, Vue, Angular, Svelte}}.
  Princípios: Componentes focados, testáveis, reutilizáveis e elegantes.
</system_role>

<mission>
  Criar componente: "{{NOME_DO_COMPONENTE}}".
</mission>

<ui_requirements>
  - {{EX: DEVE SUPORTAR MODO DARK/LIGHT}}
  - {{EX: ANIMAÇÕES DE HOVER COM FRAMER MOTION OU CSS TRANSITIONS}}
  - {{EX: RESPONSIVO (MOBILE/DESKTOP)}}
</ui_requirements>

<props_definition>
  <!-- O que esse componente recebe? -->
  - `data`: Objeto com as informações.
  - `isLoading`: Estado de carregamento.
  - `onClick`: Callback de ação.
</props_definition>

<output_instruction>
  1. Forneça o código do componente com tipagem estrita (TypeScript/PropTypes).
  2. Forneça o arquivo de estilos (CSS/SCSS/Styled Components/Tailwind).
  3. Inclua exemplo de uso do componente.
</output_instruction>
```

---

## 📚 Exemplos Multi-Framework

### React + TypeScript

```tsx
// Button.tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = "primary",
  isLoading = false,
}) => {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={isLoading}
    >
      {isLoading ? "Carregando..." : label}
    </button>
  );
};

// Uso
<Button label="Salvar" onClick={handleSave} variant="primary" />;
```

### Vue 3 + Composition API

```vue
<!-- Button.vue -->
<script setup lang="ts">
interface Props {
  label: string;
  variant?: "primary" | "secondary";
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  isLoading: false,
});

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <button
    :class="['btn', `btn-${variant}`]"
    @click="emit('click')"
    :disabled="isLoading"
  >
    {{ isLoading ? "Carregando..." : label }}
  </button>
</template>

<!-- Uso -->
<Button label="Salvar" @click="handleSave" variant="primary" />
```

### Svelte + TypeScript

```svelte
<!-- Button.svelte -->
<script lang="ts">
  export let label: string;
  export let variant: 'primary' | 'secondary' = 'primary';
  export let isLoading: boolean = false;

  function handleClick() {
    if (!isLoading) {
      dispatch('click');
    }
  }

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>

<button
  class="btn btn-{variant}"
  on:click={handleClick}
  disabled={isLoading}
>
  {isLoading ? 'Carregando...' : label}
</button>

<!-- Uso -->
<Button label="Salvar" on:click={handleSave} variant="primary" />
```

### Angular + TypeScript

```typescript
// button.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-button',
  template: `
    <button
      [class]="'btn btn-' + variant"
      (click)="onClick.emit()"
      [disabled]="isLoading"
    >
      {{ isLoading ? 'Carregando...' : label }}
    </button>
  `
})
export class ButtonComponent {
  @Input() label!: string;
  @Input() variant: 'primary' | 'secondary' = 'primary';
  @Input() isLoading: boolean = false;
  @Output() onClick = new EventEmitter<void>();
}

<!-- Uso -->
<app-button label="Salvar" (onClick)="handleSave()" variant="primary"></app-button>
```
