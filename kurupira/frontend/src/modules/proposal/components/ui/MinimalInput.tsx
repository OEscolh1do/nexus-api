import { NumericFormat, NumericFormatProps } from 'react-number-format';

interface MinimalInputProps extends Omit<NumericFormatProps, 'value' | 'onChange'> {
    value?: number | string;
    onChange?: (e: any) => void;
}

export const MinimalInput = ({ value, onChange, className, ...props }: MinimalInputProps) => (
    <NumericFormat
        value={value}
        onValueChange={(values) => {
            if (onChange) {
                // Mock an event for compatibility with existing onChange handlers
                onChange({ target: { value: values.floatValue } } as any);
            }
        }}
        thousandSeparator="."
        decimalSeparator=","
        className={`w-20 text-right text-sm font-mono font-bold bg-slate-100 hover:bg-slate-200 focus:bg-white border border-transparent focus:border-indigo-400 rounded px-2 py-0.5 outline-none transition-all ${className || ''}`}
        {...props}
    />
);
