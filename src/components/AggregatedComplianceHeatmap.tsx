import React, { useState, useMemo, useRef, useEffect } from "react";
import * as d3 from "d3";
import { Product, Partner, ScanJob } from "../types";
import { 
  Flame, Filter, Download, Zap, ShieldAlert, Sparkles, AlertTriangle, 
  CheckCircle2, Info, ArrowUpRight, BarChart3, Layers, Globe, Eye,
  RefreshCw, ChevronRight, Activity, DollarSign, Tag
} from "lucide-react";

export type HeatmapDimension = "region-category" | "region-channel" | "tier-category";
export type HeatmapMetric = "frequency" | "count" | "avg-deficit" | "financial-impact";

interface AggregatedComplianceHeatmapProps {
  products: Product[];
  partners: Partner[];
  scans: ScanJob[];
  className?: string;
  onSelectPartner?: (partnerId: string) => void;
  onSelectProduct?: (productId: string) => void;
}

interface MatrixCell {
  rowKey: string;
  rowLabel: string;
  colKey: string;
  colLabel: string;
  totalScans: number;
  violatingScans: number;
  breachFrequencyPct: number;
  activeViolationsCount: number;
  avgDeficitPct: number;
  totalFinancialDeficit: number;
  partnersInvolved: Array<{ partner: Partner; count: number; maxDeficitPct: number }>;
  topViolatingProducts: Array<{ product: Product; partnerName: string; detectedPrice: number; mapPrice: number; deficitPct: number }>;
}

