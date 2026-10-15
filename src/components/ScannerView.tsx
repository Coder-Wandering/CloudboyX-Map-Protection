import React, { useState, useEffect } from "react";
import { Product, Partner, ScanJob, NotificationAlert, MonitoringConfig } from "../types";
import { 
  Radio, RefreshCw, Calendar, CheckCircle, AlertTriangle, HelpCircle, Eye, Trash2, 
  ShieldAlert, Camera, Sliders, CheckSquare, Square, Download, FileSpreadsheet, 
  Search, ShoppingBag, Globe, AlertCircle, Sparkles, Mail, Send, Check, ChevronDown, 
  ChevronUp, Play, Clock
} from "lucide-react";
import ViolationScreenshot from "./ViolationScreenshot";

export function getViolationPriority(mapPrice: number, dPrice: number | null) {
  if (dPrice === null || dPrice === undefined || dPrice >= mapPrice - 0.01) {
    return null;
  }
  const drop = mapPrice - dPrice;
  const pct = (drop / mapPrice) * 100;
  
  if (pct >= 15 || drop >= 20) {
    return {
      level: "High",
      text: "High Priority",
      colorClass: "bg-rose-500/15 text-rose-400 border border-rose-500/30 text-rose-400 font-semibold",
      bgDot: "bg-rose-500",
      description: "Severe drop"
    };
  } else if (pct >= 5 || drop >= 5) {
    return {
      level: "Medium",
      text: "Medium Priority",
      colorClass: "bg-amber-500/15 text-amber-400 border border-amber-500/30 text-amber-400 font-semibold",
      bgDot: "bg-amber-500",
      description: "Moderate drop"
    };
  } else {
    return {
      level: "Low",
      text: "Low Priority",
      colorClass: "bg-sky-500/15 text-sky-400 border border-sky-500/20 text-sky-400 font-semibold",
      bgDot: "bg-sky-500",
      description: "Minor drop"
    };
  }
}

export function getScanMaxPriority(scan: ScanJob) {
  const violatingItems = scan.items.filter(i => i.status === "violating" && i.detectedPrice !== null);
  if (violatingItems.length === 0) return null;
  
  let maxLevel: 'Low' | 'Medium' | 'High' | null = null;
  for (const item of violatingItems) {
    const prio = getViolationPriority(scan.mapPrice, item.detectedPrice);
    if (!prio) continue;
    if (prio.level === 'High') {
      maxLevel = 'High';
      break; 
    } else if (prio.level === 'Medium') {
      maxLevel = 'Medium';
    } else if (prio.level === 'Low' && maxLevel !== 'Medium') {
      maxLevel = 'Low';
    }
  }
  
  if (maxLevel === 'High') {
    return {
      level: "High",
      text: "HIGH RISK",
      colorClass: "bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-bold"
    };
  } else if (maxLevel === 'Medium') {
    return {
      level: "Medium",
      text: "MED RISK",
      colorClass: "bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold"
    };
  } else if (maxLevel === 'Low') {
    return {
      level: "Low",
      text: "LOW RISK",
      colorClass: "bg-sky-500/15 text-sky-400 border border-sky-500/25 text-[10px] font-bold"
    };
  }
  return null;
}

interface ScannerViewProps {
  products: Product[];
  partners: Partner[];
  scans: ScanJob[];
  onTriggerScan: (productId: string) => void;
  onClearHistory: () => void;
  isLoading: boolean;
  notifications?: NotificationAlert[];
  monitoringConfig?: MonitoringConfig;
  onTriggerSweep?: () => void;
  onClearNotifications?: () => void;
  onUpdateMonitoringConfig?: (enabled: boolean, intervalMinutes: number) => void;
}

