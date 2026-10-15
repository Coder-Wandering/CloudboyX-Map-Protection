import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
  Building2,
  Store,
  Globe2,
  Clock,
  Sparkles,
  Zap,
  ChevronDown,
  ChevronUp,
  Filter,
  FileText,
  Radio,
  MapPin,
  Users,
  Info
} from "lucide-react";

export interface MapComplianceLegendProps {
  mapSeverityFilters?: {
    high: boolean;
    medium: boolean;
    low: boolean;
    compliant: boolean;
  };
  onToggleSeverity?: (severity: "high" | "medium" | "low" | "compliant") => void;
  showHistoricalOverlay?: boolean;
  onToggleHistoricalOverlay?: () => void;
  showViolationHeatmap?: boolean;
  onToggleViolationHeatmap?: () => void;
  showPartnerMarkers?: boolean;
  onTogglePartnerMarkers?: () => void;
  markerScope?: "all" | "violating";
  onToggleMarkerScope?: (scope: "all" | "violating") => void;
  onDownloadReport?: () => void;
  partnerCounts?: {
    total: number;
    critical: number;
    moderate: number;
    low: number;
    compliant: number;
    pending?: number;
    historicalHighRisk?: number;
  };
  className?: string;
  defaultCollapsed?: boolean;
}

