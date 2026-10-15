import React, { useState, useMemo } from "react";
import { Product, Partner, ScanJob } from "../types";
import {
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Calendar,
  DollarSign,
  TrendingDown,
  Filter,
  ArrowUpDown,
  History,
  Store,
  Mail,
  ChevronDown,
  ChevronUp,
  Tag,
  Clock,
  Zap,
  Flag,
  Flame,
  AlertCircle
} from "lucide-react";

export interface BreachTimelineEntry {
  id: string;
  scanId: string;
  timestamp: string;
  date: Date;
  partnerId: string;
  partnerName: string;
  partnerDomain: string;
  detectedPrice: number;
  mapPrice: number;
  discountAmount: number;
  discountPercent: number;
  detectedUrl?: string | null;
  snippet?: string | null;
  channel?: string;
  isFirstSkuInfraction: boolean;
  isFirstPartnerInfraction: boolean;
  partnerOccurrenceCount: number;
  skuOccurrenceCount: number;
  isSample?: boolean;
}

interface SkuBreachTimelineProps {
  product?: Product | null;
  scans?: ScanJob[];
  partners?: Partner[];
  violationsOverride?: any[];
  onInitiateWarning?: (product: Product, violation: any) => void;
  className?: string;
  showSummaryStats?: boolean;
  compact?: boolean;
}