export default function AggregatedComplianceHeatmap({
  products,
  partners,
  scans,
  className = "",
  onSelectPartner,
  onSelectProduct
}: AggregatedComplianceHeatmapProps) {
  const [dimension, setDimension] = useState<HeatmapDimension>("region-category");
  const [metric, setMetric] = useState<HeatmapMetric>("frequency");
  const [selectedCell, setSelectedCell] = useState<MatrixCell | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ cell: MatrixCell; x: number; y: number } | null>(null);
  const [minThresholdPct, setMinThresholdPct] = useState<number>(0);
  const [searchFilter, setSearchFilter] = useState<string>("");

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Helper functions for region and category categorizations
  const getRegionForPartner = (p: Partner): string => {
    const domain = (p.domain || "").toLowerCase();
    const name = (p.name || "").toLowerCase();
    if (domain.endsWith(".ca") || name.includes("canada") || name.includes("ca ")) return "Canada";
    if (domain.endsWith(".uk") || domain.endsWith(".de") || domain.endsWith(".eu") || name.includes("europe") || name.includes("uk")) return "Europe";
    if (domain.endsWith(".au") || domain.endsWith(".jp") || name.includes("apac") || name.includes("asia")) return "APAC";
    if (domain.endsWith(".br") || domain.endsWith(".mx") || name.includes("latam") || name.includes("brazil")) return "LATAM";
    return "United States";
  };

  const getCategoryForProduct = (prod: Product): string => {
    const name = (prod.name || "").toLowerCase();
    const sku = (prod.sku || "").toLowerCase();
    if (name.includes("headphone") || name.includes("audio") || name.includes("speaker") || name.includes("sound") || sku.includes("aud")) return "Audio & Sound";
    if (name.includes("smart") || name.includes("home") || name.includes("hub") || name.includes("sensor") || sku.includes("smr")) return "Smart Home";
    if (name.includes("camera") || name.includes("vision") || name.includes("lens") || sku.includes("cam")) return "Optics & Vision";
    if (name.includes("watch") || name.includes("fit") || name.includes("wear") || sku.includes("wr")) return "Wearables";
    if (name.includes("pro") || name.includes("ultra") || name.includes("display") || sku.includes("dsp")) return "Displays & Pro";
    return "Core Catalog";
  };

  const getChannelForPartner = (p: Partner): string => {
    const domain = (p.domain || "").toLowerCase();
    const name = (p.name || "").toLowerCase();
    if (domain.includes("amazon") || name.includes("amazon")) return "Amazon Marketplace";
    if (domain.includes("bestbuy") || name.includes("best buy")) return "National Retail";
    if (domain.includes("walmart") || domain.includes("target")) return "Big Box Web";
    if (domain.includes("b2b") || name.includes("distributor") || name.includes("wholesale")) return "B2B / Wholesale";
    return "Direct E-Commerce";
  };

  // Build matrix data dynamically based on selected dimension
  const matrixData = useMemo(() => {
    let rows: string[] = [];
    let cols: string[] = [];

    if (dimension === "region-category") {
      rows = ["United States", "Canada", "Europe", "APAC", "LATAM"];
      cols = ["Audio & Sound", "Smart Home", "Optics & Vision", "Wearables", "Displays & Pro", "Core Catalog"];
    } else if (dimension === "region-channel") {
      rows = ["United States", "Canada", "Europe", "APAC", "LATAM"];
      cols = ["Amazon Marketplace", "National Retail", "Big Box Web", "Direct E-Commerce", "B2B / Wholesale"];
    } else {
      // tier-category
      rows = ["Critical Risk", "High Risk", "Medium Risk", "Low Risk"];
      cols = ["Audio & Sound", "Smart Home", "Optics & Vision", "Wearables", "Displays & Pro", "Core Catalog"];
    }

    const completedScans = (scans || []).filter(s => s.status === "completed" && s.items && s.items.length > 0);
    const prodMap = new Map<string, Product>();
    products.forEach(p => prodMap.set(p.id, p));

    const cellsMap = new Map<string, MatrixCell>();

    rows.forEach(r => {
      cols.forEach(c => {
        const key = `${r}||${c}`;
        cellsMap.set(key, {
          rowKey: r,
          rowLabel: r,
          colKey: c,
          colLabel: c,
          totalScans: 0,
          violatingScans: 0,
          breachFrequencyPct: 0,
          activeViolationsCount: 0,
          avgDeficitPct: 0,
          totalFinancialDeficit: 0,
          partnersInvolved: [],
          topViolatingProducts: []
        });
      });
    });

    const partnerMap = new Map<string, Partner>();
    partners.forEach(p => partnerMap.set(p.id, p));

    const partnerStats = new Map<string, Map<string, { totalScans: number; vScans: number; totalDeficitPct: number; totalDeficitVal: number; items: any[] }>>();

    completedScans.forEach(scan => {
      const prod = prodMap.get(scan.productId);
      const category = prod ? getCategoryForProduct(prod) : "Core Catalog";

      scan.items.forEach(item => {
        const partner = partnerMap.get(item.partnerId);
        if (!partner) return;

        let rowKey = "";
        let colKey = "";

        if (dimension === "region-category") {
          rowKey = getRegionForPartner(partner);
          colKey = category;
        } else if (dimension === "region-channel") {
          rowKey = getRegionForPartner(partner);
          colKey = getChannelForPartner(partner);
        } else {
          // tier-category
          const sensitivity = partner.riskSensitivity || "medium";
          rowKey = sensitivity === "critical" ? "Critical Risk" : sensitivity === "high" ? "High Risk" : sensitivity === "medium" ? "Medium Risk" : "Low Risk";
          colKey = category;
        }

        const cellKey = `${rowKey}||${colKey}`;
        const cell = cellsMap.get(cellKey);
        if (!cell) return;

        cell.totalScans += 1;
        const mapPrice = scan.mapPrice || (prod?.mapPrice) || 0;
        const detectedPrice = item.detectedPrice;

        if (item.status === "violating" && detectedPrice !== null && mapPrice > 0) {
          cell.violatingScans += 1;
          cell.activeViolationsCount += 1;

          const deficitVal = Math.max(0, mapPrice - detectedPrice);
          const deficitPct = (deficitVal / mapPrice) * 100;

          cell.totalFinancialDeficit += deficitVal;

          if (prod) {
            cell.topViolatingProducts.push({
              product: prod,
              partnerName: item.partnerName || partner.name,
              detectedPrice,
              mapPrice,
              deficitPct
            });
          }

          // Aggregate partner stats inside cell
          if (!partnerStats.has(cellKey)) {
            partnerStats.set(cellKey, new Map());
          }
          const pMap = partnerStats.get(cellKey)!;
          if (!pMap.has(partner.id)) {
            pMap.set(partner.id, { totalScans: 0, vScans: 0, totalDeficitPct: 0, totalDeficitVal: 0, items: [] });
          }
          const pStat = pMap.get(partner.id)!;
          pStat.vScans += 1;
          pStat.totalDeficitPct += deficitPct;
          pStat.totalDeficitVal += deficitVal;
        }
      });
    });

    // Finalize calculations per cell
    const cells: MatrixCell[] = [];
    cellsMap.forEach((cell, cellKey) => {
      if (cell.totalScans > 0) {
        cell.breachFrequencyPct = Math.round((cell.violatingScans / cell.totalScans) * 100);
      }
      if (cell.activeViolationsCount > 0) {
        const totalPctSum = cell.topViolatingProducts.reduce((acc, curr) => acc + curr.deficitPct, 0);
        cell.avgDeficitPct = cell.topViolatingProducts.length > 0 ? totalPctSum / cell.topViolatingProducts.length : 0;
      }

      // Deduplicate partner list inside cell
      const pMap = partnerStats.get(cellKey);
      if (pMap) {
        pMap.forEach((stat, partnerId) => {
          const p = partnerMap.get(partnerId);
          if (p) {
            cell.partnersInvolved.push({
              partner: p,
              count: stat.vScans,
              maxDeficitPct: stat.vScans > 0 ? stat.totalDeficitPct / stat.vScans : 0
            });
          }
        });
        cell.partnersInvolved.sort((a, b) => b.count - a.count);
      }

      // Sort violating products by highest deficit percentage
      cell.topViolatingProducts.sort((a, b) => b.deficitPct - a.deficitPct);

      cells.push(cell);
    });

    return { rows, cols, cells };
  }, [dimension, products, partners, scans]);

  // Compute scale boundaries for metric values
  const { maxMetricVal, colorScale } = useMemo(() => {
    let maxVal = 0;
    matrixData.cells.forEach(cell => {
      let val = 0;
      if (metric === "frequency") val = cell.breachFrequencyPct;
      else if (metric === "count") val = cell.activeViolationsCount;
      else if (metric === "avg-deficit") val = cell.avgDeficitPct;
      else val = cell.totalFinancialDeficit;

      if (val > maxVal) maxVal = val;
    });

    if (maxVal === 0) maxVal = 100;

    // Build a multi-stage d3 color scale from dark slate to crimson/rose
    // #0f172a (0%) -> #1e293b (low) -> #854d0e (amber 15%) -> #dc2626 (rose 50%) -> #ff0055 (100%)
    const scale = d3.scaleSequential()
      .domain([0, maxVal])
      .interpolator(d3.interpolateRgbBasis([
        "#0f172a", // Dark slate baseline
        "#1e293b", // Slate highlight
        "#78350f", // Deep amber
        "#e11d48", // Warning Rose
        "#ff0055"  // Extreme Crimson
      ]));

    return { maxMetricVal: maxVal, colorScale: scale };
  }, [matrixData, metric]);

  // Get metric cell display values
  const getCellValue = (cell: MatrixCell): number => {
    if (metric === "frequency") return cell.breachFrequencyPct;
    if (metric === "count") return cell.activeViolationsCount;
    if (metric === "avg-deficit") return cell.avgDeficitPct;
    return cell.totalFinancialDeficit;
  };

  const formatCellValue = (cell: MatrixCell): string => {
    if (cell.totalScans === 0) return "—";
    if (metric === "frequency") return `${cell.breachFrequencyPct}%`;
    if (metric === "count") return `${cell.activeViolationsCount}`;
    if (metric === "avg-deficit") return `${cell.avgDeficitPct.toFixed(1)}%`;
    return `$${cell.totalFinancialDeficit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  // Quick summary statistics
  const heatmapSummary = useMemo(() => {
    let peakHotspot = { label: "None", value: 0 };
    let totalExposedDeficit = 0;
    let totalBreachCount = 0;
    let totalCellsWithViolations = 0;

    matrixData.cells.forEach(cell => {
      totalExposedDeficit += cell.totalFinancialDeficit;
      totalBreachCount += cell.activeViolationsCount;
      if (cell.activeViolationsCount > 0) totalCellsWithViolations++;

      const val = getCellValue(cell);
      if (val > peakHotspot.value) {
        peakHotspot = { label: `${cell.rowLabel} (${cell.colLabel})`, value: val };
      }
    });

    return {
      peakHotspot,
      totalExposedDeficit,
      totalBreachCount,
      totalCellsWithViolations,
      cellCount: matrixData.rows.length * matrixData.cols.length
    };
  }, [matrixData, metric]);

  // Handle Export Matrix as CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Row (${dimension}),Column,Total Scans,Active Breaches,Breach Frequency %,Avg Deficit %,Financial Exposure ($)\n`;

    matrixData.cells.forEach(c => {
      csvContent += `"${c.rowLabel}","${c.colLabel}",${c.totalScans},${c.activeViolationsCount},${c.breachFrequencyPct}%,${c.avgDeficitPct.toFixed(2)}%,$${c.totalFinancialDeficit.toFixed(2)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MAP_Compliance_Heatmap_Matrix_${dimension}_${metric}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-2xl space-y-5 text-slate-100 ${className}`}>
      
      {/* Top Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-100 tracking-tight flex items-center gap-2 font-sans">
                Aggregated Compliance Heatmap
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold uppercase tracking-wider">
                  D3 Engine
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Dynamic 2D multi-dimensional risk matrix mapping breach density and financial MAP deficits
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dimension Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-sans">
            <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-[10px] font-mono text-slate-500 font-bold uppercase shrink-0 hidden sm:inline">Matrix:</span>
            <select
              value={dimension}
              onChange={(e) => {
                setDimension(e.target.value as HeatmapDimension);
                setSelectedCell(null);
              }}
              className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer pr-1"
            >
              <option value="region-category" className="bg-slate-950 text-slate-200">Region × Category</option>
              <option value="region-channel" className="bg-slate-950 text-slate-200">Region × Storefront Channel</option>
              <option value="tier-category" className="bg-slate-950 text-slate-200">Risk Tier × Category</option>
            </select>
          </div>

          {/* Metric Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-sans">
            <Activity className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="text-[10px] font-mono text-slate-500 font-bold uppercase shrink-0 hidden sm:inline">Metric:</span>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as HeatmapMetric)}
              className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer pr-1"
            >
              <option value="frequency" className="bg-slate-950 text-slate-200">Breach Frequency (%)</option>
              <option value="count" className="bg-slate-950 text-slate-200">Active Violations Count</option>
              <option value="avg-deficit" className="bg-slate-950 text-slate-200">Avg Deficit (%)</option>
              <option value="financial-impact" className="bg-slate-950 text-slate-200">Financial Deficit ($)</option>
            </select>
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            title="Download Matrix Data as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Quick Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-slate-500 block">Peak Matrix Hotspot</span>
          <div className="text-sm font-bold text-rose-400 truncate flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="truncate">{heatmapSummary.peakHotspot.label}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono block">
            Val: {metric === "financial-impact" ? `$${heatmapSummary.peakHotspot.value.toLocaleString()}` : `${heatmapSummary.peakHotspot.value}%`}
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-slate-500 block">Hotspot Cell Density</span>
          <div className="text-sm font-bold text-amber-300 font-mono">
            {heatmapSummary.totalCellsWithViolations} / {heatmapSummary.cellCount} <span className="text-xs text-slate-400 font-sans font-normal">Active</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono block">
            {Math.round((heatmapSummary.totalCellsWithViolations / Math.max(1, heatmapSummary.cellCount)) * 100)}% Grid Saturation
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-slate-500 block">Matrix Financial Deficit</span>
          <div className="text-sm font-bold text-rose-400 font-mono">
            ${heatmapSummary.totalExposedDeficit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-slate-400 font-mono block">Across all detected breaches</span>
        </div>

        <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-slate-500 block">Active Breach Count</span>
          <div className="text-sm font-bold text-indigo-300 font-mono">
            {heatmapSummary.totalBreachCount} <span className="text-xs text-slate-400 font-sans font-normal">Alerts</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono block">Audited across active scans</span>
        </div>
      </div>

      {/* Main Heatmap Grid Visualization Container */}
      <div className="relative bg-slate-950/90 border border-slate-800 rounded-xl p-4 overflow-x-auto" ref={containerRef}>
        
        {/* Hotspot Threshold Filter Slider */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-xs font-sans bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-300">Minimum Breach Threshold Filter:</span>
            <span className="font-mono text-amber-300 font-bold">{minThresholdPct}%</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={minThresholdPct}
              onChange={(e) => setMinThresholdPct(parseInt(e.target.value))}
              className="w-32 accent-amber-500 cursor-pointer"
            />
            {minThresholdPct > 0 && (
              <button
                type="button"
                onClick={() => setMinThresholdPct(0)}
                className="text-[10px] font-mono text-slate-400 hover:text-slate-200 underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* 2D Color-Coded Heatmap Grid */}
        <div className="min-w-[650px] space-y-1">
          {/* Column Header Labels */}
          <div className="grid grid-cols-12 gap-1 mb-1 items-center">
            <div className="col-span-3 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest pl-2">
              {dimension === "tier-category" ? "Risk Sensitivity" : "Region / Territory"}
            </div>
            <div className="col-span-9 grid gap-1" style={{ gridTemplateColumns: `repeat(${matrixData.cols.length}, minmax(0, 1fr))` }}>
              {matrixData.cols.map(col => (
                <div key={col} className="text-center text-[10px] font-mono font-bold text-slate-400 truncate px-1 py-1" title={col}>
                  {col}
                </div>
              ))}
            </div>
          </div>

          {/* Grid Rows */}
          {matrixData.rows.map(rowLabel => {
            return (
              <div key={rowLabel} className="grid grid-cols-12 gap-1 items-center">
                {/* Row Label */}
                <div className="col-span-3 text-xs font-semibold text-slate-300 truncate pl-2 font-sans flex items-center gap-1.5" title={rowLabel}>
                  <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{rowLabel}</span>
                </div>

                {/* Grid Cells */}
                <div className="col-span-9 grid gap-1" style={{ gridTemplateColumns: `repeat(${matrixData.cols.length}, minmax(0, 1fr))` }}>
                  {matrixData.cols.map(colLabel => {
                    const cellKey = `${rowLabel}||${colLabel}`;
                    const cell = matrixData.cells.find(c => c.rowLabel === rowLabel && c.colLabel === colLabel) || {
                      rowKey: rowLabel,
                      rowLabel,
                      colKey: colLabel,
                      colLabel,
                      totalScans: 0,
                      violatingScans: 0,
                      breachFrequencyPct: 0,
                      activeViolationsCount: 0,
                      avgDeficitPct: 0,
                      totalFinancialDeficit: 0,
                      partnersInvolved: [],
                      topViolatingProducts: []
                    };

                    const rawVal = getCellValue(cell);
                    const isFilteredOut = minThresholdPct > 0 && cell.breachFrequencyPct < minThresholdPct;
                    const cellBgColor = isFilteredOut || cell.totalScans === 0 ? "#0f172a" : colorScale(rawVal);
                    const isHighRisk = cell.breachFrequencyPct >= 20 || cell.activeViolationsCount >= 3;
                    const isSelected = selectedCell?.rowLabel === rowLabel && selectedCell?.colLabel === colLabel;

                    return (
                      <button
                        key={cellKey}
                        type="button"
                        onClick={() => setSelectedCell(isSelected ? null : cell)}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredCell({ cell, x: rect.left + rect.width / 2, y: rect.top });
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                        style={{ backgroundColor: cellBgColor }}
                        className={`group relative h-16 rounded-xl p-2 transition-all cursor-pointer flex flex-col justify-between border text-left overflow-hidden ${
                          isSelected
                            ? "ring-2 ring-indigo-400 border-indigo-300 shadow-lg scale-[1.02] z-20"
                            : isHighRisk && !isFilteredOut
                            ? "border-rose-500/50 shadow-sm shadow-rose-500/10 hover:border-rose-400 hover:scale-[1.01]"
                            : "border-slate-800/80 hover:border-slate-700 hover:scale-[1.01]"
                        } ${isFilteredOut ? "opacity-30 grayscale" : ""}`}
                      >
                        {/* High Risk Hotspot Glow Pill */}
                        {isHighRisk && !isFilteredOut && (
                          <span className="absolute top-1 right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                          </span>
                        )}

                        <div className="flex justify-between items-start w-full">
                          <span className="text-[9px] font-mono text-slate-300 font-semibold truncate max-w-[80%] opacity-80">
                            {cell.totalScans > 0 ? `${cell.activeViolationsCount} alert${cell.activeViolationsCount === 1 ? '' : 's'}` : "No Data"}
                          </span>
                        </div>

                        <div className="font-mono font-bold text-sm tracking-tight text-white flex items-baseline gap-1">
                          {formatCellValue(cell)}
                        </div>

                        {/* Bottom Mini Indicator */}
                        <div className="w-full bg-slate-900/60 rounded-full h-1 overflow-hidden mt-1">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              isHighRisk ? "bg-rose-500" : cell.breachFrequencyPct > 0 ? "bg-amber-400" : "bg-slate-700"
                            }`}
                            style={{ width: `${Math.min(100, (rawVal / maxMetricVal) * 100)}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Color Gradient Spectrum Legend */}
        <div className="mt-5 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-300 uppercase tracking-wider">Heat Spectrum:</span>
            <span>0% / $0</span>
            <div className="w-36 h-2.5 rounded-full bg-gradient-to-r from-[#0f172a] via-[#78350f] via-[#e11d48] to-[#ff0055] border border-slate-700 shadow-inner"></div>
            <span className="text-rose-400 font-bold">Max Hotspot Density</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2.5 h-2.5 rounded bg-slate-900 border border-slate-700 inline-block"></span>
              Compliant / Low Risk
            </span>
            <span className="flex items-center gap-1 text-amber-300">
              <span className="w-2.5 h-2.5 rounded bg-amber-600/80 border border-amber-400 inline-block"></span>
              Moderate Deficit
            </span>
            <span className="flex items-center gap-1 text-rose-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded bg-rose-600 border border-rose-400 inline-block animate-pulse"></span>
              Critical Hotspot (&ge;20%)
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Detail Inspector Panel for Selected Cell */}
      {selectedCell && (
        <div className="bg-slate-950 border border-indigo-500/40 rounded-xl p-4 space-y-4 shadow-xl animate-fade-in relative">
          <button
            type="button"
            onClick={() => setSelectedCell(null)}
            className="absolute top-3 right-3 text-slate-400 hover:text-white text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 cursor-pointer"
          >
            ✕ Close Inspector
          </button>

          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
            <h4 className="text-sm font-bold text-slate-100 font-sans">
              Hotspot Matrix Inspector: <span className="text-indigo-300">{selectedCell.rowLabel}</span> &times; <span className="text-indigo-300">{selectedCell.colLabel}</span>
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">Breach Frequency</span>
              <span className="text-sm font-bold text-amber-300">{selectedCell.breachFrequencyPct}%</span>
            </div>
            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">Active Violations</span>
              <span className="text-sm font-bold text-rose-400">{selectedCell.activeViolationsCount} items</span>
            </div>
            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">Avg Price Deficit</span>
              <span className="text-sm font-bold text-slate-200">-{selectedCell.avgDeficitPct.toFixed(1)}%</span>
            </div>
            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">Total Financial Impact</span>
              <span className="text-sm font-bold text-rose-400">${selectedCell.totalFinancialDeficit.toLocaleString()}</span>
            </div>
          </div>

          {/* Top Violating Products & Partners in this matrix cell */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            
            {/* Violating Products List */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Top Violating Products in Cell ({selectedCell.topViolatingProducts.length})
              </span>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {selectedCell.topViolatingProducts.length === 0 ? (
                  <div className="p-3 bg-slate-900/50 rounded-lg text-xs text-slate-500 font-mono text-center">
                    No active product violations in this matrix segment.
                  </div>
                ) : (
                  selectedCell.topViolatingProducts.map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => onSelectProduct && onSelectProduct(item.product.id)}
                      className="p-2 bg-slate-900/80 hover:bg-slate-850 rounded-lg border border-slate-800 flex justify-between items-center text-xs font-sans cursor-pointer transition"
                    >
                      <div className="truncate pr-2">
                        <span className="font-semibold text-slate-200 block truncate">{item.product.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Reseller: {item.partnerName} | SKU: {item.product.sku}
                        </span>
                      </div>
                      <div className="text-right shrink-0 font-mono">
                        <span className="text-rose-400 font-bold block">${item.detectedPrice}</span>
                        <span className="text-[10px] text-slate-500">MAP: ${item.mapPrice} (-{item.deficitPct.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Resellers Involved List */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Resellers Active in Cell ({selectedCell.partnersInvolved.length})
              </span>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {selectedCell.partnersInvolved.length === 0 ? (
                  <div className="p-3 bg-slate-900/50 rounded-lg text-xs text-slate-500 font-mono text-center">
                    No partner infractions recorded for this segment.
                  </div>
                ) : (
                  selectedCell.partnersInvolved.map((pStat, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => onSelectPartner && onSelectPartner(pStat.partner.id)}
                      className="p-2 bg-slate-900/80 hover:bg-slate-850 rounded-lg border border-slate-800 flex justify-between items-center text-xs font-sans cursor-pointer transition"
                    >
                      <div className="truncate">
                        <span className="font-semibold text-slate-200 block truncate">{pStat.partner.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{pStat.partner.domain}</span>
                      </div>
                      <div className="text-right shrink-0 font-mono">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                          {pStat.count} {pStat.count === 1 ? 'Infraction' : 'Infractions'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
