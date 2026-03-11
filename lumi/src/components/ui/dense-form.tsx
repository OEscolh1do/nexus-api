/**
 * =============================================================================
 * DENSE FORM COMPONENTS - DESIGN SYSTEM PARA FORMULÁRIOS COMPACTOS
 * =============================================================================
 *
 * MOTIVAÇÃO ARQUITETURAL:
 * Em interfaces de alta densidade (dashboards, painéis de controle), cada pixel importa.
 * Formulários tradicionais desperdiçam espaço com margens excessivas e elementos grandes.
 *
 * PADRÃO DE DESIGN:
 * - Altura fixa de inputs: 32px (h-8)
 * - Tipografia reduzida: text-sm para valores, text-xs para labels
 * - Grid de 12 colunas para layout responsivo
 * - Bordas sutis, sem sombras pesadas
 *
 * PERGUNTA SOCRÁTICA:
 * Por que não usar simplesmente classes Tailwind diretamente nos inputs?
 * Porque viola DRY e torna impossível mudar o Design System globalmente.
 *
 * =============================================================================
 */

import React, { forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';

// =============================================================================
// TIPOS BASE
// =============================================================================

interface DenseFieldProps {
  /** Label do campo */
  label?: string;
  /** Mensagem de erro (exibe ícone de alerta) */
  error?: string;
  /** Dica de ajuda (tooltip) */
  hint?: string;
  /** Span de colunas no grid (1-12) */
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /** Se o campo é obrigatório */
  required?: boolean;
}

// =============================================================================
// LAYOUT COMPONENTS
// =============================================================================

/**
 * Container de formulário com grid de 12 colunas.
 * Uso: Envolver todos os campos do formulário.
 */
export const DenseFormGrid: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`grid grid-cols-12 gap-3 ${className}`}>
    {children}
  </div>
);

/**
 * Seção agrupadora com título opcional.
 * Útil para dividir formulários grandes em blocos lógicos.
 */
export const DenseFormSection: React.FC<{
  title?: string;
  children: React.ReactNode;
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  className?: string;
}> = ({ title, children, colSpan = 12, className = '' }) => (
  <div className={`col-span-${colSpan} ${className}`}>
    {title && (
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-neonorte-green" />
        {title}
      </h3>
    )}
    <div className="grid grid-cols-12 gap-3">
      {children}
    </div>
  </div>
);

/**
 * Card container para grupos de campos relacionados.
 */
export const DenseCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}> = ({ children, className = '', colSpan = 12 }) => (
  <div className={`col-span-${colSpan} bg-white rounded-xl border border-slate-200 p-4 ${className}`}>
    {children}
  </div>
);

// =============================================================================
// MAPEAMENTO DE COL-SPAN (para evitar purge do Tailwind)
// =============================================================================

const colSpanClasses: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  7: 'col-span-7',
  8: 'col-span-8',
  9: 'col-span-9',
  10: 'col-span-10',
  11: 'col-span-11',
  12: 'col-span-12',
};

// =============================================================================
// DENSE INPUT
// =============================================================================

interface DenseInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'>, DenseFieldProps {
  suffix?: string;
  prefix?: string;
  icon?: React.ReactNode;
  helperText?: string;
}