export default function SkuBreachTimeline({
  product,
  scans = [],
  partners = [],
  violationsOverride,
  onInitiateWarning,
  className = "",
  showSummaryStats = true,
  compact = false
}: SkuBreachTimelineProps) {
  const [filterType, setFilterType] = useState<"all" | "first" | "recurring">("all");
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [expandedSnippetId, setExpandedSnippetId] = useState<string | null>(null);

  const productMapPrice = product?.mapPrice ?? 199.99;
  const productId = product?.id ?? "default-sku";
  const productSku = product?.sku ?? "SKU-PROT";
  const productName = product?.name ?? "Protected Product";

  // Extract all violations for this SKU across all scans
  const breachEntries = useMemo<BreachTimelineEntry[]>(() => {
    let rawList: Array<{
      id: string;
      scanId: string;
      timestamp: string;
      date: Date;
      partnerId: string;
      partnerName: string;
      partnerDomain: string;
      detectedPrice: number;
      mapPrice: number;
      discountAmount: number;
      discountPercent: number;
      detectedUrl?: string | null;
      snippet?: string | null;
      channel?: string;
    }> = [];

    if (violationsOverride && violationsOverride.length > 0) {
      rawList = violationsOverride.map((v, idx) => {
        const detPrice = Number(v.detectedPrice) || (productMapPrice * 0.85);
        const mapP = Number(v.mapPrice) || Number(productMapPrice) || 100;
        const discountAmt = Math.max(0, mapP - detPrice);
        const discountPct = mapP > 0 ? (discountAmt / mapP) * 100 : 0;
        const scanTimestamp = v.scanDate || v.startedAt || new Date(Date.now() - (idx + 1) * 86400000 * 3).toISOString();

        return {
          id: v.id || `viol-override-${idx}`,
          scanId: v.scanId || `scan-${idx}`,
          timestamp: scanTimestamp,
          date: new Date(scanTimestamp),
          partnerId: v.partnerId || `partner-${idx}`,
          partnerName: v.partnerName || v.partnerDomain || "Online Reseller",
          partnerDomain: v.partnerDomain || "marketplace.com",
          detectedPrice: detPrice,
          mapPrice: mapP,
          discountAmount: discountAmt,
          discountPercent: discountPct,
          detectedUrl: v.detectedUrl || null,
          snippet: v.snippet || null,
          channel: v.channel || (v.detectedUrl?.includes("amazon") ? "Amazon Marketplace" : v.detectedUrl?.includes("google") ? "Google Shopping" : "Partner Storefront")
        };
      });
    } else {
      // Find all completed/historical scans matching this product
      const productScans = scans.filter(s => 
        (product?.id && s.productId === product.id) || 
        (product?.name && s.productName === product.name)
      );

      productScans.forEach(scan => {
        const scanTimestamp = scan.startedAt || new Date().toISOString();
        const mapP = scan.mapPrice || productMapPrice || 100;

        (scan.items || []).forEach(item => {
          if (item.status === 'violating' && item.detectedPrice !== null && item.detectedPrice < mapP) {
            const detPrice = item.detectedPrice;
            const discountAmt = mapP - detPrice;
            const discountPct = (discountAmt / mapP) * 100;

            rawList.push({
              id: item.id || `item-${scan.id}-${item.partnerId}`,
              scanId: scan.id,
              timestamp: scanTimestamp,
              date: new Date(scanTimestamp),
              partnerId: item.partnerId || item.partnerDomain,
              partnerName: item.partnerName || item.partnerDomain || "Authorized Reseller",
              partnerDomain: item.partnerDomain || "reseller.com",
              detectedPrice: detPrice,
              mapPrice: mapP,
              discountAmount: discountAmt,
              discountPercent: discountPct,
              detectedUrl: item.detectedUrl,
              snippet: item.snippet,
              channel: item.detectedUrl?.includes("amazon") 
                ? "Amazon Marketplace" 
                : item.detectedUrl?.includes("google") 
                  ? "Google Shopping" 
                  : item.detectedUrl?.includes("walmart")
                    ? "Walmart Store"
                    : "Direct eCommerce"
            });
          }
        });
      });
    }

    // If no real violations exist yet for this SKU, generate a realistic 3-step timeline demonstration
    let isSampleTimeline = false;
    if (rawList.length === 0) {
      isSampleTimeline = true;
      const baseMap = productMapPrice || 199.99;
      const nowMs = Date.now();

      rawList = [
        {
          id: `sample-viol-1-${productId}`,
          scanId: "scan-sample-101",
          timestamp: new Date(nowMs - 21 * 86400000).toISOString(),
          date: new Date(nowMs - 21 * 86400000),
          partnerId: "p-techmart",
          partnerName: "TechMart Direct",
          partnerDomain: "techmart.com",
          detectedPrice: Math.round(baseMap * 0.88 * 100) / 100,
          mapPrice: baseMap,
          discountAmount: Math.round((baseMap - baseMap * 0.88) * 100) / 100,
          discountPercent: 12.0,
          detectedUrl: "https://techmart.com/listing/" + encodeURIComponent(productSku),
          snippet: `Exclusive promotion for ${productName} at reduced rate with free shipping.`,
          channel: "Google Shopping"
        },
        {
          id: `sample-viol-2-${productId}`,
          scanId: "scan-sample-102",
          timestamp: new Date(nowMs - 14 * 86400000).toISOString(),
          date: new Date(nowMs - 14 * 86400000),
          partnerId: "p-techmart",
          partnerName: "TechMart Direct",
          partnerDomain: "techmart.com",
          detectedPrice: Math.round(baseMap * 0.82 * 100) / 100,
          mapPrice: baseMap,
          discountAmount: Math.round((baseMap - baseMap * 0.82) * 100) / 100,
          discountPercent: 18.0,
          detectedUrl: "https://techmart.com/sale/" + encodeURIComponent(productSku),
          snippet: `Flash Weekend deal! ${productSku} dropped to undercut standard MAP threshold.`,
          channel: "Partner Storefront"
        },
        {
          id: `sample-viol-3-${productId}`,
          scanId: "scan-sample-103",
          timestamp: new Date(nowMs - 6 * 86400000).toISOString(),
          date: new Date(nowMs - 6 * 86400000),
          partnerId: "p-apexgear",
          partnerName: "Apex Electronics Hub",
          partnerDomain: "apexgear.io",
          detectedPrice: Math.round(baseMap * 0.85 * 100) / 100,
          mapPrice: baseMap,
          discountAmount: Math.round((baseMap - baseMap * 0.85) * 100) / 100,
          discountPercent: 15.0,
          detectedUrl: "https://apexgear.io/catalog/" + encodeURIComponent(productSku),
          snippet: `Limited stock liquidation on ${productName} below minimum policy price.`,
          channel: "Amazon Marketplace"
        },
        {
          id: `sample-viol-4-${productId}`,
          scanId: "scan-sample-104",
          timestamp: new Date(nowMs - 2 * 86400000).toISOString(),
          date: new Date(nowMs - 2 * 86400000),
          partnerId: "p-techmart",
          partnerName: "TechMart Direct",
          partnerDomain: "techmart.com",
          detectedPrice: Math.round(baseMap * 0.79 * 100) / 100,
          mapPrice: baseMap,
          discountAmount: Math.round((baseMap - baseMap * 0.79) * 100) / 100,
          discountPercent: 21.0,
          detectedUrl: "https://techmart.com/deals/" + encodeURIComponent(productSku),
          snippet: `Unapproved cart discount applied at checkout for SKU ${productSku}.`,
          channel: "Google Shopping"
        }
      ];
    }

    // Sort chronologically (oldest first) to accurately determine "First Infraction" vs "Recurring Breach"
    const chronological = [...rawList].sort((a, b) => a.date.getTime() - b.date.getTime());

    const partnerSeenCounts: { [partnerKey: string]: number } = {};
    let globalSkuCount = 0;

    const mappedTimeline: BreachTimelineEntry[] = chronological.map((item, index) => {
      globalSkuCount += 1;
      const partnerKey = item.partnerId || item.partnerDomain || item.partnerName;
      partnerSeenCounts[partnerKey] = (partnerSeenCounts[partnerKey] || 0) + 1;

      const isFirstSkuInfraction = index === 0;
      const isFirstPartnerInfraction = partnerSeenCounts[partnerKey] === 1;

      return {
        ...item,
        isFirstSkuInfraction,
        isFirstPartnerInfraction,
        partnerOccurrenceCount: partnerSeenCounts[partnerKey],
        skuOccurrenceCount: globalSkuCount,
        isSample: isSampleTimeline
      };
    });

    return mappedTimeline;
  }, [product, scans, violationsOverride]);

  // Unique partners present in the breach history
  const uniquePartners = useMemo(() => {
    const map = new Map<string, string>();
    breachEntries.forEach(entry => {
      map.set(entry.partnerDomain, entry.partnerName);
    });
    return Array.from(map.entries()).map(([domain, name]) => ({ domain, name }));
  }, [breachEntries]);

  // Summary Metrics calculations
  const metrics = useMemo(() => {
    const totalBreaches = breachEntries.length;
    const firstInfractions = breachEntries.filter(b => b.isFirstSkuInfraction || b.isFirstPartnerInfraction).length;
    const recurringBreaches = breachEntries.filter(b => !b.isFirstSkuInfraction && !b.isFirstPartnerInfraction).length;
    const maxDiscountPct = totalBreaches > 0 ? Math.max(...breachEntries.map(b => b.discountPercent)) : 0;
    const maxDiscountAmt = totalBreaches > 0 ? Math.max(...breachEntries.map(b => b.discountAmount)) : 0;
    
    // Partner with most violations
    const partnerFreq: { [key: string]: { name: string; count: number } } = {};
    breachEntries.forEach(b => {
      if (!partnerFreq[b.partnerDomain]) {
        partnerFreq[b.partnerDomain] = { name: b.partnerName, count: 0 };
      }
      partnerFreq[b.partnerDomain].count += 1;
    });

    let worstOffender = { name: "None", count: 0 };
    Object.values(partnerFreq).forEach(p => {
      if (p.count > worstOffender.count) {
        worstOffender = p;
      }
    });

    const firstIncidentDate = totalBreaches > 0 ? breachEntries[0].date : null;
    const latestIncidentDate = totalBreaches > 0 ? breachEntries[breachEntries.length - 1].date : null;

    return {
      totalBreaches,
      firstInfractions,
      recurringBreaches,
      maxDiscountPct,
      maxDiscountAmt,
      worstOffender,
      firstIncidentDate,
      latestIncidentDate,
      isSample: breachEntries[0]?.isSample ?? false
    };
  }, [breachEntries]);

  // Filter and sort the displayed entries
  const filteredAndSortedEntries = useMemo(() => {
    let result = [...breachEntries];

    // Filter by type: first infraction vs recurring
    if (filterType === "first") {
      result = result.filter(b => b.isFirstSkuInfraction || b.isFirstPartnerInfraction);
    } else if (filterType === "recurring") {
      result = result.filter(b => !b.isFirstSkuInfraction && !b.isFirstPartnerInfraction);
    }

    // Filter by partner
    if (selectedPartnerFilter !== "all") {
      result = result.filter(b => b.partnerDomain === selectedPartnerFilter);
    }

    // Sort order
    if (sortOrder === "newest") {
      result.sort((a, b) => b.date.getTime() - a.date.getTime());
    } else {
      result.sort((a, b) => a.date.getTime() - b.date.getTime());
    }

    return result;
  }, [breachEntries, filterType, selectedPartnerFilter, sortOrder]);

  return (
    <div className={`space-y-4 pt-4 border-t border-zinc-850 ${className}`} id={`breach-timeline-${productId}`}>
      {/* Header & Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/70 p-4 rounded-xl border border-zinc-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-rose-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              Breach Timeline
            </span>
            <span className="text-[9px] bg-rose-950/60 border border-rose-800/60 text-rose-300 px-2 py-0.5 rounded-full font-mono font-bold">
              {metrics.totalBreaches} {metrics.totalBreaches === 1 ? "Incident" : "Incidents"} Recorded
            </span>
            {metrics.isSample && (
              <span className="text-[9px] bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Live Demo Matrix
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
            Violation History &amp; Recurrence Ledger for {productSku}
          </h3>
          <p className="text-[11px] text-slate-400">
            Chronological audit trail distinguishing initial policy infractions from persistent recurring price breaches.
          </p>
        </div>

        {/* Legend / Key Badges */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono shrink-0">
          <div className="flex items-center gap-1.5 bg-amber-950/40 border border-amber-600/40 px-2.5 py-1 rounded-lg text-amber-300">
            <Flag className="w-3 h-3 text-amber-400" />
            <span className="font-bold">First Infraction Detected</span>
          </div>
          <div className="flex items-center gap-1.5 bg-rose-950/50 border border-rose-600/50 px-2.5 py-1 rounded-lg text-rose-300">
            <RotateCcw className="w-3 h-3 text-rose-400" />
            <span className="font-bold">Recurring Breach</span>
          </div>
        </div>
      </div>

      {/* Summary KPI Ribbon */}
      {showSummaryStats && metrics.totalBreaches > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl space-y-1">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">First Recorded</span>
            <div className="text-xs font-bold text-amber-400 font-mono truncate">
              {metrics.firstIncidentDate ? metrics.firstIncidentDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "None"}
            </div>
            <span className="text-[9px] text-slate-500 block truncate">
              Initial SKU Infraction
            </span>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl space-y-1">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Recurring Offenses</span>
            <div className="text-xs font-bold text-rose-400 font-mono">
              {metrics.recurringBreaches} Repeated Events
            </div>
            <span className="text-[9px] text-slate-500 block">
              {metrics.recurringBreaches > 0 ? "Requires automated escalation" : "No repeat infractions"}
            </span>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl space-y-1">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Max Price Deficit</span>
            <div className="text-xs font-bold text-red-400 font-mono">
              -${metrics.maxDiscountAmt.toFixed(2)} (-{metrics.maxDiscountPct.toFixed(1)}%)
            </div>
            <span className="text-[9px] text-slate-500 block">
              Below ${productMapPrice.toFixed(2)} MAP floor
            </span>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl space-y-1">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Top Offending Reseller</span>
            <div className="text-xs font-bold text-slate-200 truncate" title={metrics.worstOffender.name}>
              {metrics.worstOffender.name}
            </div>
            <span className="text-[9px] text-rose-400 font-mono block">
              {metrics.worstOffender.count} {metrics.worstOffender.count === 1 ? "breach" : "breaches"} flagged
            </span>
          </div>
        </div>
      )}

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-indigo-400" />
            Filter:
          </span>
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
              filterType === "all"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-zinc-900 text-slate-400 hover:text-white border border-zinc-800"
            }`}
          >
            All ({metrics.totalBreaches})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("first")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1 ${
              filterType === "first"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-zinc-900 text-amber-400/80 hover:text-amber-300 border border-zinc-800"
            }`}
          >
            <Flag className="w-2.5 h-2.5" />
            First Infractions ({metrics.firstInfractions})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("recurring")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1 ${
              filterType === "recurring"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-zinc-900 text-rose-400/80 hover:text-rose-300 border border-zinc-800"
            }`}
          >
            <RotateCcw className="w-2.5 h-2.5" />
            Recurring ({metrics.recurringBreaches})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Partner dropdown */}
          {uniquePartners.length > 1 && (
            <select
              value={selectedPartnerFilter}
              onChange={(e) => setSelectedPartnerFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-750 text-slate-300 text-[10px] rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer font-mono"
            >
              <option value="all">All Resellers ({uniquePartners.length})</option>
              {uniquePartners.map(p => (
                <option key={p.domain} value={p.domain}>{p.name}</option>
              ))}
            </select>
          )}

          {/* Sort order toggle */}
          <button
            type="button"
            onClick={() => setSortOrder(prev => prev === "newest" ? "oldest" : "newest")}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-slate-300 border border-zinc-750 rounded-lg text-[10px] font-mono cursor-pointer transition"
          >
            <ArrowUpDown className="w-3 h-3 text-indigo-400" />
            <span>{sortOrder === "newest" ? "Newest First" : "Oldest First"}</span>
          </button>
        </div>
      </div>

      {/* Visual Timeline Track */}
      {filteredAndSortedEntries.length === 0 ? (
        <div className="p-8 rounded-xl border border-dashed border-zinc-800 text-center bg-zinc-950/40 space-y-2">
          <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
          <p className="text-xs text-slate-300 font-bold">No Violations Found for Selected Filter</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Try selecting &quot;All&quot; filter or changing reseller selection to review historical infraction events.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-amber-500/60 before:via-rose-500/50 before:to-indigo-500/40">
          {filteredAndSortedEntries.map((entry, idx) => {
            const isInitial = entry.isFirstSkuInfraction || entry.isFirstPartnerInfraction;
            const isCritical = entry.discountPercent >= 15;
            const isExpanded = expandedSnippetId === entry.id;

            return (
              <div
                key={entry.id}
                className="relative group transition-all duration-200"
              >
                {/* Timeline Icon Node */}
                <div className={`absolute -left-6 sm:-left-8 top-3 -translate-x-1/2 flex items-center justify-center w-7 h-7 rounded-full border-2 shadow-lg transition-transform duration-200 group-hover:scale-110 ${
                  isInitial
                    ? "bg-amber-950 border-amber-400 text-amber-300 shadow-amber-950/40"
                    : isCritical
                      ? "bg-rose-950 border-rose-500 text-rose-300 shadow-rose-950/40"
                      : "bg-rose-950/80 border-rose-400/80 text-rose-300 shadow-rose-950/30"
                }`}>
                  {isInitial ? (
                    <Flag className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  )}
                </div>

                {/* Timeline Item Card */}
                <div className={`p-4 rounded-xl border transition-all duration-200 ${
                  isInitial
                    ? "bg-gradient-to-r from-amber-950/20 via-zinc-950/80 to-zinc-950/80 border-amber-600/30 hover:border-amber-500/50 shadow-sm"
                    : isCritical
                      ? "bg-gradient-to-r from-rose-950/25 via-zinc-950/80 to-zinc-950/80 border-rose-600/40 hover:border-rose-500/60 shadow-sm"
                      : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
                }`}>
                  {/* Top Bar: Infraction Badge, Recurrence Index, Timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-850/80 pb-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {isInitial ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <Flag className="w-3 h-3 text-amber-400 shrink-0" />
                          First Infraction Detected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          <RotateCcw className="w-3 h-3 text-rose-400 shrink-0" />
                          Recurring Breach
                          <span className="text-[9px] text-rose-400/80 font-normal">
                            (Partner Incident #{entry.partnerOccurrenceCount})
                          </span>
                        </span>
                      )}

                      {entry.channel && (
                        <span className="text-[9px] font-mono bg-zinc-900 border border-zinc-800 text-slate-400 px-2 py-0.5 rounded">
                          {entry.channel}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>
                        {entry.date.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </span>
                      <span>•</span>
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>
                        {entry.date.toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Body Content: Reseller info & Pricing deviation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Store className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="text-sm font-bold text-white font-display">
                          {entry.partnerName}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                        <span>Domain: <strong className="text-slate-300">{entry.partnerDomain}</strong></span>
                        <span>•</span>
                        <span>Scan #{entry.scanId.slice(-6)}</span>
                      </div>
                    </div>

                    {/* Price Violation Pill */}
                    <div className="flex flex-col sm:items-end justify-center space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[11px] font-mono text-slate-400">Detected:</span>
                        <span className="text-base font-bold font-mono text-rose-400">
                          ${entry.detectedPrice.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          (MAP: ${entry.mapPrice.toFixed(2)})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isCritical
                            ? "bg-red-950/80 text-red-300 border border-red-800/60"
                            : "bg-rose-950/60 text-rose-300 border border-rose-800/50"
                        }`}>
                          <TrendingDown className="w-2.5 h-2.5" />
                          -${entry.discountAmount.toFixed(2)} ({entry.discountPercent.toFixed(1)}% Deficit)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Captured Snippet Evidence */}
                  {entry.snippet && (
                    <div className="mt-3 pt-2.5 border-t border-zinc-850">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-slate-500" />
                          Captured Evidence Snippet:
                        </span>
                        {entry.snippet.length > 90 && (
                          <button
                            type="button"
                            onClick={() => setExpandedSnippetId(isExpanded ? null : entry.id)}
                            className="text-indigo-400 hover:text-indigo-300 cursor-pointer flex items-center gap-0.5"
                          >
                            {isExpanded ? "Show Less" : "Expand"}
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                      <p className={`text-[10px] font-mono bg-black/40 p-2 rounded-lg border border-zinc-850 text-slate-300 leading-relaxed ${
                        isExpanded ? "" : "line-clamp-2"
                      }`}>
                        &ldquo;{entry.snippet}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-zinc-850/80 text-[10px] font-mono">
                    <div className="flex items-center gap-2 text-slate-500">
                      <span>Status:</span>
                      <span className="text-rose-400 font-bold">Unreconciled Deficit</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {entry.detectedUrl && (
                        <a
                          href={entry.detectedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          referrerPolicy="no-referrer"
                          className="flex items-center gap-1 text-slate-400 hover:text-indigo-300 hover:underline cursor-pointer"
                        >
                          <span>Store URL</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      {onInitiateWarning && (
                        <button
                          type="button"
                          onClick={() => onInitiateWarning(product, entry)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 font-bold uppercase tracking-wider cursor-pointer transition"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Dispatch Warning</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
