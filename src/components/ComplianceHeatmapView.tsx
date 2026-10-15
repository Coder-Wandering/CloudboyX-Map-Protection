import React, { useState, useMemo, useEffect, useRef } from "react";
import { APIProvider, Map as GoogleMap, AdvancedMarker, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { Partner, Product, ScanJob, NotificationAlert } from "../types";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Flame,
  Layers,
  Search,
  Filter,
  RefreshCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Target,
  Globe,
  MapPin,
  Building2,
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  Eye,
  Sliders,
  Sparkles,
  Download,
  X,
  ChevronDown,
  ChevronUp,
  Activity,
  SlidersHorizontal,
  Compass,
  Map as MapIcon,
  Satellite,
  Users
} from "lucide-react";
import MapComplianceLegend from "./MapComplianceLegend";

export interface ComplianceHeatmapViewProps {
  partners: Partner[];
  products?: Product[];
  scans?: ScanJob[];
  onSelectPartner?: (partner: Partner) => void;
  selectedPartnerId?: string | null;
  height?: number | string;
  onTriggerScan?: (productId: string) => void;
}

// Controller component to smoothly manage Google Map viewport
function MapViewController({
  center,
  zoom,
  mapTypeId = "roadmap",
  onZoomChange
}: {
  center: { lat: number; lng: number };
  zoom: number;
  mapTypeId?: string;
  onZoomChange?: (zoom: number) => void;
}) {
  const map = useMap();
  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    if (map) {
      const key = `${center.lat.toFixed(4)},${center.lng.toFixed(4)},${zoom}`;
      if (lastKeyRef.current !== key) {
        map.panTo(center);
        map.setZoom(zoom);
        lastKeyRef.current = key;
      }
    }
  }, [map, center, zoom]);

  useEffect(() => {
    if (map && mapTypeId) {
      try {
        map.setMapTypeId(mapTypeId);
      } catch (err) {
        console.warn("Could not set map type:", err);
      }
    }
  }, [map, mapTypeId]);

  useEffect(() => {
    if (!map || !onZoomChange) return;
    const listener = map.addListener("zoom_changed", () => {
      const z = map.getZoom();
      if (typeof z === "number") {
        onZoomChange(z);
      }
    });
    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, onZoomChange]);

  return null;
}

// Fixed coordinates dictionary for known enterprise retailer domains
const DOMAIN_COORDINATES: Record<string, { lat: number; lng: number; city: string; state?: string; country: string; zipCode: string }> = {
  "amazon.com": { lat: 47.6062, lng: -122.3321, city: "Seattle", state: "WA", country: "United States", zipCode: "98101" },
  "bestbuy.com": { lat: 44.8800, lng: -93.2800, city: "Richfield", state: "MN", country: "United States", zipCode: "55423" },
  "walmart.com": { lat: 36.3729, lng: -94.2088, city: "Bentonville", state: "AR", country: "United States", zipCode: "72712" },
  "target.com": { lat: 44.9778, lng: -93.2650, city: "Minneapolis", state: "MN", country: "United States", zipCode: "55401" },
  "ebay.com": { lat: 37.3382, lng: -121.8863, city: "San Jose", state: "CA", country: "United States", zipCode: "95113" },
  "bhphotovideo.com": { lat: 40.7535, lng: -73.9965, city: "New York", state: "NY", country: "United States", zipCode: "10001" },
  "newegg.com": { lat: 34.0200, lng: -117.8900, city: "City of Industry", state: "CA", country: "United States", zipCode: "91748" },
  "adorama.com": { lat: 40.7390, lng: -73.9930, city: "New York", state: "NY", country: "United States", zipCode: "10011" },
  "costco.com": { lat: 47.5301, lng: -122.0326, city: "Issaquah", state: "WA", country: "United States", zipCode: "98027" },
  "microcenter.com": { lat: 40.0600, lng: -83.0500, city: "Columbus", state: "OH", country: "United States", zipCode: "43214" }
};

const REGION_CENTERS: Record<string, { lat: number; lng: number; country: string }> = {
  "United States": { lat: 39.8283, lng: -98.5795, country: "United States" },
  "Canada": { lat: 56.1304, lng: -106.3468, country: "Canada" },
  "Europe": { lat: 50.1109, lng: 8.6821, country: "Germany" },
  "APAC": { lat: 22.3193, lng: 114.1694, country: "Hong Kong" },
  "LATAM": { lat: -15.7832, lng: -55.4915, country: "Brazil" },
  "United Kingdom": { lat: 51.5074, lng: -0.1278, country: "United Kingdom" },
  "Australia": { lat: -33.8688, lng: 151.2093, country: "Australia" },
  "Japan": { lat: 35.6762, lng: 139.6503, country: "Japan" }
};

