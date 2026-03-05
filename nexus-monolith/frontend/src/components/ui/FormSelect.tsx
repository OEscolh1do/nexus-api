import React from 'react';

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({ label, error, className, children, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-lg p-2.5 text-sm outline-none transition-colors appearance-none disabled:opacity-50 disabled:cursor-not-allowed ${
            error 
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
              : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:text-white'
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        {/* Chevron Icon could go here */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};
