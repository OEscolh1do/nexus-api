---
description: Auditoria e Refatoração de Formulários com React Hook Form + Zod
---

# Fluxo de Trabalho: Auditoria de Gestão de Formulários

Em um ERP orientado a CRUDs, formulários são o coração da aplicação. Formulários verbosos baseados em `useState` geram rerenders desnecessários, validações duplicadas e código difícil de manter.

1. **Identificação de Formulários Controlados com `useState` Puro**:
   - Busque em `src/views/` e `src/components/` por padrões como `const [nome, setNome] = useState('')` repetidos para cada campo do formulário.
   - Formulários com 3 ou mais campos controlados individualmente via `useState` são candidatos a refatoração.
   - **Solução**: Migre para **React Hook Form** (`useForm`, `register`, `handleSubmit`, `Controller`).

2. **Centralização da Validação com Zod**:
   - Validações inline dentro de `onSubmit` ou espalhadas no componente são um cheiro de código.
   - **Solução**: Isole o schema de validação em um arquivo dedicado (ex: `src/lib/validations/userSchema.ts`) usando **Zod** e conecte ao React Hook Form via `zodResolver`.
   - Reutilize o schema Zod también na tipagem TypeScript com `z.infer<typeof schema>`.

3. **Proteção Contra Submits Duplos**:
   - Confirme que o botão de `submit` usa o estado `isSubmitting` do React Hook Form (`formState.isSubmitting`) para desabilitar o botão durante o envio, evitando registros duplicados no backend.

4. **Gestão de Estado de Reset e Edição**:
   - Audite formulários de edição de registros. O `useForm` deve ser inicializado com `defaultValues` vindos da API (use `reset(data)` após o fetch concluir).
   - `useEffect(() => { if (data) reset(data); }, [data])` é o padrão correto.

5. **Padronização de Componentes de Input**:
   - Inputs repetidos pelo projeto devem ser encapsulados em um componente controlado reutilizável (ex: `<FormField>`, `<InputText>`) que já recebe `register`, `error` e `label` como props.
