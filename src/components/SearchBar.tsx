import React, { useRef, useEffect } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  totalResults: number;
  filteredResults: number;
  className?: string;
  id?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search catalog or sku...",
  totalResults,
  filteredResults,
  className = "",
  id = "products-search-filter"
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus on '/' or 'Ctrl+F' or 'Cmd+F'
      if ((e.key === "/" && document.activeElement !== inputRef.current) || 
          (e.key === "f" && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const hasValue = value.length > 0;

  return (
    <div className={`relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto ${className}`}>
      {/* Input container with focus indicator */}
      <div className="relative flex-1 sm:w-80 relative group">
        <div className={`absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-indigo-500/25 rounded-xl blur-md transition-opacity duration-300 pointer-events-none ${
          hasValue ? "opacity-70 group-focus-within:opacity-100" : "opacity-0 group-focus-within:opacity-40"
        }`} />
        
        <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 transition-all duration-200 focus-within:border-indigo-550 focus-within:ring-1 focus-within:ring-indigo-500/30">
          <Search className={`w-4 h-4 mr-2 transition-colors duration-200 shrink-0 ${
            hasValue ? "text-indigo-400" : "text-slate-500"
          }`} />
          
          <input
            ref={inputRef}
            type="text"
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent text-xs text-slate-200 focus:outline-none placeholder:text-slate-600 font-mono pr-12"
          />

          {/* Matches Badge or Hotkey hint */}
          <div className="absolute right-3 flex items-center gap-1.5 select-none pointer-events-none">
            {hasValue ? (
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                filteredResults > 0 
                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/25" 
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/25"
              }`}>
                {filteredResults} / {totalResults}
              </span>
            ) : (
              <span className="hidden md:inline-flex items-center text-[9px] font-mono text-slate-650 bg-slate-950 px-1 py-0.5 rounded border border-slate-850">
                /
              </span>
            )}
          </div>

          {/* Clear button */}
          {hasValue && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition cursor-pointer pointer-events-auto"
              id="clear-search-btn"
              title="Clear Search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
