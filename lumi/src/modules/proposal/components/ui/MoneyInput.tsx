import { NumericFormat } from 'react-number-format';

export const MoneyInput = ({
    value,
    onChange,
    className
}: {
    value: number,
    onChange: (val: number) => void,
    className?: string
}) => {
    return (
        <div className="relative group">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">R$</span>
            <NumericFormat
                value={value}
                onValueChange={(values) => {
                    onChange(values.floatValue || 0);
                }}
                thousandSeparator="."
                decimalSeparator=","
                decimalScale={2}
                fixedDecimalScale={true}
                className={`w-full text-right text-sm font-mono font-bold bg-white hover:bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded pl-7 pr-2 py-1 outline-none transition-all shadow-sm ${className || ''}`}
            />
        </div>
    );
};