export const DenseInput = forwardRef<HTMLInputElement, DenseInputProps>(
  ({ label, error, hint, colSpan = 6, required, ...props }, ref) => {
    const hasError = !!error;

    return (
      <div className={colSpanClasses[colSpan]}>
        {label && (
          <label className="block text-xs font-medium text-slate-500 mb-1 truncate">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            {...props}
            className={`
              w-full h-8 px-3 text-sm font-medium rounded-lg border transition-all outline-none
              ${hasError
                ? 'border-red-400 bg-red-50/50 focus:ring-2 focus:ring-red-200'
                : 'border-slate-200 bg-white hover:border-slate-300 focus:border-neonorte-green focus:ring-2 focus:ring-neonorte-green/20'
              }
              ${props.disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'text-slate-800'}
              placeholder:text-slate-400
            `}
          />
          {hasError && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 group">
              <AlertCircle size={14} className="text-red-500" />
              <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block z-50">
                <div className="bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg max-w-xs whitespace-nowrap">
                  {error}
                </div>
              </div>
            </div>
          )}
        </div>
        {hint && !error && (
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{hint}</p>
        )}
      </div>
    );
  }
);

DenseInput.displayName = 'DenseInput';

// =============================================================================
// DENSE SELECT
// =============================================================================

interface DenseSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'>, DenseFieldProps {
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const DenseSelect = forwardRef<HTMLSelectElement, DenseSelectProps>(
  ({ label, error, hint, colSpan = 6, required, options, placeholder, ...props }, ref) => {
    const hasError = !!error;

    return (
      <div className={colSpanClasses[colSpan]}>
        {label && (
          <label className="block text-xs font-medium text-slate-500 mb-1 truncate">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            {...props}
            className={`
              w-full h-8 px-3 text-sm font-medium rounded-lg border transition-all outline-none appearance-none
              bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')]
              bg-no-repeat bg-[right_8px_center]
              ${hasError
                ? 'border-red-400 bg-red-50/50 focus:ring-2 focus:ring-red-200'
                : 'border-slate-200 bg-white hover:border-slate-300 focus:border-neonorte-green focus:ring-2 focus:ring-neonorte-green/20'
              }
              ${props.disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'text-slate-800'}
            `}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {hint && !error && (
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{hint}</p>
        )}
      </div>
    );
  }
);

DenseSelect.displayName = 'DenseSelect';

// =============================================================================
// DENSE TEXTAREA
// =============================================================================

interface DenseTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>, DenseFieldProps {
  rows?: number;
}

export const DenseTextarea = forwardRef<HTMLTextAreaElement, DenseTextareaProps>(
  ({ label, error, hint, colSpan = 12, required, rows = 2, ...props }, ref) => {
    const hasError = !!error;

    return (
      <div className={colSpanClasses[colSpan]}>
        {label && (
          <label className="block text-xs font-medium text-slate-500 mb-1 truncate">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          {...props}
          className={`
            w-full px-3 py-2 text-sm font-medium rounded-lg border transition-all outline-none resize-none
            ${hasError
              ? 'border-red-400 bg-red-50/50 focus:ring-2 focus:ring-red-200'
              : 'border-slate-200 bg-white hover:border-slate-300 focus:border-neonorte-green focus:ring-2 focus:ring-neonorte-green/20'
            }
            ${props.disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'text-slate-800'}
            placeholder:text-slate-400
          `}
        />
        {hint && !error && (
          <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>
        )}
      </div>
    );
  }
);

DenseTextarea.displayName = 'DenseTextarea';

// =============================================================================
// DENSE STAT (Read-Only Display)
// =============================================================================

interface DenseStatProps {
  label: string;
  value: string | number;
  unit?: string;
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export const DenseStat: React.FC<DenseStatProps> = ({
  label,
  value,
  unit,
  colSpan = 3,
  variant = 'default',
}) => {
  const variantClasses = {
    default: 'bg-slate-50 border-slate-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-amber-50 border-amber-200',
    danger: 'bg-red-50 border-red-200',
  };

  const textClasses = {
    default: 'text-slate-800',
    success: 'text-green-700',
    warning: 'text-amber-700',
    danger: 'text-red-700',
  };

  return (
    <div className={`${colSpanClasses[colSpan]} ${variantClasses[variant]} border rounded-lg p-2`}>
      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-black ${textClasses[variant]} leading-tight`}>
        {value}
        {unit && <span className="text-xs font-medium text-slate-400 ml-1">{unit}</span>}
      </p>
    </div>
  );
};

// =============================================================================
// DENSE BUTTON
// =============================================================================

interface DenseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const DenseButton: React.FC<DenseButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-bold rounded-lg transition-all outline-none focus:ring-2 focus:ring-offset-1';

  const variantClasses = {
    primary: 'bg-neonorte-green text-white hover:bg-neonorte-green/90 focus:ring-neonorte-green/50',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-300',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-200',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300',
  };

  const sizeClasses = {
    sm: 'h-7 px-3 text-xs',
    md: 'h-8 px-4 text-sm',
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
};

// =============================================================================
// DENSE DIVIDER
// =============================================================================

export const DenseDivider: React.FC<{ label?: string }> = ({ label }) => (
  <div className="col-span-12 flex items-center gap-3 my-1">
    <div className="flex-1 h-px bg-slate-200" />
    {label && <span className="text-[10px] text-slate-400 uppercase tracking-widest">{label}</span>}
    <div className="flex-1 h-px bg-slate-200" />
  </div>
);
