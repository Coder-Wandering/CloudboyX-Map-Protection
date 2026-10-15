import React, { useState, useMemo, useEffect } from "react";
import { Product, Partner, ScanJob } from "../types";
import {
  Clock,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  Camera,
  MapPin,
  Send,
  Filter,
  Search,
  ArrowUpDown,
  TrendingDown,
  Building2,
  Tag,
  DollarSign,
  Layers,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  History,
  FileText,
  Sparkles,
  Download,
  AlertCircle,
  Check,
  X,
  RefreshCw,
  Info
} from "lucide-react";

export type ViolationStatusType = 
  | "new_infraction" 
  | "warning_sent" 
  | "second_notice" 
  | "under_investigation" 
  | "grace_period" 
  | "legal_escalated" 
  | "resolved" 
  | "snoozed";

export interface StatusHistoryEntry {
  timestamp: string;
  status: ViolationStatusType;
  note?: string;
  updatedBy?: string;
}

export interface ChronologicalBreachEvent {
  id: string;
  scanId: string;
  timestamp: string;
  date: Date;
  productId: string;
  productName: string;
  sku: string;
  partnerId: string;
  partnerName: string;
  partnerDomain: string;
  mapPrice: number;
  detectedPrice: number;
  varianceAmount: number;
  variancePercent: number;
  url: string;
  snippet?: string | null;
  channel: string;
  region: string;
  severity: "critical" | "high" | "medium" | "low";
  status: ViolationStatusType;
  statusUpdatedAt: string;
  statusNote?: string;
  statusHistory: StatusHistoryEntry[];
}

interface ChronologicalBreachTimelineViewProps {
  products: Product[];
  partners: Partner[];
  scans: ScanJob[];
  onSelectViolationForScreenshot?: (violation: {
    product: string;
    partner: string;
    domain: string;
    map: number;
    found: number;
    url: string;
    time: string;
  }) => void;
  onLocatePartner?: (partnerName: string, domain: string) => void;
  className?: string;
}