export default function MapComplianceLegend({
  mapSeverityFilters = { high: true, medium: true, low: true, compliant: true },
  onToggleSeverity,
  showHistoricalOverlay = false,
  onToggleHistoricalOverlay,
  showViolationHeatmap = true,
  onToggleViolationHeatmap,
  showPartnerMarkers = true,
  onTogglePartnerMarkers,
  markerScope,
  onToggleMarkerScope,
  onDownloadReport,
  partnerCounts = {
    total: 0,
    critical: 0,
    moderate: 0,
    low: 0,
    compliant: 0,
    pending: 0,
    historicalHighRisk: 0
  },
  className = "",
  defaultCollapsed = false
}: MapComplianceLegendProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(defaultCollapsed);
  const [activeTab, setActiveTab] = useState<"all" | "resellers" | "intensity">("all");

  return (
    <div
      id="map-compliance-comprehensive-legend"
      className={`bg-zinc-950/95 border border-zinc-800/90 rounded-xl text-[9px] font-mono shadow-2xl backdrop-blur-md z-20 flex flex-col select-none border-indigo-900/40 text-slate-300 transition-all duration-300 ${className}`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between p-2.5 border-b border-zinc-850 bg-zinc-900/40 rounded-t-xl gap-2">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-indigo-950/80 border border-indigo-800/60 text-indigo-400">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9.5px] font-extrabold text-zinc-100 uppercase tracking-wider">
                Map Legend &amp; Spectrum
              </span>
              <span className="text-[7px] px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/50 font-bold">
                {partnerCounts.total} Partners
              </span>
            </div>
            <span className="text-[7.5px] text-zinc-400 font-sans block">
              Reseller Types &amp; Violation Intensity Coding
            </span>
          </div>
        </div>

        <button
          type="button"
          id="toggle-compliance-legend-collapse-btn"
          onClick={() => setIsCollapsed(prev => !prev)}
          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-850 rounded transition cursor-pointer"
          title={isCollapsed ? "Expand legend details" : "Collapse legend"}
        >
          {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!isCollapsed ? (
        <div className="p-2.5 flex flex-col gap-2.5 max-h-[380px] overflow-y-auto scrollbar-thin">
          {/* Quick Marker Filter: All Partners vs Violating Only */}
          {onToggleMarkerScope && (
            <div className="flex items-center justify-between p-1.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-[8px]">
              <span className="text-zinc-400 font-bold uppercase text-[7.5px] flex items-center gap-1">
                <Filter className="w-3 h-3 text-indigo-400" />
                Map Display Scope:
              </span>
              <div className="inline-flex rounded-md p-0.5 bg-zinc-950 border border-zinc-800">
                <button
                  type="button"
                  id="legend-scope-all-btn"
                  onClick={() => onToggleMarkerScope("all")}
                  className={`px-2 py-0.5 rounded text-[7.5px] font-bold cursor-pointer transition ${
                    markerScope === "all"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  All ({partnerCounts.total})
                </button>
                <button
                  type="button"
                  id="legend-scope-violating-btn"
                  onClick={() => onToggleMarkerScope("violating")}
                  className={`px-2 py-0.5 rounded text-[7.5px] font-bold cursor-pointer transition ${
                    markerScope === "violating"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Violating ({partnerCounts.critical + partnerCounts.moderate})
                </button>
              </div>
            </div>
          )}

          {/* Segmented View Switcher Tabs */}
          <div className="grid grid-cols-3 gap-0.5 bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800/80 text-[8px] font-bold">
            <button
              type="button"
              id="legend-tab-all-btn"
              onClick={() => setActiveTab("all")}
              className={`py-1 rounded text-center transition cursor-pointer ${
                activeTab === "all"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All Keys
            </button>
            <button
              type="button"
              id="legend-tab-resellers-btn"
              onClick={() => setActiveTab("resellers")}
              className={`py-1 rounded text-center transition cursor-pointer ${
                activeTab === "resellers"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Reseller Types
            </button>
            <button
              type="button"
              id="legend-tab-intensity-btn"
              onClick={() => setActiveTab("intensity")}
              className={`py-1 rounded text-center transition cursor-pointer ${
                activeTab === "intensity"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Violation Intensity
            </button>
          </div>

          {/* Section 1: Reseller Types & Partner Status Color Coding */}
          {(activeTab === "all" || activeTab === "resellers") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[7.5px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-900 pb-1">
                <span className="flex items-center gap-1 text-indigo-300">
                  <Building2 className="w-3 h-3 text-indigo-400" />
                  Reseller Classifications
                </span>
                <span className="text-[7px] text-zinc-500 font-sans">Pin Markers &amp; Status</span>
              </div>

              <div className="space-y-1">
                {/* 1. Authorized Enterprise Retailer */}
                <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-zinc-900/50 border border-zinc-800/60 hover:border-emerald-800/50 transition text-[8px]">
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex items-center justify-center w-3 h-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
                    </div>
                    <div>
                      <span className="font-bold text-emerald-300 block">Authorized Enterprise (Tier-1)</span>
                      <span className="text-[7px] text-zinc-400 font-sans block">Direct contract (Amazon, Best Buy, Walmart, Target)</span>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.2 rounded text-[7px] font-bold font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                    Compliant
                  </span>
                </div>

                {/* 2. Specialty & Regional Distributor */}
                <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-zinc-900/50 border border-zinc-800/60 hover:border-teal-800/50 transition text-[8px]">
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex items-center justify-center w-3 h-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
                    </div>
                    <div>
                      <span className="font-bold text-teal-300 block">Specialty &amp; Regional Hub</span>
                      <span className="text-[7px] text-zinc-400 font-sans block">Audio/IT specialists (B&amp;H, Adorama, Micro Center)</span>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.2 rounded text-[7px] font-bold font-mono bg-teal-950/80 text-teal-300 border border-teal-800/60">
                    80-89%
                  </span>
                </div>

                {/* 3. Marketplace & 3rd-Party Vendors */}
                <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-zinc-900/50 border border-zinc-800/60 hover:border-amber-800/50 transition text-[8px]">
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex items-center justify-center w-3 h-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                    </div>
                    <div>
                      <span className="font-bold text-amber-300 block">3P Marketplace &amp; Ecosystem</span>
                      <span className="text-[7px] text-zinc-400 font-sans block">Multi-merchant platforms (eBay, Newegg, 3P storefronts)</span>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.2 rounded text-[7px] font-bold font-mono bg-amber-950/80 text-amber-300 border border-amber-800/60">
                    Warning
                  </span>
                </div>

                {/* 4. Flagged Non-Compliant Merchant */}
                <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-rose-950/30 border border-rose-900/40 hover:border-rose-700/60 transition text-[8px]">
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex items-center justify-center w-3 h-3">
                      <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)]" />
                    </div>
                    <div>
                      <span className="font-bold text-rose-300 block">Flagged / MAP Violator</span>
                      <span className="text-[7px] text-zinc-400 font-sans block">Active price undercutting &amp; persistent breaches</span>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.2 rounded text-[7px] font-bold font-mono bg-red-950/90 text-red-300 border border-red-800/80 animate-pulse">
                    Violating
                  </span>
                </div>

                {/* 5. Pending / Unaudited Partner */}
                <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-zinc-900/50 border border-zinc-800/60 transition text-[8px]">
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex items-center justify-center w-3 h-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.5)]" />
                    </div>
                    <div>
                      <span className="font-bold text-sky-300 block">Pending Audit / New Partner</span>
                      <span className="text-[7px] text-zinc-400 font-sans block">Newly onboarded domain awaiting live automated crawl</span>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.2 rounded text-[7px] font-bold font-mono bg-sky-950/80 text-sky-300 border border-sky-800/60">
                    Pending
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Violation Intensity Markers & Heatmap Spectrum */}
          {(activeTab === "all" || activeTab === "intensity") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[7.5px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-900 pb-1">
                <span className="flex items-center gap-1 text-rose-300">
                  <Flame className="w-3 h-3 text-rose-400 animate-pulse" />
                  Violation Intensity Markers
                </span>
                <span className="text-[7px] text-zinc-500 font-sans">Deficit &amp; Density</span>
              </div>

              {/* Continuous Intensity Color Gradient Bar */}
              <div className="space-y-1 bg-zinc-900/70 p-1.5 rounded-lg border border-zinc-800/70">
                <div className="flex items-center justify-between text-[7px] font-bold uppercase tracking-wider">
                  <span className="text-emerald-400 flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> 0% Deficit
                  </span>
                  <span className="text-yellow-400">&lt;5% Low</span>
                  <span className="text-amber-400">5-15% Med</span>
                  <span className="text-rose-400 flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" /> &gt;15% Critical
                  </span>
                </div>
                
                {/* Visual Heat Gradient Bar */}
                <div 
                  className="h-2 w-full rounded-full shadow-inner border border-zinc-700/60"
                  style={{
                    background: "linear-gradient(90deg, #10b981 0%, #14b8a6 20%, #eab308 45%, #f59e0b 70%, #ef4444 100%)"
                  }}
                />

                <div className="flex items-center justify-between text-[6.5px] text-zinc-500 font-mono">
                  <span>Score: 90-100%</span>
                  <span>Score: 70-89%</span>
                  <span>Score: 45-69%</span>
                  <span>Score: &lt;45% (Urgent)</span>
                </div>
              </div>

              {/* Interactive Severity Tiers */}
              <div className="space-y-1">
                {/* Critical Tier */}
                <div
                  onClick={() => onToggleSeverity && onToggleSeverity("high")}
                  className={`flex items-center justify-between px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                    mapSeverityFilters.high
                      ? "bg-rose-950/40 border-rose-800/50 hover:bg-rose-900/50 text-rose-200"
                      : "bg-zinc-900/30 border-zinc-800/40 text-zinc-500 opacity-50"
                  }`}
                  title="Click to toggle Critical Violations on map"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      {mapSeverityFilters.high && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      )}
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${mapSeverityFilters.high ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]" : "bg-zinc-600"}`} />
                    </span>
                    <div>
                      <span className={`font-bold text-[8.5px] block ${mapSeverityFilters.high ? "text-rose-300" : "text-zinc-500 line-through"}`}>
                        Critical Breach (Score 70-100)
                      </span>
                      <span className="text-[7px] text-zinc-400 font-sans block">&gt;15% Below MAP / &gt;50% Rate / Pulsing Red</span>
                    </div>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-bold font-mono border ${
                    mapSeverityFilters.high ? "bg-red-950/80 text-red-300 border-red-800/60" : "bg-zinc-900 text-zinc-500 border-zinc-800"
                  }`}>
                    {mapSeverityFilters.high ? `${partnerCounts.critical} ON` : "OFF"}
                  </span>
                </div>

                {/* Moderate Tier */}
                <div
                  onClick={() => onToggleSeverity && onToggleSeverity("medium")}
                  className={`flex items-center justify-between px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                    mapSeverityFilters.medium
                      ? "bg-amber-950/40 border-amber-800/50 hover:bg-amber-900/50 text-amber-200"
                      : "bg-zinc-900/30 border-zinc-800/40 text-zinc-500 opacity-50"
                  }`}
                  title="Click to toggle Moderate Violations on map"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      {mapSeverityFilters.medium && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-50" />
                      )}
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${mapSeverityFilters.medium ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" : "bg-zinc-600"}`} />
                    </span>
                    <div>
                      <span className={`font-bold text-[8.5px] block ${mapSeverityFilters.medium ? "text-amber-300" : "text-zinc-500 line-through"}`}>
                        Moderate Breach (Score 40-69)
                      </span>
                      <span className="text-[7px] text-zinc-400 font-sans block">5% - 15% Below MAP / 25-50% Rate / Amber Glow</span>
                    </div>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-bold font-mono border ${
                    mapSeverityFilters.medium ? "bg-amber-950/80 text-amber-300 border-amber-800/60" : "bg-zinc-900 text-zinc-500 border-zinc-800"
                  }`}>
                    {mapSeverityFilters.medium ? `${partnerCounts.moderate} ON` : "OFF"}
                  </span>
                </div>

                {/* Low Severity Tier */}
                <div
                  onClick={() => onToggleSeverity && onToggleSeverity("low")}
                  className={`flex items-center justify-between px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                    mapSeverityFilters.low
                      ? "bg-yellow-950/40 border-yellow-800/50 hover:bg-yellow-900/50 text-yellow-200"
                      : "bg-zinc-900/30 border-zinc-800/40 text-zinc-500 opacity-50"
                  }`}
                  title="Click to toggle Low Severity on map"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${mapSeverityFilters.low ? "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.7)]" : "bg-zinc-600"}`} />
                    </span>
                    <div>
                      <span className={`font-bold text-[8.5px] block ${mapSeverityFilters.low ? "text-yellow-300" : "text-zinc-500 line-through"}`}>
                        Low Deficit (Score 10-39)
                      </span>
                      <span className="text-[7px] text-zinc-400 font-sans block">&lt;5% Below MAP / &lt;25% Rate / Yellow Halo</span>
                    </div>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-bold font-mono border ${
                    mapSeverityFilters.low ? "bg-yellow-950/80 text-yellow-300 border-yellow-800/60" : "bg-zinc-900 text-zinc-500 border-zinc-800"
                  }`}>
                    {mapSeverityFilters.low ? `${partnerCounts.low} ON` : "OFF"}
                  </span>
                </div>

                {/* Compliant Tier */}
                <div
                  onClick={() => onToggleSeverity && onToggleSeverity("compliant")}
                  className={`flex items-center justify-between px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                    mapSeverityFilters.compliant
                      ? "bg-emerald-950/40 border-emerald-800/50 hover:bg-emerald-900/50 text-emerald-200"
                      : "bg-zinc-900/30 border-zinc-800/40 text-zinc-500 opacity-50"
                  }`}
                  title="Click to toggle Compliant Resellers on map"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${mapSeverityFilters.compliant ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" : "bg-zinc-600"}`} />
                    </span>
                    <div>
                      <span className={`font-bold text-[8.5px] block ${mapSeverityFilters.compliant ? "text-emerald-300" : "text-zinc-500 line-through"}`}>
                        Fully Compliant (Green)
                      </span>
                      <span className="text-[7px] text-zinc-400 font-sans block">0% Deficit / Authorized Price Adherence</span>
                    </div>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-bold font-mono border ${
                    mapSeverityFilters.compliant ? "bg-emerald-950/80 text-emerald-300 border-emerald-800/60" : "bg-zinc-900 text-zinc-500 border-zinc-800"
                  }`}>
                    {mapSeverityFilters.compliant ? `${partnerCounts.compliant} ON` : "OFF"}
                  </span>
                </div>

                {/* Historical High-Risk Radar Overlay */}
                {onToggleHistoricalOverlay && (
                  <div
                    onClick={onToggleHistoricalOverlay}
                    className={`flex items-center justify-between px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                      showHistoricalOverlay
                        ? "bg-fuchsia-950/40 border-fuchsia-800/50 hover:bg-fuchsia-900/50 text-fuchsia-200"
                        : "bg-zinc-900/30 border-zinc-800/40 text-zinc-500 opacity-50"
                    }`}
                    title="Click to toggle Historical Risk Zones on map"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        {showHistoricalOverlay && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-60" />
                        )}
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${showHistoricalOverlay ? "bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.8)]" : "bg-zinc-700"}`} />
                      </span>
                      <div>
                        <span className={`font-bold text-[8.5px] block ${showHistoricalOverlay ? "text-fuchsia-300" : "text-zinc-500"}`}>
                          Historical Risk Hub (Purple)
                        </span>
                        <span className="text-[7px] text-zinc-400 font-sans block">&ge;30% Historical Breach Frequency Radar</span>
                      </div>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-bold font-mono border ${
                      showHistoricalOverlay ? "bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-800/60" : "bg-zinc-900 text-zinc-500 border-zinc-800"
                    }`}>
                      {showHistoricalOverlay ? `${partnerCounts.historicalHighRisk || 0} ON` : "OFF"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Visual Marker Symbols Breakdown */}
          {activeTab === "all" && (
            <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/80 space-y-1.5 text-[7.5px]">
              <span className="font-bold text-zinc-300 uppercase tracking-wider block text-[8px] flex items-center gap-1">
                <Radio className="w-3 h-3 text-indigo-400" />
                Marker Symbol Mechanics
              </span>
              <div className="grid grid-cols-2 gap-1 text-zinc-400 font-sans">
                <div className="flex items-start gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0 mt-0.5" />
                  <span><strong className="text-zinc-200 font-mono">Pulsing Ring:</strong> Active live price breach detected</span>
                </div>
                <div className="flex items-start gap-1">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-red-500 to-amber-500 blur-[1px] shrink-0 mt-0.5" />
                  <span><strong className="text-zinc-200 font-mono">Glow Radius:</strong> Intensity scales with % under-MAP deficit</span>
                </div>
                <div className="flex items-start gap-1">
                  <span className="px-1 py-0.2 rounded bg-indigo-900 text-indigo-200 font-mono font-bold text-[6.5px] shrink-0 mt-0.5">3+</span>
                  <span><strong className="text-zinc-200 font-mono">Cluster Badge:</strong> Proximate multi-partner density group</span>
                </div>
                <div className="flex items-start gap-1">
                  <span className="w-2 h-2 rounded border border-dashed border-fuchsia-400 shrink-0 mt-0.5" />
                  <span><strong className="text-zinc-200 font-mono">Dashed Halo:</strong> Recurring chronic breach history</span>
                </div>
              </div>
            </div>
          )}

          {/* Report Export Button */}
          {onDownloadReport && (
            <button
              type="button"
              id="legend-export-pdf-report-btn"
              onClick={onDownloadReport}
              className="w-full py-1.5 px-2.5 bg-indigo-950/90 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-800/60 hover:border-indigo-500 rounded-lg text-[8.5px] font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-98"
              title="Download Geographic Compliance Snapshot Report (PDF)"
            >
              <FileText className="w-3 h-3 text-indigo-400 shrink-0" />
              <span>Export Regional Report (PDF)</span>
            </button>
          )}
        </div>
      ) : (
        /* Collapsed Bar State */
        <div className="px-2.5 py-1.5 flex items-center justify-between text-[8px] text-zinc-400 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Compliant</span>
            </div>
            <span className="text-zinc-600">&bull;</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Warning</span>
            </div>
            <span className="text-zinc-600">&bull;</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>Violating</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
          >
            Expand Legend
          </button>
        </div>
      )}
    </div>
  );
}
