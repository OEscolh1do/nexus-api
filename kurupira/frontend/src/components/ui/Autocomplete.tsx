import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}

export const Autocomplete: React.FC<AutocompleteProps> = ({
  value,
  onChange,
  options,
  placeholder,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (inputValue.trim() === '') {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(opt =>
        opt.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
    setActiveIndex(-1);
  }, [inputValue, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
    setIsOpen(true);
  };

  const handleOptionClick = (opt: string) => {
    setInputValue(opt);
    onChange(opt);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
        handleOptionClick(filteredOptions[activeIndex]);
      } else {
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative group">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            "w-full h-8 px-2.5 text-[13px] font-medium text-slate-200 bg-slate-900/50 border border-slate-800/80 rounded-sm transition-all outline-none placeholder:text-slate-600 hover:border-slate-700/80",
            "focus:border-slate-600 focus:bg-slate-900 focus:ring-1 focus:ring-slate-700/30",
            "uppercase"
          )}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
          <ChevronDown size={12} className={cn("text-slate-600 transition-transform duration-200", isOpen && "rotate-180")} />
        </div>
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-[100] mt-1 w-full max-h-48 overflow-y-auto bg-slate-900 border border-slate-800 rounded-sm shadow-2xl custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-200">
          {filteredOptions.map((opt, idx) => (
            <button
              key={opt}
              onClick={() => handleOptionClick(opt)}
              onMouseEnter={() => setActiveIndex(idx)}
              className={cn(
                "w-full px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider transition-colors",
                idx === activeIndex ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