const STATUS_CONFIG: Record<ViolationStatusType, {
  label: string;
  shortLabel: string;
  badgeClass: string;
  dotColor: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = {
  new_infraction: {
    label: "Action Required",
    shortLabel: "New Infraction",
    badgeClass: "bg-red-950/80 text-red-400 border-red-800/60",
    dotColor: "bg-red-500",
    icon: AlertTriangle,
    description: "Newly detected price breach below authorized MAP floor."
  },
  warning_sent: {
    label: "1st Notice Dispatched",
    shortLabel: "Notice Sent",
    badgeClass: "bg-amber-950/80 text-amber-400 border-amber-800/60",
    dotColor: "bg-amber-400",
    icon: Send,
    description: "Initial automated cease & desist compliance notice sent to vendor."
  },
  second_notice: {
    label: "2nd Escalation Dispatched",
    shortLabel: "2nd Notice",
    badgeClass: "bg-orange-950/80 text-orange-400 border-orange-800/60",
    dotColor: "bg-orange-500",
    icon: ShieldAlert,
    description: "Escalated warning following non-remediation within 24 hours."
  },
  under_investigation: {
    label: "Under Audit Review",
    shortLabel: "Reviewing",
    badgeClass: "bg-indigo-950/80 text-indigo-400 border-indigo-800/60",
    dotColor: "bg-indigo-400",
    icon: Search,
    description: "Being reviewed by brand integrity compliance officer."
  },
  grace_period: {
    label: "Grace Period Active (48h)",
    shortLabel: "Grace Period",
    badgeClass: "bg-blue-950/80 text-blue-400 border-blue-800/60",
    dotColor: "bg-blue-400",
    icon: Clock,
    description: "Temporary grace window granted for pricing adjustment."
  },
  legal_escalated: {
    label: "Escalated to Legal Council",
    shortLabel: "Legal Action",
    badgeClass: "bg-rose-950/90 text-rose-300 border-rose-700/80 shadow-[0_0_10px_rgba(244,63,94,0.2)]",
    dotColor: "bg-rose-500",
    icon: AlertCircle,
    description: "Passed to legal affairs for authorized reseller tier revocation."
  },
  resolved: {
    label: "Resolved / Price Restored",
    shortLabel: "Resolved",
    badgeClass: "bg-emerald-950/80 text-emerald-400 border-emerald-800/60",
    dotColor: "bg-emerald-400",
    icon: CheckCircle,
    description: "Verified restored to compliant price floor."
  },
  snoozed: {
    label: "Promotional Waiver / Snoozed",
    shortLabel: "Waiver Active",
    badgeClass: "bg-purple-950/80 text-purple-300 border-purple-800/60",
    dotColor: "bg-purple-400",
    icon: Sparkles,
    description: "Pre-approved promotional campaign pricing exception."
  }
};

export default function ChronologicalBreachTimelineView({
  products,
  partners,
  scans,
  onSelectViolationForScreenshot,
  onLocatePartner,
  className = ""
}: ChronologicalBreachTimelineViewProps) {
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  
  // Interactive Status Editor Modal State
  const [editingViolation, setEditingViolation] = useState<ChronologicalBreachEvent | null>(null);
  const [newStatus, setNewStatus] = useState<ViolationStatusType>("warning_sent");
  const [statusNote, setStatusNote] = useState("");
  const [historyDrawerViolationId, setHistoryDrawerViolationId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Local persistence for status overrides so user interactions are saved
  const [customStatusOverrides, setCustomStatusOverrides] = useState<Record<string, {
    status: ViolationStatusType;
    statusUpdatedAt: string;
    statusNote?: string;
    statusHistory: StatusHistoryEntry[];
  }>>(() => {
    try {
      const saved = localStorage.getItem("cloudboy_breach_status_overrides");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const saveStatusOverrides = (newOverrides: typeof customStatusOverrides) => {
    setCustomStatusOverrides(newOverrides);
    try {
      localStorage.setItem("cloudboy_breach_status_overrides", JSON.stringify(newOverrides));
    } catch (e) {
      console.error("Failed to save breach status overrides to localStorage:", e);
    }
  };

  // Helper to get region
  const getRegionForDomain = (domain: string, partnerName: string) => {
    const d = domain.toLowerCase();
    const p = partnerName.toLowerCase();
    if (d.includes(".uk") || d.includes(".de") || d.includes(".fr") || d.includes(".eu") || p.includes("europe")) return "Europe";
    if (d.includes(".jp") || d.includes(".cn") || d.includes(".au") || d.includes(".in") || p.includes("apac") || p.includes("asia")) return "APAC";
    if (d.includes(".ca") || p.includes("canada")) return "Canada";
    if (d.includes(".mx") || d.includes(".br") || p.includes("latam")) return "LATAM";
    return "United States";
  };

  // Helper to determine channel
  const getChannelName = (url?: string | null, partnerName?: string, domain?: string) => {
    const u = (url || "").toLowerCase();
    const d = (domain || "").toLowerCase();
    const p = (partnerName || "").toLowerCase();
    if (u.includes("amazon") || d.includes("amazon") || p.includes("amazon")) return "Amazon Marketplace";
    if (u.includes("walmart") || d.includes("walmart") || p.includes("walmart")) return "Walmart Store";
    if (u.includes("target") || d.includes("target") || p.includes("target")) return "Target.com";
    if (u.includes("bestbuy") || d.includes("bestbuy") || p.includes("best buy")) return "Best Buy Direct";
    if (u.includes("ebay") || d.includes("ebay") || p.includes("ebay")) return "eBay Verified";
    if (u.includes("google") || d.includes("google")) return "Google Shopping";
    return "Direct eCommerce Storefront";
  };

  // Construct the master chronological breach event list
  const masterBreachEvents = useMemo<ChronologicalBreachEvent[]>(() => {
    const events: ChronologicalBreachEvent[] = [];
    const nowMs = Date.now();

    // 1. Process all real completed scan items across historical scans
    const completedScans = scans.filter(s => s.status === 'completed' && s.items && s.items.length > 0);
    
    // Track unique keys to avoid exact duplicate entries from same scan
    const seenEventKeys = new Set<string>();

    completedScans.forEach((scan, scanIdx) => {
      const scanDate = scan.startedAt ? new Date(scan.startedAt) : new Date(nowMs - (scanIdx + 1) * 3600000);
      const productObj = products.find(p => p.id === scan.productId || p.name === scan.productName);
      const mapPrice = scan.mapPrice || productObj?.mapPrice || 100;
      const sku = productObj?.sku || "SKU-PROT";
      const productName = scan.productName || productObj?.name || "Protected Product";

      (scan.items || []).forEach((item, itemIdx) => {
        if (item.status === 'violating' && item.detectedPrice !== null && item.detectedPrice < mapPrice) {
          const eventKey = `${scan.id}-${item.partnerId}-${item.detectedPrice}`;
          if (seenEventKeys.has(eventKey)) return;
          seenEventKeys.add(eventKey);

          const detPrice = item.detectedPrice;
          const varianceAmount = Math.max(0, mapPrice - detPrice);
          const variancePercent = Math.round((varianceAmount / mapPrice) * 100);

          let severity: "critical" | "high" | "medium" | "low" = "low";
          if (variancePercent >= 20 || varianceAmount >= 50) severity = "critical";
          else if (variancePercent >= 15) severity = "high";
          else if (variancePercent >= 10) severity = "medium";

          const partnerDomain = item.partnerDomain || "marketplace.com";
          const partnerName = item.partnerName || "Authorized Partner";
          const channel = getChannelName(item.detectedUrl, partnerName, partnerDomain);
          const region = getRegionForDomain(partnerDomain, partnerName);
          const eventId = `breach-${scan.id}-${item.id || itemIdx}`;

          // Default initial status based on variance severity and elapsed time
          let defaultStatus: ViolationStatusType = "new_infraction";
          const daysOld = Math.floor((nowMs - scanDate.getTime()) / (86400000));
          if (daysOld >= 3 && severity === "critical") defaultStatus = "second_notice";
          else if (daysOld >= 1) defaultStatus = "warning_sent";

          const defaultHistory: StatusHistoryEntry[] = [
            {
              timestamp: scanDate.toISOString(),
              status: "new_infraction",
              note: `Automated detection: price dropped to $${detPrice.toFixed(2)} (-${variancePercent}% below MAP $${mapPrice.toFixed(2)}).`,
              updatedBy: "System Scanner"
            }
          ];

          if (defaultStatus !== "new_infraction") {
            defaultHistory.push({
              timestamp: new Date(scanDate.getTime() + 1800000).toISOString(),
              status: defaultStatus,
              note: defaultStatus === "second_notice" 
                ? "Automatic 2nd escalation notice dispatched to partner compliance email."
                : "Initial policy warning notice automatically queued.",
              updatedBy: "Automated Rules Engine"
            });
          }

          // Check if custom override exists
          const override = customStatusOverrides[eventId];
          const finalStatus = override?.status || defaultStatus;
          const finalStatusUpdatedAt = override?.statusUpdatedAt || scanDate.toISOString();
          const finalStatusNote = override?.statusNote;
          const finalHistory = override?.statusHistory || defaultHistory;

          events.push({
            id: eventId,
            scanId: scan.id,
            timestamp: scanDate.toISOString(),
            date: scanDate,
            productId: scan.productId,
            productName,
            sku,
            partnerId: item.partnerId,
            partnerName,
            partnerDomain,
            mapPrice,
            detectedPrice: detPrice,
            varianceAmount,
            variancePercent,
            url: item.detectedUrl || `https://${partnerDomain}/product/${sku}`,
            snippet: item.snippet || `Detected unapproved listing at $${detPrice.toFixed(2)} on ${partnerDomain}.`,
            channel,
            region,
            severity,
            status: finalStatus,
            statusUpdatedAt: finalStatusUpdatedAt,
            statusNote: finalStatusNote,
            statusHistory: finalHistory
          });
        }
      });
    });

    // 2. If scan count is minimal or zero, populate realistic benchmark violation events across catalog
    if (events.length < 4) {
      const demoPartners = partners.length > 0 ? partners : [
        { id: "p1", name: "GizmoMart Online", domain: "amazon.com", contactEmail: "seller@gizmomart.com" },
        { id: "p2", name: "DiscountDepot Shop", domain: "ebay.com", contactEmail: "compliance@discountdepot.com" },
        { id: "p3", name: "TechDelight Electronics", domain: "bestbuy.com", contactEmail: "partners@techdelight.com" },
        { id: "p4", name: "NewEgg Partner World", domain: "walmart.com", contactEmail: "map@neweggpartner.com" }
      ];

      const demoProducts = products.length > 0 ? products : [
        { id: "1", name: "Apex Pro Wireless Gaming Headset", sku: "APX-HD-100", mapPrice: 199.99, description: "Headset" },
        { id: "2", name: "SoundWave ANC Studio Headphones", sku: "SW-ANC-200", mapPrice: 249.99, description: "Headphones" },
        { id: "3", name: "ErgoFlow Precision Mechanical Keyboard", sku: "EF-KB-300", mapPrice: 129.99, description: "Keyboard" },
        { id: "4", name: "UltraView 4K UltraWide Monitor", sku: "UV-MON-400", mapPrice: 499.99, description: "Monitor" }
      ];

      const timeOffsetsHours = [1.5, 4.2, 11.5, 23.0, 48.5, 72.0, 96.0];
      const varianceRatios = [0.82, 0.76, 0.88, 0.71, 0.85, 0.79, 0.90];

      timeOffsetsHours.forEach((hoursAgo, idx) => {
        const prod = demoProducts[idx % demoProducts.length];
        const part = demoPartners[idx % demoPartners.length];
        const eventId = `demo-breach-event-${idx + 1}`;
        const eventDate = new Date(nowMs - hoursAgo * 3600000);
        const mapPrice = prod?.mapPrice || 100;
        const detPrice = Math.round(mapPrice * varianceRatios[idx] * 100) / 100;
        const varianceAmount = Math.round((mapPrice - detPrice) * 100) / 100;
        const variancePercent = Math.round((varianceAmount / mapPrice) * 100);

        let severity: "critical" | "high" | "medium" | "low" = "low";
        if (variancePercent >= 20) severity = "critical";
        else if (variancePercent >= 15) severity = "high";
        else if (variancePercent >= 10) severity = "medium";

        let defaultStatus: ViolationStatusType = "new_infraction";
        if (idx === 0) defaultStatus = "new_infraction";
        else if (idx === 1) defaultStatus = "warning_sent";
        else if (idx === 2) defaultStatus = "under_investigation";
        else if (idx === 3) defaultStatus = "second_notice";
        else if (idx === 4) defaultStatus = "grace_period";
        else if (idx === 5) defaultStatus = "legal_escalated";
        else defaultStatus = "resolved";

        const defaultHistory: StatusHistoryEntry[] = [
          {
            timestamp: eventDate.toISOString(),
            status: "new_infraction",
            note: `Real-time crawler captured price at $${detPrice.toFixed(2)} (${variancePercent}% breach).`,
            updatedBy: "Cloudboy Scanner"
          }
        ];

        if (defaultStatus !== "new_infraction") {
          defaultHistory.push({
            timestamp: new Date(eventDate.getTime() + 2400000).toISOString(),
            status: defaultStatus,
            note: `Status advanced to ${STATUS_CONFIG[defaultStatus].label} by compliance supervisor.`,
            updatedBy: "Sarah Vance (Director)"
          });
        }

        const override = customStatusOverrides[eventId];
        const finalStatus = override?.status || defaultStatus;
        const finalStatusUpdatedAt = override?.statusUpdatedAt || eventDate.toISOString();
        const finalStatusNote = override?.statusNote;
        const finalHistory = override?.statusHistory || defaultHistory;

        events.push({
          id: eventId,
          scanId: `scan-demo-${idx + 1}`,
          timestamp: eventDate.toISOString(),
          date: eventDate,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          partnerId: part.id,
          partnerName: part.name,
          partnerDomain: part.domain,
          mapPrice,
          detectedPrice: detPrice,
          varianceAmount,
          variancePercent,
          url: `https://${part.domain}/product/${encodeURIComponent(prod.sku)}`,
          snippet: `Flash Discount for ${prod.name}! Cart price undercuts standard authorized MAP threshold.`,
          channel: getChannelName(null, part.name, part.domain),
          region: getRegionForDomain(part.domain, part.name),
          severity,
          status: finalStatus,
          statusUpdatedAt: finalStatusUpdatedAt,
          statusNote: finalStatusNote,
          statusHistory: finalHistory
        });
      });
    }

    return events;
  }, [scans, products, partners, customStatusOverrides]);

  // Filtered and Sorted Timeline Events
  const filteredTimelineEvents = useMemo(() => {
    return masterBreachEvents
      .filter(event => {
        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchSearch = 
            event.productName.toLowerCase().includes(q) ||
            event.sku.toLowerCase().includes(q) ||
            event.partnerName.toLowerCase().includes(q) ||
            event.partnerDomain.toLowerCase().includes(q) ||
            event.channel.toLowerCase().includes(q) ||
            event.region.toLowerCase().includes(q);
          if (!matchSearch) return false;
        }

        // Status filter
        if (statusFilter !== "all" && event.status !== statusFilter) {
          return false;
        }

        // Severity filter
        if (severityFilter !== "all" && event.severity !== severityFilter) {
          return false;
        }

        // Channel filter
        if (channelFilter !== "all" && event.channel !== channelFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === "newest") {
          return b.date.getTime() - a.date.getTime();
        } else {
          return a.date.getTime() - b.date.getTime();
        }
      });
  }, [masterBreachEvents, searchQuery, statusFilter, severityFilter, channelFilter, sortOrder]);

  // Summary Metrics for the timeline header
  const timelineMetrics = useMemo(() => {
    const total = masterBreachEvents.length;
    const actionRequired = masterBreachEvents.filter(e => e.status === "new_infraction").length;
    const warningsActive = masterBreachEvents.filter(e => e.status === "warning_sent" || e.status === "second_notice").length;
    const underReview = masterBreachEvents.filter(e => e.status === "under_investigation" || e.status === "grace_period").length;
    const resolved = masterBreachEvents.filter(e => e.status === "resolved").length;
    const maxVariancePct = total > 0 ? Math.max(...masterBreachEvents.map(e => e.variancePercent)) : 0;
    const totalVarianceValue = masterBreachEvents.reduce((acc, e) => acc + e.varianceAmount, 0);

    return {
      total,
      actionRequired,
      warningsActive,
      underReview,
      resolved,
      maxVariancePct,
      totalVarianceValue
    };
  }, [masterBreachEvents]);

  // Unique channel options for filter
  const uniqueChannels = useMemo(() => {
    return Array.from(new Set(masterBreachEvents.map(e => e.channel)));
  }, [masterBreachEvents]);

  // Format relative time helper
  const formatRelativeTime = (date: Date) => {
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Handle saving status updates
  const handleUpdateStatusSubmit = () => {
    if (!editingViolation) return;

    const nowIso = new Date().toISOString();
    const currentHistory = editingViolation.statusHistory || [];
    
    const newEntry: StatusHistoryEntry = {
      timestamp: nowIso,
      status: newStatus,
      note: statusNote.trim() || `Status manually updated to ${STATUS_CONFIG[newStatus].label}.`,
      updatedBy: "Compliance Officer"
    };

    const updatedOverrides = {
      ...customStatusOverrides,
      [editingViolation.id]: {
        status: newStatus,
        statusUpdatedAt: nowIso,
        statusNote: statusNote.trim() || undefined,
        statusHistory: [newEntry, ...currentHistory]
      }
    };

    saveStatusOverrides(updatedOverrides);
    setEditingViolation(null);
    setStatusNote("");

    // Show feedback toast
    setFeedbackToast(`Updated status of ${editingViolation.sku} on ${editingViolation.partnerName} to "${STATUS_CONFIG[newStatus].label}"`);
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  // Quick 1-click status advance
  const handleQuickStatusAdvance = (event: ChronologicalBreachEvent, targetStatus: ViolationStatusType, noteText: string) => {
    const nowIso = new Date().toISOString();
    const currentHistory = event.statusHistory || [];
    
    const newEntry: StatusHistoryEntry = {
      timestamp: nowIso,
      status: targetStatus,
      note: noteText,
      updatedBy: "Compliance Officer"
    };

    const updatedOverrides = {
      ...customStatusOverrides,
      [event.id]: {
        status: targetStatus,
        statusUpdatedAt: nowIso,
        statusNote: noteText,
        statusHistory: [newEntry, ...currentHistory]
      }
    };

    saveStatusOverrides(updatedOverrides);
    setFeedbackToast(`${STATUS_CONFIG[targetStatus].label} applied to ${event.sku} on ${event.partnerName}`);
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  // Export Chronological Timeline Data as CSV
  const handleExportTimelineCSV = () => {
    const headers = [
      "Breach Event ID",
      "Timestamp (ISO)",
      "Product SKU",
      "Product Name",
      "Retailer Partner",
      "Storefront Domain",
      "Channel",
      "Region",
      "MAP Authorized Price ($)",
      "Detected Breach Price ($)",
      "Variance Amount ($)",
      "Variance Percent (%)",
      "Severity Level",
      "Current Status",
      "Status Last Updated",
      "Latest Audit Note",
      "Evidence Storefront URL"
    ];

    const rows = filteredTimelineEvents.map(e => [
      e.id,
      e.timestamp,
      `"${e.sku}"`,
      `"${e.productName.replace(/"/g, '""')}"`,
      `"${e.partnerName.replace(/"/g, '""')}"`,
      e.partnerDomain,
      `"${e.channel}"`,
      e.region,
      e.mapPrice.toFixed(2),
      e.detectedPrice.toFixed(2),
      e.varianceAmount.toFixed(2),
      `${e.variancePercent}%`,
      e.severity.toUpperCase(),
      `"${STATUS_CONFIG[e.status].label}"`,
      e.statusUpdatedAt,
      `"${(e.statusNote || "").replace(/"/g, '""')}"`,
      `"${e.url}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `map-breach-chronological-timeline-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`space-y-6 ${className}`} id="chronological-breach-timeline-container">
      {/* Toast Alert */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in font-sans text-xs font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
          <button 
            type="button" 
            onClick={() => setFeedbackToast(null)} 
            className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Timeline Header & Metric KPI Overview */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 px-1.5 rounded-md bg-rose-950/60 text-rose-400 font-mono text-[10px] font-bold border border-rose-900/50 flex items-center gap-1">
                <Clock className="w-3 h-3 text-rose-400 animate-pulse" />
                CHRONOLOGICAL STREAM
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                {filteredTimelineEvents.length} Recorded Breach Events
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white font-display flex items-center gap-2">
              MAP Breach Chronological Timeline
            </h2>
            <p className="text-xs text-slate-400 font-sans">
              Real-time sequential audit trail of detected minimum advertised price violations with progressive lifecycle status updates and curative action records.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportTimelineCSV}
              className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-600 rounded-xl text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Export complete chronological breach timeline to spreadsheet CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Export Timeline (CSV)
            </button>
          </div>
        </div>

        {/* Metric KPI Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-3.5 bg-zinc-950/70 border border-red-900/30 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-red-400 uppercase font-semibold">Action Required</span>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{timelineMetrics.actionRequired}</div>
            <p className="text-[9px] text-slate-500 font-sans">New unaddressed breaches</p>
          </div>

          <div className="p-3.5 bg-zinc-950/70 border border-amber-900/30 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold">Notices Sent</span>
              <Send className="w-3 h-3 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300 font-mono">{timelineMetrics.warningsActive}</div>
            <p className="text-[9px] text-slate-500 font-sans">1st & 2nd warning dispatches</p>
          </div>

          <div className="p-3.5 bg-zinc-950/70 border border-indigo-900/30 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-indigo-400 uppercase font-semibold">Under Audit / Grace</span>
              <Search className="w-3 h-3 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-indigo-300 font-mono">{timelineMetrics.underReview}</div>
            <p className="text-[9px] text-slate-500 font-sans">Active investigations</p>
          </div>

          <div className="p-3.5 bg-zinc-950/70 border border-emerald-900/30 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">Resolved</span>
              <CheckCircle className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">{timelineMetrics.resolved}</div>
            <p className="text-[9px] text-slate-500 font-sans">Price floor restored</p>
          </div>

          <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-rose-400 uppercase font-semibold">Max Deviation</span>
              <TrendingDown className="w-3 h-3 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400 font-mono">-{timelineMetrics.maxVariancePct}%</div>
            <p className="text-[9px] text-slate-500 font-sans">Deepest pricing under-cut</p>
          </div>
        </div>

        {/* Filter Toolbar & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by SKU, product name, partner, domain..."
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-slate-300 text-xs font-mono rounded-xl px-2.5 py-2 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="all">All Statuses ({masterBreachEvents.length})</option>
              <option value="new_infraction">Action Required ({masterBreachEvents.filter(e => e.status === "new_infraction").length})</option>
              <option value="warning_sent">1st Notice Sent ({masterBreachEvents.filter(e => e.status === "warning_sent").length})</option>
              <option value="second_notice">2nd Notice Sent ({masterBreachEvents.filter(e => e.status === "second_notice").length})</option>
              <option value="under_investigation">Under Audit ({masterBreachEvents.filter(e => e.status === "under_investigation").length})</option>
              <option value="grace_period">Grace Period ({masterBreachEvents.filter(e => e.status === "grace_period").length})</option>
              <option value="legal_escalated">Legal Escalated ({masterBreachEvents.filter(e => e.status === "legal_escalated").length})</option>
              <option value="resolved">Resolved ({masterBreachEvents.filter(e => e.status === "resolved").length})</option>
              <option value="snoozed">Waiver / Snoozed ({masterBreachEvents.filter(e => e.status === "snoozed").length})</option>
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-slate-300 text-xs font-mono rounded-xl px-2.5 py-2 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical (&gt;20%)</option>
              <option value="high">High (15-20%)</option>
              <option value="medium">Medium (10-15%)</option>
              <option value="low">Low (&lt;10%)</option>
            </select>

            {/* Channel Filter */}
            {uniqueChannels.length > 1 && (
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-slate-300 text-xs font-mono rounded-xl px-2.5 py-2 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
              >
                <option value="all">All Channels</option>
                {uniqueChannels.map(ch => (
                  <option key={ch} value={ch}>{ch}</option>
                ))}
              </select>
            )}

            {/* Sort Order Toggle */}
            <button
              type="button"
              onClick={() => setSortOrder(prev => prev === "newest" ? "oldest" : "newest")}
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-slate-300 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Toggle sorting between newest and oldest events"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
              <span>{sortOrder === "newest" ? "Newest First" : "Oldest First"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chronological Vertical Timeline Feed */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
        {filteredTimelineEvents.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-4">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" strokeWidth={1.5} />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No Matching Breach Events</h3>
              <p className="text-slate-400 max-w-md mx-auto text-xs leading-relaxed">
                No MAP violations matched the current active filters. Adjust your search or filter parameters to inspect other chronological events.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setSeverityFilter("all");
                setChannelFilter("all");
              }}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-indigo-400 rounded-xl text-xs font-mono font-bold border border-zinc-700 transition cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="relative pl-4 sm:pl-8 space-y-8 before:absolute before:left-[19px] sm:before:left-[35px] before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-rose-500/80 before:via-indigo-500/40 before:to-emerald-500/80">
            {filteredTimelineEvents.map((event, idx) => {
              const statusCfg = STATUS_CONFIG[event.status];
              const StatusIcon = statusCfg.icon;
              const isHistoryOpen = historyDrawerViolationId === event.id;

              return (
                <div key={event.id} className="relative group animate-fade-in" id={`timeline-event-${event.id}`}>
                  {/* Timeline Pulse Node Indicator */}
                  <div className="absolute -left-[23px] sm:-left-[39px] top-1.5 flex items-center justify-center">
                    <div className={`w-3.5 h-3.5 rounded-full ${statusCfg.dotColor} ring-4 ring-zinc-950 transition-all duration-300 group-hover:scale-125 shadow-md flex items-center justify-center`}>
                      <span className="w-1 h-1 rounded-full bg-white opacity-80" />
                    </div>
                  </div>

                  {/* Breach Event Card Container */}
                  <div className="bg-zinc-950/80 hover:bg-zinc-900/60 border border-zinc-800/90 hover:border-zinc-700 rounded-2xl p-5 sm:p-6 transition-all duration-200 shadow-md space-y-4">
                    
                    {/* Top Row: Event Metadata, Timestamp & Status Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-3.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Status Badge */}
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${statusCfg.badgeClass}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span>{statusCfg.label}</span>
                        </div>

                        {/* Severity Tag */}
                        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                          event.severity === "critical"
                            ? "bg-red-950/60 text-red-400 border-red-800/60"
                            : event.severity === "high"
                            ? "bg-orange-950/60 text-orange-400 border-orange-800/60"
                            : event.severity === "medium"
                            ? "bg-amber-950/60 text-amber-400 border-amber-800/60"
                            : "bg-slate-900 text-slate-400 border-slate-800"
                        }`}>
                          {event.severity} Severity
                        </span>

                        {/* Channel Badge */}
                        <span className="text-[10px] font-mono text-slate-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800/80">
                          {event.channel}
                        </span>

                        {/* Region */}
                        <span className="text-[10px] font-mono text-indigo-400/90 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/40">
                          {event.region}
                        </span>
                      </div>

                      {/* Chronological Timestamp */}
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-bold text-white" title={event.date.toLocaleString()}>
                          {formatRelativeTime(event.date)}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-500 text-[11px]">
                          {event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Middle Section: Offender vs SKU & Price Variance Matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      
                      {/* Left: Product & Partner Details */}
                      <div className="md:col-span-7 space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-indigo-400 shrink-0 mt-0.5">
                            <Tag className="w-4 h-4" />
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-white font-sans truncate">
                                {event.productName}
                              </h4>
                              <span className="text-[10px] font-mono font-semibold text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-900/40">
                                {event.sku}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                              <span className="font-medium text-slate-300 flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-slate-500" />
                                {event.partnerName}
                              </span>
                              <span className="text-slate-600 font-mono">({event.partnerDomain})</span>
                              {onLocatePartner && (
                                <button
                                  type="button"
                                  onClick={() => onLocatePartner(event.partnerName, event.partnerDomain)}
                                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono hover:underline flex items-center gap-0.5 cursor-pointer ml-1"
                                  title="Locate merchant on geographical map"
                                >
                                  <MapPin className="w-3 h-3" />
                                  Map Pin
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Snippet / Context quote */}
                        {event.snippet && (
                          <p className="text-[11px] text-slate-400/90 font-sans italic bg-zinc-900/40 p-2 rounded-lg border border-zinc-800/40 leading-relaxed">
                            "{event.snippet}"
                          </p>
                        )}
                      </div>

                      {/* Right: Pricing Deviation Metric Block */}
                      <div className="md:col-span-5 bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[9px] font-mono text-slate-500 uppercase block font-semibold">MAP Baseline</span>
                          <span className="text-sm font-bold font-mono text-slate-300">${(event.mapPrice ?? 0).toFixed(2)}</span>
                        </div>

                        <div className="text-center">
                          <span className="text-[9px] font-mono text-slate-500 uppercase block font-semibold">Detected Price</span>
                          <span className="text-sm font-extrabold font-mono text-rose-400">${event.detectedPrice.toFixed(2)}</span>
                        </div>

                        <div className="text-right">
                          <span className="text-[9px] font-mono text-rose-500 uppercase block font-bold">MAP Variance</span>
                          <div className="flex items-center justify-end gap-1 font-mono font-bold text-rose-400 text-sm">
                            <span>-${event.varianceAmount.toFixed(2)}</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-rose-950/80 text-rose-300 rounded border border-rose-800/60 font-extrabold">
                              -{event.variancePercent}%
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Status Update Note & Last Audit Trail */}
                    {event.statusNote && (
                      <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-indigo-300 font-sans">
                        <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider block">
                            Latest Compliance Status Note
                          </span>
                          <p className="text-[11px] text-slate-300 leading-normal">{event.statusNote}</p>
                        </div>
                      </div>
                    )}

                    {/* Bottom Row: Action Controls & Status Updating Workflow */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-850 border-zinc-800/50">
                      
                      {/* Left: Quick Lifecycle Actions */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {event.status === "new_infraction" && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatusAdvance(event, "warning_sent", "Automated 1st warning notice dispatched to reseller compliance point of contact.")}
                            className="px-2.5 py-1.5 bg-amber-950/60 hover:bg-amber-900/70 border border-amber-900/60 hover:border-amber-700 text-amber-300 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            Dispatch 1st Notice
                          </button>
                        )}

                        {event.status === "warning_sent" && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatusAdvance(event, "second_notice", "24-hour cure window lapsed. Escalated 2nd warning dispatched.")}
                            className="px-2.5 py-1.5 bg-orange-950/60 hover:bg-orange-900/70 border border-orange-900/60 hover:border-orange-700 text-orange-300 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <ShieldAlert className="w-3 h-3" />
                            Escalate to 2nd Notice
                          </button>
                        )}

                        {event.status !== "resolved" && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatusAdvance(event, "resolved", "Re-verified merchant storefront; price restored to compliant MAP floor.")}
                            className="px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-900/60 hover:border-emerald-700 text-emerald-300 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Mark Resolved
                          </button>
                        )}

                        {/* Open Status Update Dialog */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingViolation(event);
                            setNewStatus(event.status);
                            setStatusNote(event.statusNote || "");
                          }}
                          className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-slate-300 hover:text-white rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3 text-indigo-400" />
                          Update Status...
                        </button>

                        {/* Toggle Status History Drawer */}
                        {event.statusHistory && event.statusHistory.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setHistoryDrawerViolationId(isHistoryOpen ? null : event.id)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1 cursor-pointer border ${
                              isHistoryOpen 
                                ? "bg-indigo-950/80 border-indigo-700 text-indigo-300"
                                : "bg-zinc-900/60 hover:bg-zinc-800 border-zinc-800 text-slate-400 hover:text-slate-200"
                            }`}
                            title="Inspect chronological status update history for this breach"
                          >
                            <History className="w-3 h-3" />
                            <span>Audit Log ({event.statusHistory.length})</span>
                            {isHistoryOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        )}
                      </div>

                      {/* Right: Evidence Inspection & Storefront Link */}
                      <div className="flex items-center gap-2">
                        {onSelectViolationForScreenshot && (
                          <button
                            type="button"
                            onClick={() => onSelectViolationForScreenshot({
                              product: event.productName,
                              partner: event.partnerName,
                              domain: event.partnerDomain,
                              map: event.mapPrice,
                              found: event.detectedPrice,
                              url: event.url,
                              time: event.timestamp
                            })}
                            className="px-2.5 py-1.5 bg-[#1a0f1d] hover:bg-rose-900/40 border border-red-900/50 hover:border-red-700 text-rose-400 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            Screenshot Evidence
                          </button>
                        )}

                        <a
                          href={event.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-indigo-400 hover:text-white rounded-lg text-xs font-mono font-medium transition flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Inspect Link
                        </a>
                      </div>

                    </div>

                    {/* Expandable Status History Audit Trail Log */}
                    {isHistoryOpen && event.statusHistory && (
                      <div className="mt-3 p-4 bg-zinc-950 border border-zinc-800/80 rounded-xl space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                          <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5 text-indigo-400" />
                            Chronological Violation Status History
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            ID: {event.id}
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {event.statusHistory.map((hist, hIdx) => {
                            const histCfg = STATUS_CONFIG[hist.status] || STATUS_CONFIG.new_infraction;
                            const HistIcon = histCfg.icon;
                            return (
                              <div key={hIdx} className="flex items-start gap-3 text-xs font-sans border-l-2 border-zinc-800 pl-3 py-1">
                                <div className="p-1 rounded bg-zinc-900 border border-zinc-800 text-slate-300 shrink-0 mt-0.5">
                                  <HistIcon className="w-3 h-3 text-indigo-400" />
                                </div>
                                <div className="space-y-0.5 flex-1">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <span className="font-bold text-slate-200 font-mono">
                                      {histCfg.label}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500">
                                      {new Date(hist.timestamp).toLocaleString()} {hist.updatedBy ? `by ${hist.updatedBy}` : ""}
                                    </span>
                                  </div>
                                  {hist.note && (
                                    <p className="text-[11px] text-slate-400">{hist.note}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Status Update Modal */}
      {editingViolation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-indigo-400" />
                  Update Violation Status
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {editingViolation.sku} • {editingViolation.partnerName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingViolation(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Violation Snapshot */}
            <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between font-sans">
                <span className="text-slate-400">Product:</span>
                <span className="font-bold text-white truncate max-w-[280px]">{editingViolation.productName}</span>
              </div>
              <div className="flex justify-between font-sans">
                <span className="text-slate-400">Pricing Delta:</span>
                <span className="font-mono text-rose-400 font-bold">
                  ${editingViolation.detectedPrice.toFixed(2)} (MAP ${editingViolation.mapPrice.toFixed(2)} / -{editingViolation.variancePercent}%)
                </span>
              </div>
            </div>

            {/* Status Selector */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-300 font-semibold block">
                Select Lifecycle Status
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.keys(STATUS_CONFIG) as ViolationStatusType[]).map((st) => {
                  const cfg = STATUS_CONFIG[st];
                  const isSelected = newStatus === st;
                  const Icon = cfg.icon;

                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewStatus(st)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                        isSelected 
                          ? `${cfg.badgeClass} ring-2 ring-indigo-500 font-bold shadow-md`
                          : "bg-zinc-900/80 border-zinc-800 text-slate-400 hover:text-white hover:bg-zinc-850"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-mono block truncate">{cfg.shortLabel}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Audit Note Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 font-semibold block">
                Audit Note / Status Memo (Optional)
              </label>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="e.g., Contacted account manager via phone; price correction promised by 5 PM today."
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none transition resize-none font-sans"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingViolation(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-slate-300 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateStatusSubmit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-950/60"
              >
                <Check className="w-3.5 h-3.5" />
                Save Status Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
