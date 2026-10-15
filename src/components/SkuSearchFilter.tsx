import React, { useRef, useEffect } from "react";
import { Search, X, Filter, CheckCircle2, AlertTriangle, ShieldAlert, ArrowUpDown, Tag, RotateCcw, Download, Zap, Activity, Sparkles, FileJson } from "lucide-react";

export type ComplianceFilterStatus = "all" | "compliant" | "violating" | "critical";
export type SkuSortOption = 
  | "name-asc" 
  | "name-desc" 
  | "price-high" 
  | "price-low" 
  | "violations-desc"
  | "breach-intensity-desc"
  | "scan-frequency-desc";

interface SkuSearchFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  complianceFilter: ComplianceFilterStatus;
  onComplianceFilterChange: (status: ComplianceFilterStatus) => void;
  sortBy: SkuSortOption;
  onSortByChange: (sort: SkuSortOption) => void;
  totalProductsCount: number;
  filteredProductsCount: number;
  compliantCount: number;
  violatingCount: number;
  criticalCount: number;
  onResetFilters: () => void;
  onExportCSV?: () => void;
  onExportJSON?: () => void;
  className?: string;
  id?: string;
}

export default function SkuSearchFilter({
  searchQuery,
  onSearchChange,
  complianceFilter,
  onComplianceFilterChange,
  sortBy,
  onSortByChange,
  totalProductsCount,
  filteredProductsCount,
  compliantCount,
  violatingCount,
  criticalCount,
  onResetFilters,
  onExportCSV,
  onExportJSON,
  className = "",
  id = "sku-search-filter"
}: SkuSearchFilterProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  const hasSearch = searchQuery.trim().length > 0;
  const isFiltered = hasSearch || complianceFilter !== "all" || sortBy !== "name-asc";

  return (
    <div id={id} className={`bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800/85 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 ${className}`}>
      
      {/* Top Controls: Search Field + Compliance Filter Dropdown + Sort Dropdown */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
        
        {/* Search Field */}
        <div className="relative flex-1 group">
          <div className={`absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-indigo-500/25 rounded-xl blur-md transition-opacity duration-300 pointer-events-none ${
            hasSearch ? "opacity-70 group-focus-within:opacity-100" : "opacity-0 group-focus-within:opacity-40"
          }`} />

          <div className="relative flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 transition-all duration-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/30">
            <Search className={`w-4 h-4 mr-2.5 transition-colors duration-200 shrink-0 ${
              hasSearch ? "text-indigo-400" : "text-slate-500"
            }`} />
            
            <input
              ref={inputRef}
              type="text"
              id={`${id}-keyword-input`}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Filter products dynamically by Name or SKU code... (Press / to focus)"
              className="w-full bg-transparent text-xs text-slate-200 focus:outline-none placeholder:text-slate-500 font-sans font-medium pr-14"
            />

            {/* Hotkey hint or Clear button */}
            <div className="absolute right-3 flex items-center gap-1.5 select-none">
              {hasSearch ? (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                  id={`${id}-clear-search-btn`}
                  title="Clear Keyword Search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="hidden md:inline-flex items-center text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  /
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          
          {/* Compliance Status Select / Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-sans text-slate-300 hover:border-slate-700 transition">
            <Filter className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-[10px] font-mono text-slate-500 font-bold uppercase shrink-0 hidden sm:inline">Status:</span>
            <select
              id={`${id}-compliance-status-select`}
              value={complianceFilter}
              onChange={(e) => onComplianceFilterChange(e.target.value as ComplianceFilterStatus)}
              className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer font-sans pr-1"
            >
              <option value="all" className="bg-slate-950 text-slate-200">All Statuses ({totalProductsCount})</option>
              <option value="compliant" className="bg-slate-950 text-emerald-400">🟢 Compliant ({compliantCount})</option>
              <option value="violating" className="bg-slate-950 text-amber-400">🟠 Violating / At-Risk ({violatingCount})</option>
              <option value="critical" className="bg-slate-950 text-rose-400">🔴 Critical Alert ({criticalCount})</option>
            </select>
          </div>

          {/* Smart Sort Select */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-sans text-slate-300 hover:border-slate-700 transition focus-within:border-indigo-500/50">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-[10px] font-mono text-slate-500 font-bold uppercase shrink-0 hidden sm:inline">Smart Sort:</span>
            <select
              id={`${id}-sort-select`}
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as SkuSortOption)}
              className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer font-sans pr-1"
            >
              <optgroup label="⚡ Smart High-Risk Priority Sort">
                <option value="breach-intensity-desc" className="bg-slate-950 text-amber-300">⚡ Breach Intensity (% Deficit)</option>
                <option value="scan-frequency-desc" className="bg-slate-950 text-indigo-300">📡 Scan Frequency (Most Scanned)</option>
                <option value="violations-desc" className="bg-slate-950 text-rose-300">🚨 Highest Active Violations First</option>
              </optgroup>
              <optgroup label="Standard Catalog Sort">
                <option value="name-asc" className="bg-slate-950 text-slate-200">Name (A → Z)</option>
                <option value="name-desc" className="bg-slate-950 text-slate-200">Name (Z → A)</option>
                <option value="price-high" className="bg-slate-950 text-slate-200">MAP Threshold (High → Low)</option>
                <option value="price-low" className="bg-slate-950 text-slate-200">MAP Threshold (Low → High)</option>
              </optgroup>
            </select>
          </div>

          {/* Reset Filters Button */}
          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              id={`${id}-reset-btn`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold transition cursor-pointer shrink-0"
              title="Reset all keyword search queries and compliance status filters"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          {/* Export Buttons (CSV & JSON) */}
          <div className="flex items-center gap-2">
            {onExportCSV && (
              <button
                type="button"
                onClick={onExportCSV}
                id={`${id}-export-csv-btn`}
                disabled={filteredProductsCount === 0}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 select-none ${
                  filteredProductsCount > 0
                    ? "bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 hover:text-white border border-indigo-500/35 shadow-sm"
                    : "bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed opacity-50"
                }`}
                title={filteredProductsCount === 0 ? "No SKUs match the current filter to export" : `Export ${filteredProductsCount} filtered SKUs with compliance status to CSV`}
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>CSV</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-200 border border-indigo-800/60 hidden sm:inline">
                  {filteredProductsCount}
                </span>
              </button>
            )}

            {onExportJSON && (
              <button
                type="button"
                onClick={onExportJSON}
                id={`${id}-export-json-btn`}
                disabled={filteredProductsCount === 0}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 select-none ${
                  filteredProductsCount > 0
                    ? "bg-purple-600/20 hover:bg-purple-600/35 text-purple-300 hover:text-white border border-purple-500/35 shadow-sm"
                    : "bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed opacity-50"
                }`}
                title={filteredProductsCount === 0 ? "No SKUs match the current filter to export" : `Export ${filteredProductsCount} filtered SKUs with compliance status to JSON`}
              >
                <FileJson className="w-3.5 h-3.5 text-purple-400" />
                <span>JSON</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-200 border border-purple-800/60 hidden sm:inline">
                  {filteredProductsCount}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Compliance Status Filter Pills Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-850/60">
        
        {/* Status Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          
          <button
            type="button"
            onClick={() => onComplianceFilterChange("all")}
            id={`${id}-pill-all`}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-sans transition flex items-center gap-1.5 cursor-pointer ${
              complianceFilter === "all"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 font-bold shadow-sm"
                : "bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-850"
            }`}
          >
            <Tag className="w-3 h-3 text-indigo-400" />
            <span>All SKUs</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-800">
              {totalProductsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onComplianceFilterChange("compliant")}
            id={`${id}-pill-compliant`}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-sans transition flex items-center gap-1.5 cursor-pointer ${
              complianceFilter === "compliant"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm"
                : "bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-850"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Compliant</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-850/60">
              {compliantCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onComplianceFilterChange("violating")}
            id={`${id}-pill-violating`}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-sans transition flex items-center gap-1.5 cursor-pointer ${
              complianceFilter === "violating"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-sm"
                : "bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-850"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Violating / At-Risk</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-850/60">
              {violatingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onComplianceFilterChange("critical")}
            id={`${id}-pill-critical`}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-sans transition flex items-center gap-1.5 cursor-pointer ${
              complianceFilter === "critical"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold shadow-sm"
                : "bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-850"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Critical Alerts</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-950/60 text-rose-300 border border-rose-850/60">
              {criticalCount}
            </span>
          </button>

          {/* Smart Sort Quick Toggle Buttons */}
          <div className="h-4 w-[1px] bg-slate-800 hidden md:block mx-1"></div>

          <button
            type="button"
            onClick={() => onSortByChange(sortBy === "breach-intensity-desc" ? "name-asc" : "breach-intensity-desc")}
            id={`${id}-smart-sort-breach`}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-sans transition flex items-center gap-1.5 cursor-pointer ${
              sortBy === "breach-intensity-desc"
                ? "bg-amber-500/25 text-amber-300 border border-amber-500/50 font-bold shadow-sm shadow-amber-500/10"
                : "bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-850"
            }`}
            title="Smart Sort: Prioritize items by highest percentage price deficit below MAP"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Breach Intensity</span>
          </button>

          <button
            type="button"
            onClick={() => onSortByChange(sortBy === "scan-frequency-desc" ? "name-asc" : "scan-frequency-desc")}
            id={`${id}-smart-sort-frequency`}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-sans transition flex items-center gap-1.5 cursor-pointer ${
              sortBy === "scan-frequency-desc"
                ? "bg-indigo-500/25 text-indigo-300 border border-indigo-500/50 font-bold shadow-sm shadow-indigo-500/10"
                : "bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-850"
            }`}
            title="Smart Sort: Prioritize items by total scan audit monitoring frequency"
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Scan Frequency</span>
          </button>

        </div>

        {/* Results Counter Summary */}
        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
          <span>Showing <strong className="text-white font-bold">{filteredProductsCount}</strong> of {totalProductsCount} SKUs</span>
          {isFiltered && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-sans font-semibold">
              Filtered Active
            </span>
          )}
        </div>

      </div>

    </div>
  );
}