export default function ScannerView({ 
  products, 
  partners, 
  scans, 
  onTriggerScan, 
  onClearHistory, 
  isLoading,
  notifications = [],
  monitoringConfig = { enabled: true, intervalMinutes: 2, lastSweepTime: null, nextSweepTime: "" },
  onTriggerSweep,
  onClearNotifications,
  onUpdateMonitoringConfig
}: ScannerViewProps) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedScanJobId, setSelectedScanJobId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [channels, setChannels] = useState({
    amazon: true,
    googleShopping: true,
    walmart: true,
    ebay: true,
    searchEngines: true,
  });
  
  const [selectedViolation, setSelectedViolation] = useState<{
    productName: string;
    partnerName: string;
    partnerDomain: string;
    mapPrice: number;
    detectedPrice: number;
    detectedUrl: string;
    startedAt: string;
  } | null>(null);

  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [alertTypeFilter, setAlertTypeFilter] = useState<'all' | 'partner' | 'admin'>('all');

  const toggleChannel = (key: keyof typeof channels) => {
    setChannels(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDownloadCSV = (scanJob: ScanJob) => {
    const headers = ["Evidence ID", "Scan ID", "Timestamp", "SKU ID", "Product Name", "MAP Limit", "Partner Name", "Domain", "Listed Price", "Compliance Status", "Snippet Citation"];
    const rows = scanJob.items.map(item => [
      `EVD-${scanJob.id.slice(-6)}-${item.id.slice(-4)}`,
      scanJob.id,
      new Date(scanJob.startedAt).toISOString(),
      `PROD-${scanJob.productId}`,
      scanJob.productName,
      `$${scanJob.mapPrice}`,
      item.partnerName,
      item.partnerDomain,
      item.detectedPrice ? `$${item.detectedPrice}` : "N/A",
      item.status.toUpperCase(),
      item.snippet ? `"${item.snippet.replace(/"/g, '""')}"` : ""
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => {
        const str = String(cell);
        if (str.includes(",") || str.includes("\n") || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(","))
    ].join("\n");

    const getBrandPrefix = () => {
      try {
        const saved = localStorage.getItem("mapshield_whitelabel_config");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.brandName) return parsed.brandName.replace(/\s+/g, '-');
        }
      } catch (e) {}
      return "Cloudboy";
    };

    const prefix = getBrandPrefix();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${prefix}-Audit-Proof-${scanJob.productName.toLowerCase().replace(/\s+/g, '-')}-${scanJob.id}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkExportCSV = () => {
    // Find latest state for each partner x product combination to compute overall active violations
    const lastScanForEachProduct: { [productId: string]: ScanJob } = {};
    const sortedScans = [...scans].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    
    sortedScans.forEach(scan => {
      if (!lastScanForEachProduct[scan.productId]) {
        lastScanForEachProduct[scan.productId] = scan;
      }
    });

    const activeViolations: {
      violationId: string;
      productId: string;
      productName: string;
      mapPrice: number;
      partnerName: string;
      partnerDomain: string;
      detectedPrice: number;
      deviation: number;
      deviationPercent: string;
      severity: string;
      evidenceUrl: string;
      detectionTime: string;
    }[] = [];

    Object.values(lastScanForEachProduct).forEach(scan => {
      scan.items.forEach(item => {
        if (item.status === 'violating') {
          const dPrice = item.detectedPrice || 0;
          const diff = scan.mapPrice - dPrice;
          const deviation = diff > 0 ? diff : 0;
          const pct = scan.mapPrice > 0 ? Math.round((deviation / scan.mapPrice) * 100) : 0;
          
          const prioObj = getViolationPriority(scan.mapPrice, dPrice);
          const severity = prioObj ? prioObj.text : "Low Priority";

          activeViolations.push({
            violationId: `EVD-${scan.id.slice(-6)}-${item.id.slice(-4)}`,
            productId: `PROD-${scan.productId}`,
            productName: scan.productName,
            mapPrice: scan.mapPrice,
            partnerName: item.partnerName,
            partnerDomain: item.partnerDomain,
            detectedPrice: dPrice,
            deviation: deviation,
            deviationPercent: `${pct}%`,
            severity: severity,
            evidenceUrl: item.detectedUrl || "N/A",
            detectionTime: new Date(scan.startedAt).toISOString(),
          });
        }
      });
    });

    if (activeViolations.length === 0) {
      alert("No active violations currently found across your monitored products and partners to export.");
      return;
    }

    const headers = [
      "Violation ID",
      "Product SKU/ID",
      "Product Name",
      "MAP Price Limit",
      "Partner Name",
      "Partner Domain",
      "Detected Violation Price",
      "Deviation Amount",
      "Deviation Percent",
      "Severity Level",
      "Evidence URL",
      "Detection Timestamp"
    ];

    const rows = activeViolations.map(v => [
      v.violationId,
      v.productId,
      v.productName,
      `$${v.mapPrice.toFixed(2)}`,
      v.partnerName,
      v.partnerDomain,
      v.detectedPrice ? `$${v.detectedPrice.toFixed(2)}` : "N/A",
      `$${v.deviation.toFixed(2)}`,
      v.deviationPercent,
      v.severity,
      v.evidenceUrl,
      v.detectionTime
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => {
        const str = String(cell);
        if (str.includes(",") || str.includes("\n") || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(","))
    ].join("\n");

    const getBrandPrefix = () => {
      try {
        const saved = localStorage.getItem("mapshield_whitelabel_config");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.brandName) return parsed.brandName.replace(/\s+/g, '-');
        }
      } catch (e) {}
      return "Cloudboy";
    };

    const prefix = getBrandPrefix();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${prefix}-All-Active-Violations-Bulk-Export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Set default product if available
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  const activeScan = scans.find(s => s.status === "running");
  
  // Set selected scan output details to the newest scan job upon load or update
  useEffect(() => {
    if (scans.length > 0 && !selectedScanJobId) {
      setSelectedScanJobId(scans[0].id);
    }
  }, [scans, selectedScanJobId]);

  const viewScan = scans.find(s => s.id === selectedScanJobId);

  const handleStartScan = () => {
    if (!selectedProductId) return;
    onTriggerScan(selectedProductId);
  };

  return (
    <div className="space-y-8" id="scanner-tab-container">
      {/* Configuration Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left pane: Dispatch Center */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 space-y-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-indigo-400" />
              Shield Dispatch
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Launch an active-channel Google Search Grounded audit scan sweep. The AI agent inspects partner listings to ensure pricing complies with current MAP parameters.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Scope Target SKU</label>
              <select 
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {products.length === 0 ? (
                  <option value="">No products registered</option>
                ) : (
                  products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (${p.mapPrice})</option>
                  ))
                )}
              </select>
            </div>

            {/* Cross-Channel selection */}
            <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono text-slate-350 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  Monitor Channels
                </label>
                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-mono font-bold">CROSS-CHANNEL</span>
              </div>
              
              <div className="space-y-2 pt-1">
                <button 
                  onClick={() => toggleChannel('amazon')}
                  className="w-full flex items-center justify-between text-xs text-slate-300 hover:text-white transition py-0.5"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                    Amazon Marketplace
                  </span>
                  {channels.amazon ? (
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                </button>

                <button 
                  onClick={() => toggleChannel('googleShopping')}
                  className="w-full flex items-center justify-between text-xs text-slate-300 hover:text-white transition py-0.5"
                >
                  <span className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-blue-400" />
                    Google Shopping Index
                  </span>
                  {channels.googleShopping ? (
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                </button>

                <button 
                  onClick={() => toggleChannel('walmart')}
                  className="w-full flex items-center justify-between text-xs text-slate-300 hover:text-white transition py-0.5"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-sky-450 text-indigo-400" />
                    Walmart Storefronts
                  </span>
                  {channels.walmart ? (
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                </button>

                <button 
                  onClick={() => toggleChannel('ebay')}
                  className="w-full flex items-center justify-between text-xs text-slate-300 hover:text-white transition py-0.5"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
                    eBay reseller listings
                  </span>
                  {channels.ebay ? (
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                </button>

                <button 
                  onClick={() => toggleChannel('searchEngines')}
                  className="w-full flex items-center justify-between text-xs text-slate-300 hover:text-white transition py-0.5"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    Web Search Engine crawling
                  </span>
                  {channels.searchEngines ? (
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                </button>
              </div>
            </div>

            <button
              disabled={isLoading || products.length === 0 || !Object.values(channels).some(Boolean)}
              onClick={handleStartScan}
              className="w-full py-3.5 px-4 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-800 disabled:text-slate-500 font-bold text-white rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-500/20 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running Channel Scans...
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4 animate-pulse" />
                  Trigger Scanner Sweep
                </>
              )}
            </button>
          </div>

          {/* Active Job Progress indicator */}
          {activeScan && (
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-3">
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest block font-bold animate-pulse">
                SCANNING CHANNELS ({partners.length} partners)
              </span>
              <p className="text-xs text-slate-300">
                Evaluating prices for <strong className="text-indigo-300 font-semibold">{activeScan.productName}</strong>. 
                {channels.amazon && " Crawling Amazon Marketplace listings."}
                {channels.googleShopping && " Correlating with Google Shopping Index results."}
                {channels.searchEngines && " Using grounded search crawlers."}
              </p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-full w-2/3 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}
        </div>

        {/* Right pane: Scan History Log list */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-400" />
                Historic Protection Audits
              </h2>
              {scans.length > 0 && (
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleBulkExportCSV}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1.5 cursor-pointer font-mono uppercase tracking-wider font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg shadow-[0_0_10px_rgba(16,185,129,0.05)] hover:bg-emerald-500/20 hover:border-emerald-500/30"
                    title="Export all active violations across all products and partners into a single CSV spreadsheet"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    Bulk Export
                  </button>
                  <button
                    onClick={onClearHistory}
                    className="text-xs text-slate-500 hover:text-red-400 transition flex items-center gap-1 cursor-pointer font-mono uppercase tracking-wider font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear History
                  </button>
                </div>
              )}
            </div>

            {scans.length > 0 && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  id="scanner-audit-search-input"
                  type="text"
                  placeholder="Search past scans by SKU name, ID or partner channels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 placeholder-slate-500 text-xs rounded-xl pl-10 pr-10 py-3 focus:outline-none transition font-sans"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[10px] font-mono text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            )}

            {scans.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <Radio className="w-12 h-12 text-slate-700 mx-auto" />
                <h3 className="font-semibold text-slate-300">No Audits Run Yet</h3>
                <p className="text-xs max-w-sm mx-auto">
                  Run a scan above to start retrieving instant pricing violations from e-commerce partner domains.
                </p>
              </div>
            ) : (() => {
              const query = searchQuery.toLowerCase().trim();
              const filteredScans = scans.filter(scan => {
                if (!query) return true;
                const matchesProductName = scan.productName.toLowerCase().includes(query);
                const matchesProductId = String(scan.productId).toLowerCase().includes(query);
                const matchesPartner = scan.items.some(item => 
                  item.partnerName.toLowerCase().includes(query) || 
                  item.partnerDomain.toLowerCase().includes(query)
                );
                return matchesProductName || matchesProductId || matchesPartner;
              });

              if (filteredScans.length === 0) {
                return (
                  <div className="text-center py-12 text-slate-500 space-y-2 bg-slate-950/30 rounded-xl border border-dashed border-slate-850">
                    <Search className="w-10 h-10 text-slate-700/40 mx-auto text-indigo-500/20" />
                    <h3 className="font-semibold text-slate-300 text-xs uppercase font-mono tracking-wide">No Matches Found</h3>
                    <p className="text-[11px] max-w-xs mx-auto text-slate-450">
                      We couldn't locate any audits for "<span className="text-slate-300 font-semibold">{searchQuery}</span>". Try another term.
                    </p>
                  </div>
                );
              }

              return (
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/80 pr-2">
                  {filteredScans.map(scan => {
                    const violationsCount = scan.items.filter(i => i.status === "violating").length;
                    const isSelected = selectedScanJobId === scan.id;
                    
                    return (
                      <div 
                        key={scan.id}
                        onClick={() => setSelectedScanJobId(scan.id)}
                        className={`p-3.5 flex items-center justify-between rounded-xl transition duration-150 cursor-pointer ${
                          isSelected ? "bg-slate-800/60 border border-slate-700" : "hover:bg-slate-800/20 border border-transparent"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-slate-200">{scan.productName}</h4>
                            <span className="text-[10px] font-mono text-slate-500">MAP: ${scan.mapPrice}</span>
                          </div>
                          <p className="text-xs text-slate-400 font-mono">
                            {new Date(scan.startedAt).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          {scan.status === "running" ? (
                            <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-mono border border-indigo-500/20">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Active
                            </span>
                          ) : scan.status === "completed" ? (
                            <div className="flex items-center gap-2">
                              {violationsCount > 0 ? (
                                <>
                                  {(() => {
                                    const maxPrio = getScanMaxPriority(scan);
                                    if (!maxPrio) return null;
                                    return (
                                      <span className={`px-2 py-0.5 rounded-lg border text-[10px] uppercase font-bold tracking-wider font-mono ${maxPrio.colorClass}`}>
                                        {maxPrio.level} Risk
                                      </span>
                                    );
                                  })()}
                                  <span className="bg-red-500/10 text-red-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-mono border border-red-500/20 font-semibold">
                                    <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                                    {violationsCount} Breech{violationsCount > 1 ? "es" : ""}
                                  </span>
                                </>
                              ) : (
                                <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-mono border border-emerald-500/20 font-semibold">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Compliant
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="bg-slate-800 text-slate-400 text-xs px-2.5 py-1 rounded-full font-mono">
                              Failed
                            </span>
                          )}
                          <Eye className="w-4 h-4 text-slate-500" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Continuous Monitoring & Live Alerts Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="continuous-monitoring-console">
        
        {/* Left Column: Daemon Management */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 space-y-6 shadow-sm">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                MAP Guard Daemon
              </h3>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${monitoringConfig.enabled ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`}></span>
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                  {monitoringConfig.enabled ? "ACTIVE" : "STANDBY"}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated background sweep system. Actively monitors reseller listings to ensure catalog-wide MAP adherence and dispatches notices instantly.
            </p>
          </div>

          <div className="space-y-4">
            {/* Toggle Continuous Sweeping */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <div>
                <label className="block text-xs font-semibold text-slate-200">Continuous Auditing</label>
                <span className="text-[10px] text-slate-500 font-mono">Run automated sweep cycles</span>
              </div>
              <button
                type="button"
                onClick={() => onUpdateMonitoringConfig?.(!monitoringConfig.enabled, monitoringConfig.intervalMinutes)}
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${monitoringConfig.enabled ? "bg-indigo-500" : "bg-slate-800"}`}
                style={{ backgroundColor: monitoringConfig.enabled ? '#6366f1' : '#1e293b' }}
              >
                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${monitoringConfig.enabled ? "translate-x-5" : "translate-x-0"}`}></span>
              </button>
            </div>

            {/* Interval Configuration */}
            {monitoringConfig.enabled && (
              <div className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  Audit Cycle Frequency
                </label>
                <div className="grid grid-cols-4 gap-2 pt-1.5">
                  {[
                    { label: "2 Min", val: 2, desc: "Demo Speed" },
                    { label: "15 Min", val: 15, desc: "Fast" },
                    { label: "1 Hour", val: 60, desc: "Standard" },
                    { label: "Daily", val: 1440, desc: "Unilateral" }
                  ].map(opt => {
                    const isSelected = monitoringConfig.intervalMinutes === opt.val;
                    return (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => onUpdateMonitoringConfig?.(monitoringConfig.enabled, opt.val)}
                        className={`p-2 rounded-lg text-center border transition flex flex-col items-center justify-center cursor-pointer ${
                          isSelected 
                            ? "bg-indigo-500/10 border-indigo-500 text-indigo-400 font-bold text-xs" 
                            : "bg-slate-950 border-slate-800 hover:bg-slate-850 text-slate-400 text-xs font-normal"
                        }`}
                      >
                        <span className="text-xs font-mono">{opt.label}</span>
                        <span className="text-[8px] opacity-70 font-sans tracking-tight">{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Status Card & Times */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/85 font-mono text-[11px] space-y-2.5 text-slate-400">
              <div className="flex justify-between items-center">
                <span>Last Sweep Executed:</span>
                <span className="text-slate-200 font-semibold font-sans">
                  {monitoringConfig.lastSweepTime ? new Date(monitoringConfig.lastSweepTime).toLocaleTimeString() : "Never"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Next Scheduled Sweep:</span>
                <span className="text-indigo-400 font-bold font-sans animate-pulse">
                  {monitoringConfig.enabled && monitoringConfig.nextSweepTime 
                    ? new Date(monitoringConfig.nextSweepTime).toLocaleTimeString() 
                    : "Suspended"}
                </span>
              </div>
            </div>

            {/* Trigger On-Demand Sweep */}
            <button
              onClick={() => onTriggerSweep?.()}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold text-xs tracking-wide shadow-lg hover:shadow-indigo-500/10 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Play className="w-4 h-4 fill-current text-white" />
              )}
              {isLoading ? "Running Global Audit..." : "Execute Sweep & Send Notices"}
            </button>
          </div>
        </div>

        {/* Right Columns: Outbox Notifications Log */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 flex flex-col shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-400" />
                Live Dispatched Alerts
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Formal Cease & Desist warning dispatches and administrator security reports sent to partners.
              </p>
            </div>
            
            {notifications.length > 0 && (
              <button
                onClick={onClearNotifications}
                className="text-[10px] text-slate-500 hover:text-red-400 transition font-mono uppercase tracking-wider font-semibold self-start sm:self-center flex items-center gap-1 cursor-pointer border border-slate-800 hover:border-red-500/20 px-2.5 py-1.5 rounded-lg"
              >
                <Trash2 className="w-3" />
                Clear Dispatches
              </button>
            )}
          </div>

          {/* Filtering Tabs */}
          <div className="flex border-b border-slate-800/80 gap-4">
            {[
              { id: "all", label: `All Alerts (${notifications.length})` },
              { id: "partner", label: `Reseller Warnings (${notifications.filter(a => a.recipientType === "partner").length})` },
              { id: "admin", label: `Admin Alerts (${notifications.filter(a => a.recipientType === "admin").length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setAlertTypeFilter(tab.id as any)}
                className={`pb-2.5 text-xs font-semibold border-b-2 transition font-sans cursor-pointer ${
                  alertTypeFilter === tab.id 
                    ? "border-indigo-500 text-indigo-400 font-bold" 
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Alerts Timeline */}
          <div className="flex-1 max-h-[340px] overflow-y-auto pr-1 space-y-3 scrollbar-thin">
            {(() => {
              const filtered = notifications.filter(alert => {
                if (alertTypeFilter === 'all') return true;
                return alert.recipientType === alertTypeFilter;
              });

              if (filtered.length === 0) {
                return (
                  <div className="text-center py-12 text-slate-500 space-y-2">
                    <Mail className="w-10 h-10 text-slate-800 mx-auto" />
                    <h4 className="text-xs font-semibold text-slate-400">No Dispatches Logged</h4>
                    <p className="text-[11px] max-w-sm mx-auto text-slate-500">
                      When pricing violations are found during sweeps, formal warning letters and administrator reports are logged here.
                    </p>
                  </div>
                );
              }

              return filtered.map(alert => {
                const isExpanded = expandedAlertId === alert.id;
                const isPartner = alert.recipientType === 'partner';
                
                return (
                  <div 
                    key={alert.id}
                    className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 hover:border-slate-800 transition duration-150 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border font-mono ${
                            isPartner 
                              ? "bg-amber-500/5 text-amber-400 border-amber-500/20" 
                              : "bg-indigo-500/5 text-indigo-400 border-indigo-500/20"
                          }`}>
                            {isPartner ? "Reseller Warning Notice" : "Admin Compliance Alert"}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(alert.sentAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-200">{alert.subject}</h4>
                        <p className="text-[11px] text-slate-400">
                          Recipient: <span className="text-slate-300 font-mono font-bold">{alert.recipientEmail}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 font-mono">
                          <Check className="w-3 h-3" />
                          Delivered
                        </span>
                        <button
                          onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                          className="p-1.5 hover:bg-slate-800/60 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 bg-slate-950 border border-slate-850 rounded-lg font-mono text-[11px] text-slate-300 leading-relaxed overflow-x-auto max-h-56 scrollbar-thin whitespace-pre-wrap">
                        <div className="border-b border-slate-850 pb-2 mb-3 text-[10px] text-slate-500 space-y-1">
                          <div><strong className="text-slate-400">From:</strong> Brand Compliance Office &lt;noreply@mapshield.io&gt;</div>
                          <div><strong className="text-slate-400">To:</strong> {alert.recipientEmail}</div>
                          <div><strong className="text-slate-400">Subject:</strong> {alert.subject}</div>
                          <div><strong className="text-slate-400">Date:</strong> {new Date(alert.sentAt).toLocaleString()}</div>
                        </div>
                        {alert.body}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Sweep Details section */}
      {viewScan && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 space-y-6 shadow-sm">
          <div className="border-b border-slate-800/80 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-semibold">Shield Audit Report</span>
                <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 rounded font-mono text-indigo-400 font-medium">REALTIME EVIDENCE INSURED</span>
              </div>
              <h2 className="text-xl font-bold font-display text-white">
                Audits: {viewScan.productName}
              </h2>
              <p className="text-xs text-slate-400">
                Initiated values comparison sweep of {viewScan.items.length} reseller target links.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 font-mono text-xs">
              <div className="space-y-1 text-slate-400 text-right">
                <div>Catalog SKU: <span className="text-slate-200 font-bold">PROD-{viewScan.productId}</span></div>
                <div>Min MAP Bound: <span className="text-emerald-400 font-bold">${viewScan.mapPrice}</span></div>
              </div>
              
              <button
                onClick={() => handleDownloadCSV(viewScan)}
                className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold font-sans transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                Export Audit Report (CSV)
              </button>
            </div>
          </div>

          {/* AI Search & Grounding Transparency Log */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850/80 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-850/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-sans">AI Search Queries & Grounding Sources</h3>
                  <p className="text-[10px] text-slate-500 font-mono">Detailed audit trail of model query formulations and active online indexes</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                GOOGLE SEARCH GROUNDING ACTIVE
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Queries Log List */}
              <div className="lg:col-span-2 space-y-3">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-extrabold">Formulated Search Grounding Queries</span>
                <div className="space-y-2.5 max-h-56 overflow-y-auto scrollbar-thin pr-1">
                  {viewScan.items.map((item, idx) => {
                    const query = `site:${item.partnerDomain} "${viewScan.productName}" OR "${viewScan.productId}" price`;
                    return (
                      <div key={item.id} className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-indigo-400 font-mono font-bold">Query #{idx + 1} • {item.partnerName}</span>
                          <span className="text-[9px] bg-slate-950 border border-slate-850/80 text-slate-400 px-1.5 py-0.5 rounded font-mono font-medium">INDEX COUPLING: RESOLVED</span>
                        </div>
                        <div className="font-mono text-xs text-slate-300 bg-slate-950/80 p-2.5 rounded-lg border border-slate-850/60 break-all select-all">
                          {query}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Data Sources and Grounding Indices Pane */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-extrabold">Active Reseller Indexes</span>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    This automated scan dynamically coupled search parameters across multiple retail indexes to verify pricing coordinates:
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-850 rounded-xl text-xs">
                    <span className="flex items-center gap-2 text-slate-300">
                      <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                      Amazon Marketplace
                    </span>
                    <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0">Checked</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-850 rounded-xl text-xs">
                    <span className="flex items-center gap-2 text-slate-300">
                      <Search className="w-3.5 h-3.5 text-blue-400" />
                      Google Shopping Index
                    </span>
                    <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0">Active</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-850 rounded-xl text-xs">
                    <span className="flex items-center gap-2 text-slate-300">
                      <Globe className="w-3.5 h-3.5 text-indigo-400" />
                      Walmart Storefronts
                    </span>
                    <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0">Evaluated</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-850 rounded-xl text-xs">
                    <span className="flex items-center gap-2 text-slate-300">
                      <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
                      eBay seller listings
                    </span>
                    <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0">Crawled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* List of checked partners */}
          <div className="divide-y divide-slate-800/80">
            {viewScan.items.map(item => {
              const isViolating = item.status === "violating";
              const isCompliant = item.status === "compliant";
              const isNotFound = item.status === "not_found";

              return (
                <div key={item.id} className="py-5 flex flex-col md:flex-row justify-between gap-6">
                  {/* Partner overview */}
                  <div className="space-y-2 max-w-xl flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-slate-200 text-base">{item.partnerName}</h3>
                      <span className="text-xs font-mono text-slate-500">({item.partnerDomain})</span>
                      {isViolating && (() => {
                        const priority = getViolationPriority(viewScan.mapPrice, item.detectedPrice);
                        if (!priority) return null;
                        return (
                          <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1 ${priority.colorClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${priority.bgDot} animate-pulse`}></span>
                            {priority.text}
                          </span>
                        );
                      })()}
                    </div>
                    {item.snippet && (
                      <p className="text-xs text-slate-400 italic bg-slate-950 p-3 rounded-xl border border-slate-800/60 leading-relaxed font-mono">
                        "{item.snippet}"
                      </p>
                    )}
                  </div>

                  {/* Pricing and status action */}
                  <div className="flex md:flex-col items-end justify-between md:justify-center gap-4 shrink-0">
                    <div className="text-right">
                      {isNotFound ? (
                        <div className="space-y-0.5">
                          <span className="block text-[10px] font-mono text-slate-500 uppercase">Status</span>
                          <span className="text-xs font-semibold text-slate-400 bg-slate-850 px-2 py-1 rounded border border-slate-800">
                            UNABLE TO LOCATE
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="block text-[10px] font-mono text-slate-500 uppercase font-medium">Advertised Price</span>
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className={`text-lg font-bold font-display ${isViolating ? "text-red-400" : "text-emerald-400"}`}>
                              {item.detectedPrice ? `$${item.detectedPrice.toFixed(2)}` : "None"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      {isCompliant && (
                        <span className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1.5 rounded-xl border border-emerald-500/25 font-semibold flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" />
                          COMPLIANT
                        </span>
                      )}
                      {isViolating && (
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2.5">
                          {(() => {
                            const priority = getViolationPriority(viewScan.mapPrice, item.detectedPrice);
                            if (!priority) return null;
                            return (
                              <span className={`text-[10px] px-2 py-1 rounded-lg border font-semibold font-mono tracking-wide ${priority.colorClass}`}>
                                {priority.description}
                              </span>
                            );
                          })()}
                          <button
                            onClick={() => setSelectedViolation({
                              productName: viewScan.productName,
                              partnerName: item.partnerName,
                              partnerDomain: item.partnerDomain,
                              mapPrice: viewScan.mapPrice,
                              detectedPrice: item.detectedPrice || 0,
                              detectedUrl: item.detectedUrl || "#",
                              startedAt: viewScan.startedAt
                            })}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/20 text-xs font-semibold font-mono transition cursor-pointer rounded-xl"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            View Screenshot
                          </button>
                          <span className="bg-red-500/10 text-red-400 text-xs px-3 py-1.5 rounded-xl border border-red-500/25 font-semibold flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                            MAP VIOLATION
                          </span>
                        </div>
                      )}
                      {isNotFound && (
                        <span className="bg-slate-700/10 text-slate-400 text-xs px-3 py-1.5 rounded-xl border border-slate-700/25 font-semibold flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5" />
                          SKU MISSING
                        </span>
                      )}
                      {item.status === 'error' && (
                        <span className="bg-amber-500/10 text-amber-400 text-xs px-3 py-1.5 rounded-xl border border-amber-500/25 font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          SCAN ERROR
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedViolation && (
        <ViolationScreenshot
          product={selectedViolation.productName}
          partner={selectedViolation.partnerName}
          domain={selectedViolation.partnerDomain}
          mapPrice={selectedViolation.mapPrice}
          detectedPrice={selectedViolation.detectedPrice}
          url={selectedViolation.detectedUrl}
          timestamp={selectedViolation.startedAt}
          onClose={() => setSelectedViolation(null)}
        />
      )}
    </div>
  );
}