// Geographically resolve a partner domain to physical latitude/longitude
export function resolvePartnerDomainLocation(partner: Partner): {
  lat: number;
  lng: number;
  city: string;
  state?: string;
  country: string;
  zipCode: string;
  region: string;
} {
  const d = (partner.domain || "").toLowerCase().trim();
  const p = (partner.name || "").toLowerCase().trim();

  // 1. Direct domain match
  for (const [key, coords] of Object.entries(DOMAIN_COORDINATES)) {
    if (d.includes(key) || key.includes(d)) {
      return {
        ...coords,
        region: "United States"
      };
    }
  }

  // 2. TLD / Region detection
  let region = "United States";
  if (d.endsWith(".co.uk") || d.endsWith(".uk") || p.includes("london") || p.includes("british")) {
    region = "United Kingdom";
  } else if (d.endsWith(".de") || d.endsWith(".fr") || d.endsWith(".eu") || d.endsWith(".nl") || d.endsWith(".it") || p.includes("europe") || p.includes("euro")) {
    region = "Europe";
  } else if (d.endsWith(".ca") || p.includes("canada") || p.includes("toronto") || p.includes("montreal")) {
    region = "Canada";
  } else if (d.endsWith(".jp") || p.includes("tokyo") || p.includes("japan")) {
    region = "Japan";
  } else if (d.endsWith(".au") || p.includes("australia") || p.includes("sydney") || p.includes("melbourne")) {
    region = "Australia";
  } else if (d.endsWith(".cn") || d.endsWith(".in") || d.endsWith(".sg") || d.endsWith(".hk") || p.includes("apac") || p.includes("asia")) {
    region = "APAC";
  } else if (d.endsWith(".mx") || d.endsWith(".br") || d.endsWith(".ar") || p.includes("latam") || p.includes("brazil")) {
    region = "LATAM";
  }

  const baseCenter = REGION_CENTERS[region] || REGION_CENTERS["United States"];

  // Deterministic jitter based on domain & partner name hash so pins don't overlap exactly
  const hashString = `${partner.name}-${partner.domain}-${partner.id}`;
  let hash = 0;
  for (let i = 0; i < hashString.length; i++) {
    hash = (hash << 5) - hash + hashString.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const latOffset = ((absHash % 100) / 100 - 0.5) * 6.5; // up to +/- 3.25 deg
  const lngOffset = ((((absHash * 13) % 100) / 100) - 0.5) * 8.5; // up to +/- 4.25 deg
  const generatedZip = `${10000 + (absHash % 89999)}`;

  const cities = ["Metropolitan Hub", "Commerce Center", "Distribution Facility", "Fulfillment Gateway", "Retail Terminal"];
  const city = `${region} ${cities[absHash % cities.length]}`;

  return {
    lat: baseCenter.lat + latOffset,
    lng: baseCenter.lng + lngOffset,
    city,
    country: baseCenter.country,
    zipCode: generatedZip,
    region
  };
}

export default function ComplianceHeatmapView({
  partners,
  products = [],
  scans = [],
  onSelectPartner,
  selectedPartnerId,
  height = 480,
  onTriggerScan
}: ComplianceHeatmapViewProps) {
  // Google Maps API Key resolution
  const API_KEY =
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
    (process.env as any)?.GOOGLE_MAPS_API_KEY ||
    (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
    "";
  const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

  // Map viewport & interaction state
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 39.8283, lng: -98.5795 });
  const [mapZoom, setMapZoom] = useState<number>(3.8);
  const [mapTypeId, setMapTypeId] = useState<"roadmap" | "hybrid" | "satellite" | "terrain">("roadmap");
  const [activeInfoWindowPartner, setActiveInfoWindowPartner] = useState<any | null>(null);
  const [hoveredPartner, setHoveredPartner] = useState<any | null>(null);
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);

  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<{
    compliant: boolean;
    warning: boolean;
    violating: boolean;
    pending: boolean;
  }>({
    compliant: true,
    warning: true,
    violating: true,
    pending: true
  });
  const [markerScope, setMarkerScope] = useState<"all" | "violating">("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [metricDisplay, setMetricDisplay] = useState<"score" | "violations" | "deficit">("score");
  const [isClustering, setIsClustering] = useState<boolean>(true);
  const [showHeatGlow, setShowHeatGlow] = useState<boolean>(true);
  const [heatGlowRadius, setHeatGlowRadius] = useState<number>(1.2);
  const [isControlsExpanded, setIsControlsExpanded] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Derive rich compliance data mapped to geographic points
  const partnerPoints = useMemo(() => {
    return (partners || []).map((partner) => {
      const location = resolvePartnerDomainLocation(partner);

      // Analyze completed scan history for this partner
      let totalScans = 0;
      let violatingScans = 0;
      let activeViolationsCount = 0;
      let maxDeficit = 0;
      let maxDeficitPct = 0;
      const recentViolations: Array<{ sku: string; map: number; found: number; delta: number; product: string }> = [];

      (scans || []).forEach((scan) => {
        if (scan.status === "completed" && scan.items) {
          const match = scan.items.find(
            (item) =>
              item.partnerId === partner.id ||
              item.partnerName.toLowerCase() === partner.name.toLowerCase() ||
              item.partnerDomain.toLowerCase() === partner.domain.toLowerCase()
          );

          if (match) {
            totalScans++;
            if (match.status === "violating") {
              violatingScans++;
              activeViolationsCount++;
              if (match.detectedPrice !== null) {
                const diff = scan.mapPrice - match.detectedPrice;
                if (diff > 0) {
                  if (diff > maxDeficit) maxDeficit = diff;
                  const pct = Math.round((diff / scan.mapPrice) * 100);
                  if (pct > maxDeficitPct) maxDeficitPct = pct;

                  recentViolations.push({
                    sku: scan.productId || "SKU-GEN",
                    map: scan.mapPrice,
                    found: match.detectedPrice,
                    delta: diff,
                    product: scan.productName
                  });
                }
              }
            }
          }
        }
      });

      // Calculate standardized Compliance Score (0 - 100%)
      let complianceScore = 100;
      if (totalScans > 0) {
        const violationRate = violatingScans / totalScans;
        complianceScore = Math.max(0, Math.min(100, Math.round((1 - violationRate) * 100)));
      } else {
        // Fallback based on declared status if no scans executed yet
        if (partner.complianceStatus === "violating") complianceScore = 32;
        else if (partner.complianceStatus === "warning") complianceScore = 68;
        else if (partner.complianceStatus === "pending") complianceScore = 75;
        else complianceScore = 96;
      }

      // Compute Effective Status Category
      let effectiveStatus: "compliant" | "warning" | "violating" | "pending" = partner.complianceStatus || "compliant";
      if (activeViolationsCount > 0 || complianceScore < 50) {
        effectiveStatus = "violating";
      } else if (complianceScore < 80) {
        effectiveStatus = "warning";
      } else if (partner.complianceStatus === "pending") {
        effectiveStatus = "pending";
      } else {
        effectiveStatus = "compliant";
      }

      return {
        partner,
        ...location,
        totalScans,
        violatingScans,
        activeViolationsCount,
        maxDeficit,
        maxDeficitPct,
        complianceScore,
        effectiveStatus,
        recentViolations
      };
    });
  }, [partners, scans]);

  // Filtered Points based on scope, status, region, and search query
  const filteredPoints = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return partnerPoints.filter((pt) => {
      // 0. Scope Filter ('all' vs 'violating')
      if (markerScope === "violating") {
        const isViolating = pt.effectiveStatus === "violating" || pt.activeViolationsCount > 0 || pt.complianceScore < 70;
        if (!isViolating) return false;
      }

      // 1. Status Filter
      if (!statusFilter[pt.effectiveStatus]) return false;

      // 2. Region Filter
      if (regionFilter !== "all" && pt.region !== regionFilter) return false;

      // 3. Search Query Match
      if (q) {
        const matchName = pt.partner.name.toLowerCase().includes(q);
        const matchDomain = pt.partner.domain.toLowerCase().includes(q);
        const matchCity = pt.city.toLowerCase().includes(q);
        const matchZip = pt.zipCode.includes(q);
        const matchCountry = pt.country.toLowerCase().includes(q);
        if (!matchName && !matchDomain && !matchCity && !matchZip && !matchCountry) return false;
      }

      return true;
    });
  }, [partnerPoints, markerScope, statusFilter, regionFilter, searchQuery]);

  // Aggregate KPI Statistics
  const stats = useMemo(() => {
    const total = partnerPoints.length;
    if (total === 0) {
      return { total: 0, avgScore: 100, compliantCount: 0, warningCount: 0, violatingCount: 0, totalViolations: 0 };
    }
    const sumScore = partnerPoints.reduce((acc, p) => acc + p.complianceScore, 0);
    const avgScore = Math.round(sumScore / total);
    const compliantCount = partnerPoints.filter((p) => p.effectiveStatus === "compliant").length;
    const warningCount = partnerPoints.filter((p) => p.effectiveStatus === "warning").length;
    const violatingCount = partnerPoints.filter((p) => p.effectiveStatus === "violating").length;
    const totalViolations = partnerPoints.reduce((acc, p) => acc + p.activeViolationsCount, 0);

    return {
      total,
      avgScore,
      compliantCount,
      warningCount,
      violatingCount,
      totalViolations
    };
  }, [partnerPoints]);

  // Trigger copy to clipboard
  const handleCopyDomain = (domain: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(domain);
    setCopiedDomain(domain);
    setToastMessage(`Copied domain: ${domain}`);
    setTimeout(() => {
      setCopiedDomain(null);
      setToastMessage(null);
    }, 2500);
  };

  // Jump viewport directly to a specific partner point
  const handleFlyToPartner = (point: (typeof partnerPoints)[0]) => {
    setMapCenter({ lat: point.lat, lng: point.lng });
    setMapZoom(12);
    setActiveInfoWindowPartner(point);
    if (onSelectPartner) {
      onSelectPartner(point.partner);
    }
    setToastMessage(`Viewing ${point.partner.domain}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Center on highest risk / lowest compliance partner
  const handleFocusLowestCompliance = () => {
    const lowest = [...filteredPoints].sort((a, b) => a.complianceScore - b.complianceScore)[0];
    if (lowest) {
      handleFlyToPartner(lowest);
    }
  };

  // Reset View to global overview
  const handleResetView = () => {
    setMapCenter({ lat: 39.8283, lng: -98.5795 });
    setMapZoom(3.8);
    setActiveInfoWindowPartner(null);
  };

  // Export CSV of compliance geographic distribution
  const handleExportCSV = () => {
    const headers = [
      "Partner Name",
      "Domain",
      "Compliance Status",
      "Compliance Score (%)",
      "Active Violations",
      "Max Price Deficit ($)",
      "City",
      "Country",
      "Postal Code",
      "Latitude",
      "Longitude"
    ];

    const rows = filteredPoints.map((pt) => [
      `"${pt.partner.name.replace(/"/g, '""')}"`,
      `"${pt.partner.domain}"`,
      `"${pt.effectiveStatus}"`,
      pt.complianceScore,
      pt.activeViolationsCount,
      pt.maxDeficit.toFixed(2),
      `"${pt.city}"`,
      `"${pt.country}"`,
      `"${pt.zipCode}"`,
      pt.lat.toFixed(5),
      pt.lng.toFixed(5)
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `partner_compliance_geography_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage("Exported Compliance Distribution CSV");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Visual helper: Get multi-tiered color palette based on compliance status & score
  const getComplianceColor = (status: string, score: number) => {
    if (status === "pending") {
      return {
        bg: "bg-sky-500",
        border: "border-sky-400",
        text: "text-sky-400",
        glow: "rgba(14, 165, 233, 0.45)",
        ringColor: "ring-sky-500/50",
        badgeBg: "bg-sky-950/80 text-sky-300 border-sky-800/80",
        hex: "#0ea5e9",
        label: "Pending Audit",
        tier: "pending"
      };
    }
    if (status === "violating" || score < 45) {
      return {
        bg: "bg-rose-500",
        border: "border-rose-400",
        text: "text-rose-400",
        glow: "rgba(244, 63, 94, 0.55)",
        ringColor: "ring-rose-500/60",
        badgeBg: "bg-rose-950/90 text-rose-300 border-rose-700/80",
        hex: "#f43f5e",
        label: "Critical Breach (<45%)",
        tier: "critical"
      };
    }
    if (score < 65) {
      return {
        bg: "bg-orange-500",
        border: "border-orange-400",
        text: "text-orange-400",
        glow: "rgba(249, 115, 22, 0.5)",
        ringColor: "ring-orange-500/50",
        badgeBg: "bg-orange-950/85 text-orange-300 border-orange-800/80",
        hex: "#f97316",
        label: "High Risk (45-64%)",
        tier: "high_risk"
      };
    }
    if (status === "warning" || score < 80) {
      return {
        bg: "bg-amber-500",
        border: "border-amber-400",
        text: "text-amber-400",
        glow: "rgba(245, 158, 11, 0.45)",
        ringColor: "ring-amber-500/50",
        badgeBg: "bg-amber-950/80 text-amber-300 border-amber-800/80",
        hex: "#f59e0b",
        label: "Warning (65-79%)",
        tier: "warning"
      };
    }
    if (score < 90) {
      return {
        bg: "bg-teal-500",
        border: "border-teal-400",
        text: "text-teal-400",
        glow: "rgba(20, 184, 166, 0.45)",
        ringColor: "ring-teal-500/50",
        badgeBg: "bg-teal-950/80 text-teal-300 border-teal-800/80",
        hex: "#14b8a6",
        label: "Good (80-89%)",
        tier: "good"
      };
    }
    return {
      bg: "bg-emerald-500",
      border: "border-emerald-400",
      text: "text-emerald-400",
      glow: "rgba(16, 185, 129, 0.45)",
      ringColor: "ring-emerald-500/50",
      badgeBg: "bg-emerald-950/80 text-emerald-300 border-emerald-800/80",
      hex: "#10b981",
      label: "Compliant (90-100%)",
      tier: "compliant"
    };
  };

  return (
    <div
      id="compliance-heatmap-view-root"
      className="relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl transition-all"
    >
      {/* Top Header & Executive KPI Ribbon */}
      <div className="bg-zinc-950/95 border-b border-zinc-850 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 shadow-md">
            <Globe className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                Geographic Compliance Heatmap
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono font-bold">
                  Google Maps Engine
                </span>
              </h3>
            </div>
            <p className="text-[10px] text-zinc-400 font-sans mt-0.5">
              Geospatial distribution of reseller domain locations & MAP compliance scores
            </p>
          </div>
        </div>

        {/* Aggregate KPI Badges & Marker Scope Toggle */}
        <div className="flex items-center gap-2 font-mono text-[10px]">
          {/* Header Scope Toggle Button */}
          <div className="bg-zinc-900/90 border border-zinc-800 p-0.5 rounded-lg flex items-center gap-0.5 shadow-sm">
            <button
              type="button"
              id="header-scope-all-partners-btn"
              onClick={() => {
                setMarkerScope("all");
                setToastMessage("Map Markers: All Partners");
                setTimeout(() => setToastMessage(null), 2000);
              }}
              className={`px-2 py-1 rounded-md text-[9px] font-mono font-bold flex items-center gap-1 transition cursor-pointer ${
                markerScope === "all"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Show all partner markers on the map"
            >
              <Users className="w-3 h-3" />
              <span className="hidden sm:inline">All Partners</span>
            </button>
            <button
              type="button"
              id="header-scope-violating-only-btn"
              onClick={() => {
                setMarkerScope("violating");
                setToastMessage("Map Markers: Violating Partners Only");
                setTimeout(() => setToastMessage(null), 2000);
              }}
              className={`px-2 py-1 rounded-md text-[9px] font-mono font-bold flex items-center gap-1 transition cursor-pointer ${
                markerScope === "violating"
                  ? "bg-rose-600 text-white shadow-sm shadow-rose-950/50"
                  : "text-zinc-400 hover:text-rose-300"
              }`}
              title="Filter map markers to show only violating partner locations"
            >
              <ShieldAlert className={`w-3 h-3 ${markerScope === "violating" ? "text-white animate-pulse" : "text-rose-400"}`} />
              <span className="hidden sm:inline">Violating Only</span>
            </button>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
            <span className="text-zinc-400 text-[9px] uppercase">Avg Score:</span>
            <span
              className={`font-extrabold text-xs ${
                stats.avgScore >= 80 ? "text-emerald-400" : stats.avgScore >= 60 ? "text-amber-400" : "text-rose-400"
              }`}
            >
              {stats.avgScore}%
            </span>
          </div>

          <div className="bg-emerald-950/40 border border-emerald-900/50 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-emerald-300 shadow-sm hidden sm:flex">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span className="font-bold">{stats.compliantCount} Compliant</span>
          </div>

          <div className="bg-rose-950/40 border border-rose-900/50 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-rose-300 shadow-sm">
            <ShieldAlert className="w-3 h-3 text-rose-400 animate-pulse" />
            <span className="font-bold">{stats.violatingCount} Violating</span>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="p-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded-lg transition cursor-pointer flex items-center gap-1"
            title="Export CSV of partner geographic compliance scores"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline text-[9px] font-bold">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div
        className="relative w-full overflow-hidden bg-zinc-950"
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      >
        {!hasValidKey ? (
          /* Fallback UI if Google Maps Platform API key is absent */
          <div className="flex flex-col items-center justify-center p-6 bg-zinc-950/80 h-full text-center max-w-lg mx-auto select-none">
            <div className="p-3 rounded-2xl bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 mb-3 shadow-xl">
              <Globe className="w-8 h-8 animate-pulse" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Google Maps Platform Key Required</h4>
            <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed">
              To render interactive geospatial partner domain pins, regional heat glow clusters, and live compliance
              scores on Google Maps, provide your API key.
            </p>
            <div className="text-left w-full space-y-1.5 bg-zinc-900/70 p-3 rounded-xl border border-zinc-800 text-[10.5px] font-sans leading-relaxed text-zinc-300">
              <p>
                <span className="text-indigo-400 font-bold">1.</span> Obtain a key from the{" "}
                <a
                  href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 underline hover:text-indigo-300 font-medium"
                >
                  Google Maps Platform Console
                </a>
              </p>
              <p>
                <span className="text-indigo-400 font-bold">2.</span> Configure{" "}
                <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-rose-300 font-mono text-[9px]">
                  GOOGLE_MAPS_PLATFORM_KEY
                </code>{" "}
                in Settings &rarr; Secrets
              </p>
            </div>
          </div>
        ) : (
          <APIProvider apiKey={API_KEY} version="weekly">
            <div className="w-full h-full relative">
              {/* Interactive Domain Search & Quick Jump Overlay Bar */}
              <div
                id="compliance-map-search-bar"
                className="absolute top-3 left-3 z-30 w-72 sm:w-80 shadow-2xl backdrop-blur-md"
              >
                <div className="relative group">
                  <div className="bg-zinc-950/95 border border-zinc-800/90 hover:border-zinc-700 focus-within:border-indigo-500/80 rounded-xl px-3 py-1.5 flex items-center gap-2 transition duration-200">
                    <Search className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search domain, retailer, or city..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      className="bg-transparent text-white placeholder-zinc-500 text-[10.5px] font-mono outline-none w-full"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="text-zinc-500 hover:text-white p-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Search Autocomplete Suggestions Dropdown */}
                  {isSearchFocused && searchQuery.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-950/98 border border-zinc-800 rounded-xl p-1.5 shadow-2xl backdrop-blur-2xl max-h-56 overflow-y-auto font-mono text-[10px] z-50 divide-y divide-zinc-900 animate-fade-in">
                      {filteredPoints.length === 0 ? (
                        <div className="p-2.5 text-center text-zinc-500 text-[10px]">
                          No partner domains found for "{searchQuery}"
                        </div>
                      ) : (
                        filteredPoints.slice(0, 5).map((pt) => {
                          const clr = getComplianceColor(pt.effectiveStatus, pt.complianceScore);
                          return (
                            <button
                              key={`search-res-${pt.partner.id}`}
                              type="button"
                              onClick={() => {
                                handleFlyToPartner(pt);
                                setIsSearchFocused(false);
                              }}
                              className="w-full text-left px-2.5 py-1.5 hover:bg-zinc-900/90 rounded-lg transition flex items-center justify-between group/item cursor-pointer"
                            >
                              <div className="truncate min-w-0 pr-2">
                                <div className="font-bold text-white text-[11px] truncate group-hover/item:text-indigo-300 transition flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${clr.bg}`} />
                                  <span className="truncate">{pt.partner.name}</span>
                                </div>
                                <div className="text-[8.5px] text-zinc-400 truncate mt-0.5">
                                  {pt.partner.domain} &bull; {pt.city}
                                </div>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold border font-mono ${clr.badgeBg}`}>
                                {pt.complianceScore}%
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Floating Map View Controls Toolbar in Top-Right */}
              <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 select-none">
                {/* Marker Scope Toggle Button: All Partners vs Violating Partners Only */}
                <div className="bg-zinc-950/95 border border-zinc-800 rounded-lg p-0.5 shadow-xl backdrop-blur-md flex items-center gap-0.5">
                  <button
                    type="button"
                    id="floating-scope-all-partners-btn"
                    onClick={() => {
                      setMarkerScope("all");
                      setToastMessage("Map Markers: All Partners");
                      setTimeout(() => setToastMessage(null), 2200);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[9px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      markerScope === "all"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                    }`}
                    title="Switch map markers to display all partner locations"
                  >
                    <Users className="w-3 h-3" />
                    <span>All Partners</span>
                    <span className={`text-[8px] px-1 rounded ${markerScope === "all" ? "bg-indigo-800 text-indigo-200" : "bg-zinc-800 text-zinc-400"}`}>
                      {stats.total}
                    </span>
                  </button>
                  <button
                    type="button"
                    id="floating-scope-violating-only-btn"
                    onClick={() => {
                      setMarkerScope("violating");
                      setToastMessage("Map Markers: Violating Partners Only");
                      setTimeout(() => setToastMessage(null), 2200);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[9px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      markerScope === "violating"
                        ? "bg-rose-600 text-white shadow-sm shadow-rose-950/60"
                        : "text-zinc-400 hover:text-rose-300 hover:bg-rose-950/30"
                    }`}
                    title="Switch map markers to display only violating partner locations"
                  >
                    <ShieldAlert className={`w-3 h-3 ${markerScope === "violating" ? "text-white animate-pulse" : "text-rose-400"}`} />
                    <span>Violating Partners Only</span>
                    <span className={`text-[8px] px-1 rounded ${markerScope === "violating" ? "bg-rose-800 text-rose-200" : "bg-rose-950/80 text-rose-300 border border-rose-900/60"}`}>
                      {stats.violatingCount}
                    </span>
                  </button>
                </div>

                {/* Satellite vs Roadmap Toggle Switch */}
                <div className="bg-zinc-950/95 border border-zinc-800 rounded-lg p-0.5 shadow-xl backdrop-blur-md flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMapTypeId("roadmap");
                      setToastMessage("Map Style: Roadmap");
                      setTimeout(() => setToastMessage(null), 2200);
                    }}
                    className={`px-2 py-1 rounded-md text-[9px] font-mono font-bold flex items-center gap-1 transition cursor-pointer ${
                      mapTypeId === "roadmap"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                    }`}
                    title="Switch Google Maps to Roadmap style"
                  >
                    <MapIcon className="w-3 h-3" />
                    <span>Roadmap</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMapTypeId("satellite");
                      setToastMessage("Map Style: Satellite");
                      setTimeout(() => setToastMessage(null), 2200);
                    }}
                    className={`px-2 py-1 rounded-md text-[9px] font-mono font-bold flex items-center gap-1 transition cursor-pointer ${
                      mapTypeId === "satellite" || mapTypeId === "hybrid"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                    }`}
                    title="Switch Google Maps to Satellite style"
                  >
                    <Satellite className="w-3 h-3" />
                    <span>Satellite</span>
                  </button>
                </div>

                {/* Focus Lowest Compliance Button */}
                <button
                  type="button"
                  onClick={handleFocusLowestCompliance}
                  className="bg-zinc-950/95 border border-rose-900/70 hover:border-rose-500 text-rose-300 hover:text-white rounded-lg px-2.5 py-1.5 text-[9.5px] font-mono font-bold shadow-xl backdrop-blur-md flex items-center gap-1.5 transition cursor-pointer active:scale-95 hover:bg-rose-950/50"
                  title="Fly directly to the partner domain with the lowest compliance score"
                >
                  <Target className="w-3.5 h-3.5 text-rose-400 animate-pulse shrink-0" />
                  <span className="hidden sm:inline">Focus Violations</span>
                </button>

                {/* Reset View Button */}
                <button
                  type="button"
                  onClick={handleResetView}
                  className="bg-zinc-950/95 border border-zinc-800 hover:border-indigo-500/80 rounded-lg px-2.5 py-1.5 text-[9.5px] font-mono font-bold text-zinc-300 hover:text-white shadow-xl backdrop-blur-md flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                  title="Reset viewport to default center and zoom"
                >
                  <RotateCcw className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span className="hidden md:inline">Reset</span>
                </button>

                {/* Layer / Filter Control Menu Toggle */}
                <button
                  type="button"
                  onClick={() => setIsControlsExpanded((prev) => !prev)}
                  className={`bg-zinc-950/95 border ${
                    isControlsExpanded ? "border-indigo-500 text-white" : "border-zinc-800 text-zinc-300"
                  } rounded-lg px-2.5 py-1.5 text-[9.5px] font-mono font-bold shadow-xl backdrop-blur-md flex items-center gap-1.5 transition cursor-pointer active:scale-95`}
                  title="Toggle compliance filters and layer settings"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Filters</span>
                  <ChevronDown
                    className={`w-3 h-3 text-zinc-400 transition-transform ${isControlsExpanded ? "rotate-180" : ""}`}
                  />
                </button>
              </div>

              {/* Floating Filter Options Menu Panel */}
              {isControlsExpanded && (
                <div
                  id="compliance-map-filters-panel"
                  className="absolute top-14 right-3 z-40 w-64 bg-zinc-950/98 border border-zinc-800 rounded-xl p-3 shadow-2xl backdrop-blur-2xl font-mono text-[9.5px] select-none divide-y divide-zinc-900 animate-fade-in"
                >
                  <div className="flex items-center justify-between pb-2 mb-2">
                    <span className="font-extrabold text-white text-[11px] flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-indigo-400" />
                      Heatmap Controls
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsControlsExpanded(false)}
                      className="text-zinc-500 hover:text-white p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Marker Scope Selection in Dropdown Panel */}
                  <div className="py-2 space-y-1.5">
                    <label className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider block">
                      Partner Marker Scope
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => setMarkerScope("all")}
                        className={`px-2 py-1 rounded border text-[8.5px] font-bold flex items-center justify-center gap-1.5 transition ${
                          markerScope === "all"
                            ? "bg-indigo-950/70 text-indigo-300 border-indigo-700/60"
                            : "bg-zinc-900/30 text-zinc-500 border-zinc-800/40 opacity-60"
                        }`}
                      >
                        <Users className="w-3 h-3" />
                        All ({stats.total})
                      </button>
                      <button
                        type="button"
                        onClick={() => setMarkerScope("violating")}
                        className={`px-2 py-1 rounded border text-[8.5px] font-bold flex items-center justify-center gap-1.5 transition ${
                          markerScope === "violating"
                            ? "bg-rose-950/70 text-rose-300 border-rose-700/60 shadow-[0_0_8px_rgba(244,63,94,0.2)]"
                            : "bg-zinc-900/30 text-zinc-500 border-zinc-800/40 opacity-60"
                        }`}
                      >
                        <ShieldAlert className="w-3 h-3 text-rose-400" />
                        Violating ({stats.violatingCount})
                      </button>
                    </div>
                  </div>

                  {/* Status Toggles */}
                  <div className="py-2 space-y-1.5">
                    <label className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider block">
                      Status Visibility
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => setStatusFilter((p) => ({ ...p, compliant: !p.compliant }))}
                        className={`px-2 py-1 rounded border text-[8.5px] font-bold flex items-center gap-1 transition ${
                          statusFilter.compliant
                            ? "bg-emerald-950/50 text-emerald-300 border-emerald-800/60"
                            : "bg-zinc-900/30 text-zinc-500 border-zinc-800/40 opacity-60"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Compliant
                      </button>

                      <button
                        type="button"
                        onClick={() => setStatusFilter((p) => ({ ...p, warning: !p.warning }))}
                        className={`px-2 py-1 rounded border text-[8.5px] font-bold flex items-center gap-1 transition ${
                          statusFilter.warning
                            ? "bg-amber-950/50 text-amber-300 border-amber-800/60"
                            : "bg-zinc-900/30 text-zinc-500 border-zinc-800/40 opacity-60"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Warning
                      </button>

                      <button
                        type="button"
                        onClick={() => setStatusFilter((p) => ({ ...p, violating: !p.violating }))}
                        className={`px-2 py-1 rounded border text-[8.5px] font-bold flex items-center gap-1 transition ${
                          statusFilter.violating
                            ? "bg-rose-950/50 text-rose-300 border-rose-800/60"
                            : "bg-zinc-900/30 text-zinc-500 border-zinc-800/40 opacity-60"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                        Violating
                      </button>

                      <button
                        type="button"
                        onClick={() => setStatusFilter((p) => ({ ...p, pending: !p.pending }))}
                        className={`px-2 py-1 rounded border text-[8.5px] font-bold flex items-center gap-1 transition ${
                          statusFilter.pending
                            ? "bg-sky-950/50 text-sky-300 border-sky-800/60"
                            : "bg-zinc-900/30 text-zinc-500 border-zinc-800/40 opacity-60"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                        Pending
                      </button>
                    </div>
                  </div>

                  {/* Region Filter */}
                  <div className="py-2 space-y-1">
                    <label className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider block">
                      Target Region
                    </label>
                    <select
                      value={regionFilter}
                      onChange={(e) => setRegionFilter(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-[9px] rounded-lg px-2 py-1 outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="all">All Regions Worldwide</option>
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="Europe">Europe</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="APAC">APAC</option>
                      <option value="LATAM">LATAM</option>
                    </select>
                  </div>

                  {/* Map Type Selector */}
                  <div className="py-2 space-y-1">
                    <label className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider block">
                      Google Map Base Type
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      {(["roadmap", "hybrid", "satellite", "terrain"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setMapTypeId(type)}
                          className={`px-1.5 py-1 rounded capitalize text-[8.5px] font-bold border transition ${
                            mapTypeId === type
                              ? "bg-indigo-950/70 text-indigo-300 border-indigo-700/60"
                              : "bg-zinc-900/40 text-zinc-400 border-zinc-800/40"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visual Density Glow Switch */}
                  <div className="pt-2 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-[9px]">Heat Glow Halos</div>
                      <div className="text-[7.5px] text-zinc-500">Visualize compliance risk radius</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowHeatGlow((p) => !p)}
                      className={`px-2 py-0.5 rounded text-[8px] font-bold border cursor-pointer ${
                        showHeatGlow
                          ? "bg-indigo-950 text-indigo-300 border-indigo-800"
                          : "bg-zinc-900 text-zinc-500 border-zinc-800"
                      }`}
                    >
                      {showHeatGlow ? "ON" : "OFF"}
                    </button>
                  </div>
                </div>
              )}

              {/* Toast Feedback Notification */}
              {toastMessage && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 bg-zinc-950/95 border border-indigo-500/60 text-white px-3 py-1.5 rounded-xl shadow-2xl backdrop-blur-md text-[10px] font-mono flex items-center gap-2 animate-fade-in">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{toastMessage}</span>
                </div>
              )}

              {/* Core Google Map Canvas */}
              <GoogleMap
                style={{ width: "100%", height: "100%" }}
                defaultCenter={mapCenter}
                defaultZoom={mapZoom}
                mapId="DEMO_MAP_ID"
                mapTypeId={mapTypeId}
                internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                disableDefaultUI={true}
                gestureHandling="greedy"
              >
                <MapViewController
                  center={mapCenter}
                  zoom={mapZoom}
                  mapTypeId={mapTypeId}
                  onZoomChange={(z) => setMapZoom(z)}
                />

                {/* Render AdvancedMarkers for Partner Domain Points with Custom Color-Coded Indicators */}
                {filteredPoints.map((point) => {
                  const clr = getComplianceColor(point.effectiveStatus, point.complianceScore);
                  const isSelected = selectedPartnerId === point.partner.id;
                  const isHovered = hoveredPartner?.partner.id === point.partner.id;

                  // Radius of glow based on violation intensity / low compliance score
                  const glowSize = Math.max(28, Math.round((100 - point.complianceScore) * 0.85 * heatGlowRadius + 26));

                  // Helper for retailer display name
                  const cleanDomainName = point.partner.name || point.partner.domain.split(".")[0].toUpperCase();

                  return (
                    <AdvancedMarker
                      key={`partner-domain-marker-${point.partner.id}`}
                      position={{ lat: point.lat, lng: point.lng }}
                      title={`${point.partner.name} (${point.partner.domain}) - Compliance Score: ${point.complianceScore}%`}
                      onClick={() => {
                        setActiveInfoWindowPartner(point);
                        if (onSelectPartner) onSelectPartner(point.partner);
                      }}
                    >
                      <div
                        className="relative flex flex-col items-center cursor-pointer group/pin pointer-events-auto select-none"
                        onMouseEnter={() => setHoveredPartner(point)}
                        onMouseLeave={() => setHoveredPartner(null)}
                      >
                        {/* Heatmap Glow Halo representing compliance risk concentration */}
                        {showHeatGlow && (
                          <div
                            className="absolute -top-3 rounded-full filter blur-[5px] mix-blend-screen transition-all duration-300 group-hover/pin:scale-125 opacity-75 pointer-events-none"
                            style={{
                              width: `${glowSize}px`,
                              height: `${glowSize}px`,
                              backgroundColor: clr.glow
                            }}
                          />
                        )}

                        {/* Radar Pulse Beacon for Violating & High-Risk Retailers */}
                        {(point.complianceScore < 65 || point.effectiveStatus === "violating") && (
                          <div className="absolute -bottom-1 flex items-center justify-center pointer-events-none">
                            <span className={`w-6 h-6 rounded-full ${clr.bg} opacity-40 animate-ping`} />
                          </div>
                        )}

                        {/* Custom Marker Pill Header Container */}
                        <div
                          className={`relative flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-xl shadow-2xl backdrop-blur-md transition-all duration-200 border group-hover/pin:scale-110 ${
                            isSelected
                              ? "bg-zinc-950 ring-4 ring-indigo-400 scale-125 z-30 shadow-[0_0_25px_rgba(99,102,241,0.6)]"
                              : isHovered
                              ? "bg-zinc-900 z-20 shadow-xl"
                              : "bg-zinc-950/95"
                          }`}
                          style={{
                            borderColor: isSelected ? "#818cf8" : clr.hex
                          }}
                        >
                          {/* Compliance Status Icon / Tier Indicator */}
                          <div className="flex items-center justify-center shrink-0">
                            {point.complianceScore >= 90 ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            ) : point.complianceScore >= 80 ? (
                              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                            ) : point.complianceScore >= 65 ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            ) : point.complianceScore >= 45 ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                            ) : point.effectiveStatus === "pending" ? (
                              <Shield className="w-3.5 h-3.5 text-sky-400" />
                            ) : (
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                            )}
                          </div>

                          {/* Retailer Domain Identifier */}
                          <span className="text-[10px] font-sans font-bold text-white max-w-[85px] truncate tracking-tight">
                            {cleanDomainName}
                          </span>

                          {/* Color-Coded Compliance Score Badge Pill */}
                          <div
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg font-mono font-extrabold text-[9px] text-white shadow-xs ${clr.bg}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span>
                              {metricDisplay === "violations"
                                ? `${point.activeViolationsCount}v`
                                : metricDisplay === "deficit" && point.maxDeficit > 0
                                ? `-$${Math.round(point.maxDeficit)}`
                                : `${point.complianceScore}%`}
                            </span>
                          </div>
                        </div>

                        {/* Downward Pointer Stem Arrow targeting exact GPS point */}
                        <div
                          className="w-0 h-0 border-x-[5px] border-x-transparent border-t-[6px] transition-transform duration-200 group-hover/pin:scale-110 drop-shadow-md -mt-[1px]"
                          style={{
                            borderTopColor: isSelected ? "#818cf8" : clr.hex
                          }}
                        />

                        {/* Anchor Contact Point Dot */}
                        <div
                          className={`w-2 h-2 rounded-full border border-white/80 shadow-md -mt-[2px] ${clr.bg}`}
                        />

                        {/* Interactive Hover Tooltip Card Preview */}
                        <div className="absolute z-50 pointer-events-none opacity-0 group-hover/pin:opacity-100 transition-opacity duration-200 bottom-full mb-3 left-1/2 -translate-x-1/2">
                          <div className="bg-zinc-950/98 border border-zinc-700/90 text-white p-2.5 rounded-xl shadow-2xl font-mono text-[9px] w-52 backdrop-blur-xl space-y-1.5">
                            {/* Partner & Tier Header */}
                            <div className="flex items-center justify-between gap-1.5 border-b border-zinc-800 pb-1.5">
                              <div className="font-bold text-white text-[11px] truncate flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${clr.bg}`} />
                                <span className="truncate">{point.partner.name}</span>
                              </div>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border shrink-0 ${clr.badgeBg}`}
                              >
                                {point.complianceScore}%
                              </span>
                            </div>

                            {/* Compliance Progress Bar */}
                            <div className="space-y-0.5">
                              <div className="flex justify-between text-[8px] text-zinc-400">
                                <span>Compliance Rating</span>
                                <span className={clr.text}>{clr.label}</span>
                              </div>
                              <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                                <div
                                  className={`h-full rounded-full ${clr.bg}`}
                                  style={{ width: `${point.complianceScore}%` }}
                                />
                              </div>
                            </div>

                            {/* Key Stats Breakdown */}
                            <div className="grid grid-cols-2 gap-1 pt-0.5 text-[8.5px] text-zinc-300">
                              <div className="bg-zinc-900/80 p-1 rounded border border-zinc-850">
                                <span className="text-zinc-500 block text-[7.5px] uppercase">Violations</span>
                                <span className="font-bold text-rose-400 font-mono">
                                  {point.activeViolationsCount} Active
                                </span>
                              </div>
                              <div className="bg-zinc-900/80 p-1 rounded border border-zinc-850">
                                <span className="text-zinc-500 block text-[7.5px] uppercase">Max Deficit</span>
                                <span className="font-bold text-amber-400 font-mono">
                                  {point.maxDeficit > 0 ? `-$${point.maxDeficit.toFixed(2)}` : "None"}
                                </span>
                              </div>
                            </div>

                            <div className="text-[8px] text-zinc-400 truncate flex items-center gap-1 pt-0.5">
                              <MapPin className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
                              <span className="truncate">{point.city}, {point.country}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AdvancedMarker>
                  );
                })}

                {/* Rich Partner Details InfoWindow Popup */}
                {activeInfoWindowPartner && (
                  <InfoWindow
                    position={{ lat: activeInfoWindowPartner.lat, lng: activeInfoWindowPartner.lng }}
                    onCloseClick={() => setActiveInfoWindowPartner(null)}
                  >
                    <div className="bg-zinc-950 text-slate-100 p-2.5 rounded-xl max-w-xs font-mono text-[9.5px] border border-zinc-800 leading-normal">
                      {/* InfoWindow Header */}
                      <div className="flex items-start justify-between border-b border-zinc-850 pb-2 mb-2 gap-2">
                        <div>
                          <div className="font-extrabold text-white text-[12px] flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span className="truncate">{activeInfoWindowPartner.partner.name}</span>
                          </div>
                          <div className="text-[8.5px] text-zinc-400 flex items-center gap-1 mt-0.5">
                            <span>{activeInfoWindowPartner.partner.domain}</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyDomain(activeInfoWindowPartner.partner.domain, e)}
                              className="text-zinc-500 hover:text-white transition"
                              title="Copy partner domain"
                            >
                              {copiedDomain === activeInfoWindowPartner.partner.domain ? (
                                <Check className="w-2.5 h-2.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-2.5 h-2.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {(() => {
                          const clr = getComplianceColor(
                            activeInfoWindowPartner.effectiveStatus,
                            activeInfoWindowPartner.complianceScore
                          );
                          return (
                            <span
                              className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide border shrink-0 ${clr.badgeBg}`}
                            >
                              {activeInfoWindowPartner.effectiveStatus}
                            </span>
                          );
                        })()}
                      </div>

                      {/* Location Coordinates & Hub Info */}
                      <div className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-850/80 mb-2 space-y-1 text-[8.5px]">
                        <div className="flex items-center justify-between text-zinc-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-rose-400" />
                            Location:
                          </span>
                          <span className="text-zinc-200 font-medium truncate max-w-[140px]">
                            {activeInfoWindowPartner.city} ({activeInfoWindowPartner.zipCode})
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-400">
                          <span>Coordinates:</span>
                          <span className="text-indigo-300 font-mono">
                            {activeInfoWindowPartner.lat.toFixed(4)}, {activeInfoWindowPartner.lng.toFixed(4)}
                          </span>
                        </div>
                      </div>

                      {/* Compliance Progress Bar Widget */}
                      <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-2 mb-2">
                        <div className="flex justify-between items-center text-[9px] mb-1">
                          <span className="text-zinc-300 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            Compliance Score:
                          </span>
                          <span
                            className={`font-extrabold text-[11px] ${
                              activeInfoWindowPartner.complianceScore >= 80
                                ? "text-emerald-400"
                                : activeInfoWindowPartner.complianceScore >= 50
                                ? "text-amber-400"
                                : "text-rose-400"
                            }`}
                          >
                            {activeInfoWindowPartner.complianceScore}%
                          </span>
                        </div>
                        <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800 p-0.5">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              activeInfoWindowPartner.complianceScore >= 80
                                ? "bg-emerald-500"
                                : activeInfoWindowPartner.complianceScore >= 50
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                            style={{ width: `${activeInfoWindowPartner.complianceScore}%` }}
                          />
                        </div>
                      </div>

                      {/* Scans & Violation Stats */}
                      <div className="space-y-1 text-[8.5px] border-b border-zinc-850 pb-2 mb-2">
                        <div className="flex justify-between items-center text-zinc-400">
                          <span>Active Price Breaches:</span>
                          <span
                            className={`font-bold ${
                              activeInfoWindowPartner.activeViolationsCount > 0 ? "text-rose-400" : "text-emerald-400"
                            }`}
                          >
                            {activeInfoWindowPartner.activeViolationsCount} active
                          </span>
                        </div>
                        {activeInfoWindowPartner.maxDeficit > 0 && (
                          <div className="flex justify-between items-center text-zinc-400">
                            <span>Max Below MAP Deficit:</span>
                            <span className="font-extrabold text-rose-400">
                              -${activeInfoWindowPartner.maxDeficit.toFixed(2)} (-{activeInfoWindowPartner.maxDeficitPct}%)
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-zinc-400">
                          <span>Contact Email:</span>
                          <span className="text-zinc-300 truncate max-w-[130px]">
                            {activeInfoWindowPartner.partner.contactEmail || "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectPartner) onSelectPartner(activeInfoWindowPartner.partner);
                          }}
                          className="flex-1 py-1.5 bg-indigo-950 hover:bg-indigo-900 text-[8.5px] font-bold text-indigo-200 hover:text-white border border-indigo-800 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-indigo-400" />
                          <span>Inspect Profile</span>
                        </button>

                        <a
                          href={`https://${activeInfoWindowPartner.partner.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 rounded-lg transition flex items-center justify-center"
                          title="Visit partner storefront"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>

              {/* Standardized Compliance Heatmap & Reseller Classification Legend */}
              <MapComplianceLegend
                className="absolute bottom-3 left-3 w-60 z-20"
                mapSeverityFilters={{
                  high: statusFilter.violating,
                  medium: statusFilter.warning,
                  low: true,
                  compliant: statusFilter.compliant
                }}
                onToggleSeverity={(sev) => {
                  if (sev === "high") setStatusFilter(p => ({ ...p, violating: !p.violating }));
                  else if (sev === "medium") setStatusFilter(p => ({ ...p, warning: !p.warning }));
                  else if (sev === "compliant") setStatusFilter(p => ({ ...p, compliant: !p.compliant }));
                }}
                showHistoricalOverlay={showHeatGlow}
                onToggleHistoricalOverlay={() => setShowHeatGlow(p => !p)}
                showViolationHeatmap={showHeatGlow}
                onToggleViolationHeatmap={() => setShowHeatGlow(p => !p)}
                showPartnerMarkers={true}
                markerScope={markerScope}
                onToggleMarkerScope={(scope) => setMarkerScope(scope)}
                partnerCounts={{
                  total: partnerPoints.length,
                  critical: stats.violatingCount,
                  moderate: stats.warningCount,
                  low: 0,
                  compliant: stats.compliantCount,
                  pending: 0
                }}
                defaultCollapsed={false}
              />
            </div>
          </APIProvider>
        )}
      </div>

      {/* Bottom Horizontal Quick-Select Partner Domain Strip */}
      <div className="bg-zinc-950 border-t border-zinc-850 p-2.5 flex items-center gap-2 overflow-x-auto select-none scrollbar-thin">
        <span className="text-[8.5px] font-mono uppercase tracking-wider text-zinc-500 font-bold shrink-0 pl-1">
          Domains ({filteredPoints.length}):
        </span>

        {filteredPoints.map((pt) => {
          const clr = getComplianceColor(pt.effectiveStatus, pt.complianceScore);
          const isSelected = selectedPartnerId === pt.partner.id;

          return (
            <button
              key={`partner-chip-${pt.partner.id}`}
              type="button"
              onClick={() => handleFlyToPartner(pt)}
              className={`px-2.5 py-1 rounded-lg border text-[9px] font-mono font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                isSelected
                  ? "bg-indigo-950 text-white border-indigo-500 shadow-md scale-105"
                  : "bg-zinc-900/80 hover:bg-zinc-850 text-zinc-300 hover:text-white border-zinc-800"
              }`}
              title={`Pan to ${pt.partner.name} (${pt.city})`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${clr.bg}`} />
              <span className="truncate max-w-[110px]">{pt.partner.domain}</span>
              <span className={`px-1 py-0.2 rounded text-[7.5px] font-extrabold ${clr.badgeBg}`}>
                {pt.complianceScore}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
