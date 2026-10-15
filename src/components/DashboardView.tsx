import React, { useState, useEffect, useMemo } from "react";
import { jsPDF } from "jspdf";
import { Product, Partner, ScanJob, NotificationAlert } from "../types";
import { 
  Shield, ShieldAlert, ShieldCheck, CheckCircle, AlertTriangle, RefreshCw, Radio, Globe, Package2, Camera, 
  Bell, BellRing, Settings, Sliders, Play, Trash2, HelpCircle, Eye, Info, Sparkles, Zap, Users,
  TrendingUp, DollarSign, ArrowDownRight, ArrowUpRight, Plus, Terminal, Send, Check, Activity,
  Download, Map, Layers, Grid, MapPin, FileText, Filter, Flame, ZoomIn, ZoomOut, Copy,
  Search, ChevronDown, ChevronUp, Tag, ClipboardList, Calendar, User, Clock, X, Navigation, Building2, Target, RotateCcw
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";
import ViolationScreenshot from "./ViolationScreenshot";
import ComplianceD3Chart from "./ComplianceD3Chart";
import AggregatedComplianceHeatmap from "./AggregatedComplianceHeatmap";
import AggregatedComplianceHeatmapD3 from "./AggregatedComplianceHeatmapD3";
import GeographicalViolationHeatmapD3 from "./GeographicalViolationHeatmapD3";
import ComplianceAuditHistoryChart from "./ComplianceAuditHistoryChart";
import SkuBreachTimeline from "./SkuBreachTimeline";
import AlertDistributionTrendModule from "./AlertDistributionTrendModule";
import ComplianceHeatmapView from "./ComplianceHeatmapView";
import ChronologicalBreachTimelineView from "./ChronologicalBreachTimelineView";
import MapComplianceLegend from "./MapComplianceLegend";
import { APIProvider, Map as GoogleMap, AdvancedMarker, InfoWindow, useMap } from "@vis.gl/react-google-maps";

function MapController({ 
  center, 
  zoom, 
  onZoomChange,
  mapTypeId = "roadmap"
}: { 
  center: { lat: number, lng: number }, 
  zoom: number,
  onZoomChange: (z: number) => void,
  mapTypeId?: string
}) {
  const map = useMap();
  const onZoomChangeRef = React.useRef(onZoomChange);
  
  useEffect(() => {
    onZoomChangeRef.current = onZoomChange;
  });

  const lastAppliedRef = React.useRef<string>("");

  useEffect(() => {
    if (map) {
      const key = `${center.lat},${center.lng},${zoom}`;
      if (lastAppliedRef.current !== key) {
        map.panTo(center);
        map.setZoom(zoom);
        onZoomChange(zoom);
        lastAppliedRef.current = key;
      }
    }
  }, [map, center, zoom]);

  useEffect(() => {
    if (map && mapTypeId) {
      try {
        map.setMapTypeId(mapTypeId);
      } catch (e) {
        console.warn("Error setting mapTypeId:", e);
      }
    }
  }, [map, mapTypeId]);

  useEffect(() => {
    if (!map) return;
    
    const listener = map.addListener("zoom_changed", () => {
      const currentZoom = map.getZoom();
      if (typeof currentZoom === "number") {
        onZoomChangeRef.current(currentZoom);
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map]);

  return null;
}

interface CustomPeakLabelProps {
  x?: number;
  y?: number;
  index?: number;
  value?: any;
  payload?: any;
  trendData?: any[];
  chartMetric?: string;
}

function CustomPeakLabel(props: CustomPeakLabelProps) {
  const { x, y, index, value, payload, trendData, chartMetric } = props;
  const [isHovered, setIsHovered] = React.useState(false);

  if (chartMetric !== "violations") return null;
  if (index === undefined || !trendData || !trendData[index] || x === undefined || y === undefined) return null;

  // Check if this index is a high-severity violation peak
  // A peak is defined as: value >= 3 (high severity), strictly greater than previous, and >= next
  const isPeak = (idx: number, arr: any[]) => {
    if (idx < 0 || idx >= arr.length) return false;
    const val = arr[idx].violations;
    if (val < 3) return false;

    const prevVal = idx > 0 ? arr[idx - 1].violations : -1;
    const nextVal = idx < arr.length - 1 ? arr[idx + 1].violations : -1;

    return val > prevVal && val >= nextVal;
  };

  if (!isPeak(index, trendData)) return null;

  const dateStr = trendData[index].date;
  const count = trendData[index].violations;

  // Render a beautifully crafted interactive badge
  const boxWidth = 84;
  const boxHeight = 28;
  const rx = 6;
  
  // We offset the badge vertically above the peak dot
  const offsetY = isHovered ? 40 : 34;

  return (
    <g
      transform={`translate(${x}, ${y - offsetY})`}
      className="cursor-pointer select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Dynamic backdrop glow for high severity */}
      <rect
        x={-boxWidth / 2 - 4}
        y={-boxHeight / 2 - 4}
        width={boxWidth + 8}
        height={boxHeight + 8}
        rx={rx + 2}
        fill={isHovered ? "rgba(239, 68, 68, 0.35)" : "rgba(239, 68, 68, 0.15)"}
        className="transition-all duration-300 filter blur-[4px] pointer-events-none"
      />

      {/* Pill border & background container */}
      <rect
        x={-boxWidth / 2}
        y={-boxHeight / 2}
        width={boxWidth}
        height={boxHeight}
        rx={rx}
        fill="#09090b"
        stroke={isHovered ? "#f43f5e" : "#ef4444"}
        strokeWidth={isHovered ? 1.8 : 1.2}
        className="transition-all duration-300"
      />

      {/* Connection Indicator Dashed Line pointing down to the actual peak point */}
      <line
        x1={0}
        y1={boxHeight / 2}
        x2={0}
        y2={offsetY - 4}
        stroke={isHovered ? "#f43f5e" : "#ef4444"}
        strokeWidth={1.2}
        strokeDasharray="2,2"
        className="transition-all duration-300 pointer-events-none"
      />

      {/* Mini red radar dot in the label container */}
      <circle
        cx={-boxWidth / 2 + 8}
        y={0}
        r={2.5}
        fill="#ef4444"
        className={isHovered ? "animate-pulse" : ""}
      />

      {/* Display text: Date and Violation Count */}
      {/* Date */}
      <text
        x={4}
        y={-3}
        textAnchor="middle"
        fill={isHovered ? "#ffffff" : "#a1a1aa"}
        fontSize={8}
        fontWeight="bold"
        fontFamily="JetBrains Mono, SFMono-Regular, monospace"
        className="transition-colors duration-200"
      >
        {dateStr}
      </text>

      {/* Violation count */}
      <text
        x={4}
        y={7}
        textAnchor="middle"
        fill={isHovered ? "#fca5a5" : "#f87171"}
        fontSize={8}
        fontWeight="800"
        fontFamily="Inter, system-ui, sans-serif"
        className="transition-colors duration-200"
      >
        {count} BREACHES
      </text>
    </g>
  );
}

function ClusterMarker({ cluster }: { cluster: any }) {
  const map = useMap();
  const maxFreq = Math.max(...cluster.points.map((pt: any) => pt.frequencyRate));
  const violationsCount = cluster.points.reduce((sum: number, pt: any) => sum + pt.violatingScansWithPartner, 0);
  const totalCount = cluster.points.length;

  const isHigh = maxFreq > 50;
  const isMedium = maxFreq > 25 && maxFreq <= 50;
  const isLow = maxFreq > 0 && maxFreq <= 25;
  const isCompliant = maxFreq === 0;

  const handleClusterClick = () => {
    if (map) {
      map.panTo({ lat: cluster.lat, lng: cluster.lng });
      map.setZoom(Math.min(map.getZoom() + 2, 12));
    }
  };

  return (
    <div 
      className="relative flex items-center justify-center cursor-pointer group transition-transform duration-255 hover:scale-110"
      onClick={handleClusterClick}
    >
      {/* Expanding ping ring representing cluster risk */}
      {violationsCount > 0 && (
        <span className={`absolute inline-flex h-12 w-28 rounded-lg opacity-25 animate-ping duration-[3000ms] ${
          isHigh ? "bg-red-500" : isMedium ? "bg-amber-500" : "bg-orange-400"
        }`} />
      )}
      
      {/* Custom Branded Cluster Badge Pill */}
      <div className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-bold font-mono text-[10px] shadow-2xl transition-all duration-300 ${
        isHigh 
          ? "bg-red-950/95 border-red-500/80 text-red-300 shadow-red-950/50" 
          : isMedium 
            ? "bg-amber-950/95 border-amber-500/80 text-amber-300 shadow-amber-950/50" 
            : isLow 
              ? "bg-orange-950/95 border-orange-500/80 text-orange-300 shadow-orange-950/50"
              : "bg-emerald-950/95 border-emerald-500/80 text-emerald-300 shadow-emerald-950/50"
      }`}>
        {isHigh ? (
          <ShieldAlert className="w-3.5 h-3.5 text-red-500 animate-pulse shrink-0" />
        ) : isMedium ? (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        ) : isLow ? (
          <Shield className="w-3.5 h-3.5 text-orange-400 shrink-0" />
        ) : (
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        )}
        
        <span>{totalCount} Resellers</span>

        {/* Mini indicator flag for violation count */}
        {violationsCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-600 text-[8px] font-extrabold text-white border border-red-400 shadow animate-bounce">
            {violationsCount}
          </span>
        )}
      </div>

      {/* Cluster Rich Tooltip */}
      <div className="absolute z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full mb-2.5 left-1/2 -translate-x-1/2">
        <div className="bg-zinc-950/95 border border-zinc-800 text-slate-100 p-2.5 rounded-lg shadow-xl w-56 text-[10px] font-mono leading-normal backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-1 mb-1.5">
            <span className="text-white font-extrabold text-[10.5px] flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Cluster ({totalCount} Resellers)
            </span>
            <span className={`px-1 py-0.2 rounded text-[8px] font-bold ${
              isHigh 
                ? "bg-red-950 text-red-400 border border-red-900/40" 
                : isMedium 
                  ? "bg-amber-950 text-amber-400 border border-amber-900/40" 
                  : isCompliant 
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-900/40"
                    : "bg-orange-950 text-orange-400 border border-orange-900/40"
            }`}>
              {isHigh ? "HIGH RISK" : isMedium ? "MODERATE" : isCompliant ? "COMPLIANT" : "LOW RISK"}
            </span>
          </div>
          <div className="space-y-1 mb-1.5">
            {cluster.points.slice(0, 4).map((pt: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-[9px]">
                <span className="text-slate-300 truncate max-w-[125px]">{pt.partner.name}</span>
                <span className={`font-bold ${pt.frequencyRate > 50 ? "text-red-400" : pt.frequencyRate > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                  {pt.frequencyRate}%
                </span>
              </div>
            ))}
            {totalCount > 4 && (
              <div className="text-[8px] text-slate-500 italic text-right pr-1">
                + {totalCount - 4} more hubs
              </div>
            )}
          </div>
          <div className="border-t border-zinc-900/85 pt-1 flex justify-between text-[9px]">
            <span className="text-slate-400">Total Violations:</span>
            <span className="text-red-400 font-extrabold">{violationsCount}</span>
          </div>
          <div className="text-[8px] text-slate-400 mt-1 italic text-center border-t border-zinc-900/40 pt-1">
            🔍 Click cluster to zoom and focus
          </div>
        </div>
      </div>
    </div>
  );
}

// Mini Sparkline SVG component for Executive KPIs
interface KpiSparklineProps {
  data: number[];
  color: string;
  gradientId: string;
  height?: number;
  width?: number;
}

function KpiSparkline({ data, color, gradientId, height = 28, width = 88 }: KpiSparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const padding = 3;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return { x, y, val };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;
  const lastPoint = points[points.length - 1];

  return (
    <div className="flex flex-col items-end shrink-0 select-none">
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.45} />
            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#${gradientId})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={lastPoint.x} cy={lastPoint.y} r={3.5} fill={color} className="animate-ping" opacity={0.4} />
        <circle cx={lastPoint.x} cy={lastPoint.y} r={2} fill="#ffffff" stroke={color} strokeWidth={1} />
      </svg>
      <span className="text-[8px] font-mono text-slate-500 font-semibold tracking-tight uppercase">30D Trend</span>
    </div>
  );
}

interface DashboardViewProps {
  products: Product[];
  partners: Partner[];
  scans: ScanJob[];
  notifications?: NotificationAlert[];
  onTriggerScan: (productId: string) => void;
  onTriggerGlobalScan: () => void;
  isLoading: boolean;
  notificationThreshold?: number;
  setNotificationThreshold?: (val: number) => void;
  isNotificationEnabled?: boolean;
  setIsNotificationEnabled?: (val: boolean) => void;
  targetComplianceLevel?: number;
  setTargetComplianceLevel?: (val: number) => void;
  highVelocityThreshold?: number;
  setHighVelocityThreshold?: (val: number) => void;
}

export default function DashboardView({ 
  products, 
  partners, 
  scans, 
  notifications = [],
  onTriggerScan, 
  onTriggerGlobalScan, 
  isLoading,
  notificationThreshold = 80,
  setNotificationThreshold = () => {},
  isNotificationEnabled = true,
  setIsNotificationEnabled = () => {},
  targetComplianceLevel = 90,
  setTargetComplianceLevel = () => {},
  highVelocityThreshold = 8,
  setHighVelocityThreshold = () => {}
}: DashboardViewProps) {
  const [selectedViolation, setSelectedViolation] = useState<{
    product: string;
    partner: string;
    domain: string;
    map: number;
    found: number;
    url: string;
    time: string;
  } | null>(null);

  const [selectedSkuTrend, setSelectedSkuTrend] = useState<string>("1");
  const [gridMatrixMode, setGridMatrixMode] = useState<'partner-sku' | 'region-category'>('partner-sku');
  const [gridMetricType, setGridMetricType] = useState<'frequency' | 'count'>('frequency');
  const [hoveredGridCell, setHoveredGridCell] = useState<{ row: string; col: string } | null>(null);
  const [systemicHeatmapMode, setSystemicHeatmapMode] = useState<'regions' | 'domains'>('regions');
  const [hoveredSystemicCell, setHoveredSystemicCell] = useState<string | null>(null);
  const [chartMetric, setChartMetric] = useState<'violations' | 'compliance'>('violations');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookLogs, setWebhookLogs] = useState<string[]>([]);
  const [alertConfig, setAlertConfig] = useState({
    slack: true,
    email: true,
    sms: false
  });

  const [heatmapTab, setHeatmapTab] = useState<'regions' | 'categories' | 'channels'>('regions');
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Regional Compliance Heatmap Interactive States
  const [breachViewMode, setBreachViewMode] = useState<'timeline' | 'table'>('timeline');
  const [mapTypeId, setMapTypeId] = useState<"roadmap" | "hybrid" | "satellite" | "terrain">("roadmap");
  const [heatmapMetric, setHeatmapMetric] = useState<"count" | "variance">("count");
  const [selectedGeoRegion, setSelectedGeoRegion] = useState<string | null>(null);
  const [mapEngine, setMapEngine] = useState<'gmaps' | 'compliance-heatmap' | 'schematic' | 'd3-heatmap'>('gmaps');
  const [selectedPartnerPin, setSelectedPartnerPin] = useState<any | null>(null);
  const [hoveredPartnerPoint, setHoveredPartnerPoint] = useState<any | null>(null);
  const [copiedPartnerId, setCopiedPartnerId] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(3);
  const [mapOverlayLayer, setMapOverlayLayer] = useState<'heatmap' | 'pins' | 'territory'>('heatmap');
  const [isLayerDropdownOpen, setIsLayerDropdownOpen] = useState<boolean>(false);
  const [isClusteringEnabled, setIsClusteringEnabled] = useState<boolean>(true);
  const [showHistoricalOverlay, setShowHistoricalOverlay] = useState<boolean>(true);
  const [showViolationHeatmap, setShowViolationHeatmap] = useState<boolean>(true);
  const [showPartnerMarkers, setShowPartnerMarkers] = useState<boolean>(true);
  const [isLayerControlExpanded, setIsLayerControlExpanded] = useState<boolean>(false);
  const [isHeatmapLegendCollapsed, setIsHeatmapLegendCollapsed] = useState<boolean>(false);
  const [heatmapRadiusScale, setHeatmapRadiusScale] = useState<number>(1.2);
  const [heatmapIntensityMetric, setHeatmapIntensityMetric] = useState<"violations" | "frequency" | "activeViolations">("violations");
  const [mapSeverityFilters, setMapSeverityFilters] = useState<{
    high: boolean;
    medium: boolean;
    low: boolean;
    compliant: boolean;
  }>({
    high: true,
    medium: true,
    low: true,
    compliant: true
  });

  const [mapRegionFilter, setMapRegionFilter] = useState<string>("all");
  const [mapCategoryFilter, setMapCategoryFilter] = useState<string>("all");
  const [mapShowOnlyFlagged, setMapShowOnlyFlagged] = useState<boolean>(true);
  const [mapPriceDeltaFilter, setMapPriceDeltaFilter] = useState<number | "all">("all");

  // Map Search Bar Overlay States
  const [mapSearchQuery, setMapSearchQuery] = useState<string>("");
  const [isMapSearchFocused, setIsMapSearchFocused] = useState<boolean>(false);
  const [mapActiveJumpToast, setMapActiveJumpToast] = useState<{
    label: string;
    cityStateZip: string;
    lat: number;
    lng: number;
    type: "partner" | "city" | "zip";
  } | null>(null);
  const [mapSearchHighlight, setMapSearchHighlight] = useState<{
    label: string;
    cityStateZip?: string;
    lat: number;
    lng: number;
    type?: "partner" | "city" | "zip" | "custom";
    timestamp: number;
  } | null>(null);

  // Map Auto-Refresh Sweep Timer States
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<"off" | "5m" | "15m" | "30m">("off");
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [lastSweepTime, setLastSweepTime] = useState<Date | null>(new Date());
  const [isSweeping, setIsSweeping] = useState<boolean>(false);
  const [sweepFeedbackToast, setSweepFeedbackToast] = useState<string | null>(null);

  // 7-Day Density Trend Overlay States
  const [showTrendOverlay, setShowTrendOverlay] = useState<boolean>(false);

  const trendData7Days = useMemo(() => {
    const totalBreaches = partners && partners.length ? partners.filter(p => p.complianceStatus === 'violating' || p.complianceStatus === 'warning').length * 8 : 142;
    const baseAvg = Math.max(14, Math.round(totalBreaches / 5));

    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
      const idx = 6 - i;
      // Anomaly spike on 4th index (Fri or 3 days ago)
      const multiplier = idx === 4 ? 1.85 : idx === 6 ? 1.35 : idx === 2 ? 0.75 : (0.9 + (idx * 0.08));
      const density = Math.round(baseAvg * multiplier);
      const highRiskCount = Math.round(density * 0.44);
      const variance = Math.round((multiplier - 1) * 100);
      result.push({
        day: dayLabel,
        fullDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        density,
        highRiskCount,
        anomaly: idx === 4,
        varianceVal: variance,
        variance: `${variance > 0 ? '+' : ''}${variance}%`
      });
    }
    return result;
  }, [partners]);

  const triggerMapSweep = React.useCallback(() => {
    setIsSweeping(true);
    if (typeof onTriggerGlobalScan === "function") {
      onTriggerGlobalScan();
    }
    const now = new Date();
    setLastSweepTime(now);
    setSweepFeedbackToast(`Fresh map sweep executed at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`);
    
    const toastTimer = setTimeout(() => {
      setSweepFeedbackToast(null);
    }, 4500);

    const sweepTimer = setTimeout(() => {
      setIsSweeping(false);
    }, 1200);

    return () => {
      clearTimeout(toastTimer);
      clearTimeout(sweepTimer);
    };
  }, [onTriggerGlobalScan]);

  useEffect(() => {
    if (autoRefreshInterval === "off") {
      setSecondsRemaining(null);
      return;
    }

    const intervalSeconds = autoRefreshInterval === "5m" ? 300 : autoRefreshInterval === "15m" ? 900 : 1800;
    setSecondsRemaining(intervalSeconds);

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null || prev <= 1) {
          triggerMapSweep();
          return intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshInterval, triggerMapSweep]);

  const formatCountdown = (totalSecs: number | null) => {
    if (totalSecs === null) return "--:--";
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Compliance Audit Logs states
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logsSearchQuery, setLogsSearchQuery] = useState("");
  const [logsTypeFilter, setLogsTypeFilter] = useState("all");
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async (retries = 2) => {
    setIsLoadingLogs(true);
    for (let i = 0; i <= retries; i++) {
      try {
        const res = await fetch("/api/audit-logs");
        if (res.ok) {
          const data = await res.json();
          setAuditLogs(data);
          setIsLoadingLogs(false);
          return;
        }
      } catch (err) {
        if (i === retries) {
          console.error("Failed to fetch compliance audit logs:", err);
        } else {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    }
    setIsLoadingLogs(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [isLoading]);

  const getSeverityOfPoint = (point: any) => {
    const freq = point.frequencyRate;
    if (freq === 0) return "compliant";
    if (freq < 25) return "low";
    if (freq <= 50) return "medium";
    return "high";
  };

  const projectCoordsToSvg = (lat: number, lng: number) => {
    // Custom equirectangular projection optimized for our 200x100 viewBox
    const x = ((lng + 180) / 360) * 170 + 15;
    const y = (1 - (lat + 90) / 180) * 70 + 15;
    return { x, y };
  };

  const getGeodesicDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const dLat = lat1 - lat2;
    let dLng = lng1 - lng2;
    if (dLng > 180) dLng -= 360;
    if (dLng < -180) dLng += 360;
    return Math.sqrt(dLat * dLat + dLng * dLng);
  };

  const getMapClusters = (points: any[], zoom: number, enabled: boolean) => {
    if (!enabled || zoom >= 6) {
      return points.map((p, index) => ({
        id: `single-${p.partner.id || index}-${index}`,
        lat: p.lat,
        lng: p.lng,
        isCluster: false,
        points: [p]
      }));
    }

    let threshold = 3.5;
    if (zoom <= 1) threshold = 28;
    else if (zoom === 2) threshold = 16;
    else if (zoom === 3) threshold = 10;
    else if (zoom === 4) threshold = 6;
    else if (zoom === 5) threshold = 3.5;

    interface LocalCluster {
      id: string;
      lat: number;
      lng: number;
      isCluster: boolean;
      points: any[];
    }

    const clusters: LocalCluster[] = [];

    points.forEach(point => {
      let closestCluster: LocalCluster | null = null;
      let minDistance = Infinity;

      for (const c of clusters) {
        const dist = getGeodesicDistance(c.lat, c.lng, point.lat, point.lng);
        if (dist < minDistance) {
          minDistance = dist;
          closestCluster = c;
        }
      }

      if (closestCluster && minDistance < threshold) {
        closestCluster.points.push(point);
        closestCluster.isCluster = true;
        let sumLat = 0;
        let sumLng = 0;
        closestCluster.points.forEach(pt => {
          sumLat += pt.lat;
          sumLng += pt.lng;
        });
        closestCluster.lat = sumLat / closestCluster.points.length;
        closestCluster.lng = sumLng / closestCluster.points.length;
      } else {
        clusters.push({
          id: `cluster-${point.partner.id}-${clusters.length}`,
          lat: point.lat,
          lng: point.lng,
          isCluster: false,
          points: [point]
        });
      }
    });

    return clusters;
  };

  useEffect(() => {
    if (selectedPartnerPin) {
      const sev = getSeverityOfPoint(selectedPartnerPin);
      if (!mapSeverityFilters[sev as keyof typeof mapSeverityFilters]) {
        setSelectedPartnerPin(null);
      }
    }
  }, [mapSeverityFilters, selectedPartnerPin]);

  // Executive Printable PDF Report Customization States
  const [isExecutiveReportOpen, setIsExecutiveReportOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState("Corporate MAP Compliance & Regional Risk Audit");
  const [reportSignatory, setReportSignatory] = useState("Sarah Vance, Compliance Director");
  const [reportNotes, setReportNotes] = useState("Multi-channel protection surveillance indicates strong overall compliance rates of 90%+. High-variance pricing alerts continue to cluster around Amazon Marketplace authorized resellers and unofficial eBay hubs, warranting focused legal cease-and-desist escalations.");

  // AI Insights Panel States
  const [insights, setInsights] = useState<{
    summary: string;
    trends: string[];
    highRiskCategories: Array<{
      categoryName: string;
      riskScore: number;
      violationCount: number;
      reason: string;
    }>;
    actionableStrategies: Array<{
      title: string;
      targetCategory: string;
      actionStep: string;
      urgency: string;
    }>;
  } | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const handleFetchInsights = async (force = false) => {
    if (!force && (insights || isGeneratingInsights)) return;
    setIsGeneratingInsights(true);
    setInsightsError(null);
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch("/api/ai/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }
        const data = await res.json();
        setInsights(data);
        setIsGeneratingInsights(false);
        return;
      } catch (err) {
        if (attempt < 1) {
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }
        console.error("Failed fetching AI insights", err);
        setInsightsError((err as Error).message || "Unknown error generating insights.");
      }
    }
    setIsGeneratingInsights(false);
  };

  const handleDownloadRegionalHeatmapReport = () => {
    try {
      const doc = new jsPDF();
      const regions = ["United States", "Canada", "Europe", "APAC", "LATAM"];
      const categories = ["Computer Accessories", "Audio & Sound", "Gaming Gear", "Office Ergonomics"];

      let totalGlobalSweeps = 0;
      let totalGlobalBreaches = 0;
      let highestRiskRegion = "N/A";
      let highestRiskFrequency = -1;

      const regionalData = regions.map(reg => {
        let regSweeps = 0;
        let regBreaches = 0;
        
        const catDetails = categories.map(cat => {
          const stats = getRegionCategoryMetrics(reg, cat);
          regSweeps += stats.totalSweeps;
          regBreaches += stats.violationCount;
          totalGlobalSweeps += stats.totalSweeps;
          totalGlobalBreaches += stats.violationCount;

          let riskLevel = "COMPLIANT";
          if (stats.totalSweeps > 0) {
            if (stats.frequency > 50) riskLevel = "CRITICAL";
            else if (stats.frequency > 25) riskLevel = "MODERATE";
            else if (stats.frequency > 0) riskLevel = "LOW RISK";
          }

          return {
            category: cat,
            sweeps: stats.totalSweeps,
            breaches: stats.violationCount,
            frequency: stats.frequency,
            riskLevel
          };
        });

        const regFreq = regSweeps > 0 ? Math.round((regBreaches / regSweeps) * 100) : 0;
        if (regFreq > highestRiskFrequency) {
          highestRiskFrequency = regFreq;
          highestRiskRegion = reg;
        }

        return {
          region: reg,
          totalSweeps: regSweeps,
          totalBreaches: regBreaches,
          frequency: regFreq,
          categories: catDetails
        };
      });

      const avgGlobalCompliance = totalGlobalSweeps > 0 
        ? 100 - Math.round((totalGlobalBreaches / totalGlobalSweeps) * 100) 
        : 100;

      let y = 15;
      let pageNum = 1;

      const addHeader = (p: number) => {
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, 210, 8, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text("REGIONAL COMPLIANCE HEATMAP & HOTSPOT REPORT", 15, 5);
        doc.text(`PAGE ${p}`, 195, 5, { align: "right" });
      };

      addHeader(pageNum);
      y += 10;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text("Regional Breach Hotspot Summary", 15, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${new Date().toLocaleString()} • Brand Integrity Protection Division`, 15, y);
      y += 4;

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(15, y, 195, y);
      y += 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text("EXECUTIVE COMPLIANCE SUMMARY", 15, y);
      y += 5;

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, y, 180, 28, 1, 1, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, y, 180, 28, 'D');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("GLOBAL COMPLIANCE RATE:", 20, y + 8);
      doc.text("TOTAL MONITORED SWEEPS:", 20, y + 16);
      doc.text("TOTAL SPOTTED BREACHES:", 110, y + 8);
      doc.text("HIGHEST COMPLIANCE RISK ZONE:", 110, y + 16);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      
      if (avgGlobalCompliance >= 90) doc.setTextColor(16, 185, 129);
      else if (avgGlobalCompliance >= 75) doc.setTextColor(245, 158, 11);
      else doc.setTextColor(239, 68, 68);
      doc.text(`${avgGlobalCompliance}%`, 68, y + 8);

      doc.setTextColor(15, 23, 42);
      doc.text(`${totalGlobalSweeps} scans`, 68, y + 16);
      
      doc.setTextColor(239, 68, 68);
      doc.text(`${totalGlobalBreaches} instances`, 164, y + 8);
      
      doc.setTextColor(15, 23, 42);
      doc.text(`${highestRiskRegion} (${highestRiskFrequency}% Violation Rate)`, 164, y + 16);

      y += 36;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text("REGIONAL COMPLIANCE BREAKDOWN", 15, y);
      y += 6;

      regionalData.forEach(regData => {
        if (y > 220) {
          doc.addPage();
          pageNum++;
          addHeader(pageNum);
          y = 20;
        }

        doc.setFillColor(241, 245, 249);
        doc.rect(15, y, 180, 7, 'F');
        doc.setDrawColor(203, 213, 225);
        doc.rect(15, y, 180, 7, 'D');

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text(`TERRITORY: ${regData.region.toUpperCase()}`, 18, y + 5);

        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`Total Sweeps: ${regData.totalSweeps}   |   Breaches: ${regData.totalBreaches}   |   Territory Violation Rate: ${regData.frequency}%`, 90, y + 5);
        y += 7;

        doc.setFillColor(248, 250, 252);
        doc.rect(15, y, 180, 6, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(15, y, 180, 6, 'D');

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text("PRODUCT CATEGORY", 18, y + 4.5);
        doc.text("MONITORED SWEEPS", 90, y + 4.5);
        doc.text("SPOTTED BREACHES", 130, y + 4.5);
        doc.text("BREACH FREQUENCY (%)", 165, y + 4.5);
        y += 6;

        regData.categories.forEach(cat => {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85);
          doc.text(cat.category, 18, y + 5);
          doc.text(`${cat.sweeps} scans`, 90, y + 5);
          doc.text(`${cat.breaches}x`, 130, y + 5);

          if (cat.frequency === 0) {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(16, 185, 129);
            doc.text("0% (COMPLIANT)", 165, y + 5);
          } else if (cat.frequency <= 25) {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(245, 158, 11);
            doc.text(`${cat.frequency}% (LOW RISK)`, 165, y + 5);
          } else if (cat.frequency <= 50) {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(249, 115, 22);
            doc.text(`${cat.frequency}% (MODERATE)`, 165, y + 5);
          } else {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(239, 68, 68);
            doc.text(`${cat.frequency}% (CRITICAL)`, 165, y + 5);
          }

          doc.setDrawColor(241, 245, 249);
          doc.line(15, y + 7, 195, y + 7);
          y += 8;
        });

        y += 3;
      });

      if (y > 200) {
        doc.addPage();
        pageNum++;
        addHeader(pageNum);
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text("RECOMMENDED CURATIVE & POLICY ACTIONS", 15, y);
      y += 6;

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, y, 180, 36, 1, 1, 'F');
      doc.rect(15, y, 180, 36, 'D');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text("1. INCREASED SCAN CYCLES IN CRITICAL SECTORS", 18, y + 6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`Target any regional categories exceeding 25% breach frequency (especially in ${highestRiskRegion}) with high-frequency automated scans (6-hour intervals).`, 18, y + 11);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("2. INTEGRATION OF AUTOMATED WARNING LEGAL DISPATCHES", 18, y + 18);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Configure instant cease-and-desist alerts with regionalized policy layouts to notify non-compliant vendors directly upon detection.", 18, y + 23);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("3. RESELLER COMPLIANCE SCORECARD ALIGNMENTS", 18, y + 30);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Share regionalized compliance summaries with sales representatives to review reseller authorized allocations periodically.", 18, y + 35);

      y += 42;

      if (y > 250) {
        doc.addPage();
        pageNum++;
        addHeader(pageNum);
        y = 20;
      }

      doc.setDrawColor(226, 232, 240);
      doc.line(15, y, 195, y);
      y += 6;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text("REPORT CONFIDENTIALITY NOTICE", 15, y);
      y += 4;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      const disclaimer = "This report contains processed geospatial compliance data compiled chronologically to verify partner price integrity against Minimum Advertised Price (MAP) specifications. It is confidential, proprietary, and restricted to brand management or audit specialists. Redistribution or reproduction without prior approval is strictly prohibited.";
      const wrappedDisclaimer = doc.splitTextToSize(disclaimer, 180);
      doc.text(wrappedDisclaimer, 15, y);

      doc.save(`Regional_Compliance_Hotspot_Report_${new Date().toISOString().split('T')[0]}.pdf`);

      fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "audit_intelligence",
          message: "Downloaded Aggregated Compliance Heatmap Summary Report (PDF).",
          details: `Analyzed geographic regions. Identified highest risk zone: ${highestRiskRegion} (${highestRiskFrequency}%).`,
          user: "Compliance Officer"
        })
      }).catch(err => console.error(err));

    } catch (err) {
      console.error("Failed to generate regional compliance heatmap report:", err);
    }
  };

  useEffect(() => {
    handleFetchInsights();
  }, [products, partners, scans]); // Refresh insights when catalog state changes

  // Helper to map partner name and domain to standard regions
  const getRegionForPartnerName = (partner: string, domain: string) => {
    const d = domain.toLowerCase();
    const p = partner.toLowerCase();
    if (d.includes(".uk") || d.includes(".co.uk") || d.includes(".de") || d.includes(".fr") || d.includes(".eu") || p.includes("europe") || p.includes("uk")) {
      return "Europe";
    }
    if (d.includes(".jp") || d.includes(".cn") || d.includes(".au") || d.includes(".in") || p.includes("apac") || p.includes("asia") || p.includes("tokyo")) {
      return "APAC";
    }
    if (d.includes(".ca") || p.includes("canada") || p.includes("ca")) {
      return "Canada";
    }
    if (d.includes(".mx") || d.includes(".br") || d.includes(".ar") || p.includes("latam") || p.includes("brazil")) {
      return "LATAM";
    }
    return "United States"; // default regional hub
  };

  const API_KEY =
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
    (process.env as any)?.GOOGLE_MAPS_API_KEY ||
    (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
    "";
  const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

  const PARTNER_COORDINATES: Record<string, { lat: number, lng: number, city: string, zipCode: string }> = {
    "TechDelight Electronics": { lat: 44.88, lng: -93.28, city: "Richfield, MN", zipCode: "55423" }, // bestbuy.com
    "GizmoMart Online": { lat: 47.60, lng: -122.33, city: "Seattle, WA", zipCode: "98101" }, // amazon.com
    "NewEgg Partner World": { lat: 36.37, lng: -94.20, city: "Bentonville, AR", zipCode: "72712" }, // walmart.com
    "PixelPerfect Supplies": { lat: 44.98, lng: -93.26, city: "Minneapolis, MN", zipCode: "55401" }, // target.com
    "DiscountDepot Shop": { lat: 37.33, lng: -121.88, city: "San Jose, CA", zipCode: "95113" }, // ebay.com
  };

  const REGION_CENTERS: Record<string, { lat: number, lng: number }> = {
    "United States": { lat: 39.8283, lng: -98.5795 },
    "Canada": { lat: 56.1304, lng: -106.3468 },
    "Europe": { lat: 50.1109, lng: 8.6821 }, // Frankfurt
    "APAC": { lat: 22.3193, lng: 114.1694 }, // Hong Kong
    "LATAM": { lat: -15.7832, lng: -55.4915 } // Sao Paulo
  };

  const getPartnerLocation = (partnerName: string, domain: string) => {
    if (PARTNER_COORDINATES[partnerName]) {
      return PARTNER_COORDINATES[partnerName];
    }
    const region = getRegionForPartnerName(partnerName, domain);
    const center = REGION_CENTERS[region] || REGION_CENTERS["United States"];
    
    // Add a slight jitter/offset so multiple partners in the same region don't overlap completely
    const hash = partnerName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const jitterLat = ((hash % 100) / 100 - 0.5) * 5; // up to +/- 2.5 degrees
    const jitterLng = (((hash * 17) % 100) / 100 - 0.5) * 5;
    const generatedZip = `${10000 + (hash % 89999)}`;
    
    return {
      lat: center.lat + jitterLat,
      lng: center.lng + jitterLng,
      city: `${region} Reseller Hub`,
      zipCode: generatedZip
    };
  };

  const LOCATION_PRESETS = [
    { label: "Seattle, WA (98101)", city: "Seattle", state: "WA", zipCode: "98101", country: "United States", lat: 47.6062, lng: -122.3321 },
    { label: "Richfield, MN (55423)", city: "Richfield", state: "MN", zipCode: "55423", country: "United States", lat: 44.8800, lng: -93.2800 },
    { label: "Minneapolis, MN (55401)", city: "Minneapolis", state: "MN", zipCode: "55401", country: "United States", lat: 44.9778, lng: -93.2650 },
    { label: "Bentonville, AR (72712)", city: "Bentonville", state: "AR", zipCode: "72712", country: "United States", lat: 36.3729, lng: -94.2088 },
    { label: "San Jose, CA (95113)", city: "San Jose", state: "CA", zipCode: "95113", country: "United States", lat: 37.3382, lng: -121.8863 },
    { label: "San Francisco, CA (94102)", city: "San Francisco", state: "CA", zipCode: "94102", country: "United States", lat: 37.7749, lng: -122.4194 },
    { label: "Los Angeles, CA (90001)", city: "Los Angeles", state: "CA", zipCode: "90001", country: "United States", lat: 34.0522, lng: -118.2437 },
    { label: "New York, NY (10001)", city: "New York", state: "NY", zipCode: "10001", country: "United States", lat: 40.7128, lng: -74.0060 },
    { label: "Chicago, IL (60601)", city: "Chicago", state: "IL", zipCode: "60601", country: "United States", lat: 41.8781, lng: -87.6298 },
    { label: "Austin, TX (78701)", city: "Austin", state: "TX", zipCode: "78701", country: "United States", lat: 30.2672, lng: -97.7431 },
    { label: "Dallas, TX (75201)", city: "Dallas", state: "TX", zipCode: "75201", country: "United States", lat: 32.7767, lng: -96.7970 },
    { label: "Houston, TX (77001)", city: "Houston", state: "TX", zipCode: "77001", country: "United States", lat: 29.7604, lng: -95.3698 },
    { label: "Miami, FL (33101)", city: "Miami", state: "FL", zipCode: "33101", country: "United States", lat: 25.7617, lng: -80.1918 },
    { label: "Atlanta, GA (30301)", city: "Atlanta", state: "GA", zipCode: "30301", country: "United States", lat: 33.7490, lng: -84.3880 },
    { label: "Denver, CO (80202)", city: "Denver", state: "CO", zipCode: "80202", country: "United States", lat: 39.7392, lng: -104.9903 },
    { label: "Phoenix, AZ (85001)", city: "Phoenix", state: "AZ", zipCode: "85001", country: "United States", lat: 33.4484, lng: -112.0740 },
    { label: "Toronto, ON (M5V 2T6)", city: "Toronto", state: "ON", zipCode: "M5V 2T6", country: "Canada", lat: 43.6532, lng: -79.3832 },
    { label: "Vancouver, BC (V6B 1A1)", city: "Vancouver", state: "BC", zipCode: "V6B 1A1", country: "Canada", lat: 49.2827, lng: -123.1207 },
    { label: "London, UK (EC1A 1BB)", city: "London", country: "United Kingdom", zipCode: "EC1A 1BB", lat: 51.5074, lng: -0.1278 },
    { label: "Frankfurt, DE (60311)", city: "Frankfurt", country: "Germany", zipCode: "60311", lat: 50.1109, lng: 8.6821 },
    { label: "Tokyo, JP (100-0001)", city: "Tokyo", country: "Japan", zipCode: "100-0001", lat: 35.6762, lng: 139.6503 },
    { label: "Sydney, AU (2000)", city: "Sydney", country: "Australia", zipCode: "2000", lat: -33.8688, lng: 151.2093 }
  ];

  const mapSearchSuggestions = useMemo(() => {
    const q = mapSearchQuery.trim().toLowerCase();

    // 1. Match partners
    const matchedPartners = partners.map(p => {
      const loc = getPartnerLocation(p.name, p.domain);
      let activeViolationsCount = 0;
      (scans || []).forEach(scan => {
        if (scan.status === 'completed' && scan.items) {
          scan.items.forEach(item => {
            if (item.status === 'violating' && (item.partnerId === p.id || item.partnerName === p.name || item.partnerDomain === p.domain)) {
              activeViolationsCount++;
            }
          });
        }
      });
      return {
        id: `partner-${p.id}`,
        type: "partner" as const,
        label: p.name,
        sublabel: `${loc.city} ${loc.zipCode ? `(${loc.zipCode})` : ""} • ${p.domain}`,
        cityStateZip: `${loc.city} ${loc.zipCode || ""}`,
        lat: loc.lat,
        lng: loc.lng,
        partner: p,
        activeViolationsCount
      };
    }).filter(item => {
      if (!q) return true;
      return (
        item.label.toLowerCase().includes(q) ||
        item.sublabel.toLowerCase().includes(q) ||
        item.partner.domain.toLowerCase().includes(q)
      );
    });

    // 2. Match city & zip presets
    const matchedLocations = LOCATION_PRESETS.filter(loc => {
      if (!q) return true;
      return (
        loc.city.toLowerCase().includes(q) ||
        (loc.state && loc.state.toLowerCase().includes(q)) ||
        loc.zipCode.toLowerCase().includes(q) ||
        loc.country.toLowerCase().includes(q) ||
        loc.label.toLowerCase().includes(q)
      );
    }).map(loc => ({
      id: `loc-${loc.zipCode}-${loc.city}`,
      type: "location" as const,
      label: `${loc.city}${loc.state ? `, ${loc.state}` : ""}`,
      sublabel: `ZIP: ${loc.zipCode} • ${loc.country}`,
      cityStateZip: `${loc.city}, ${loc.state || ""} ${loc.zipCode}`,
      lat: loc.lat,
      lng: loc.lng,
      zipCode: loc.zipCode
    }));

    // 3. Dynamic Zip Code / City entry fallback
    const isCustomZip = /^\d{5}$/.test(q);
    let customZipOption = null;
    if (q.length >= 3 && !matchedLocations.some(l => l.zipCode?.toLowerCase() === q || l.label.toLowerCase() === q)) {
      let lat = 39.8283;
      let lng = -98.5795;
      if (isCustomZip) {
        const firstDigit = parseInt(q[0], 10);
        const lngBands = [-70, -73, -77, -84, -88, -92, -96, -100, -118, -122];
        lng = lngBands[firstDigit] || -98.5;
        lat = 32 + (parseInt(q[1], 10) || 4) * 1.5;
      }
      customZipOption = {
        id: `custom-${q}`,
        type: "custom" as const,
        label: isCustomZip ? `Jump to ZIP Code ${q}` : `Search Location "${mapSearchQuery}"`,
        sublabel: isCustomZip ? "US Postal District Coordinate Jump" : "Custom Location Search",
        cityStateZip: q,
        lat,
        lng
      };
    }

    return {
      partners: matchedPartners.slice(0, 5),
      locations: matchedLocations.slice(0, 6),
      customOption: customZipOption
    };
  }, [mapSearchQuery, partners, scans]);

  const handleMapJumpTo = (item: {
    label: string;
    cityStateZip?: string;
    lat: number;
    lng: number;
    partner?: any;
    zoom?: number;
  }) => {
    setHeatmapTab("regions");
    setMapEngine("gmaps");
    const targetZoom = item.zoom || 12;
    setMapCenterState({ lat: item.lat, lng: item.lng });
    setMapZoomState(targetZoom);
    setMapZoom(targetZoom);

    if (item.partner) {
      const loc = getPartnerLocation(item.partner.name, item.partner.domain);
      let totalScansWithPartner = 0;
      let violatingScansWithPartner = 0;
      (scans || []).forEach(scan => {
        if (scan.status === 'completed' && scan.items) {
          const match = scan.items.find(it => it.partnerId === item.partner.id);
          if (match) {
            totalScansWithPartner++;
            if (match.status === 'violating') violatingScansWithPartner++;
          }
        }
      });
      const frequencyRate = totalScansWithPartner > 0 ? Math.round((violatingScansWithPartner / totalScansWithPartner) * 100) : 0;
      setSelectedPartnerPin({
        partner: item.partner,
        ...loc,
        lat: item.lat,
        lng: item.lng,
        totalScansWithPartner,
        violatingScansWithPartner,
        frequencyRate
      });
    } else {
      setSelectedPartnerPin(null);
    }

    setMapActiveJumpToast({
      label: item.label,
      cityStateZip: item.cityStateZip || item.label,
      lat: item.lat,
      lng: item.lng,
      type: item.partner ? "partner" : "city"
    });

    setMapSearchHighlight({
      label: item.label,
      cityStateZip: item.cityStateZip || item.label,
      lat: item.lat,
      lng: item.lng,
      type: item.partner ? "partner" : "city",
      timestamp: Date.now()
    });

    setMapSearchQuery("");
    setIsMapSearchFocused(false);

    setTimeout(() => {
      setMapActiveJumpToast(null);
    }, 4500);
  };

  // Dynamically reposition the map viewport to encompass the geographic center of all current high-severity violation hotspots
  const handleCenterOnActiveViolations = () => {
    // 1. Recompute partner heat points
    const heatPoints = partners.map(partner => {
      const loc = getPartnerLocation(partner.name, partner.domain);
      let totalScansWithPartner = 0;
      let violatingScansWithPartner = 0;
      (scans || []).forEach(scan => {
        if (scan.status === 'completed' && scan.items) {
          const match = scan.items.find(item => item.partnerId === partner.id);
          if (match) {
            totalScansWithPartner++;
            if (match.status === 'violating') {
              violatingScansWithPartner++;
            }
          }
        }
      });
      const frequencyRate = totalScansWithPartner > 0 
        ? Math.round((violatingScansWithPartner / totalScansWithPartner) * 100)
        : 0;
      return {
        partner,
        ...loc,
        totalScansWithPartner,
        violatingScansWithPartner,
        frequencyRate
      };
    });

    // 2. Filter for high-severity violation hotspots
    const highSeverityHotspots = heatPoints.filter(point => {
      const sev = getSeverityOfPoint(point);
      const partnerActiveViolations = activeViolationsList.filter(
        v => v.partner === point.partner.name || v.domain === point.partner.domain
      );
      const hasHighActiveViolation = partnerActiveViolations.some(v => {
        const diff = v.map - v.found;
        const pct = Math.round((diff / v.map) * 100);
        return pct >= 15 || diff >= 50;
      });
      return (
        sev === "high" ||
        hasHighActiveViolation ||
        point.partner.complianceStatus === "violating" ||
        (point.violatingScansWithPartner > 1 && partnerActiveViolations.length > 0)
      );
    });

    // Fallback if no strict high severity exists
    const targetPoints = highSeverityHotspots.length > 0 
      ? highSeverityHotspots 
      : heatPoints.filter(point => {
          const hasActiveViolation = activeViolationsList.some(
            v => v.partner === point.partner.name || v.domain === point.partner.domain
          );
          return hasActiveViolation || point.violatingScansWithPartner > 0 || point.partner.complianceStatus === "warning";
        });

    const finalPoints = targetPoints.length > 0 ? targetPoints : heatPoints;

    if (finalPoints.length === 0) {
      setSweepFeedbackToast("No violation hotspots located on the current map.");
      return;
    }

    // 3. Calculate geographic center centroid and bounding box
    let minLat = 90;
    let maxLat = -90;
    let minLng = 180;
    let maxLng = -180;
    let sumLat = 0;
    let sumLng = 0;

    finalPoints.forEach(p => {
      sumLat += p.lat;
      sumLng += p.lng;
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
    });

    const centerLat = sumLat / finalPoints.length;
    const centerLng = sumLng / finalPoints.length;

    // 4. Calculate optimal dynamic zoom level to encompass hotspots
    const latSpan = Math.abs(maxLat - minLat);
    const lngSpan = Math.abs(maxLng - minLng);
    const maxSpan = Math.max(latSpan, lngSpan);

    let optimalZoom = 5;
    if (finalPoints.length === 1 || maxSpan < 0.2) {
      optimalZoom = 11;
    } else if (maxSpan < 0.8) {
      optimalZoom = 9;
    } else if (maxSpan < 2.5) {
      optimalZoom = 8;
    } else if (maxSpan < 6.0) {
      optimalZoom = 7;
    } else if (maxSpan < 15.0) {
      optimalZoom = 6;
    } else if (maxSpan < 30.0) {
      optimalZoom = 5;
    } else if (maxSpan < 60.0) {
      optimalZoom = 4;
    } else {
      optimalZoom = 3;
    }

    // 5. Update viewport state
    setHeatmapTab("regions");
    setMapEngine("gmaps");
    setMapCenterState({ lat: centerLat, lng: centerLng });
    setMapZoom(optimalZoom);
    setMapZoomState(optimalZoom);

    // 6. Trigger animated pulse ring on centroid
    setMapSearchHighlight({
      lat: centerLat,
      lng: centerLng,
      label: `Geographic Hotspot Centroid (${finalPoints.length} active high-severity hotspot${finalPoints.length === 1 ? '' : 's'})`,
      timestamp: Date.now()
    });

    // 7. Display toast feedback
    setMapActiveJumpToast({
      label: `Centered on ${finalPoints.length} High-Severity Hotspot${finalPoints.length === 1 ? '' : 's'}`,
      cityStateZip: `Centroid (${centerLat.toFixed(2)}°, ${centerLng.toFixed(2)}°) • Zoom: ${optimalZoom}x`,
      lat: centerLat,
      lng: centerLng,
      type: "city"
    });

    setTimeout(() => {
      setMapActiveJumpToast(null);
    }, 4500);
  };

  const REGION_MAP_PRESETS: Record<string, { lat: number, lng: number, zoom: number }> = {
    "us": { lat: 39.8283, lng: -98.5795, zoom: 4 },
    "ca": { lat: 56.1304, lng: -106.3468, zoom: 3 },
    "eu": { lat: 50.1109, lng: 8.6821, zoom: 4 },
    "apac": { lat: 15.3193, lng: 114.1694, zoom: 4 },
    "latam": { lat: -15.7832, lng: -55.4915, zoom: 3 }
  };

  // Helper to map partner to a standard retailer category
  const getCategoryForPartnerName = (partner: string, domain: string) => {
    const d = domain.toLowerCase();
    const p = partner.toLowerCase();
    if (d.includes("amazon") || d.includes("ebay") || d.includes("walmart") || p.includes("marketplace")) {
      return "Online Marketplaces";
    }
    if (d.includes("bestbuy") || d.includes("target") || d.includes("costco") || p.includes("wholesale")) {
      return "Big Box Retailers";
    }
    if (p.includes("liquidat") || p.includes("outlet") || p.includes("deal") || d.includes("sale") || d.includes("clearance")) {
      return "Liquidation Sites";
    }
    if (p.includes("audio") || p.includes("video") || p.includes("camera") || p.includes("gear") || p.includes("tech") || p.includes("pro")) {
      return "Specialty Electronics";
    }
    return "Authorized Distributors";
  };

  const getProductCategory = (productId: string): string => {
    if (productId === "1") return "Computer Accessories";
    if (productId === "2") return "Audio & Sound";
    if (productId === "3") return "Computer Accessories";
    if (productId === "4") return "Gaming Gear";
    if (productId === "5") return "Office Ergonomics";
    return "General Electronics";
  };

  const [mapCenterState, setMapCenterState] = useState<{ lat: number, lng: number } | null>(null);
  const [mapZoomState, setMapZoomState] = useState<number | null>(null);
  const [mapSensitivity, setMapSensitivity] = useState<'precise' | 'rapid'>('precise');

  const handleZoomIn = () => {
    const currentZoom = mapZoomState || mapZoom || REGION_MAP_PRESETS[selectedGeoRegion || "us"].zoom;
    const nextZoom = Math.min(currentZoom + 1, 20);
    setMapZoomState(nextZoom);
    setMapZoom(nextZoom);
  };

  const handleZoomOut = () => {
    const currentZoom = mapZoomState || mapZoom || REGION_MAP_PRESETS[selectedGeoRegion || "us"].zoom;
    const nextZoom = Math.max(currentZoom - 1, 1);
    setMapZoomState(nextZoom);
    setMapZoom(nextZoom);
  };

  const getZoomGranularityLabel = (zoomVal: number) => {
    if (zoomVal < 4) {
      return {
        label: "Global / Continental",
        detail: "Macro Overview",
        badgeColor: "text-indigo-400 bg-indigo-950/60 border-indigo-800/50"
      };
    } else if (zoomVal < 7) {
      return {
        label: "National / Regional",
        detail: "Country Granularity",
        badgeColor: "text-blue-400 bg-blue-950/60 border-blue-800/50"
      };
    } else if (zoomVal < 11) {
      return {
        label: "Metropolitan / State",
        detail: "State & Urban Metro",
        badgeColor: "text-cyan-400 bg-cyan-950/60 border-cyan-800/50"
      };
    } else if (zoomVal < 14) {
      return {
        label: "City / District",
        detail: "District Level",
        badgeColor: "text-amber-400 bg-amber-950/60 border-amber-800/50"
      };
    } else {
      return {
        label: "Street / Storefront",
        detail: "Local Merchant Level",
        badgeColor: "text-emerald-400 bg-emerald-950/60 border-emerald-800/50"
      };
    }
  };

  const [focusedPartnerId, setFocusedPartnerId] = useState<string | null>(null);

  const handleViolationClick = (violation: { partner: string; domain: string }) => {
    // 1. Change heatmap tab to regions to ensure the map is visible
    setHeatmapTab("regions");
    // 2. Change map engine to gmaps to show the Google map
    setMapEngine("gmaps");
    
    // 3. Find the partner details
    const partnerObj = partners.find(p => p.name === violation.partner || p.domain === violation.domain);
    if (!partnerObj) return;

    // Get location details
    const loc = getPartnerLocation(partnerObj.name, partnerObj.domain);
    
    // Compute total/violating scans
    let totalScansWithPartner = 0;
    let violatingScansWithPartner = 0;
    (scans || []).forEach(scan => {
      if (scan.status === 'completed' && scan.items) {
        const match = scan.items.find(item => item.partnerId === partnerObj.id);
        if (match) {
          totalScansWithPartner++;
          if (match.status === 'violating') {
            violatingScansWithPartner++;
          }
        }
      }
    });
    const frequencyRate = totalScansWithPartner > 0 
      ? Math.round((violatingScansWithPartner / totalScansWithPartner) * 100)
      : 0;

    const pin = {
      partner: partnerObj,
      ...loc,
      totalScansWithPartner,
      violatingScansWithPartner,
      frequencyRate
    };

    // 4. Update selected region to match partner's region
    const partnerRegionName = getRegionForPartnerName(partnerObj.name, partnerObj.domain);
    const partnerRegionId = partnerRegionName === "United States" ? "us" :
                            partnerRegionName === "Canada" ? "ca" :
                            partnerRegionName === "Europe" ? "eu" :
                            partnerRegionName === "APAC" ? "apac" : "latam";

    // Update state to focus this pin and center map
    setFocusedPartnerId(partnerObj.id);
    setSelectedGeoRegion(partnerRegionId);
    setSelectedPartnerPin(pin);
    setMapCenterState({ lat: loc.lat, lng: loc.lng });
    setMapZoomState(12);

    // 5. Scroll to the map view container if possible, so user gets immediate visual feedback
    const mapElement = document.querySelector(".google-map-heatmap-view");
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  useEffect(() => {
    if (focusedPartnerId) {
      const partnerObj = partners.find(p => p.id === focusedPartnerId);
      if (partnerObj) {
        const partnerRegionName = getRegionForPartnerName(partnerObj.name, partnerObj.domain);
        const partnerRegionId = partnerRegionName === "United States" ? "us" :
                                partnerRegionName === "Canada" ? "ca" :
                                partnerRegionName === "Europe" ? "eu" :
                                partnerRegionName === "APAC" ? "apac" : "latam";
        if (selectedGeoRegion !== partnerRegionId) {
          setMapCenterState(null);
          setMapZoomState(null);
          setSelectedPartnerPin(null);
          setFocusedPartnerId(null);
        }
      }
    } else {
      setMapCenterState(null);
      setMapZoomState(null);
      setSelectedPartnerPin(null);
    }
  }, [selectedGeoRegion]);

  const [isExporting, setIsExporting] = useState<string | null>(null);

  const escapeCSV = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    const replaced = str.replace(/"/g, '""');
    if (replaced.includes(',') || replaced.includes('\n') || replaced.includes('\r') || replaced.includes('"')) {
      return `"${replaced}"`;
    }
    return replaced;
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportComplianceReport = () => {
    setIsExporting("executive-compliance-report");
    setTimeout(() => {
      try {
        const headers = [
          ["Compliance Executive Summary", ""],
          ["Overall Compliance Health Score", `${complianceHealthScore}%`],
          ["Total Monitored SKUs", totalProducts.toString()],
          ["Fully Compliant SKUs", compliantProductsCount.toString()],
          ["Violating SKUs", (totalProducts - compliantProductsCount).toString()],
          ["Total Active SKU Violations Spotted Across Partners", activeViolationsList.length.toString()],
          ["Report Generated At", new Date().toLocaleString()],
          [], // spacer
          ["PRODUCT VIOLATIONS DETAILED LEDGER"],
          [
            "Product SKU",
            "Product Name",
            "Reseller Partner",
            "Storefront Domain",
            "MAP Floor Price ($)",
            "Detected Price ($)",
            "Violation Variance Amount ($)",
            "Variance Percent (%)",
            "Live Evidence Source Link",
            "Detection Timestamp"
          ]
        ];

        const dataRows = activeViolationsList.map(v => {
          const matchingProduct = products.find(p => p.name === v.product);
          const sku = matchingProduct ? matchingProduct.sku : "N/A";
          const diff = v.map - v.found;
          const varianceAmount = diff > 0 ? diff.toFixed(2) : "0.00";
          const variancePercent = diff > 0 ? `${Math.round((diff / v.map) * 100)}%` : "0%";
          return [
            sku,
            v.product,
            v.partner,
            v.domain,
            v.map.toFixed(2),
            v.found.toFixed(2),
            varianceAmount,
            variancePercent,
            v.url,
            v.time ? new Date(v.time).toISOString() : "N/A"
          ];
        });

        const csvContent = [
          ...headers.map(row => row.map(cell => escapeCSV(cell)).join(",")),
          ...dataRows.map(row => row.map(cell => escapeCSV(cell)).join(","))
        ].join("\n");

        downloadCSV(csvContent, `compliance-executive-report-${new Date().toISOString().split('T')[0]}.csv`);
      } catch (err) {
        console.error("Compliance Report export failed:", err);
      } finally {
        setIsExporting(null);
      }
    }, 500);
  };

  const handleExportUnifiedLedger = () => {
    setIsExporting("unified");
    setTimeout(() => {
      const latestScansMap: { [productId: string]: ScanJob } = {};
      const sorted = [...scans].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      sorted.forEach(scan => {
        if (!latestScansMap[scan.productId]) {
          latestScansMap[scan.productId] = scan;
        }
      });

      const headers = [
        "Product SKU",
        "Product Name",
        "MAP Floor Price ($)",
        "Retail Partner Name",
        "Storefront Domain",
        "Contact Email",
        "Last Detected Price ($)",
        "Variance Amount ($)",
        "Variance Percent (%)",
        "Compliance Status",
        "Live Verified URL",
        "Audit Date"
      ];

      const rows: string[][] = [];

      products.forEach(product => {
        const latestScan = latestScansMap[product.id];
        const partnerEmailMap: { [pId: string]: string } = {};
        partners.forEach(partner => {
          partnerEmailMap[partner.id] = partner.contactEmail;
        });

        if (latestScan && latestScan.items && latestScan.items.length > 0) {
          latestScan.items.forEach(item => {
            let varianceAmount = "";
            let variancePercent = "";
            if (item.detectedPrice !== null) {
              const scanMapPrice = latestScan.mapPrice || product?.mapPrice || 0;
              const diff = scanMapPrice - item.detectedPrice;
              varianceAmount = diff > 0 ? diff.toFixed(2) : "0.00";
              variancePercent = diff > 0 && scanMapPrice > 0 ? `${Math.round((diff / scanMapPrice) * 100)}` : "0";
            } else {
              varianceAmount = "N/A";
              variancePercent = "N/A";
            }

            rows.push([
              product.sku,
              product.name,
              (latestScan.mapPrice ?? product?.mapPrice ?? 0).toFixed(2),
              item.partnerName,
              item.partnerDomain,
              partnerEmailMap[item.partnerId] || "N/A",
              item.detectedPrice !== null ? item.detectedPrice.toFixed(2) : "N/A",
              varianceAmount,
              variancePercent,
              item.status.toUpperCase(),
              item.detectedUrl || "N/A",
              new Date(latestScan.startedAt).toISOString()
            ]);
          });
        } else {
          partners.forEach(partner => {
            rows.push([
              product.sku,
              product.name,
              (product?.mapPrice ?? 0).toFixed(2),
              partner.name,
              partner.domain,
              partner.contactEmail,
              "N/A",
              "N/A",
              "N/A",
              "UNAUDITED",
              "N/A",
              "NEVER"
            ]);
          });
        }
      });

      const csvContent = [
        headers.map(h => escapeCSV(h)).join(","),
        ...rows.map(row => row.map(cell => escapeCSV(cell)).join(","))
      ].join("\n");

      downloadCSV(csvContent, `compliance-unified-ledger-${new Date().toISOString().split('T')[0]}.csv`);
      setIsExporting(null);
    }, 500);
  };

  const handleExportProductsSummary = () => {
    setIsExporting("products");
    setTimeout(() => {
      const latestScansMap: { [productId: string]: ScanJob } = {};
      const sorted = [...scans].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      sorted.forEach(scan => {
        if (!latestScansMap[scan.productId]) {
          latestScansMap[scan.productId] = scan;
        }
      });

      const headers = [
        "Product SKU",
        "Product Name",
        "MAP Floor Price ($)",
        "Total Partners Audited",
        "Compliant Partners",
        "Violating Partners",
        "Compliance Score (%)",
        "Status",
        "Last Audited At"
      ];

      const rows: string[][] = [];

      products.forEach(product => {
        const latestScan = latestScansMap[product.id];
        if (latestScan && latestScan.items) {
          const total = latestScan.items.length;
          const compliant = latestScan.items.filter(i => i.status === "compliant").length;
          const violating = latestScan.items.filter(i => i.status === "violating").length;
          const score = total > 0 ? Math.round((compliant / total) * 100) : 100;
          const status = violating > 0 ? "INFRINGED" : total > 0 ? "COMPLIANT" : "IDLE";
          
          rows.push([
            product.sku,
            product.name,
            product.mapPrice.toFixed(2),
            total.toString(),
            compliant.toString(),
            violating.toString(),
            `${score}`,
            status,
            new Date(latestScan.startedAt).toISOString()
          ]);
        } else {
          rows.push([
            product.sku,
            product.name,
            product.mapPrice.toFixed(2),
            "0",
            "0",
            "0",
            "0",
            "UNAUDITED",
            "NEVER"
          ]);
        }
      });

      const csvContent = [
        headers.map(h => escapeCSV(h)).join(","),
        ...rows.map(row => row.map(cell => escapeCSV(cell)).join(","))
      ].join("\n");

      downloadCSV(csvContent, `compliance-products-summary-${new Date().toISOString().split('T')[0]}.csv`);
      setIsExporting(null);
    }, 500);
  };

  const handleExportPartnersSummary = () => {
    setIsExporting("partners");
    setTimeout(() => {
      const latestScansMap: { [productId: string]: ScanJob } = {};
      const sorted = [...scans].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      sorted.forEach(scan => {
        if (!latestScansMap[scan.productId]) {
          latestScansMap[scan.productId] = scan;
        }
      });

      const latestScans = Object.values(latestScansMap);

      const headers = [
        "Partner Name",
        "Storefront Domain",
        "Contact Email",
        "Total Products Monitored",
        "Compliant Products",
        "Violations Found",
        "Compliance Score (%)",
        "Status"
      ];

      const rows: string[][] = [];

      partners.forEach(partner => {
        let totalChecked = 0;
        let compliant = 0;
        let violating = 0;

        latestScans.forEach(scan => {
          const matchingItem = scan.items.find(item => item.partnerId === partner.id);
          if (matchingItem) {
            totalChecked++;
            if (matchingItem.status === "compliant") {
              compliant++;
            } else if (matchingItem.status === "violating") {
              violating++;
            }
          }
        });

        const score = (compliant + violating) > 0 ? Math.round((compliant / (compliant + violating)) * 100) : 100;
        const status = violating > 0 ? "HAS_VIOLATIONS" : totalChecked > 0 ? "FULLY_COMPLIANT" : "IDLE";

        rows.push([
          partner.name,
          partner.domain,
          partner.contactEmail,
          totalChecked.toString(),
          compliant.toString(),
          violating.toString(),
          `${score}`,
          status
        ]);
      });

      const csvContent = [
        headers.map(h => escapeCSV(h)).join(","),
        ...rows.map(row => row.map(cell => escapeCSV(cell)).join(","))
      ].join("\n");

      downloadCSV(csvContent, `compliance-partners-summary-${new Date().toISOString().split('T')[0]}.csv`);
      setIsExporting(null);
    }, 500);
  };

  const handleExportData = (type: 'scans' | 'skus', format: 'json' | 'csv') => {
    setIsExporting(`${type}-${format}`);
    setTimeout(() => {
      try {
        if (format === 'json') {
          let jsonStr = "";
          let filename = "";
          if (type === 'scans') {
            jsonStr = JSON.stringify(scans, null, 2);
            filename = `compliance-scan-history-${new Date().toISOString().split('T')[0]}.json`;
          } else {
            jsonStr = JSON.stringify(products, null, 2);
            filename = `sku-list-${new Date().toISOString().split('T')[0]}.json`;
          }
          const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", filename);
          link.style.visibility = "hidden";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          // CSV Format
          if (type === 'scans') {
            const skuMap: { [pId: string]: string } = {};
            products.forEach(p => { skuMap[p.id] = p.sku; });

            const headers = [
              "Scan ID",
              "Product SKU",
              "Product Name",
              "MAP Price ($)",
              "Scan Status",
              "Started At",
              "Finished At",
              "Total Partners Audited",
              "Violations Detected"
            ];
            const rows = scans.map(scan => {
              const sku = skuMap[scan.productId] || "N/A";
              const totalItems = scan.items ? scan.items.length : 0;
              const violations = scan.items ? scan.items.filter(i => i.status === 'violating').length : 0;
              return [
                scan.id,
                sku,
                scan.productName,
                scan.mapPrice.toFixed(2),
                scan.status.toUpperCase(),
                scan.startedAt ? new Date(scan.startedAt).toISOString() : "N/A",
                scan.finishedAt ? new Date(scan.finishedAt).toISOString() : "N/A",
                totalItems.toString(),
                violations.toString()
              ];
            });
            const csvContent = [
              headers.map(h => escapeCSV(h)).join(","),
              ...rows.map(row => row.map(cell => escapeCSV(cell)).join(","))
            ].join("\n");
            downloadCSV(csvContent, `compliance-scan-history-${new Date().toISOString().split('T')[0]}.csv`);
          } else {
            const headers = [
              "Product ID",
              "Product SKU",
              "Product Name",
              "MAP Price ($)",
              "Description"
            ];
            const rows = products.map(product => [
              product.id,
              product.sku,
              product.name,
              product.mapPrice.toFixed(2),
              product.description || ""
            ]);
            const csvContent = [
              headers.map(h => escapeCSV(h)).join(","),
              ...rows.map(row => row.map(cell => escapeCSV(cell)).join(","))
            ].join("\n");
            downloadCSV(csvContent, `sku-list-${new Date().toISOString().split('T')[0]}.csv`);
          }
        }
      } catch (err) {
        console.error("Export failed:", err);
      } finally {
        setIsExporting(null);
      }
    }, 400);
  };

  // Query-parsed trendline loader to build smooth 30 Days timeline data combining real check runs with progressive baselines
  const generateTrendData = (productId: string) => {
    const data = [];
    const today = new Date();
    
    // Seed different baseline patterns to keep charts extremely professional and non-flat
    const defaultViolationsPattern = productId === "1" 
      ? [5, 6, 4, 5, 3, 4, 3, 4, 2, 3, 2, 1, 3, 1, 2, 1, 2, 0, 1, 1, 2, 1, 0, 1, 1, 0, 1, 1, 1, 0] // Apex Pro
      : productId === "2"
      ? [8, 7, 8, 6, 7, 5, 6, 4, 5, 3, 4, 4, 2, 3, 2, 1, 2, 2, 1, 1, 2, 1, 1, 1, 0, 1, 1, 0, 0, 0] // SoundWave
      : [6, 5, 5, 4, 3, 4, 3, 3, 2, 3, 2, 1, 2, 1, 1, 2, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1]; // Fallback

    const defaultCompliancePattern = defaultViolationsPattern.map(v => {
      const totalChecked = 8;
      const compl = totalChecked - v;
      return Math.round((compl / totalChecked) * 100);
    });

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const yyyymmdd = d.toISOString().split("T")[0];
      
      const realScansOnDay = scans.filter(s => {
        const scanDate = new Date(s.startedAt);
        const matchesDate = scanDate.toISOString().split("T")[0] === yyyymmdd;
        const matchesProduct = s.productId === productId;
        return matchesDate && matchesProduct;
      });
      
      if (realScansOnDay.length > 0) {
        let violations = 0;
        let compliant = 0;
        let totalChecked = 0;
        
        realScansOnDay.forEach(scan => {
          scan.items.forEach(item => {
            totalChecked++;
            if (item.status === 'violating') {
              violations++;
            } else if (item.status === 'compliant') {
              compliant++;
            }
          });
        });
        
        const complianceRate = totalChecked > 0 ? Math.round((compliant / totalChecked) * 100) : 100;
        data.push({
          date: label,
          violations: violations,
          compliance: complianceRate,
          isReal: true
        });
      } else {
        const idx = 29 - i;
        data.push({
          date: label,
          violations: defaultViolationsPattern[idx] || 0,
          compliance: defaultCompliancePattern[idx] || 100,
          isReal: false
        });
      }
    }
    
    return data;
  };

  // Compute 30 Days overall ecosystem-wide compliance health score trend
  const generateGlobalTrendData = () => {
    const data = [];
    const today = new Date();
    
    // Smooth seed curve ending at the current complianceHealthScore
    const baselinePoints = [
      65, 68, 67, 70, 72, 70, 74, 75, 73, 76, 
      78, 77, 80, 81, 79, 82, 84, 82, 85, 86, 
      85, 88, 89, 87, 90, 91, 90, 92, 91, complianceHealthScore
    ];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const yyyymmdd = d.toISOString().split("T")[0];
      
      const scansUpToDate = scans.filter(s => {
        const scanDate = new Date(s.startedAt);
        return scanDate.toISOString().split("T")[0] <= yyyymmdd;
      });

      if (scansUpToDate.length > 0) {
        const latestScanForProduct: { [productId: string]: ScanJob } = {};
        const sortedScansSelected = [...scansUpToDate].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
        sortedScansSelected.forEach(scan => {
          if (!latestScanForProduct[scan.productId]) {
            latestScanForProduct[scan.productId] = scan;
          }
        });

        const totalProdsCount = products.length || 1;
        const compliantProdsCount = products.filter(product => {
          const lastScan = latestScanForProduct[product.id];
          if (!lastScan || !lastScan.items) return true;
          return !lastScan.items.some(item => item.status === "violating");
        }).length;

        const dailyHealthScore = Math.round((compliantProdsCount / totalProdsCount) * 100);

        data.push({
          date: label,
          healthScore: dailyHealthScore,
          isReal: true
        });
      } else {
        const idx = 29 - i;
        data.push({
          date: label,
          healthScore: baselinePoints[idx] !== undefined ? baselinePoints[idx] : complianceHealthScore,
          isReal: false
        });
      }
    }
    return data;
  };

  const totalPartners = partners.length;
  const totalProducts = products.length;

  // Calculate Scan Health over the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const scansLast24h = scans.filter(s => new Date(s.startedAt) >= oneDayAgo);
  const useScans = scansLast24h.length > 0 ? scansLast24h : scans;
  const totalScans24h = useScans.length;
  const completedScans24h = useScans.filter(s => s.status === "completed").length;
  const failedScans24h = useScans.filter(s => s.status === "failed" || (s.status !== "running" && s.status !== "completed")).length;
  
  const scanSuccessRate = totalScans24h > 0 
    ? Math.round((completedScans24h / totalScans24h) * 100) 
    : 100;
  const scanFailureRate = totalScans24h > 0 
    ? Math.round((failedScans24h / totalScans24h) * 100) 
    : 0;
  
  // Find latest state for each partner x product combination to compute overall compliance
  const lastScanForEachProduct: { [productId: string]: ScanJob } = {};
  const sortedScans = [...scans].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  
  sortedScans.forEach(scan => {
    if (!lastScanForEachProduct[scan.productId]) {
      lastScanForEachProduct[scan.productId] = scan;
    }
  });

  let totalCheckedPoints = 0;
  let compliantPoints = 0;
  let violationPoints = 0;
  const activeViolationsList: { product: string; partner: string; domain: string; map: number; found: number; url: string; time: string }[] = [];

  Object.values(lastScanForEachProduct).forEach(scan => {
    scan.items.forEach(item => {
      totalCheckedPoints++;
      if (item.status === 'compliant') {
        compliantPoints++;
      } else if (item.status === 'violating') {
        violationPoints++;
        activeViolationsList.push({
          product: scan.productName,
          partner: item.partnerName,
          domain: item.partnerDomain,
          map: scan.mapPrice,
          found: item.detectedPrice || 0,
          url: item.detectedUrl || "#",
          time: scan.startedAt
        });
      }
    });
  });

  const complianceRate = totalCheckedPoints > 0 
    ? Math.round((compliantPoints / (compliantPoints + violationPoints)) * 100) 
    : 100;

  // Compliance Health Score: based on ratio of compliant (non-violating) products to total items (SKUs)
  const compliantProductsCount = products.filter(product => {
    const lastScan = lastScanForEachProduct[product.id];
    if (!lastScan || !lastScan.items) return true;
    return !lastScan.items.some(item => item.status === "violating");
  }).length;

  const complianceHealthScore = totalProducts > 0 
    ? Math.round((compliantProductsCount / totalProducts) * 100) 
    : 100;

  // Pending High-Severity Violations calculation (price drop >= 15% or high/critical risk partner)
  const pendingHighSeverityViolations = activeViolationsList.filter(v => {
    const variancePct = Math.round(((v.map - v.found) / v.map) * 100);
    const partnerObj = partners.find(p => p.name === v.partner || p.domain === v.domain);
    return variancePct >= 15 || partnerObj?.riskSensitivity === 'high' || partnerObj?.riskSensitivity === 'critical';
  });
  const pendingHighSeverityCount = pendingHighSeverityViolations.length;

  // 30-Day Sparkline Trendline Datasets for Executive KPIs
  const partnerGrowth30DData = useMemo(() => {
    const pts: number[] = [];
    const base = Math.max(1, totalPartners - 4);
    for (let i = 0; i < 30; i++) {
      if (i < 8) pts.push(base);
      else if (i < 15) pts.push(base + 1);
      else if (i < 22) pts.push(base + 2);
      else if (i < 27) pts.push(base + 3);
      else if (i < 29) pts.push(Math.max(base, totalPartners - 1));
      else pts.push(totalPartners);
    }
    return pts;
  }, [totalPartners]);

  const healthTrend30DData = useMemo(() => {
    const globalData = generateGlobalTrendData();
    if (globalData && globalData.length > 0) {
      return globalData.map(d => d.healthScore);
    }
    return Array(30).fill(complianceHealthScore);
  }, [complianceHealthScore, products, scans]);

  const pendingViolations30DData = useMemo(() => {
    const base = pendingHighSeverityCount;
    return [
      Math.max(0, base + 2), base + 1, base + 3, base + 2, base, Math.max(0, base - 1),
      base + 1, base + 2, base + 4, base + 3, base + 2, base + 1, base,
      base + 2, base + 3, base + 1, base, base + 2, base + 1, base,
      base + 1, base + 2, base + 3, base + 2, base + 1, base + 1, base,
      Math.max(0, base - 1), base + 1, base
    ];
  }, [pendingHighSeverityCount]);

  // Helper to compute maximum detected price delta ($ under MAP) for a given map point
  const getPointMaxPriceDelta = (point: any): number => {
    // 1. Check active violations for this partner
    const partnerActiveViolations = activeViolationsList.filter(
      v => v.partner === point.partner.name || v.domain === point.partner.domain
    );
    let maxDelta = 0;
    partnerActiveViolations.forEach(v => {
      const diff = v.map - v.found;
      if (diff > maxDelta) maxDelta = diff;
    });

    // 2. Also check scans for this partner if maxDelta is 0
    if (maxDelta === 0) {
      (scans || []).forEach(scan => {
        if (scan.status === 'completed' && scan.items) {
          const match = scan.items.find(
            item => item.partnerId === point.partner.id || 
                    item.partnerName === point.partner.name || 
                    item.partnerDomain === point.partner.domain
          );
          if (match && match.status === 'violating' && match.detectedPrice !== null && match.detectedPrice !== undefined) {
            const diff = scan.mapPrice - match.detectedPrice;
            if (diff > maxDelta) maxDelta = diff;
          }
        }
      });
    }

    // 3. Fallback estimate for synthetic violating partners if zero
    if (maxDelta === 0 && point.violatingScansWithPartner > 0) {
      maxDelta = point.frequencyRate >= 50 ? 55 : point.frequencyRate >= 25 ? 25 : 12;
    }

    return maxDelta;
  };

  // Automatically re-center map view on the cluster of active partner locations whenever the severity filter is toggled
  useEffect(() => {
    const activePoints = partners.map(partner => {
      const loc = getPartnerLocation(partner.name, partner.domain);
      
      let totalScansWithPartner = 0;
      let violatingScansWithPartner = 0;
      
      (scans || []).forEach(scan => {
        if (scan.status === 'completed' && scan.items) {
          const match = scan.items.find(item => item.partnerId === partner.id);
          if (match) {
            totalScansWithPartner++;
            if (match.status === 'violating') {
              violatingScansWithPartner++;
            }
          }
        }
      });
      
      const frequencyRate = totalScansWithPartner > 0 
        ? Math.round((violatingScansWithPartner / totalScansWithPartner) * 100)
        : 0;
        
      return {
        partner,
        ...loc,
        totalScansWithPartner,
        violatingScansWithPartner,
        frequencyRate
      };
    }).filter(point => {
      // 1. Severity filter
      const sev = getSeverityOfPoint(point);
      if (!mapSeverityFilters[sev as keyof typeof mapSeverityFilters]) return false;

      // 2. Partner region filter
      if (mapRegionFilter !== "all") {
        const region = getRegionForPartnerName(point.partner.name, point.partner.domain);
        if (region !== mapRegionFilter) return false;
      }

      // 3. Product category filter
      if (mapCategoryFilter !== "all") {
        const partnerProductIds = point.partner.associatedProducts || [];
        const hasProductInSelectedCategory = partnerProductIds.some((pId: string) => {
          const cat = getProductCategory(pId);
          return cat === mapCategoryFilter;
        });
        if (!hasProductInSelectedCategory) return false;
      }

      // 4. Currently flagged for MAP violations filter
      if (mapShowOnlyFlagged) {
        const hasActiveViolation = activeViolationsList.some(
          v => v.partner === point.partner.name || v.domain === point.partner.domain
        );
        if (!hasActiveViolation) return false;
      }

      // 5. Price delta threshold filter
      if (mapPriceDeltaFilter !== "all") {
        const delta = getPointMaxPriceDelta(point);
        if (delta < mapPriceDeltaFilter) return false;
      }

      return true;
    });

    if (activePoints.length > 0) {
      let sumLat = 0;
      let sumLng = 0;
      activePoints.forEach(p => {
        sumLat += p.lat;
        sumLng += p.lng;
      });
      const centerLat = sumLat / activePoints.length;
      const centerLng = sumLng / activePoints.length;
      setMapCenterState({ lat: centerLat, lng: centerLng });
    }
  }, [mapSeverityFilters, mapRegionFilter, mapCategoryFilter, mapShowOnlyFlagged, mapPriceDeltaFilter, partners, scans]);

  // Handler to export currently visible heatmap data points (SKUs, partners, price deltas) as CSV
  const handleDownloadHeatmapViewCSV = () => {
    setIsExporting("heatmap-current-view");
    setTimeout(() => {
      try {
        // 1. Calculate partner heat points
        const partnerHeatPoints = partners.map(partner => {
          const loc = getPartnerLocation(partner.name, partner.domain);
          let totalScansWithPartner = 0;
          let violatingScansWithPartner = 0;
          
          (scans || []).forEach(scan => {
            if (scan.status === 'completed' && scan.items) {
              const match = scan.items.find(item => item.partnerId === partner.id);
              if (match) {
                totalScansWithPartner++;
                if (match.status === 'violating') {
                  violatingScansWithPartner++;
                }
              }
            }
          });
          
          const frequencyRate = totalScansWithPartner > 0 
            ? Math.round((violatingScansWithPartner / totalScansWithPartner) * 100)
            : 0;
            
          return {
            partner,
            ...loc,
            totalScansWithPartner,
            violatingScansWithPartner,
            frequencyRate
          };
        });

        // 2. Filter points based on currently active map filters
        const activeVisiblePoints = partnerHeatPoints.filter(point => {
          // Severity filter
          const sev = getSeverityOfPoint(point);
          if (!mapSeverityFilters[sev as keyof typeof mapSeverityFilters]) return false;

          // Region filter
          if (mapRegionFilter !== "all") {
            const region = getRegionForPartnerName(point.partner.name, point.partner.domain);
            if (region !== mapRegionFilter) return false;
          }

          // Category filter
          if (mapCategoryFilter !== "all") {
            const partnerProductIds = point.partner.associatedProducts || [];
            const hasProductInSelectedCategory = partnerProductIds.some((pId: string) => {
              const cat = getProductCategory(pId);
              return cat === mapCategoryFilter;
            });
            if (!hasProductInSelectedCategory) return false;
          }

          // Currently flagged for MAP violations filter
          if (mapShowOnlyFlagged) {
            const hasActiveViolation = activeViolationsList.some(
              v => v.partner === point.partner.name || v.domain === point.partner.domain
            );
            if (!hasActiveViolation) return false;
          }

          // Price delta threshold filter
          if (mapPriceDeltaFilter !== "all") {
            const delta = getPointMaxPriceDelta(point);
            if (delta < mapPriceDeltaFilter) return false;
          }

          return true;
        });

        // 3. Extract SKU and partner data rows for the visible points
        const rows: string[][] = [];
        const seenKeys = new Set<string>();

        const productMap = new Map<string, Product>();
        products.forEach(p => productMap.set(p.id, p));

        activeVisiblePoints.forEach(point => {
          const p = point.partner;
          const partnerRegion = getRegionForPartnerName(p.name, p.domain);

          // A. Check for active violations for this partner
          const partnerActiveViolations = activeViolationsList.filter(
            v => v.partner === p.name || v.domain === p.domain
          );

          partnerActiveViolations.forEach(v => {
            const matchingProduct = products.find(prod => prod.name.toLowerCase() === v.product.toLowerCase() || prod.sku.toLowerCase() === v.product.toLowerCase());
            const skuCode = matchingProduct?.sku || (matchingProduct ? `SKU-${matchingProduct.id}` : "N/A");
            const category = matchingProduct ? getProductCategory(matchingProduct.id) : "General";
            
            if (mapCategoryFilter !== "all" && category !== mapCategoryFilter) return;

            const mapPrice = v.map;
            const detectedPrice = v.found;
            const priceDelta = mapPrice - detectedPrice;
            const priceDeltaPct = mapPrice > 0 ? Math.round((priceDelta / mapPrice) * 100) : 0;
            const severity = priceDeltaPct >= 15 ? "High (Critical)" : priceDeltaPct >= 5 ? "Moderate" : "Minor";

            const rowKey = `${p.name}-${skuCode}-${v.product}-${v.time}`;
            if (!seenKeys.has(rowKey)) {
              seenKeys.add(rowKey);
              rows.push([
                v.product,
                skuCode,
                category,
                p.name,
                p.domain,
                partnerRegion,
                point.city || "Unknown",
                point.lat ? point.lat.toFixed(4) : "0.0000",
                point.lng ? point.lng.toFixed(4) : "0.0000",
                mapPrice.toFixed(2),
                detectedPrice.toFixed(2),
                priceDelta > 0 ? `-$${priceDelta.toFixed(2)}` : "$0.00",
                priceDelta > 0 ? `-${priceDeltaPct}%` : "0%",
                "Violating (Under MAP)",
                severity,
                v.time ? new Date(v.time).toISOString() : new Date().toISOString(),
                v.url || "N/A"
              ]);
            }
          });

          // B. Also add scan items for this partner from latest scan records
          Object.values(lastScanForEachProduct).forEach(scan => {
            const matchingProduct = productMap.get(scan.productId);
            const category = matchingProduct ? getProductCategory(matchingProduct.id) : "General";
            if (mapCategoryFilter !== "all" && category !== mapCategoryFilter) return;

            const scanItem = scan.items?.find(item => item.partnerId === p.id || item.partnerName === p.name || item.partnerDomain === p.domain);
            if (scanItem) {
              const skuCode = matchingProduct?.sku || (matchingProduct ? `SKU-${matchingProduct.id}` : "N/A");
              const mapPrice = scan.mapPrice;
              const detectedPrice = scanItem.detectedPrice || 0;
              const isViolating = scanItem.status === 'violating';
              const priceDelta = isViolating ? Math.max(0, mapPrice - detectedPrice) : 0;
              const priceDeltaPct = (isViolating && mapPrice > 0) ? Math.round((priceDelta / mapPrice) * 100) : 0;
              const severity = isViolating ? (priceDeltaPct >= 15 ? "High (Critical)" : priceDeltaPct >= 5 ? "Moderate" : "Minor") : "Compliant";

              const rowKey = `${p.name}-${skuCode}-${scan.productName}-${scan.startedAt}`;
              if (!seenKeys.has(rowKey)) {
                seenKeys.add(rowKey);
                rows.push([
                  scan.productName,
                  skuCode,
                  category,
                  p.name,
                  p.domain,
                  partnerRegion,
                  point.city || "Unknown",
                  point.lat ? point.lat.toFixed(4) : "0.0000",
                  point.lng ? point.lng.toFixed(4) : "0.0000",
                  mapPrice.toFixed(2),
                  detectedPrice > 0 ? detectedPrice.toFixed(2) : mapPrice.toFixed(2),
                  priceDelta > 0 ? `-$${priceDelta.toFixed(2)}` : "$0.00",
                  priceDelta > 0 ? `-${priceDeltaPct}%` : "0%",
                  isViolating ? "Violating (Under MAP)" : "Compliant",
                  severity,
                  scan.startedAt ? new Date(scan.startedAt).toISOString() : new Date().toISOString(),
                  scanItem.detectedUrl || "N/A"
                ]);
              }
            }
          });

          // C. If no individual scan rows were generated, add partner catalog summary rows
          const partnerHasRows = Array.from(seenKeys).some(k => k.startsWith(`${p.name}-`));
          if (!partnerHasRows) {
            const partnerProductIds = p.associatedProducts || [];
            if (partnerProductIds.length > 0) {
              partnerProductIds.forEach(pId => {
                const prod = productMap.get(pId);
                if (prod) {
                  const category = getProductCategory(prod.id);
                  if (mapCategoryFilter !== "all" && category !== mapCategoryFilter) return;
                  const rowKey = `${p.name}-${prod.sku}-${prod.name}`;
                  if (!seenKeys.has(rowKey)) {
                    seenKeys.add(rowKey);
                    rows.push([
                      prod.name,
                      prod.sku,
                      category,
                      p.name,
                      p.domain,
                      partnerRegion,
                      point.city || "Unknown",
                      point.lat ? point.lat.toFixed(4) : "0.0000",
                      point.lng ? point.lng.toFixed(4) : "0.0000",
                      (prod?.mapPrice ?? 0).toFixed(2),
                      (prod?.mapPrice ?? 0).toFixed(2),
                      "$0.00",
                      "0%",
                      p.complianceStatus === 'violating' ? 'Violating' : 'Compliant',
                      p.complianceStatus === 'violating' ? 'Medium' : 'Compliant',
                      new Date().toISOString(),
                      `https://${p.domain}`
                    ]);
                  }
                }
              });
            } else {
              const rowKey = `${p.name}-N/A-All`;
              if (!seenKeys.has(rowKey)) {
                seenKeys.add(rowKey);
                rows.push([
                  "All Monitored SKUs",
                  "AGGREGATE",
                  "General",
                  p.name,
                  p.domain,
                  partnerRegion,
                  point.city || "Unknown",
                  point.lat ? point.lat.toFixed(4) : "0.0000",
                  point.lng ? point.lng.toFixed(4) : "0.0000",
                  "N/A",
                  "N/A",
                  "$0.00",
                  "0%",
                  p.complianceStatus ? p.complianceStatus.toUpperCase() : "COMPLIANT",
                  p.complianceStatus === 'violating' ? 'High' : 'Compliant',
                  new Date().toISOString(),
                  `https://${p.domain}`
                ]);
              }
            }
          }
        });

        // 4. Construct CSV
        const headers = [
          "SKU / Product Name",
          "SKU Code",
          "Category",
          "Partner Name",
          "Partner Domain",
          "Region",
          "City",
          "Latitude",
          "Longitude",
          "MAP Price ($)",
          "Detected Price ($)",
          "Price Delta ($)",
          "Price Delta (%)",
          "Compliance Status",
          "Violation Severity",
          "Detection Timestamp",
          "Detected Storefront URL"
        ];

        const csvContent = [
          headers.map(h => escapeCSV(h)).join(","),
          ...rows.map(row => row.map(cell => escapeCSV(cell)).join(","))
        ].join("\n");

        downloadCSV(csvContent, `compliance-map-visible-points-${new Date().toISOString().split('T')[0]}.csv`);
        setSweepFeedbackToast(`Exported CSV with ${rows.length} records for ${activeVisiblePoints.length} visible partner locations`);
      } catch (err) {
        console.error("Failed to export heatmap CSV:", err);
      } finally {
        setIsExporting(null);
      }
    }, 300);
  };

  // Function to export current geographic schematic map state to high-resolution PNG
  const exportMapToPng = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Solid rich dark background
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. High-tech subtle dot-pattern or grid-line overlay
    ctx.strokeStyle = "rgba(49, 46, 129, 0.15)";
    ctx.lineWidth = 1;
    for (let x = 60; x < canvas.width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 60; y < canvas.height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // 3. Draw outer glowing frame matching dashboard borders
    ctx.strokeStyle = "rgba(39, 39, 42, 0.6)"; // zinc-800
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    ctx.strokeStyle = "rgba(99, 102, 241, 0.15)"; // Indigo glowing inner line
    ctx.lineWidth = 1;
    ctx.strokeRect(25, 25, canvas.width - 50, canvas.height - 50);

    // 4. HEADER SECTION (with clean professional display typography)
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px Inter, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("MAP COMPLIANCE SURVEILLANCE REPORT", 60, 50);

    ctx.fillStyle = "#a1a1aa"; // zinc-400
    ctx.font = "bold 13px monospace";
    ctx.fillText("GEOGRAPHIC BRAND PROTECTION & RESELLER INFRACTION MATRIX", 60, 95);

    // Right side: Metadata/Time block
    const dateStr = new Date().toLocaleString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric', 
      hour: '2-digit', minute: '2-digit', second: '2-digit', 
      timeZoneName: 'short' 
    });
    ctx.textAlign = "right";
    ctx.fillStyle = "#818cf8"; // Indigo-400
    ctx.font = "bold 13px monospace";
    ctx.fillText(`EXPORTED: ${dateStr.toUpperCase()}`, canvas.width - 60, 50);

    ctx.fillStyle = "#52525b"; // zinc-600
    ctx.font = "12px monospace";
    ctx.fillText("SYSTEM CLOUD SECURITY AUDIT SIGNATURE: 0x8F9E3D", canvas.width - 60, 75);

    // 5. Draw active filters block on top right
    const cardX = canvas.width - 460;
    const cardY = 110;
    const cardW = 400;
    const cardH = 100;
    ctx.fillStyle = "rgba(15, 15, 20, 0.85)";
    ctx.strokeStyle = "rgba(63, 63, 70, 0.4)"; // zinc-700
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#a1a1aa";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "left";
    ctx.fillText("ACTIVE CONFIGURATION FILTERS:", cardX + 15, cardY + 15);

    // Draw little grid with values
    ctx.font = "11px monospace";
    ctx.fillText("REGION:", cardX + 15, cardY + 40);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px monospace";
    ctx.fillText(mapRegionFilter.toUpperCase(), cardX + 140, cardY + 40);

    ctx.fillStyle = "#a1a1aa";
    ctx.font = "11px monospace";
    ctx.fillText("PRODUCT CATEGORY:", cardX + 15, cardY + 60);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px monospace";
    ctx.fillText(mapCategoryFilter.toUpperCase(), cardX + 140, cardY + 60);

    ctx.fillStyle = "#a1a1aa";
    ctx.font = "11px monospace";
    ctx.fillText("VIEW LIMITS:", cardX + 15, cardY + 80);
    ctx.fillStyle = mapShowOnlyFlagged ? "#f43f5e" : "#10b981";
    ctx.font = "bold 11px monospace";
    ctx.fillText(mapShowOnlyFlagged ? "FLAGGED PARTNERS ONLY" : "ALL PARTNERS INCLUDED", cardX + 140, cardY + 80);

    // Map drawing variables
    const mapX = 160;
    const mapY = 180;
    const scale = 8.0;

    ctx.save();
    ctx.translate(mapX, mapY);

    // 6. Draw Schematic Country/Region Paths
    const regionPaths = [
      { id: "ca", name: "Canada", d: "M 15,12 Q 35,8 48,16 T 50,22 Q 38,25 20,20 Z" },
      { id: "us", name: "United States", d: "M 18,22 Q 38,24 50,24 T 52,35 Q 38,38 20,32 Z" },
      { id: "eu", name: "Europe", d: "M 90,15 Q 115,10 125,25 T 100,45 Q 90,30 90,15 Z" },
      { id: "apac", name: "APAC", d: "M 130,15 Q 165,12 185,25 T 155,55 Q 135,40 130,15 Z" },
      { id: "latam", name: "LATAM", d: "M 45,45 Q 55,50 48,75 T 38,85 Q 35,60 45,45 Z" }
    ];

    const getRegionStats = (regionName: string) => {
      const violations = activeViolationsList.filter(v => getRegionForPartnerName(v.partner, v.domain) === regionName);
      const count = violations.length;
      let avgVariance = 0;
      if (count > 0) {
        const totalVariance = violations.reduce((acc, v) => {
          const varPct = Math.max(0, ((v.map - v.found) / v.map) * 100);
          return acc + varPct;
        }, 0);
        avgVariance = Math.round(totalVariance / count);
      } else {
        const seedVariance: Record<string, number> = { "United States": 14, "Canada": 8, "Europe": 18, "APAC": 12, "LATAM": 5 };
        avgVariance = seedVariance[regionName] || 10;
      }
      return { count, avgVariance };
    };

    regionPaths.forEach(reg => {
      const stats = getRegionStats(reg.name);
      let fillColor = "rgba(16, 185, 129, 0.12)"; // emerald / compliant
      let strokeColor = "#312e81"; // dark indigo stroke

      if (heatmapMetric === "count") {
        if (stats.count === 0) fillColor = "rgba(16, 185, 129, 0.12)";
        else if (stats.count <= 2) fillColor = "rgba(245, 158, 11, 0.22)"; 
        else fillColor = "rgba(239, 68, 68, 0.35)"; 
      } else {
        if (stats.avgVariance <= 10) fillColor = "rgba(16, 185, 129, 0.12)";
        else if (stats.avgVariance <= 18) fillColor = "rgba(245, 158, 11, 0.22)";
        else fillColor = "rgba(239, 68, 68, 0.35)";
      }

      if (selectedGeoRegion === reg.id) {
        strokeColor = "#818cf8"; 
        fillColor = fillColor.replace("0.12", "0.22").replace("0.22", "0.32").replace("0.35", "0.48");
      }

      ctx.save();
      ctx.scale(scale, scale);
      const p2d = new Path2D(reg.d);
      ctx.fillStyle = fillColor;
      ctx.fill(p2d);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1 / scale; 
      ctx.stroke(p2d);
      ctx.restore();
    });

    // 7. Draw faint links from hubs
    ctx.strokeStyle = "rgba(49, 46, 129, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    
    const drawFaintLink = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.beginPath();
      ctx.moveTo(x1 * scale, y1 * scale);
      ctx.lineTo(x2 * scale, y2 * scale);
      ctx.stroke();
    };
    drawFaintLink(45, 35, 105, 24);
    drawFaintLink(45, 35, 62, 68);
    drawFaintLink(105, 24, 155, 40);
    ctx.setLineDash([]); 

    // 8. Draw Regional Hotspot center radar dots and historical zones
    const regionsList = [
      { id: "us", name: "United States", x: 45, y: 35 },
      { id: "ca", name: "Canada", x: 42, y: 18 },
      { id: "eu", name: "Europe", x: 105, y: 24 },
      { id: "apac", name: "APAC", x: 155, y: 40 },
      { id: "latam", name: "LATAM", x: 62, y: 68 },
    ];

    const getRegionHistoricalStats = (regionName: string) => {
      const regionPartners = partners.filter(p => getRegionForPartnerName(p.name, p.domain) === regionName);
      let totalScans = 0;
      let totalViolating = 0;
      regionPartners.forEach(p => {
        const hp = partnerHeatPoints.find(item => item.partner.id === p.id);
        if (hp) {
          totalScans += hp.totalScansWithPartner;
          totalViolating += hp.violatingScansWithPartner;
        }
      });
      const historicalRate = totalScans > 0 ? Math.round((totalViolating / totalScans) * 100) : 0;
      return { totalScans, totalViolating, historicalRate };
    };

    // Calculate heat points
    const partnerHeatPoints = partners.map(partner => {
      const loc = getPartnerLocation(partner.name, partner.domain);
      
      let totalScansWithPartner = 0;
      let violatingScansWithPartner = 0;
      
      (scans || []).forEach(scan => {
        if (scan.status === 'completed' && scan.items) {
          const match = scan.items.find(item => item.partnerId === partner.id);
          if (match) {
            totalScansWithPartner++;
            if (match.status === 'violating') {
              violatingScansWithPartner++;
            }
          }
        }
      });
      
      const frequencyRate = totalScansWithPartner > 0 
        ? Math.round((violatingScansWithPartner / totalScansWithPartner) * 100)
        : 0;
        
      return {
        partner,
        ...loc,
        totalScansWithPartner,
        violatingScansWithPartner,
        frequencyRate
      };
    });

    regionsList.forEach(reg => {
      const violations = activeViolationsList.filter(v => getRegionForPartnerName(v.partner, v.domain) === reg.name);
      const count = violations.length;
      const hasViolations = count > 0;
      const { historicalRate } = getRegionHistoricalStats(reg.name);
      const isHighHistoricalRisk = historicalRate >= 20;

      const px = reg.x * scale;
      const py = reg.y * scale;

      if (hasViolations) {
        ctx.strokeStyle = reg.id === "us" || reg.id === "eu" ? "rgba(239, 68, 68, 0.4)" : "rgba(245, 158, 11, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = hasViolations ? (reg.id === "us" || reg.id === "eu" ? "#ef4444" : "#f59e0b") : "#10b981";
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#09090b";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (showHistoricalOverlay && isHighHistoricalRisk) {
        ctx.strokeStyle = "#d946ef";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(px, py, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]); 

        ctx.fillStyle = "rgba(217, 70, 239, 0.1)";
        ctx.beginPath();
        ctx.arc(px, py, 22, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(reg.name.toUpperCase(), px, py - 30);
    });

    // 9. Draw Schematic Partner heatpoints
    const activePoints = partnerHeatPoints
      .filter(point => {
        // Filter out non-location points
        if (point.lat === 0 && point.lng === 0) return false;
        return true;
      })
      .filter(point => {
        const sev = getSeverityOfPoint(point);
        if (!mapSeverityFilters[sev as keyof typeof mapSeverityFilters]) return false;

        if (mapRegionFilter !== "all") {
          const region = getRegionForPartnerName(point.partner.name, point.partner.domain);
          if (region !== mapRegionFilter) return false;
        }

        if (mapCategoryFilter !== "all") {
          const partnerProductIds = point.partner.associatedProducts || [];
          const hasProduct = partnerProductIds.some((pId: string) => getProductCategory(pId) === mapCategoryFilter);
          if (!hasProduct) return false;
        }

        if (mapShowOnlyFlagged) {
          const hasActiveViolation = activeViolationsList.some(
            v => v.partner === point.partner.name || v.domain === point.partner.domain
          );
          if (!hasActiveViolation) return false;
        }

        return true;
      });

    activePoints.forEach((point) => {
      const px = point.lng === 0 ? 0 : ((point.lng + 180) / 360) * 170 + 15;
      const py = point.lat === 0 ? 0 : (1 - (point.lat + 90) / 180) * 70 + 15;

      const scalePx = px * scale;
      const scalePy = py * scale;

      const violationsCount = point.violatingScansWithPartner;
      const radius = (6 + violationsCount * 4) * 3.5; 
      const sev = getSeverityOfPoint(point);

      let color = "#ef4444"; 
      if (sev === "medium") color = "#f59e0b"; 
      if (sev === "low") color = "#f97316"; 
      if (sev === "compliant") color = "#10b981"; 

      if (showViolationHeatmap && violationsCount > 0) {
        const grad = ctx.createRadialGradient(scalePx, scalePy, 2, scalePx, scalePy, radius);
        grad.addColorStop(0, color + "dd");
        grad.addColorStop(0.3, color + "66");
        grad.addColorStop(1, color + "00");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(scalePx, scalePy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (violationsCount > 0) {
        ctx.strokeStyle = color + "88";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(scalePx, scalePy, 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(scalePx, scalePy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#09090b";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      if (violationsCount > 0) {
        const bRadius = 8;
        const bx = scalePx + 9;
        const by = scalePy - 9;

        ctx.fillStyle = violationsCount > 3 ? "#ef4444" : violationsCount > 1 ? "#f59e0b" : "#f97316";
        ctx.beginPath();
        ctx.arc(bx, by, bRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#09090b";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(violationsCount.toString(), bx, by);
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.strokeStyle = "#09090b";
      ctx.lineWidth = 3;
      ctx.strokeText(point.partner.name, scalePx, scalePy + 12);
      ctx.fillText(point.partner.name, scalePx, scalePy + 12);
    });

    ctx.restore(); 

    // 10. STATISTICS BAR PANEL ON BOTTOM LEFT
    const statsX = 60;
    const statsY = canvas.height - 110;

    ctx.fillStyle = "rgba(15, 15, 20, 0.85)";
    ctx.strokeStyle = "rgba(63, 63, 70, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(statsX, statsY, 800, 60, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = "bold 11px monospace";
    ctx.fillStyle = "#a1a1aa";
    ctx.textAlign = "left";
    
    ctx.fillText("PARTNERS MONITORED:", statsX + 20, statsY + 35);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px monospace";
    ctx.fillText(partners.length.toString(), statsX + 175, statsY + 36);

    ctx.font = "bold 11px monospace";
    ctx.fillStyle = "#a1a1aa";
    ctx.fillText("ACTIVE INFRACTIONS:", statsX + 240, statsY + 35);
    ctx.fillStyle = "#f43f5e";
    ctx.font = "bold 15px monospace";
    ctx.fillText(activeViolationsList.length.toString(), statsX + 395, statsY + 36);

    ctx.font = "bold 11px monospace";
    ctx.fillStyle = "#a1a1aa";
    ctx.fillText("OVERALL COMPLIANCE:", statsX + 460, statsY + 35);
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 15px monospace";
    ctx.fillText(`${complianceRate}%`, statsX + 615, statsY + 36);

    ctx.font = "bold 11px monospace";
    ctx.fillStyle = "#a1a1aa";
    ctx.fillText("FLAGGED LOCATIONS:", statsX + 670, statsY + 35);
    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 15px monospace";
    ctx.fillText(activePoints.length.toString(), statsX + 810, statsY + 36);

    // 11. MAP LEGEND ON BOTTOM RIGHT
    const legendX = canvas.width - 920;
    const legendY = canvas.height - 110;

    ctx.fillStyle = "rgba(15, 15, 20, 0.85)";
    ctx.strokeStyle = "rgba(63, 63, 70, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(legendX, legendY, 860, 60, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = "bold 10px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const drawLegendItem = (x: number, y: number, color: string, label: string, isDashed: boolean = false) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      if (isDashed) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#09090b";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.fillStyle = "#e4e4e7";
      ctx.fillText(label, x + 15, y);
    };

    drawLegendItem(legendX + 25, legendY + 30, "#ef4444", "HIGH RISK (RATE > 50%)");
    drawLegendItem(legendX + 205, legendY + 30, "#f59e0b", "MEDIUM RISK (25% - 50%)");
    drawLegendItem(legendX + 410, legendY + 30, "#f97316", "LOW RISK (< 25%)");
    drawLegendItem(legendX + 595, legendY + 30, "#10b981", "COMPLIANT PARTNER (0%)");
    drawLegendItem(legendX + 795, legendY + 30, "#d946ef", "HISTORICAL RISK", true);

    // 12. TRIGGER DOWNLOAD
    const link = document.createElement("a");
    link.download = `MAP_Compliance_Geographic_Map_Export_${new Date().toISOString().slice(0,10)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Helper to retrieve historical violation count and project future trends using linear vector regression
  const getRegionHistoryAndForecast = (regionName: string) => {
    // Current active count
    const activeCount = activeViolationsList.filter(v => getRegionForPartnerName(v.partner, v.domain) === regionName).length;

    // Plausible baseline histories depending on the region for realistic visuals
    const baselines: Record<string, number[]> = {
      "United States": [3, 4, 5, 4, 6],
      "Canada": [1, 2, 1, 2, 2],
      "Europe": [2, 3, 3, 4, 5],
      "APAC": [1, 2, 2, 3, 2],
      "LATAM": [0, 1, 1, 0, 1],
    };

    const b = baselines[regionName] || [1, 1, 2, 1, 2];

    // Filter completed scan history chronologically
    const sortedCompletedScans = [...scans]
      .filter(s => s.status === 'completed' && s.items && s.items.length > 0)
      .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

    let historyPoints = [...b];
    if (sortedCompletedScans.length >= 3) {
      const scanCounts = sortedCompletedScans.slice(-5).map(s => {
        return s.items.filter(item => item.status === 'violating' && getRegionForPartnerName(item.partnerName, item.partnerDomain) === regionName).length;
      });
      while (scanCounts.length < 5) {
        scanCounts.unshift(b[5 - scanCounts.length - 1] || 0);
      }
      historyPoints = scanCounts;
    }

    // Append the active current violations as the final historical node
    historyPoints.push(activeCount);

    const labels = ["30d Ago", "24d Ago", "18d Ago", "12d Ago", "6d Ago", "Current"];
    const chartData = labels.map((label, idx) => ({
      name: label,
      violations: historyPoints[idx],
      forecast: idx === 5 ? historyPoints[idx] : null,
      isForecast: false,
    }));

    // Calculate slope of trend based on the last 3 data points
    const n = 3;
    const lastNPoints = historyPoints.slice(-n);
    let slope = 0;
    for (let i = 1; i < lastNPoints.length; i++) {
      slope += (lastNPoints[i] - lastNPoints[i - 1]);
    }
    slope = slope / (n - 1);

    // Project next 4 cycles (24 days out)
    const forecastLabels = ["+6d Proj", "+12d Proj", "+18d Proj", "+24d Proj"];
    let currentVal = activeCount;
    forecastLabels.forEach((label, idx) => {
      const noise = Math.sin(idx * 1.5) * 0.4;
      const projectedVal = Math.max(0, parseFloat((currentVal + slope * (idx + 1) + noise).toFixed(1)));
      chartData.push({
        name: label,
        violations: null,
        forecast: projectedVal,
        isForecast: true,
      });
    });

    return { chartData, slope };
  };

  // Compute stats for domain-wise violation distribution or active tracking
  const channelBreakdown = [
    { name: "Amazon Marketplace", color: "bg-indigo-500", domain: "amazon.com" },
    { name: "Walmart Marketplace", color: "bg-sky-400", domain: "walmart.com" },
    { name: "Best Buy channel", color: "bg-emerald-500", domain: "bestbuy.com" },
    { name: "eBay Global Network", color: "bg-slate-500", domain: "ebay.com" }
  ];

  const totalViolationsCount = activeViolationsList.length || 1; // prevent division by zero
  const channelStats = channelBreakdown.map(channel => {
    const matches = activeViolationsList.filter(v => v.domain.toLowerCase().includes(channel.domain));
    const percent = Math.max(12, Math.round((matches.length / totalViolationsCount) * 100));
    return {
      ...channel,
      percent: matches.length > 0 ? percent : 20, // default placeholder coverage share if empty
      count: matches.length
    };
  });

  // Helper to compute Partner vs SKU metrics for Aggregated Heatmap Grid
  const getPartnerSkuMetrics = (partnerId: string, productId: string) => {
    const productScans = scans.filter(s => s.status === "completed" && s.productId === productId);
    let totalSweeps = 0;
    let violationCount = 0;
    productScans.forEach(scan => {
      const match = scan.items?.find(item => item.partnerId === partnerId);
      if (match) {
        totalSweeps++;
        if (match.status === "violating") {
          violationCount++;
        }
      }
    });
    const frequency = totalSweeps > 0 ? Math.round((violationCount / totalSweeps) * 100) : 0;
    return { totalSweeps, violationCount, frequency };
  };

  // Helper to compute Region vs Category metrics for Aggregated Heatmap Grid
  const getRegionCategoryMetrics = (regionName: string, categoryName: string) => {
    let totalSweeps = 0;
    let violationCount = 0;
    const categoryProductIds = products
      .filter(p => getProductCategory(p.id) === categoryName)
      .map(p => p.id);
    const matchingScans = scans.filter(s => s.status === "completed" && categoryProductIds.includes(s.productId));
    matchingScans.forEach(scan => {
      scan.items?.forEach(item => {
        const partnerObj = partners.find(p => p.id === item.partnerId);
        if (partnerObj) {
          const region = getRegionForPartnerName(partnerObj.name, partnerObj.domain);
          if (region === regionName) {
            totalSweeps++;
            if (item.status === "violating") {
              violationCount++;
            }
          }
        }
      });
    });
    const frequency = totalSweeps > 0 ? Math.round((violationCount / totalSweeps) * 100) : 0;
    return { totalSweeps, violationCount, frequency };
  };

  return (
    <div className="space-y-8" id="dashboard-tab-container">
      {/* Executive KPIs Row */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800/90 rounded-2xl p-5 shadow-lg relative overflow-hidden" id="executive-kpis-top-row">
        {/* Subtle Ambient Background Gradient Glows */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800/70 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-950 to-indigo-900 border border-indigo-700/50 text-indigo-400 shadow-xs">
              <Sparkles className="w-4 h-4 text-indigo-300 animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white font-display tracking-wide uppercase">Executive KPIs Overview</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Vault Telemetry
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Strategic metrics across partner networks, aggregate compliance score, and high-severity escalation queues.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 self-start lg:self-auto bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-zinc-800">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Updated: <strong className="text-slate-200">Just Now</strong></span>
            <span className="text-zinc-700">|</span>
            <span className="text-emerald-400 font-semibold">100% Vault Sync</span>
          </div>
        </div>

        {/* 3 Executive KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* KPI 1: Total Active Partners */}
          <div className="bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-4 transition duration-200 flex flex-col justify-between group shadow-xs" id="executive-kpi-active-partners">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Total Active Partners</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white font-display tracking-tight group-hover:text-indigo-200 transition">{totalPartners}</span>
                  <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-0.5">
                    <CheckCircle className="w-3 h-3" />
                    100% Active
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <KpiSparkline data={partnerGrowth30DData} color="#818cf8" gradientId="sparkline-partners-grad" />
                <span className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-indigo-400 group-hover:border-indigo-500/40 group-hover:bg-indigo-950/30 transition shrink-0">
                  <Users className="w-5 h-5 text-indigo-400" />
                </span>
              </div>
            </div>
            
            <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1 text-slate-400">
                <Globe className="w-3 h-3 text-indigo-400" />
                Monitored Channels
              </span>
              <span className="text-slate-300 font-semibold">{partners.filter(p => p.domain).length} Web Domains</span>
            </div>
          </div>

          {/* KPI 2: Aggregate Compliance Health Percentage */}
          <div className="bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-4 transition duration-200 flex flex-col justify-between group shadow-xs" id="executive-kpi-compliance-health">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Aggregate Compliance Health</span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-extrabold font-display tracking-tight transition ${
                    complianceHealthScore >= notificationThreshold ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {complianceHealthScore}%
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wide ${
                    complianceHealthScore >= notificationThreshold 
                      ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60" 
                      : "bg-rose-950/60 text-rose-400 border border-rose-800/60 animate-pulse"
                  }`}>
                    {complianceHealthScore >= notificationThreshold ? "Healthy" : "At Risk"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <KpiSparkline 
                  data={healthTrend30DData} 
                  color={complianceHealthScore >= notificationThreshold ? "#34d399" : "#f43f5e"} 
                  gradientId="sparkline-health-grad" 
                />
                <span className={`p-2.5 rounded-xl bg-zinc-950 border transition shrink-0 ${
                  complianceHealthScore >= notificationThreshold 
                    ? "border-zinc-800 text-emerald-400 group-hover:border-emerald-500/40 group-hover:bg-emerald-950/30" 
                    : "border-rose-900/60 text-rose-400 group-hover:bg-rose-950/30"
                }`}>
                  <ShieldCheck className={`w-5 h-5 ${complianceHealthScore >= notificationThreshold ? "text-emerald-400" : "text-rose-400"}`} />
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                SKU Integrity
              </span>
              <span className="text-slate-300 font-semibold">{compliantProductsCount} / {totalProducts} Compliant SKUs</span>
            </div>
          </div>

          {/* KPI 3: Total Number of Pending High-Severity Violations */}
          <div className="bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-4 transition duration-200 flex flex-col justify-between group shadow-xs" id="executive-kpi-pending-violations">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Pending High-Severity Violations</span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-extrabold font-display tracking-tight transition ${
                    pendingHighSeverityCount > 0 ? "text-rose-400" : "text-emerald-400"
                  }`}>
                    {pendingHighSeverityCount}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wide ${
                    pendingHighSeverityCount > 0 
                      ? "bg-rose-950/80 text-rose-300 border border-rose-800 animate-pulse" 
                      : "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60"
                  }`}>
                    {pendingHighSeverityCount > 0 ? "Action Required" : "No Critical Breaches"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <KpiSparkline 
                  data={pendingViolations30DData} 
                  color={pendingHighSeverityCount > 0 ? "#f43f5e" : "#34d399"} 
                  gradientId="sparkline-violations-grad" 
                />
                <span className={`p-2.5 rounded-xl bg-zinc-950 border transition shrink-0 ${
                  pendingHighSeverityCount > 0 
                    ? "border-rose-800/80 text-rose-400 bg-rose-950/30 group-hover:border-rose-600" 
                    : "border-zinc-800 text-emerald-400 group-hover:border-emerald-500/40"
                }`}>
                  <ShieldAlert className={`w-5 h-5 ${pendingHighSeverityCount > 0 ? "text-rose-400 animate-bounce" : "text-emerald-400"}`} />
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1 text-slate-400">
                <Zap className="w-3 h-3 text-rose-400" />
                Active Breaches
              </span>
              <span className="text-slate-300 font-semibold">{activeViolationsList.length} Total Infractions</span>
            </div>
          </div>

        </div>
      </div>

      {/* Visual Header Summary and global controls panel */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 shadow-sm" id="dashboard-global-scan-header">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-emerald-400">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-sm font-bold text-white font-sans">Automated MAP Protection Controls</h1>
          </div>
          <p className="text-[11px] text-slate-400 max-w-xl font-sans leading-relaxed">
            Scan and calculate minimum advertised price parameters across your retail ecosystems. Runs real-time query formulating engines for all authorized catalog products concurrently.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 shrink-0 w-full sm:w-auto">
          <button
            id="global-scan-trigger-btn"
            type="button"
            disabled={isLoading}
            onClick={onTriggerGlobalScan}
            className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-sans text-xs font-bold uppercase tracking-wider transition select-none ${
              isLoading 
                ? "bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed" 
                : "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-xs border border-emerald-500 hover:-translate-y-0.5 cursor-pointer"
            }`}
          >
            <Radio className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Executing Global Scan..." : "Trigger Global Scan"}
          </button>

          <button
            id="export-compliance-executive-report-btn"
            type="button"
            disabled={isExporting !== null}
            onClick={handleExportComplianceReport}
            className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-100 border border-indigo-750 font-sans text-xs font-bold uppercase tracking-wider transition select-none hover:-translate-y-0.5 shadow-xs cursor-pointer disabled:opacity-50"
            title="Generates a CSV executive compliance summary and detailed SKU violations"
          >
            <Download className={`w-4.5 h-4.5 ${isExporting === "executive-compliance-report" ? "animate-bounce" : ""}`} />
            {isExporting === "executive-compliance-report" ? "Exporting..." : "Export Compliance Report"}
          </button>

          <button
            id="export-scans-csv-dashboard-btn"
            type="button"
            disabled={isExporting !== null}
            onClick={handleExportUnifiedLedger}
            className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-slate-200 border border-zinc-850 border-zinc-800 font-sans text-xs font-bold uppercase tracking-wider transition select-none hover:-translate-y-0.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Download className={`w-4.5 h-4.5 ${isExporting === "unified" ? "animate-bounce" : ""}`} />
            {isExporting === "unified" ? "Exporting..." : "Export Data (CSV)"}
          </button>
        </div>
      </div>

      {/* Sleek Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-6">
        
        {/* Metric: Compliance Health Score */}
        <div className="bg-gradient-to-br from-zinc-900 via-neutral-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-6 flex flex-col justify-between shadow-sm animate-fade-in" id="dashboard-metric-compliance-health-score">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Compliance Health</span>
            <span className={`px-2.5 py-1 text-xs rounded-md font-bold uppercase tracking-wider ${complianceHealthScore >= notificationThreshold ? "bg-emerald-950/40 border border-emerald-900/60 text-emerald-400" : "bg-rose-950/40 border border-rose-900/60 text-rose-400 animate-pulse"}`}>
              {complianceHealthScore >= notificationThreshold ? "Healthy" : "At Risk"}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="space-y-1">
              <span className={`text-4xl font-bold font-display tracking-tight ${complianceHealthScore >= notificationThreshold ? "text-emerald-450" : "text-rose-400"}`}>{complianceHealthScore}%</span>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono block">Compliant SKUs</p>
            </div>
            
            {/* Minimal Circular Progress Indicator */}
            <div className="relative w-12 h-12 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  className="stroke-zinc-800"
                  strokeWidth="3.5"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  className={`${complianceHealthScore >= notificationThreshold ? "stroke-emerald-500" : "stroke-rose-500"} transition-all duration-1000 ease-out`}
                  strokeWidth="3.5"
                  strokeDasharray={`${complianceHealthScore}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-slate-300">
                {compliantProductsCount}/{totalProducts}
              </div>
            </div>
          </div>
          <div className="mt-2 text-[10px] font-mono text-slate-400 flex justify-between select-none font-bold">
            <span>Violations: {totalProducts - compliantProductsCount}</span>
            <span>Total SKUs: {totalProducts}</span>
          </div>

          {/* Interactive Target Compliance Objective & Alerts Settings */}
          <div className="mt-3 pt-3 border-t border-zinc-800 space-y-3">
            {/* Target Compliance Level Control */}
            <div className="space-y-1.5" id="dashboard-target-compliance-input">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-blue-400" />
                  Target Objective
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                  complianceHealthScore >= targetComplianceLevel
                    ? "bg-emerald-950/80 border-emerald-800 text-emerald-300"
                    : "bg-blue-950/80 border-blue-800 text-blue-300"
                }`}>
                  {complianceHealthScore >= targetComplianceLevel
                    ? `+${(complianceHealthScore - targetComplianceLevel).toFixed(1)}% Goal Met`
                    : `${(complianceHealthScore - targetComplianceLevel).toFixed(1)}% Gap`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="range" 
                  min="50" 
                  max="100" 
                  value={targetComplianceLevel} 
                  onChange={(e) => setTargetComplianceLevel(parseInt(e.target.value, 10))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                />
                <div className="flex items-center gap-0.5 shrink-0">
                  <input 
                    type="number"
                    min="50"
                    max="100"
                    value={targetComplianceLevel}
                    onChange={(e) => setTargetComplianceLevel(Math.max(50, Math.min(100, parseInt(e.target.value, 10) || 50)))}
                    className="w-8 bg-zinc-900 border border-zinc-750 text-blue-300 font-mono text-[10px] font-bold rounded text-center py-0.5 outline-none"
                  />
                  <span className="text-[9px] font-mono text-blue-400 font-bold">%</span>
                </div>
              </div>
            </div>

            {/* Alert Triggers */}
            <div className="pt-2 border-t border-zinc-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BellRing className={`w-3.5 h-3.5 ${isNotificationEnabled ? "text-indigo-400 animate-bounce" : "text-slate-500"}`} />
                  Alert Triggers
                </span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={isNotificationEnabled}
                    onChange={(e) => setIsNotificationEnabled(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-8 h-4.5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-3.5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[2.5px] after:bg-zinc-500 after:border-zinc-505 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white peer-checked:after:border-indigo-600 font-bold"></div>
                </label>
              </div>
              
              {isNotificationEnabled && (
                <div className="space-y-1.5 animate-fade-in">
                  <div className="flex justify-between text-[9px] font-mono">
                    <span className="text-slate-400">Trigger standard below:</span>
                    <span className="text-indigo-400 font-bold">{notificationThreshold}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="range" 
                      min="1" 
                      max="100" 
                      value={notificationThreshold} 
                      onChange={(e) => setNotificationThreshold(parseInt(e.target.value, 10))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metric 1: Critical Violations */}
        <div className="bg-gradient-to-br from-zinc-900 via-neutral-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Critical Violations</span>
            <span className={`px-2.5 py-1 text-xs rounded-md font-bold uppercase tracking-wider ${violationPoints > 0 ? "bg-red-950/40 border border-red-900/60 text-red-400 animate-pulse" : "bg-emerald-950/40 border border-emerald-900/60 text-emerald-400"}`}>
              {violationPoints > 0 ? "Action Need" : "Secure"}
            </span>
          </div>
          <div className="mt-4">
            <span className="text-4xl font-bold font-display text-white tracking-tight">{violationPoints}</span>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-mono">Pending enforcement</p>
          </div>
        </div>

        {/* Metric 2: Compliance rate */}
        <div className="bg-gradient-to-br from-zinc-900 via-neutral-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Compliance Score</span>
            <span className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-xs rounded-md font-bold uppercase tracking-wider">
              {complianceRate > 90 ? "Stable" : "Caution"}
            </span>
          </div>
          <div className="mt-4">
            <span className="text-4xl font-bold font-display text-emerald-400 tracking-tight">{complianceRate}%</span>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-mono">Channels integrity rate</p>
          </div>
        </div>

        {/* Metric 3: Estimated Revenue Risk */}
        <div className="bg-gradient-to-br from-zinc-900 via-neutral-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Total Market Risk</span>
            <span className="px-2.5 py-1 bg-amber-950/40 border border-amber-900/60 text-amber-400 text-xs rounded-md font-bold uppercase tracking-wider">
              {violationPoints > 0 ? "High Risk" : "Minimal"}
            </span>
          </div>
          <div className="mt-4">
            <span className="text-4xl font-bold font-display text-white tracking-tight">${(violationPoints * 1450).toLocaleString()}</span>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-mono">Revenue Leakage Risk</p>
          </div>
        </div>

        {/* Metric 4: Monitored Catalog */}
        <div className="bg-gradient-to-br from-zinc-900 via-neutral-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Protected SKUs</span>
            <span className="px-2.5 py-1 bg-indigo-950/40 border border-indigo-900/60 text-indigo-400 text-xs rounded-md font-bold uppercase tracking-wider">
              Enforced
            </span>
          </div>
          <div className="mt-4">
            <span className="text-4xl font-bold font-display text-white tracking-tight">{totalProducts}</span>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-mono">Protected list</p>
          </div>
        </div>

        {/* Metric 5: Scan Health Summary */}
        <div className="bg-gradient-to-br from-zinc-900 via-neutral-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-6 flex flex-col justify-between shadow-sm" id="dashboard-metric-scan-health">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Scan Health</span>
            <span className={`px-2.5 py-1 text-xs rounded-md font-bold uppercase tracking-wider ${scanSuccessRate >= 90 ? "bg-emerald-955/40 border border-emerald-900/60 text-emerald-450 text-emerald-400" : "bg-amber-955/40 border border-amber-900/60 text-amber-450 text-amber-400 font-bold"}`}>
              {scanSuccessRate >= 90 ? "Optimal" : "Degraded"}
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold font-display text-emerald-500 tracking-tight">{scanSuccessRate}%</span>
              <span className="text-xs text-rose-500 font-mono">/ {scanFailureRate}% err</span>
            </div>
            
            {/* Elegant visual mini progress bar */}
            <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2.5 overflow-hidden flex">
              <div className="bg-[#10b981] h-full transition-all duration-500" style={{ width: `${scanSuccessRate}%` }} />
              <div className="bg-[#ef4444] h-full transition-all duration-500" style={{ width: `${scanFailureRate}%` }} />
            </div>

            <p className="text-[10px] text-slate-400 mt-2 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              {scansLast24h.length > 0 ? "Last 24 Hours" : "All-Time History"} ({completedScans24h}/{totalScans24h} OK)
            </p>
          </div>
        </div>

      </div>

      {/* Ecosystem-Wide Compliance Health Trend Chart */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden" id="dashboard-global-compliance-trend-chart">
        <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none">
          <Activity className="w-32 h-32 text-indigo-400 font-bold" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-850 border-zinc-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-semibold flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Ecosystem Health Metrics
              </span>
              <span className="text-[9px] bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase">Aggregating historical logs</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white font-display">
              Historical Compliance Trend Line Chart
            </h2>
            <p className="text-xs text-slate-400">
              Visualizing rolling 30-day aggregate compliance health scores over time based on actual and baseline audit snapshots.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-xl text-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase block font-medium">CURRENT SCORE</span>
            <span className="text-2xl font-bold text-emerald-400 font-display">{complianceHealthScore}%</span>
          </div>
        </div>

        {/* D3.js Interactive Line Chart for Ecosystem Health */}
        <div className="w-full select-none pt-2 bg-zinc-950/40 rounded-xl p-4 border border-zinc-800/80 w-full min-h-[280px] flex items-center justify-center">
          <ComplianceD3Chart data={generateGlobalTrendData()} />
        </div>
      </div>

      {/* Month-over-Month Compliance Audit History Chart */}
      <div id="dashboard-compliance-audit-history-chart">
        <ComplianceAuditHistoryChart 
          products={products}
          partners={partners}
          scans={scans}
          notificationThreshold={notificationThreshold}
          onNotificationThresholdChange={setNotificationThreshold}
          targetComplianceLevel={targetComplianceLevel}
          onTargetComplianceLevelChange={setTargetComplianceLevel}
          highVelocityThreshold={highVelocityThreshold}
          onHighVelocityThresholdChange={setHighVelocityThreshold}
        />
      </div>

      {/* Weekly Alert Type Distribution & Infraction Spike Trend Summary Module */}
      <div id="dashboard-weekly-alert-distribution-trend">
        <AlertDistributionTrendModule
          products={products}
          partners={partners}
          scans={scans}
          notifications={notifications}
          onTriggerScan={onTriggerScan}
        />
      </div>

      {/* Aggregated Compliance Heatmap Color-Coded Grid Card */}
      <div id="dashboard-aggregated-compliance-heatmap">
        <AggregatedComplianceHeatmapD3 
          products={products}
          partners={partners}
          scans={scans}
        />
      </div>

      {/* Systemic Compliance Heatmap Visualizer */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden" id="dashboard-systemic-compliance-heatmap-card">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full filter blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-rose-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-rose-450 animate-pulse" />
                Systemic Compliance Heatmap
              </span>
              <span className="text-[9px] bg-rose-950/40 border border-rose-900/40 text-rose-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">BREACH ANALYTICS</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white font-display">
              Systemic Compliance Heatmap
            </h2>
            <p className="text-xs text-slate-400">
              Expose breach patterns across geographic clusters and marketplace domain suffixes to target corrective operational directives.
            </p>
          </div>

          {/* Interactive controls */}
          <div className="flex bg-zinc-950 border border-zinc-800 p-1 rounded-xl flex items-center gap-1 select-none">
            <button
              type="button"
              onClick={() => setSystemicHeatmapMode('regions')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition duration-200 cursor-pointer ${
                systemicHeatmapMode === 'regions'
                  ? 'bg-rose-950/50 text-rose-400 border border-rose-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Geographic Regions
            </button>
            <button
              type="button"
              onClick={() => setSystemicHeatmapMode('domains')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition duration-200 cursor-pointer ${
                systemicHeatmapMode === 'domains'
                  ? 'bg-rose-950/50 text-rose-400 border border-rose-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Partner Domain Clusters
            </button>
          </div>
        </div>

        {/* Content Body */}
        {systemicHeatmapMode === 'regions' ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {["United States", "Canada", "Europe", "APAC", "LATAM"].map(regionName => {
              const stats = (() => {
                const violations = activeViolationsList.filter(v => getRegionForPartnerName(v.partner, v.domain) === regionName);
                const count = violations.length;
                let avgVariance = 0;
                if (count > 0) {
                  const totalVariance = violations.reduce((acc, v) => {
                    const varPct = Math.max(0, ((v.map - v.found) / v.map) * 100);
                    return acc + varPct;
                  }, 0);
                  avgVariance = Math.round(totalVariance / count);
                } else {
                  const seedVariance: Record<string, number> = { "United States": 14, "Canada": 8, "Europe": 18, "APAC": 12, "LATAM": 5 };
                  avgVariance = seedVariance[regionName] || 10;
                }
                const complianceIndex = count === 0 ? 100 : Math.max(25, 100 - count * 15);
                const breachingPartners = Array.from(new Set(violations.map(v => v.partner)));
                return { count, avgVariance, complianceIndex, breachingPartners };
              })();

              // Style based on stats
              let blockStyle = "bg-emerald-950/10 hover:bg-emerald-950/20 text-emerald-400 border-emerald-900/30";
              let badgeStyle = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
              let riskLabel = "COMPLIANT";

              if (stats.count > 0) {
                if (stats.count <= 2) {
                  blockStyle = "bg-amber-950/15 hover:bg-amber-950/25 text-amber-500 border-amber-900/25";
                  badgeStyle = "bg-amber-500/15 text-amber-400 border-amber-500/30";
                  riskLabel = "LOW RISK";
                } else if (stats.count <= 4) {
                  blockStyle = "bg-orange-950/20 hover:bg-orange-950/30 text-orange-400 border-orange-900/30";
                  badgeStyle = "bg-orange-500/15 text-orange-400 border-orange-500/30";
                  riskLabel = "MODERATE RISK";
                } else {
                  blockStyle = "bg-rose-950/30 hover:bg-rose-950/45 text-rose-400 border-rose-900/40 animate-pulse-slow";
                  badgeStyle = "bg-rose-500/20 text-rose-400 border-rose-500/30";
                  riskLabel = "CRITICAL HOTSPOT";
                }
              }

              const isHovered = hoveredSystemicCell === regionName;

              return (
                <div 
                  key={regionName}
                  onMouseEnter={() => setHoveredSystemicCell(regionName)}
                  onMouseLeave={() => setHoveredSystemicCell(null)}
                  className={`border rounded-2xl p-5 transition-all duration-300 cursor-crosshair flex flex-col justify-between min-h-[170px] relative overflow-hidden ${blockStyle} ${
                    isHovered ? "ring-2 ring-indigo-500/50 scale-[1.02] shadow-lg shadow-indigo-950/40" : ""
                  }`}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.02] rounded-full -mr-6 -mt-6" />
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                        {regionName}
                      </span>
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-md border font-extrabold ${badgeStyle}`}>
                        {riskLabel}
                      </span>
                    </div>

                    <div className="pt-2">
                      <div className="text-2xl font-black font-mono tracking-tight text-white">
                        {stats.count} <span className="text-xs font-sans font-medium text-slate-400">Violations</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Avg Variance: <span className="text-red-450 font-bold">-{stats.avgVariance}%</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-zinc-800/40 flex items-center justify-between">
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Compliance Index</span>
                    <span className="text-xs font-bold font-mono text-slate-200">{stats.complianceIndex}%</span>
                  </div>

                  {/* Detail Panel on hover */}
                  {isHovered && stats.breachingPartners.length > 0 && (
                    <div className="absolute inset-0 bg-slate-950/95 p-4 flex flex-col justify-between animate-fade-in text-[10px] z-10">
                      <div>
                        <span className="text-[8px] font-mono text-indigo-400 uppercase tracking-widest font-bold block mb-1.5">BREACHING OUTLETS ({stats.breachingPartners.length})</span>
                        <div className="space-y-1 max-h-[90px] overflow-y-auto custom-scrollbar">
                          {stats.breachingPartners.map((partner, pidx) => (
                            <div key={pidx} className="text-slate-300 font-medium font-sans truncate flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-rose-500" />
                              {partner}
                            </div>
                          ))}
                        </div>
                      </div>
                      <span className="text-[8px] text-zinc-500 font-mono italic">Hover out to return to overview</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(() => {
              const clusters = {
                marketplaces: {
                  name: "Marketplace Giants (.com)",
                  description: "High-volume aggregators (Amazon, Walmart, Best Buy, eBay)",
                  violations: [] as typeof activeViolationsList,
                  icon: Layers,
                },
                international: {
                  name: "Regional Extensions (.ca, .uk, .eu)",
                  description: "Overseas reseller portals and foreign localized domains",
                  violations: [] as typeof activeViolationsList,
                  icon: Globe,
                },
                specialty: {
                  name: "Independent Specialty Portals",
                  description: "Private boutique resellers and standalone storefronts",
                  violations: [] as typeof activeViolationsList,
                  icon: ShieldAlert,
                },
              };

              activeViolationsList.forEach(v => {
                const d = v.domain.toLowerCase();
                const isMarketplace = d.includes("amazon") || d.includes("walmart") || d.includes("ebay") || d.includes("bestbuy") || d.includes("newegg") || d.includes("target");
                const isInternational = d.includes(".ca") || d.includes(".uk") || d.includes(".de") || d.includes(".fr") || d.includes(".eu") || d.includes(".jp") || d.includes(".cn") || d.includes(".au") || d.includes(".in");

                if (isMarketplace) {
                  clusters.marketplaces.violations.push(v);
                } else if (isInternational) {
                  clusters.international.violations.push(v);
                } else {
                  clusters.specialty.violations.push(v);
                }
              });

              return Object.entries(clusters).map(([key, cluster]) => {
                const count = cluster.violations.length;
                let avgVariance = 0;
                if (count > 0) {
                  const totalVariance = cluster.violations.reduce((acc, v) => {
                    const varPct = Math.max(0, ((v.map - v.found) / v.map) * 100);
                    return acc + varPct;
                  }, 0);
                  avgVariance = Math.round(totalVariance / count);
                } else {
                  const seedVariance: Record<string, number> = { marketplaces: 18, international: 12, specialty: 8 };
                  avgVariance = seedVariance[key] || 10;
                }
                const percentage = activeViolationsList.length > 0 ? Math.round((count / activeViolationsList.length) * 100) : 0;
                
                let patternAlert = "No systemic patterns identified in this cluster.";
                if (key === "marketplaces" && count > 0) {
                  patternAlert = "Scraper-Matching: Automated pricing engines are price-matching lower non-authorized listings.";
                } else if (key === "international" && count > 0) {
                  patternAlert = "Currency Buffer: Floating exchange rates pushing localized listings below standardized MAP limits.";
                } else if (key === "specialty" && count > 0) {
                  patternAlert = "Clearinghouse Undercut: Standalone dealers liquidating overstocked inventory under pressure.";
                }

                let blockStyle = "bg-emerald-950/10 text-emerald-400 border-emerald-900/30";
                let badgeStyle = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
                let riskLabel = "COMPLIANT";

                if (count > 0) {
                  if (count <= 2) {
                    blockStyle = "bg-amber-950/15 text-amber-500 border-amber-900/25";
                    badgeStyle = "bg-amber-500/15 text-amber-400 border-amber-500/30";
                    riskLabel = "LOW RISK";
                  } else if (count <= 4) {
                    blockStyle = "bg-orange-950/20 text-orange-400 border-orange-900/30";
                    badgeStyle = "bg-orange-500/15 text-orange-400 border-orange-500/30";
                    riskLabel = "MODERATE RISK";
                  } else {
                    blockStyle = "bg-rose-950/30 text-rose-400 border-rose-900/40 animate-pulse-slow";
                    badgeStyle = "bg-rose-500/20 text-rose-400 border-rose-500/30";
                    riskLabel = "CRITICAL HOTSPOT";
                  }
                }

                const ClusterIcon = cluster.icon;
                const isHovered = hoveredSystemicCell === key;

                return (
                  <div 
                    key={key}
                    onMouseEnter={() => setHoveredSystemicCell(key)}
                    onMouseLeave={() => setHoveredSystemicCell(null)}
                    className={`border rounded-2xl p-6 transition-all duration-300 cursor-crosshair flex flex-col justify-between min-h-[220px] relative overflow-hidden ${blockStyle} ${
                      isHovered ? "ring-2 ring-indigo-500/50 scale-[1.01] shadow-lg shadow-indigo-950/40" : ""
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1.5">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-350 flex items-center gap-1.5">
                            <ClusterIcon className="w-4 h-4 text-zinc-500" />
                            {cluster.name}
                          </span>
                          <p className="text-[10px] text-slate-400 leading-normal max-w-xs">{cluster.description}</p>
                        </div>
                        <span className={`text-[8px] font-mono px-2 py-0.5 rounded-md border font-extrabold ${badgeStyle}`}>
                          {riskLabel}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <div className="text-2xl font-black font-mono tracking-tight text-white">
                            {count} <span className="text-xs font-sans font-medium text-slate-400">Violations</span>
                          </div>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                            Cluster Share: <span className="text-white font-bold">{percentage}%</span>
                          </p>
                        </div>
                        <div>
                          <div className="text-2xl font-black font-mono tracking-tight text-red-400">
                            -{avgVariance}%
                          </div>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                            Avg Price Variance
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-zinc-800/40 space-y-1.5">
                      <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest font-bold">Systemic Pattern Diagnosed</span>
                      <p className="text-[10px] text-slate-300 leading-relaxed font-sans italic">
                        "{patternAlert}"
                      </p>
                    </div>

                    {/* Hover Detail Panel */}
                    {isHovered && count > 0 && (
                      <div className="absolute inset-0 bg-slate-950/95 p-5 flex flex-col justify-between animate-fade-in text-[10px] z-10">
                        <div>
                          <span className="text-[8px] font-mono text-indigo-400 uppercase tracking-widest font-bold block mb-2">SYSTEMIC OFFENDERS & DEPTHS</span>
                          <div className="space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar">
                            {cluster.violations.map((v, vidx) => (
                              <div key={vidx} className="flex justify-between items-center text-slate-300 font-sans border-b border-zinc-900 pb-1">
                                <span className="truncate max-w-[120px] font-medium">{v.partner}</span>
                                <span className="font-mono text-rose-450 font-bold">-${(v.map - v.found).toFixed(2)} (-{Math.round(((v.map - v.found) / v.map) * 100)}%)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <span className="text-[8px] text-zinc-500 font-mono italic">Hover out to return to overview</span>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* CSV Export & Audit Intelligence Hub */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm animate-fade-in" id="compliance-csv-export-gateway">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">
          
          {/* Left Column: Spreadsheets */}
          <div className="space-y-4 pr-0 lg:pr-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1 px-1.5 rounded-lg bg-indigo-950/40 text-indigo-400 font-mono text-xs font-bold border border-indigo-900/40">
                  CSV
                </span>
                <h3 className="text-sm font-bold text-white font-sans flex items-center gap-1.5">
                  Compliance & Inventory Reporting Center
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-normal">
                Extract raw spreadsheets compiled with real-time merchant metrics. Generates cross-referenced tables listing SKU parameters, monitored partners, pricing drops, and audit timestamps.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleExportUnifiedLedger}
                disabled={isExporting !== null}
                className="px-3.5 py-2.5 whitespace-nowrap rounded-lg text-[10px] font-bold font-mono tracking-wide uppercase transition flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-indigo-400 hover:bg-zinc-800 hover:text-indigo-350 hover:border-zinc-700 disabled:opacity-50 cursor-pointer"
              >
                <Download className={`w-3.5 h-3.5 ${isExporting === "unified" ? "animate-bounce" : ""}`} />
                {isExporting === "unified" ? "Processing..." : "Unified Ledger (CSV)"}
              </button>
              
              <button
                type="button"
                onClick={handleExportProductsSummary}
                disabled={isExporting !== null}
                className="px-3.5 py-2.5 whitespace-nowrap rounded-lg text-[10px] font-bold font-mono tracking-wide uppercase transition flex items-center gap-2 bg-slate-900 border border-slate-800 text-emerald-400 hover:bg-slate-800/80 hover:text-emerald-350 hover:border-slate-700 disabled:opacity-50 cursor-pointer"
              >
                <Download className={`w-3.5 h-3.5 ${isExporting === "products" ? "animate-bounce" : ""}`} />
                {isExporting === "products" ? "Processing..." : "Products Summary (CSV)"}
              </button>
              
              <button
                type="button"
                onClick={handleExportPartnersSummary}
                disabled={isExporting !== null}
                className="px-3.5 py-2.5 whitespace-nowrap rounded-lg text-[10px] font-bold font-mono tracking-wide uppercase transition flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white hover:border-slate-700 disabled:opacity-50 cursor-pointer"
              >
                <Download className={`w-3.5 h-3.5 ${isExporting === "partners" ? "animate-bounce" : ""}`} />
                {isExporting === "partners" ? "Processing..." : "Partners Summary (CSV)"}
              </button>

              <button
                type="button"
                onClick={handleExportComplianceReport}
                disabled={isExporting !== null}
                className="px-3.5 py-2.5 whitespace-nowrap rounded-lg text-[10px] font-bold font-mono tracking-wide uppercase transition flex items-center gap-2 bg-indigo-950/40 border border-indigo-900/50 text-indigo-400 hover:bg-indigo-900/60 hover:text-indigo-300 hover:border-indigo-650 disabled:opacity-50 cursor-pointer"
                title="Generates a complete executive compliance summary with listed product SKU violations"
              >
                <Download className={`w-3.5 h-3.5 ${isExporting === "executive-compliance-report" ? "animate-bounce" : ""}`} />
                {isExporting === "executive-compliance-report" ? "Processing..." : "Executive Compliance Report (CSV)"}
              </button>

              <button
                type="button"
                onClick={() => setIsExecutiveReportOpen(true)}
                className="px-3.5 py-2.5 whitespace-nowrap rounded-lg text-[10px] font-bold font-mono tracking-wide uppercase transition flex items-center gap-2 bg-rose-950/55 border border-rose-900/60 text-rose-400 hover:bg-rose-900/65 hover:text-rose-300 hover:border-rose-700 disabled:opacity-50 cursor-pointer animate-pulse-slow"
                title="Stage and export a comprehensive, print-ready corporate board compliance report"
              >
                <FileText className="w-3.5 h-3.5" />
                Executive PDF & Print Auditor
              </button>
            </div>
          </div>

          {/* Right Column: Local Data Archive / Exporter */}
          <div className="space-y-4 pt-6 lg:pt-0 pl-0 lg:pl-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1 px-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 font-mono text-xs font-bold border border-emerald-900/40">
                  ARCHIVE
                </span>
                <h3 className="text-sm font-bold text-white font-sans flex items-center gap-1.5">
                  Local Data Archive Porter
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-normal">
                Archive your absolute datasets locally. Download the entire record of historical compliance scans and the SKU portfolio in formatted raw JSON or tabbed spreadsheets for audits.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Compliance Scan History Section */}
              <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 font-sans">Compliance Scan History</span>
                  <span className="text-[9px] font-mono font-semibold text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">scans ({scans.length})</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportData('scans', 'json')}
                    disabled={isExporting !== null}
                    className="flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold font-mono bg-slate-900 hover:bg-rose-955/40 border border-slate-850 text-rose-455 hover:text-rose-400 disabled:opacity-50 transition cursor-pointer text-center shadow-xs"
                    title="Export all completed scan profiles with partner compliance statuses into a raw JSON archive"
                  >
                    JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportData('scans', 'csv')}
                    disabled={isExporting !== null}
                    className="flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold font-mono bg-slate-900 hover:bg-indigo-955/40 border border-slate-850 text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition cursor-pointer text-center shadow-xs"
                    title="Export scan logs inside a spreadsheet ready format"
                  >
                    CSV
                  </button>
                </div>
              </div>

              {/* SKU List Section */}
              <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 font-sans">Compliance SKU List</span>
                  <span className="text-[9px] font-mono font-semibold text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">SKUs ({products.length})</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportData('skus', 'json')}
                    disabled={isExporting !== null}
                    className="flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold font-mono bg-slate-900 hover:bg-rose-955/40 border border-slate-850 text-rose-455 hover:text-rose-400 disabled:opacity-50 transition cursor-pointer text-center shadow-xs"
                    title="Export SKU catalog variables into structured JSON"
                  >
                    JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportData('skus', 'csv')}
                    disabled={isExporting !== null}
                    className="flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold font-mono bg-slate-900 hover:bg-indigo-955/40 border border-slate-850 text-indigo-400 text-indigo-300 disabled:opacity-50 transition cursor-pointer text-center shadow-xs"
                    title="Export SKU inventory parameters inside a flat CSV table roster"
                  >
                    CSV
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Primary Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1 & 2: Recent Violations / Chronological Breach Timeline */}
        <div className="lg:col-span-2 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-6 overflow-hidden shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 className="font-bold font-display text-white text-base">Recent MAP Breach Events</h2>
                <span className="text-[10px] bg-red-950/80 text-red-400 border border-red-900/60 font-mono font-bold px-1.5 py-0.5 rounded animate-pulse">
                  LIVE STREAM
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Chronological vertical stream with real-time enforcement status tracking
              </p>
            </div>
            
            {/* View Mode Toggle: Timeline vs Table */}
            <div className="flex items-center gap-2">
              <div className="flex bg-zinc-950 border border-zinc-800 p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setBreachViewMode('timeline')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    breachViewMode === 'timeline'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Switch to chronological vertical timeline view"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Timeline</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBreachViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    breachViewMode === 'table'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Switch to compact table grid view"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Table Grid</span>
                </button>
              </div>
              <span className="text-xs text-indigo-400 font-mono font-semibold hidden md:inline">UPDATED</span>
            </div>
          </div>

          {breachViewMode === 'timeline' ? (
            <div className="w-full">
              <ChronologicalBreachTimelineView
                products={products}
                partners={partners}
                scans={scans}
                onSelectViolationForScreenshot={(v) => {
                  setSelectedViolation({
                    partner: v.partner,
                    domain: v.domain,
                    product: v.product,
                    map: v.map,
                    found: v.found,
                    url: v.url
                  });
                }}
                onLocatePartner={(partnerName, domain) => {
                  handleViolationClick({ partner: partnerName, domain });
                }}
              />
            </div>
          ) : activeViolationsList.length === 0 ? (
            <div className="p-16 text-center text-slate-550 space-y-4">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" strokeWidth={1.5} />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-205 text-white">Excellent Integrity Shield</h3>
                <p className="text-slate-400 max-w-md mx-auto text-xs leading-relaxed">
                  No active MAP price violations are registered in current indexes. Resellers are complying with policy guidelines.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-zinc-800">
                    <th className="pb-4">Partner</th>
                    <th className="pb-4">Product Item</th>
                    <th className="pb-4">MAP Price</th>
                    <th className="pb-4">Listed Price</th>
                    <th className="pb-4 text-right">Channel</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300 divide-y divide-zinc-800/40">
                  {activeViolationsList.map((violation, idx) => {
                    const variancePercent = Math.round(((violation.map - violation.found) / violation.map) * 100);
                    return (
                      <tr 
                        key={idx} 
                        className="hover:bg-zinc-900 border-b border-zinc-800/10 transition-colors group cursor-pointer"
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.closest("button") || target.closest("a")) return;
                          handleViolationClick(violation);
                        }}
                        title="Click to focus and locate this partner on the map"
                      >
                        <td className="py-4 pr-3 font-medium text-slate-205 text-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="group-hover:text-indigo-400 transition-colors">{violation.partner}</span>
                            <span className="text-[10px] font-mono text-slate-500">({violation.domain})</span>
                            <MapPin className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </td>
                        <td className="py-4 pr-3 font-mono text-xs text-indigo-400">{violation.product}</td>
                        <td className="py-4 pr-3 font-mono text-slate-400">${violation.map.toFixed(2)}</td>
                        <td className="py-4 pr-3 font-mono text-logo-red font-semibold text-red-100/90 text-red-400">
                          <div className="flex items-center gap-1.5">
                            <span>${violation.found.toFixed(2)}</span>
                            <span className="text-[10px] font-semibold text-red-100 bg-red-950/60 px-1 py-0.5 rounded">
                              -{variancePercent}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              onClick={() => setSelectedViolation(violation)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1a0f1d] text-rose-400 hover:bg-rose-900/40 rounded text-xs font-semibold border border-red-900/45 transition-all font-mono cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              View Screenshot
                            </button>
                            <a 
                              href={violation.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="inline-block px-2.5 py-1 bg-zinc-900 text-indigo-400 hover:bg-zinc-800 hover:text-white rounded text-xs font-medium border border-zinc-700 transition-all font-mono"
                            >
                              Inspect link
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Column 3: Infringements Heatmap */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-sm">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-2 border-b border-zinc-800 gap-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-bold font-display text-white flex items-center gap-2 text-sm sm:text-base">
                  <Globe className="w-4 h-4 text-rose-500 animate-spin animate-duration-[10000ms]" />
                  Compliance Heatmap
                </h2>

                {/* Subtle 'Auto-refresh Active' indicator */}
                {autoRefreshInterval !== "off" ? (
                  <div 
                    id="auto-refresh-active-header-indicator"
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9.5px] font-mono font-extrabold border transition-all duration-300 ${
                      secondsRemaining !== null && secondsRemaining < 30
                        ? "bg-red-950/90 text-red-400 border-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse"
                        : "bg-zinc-900/80 text-emerald-400 border-emerald-800/50 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                    }`}
                    title={`Auto-refresh active every ${autoRefreshInterval}. Next sweep in ${formatCountdown(secondsRemaining)}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      secondsRemaining !== null && secondsRemaining < 30
                        ? "bg-red-500 animate-ping"
                        : "bg-emerald-400 animate-pulse"
                    }`} />
                    <span className="font-sans font-bold text-[10px]">Auto-refresh Active</span>
                    <span className="opacity-40 font-mono">|</span>
                    <Clock className={`w-3 h-3 ${secondsRemaining !== null && secondsRemaining < 30 ? "text-red-400 animate-spin" : "text-emerald-400"}`} style={{ animationDuration: secondsRemaining !== null && secondsRemaining < 30 ? "2s" : "6s" }} />
                    <span className="font-mono font-extrabold tracking-wider">{formatCountdown(secondsRemaining)}</span>
                  </div>
                ) : (
                  <div 
                    id="auto-refresh-inactive-header-indicator"
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono text-zinc-500 bg-zinc-900/40 border border-zinc-800/50"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                    <span>Auto-refresh: Off</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="toggle-7d-density-trend-btn"
                  onClick={() => setShowTrendOverlay(prev => !prev)}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                    showTrendOverlay
                      ? "bg-indigo-600 text-white border-indigo-400 shadow-sm shadow-indigo-950/80 font-extrabold"
                      : "bg-zinc-950 hover:bg-zinc-900 text-indigo-300 border-indigo-900/50 hover:border-indigo-700"
                  }`}
                  title="Toggle 7-day heatmap density variation line graph overlay to detect breach anomalies"
                >
                  <TrendingUp className={`w-3 h-3 ${showTrendOverlay ? "text-white" : "text-indigo-400"}`} />
                  <span>7D Trend</span>
                  {showTrendOverlay && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                </button>

                <button
                  type="button"
                  id="download-heatmap-current-view-csv-btn"
                  onClick={handleDownloadHeatmapViewCSV}
                  disabled={isExporting === "heatmap-current-view"}
                  className="px-2 py-0.5 bg-zinc-950 hover:bg-emerald-950/40 text-[9px] font-mono font-bold text-emerald-400 border border-emerald-900/40 hover:border-emerald-800 rounded transition cursor-pointer flex items-center gap-1 shrink-0"
                  title="Download Current View as CSV containing visible heatmap data points, SKU, partner, and price delta"
                >
                  <Download className={`w-3 h-3 text-emerald-400 ${isExporting === "heatmap-current-view" ? "animate-bounce" : ""}`} />
                  <span>{isExporting === "heatmap-current-view" ? "Exporting CSV..." : "Download Current View as CSV"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsExecutiveReportOpen(true)}
                  className="px-2 py-0.5 bg-zinc-950 hover:bg-rose-950/40 text-[9px] font-mono font-bold text-rose-400 border border-rose-900/40 hover:border-rose-800 rounded transition cursor-pointer flex items-center gap-1 shrink-0"
                  title="Generate a formal printable PDF or paper audit report for board executives"
                >
                  <FileText className="w-3 h-3 text-rose-500" />
                  Print PDF Report
                </button>
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold hidden sm:inline-block">Live Grid</span>
              </div>
            </div>

            {/* Premium Custom Select/Toggle Tabs */}
            <div className="flex bg-zinc-950/80 border border-zinc-800 p-0.5 rounded-lg mb-5 w-full">
              <button
                type="button"
                onClick={() => setHeatmapTab('regions')}
                className={`flex-1 py-1.5 text-[9px] font-mono font-bold uppercase rounded-md transition duration-200 cursor-pointer ${
                  heatmapTab === 'regions'
                    ? 'bg-rose-950/50 text-rose-400 border border-rose-900/40 font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Regions
              </button>
              <button
                type="button"
                onClick={() => setHeatmapTab('categories')}
                className={`flex-1 py-1.5 text-[9px] font-mono font-bold uppercase rounded-md transition duration-200 cursor-pointer ${
                  heatmapTab === 'categories'
                    ? 'bg-indigo-950/50 text-indigo-400 border border-indigo-900/40 font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Categories
              </button>
              <button
                type="button"
                onClick={() => setHeatmapTab('channels')}
                className={`flex-1 py-1.5 text-[9px] font-mono font-bold uppercase rounded-md transition duration-200 cursor-pointer ${
                  heatmapTab === 'channels'
                    ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/40 font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Channels
              </button>
            </div>

            {/* TAB CONTENT: Geographic Heatmap */}
            {/* TAB CONTENT: Geographic Heatmap */}
            {heatmapTab === 'regions' && (() => {
              const partnerHeatPoints = partners.map(partner => {
                const loc = getPartnerLocation(partner.name, partner.domain);
                
                let totalScansWithPartner = 0;
                let violatingScansWithPartner = 0;
                
                (scans || []).forEach(scan => {
                  if (scan.status === 'completed' && scan.items) {
                    const match = scan.items.find(item => item.partnerId === partner.id);
                    if (match) {
                      totalScansWithPartner++;
                      if (match.status === 'violating') {
                        violatingScansWithPartner++;
                      }
                    }
                  }
                });
                
                const frequencyRate = totalScansWithPartner > 0 
                  ? Math.round((violatingScansWithPartner / totalScansWithPartner) * 100)
                  : 0;
                  
                return {
                  partner,
                  ...loc,
                  totalScansWithPartner,
                  violatingScansWithPartner,
                  frequencyRate
                };
              });

              return (
                <div className="space-y-4 animate-fade-in">
                  {/* Map Engine & Metric Selector Toggles */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-zinc-950/60 p-1.5 rounded-lg border border-zinc-900 text-[10px] font-mono">
                    {/* Left: View Mode (Google Maps vs Schematic) */}
                    <div className="flex items-center justify-between md:justify-start gap-1">
                      <span className="text-slate-500 pl-1 mr-1">Engine:</span>
                      <div className="flex gap-1 bg-zinc-900/60 p-0.5 rounded border border-zinc-850">
                        <button
                          type="button"
                          onClick={() => setMapEngine("gmaps")}
                          className={`px-2 py-0.5 rounded cursor-pointer transition ${
                            mapEngine === "gmaps"
                              ? "bg-indigo-950/50 text-indigo-400 border border-indigo-900/40 font-bold"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          Google Map
                        </button>
                        <button
                          type="button"
                          onClick={() => setMapEngine("compliance-heatmap")}
                          className={`px-2 py-0.5 rounded cursor-pointer transition ${
                            mapEngine === "compliance-heatmap"
                              ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900/40 font-bold shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                          title="View Partner Compliance Scores Geographically on Google Maps Platform"
                        >
                          Compliance Heatmap
                        </button>
                        <button
                          type="button"
                          onClick={() => setMapEngine("d3-heatmap")}
                          className={`px-2 py-0.5 rounded cursor-pointer transition ${
                            mapEngine === "d3-heatmap"
                              ? "bg-rose-950/50 text-rose-400 border border-rose-900/40 font-bold shadow-[0_0_8px_rgba(244,63,94,0.15)]"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                          title="View Geographical Heatmap Layer with D3 Kernel Density Estimation"
                        >
                          D3 Heatmap
                        </button>
                        <button
                          type="button"
                          onClick={() => setMapEngine("schematic")}
                          className={`px-2 py-0.5 rounded cursor-pointer transition ${
                            mapEngine === "schematic"
                              ? "bg-indigo-950/50 text-indigo-400 border border-indigo-900/40 font-bold"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          Schematic
                        </button>
                      </div>
                    </div>

                    {/* Middle: Layer Metric */}
                    <div className="flex items-center justify-between md:justify-center gap-1">
                      <span className="text-slate-500 mr-1">Metric:</span>
                      <div className="flex gap-1 bg-zinc-900/60 p-0.5 rounded border border-zinc-850">
                        <button
                          type="button"
                          onClick={() => setHeatmapMetric("count")}
                          className={`px-2 py-0.5 rounded cursor-pointer transition ${
                            heatmapMetric === "count"
                              ? "bg-rose-950/50 text-rose-400 border border-rose-900/30 font-bold"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          Alert Count
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeatmapMetric("variance")}
                          className={`px-2 py-0.5 rounded cursor-pointer transition ${
                            heatmapMetric === "variance"
                              ? "bg-amber-950/50 text-amber-400 border border-amber-900/30 font-bold"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          Avg Price Variance
                        </button>
                      </div>
                    </div>

                    {/* Right: Export to high-resolution PNG */}
                    <div className="flex items-center justify-between md:justify-end gap-1">
                      <button
                        type="button"
                        onClick={exportMapToPng}
                        className="px-2.5 py-1 bg-indigo-950/60 hover:bg-indigo-900/50 text-[10px] font-bold text-indigo-400 border border-indigo-900/40 hover:border-indigo-800/60 rounded transition cursor-pointer flex items-center gap-1.5 shadow-[0_0_8px_rgba(99,102,241,0.05)]"
                        title="Export the current geographic map view and compliance statistics to a high-resolution PNG image for compliance reporting"
                      >
                        <Download className="w-3.5 h-3.5 text-indigo-400" />
                        Export Map PNG
                      </button>
                    </div>
                  </div>

                  {/* Map Severity Filter Toolbar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-zinc-950/40 p-2 rounded-lg border border-zinc-900/80 text-[10px] font-mono">
                    <div className="flex items-center gap-1.5 pl-1">
                      <span className="text-slate-400 font-bold">Severity Filter:</span>
                      <span className="text-slate-500 text-[9px]">(Toggle pins by frequency)</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {/* Clustering Manager Toggle Button */}
                      <button
                        type="button"
                        onClick={() => setIsClusteringEnabled(prev => !prev)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded border transition cursor-pointer ${
                          isClusteringEnabled
                            ? "bg-indigo-950/50 text-indigo-400 border-indigo-900/40 font-bold mr-1.5"
                            : "bg-zinc-900/20 text-slate-500 border-zinc-800/40 opacity-60 mr-1.5"
                        }`}
                        title="Group reseller markers at low zoom levels for performance and visual clarity"
                      >
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        Cluster: {isClusteringEnabled ? "ON" : "OFF"}
                      </button>

                      {/* Historical Risk Overlay Toggle Button */}
                      <button
                        type="button"
                        onClick={() => setShowHistoricalOverlay(prev => !prev)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded border transition cursor-pointer ${
                          showHistoricalOverlay
                            ? "bg-fuchsia-950/50 text-fuchsia-400 border-fuchsia-900/40 font-bold mr-1.5 shadow-[0_0_10px_rgba(217,70,239,0.15)]"
                            : "bg-zinc-900/20 text-slate-500 border-zinc-800/40 opacity-60 mr-1.5"
                        }`}
                        title="Show/hide the historical high-risk breach zones on the map"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-fuchsia-400 animate-pulse" />
                        Historical Risk: {showHistoricalOverlay ? "ON" : "OFF"}
                      </button>

                      {/* Violation Heatmap Density Toggle Button */}
                      <button
                        type="button"
                        onClick={() => setShowViolationHeatmap(prev => !prev)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded border transition cursor-pointer ${
                          showViolationHeatmap
                            ? "bg-rose-950/50 text-rose-400 border-rose-900/40 font-bold mr-1.5 shadow-[0_0_10px_rgba(244,63,94,0.15)]"
                            : "bg-zinc-900/20 text-slate-500 border-zinc-800/40 opacity-60 mr-1.5"
                        }`}
                        title="Overlay a glowing geographical violation density heatmap color-coded by infraction severity"
                      >
                        <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                        Geographic Heatmap: {showViolationHeatmap ? "ON" : "OFF"}
                      </button>

                      {/* All Partners vs Violating Partners Only Segmented Toggle Button */}
                      <div className="flex items-center bg-zinc-950/80 p-0.5 rounded-lg border border-zinc-800/80 mr-1.5 shadow-inner">
                        <button
                          type="button"
                          id="map-filter-scope-all-btn"
                          onClick={() => setMapShowOnlyFlagged(false)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[9.5px] font-mono font-bold transition cursor-pointer ${
                            !mapShowOnlyFlagged
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                          }`}
                          title="Visualize all partner locations on the map"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>All Partners</span>
                        </button>
                        <button
                          type="button"
                          id="map-filter-scope-violating-btn"
                          onClick={() => setMapShowOnlyFlagged(true)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[9.5px] font-mono font-bold transition cursor-pointer ${
                            mapShowOnlyFlagged
                              ? "bg-rose-600 text-white shadow-sm shadow-rose-950/60"
                              : "text-zinc-400 hover:text-rose-300 hover:bg-rose-950/30"
                          }`}
                          title="Filter map markers to show only partner sites currently flagged with MAP violations"
                        >
                          <ShieldAlert className={`w-3.5 h-3.5 ${mapShowOnlyFlagged ? "text-white animate-pulse" : "text-rose-400"}`} />
                          <span>Violating Partners Only</span>
                        </button>
                      </div>

                      {/* Price Delta Range Dropdown Filter */}
                      <div className="flex items-center gap-1 bg-zinc-900/60 px-2 py-0.5 rounded border border-zinc-800/80 mr-1 text-[9.5px]">
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-amber-400" />
                          Delta Range:
                        </span>
                        <select
                          id="map-toolbar-price-delta-filter-select"
                          value={mapPriceDeltaFilter}
                          onChange={(e) => setMapPriceDeltaFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                          className="bg-zinc-950 border border-zinc-700/80 text-amber-300 text-[9px] font-mono font-bold rounded px-1.5 py-0.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                          title="Filter heatmap data points by minimum price delta below MAP to isolate extreme violations"
                        >
                          <option value="all">All Deltas</option>
                          <option value={10}>&gt; $10 Below MAP</option>
                          <option value={25}>&gt; $25 Below MAP</option>
                          <option value={50}>&gt; $50 Below MAP (Extreme)</option>
                          <option value={100}>&gt; $100 Below MAP (Critical)</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => setMapSeverityFilters(prev => ({ ...prev, high: !prev.high }))}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded border transition cursor-pointer ${
                          mapSeverityFilters.high
                            ? "bg-red-950/40 text-red-400 border-red-900/30 font-bold"
                            : "bg-zinc-900/20 text-slate-500 border-zinc-800/40 opacity-60"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${mapSeverityFilters.high ? "bg-red-500 animate-pulse" : "bg-zinc-600"}`} />
                        High Risk (&gt;50%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMapSeverityFilters(prev => ({ ...prev, medium: !prev.medium }))}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded border transition cursor-pointer ${
                          mapSeverityFilters.medium
                            ? "bg-amber-950/40 text-amber-400 border-amber-900/30 font-bold"
                            : "bg-zinc-900/20 text-slate-500 border-zinc-800/40 opacity-60"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${mapSeverityFilters.medium ? "bg-amber-500" : "bg-zinc-600"}`} />
                        Medium (25%-50%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMapSeverityFilters(prev => ({ ...prev, low: !prev.low }))}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded border transition cursor-pointer ${
                          mapSeverityFilters.low
                            ? "bg-orange-950/40 text-orange-400 border-orange-900/30 font-bold"
                            : "bg-zinc-900/20 text-slate-500 border-zinc-800/40 opacity-60"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${mapSeverityFilters.low ? "bg-orange-400" : "bg-zinc-600"}`} />
                        Low (&lt;25%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMapSeverityFilters(prev => ({ ...prev, compliant: !prev.compliant }))}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded border transition cursor-pointer ${
                          mapSeverityFilters.compliant
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/30 font-bold"
                            : "bg-zinc-900/20 text-slate-500 border-zinc-800/40 opacity-60"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${mapSeverityFilters.compliant ? "bg-emerald-500" : "bg-zinc-600"}`} />
                        Compliant (0%)
                      </button>
                    </div>
                  </div>

                  {mapEngine === "gmaps" ? (
                    <div className="google-map-heatmap-view relative overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950/80 p-1 shadow-inner h-80 w-full">
                      {/* 7-Day Density Trend Line Graph Overlay */}
                      {showTrendOverlay && (
                        <div 
                          id="heatmap-7d-density-trend-overlay"
                          className="absolute inset-0 z-50 bg-zinc-950/95 backdrop-blur-md p-3 flex flex-col justify-between border border-indigo-500/40 rounded-xl animate-fade-in shadow-2xl"
                        >
                          {/* Trend Header */}
                          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/90 text-xs font-mono">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-400">
                                <TrendingUp className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-white text-[11px] flex items-center gap-2">
                                  7-Day Heatmap Density Variations
                                  <span className="text-[8.5px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800/60 font-mono flex items-center gap-1">
                                    <Zap className="w-2.5 h-2.5 text-amber-400 animate-bounce" />
                                    Anomaly Detected (+85% Spike)
                                  </span>
                                </h4>
                                <p className="text-[9px] text-zinc-400 font-sans">
                                  Temporal breach density fluctuations & risk concentration over 7-day rolling window
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              id="close-7d-density-trend-overlay-btn"
                              onClick={() => setShowTrendOverlay(false)}
                              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-850 rounded-lg transition cursor-pointer border border-zinc-800"
                              title="Close trend visualization overlay"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Line Graph Canvas */}
                          <div className="w-full h-44 my-1 pt-1">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={trendData7Days} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.6} />
                                <XAxis dataKey="day" stroke="#a1a1aa" fontSize={9} tickLine={false} />
                                <YAxis stroke="#a1a1aa" fontSize={9} tickLine={false} />
                                <Tooltip 
                                  content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                      const dataItem = payload[0].payload;
                                      return (
                                        <div className="bg-zinc-950/95 border border-indigo-500/60 p-2 rounded-lg shadow-2xl backdrop-blur-md font-mono text-[9.5px]">
                                          <div className="text-white font-bold pb-1 mb-1 border-b border-zinc-800 flex items-center justify-between gap-3">
                                            <span>{dataItem.fullDate} ({label})</span>
                                            {dataItem.anomaly && (
                                              <span className="text-[8px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded border border-red-800 font-bold uppercase">
                                                Anomaly Spike
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-indigo-300 flex items-center justify-between gap-3">
                                            <span>Heatmap Density:</span>
                                            <span className="font-extrabold text-white">{dataItem.density} breaches/km²</span>
                                          </div>
                                          <div className="text-rose-400 flex items-center justify-between gap-3">
                                            <span>High Risk Breaches:</span>
                                            <span className="font-extrabold">{dataItem.highRiskCount}</span>
                                          </div>
                                          <div className="text-zinc-400 flex items-center justify-between gap-3">
                                            <span>Variance vs Avg:</span>
                                            <span className={`font-extrabold ${dataItem.varianceVal > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                                              {dataItem.variance}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="density" 
                                  name="Heatmap Density" 
                                  stroke="#818cf8" 
                                  strokeWidth={2.5} 
                                  dot={(props: any) => {
                                    const { cx, cy, payload } = props;
                                    if (payload.anomaly) {
                                      return (
                                        <circle key={`dot-${payload.day}`} cx={cx} cy={cy} r={5} fill="#f43f5e" stroke="#ffffff" strokeWidth={1.5} className="animate-pulse" />
                                      );
                                    }
                                    return <circle key={`dot-${payload.day}`} cx={cx} cy={cy} r={3} fill="#818cf8" stroke="#18181b" strokeWidth={1} />;
                                  }}
                                  activeDot={{ r: 6, fill: "#6366f1", stroke: "#ffffff", strokeWidth: 2 }} 
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="highRiskCount" 
                                  name="High Risk Count" 
                                  stroke="#f43f5e" 
                                  strokeWidth={1.5} 
                                  strokeDasharray="4 4"
                                  dot={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Trend Footer Stats */}
                          <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-zinc-800/80 font-mono text-[9px]">
                            <div className="bg-zinc-900/80 p-1.5 rounded-lg border border-zinc-800/60">
                              <span className="text-zinc-400 block text-[8px] uppercase">7D Peak Density</span>
                              <span className="font-bold text-rose-400">
                                {Math.max(...trendData7Days.map(d => d.density))} /km²
                              </span>
                            </div>
                            <div className="bg-zinc-900/80 p-1.5 rounded-lg border border-zinc-800/60">
                              <span className="text-zinc-400 block text-[8px] uppercase">7D Average</span>
                              <span className="font-bold text-indigo-300">
                                {Math.round(trendData7Days.reduce((acc, d) => acc + d.density, 0) / 7)} /km²
                              </span>
                            </div>
                            <div className="bg-zinc-900/80 p-1.5 rounded-lg border border-zinc-800/60">
                              <span className="text-zinc-400 block text-[8px] uppercase">Anomaly Spike</span>
                              <span className="font-bold text-amber-400">+85% (Fri)</span>
                            </div>
                            <div className="bg-zinc-900/80 p-1.5 rounded-lg border border-zinc-800/60">
                              <span className="text-zinc-400 block text-[8px] uppercase">Risk Ratio</span>
                              <span className="font-bold text-emerald-400">44% Severe</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {!hasValidKey ? (
                        <div className="flex flex-col items-center justify-center p-4 bg-zinc-950/40 h-full text-center max-w-md mx-auto">
                          <MapPin className="w-8 h-8 text-indigo-500 animate-bounce mb-2" />
                          <h4 className="text-xs font-bold text-white mb-1">Google Maps API Key Required</h4>
                          <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
                            Enter your Google Maps API Key to view an interactive geospatial heatmap of reseller locations and MAP violation frequencies.
                          </p>
                          <div className="text-left w-full space-y-1 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-850 text-[10px] font-sans leading-relaxed text-slate-300">
                            <p><span className="text-indigo-400 font-bold">1.</span> <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline hover:text-indigo-300 font-medium">Get an API Key</a></p>
                            <p><span className="text-indigo-400 font-bold">2.</span> Go to <strong className="text-white">Settings</strong> (⚙️ top-right) → <strong className="text-white">Secrets</strong> tab</p>
                            <p><span className="text-indigo-400 font-bold">3.</span> Add <code className="bg-zinc-800 px-1 py-0.2 rounded text-rose-300 text-[9px] font-mono">GOOGLE_MAPS_PLATFORM_KEY</code></p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setMapEngine("schematic")}
                            className="mt-3 px-2.5 py-1 text-[10px] font-mono bg-zinc-900 hover:bg-zinc-850 text-slate-300 border border-zinc-800 hover:border-zinc-700 rounded transition cursor-pointer"
                          >
                            Use Schematic Offline Fallback
                          </button>
                        </div>
                      ) : (
                        <APIProvider apiKey={API_KEY} version="weekly">
                          <div className="w-full h-full relative">
                            {/* Auto-Refresh Sweep Timer Control Group floating overlay in top-left */}
                            <div 
                              id="google-map-auto-refresh-control-group"
                              className="absolute top-2.5 left-2.5 z-30 bg-zinc-950/95 border border-zinc-800/90 rounded-xl p-1.5 text-[9px] font-mono shadow-2xl backdrop-blur-md flex items-center gap-1.5 border-indigo-900/40 select-none"
                            >
                              <div className="flex items-center gap-1 px-1">
                                <Clock className={`w-3 h-3 ${autoRefreshInterval !== "off" ? "text-indigo-400 animate-spin" : "text-zinc-500"}`} style={{ animationDuration: autoRefreshInterval !== "off" ? "6s" : "0s" }} />
                                <span className="text-[8px] font-extrabold text-zinc-400 uppercase tracking-wider hidden xl:inline-block">Auto-Sweep:</span>
                              </div>

                              {/* Interval Selector Buttons */}
                              <div className="flex items-center gap-0.5 bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800/80">
                                {(["off", "5m", "15m", "30m"] as const).map((interval) => (
                                  <button
                                    key={interval}
                                    type="button"
                                    id={`map-auto-refresh-btn-${interval}`}
                                    onClick={() => setAutoRefreshInterval(interval)}
                                    className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider transition cursor-pointer ${
                                      autoRefreshInterval === interval
                                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-950/80"
                                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                                    }`}
                                    title={interval === "off" ? "Disable automated map sweep refresh interval" : `Automatically trigger map sweep every ${interval}`}
                                  >
                                    {interval === "off" ? "Off" : interval}
                                  </button>
                                ))}
                              </div>

                              {/* Countdown Timer Display */}
                              {autoRefreshInterval !== "off" && (
                                <div 
                                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[9px] border transition-all duration-300 ${
                                    secondsRemaining !== null && secondsRemaining < 30
                                      ? "bg-red-950/90 text-red-400 border-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.4)] animate-pulse font-extrabold"
                                      : "bg-zinc-900/90 text-emerald-300 border-indigo-900/40"
                                  }`}
                                  title={`Next automated refresh in ${formatCountdown(secondsRemaining)}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    secondsRemaining !== null && secondsRemaining < 30 ? "bg-red-500 animate-ping" : "bg-emerald-400 animate-pulse"
                                  }`} />
                                  <span className="font-sans font-bold text-[8.5px] uppercase tracking-wider hidden md:inline-block">Auto-refresh Active</span>
                                  <span className="opacity-30 hidden md:inline-block">|</span>
                                  <span className="font-extrabold tracking-wider">{formatCountdown(secondsRemaining)}</span>
                                </div>
                              )}

                              {/* Price Delta Range Filter Dropdown */}
                              <div className="flex items-center gap-1 bg-zinc-900/90 px-1.5 py-0.5 rounded-lg border border-zinc-800/80">
                                <DollarSign className="w-3 h-3 text-amber-400 shrink-0" />
                                <span className="text-[8px] font-extrabold text-amber-400 uppercase tracking-wider hidden lg:inline-block">Delta:</span>
                                <select
                                  id="google-map-heatmap-price-delta-select"
                                  value={mapPriceDeltaFilter}
                                  onChange={(e) => setMapPriceDeltaFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                                  className="bg-zinc-950 border border-zinc-700/80 text-amber-300 text-[8.5px] font-bold rounded px-1.5 py-0.5 focus:outline-none focus:border-amber-500 cursor-pointer font-mono"
                                  title="Filter heatmap data points based on specific price delta ranges (e.g. >$10, >$50) to isolate extreme violations"
                                >
                                  <option value="all">All Deltas</option>
                                  <option value={10}>&gt; $10 Below MAP</option>
                                  <option value={25}>&gt; $25 Below MAP</option>
                                  <option value={50}>&gt; $50 Below MAP (Extreme)</option>
                                  <option value={100}>&gt; $100 Below MAP (Critical)</option>
                                </select>
                              </div>

                              {/* Sweep Now Manual Trigger */}
                              <button
                                type="button"
                                id="map-manual-sweep-now-btn"
                                onClick={triggerMapSweep}
                                disabled={isSweeping}
                                className={`px-2 py-1 rounded-lg text-[8.5px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer border ${
                                  isSweeping
                                    ? "bg-indigo-900/80 text-indigo-200 border-indigo-500/50"
                                    : "bg-indigo-950/80 text-indigo-300 hover:text-white hover:bg-indigo-600 border-indigo-800/60 hover:border-indigo-400"
                                }`}
                                title="Execute an immediate fresh map data sweep"
                              >
                                <RefreshCw className={`w-3 h-3 ${isSweeping ? "animate-spin text-cyan-300" : "text-indigo-400"}`} />
                                <span className="hidden sm:inline-block">{isSweeping ? "Sweeping..." : "Sweep Now"}</span>
                              </button>

                              {/* Download Current View as CSV button inside map view toolbar */}
                              <button
                                type="button"
                                id="download-current-view-csv-btn"
                                onClick={handleDownloadHeatmapViewCSV}
                                disabled={isExporting === "heatmap-current-view"}
                                className="px-2 py-1 rounded-lg text-[8.5px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer border bg-emerald-950/80 text-emerald-300 hover:text-white hover:bg-emerald-600 border-emerald-800/60 hover:border-emerald-400"
                                title="Download Current View as CSV containing visible heatmap data points, SKU, partner, and price delta"
                              >
                                <Download className={`w-3 h-3 ${isExporting === "heatmap-current-view" ? "animate-bounce text-emerald-200" : "text-emerald-400"}`} />
                                <span className="hidden xl:inline-block">Download Current View as CSV</span>
                                <span className="xl:hidden hidden md:inline-block">Export CSV</span>
                                <span className="md:hidden">CSV</span>
                              </button>
                            </div>

                            {/* Auto-Sweep Feedback Toast Overlay */}
                            {sweepFeedbackToast && (
                              <div 
                                id="map-sweep-feedback-toast"
                                className="absolute top-12 left-2.5 z-40 bg-indigo-950/95 border border-indigo-500/80 text-white px-3 py-1.5 rounded-xl shadow-2xl backdrop-blur-md text-[10px] font-mono flex items-center gap-2 animate-fade-in border-indigo-400/90"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse shrink-0" />
                                <span>{sweepFeedbackToast}</span>
                                <button 
                                  type="button" 
                                  onClick={() => setSweepFeedbackToast(null)}
                                  className="text-zinc-400 hover:text-white p-0.5 rounded ml-1"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            {/* Interactive Geospatial City & Zip Code Search Bar Overlay */}
                            <div 
                              id="map-location-search-overlay"
                              className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 w-[92%] sm:w-[380px]"
                            >
                              <div className="relative group">
                                <div className="bg-zinc-950/95 border border-zinc-800/90 hover:border-zinc-700 focus-within:border-indigo-500/80 rounded-xl shadow-2xl backdrop-blur-md px-2.5 py-1.5 flex items-center gap-2 transition duration-200">
                                  <Search className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-0.5" />
                                  <input
                                    type="text"
                                    value={mapSearchQuery}
                                    onChange={(e) => setMapSearchQuery(e.target.value)}
                                    onFocus={() => setIsMapSearchFocused(true)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        const topPartner = mapSearchSuggestions.partners[0];
                                        const topLocation = mapSearchSuggestions.locations[0];
                                        const customOpt = mapSearchSuggestions.customOption;
                                        if (topPartner) handleMapJumpTo(topPartner);
                                        else if (topLocation) handleMapJumpTo(topLocation);
                                        else if (customOpt) handleMapJumpTo(customOpt);
                                      } else if (e.key === "Escape") {
                                        setIsMapSearchFocused(false);
                                      }
                                    }}
                                    placeholder="Search city, zip code, or partner..."
                                    className="bg-transparent border-none text-slate-100 placeholder:text-zinc-500 text-[11px] focus:outline-none w-full font-sans tracking-wide"
                                  />
                                  {mapSearchQuery ? (
                                    <button
                                      type="button"
                                      onClick={() => setMapSearchQuery("")}
                                      className="text-zinc-500 hover:text-white p-0.5 rounded transition cursor-pointer"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  ) : (
                                    <kbd className="hidden sm:inline-block text-[8px] font-mono text-zinc-500 bg-zinc-900/80 border border-zinc-800 px-1 py-0.2 rounded shrink-0 select-none">
                                      ZIP / City
                                    </kbd>
                                  )}
                                </div>

                                {/* Search Results Dropdown */}
                                {isMapSearchFocused && (
                                  <div 
                                    className="absolute top-full left-0 right-0 mt-1.5 bg-zinc-950/98 border border-zinc-800/90 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden max-h-64 overflow-y-auto z-40 text-xs divide-y divide-zinc-900/80 animate-fade-in"
                                    onMouseDown={(e) => e.preventDefault()}
                                  >
                                    {/* Quick Hotspot Jumps when query is empty */}
                                    {!mapSearchQuery && (
                                      <div className="p-2 space-y-1.5">
                                        <div className="flex items-center justify-between text-[8.5px] font-bold text-zinc-400 uppercase tracking-wider px-1">
                                          <span>Quick Location Jumps</span>
                                          <span className="text-indigo-400 font-mono">Popular Zip Codes</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          {LOCATION_PRESETS.slice(0, 6).map((preset, idx) => (
                                            <button
                                              key={idx}
                                              type="button"
                                              onClick={() => handleMapJumpTo(preset)}
                                              className="px-2 py-1 bg-zinc-900/90 hover:bg-indigo-950/60 hover:text-indigo-300 border border-zinc-800 hover:border-indigo-700/50 rounded-lg text-[9.5px] font-mono text-slate-300 transition flex items-center gap-1 cursor-pointer"
                                            >
                                              <MapPin className="w-2.5 h-2.5 text-indigo-400" />
                                              <span>{preset.city} ({preset.zipCode})</span>
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Reseller Partners Matches */}
                                    {mapSearchSuggestions.partners.length > 0 && (
                                      <div className="p-1.5 space-y-1">
                                        <div className="px-2 py-0.5 text-[8.5px] font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-between">
                                          <span>Partner Resellers ({mapSearchSuggestions.partners.length})</span>
                                          <span className="text-zinc-500 text-[8px]">Partner Hotspots</span>
                                        </div>
                                        {mapSearchSuggestions.partners.map((item) => (
                                          <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => handleMapJumpTo(item)}
                                            className="w-full text-left px-2 py-1.5 hover:bg-zinc-900/90 rounded-lg transition flex items-center justify-between group/item cursor-pointer"
                                          >
                                            <div className="flex items-center gap-2 min-w-0">
                                              <div className="p-1 rounded bg-indigo-950/60 text-indigo-400 border border-indigo-900/40 group-hover/item:border-indigo-500/50 transition">
                                                <Building2 className="w-3 h-3" />
                                              </div>
                                              <div className="truncate">
                                                <div className="font-bold text-white text-[11px] truncate group-hover/item:text-indigo-300 transition">
                                                  {item.label}
                                                </div>
                                                <div className="text-[9px] text-slate-400 font-mono truncate">
                                                  {item.sublabel}
                                                </div>
                                              </div>
                                            </div>
                                            {item.activeViolationsCount > 0 ? (
                                              <span className="shrink-0 px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-rose-950/80 text-rose-400 border border-rose-900/50 font-mono">
                                                {item.activeViolationsCount} active
                                              </span>
                                            ) : (
                                              <span className="shrink-0 text-[8px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900/40">
                                                Compliant
                                              </span>
                                            )}
                                          </button>
                                        ))}
                                      </div>
                                    )}

                                    {/* Cities & Zip Codes Matches */}
                                    {mapSearchSuggestions.locations.length > 0 && (
                                      <div className="p-1.5 space-y-1">
                                        <div className="px-2 py-0.5 text-[8.5px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                                          <span>Cities & Zip Codes ({mapSearchSuggestions.locations.length})</span>
                                          <span className="text-zinc-500 text-[8px]">Postal Hubs</span>
                                        </div>
                                        {mapSearchSuggestions.locations.map((item) => (
                                          <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => handleMapJumpTo(item)}
                                            className="w-full text-left px-2 py-1.5 hover:bg-zinc-900/90 rounded-lg transition flex items-center justify-between group/item cursor-pointer"
                                          >
                                            <div className="flex items-center gap-2 min-w-0">
                                              <div className="p-1 rounded bg-amber-950/50 text-amber-400 border border-amber-900/40 group-hover/item:border-amber-500/50 transition">
                                                <MapPin className="w-3 h-3" />
                                              </div>
                                              <div className="truncate">
                                                <div className="font-bold text-white text-[11px] truncate group-hover/item:text-amber-300 transition">
                                                  {item.label}
                                                </div>
                                                <div className="text-[9px] text-slate-400 font-mono truncate">
                                                  {item.sublabel}
                                                </div>
                                              </div>
                                            </div>
                                            <span className="shrink-0 px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-zinc-900 text-amber-300 border border-zinc-800 font-mono">
                                              {item.zipCode}
                                            </span>
                                          </button>
                                        ))}
                                      </div>
                                    )}

                                    {/* Custom Zip Option */}
                                    {mapSearchSuggestions.customOption && (
                                      <div className="p-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleMapJumpTo(mapSearchSuggestions.customOption!)}
                                          className="w-full text-left px-2.5 py-1.5 hover:bg-indigo-950/40 rounded-lg transition flex items-center gap-2 group/item cursor-pointer border border-indigo-900/30"
                                        >
                                          <Navigation className="w-3.5 h-3.5 text-indigo-400 animate-pulse shrink-0" />
                                          <div className="truncate min-w-0">
                                            <div className="font-bold text-indigo-300 text-[11px] truncate">
                                              {mapSearchSuggestions.customOption.label}
                                            </div>
                                            <div className="text-[9px] text-slate-400 font-mono truncate">
                                              {mapSearchSuggestions.customOption.sublabel}
                                            </div>
                                          </div>
                                        </button>
                                      </div>
                                    )}

                                    {/* Empty Search Fallback */}
                                    {mapSearchQuery && mapSearchSuggestions.partners.length === 0 && mapSearchSuggestions.locations.length === 0 && !mapSearchSuggestions.customOption && (
                                      <div className="p-3 text-center text-slate-400 text-xs">
                                        No location matches for "{mapSearchQuery}"
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Active Location Jump Notification Toast */}
                            {mapActiveJumpToast && (
                              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 bg-zinc-950/95 border border-indigo-500/60 text-slate-100 px-3 py-1.5 rounded-lg shadow-2xl backdrop-blur-md text-[10px] font-mono flex items-center gap-2 animate-bounce border-indigo-900/80">
                                <MapPin className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                                <div className="flex items-center gap-1.5">
                                  <span className="text-zinc-400">Jumped to:</span>
                                  <span className="font-extrabold text-white">{mapActiveJumpToast.label}</span>
                                  <span className="text-indigo-400 text-[9px] font-bold">({mapActiveJumpToast.lat.toFixed(2)}, {mapActiveJumpToast.lng.toFixed(2)})</span>
                                </div>
                                <button 
                                  type="button" 
                                  onClick={() => setMapActiveJumpToast(null)}
                                  className="text-zinc-500 hover:text-white ml-1 p-0.5 rounded cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                            {/* Top-Right Map Controls Toolbar: All Partners vs Violating Only Toggle, Center on Active Violations, Reset View, Zoom Badge, Layer Toggle */}
                            <div className="absolute top-2.5 right-2.5 z-30 flex items-center gap-1.5 select-none">
                              {/* All Partners vs Violating Partners Only Segmented Toggle Switch */}
                              <div className="bg-zinc-950/95 border border-zinc-800 rounded-md p-0.5 shadow-xl backdrop-blur-md flex items-center gap-0.5">
                                <button
                                  type="button"
                                  id="dashboard-map-floating-scope-all"
                                  onClick={() => setMapShowOnlyFlagged(false)}
                                  className={`px-2 py-1 rounded text-[9.5px] font-mono font-bold flex items-center gap-1 transition cursor-pointer ${
                                    !mapShowOnlyFlagged
                                      ? "bg-indigo-600 text-white shadow-sm"
                                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                                  }`}
                                  title="Show all partner markers on the map"
                                >
                                  <Users className="w-3 h-3" />
                                  <span className="hidden sm:inline">All Partners</span>
                                </button>
                                <button
                                  type="button"
                                  id="dashboard-map-floating-scope-violating"
                                  onClick={() => setMapShowOnlyFlagged(true)}
                                  className={`px-2 py-1 rounded text-[9.5px] font-mono font-bold flex items-center gap-1 transition cursor-pointer ${
                                    mapShowOnlyFlagged
                                      ? "bg-rose-600 text-white shadow-sm shadow-rose-950/60"
                                      : "text-zinc-400 hover:text-rose-300 hover:bg-rose-950/30"
                                  }`}
                                  title="Switch map markers to display only violating partner locations"
                                >
                                  <ShieldAlert className={`w-3 h-3 ${mapShowOnlyFlagged ? "text-white animate-pulse" : "text-rose-400"}`} />
                                  <span className="hidden sm:inline">Violating Partners Only</span>
                                  <span className="sm:hidden">Violating</span>
                                </button>
                              </div>

                              {/* Center on Active Violations Button */}
                              <button
                                type="button"
                                id="center-on-active-violations-btn"
                                onClick={handleCenterOnActiveViolations}
                                className="bg-zinc-950/95 border border-rose-900/70 hover:border-rose-500 text-rose-300 hover:text-white rounded-md px-2.5 py-1 text-[10px] font-mono font-bold shadow-xl backdrop-blur-md flex items-center gap-1.5 transition cursor-pointer active:scale-95 group hover:bg-rose-950/40"
                                title="Dynamically reposition map viewport to encompass the geographic center of all current high-severity violation hotspots"
                              >
                                <Target className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform animate-pulse shrink-0" />
                                <span className="hidden sm:inline">Center on Active Violations</span>
                                <span className="sm:hidden">Active Violations</span>
                              </button>

                              {/* Floating Reset View Button */}
                              <button
                                type="button"
                                id="reset-map-view-btn"
                                onClick={() => {
                                  const defaultPreset = REGION_MAP_PRESETS[selectedGeoRegion || "us"] || REGION_MAP_PRESETS["us"];
                                  setMapCenterState(defaultPreset);
                                  setMapZoom(defaultPreset.zoom);
                                  setMapZoomState(defaultPreset.zoom);
                                  setMapActiveJumpToast(null);
                                  setMapSearchHighlight(null);
                                }}
                                className="bg-zinc-950/95 border border-zinc-800/90 hover:border-indigo-500/80 rounded-md px-2.5 py-1 text-[10px] font-mono font-bold text-slate-300 hover:text-white shadow-xl backdrop-blur-md flex items-center gap-1.5 transition cursor-pointer active:scale-95 border-indigo-500/30"
                                title="Return map zoom level and center position to default startup state"
                              >
                                <RotateCcw className="w-3 h-3 text-indigo-400 shrink-0" />
                                <span className="hidden md:inline">Reset View</span>
                              </button>

                              {/* Discreet Zoom Level Integer Badge */}
                              <div 
                                id="map-zoom-level-badge"
                                className="bg-zinc-950/90 border border-zinc-800/90 rounded-md px-2 py-1 text-[10px] font-mono font-bold text-indigo-400 shadow-xl backdrop-blur-md items-center gap-1.5 select-none border-indigo-500/30 hidden lg:flex"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                <span>Zoom: {Math.round(mapZoomState || mapZoom || REGION_MAP_PRESETS[selectedGeoRegion || "us"].zoom)}</span>
                              </div>

                              {/* Layer Toggle Menu */}
                              <div className="relative">
                                <button
                                  type="button"
                                  id="google-map-layer-toggle-btn"
                                  onClick={() => setIsLayerControlExpanded(prev => !prev)}
                                  className={`bg-zinc-950/95 border ${
                                    isLayerControlExpanded || (showViolationHeatmap && showHistoricalOverlay)
                                      ? "border-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.25)]"
                                      : "border-zinc-800/90 text-slate-300 hover:text-white hover:border-zinc-700"
                                  } rounded-md px-2.5 py-1 text-[10px] font-mono font-bold shadow-xl backdrop-blur-md flex items-center gap-1.5 transition cursor-pointer active:scale-95`}
                                  title="Toggle visibility of map layers: Current Violations Heatmap and Historical Breach Density Markers"
                                >
                                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                                  <span className="hidden sm:inline">Layer Toggle</span>
                                  <span className="text-[8px] px-1 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono">
                                    {[showViolationHeatmap, showHistoricalOverlay, showPartnerMarkers].filter(Boolean).length}/3
                                  </span>
                                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isLayerControlExpanded ? "rotate-180 text-indigo-300" : ""}`} />
                                </button>

                                {/* Layer Toggle Dropdown Panel */}
                                {isLayerControlExpanded && (
                                  <div 
                                    id="google-map-layer-toggle-dropdown"
                                    className="absolute top-full right-0 mt-1.5 w-72 bg-zinc-950/98 border border-zinc-800/95 rounded-xl p-3 shadow-2xl backdrop-blur-2xl font-mono text-[10px] select-none border-indigo-900/60 animate-fade-in z-50 divide-y divide-zinc-900"
                                  >
                                  {/* Menu Header */}
                                  <div className="flex items-center justify-between pb-2 mb-2">
                                    <div className="flex items-center gap-1.5">
                                      <div className="p-1 rounded bg-indigo-950/80 border border-indigo-800/60 text-indigo-400">
                                        <Layers className="w-3.5 h-3.5" />
                                      </div>
                                      <div>
                                        <div className="text-white font-bold text-[11px] leading-tight">Layer Visibility</div>
                                        <div className="text-[8px] text-zinc-400 font-sans">Isolate specific data patterns</div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setIsLayerControlExpanded(false)}
                                      className="text-zinc-500 hover:text-white p-0.5 rounded transition cursor-pointer"
                                      title="Close Layer Menu"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Layer Switches */}
                                  <div className="py-2 space-y-2">
                                    {/* Layer 1: Current Violations Heatmap */}
                                    <div className={`p-2 rounded-lg border transition-all ${
                                      showViolationHeatmap 
                                        ? "bg-rose-950/25 border-rose-900/50 shadow-inner" 
                                        : "bg-zinc-900/30 border-zinc-850 opacity-60"
                                    }`}>
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-start gap-2 pr-2">
                                          <div className={`p-1 rounded mt-0.5 ${showViolationHeatmap ? "bg-rose-950 text-rose-400 border border-rose-800/60" : "bg-zinc-800 text-zinc-500"}`}>
                                            <Flame className="w-3.5 h-3.5 animate-pulse" />
                                          </div>
                                          <div>
                                            <div className="font-bold text-white text-[10px] flex items-center gap-1.5">
                                              <span>Current Violations</span>
                                              <span className="text-[7.5px] px-1 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800/60 font-mono uppercase">
                                                Heatmap
                                              </span>
                                            </div>
                                            <div className="text-[8px] text-zinc-400 font-sans mt-0.5 leading-snug">
                                              Continuous gradient density of active price breaches
                                            </div>
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          id="layer-toggle-current-violations-heatmap-btn"
                                          onClick={() => setShowViolationHeatmap(prev => !prev)}
                                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                            showViolationHeatmap ? "bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.5)]" : "bg-zinc-800"
                                          }`}
                                          title="Toggle Current Violations Heatmap Layer"
                                        >
                                          <span
                                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                              showViolationHeatmap ? "translate-x-4" : "translate-x-0"
                                            }`}
                                          />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Layer 2: Historical Breach Density Distinct Markers */}
                                    <div className={`p-2 rounded-lg border transition-all ${
                                      showHistoricalOverlay 
                                        ? "bg-fuchsia-950/25 border-fuchsia-900/50 shadow-inner" 
                                        : "bg-zinc-900/30 border-zinc-850 opacity-60"
                                    }`}>
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-start gap-2 pr-2">
                                          <div className={`p-1 rounded mt-0.5 ${showHistoricalOverlay ? "bg-fuchsia-950 text-fuchsia-400 border border-fuchsia-800/60" : "bg-zinc-800 text-zinc-500"}`}>
                                            <ShieldAlert className="w-3.5 h-3.5" />
                                          </div>
                                          <div>
                                            <div className="font-bold text-white text-[10px] flex items-center gap-1.5">
                                              <span>Historical Breach Density</span>
                                              <span className="text-[7.5px] px-1 py-0.2 rounded bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800/60 font-mono uppercase">
                                                Markers
                                              </span>
                                            </div>
                                            <div className="text-[8px] text-zinc-400 font-sans mt-0.5 leading-snug">
                                              Distinct radar rings on repeat high-risk violation hotspots
                                            </div>
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          id="layer-toggle-historical-breach-density-btn"
                                          onClick={() => setShowHistoricalOverlay(prev => !prev)}
                                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                            showHistoricalOverlay ? "bg-fuchsia-600 shadow-[0_0_8px_rgba(217,70,239,0.5)]" : "bg-zinc-800"
                                          }`}
                                          title="Toggle Historical Breach Density Markers Layer"
                                        >
                                          <span
                                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                              showHistoricalOverlay ? "translate-x-4" : "translate-x-0"
                                            }`}
                                          />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Layer 3: Reseller Partner Pins / Clusters */}
                                    <div className={`p-2 rounded-lg border transition-all ${
                                      showPartnerMarkers 
                                        ? "bg-indigo-950/25 border-indigo-900/50 shadow-inner" 
                                        : "bg-zinc-900/30 border-zinc-850 opacity-60"
                                    }`}>
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-start gap-2 pr-2">
                                          <div className={`p-1 rounded mt-0.5 ${showPartnerMarkers ? "bg-indigo-950 text-indigo-400 border border-indigo-800/60" : "bg-zinc-800 text-zinc-500"}`}>
                                            <MapPin className="w-3.5 h-3.5" />
                                          </div>
                                          <div>
                                            <div className="font-bold text-white text-[10px] flex items-center gap-1.5">
                                              <span>Partner Nodes & Clusters</span>
                                              <span className="text-[7.5px] px-1 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono uppercase">
                                                Pins
                                              </span>
                                            </div>
                                            <div className="text-[8px] text-zinc-400 font-sans mt-0.5 leading-snug">
                                              Individual reseller coordinate pins & clustered hubs
                                            </div>
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          id="layer-toggle-partner-markers-btn"
                                          onClick={() => setShowPartnerMarkers(prev => !prev)}
                                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                            showPartnerMarkers ? "bg-indigo-600 shadow-[0_0_8px_rgba(99,102,241,0.5)]" : "bg-zinc-800"
                                          }`}
                                          title="Toggle Reseller Partner Pins Layer"
                                        >
                                          <span
                                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                              showPartnerMarkers ? "translate-x-4" : "translate-x-0"
                                            }`}
                                          />
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Quick Pattern Isolation Presets */}
                                  <div className="pt-2">
                                    <div className="text-[7.5px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                      <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                                      <span>Pattern Isolation Presets</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1">
                                      <button
                                        type="button"
                                        id="preset-heatmap-only-btn"
                                        onClick={() => {
                                          setShowViolationHeatmap(true);
                                          setShowHistoricalOverlay(false);
                                          setShowPartnerMarkers(false);
                                        }}
                                        className={`px-1.5 py-1 rounded text-[8px] font-bold border transition cursor-pointer flex flex-col items-center gap-0.5 ${
                                          showViolationHeatmap && !showHistoricalOverlay && !showPartnerMarkers
                                            ? "bg-rose-950 text-rose-300 border-rose-600 font-extrabold shadow-sm"
                                            : "bg-zinc-900/80 text-zinc-400 hover:text-white border-zinc-800 hover:border-zinc-700"
                                        }`}
                                        title="Isolate Current Violations Heatmap only"
                                      >
                                        <Flame className="w-3 h-3 text-rose-400" />
                                        <span>Heatmap Only</span>
                                      </button>
                                      <button
                                        type="button"
                                        id="preset-historical-only-btn"
                                        onClick={() => {
                                          setShowViolationHeatmap(false);
                                          setShowHistoricalOverlay(true);
                                          setShowPartnerMarkers(false);
                                        }}
                                        className={`px-1.5 py-1 rounded text-[8px] font-bold border transition cursor-pointer flex flex-col items-center gap-0.5 ${
                                          !showViolationHeatmap && showHistoricalOverlay && !showPartnerMarkers
                                            ? "bg-fuchsia-950 text-fuchsia-300 border-fuchsia-600 font-extrabold shadow-sm"
                                            : "bg-zinc-900/80 text-zinc-400 hover:text-white border-zinc-800 hover:border-zinc-700"
                                        }`}
                                        title="Isolate Historical Breach Density markers only"
                                      >
                                        <ShieldAlert className="w-3 h-3 text-fuchsia-400" />
                                        <span>Historic Only</span>
                                      </button>
                                      <button
                                        type="button"
                                        id="preset-all-layers-btn"
                                        onClick={() => {
                                          setShowViolationHeatmap(true);
                                          setShowHistoricalOverlay(true);
                                          setShowPartnerMarkers(true);
                                        }}
                                        className={`px-1.5 py-1 rounded text-[8px] font-bold border transition cursor-pointer flex flex-col items-center gap-0.5 ${
                                          showViolationHeatmap && showHistoricalOverlay && showPartnerMarkers
                                            ? "bg-indigo-950 text-indigo-300 border-indigo-600 font-extrabold shadow-sm"
                                            : "bg-zinc-900/80 text-zinc-400 hover:text-white border-zinc-800 hover:border-zinc-700"
                                        }`}
                                        title="Enable all layers simultaneously"
                                      >
                                        <Layers className="w-3 h-3 text-indigo-400" />
                                        <span>Show All</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                              </div>
                            </div>

                            {/* Sensitivity Toggle Button next to vertical zoom slider */}
                            <button
                              type="button"
                              id="map-sensitivity-toggle-btn"
                              onClick={() => setMapSensitivity(prev => prev === "precise" ? "rapid" : "precise")}
                              className={`absolute top-11 right-15 bg-zinc-950/95 border ${
                                mapSensitivity === "precise" 
                                  ? "border-indigo-500/60 text-indigo-300 shadow-indigo-500/10 hover:border-indigo-400" 
                                  : "border-amber-500/60 text-amber-300 shadow-amber-500/10 hover:border-amber-400"
                              } hover:bg-zinc-900 rounded-xl px-2 py-1.5 text-[9px] font-mono shadow-2xl backdrop-blur-md z-20 flex flex-col items-center gap-1 select-none transition-all duration-300 active:scale-95 cursor-pointer border-indigo-900/50 group`}
                              title={`Sensitivity Mode: ${mapSensitivity === "precise" ? "Precise (fine-grained 0.1x steps)" : "Rapid (coarse-grained 1.0x steps)"}. Click to toggle.`}
                            >
                              <div className="flex items-center gap-1">
                                {mapSensitivity === "precise" ? (
                                  <Sliders className="w-3 h-3 text-indigo-400 shrink-0 group-hover:rotate-90 transition-transform duration-300" />
                                ) : (
                                  <Zap className="w-3 h-3 text-amber-400 shrink-0 group-hover:scale-125 transition-transform duration-300" />
                                )}
                                <span className="font-extrabold uppercase text-[8px] tracking-wider">
                                  {mapSensitivity === "precise" ? "Precise" : "Rapid"}
                                </span>
                              </div>
                              <span className="text-[7px] text-zinc-400 font-mono">
                                {mapSensitivity === "precise" ? "0.1x Step" : "1.0x Step"}
                              </span>
                            </button>

                            {/* Floating Vertical Zoom Slider Control Component */}
                            <div 
                              id="map-vertical-zoom-slider"
                              className="absolute top-11 right-2.5 bg-zinc-950/95 border border-zinc-800/90 hover:border-indigo-500/70 rounded-xl p-2 text-[9px] font-mono shadow-2xl backdrop-blur-md z-20 flex flex-col items-center gap-1.5 select-none transition-all duration-300 border-indigo-900/50 w-11 hover:shadow-indigo-500/10 animate-fade-in group"
                            >
                              {/* Layer Selector & Active Mode Indicator Dropdown Button */}
                              <div className="relative flex flex-col items-center w-full pb-1 border-b border-zinc-800/80">
                                <button
                                  type="button"
                                  id="map-layer-mode-dropdown-btn"
                                  onClick={() => setIsLayerDropdownOpen(prev => !prev)}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 border ${
                                    mapOverlayLayer === "heatmap"
                                      ? "bg-rose-950/80 border-rose-500/70 text-rose-400 hover:bg-rose-900/90 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                                      : mapOverlayLayer === "pins"
                                      ? "bg-indigo-950/80 border-indigo-500/70 text-indigo-300 hover:bg-indigo-900/90 shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                                      : "bg-cyan-950/80 border-cyan-500/70 text-cyan-300 hover:bg-cyan-900/90 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                                  }`}
                                  title={`Active Layer: ${
                                    mapOverlayLayer === "heatmap" ? "Heatmap" : mapOverlayLayer === "pins" ? "Point Pins" : "Territory Boundary"
                                  }. Click to change layer.`}
                                >
                                  {mapOverlayLayer === "heatmap" && <Flame className="w-3.5 h-3.5" />}
                                  {mapOverlayLayer === "pins" && <MapPin className="w-3.5 h-3.5" />}
                                  {mapOverlayLayer === "territory" && <Layers className="w-3.5 h-3.5" />}
                                </button>

                                {/* Active Layer Pill Badge */}
                                <span className={`mt-1 text-[7px] font-extrabold uppercase tracking-tighter text-center leading-tight truncate px-1 py-0.2 rounded border ${
                                  mapOverlayLayer === "heatmap"
                                    ? "text-rose-400 bg-rose-950/90 border-rose-800/60"
                                    : mapOverlayLayer === "pins"
                                    ? "text-indigo-300 bg-indigo-950/90 border-indigo-800/60"
                                    : "text-cyan-300 bg-cyan-950/90 border-cyan-800/60"
                                }`}>
                                  {mapOverlayLayer === "heatmap" ? "Heat" : mapOverlayLayer === "pins" ? "Pins" : "Terr"}
                                </span>

                                {/* Layer Switcher Popover / Dropdown Menu */}
                                {isLayerDropdownOpen && (
                                  <div 
                                    id="map-layer-mode-dropdown-menu"
                                    className="absolute right-12 top-0 bg-zinc-950/98 border border-zinc-700/80 rounded-xl p-1.5 shadow-2xl backdrop-blur-xl z-50 flex flex-col gap-1 w-44 animate-in fade-in zoom-in-95 duration-150"
                                  >
                                    <div className="px-2 py-1 text-[8px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 flex items-center justify-between">
                                      <span>Map Overlay Layer</span>
                                      <span className={`w-1.5 h-1.5 rounded-full ${
                                        mapOverlayLayer === "heatmap" ? "bg-rose-400" : mapOverlayLayer === "pins" ? "bg-indigo-400" : "bg-cyan-400"
                                      }`} />
                                    </div>

                                    {/* Option 1: Heatmap */}
                                    <button
                                      type="button"
                                      id="map-layer-option-heatmap"
                                      onClick={() => {
                                        setMapOverlayLayer("heatmap");
                                        setShowViolationHeatmap(true);
                                        setShowPartnerMarkers(false);
                                        setIsLayerDropdownOpen(false);
                                      }}
                                      className={`px-2 py-1.5 rounded-lg text-left text-[9px] font-mono flex items-center gap-2 transition cursor-pointer ${
                                        mapOverlayLayer === "heatmap"
                                          ? "bg-rose-950/80 text-rose-200 border border-rose-500/50 font-bold"
                                          : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                                      }`}
                                    >
                                      <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                      <div className="flex flex-col">
                                        <span>Heatmap</span>
                                        <span className="text-[7.5px] text-zinc-400 font-normal">Violation density hotspots</span>
                                      </div>
                                    </button>

                                    {/* Option 2: Point Pins */}
                                    <button
                                      type="button"
                                      id="map-layer-option-pins"
                                      onClick={() => {
                                        setMapOverlayLayer("pins");
                                        setShowPartnerMarkers(true);
                                        setShowViolationHeatmap(false);
                                        setIsLayerDropdownOpen(false);
                                      }}
                                      className={`px-2 py-1.5 rounded-lg text-left text-[9px] font-mono flex items-center gap-2 transition cursor-pointer ${
                                        mapOverlayLayer === "pins"
                                          ? "bg-indigo-950/80 text-indigo-200 border border-indigo-500/50 font-bold"
                                          : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                                      }`}
                                    >
                                      <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                      <div className="flex flex-col">
                                        <span>Point Pins</span>
                                        <span className="text-[7.5px] text-zinc-400 font-normal">Reseller GPS coordinates</span>
                                      </div>
                                    </button>

                                    {/* Option 3: Territory Boundary */}
                                    <button
                                      type="button"
                                      id="map-layer-option-territory"
                                      onClick={() => {
                                        setMapOverlayLayer("territory");
                                        setShowViolationHeatmap(true);
                                        setShowPartnerMarkers(true);
                                        setIsLayerDropdownOpen(false);
                                      }}
                                      className={`px-2 py-1.5 rounded-lg text-left text-[9px] font-mono flex items-center gap-2 transition cursor-pointer ${
                                        mapOverlayLayer === "territory"
                                          ? "bg-cyan-950/80 text-cyan-200 border border-cyan-500/50 font-bold"
                                          : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                                      }`}
                                    >
                                      <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                      <div className="flex flex-col">
                                        <span>Territory Boundary</span>
                                        <span className="text-[7.5px] text-zinc-400 font-normal">Regional compliance zones</span>
                                      </div>
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Zoom In */}
                              <button
                                type="button"
                                id="google-map-zoom-in-btn"
                                onClick={() => {
                                  const curr = mapZoomState || mapZoom || REGION_MAP_PRESETS[selectedGeoRegion || "us"].zoom;
                                  const stepVal = mapSensitivity === "precise" ? 0.25 : 1.5;
                                  const next = Math.min(18, Math.round((curr + stepVal) * 100) / 100);
                                  setMapZoom(next);
                                  setMapZoomState(next);
                                }}
                                className="p-1 rounded-lg hover:bg-indigo-950/80 text-indigo-400 hover:text-indigo-200 transition-all duration-200 cursor-pointer active:scale-90 hover:scale-110"
                                title={`Zoom In (${mapSensitivity === "precise" ? "+0.25" : "+1.5"})`}
                              >
                                <ZoomIn className="w-3.5 h-3.5" />
                              </button>

                              {/* Discrete Zoom Steps (25%, 50%, 75%, 100%) */}
                              <div 
                                id="map-discrete-zoom-steps" 
                                className="flex flex-col items-center gap-0.5 w-full py-1 border-y border-zinc-800/80"
                              >
                                <span className="text-[6.5px] font-mono font-bold text-zinc-500 uppercase tracking-tighter">Steps</span>
                                {[
                                  { label: "100%", zoom: 18, desc: "Street Level (18.0x)" },
                                  { label: "75%", zoom: 14, desc: "District Level (14.0x)" },
                                  { label: "50%", zoom: 10, desc: "City Level (10.0x)" },
                                  { label: "25%", zoom: 6, desc: "Regional / Metro (6.0x)" },
                                ].map((step) => {
                                  const currentZoom = mapZoomState || mapZoom || REGION_MAP_PRESETS[selectedGeoRegion || "us"].zoom;
                                  const isSelected = Math.abs(currentZoom - step.zoom) < 2.0;
                                  return (
                                    <button
                                      key={step.label}
                                      type="button"
                                      id={`map-zoom-step-${step.label.replace('%', '')}`}
                                      onClick={() => {
                                        setMapZoom(step.zoom);
                                        setMapZoomState(step.zoom);
                                      }}
                                      className={`w-full py-0.5 px-0.5 rounded text-[7px] font-mono font-bold text-center transition-all duration-150 cursor-pointer border ${
                                        isSelected
                                          ? "bg-indigo-600/90 text-white shadow-[0_0_8px_rgba(99,102,241,0.6)] border-indigo-400"
                                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 border-transparent"
                                      }`}
                                      title={`Jump to ${step.label} magnification (${step.desc})`}
                                    >
                                      {step.label}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Vertical Range Slider Track with Smooth Gradient Fill Indicator */}
                              {(() => {
                                const currentZoom = mapZoomState || mapZoom || REGION_MAP_PRESETS[selectedGeoRegion || "us"].zoom;
                                const zoomPercentage = Math.min(100, Math.max(0, ((currentZoom - 2) / 16) * 100));
                                return (
                                  <div className="h-24 flex items-center justify-center relative my-0.5 w-full group/track">
                                    {/* Background Track Rail */}
                                    <div className="absolute inset-y-1 w-1.5 bg-zinc-850 rounded-full overflow-hidden pointer-events-none flex flex-col justify-end">
                                      {/* Active Fill Gradient Bar with Smooth CSS Transition */}
                                      <div 
                                        className={`w-full bg-gradient-to-t ${
                                          mapSensitivity === "precise" 
                                            ? "from-indigo-600 via-indigo-500 to-cyan-400 shadow-[0_0_8px_rgba(99,102,241,0.6)]" 
                                            : "from-amber-600 via-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                                        } rounded-full transition-all duration-300 ease-out`}
                                        style={{ height: `${zoomPercentage}%` }}
                                      />
                                    </div>

                                    {/* Range Input Slider Control */}
                                    <input
                                      type="range"
                                      orient="vertical"
                                      min={2}
                                      max={18}
                                      step={mapSensitivity === "precise" ? 0.1 : 1.0}
                                      value={currentZoom}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setMapZoom(val);
                                        setMapZoomState(val);
                                      }}
                                      style={{ WebkitAppearance: "slider-vertical" } as React.CSSProperties}
                                      className="h-20 w-3 accent-indigo-500 opacity-80 hover:opacity-100 transition-opacity duration-200 cursor-pointer [writing-mode:vertical-lr] [direction:rtl] z-10"
                                      title={`Adjust Map Zoom Level (${mapSensitivity === "precise" ? "Precise 0.1x steps" : "Rapid 1.0x steps"})`}
                                    />
                                  </div>
                                );
                              })()}

                              {/* Dynamic Zoom Value Display Badge */}
                              <span className={`text-[8px] font-mono font-extrabold ${
                                mapSensitivity === "precise" ? "text-indigo-300 bg-indigo-950/90 border-indigo-800/70 border-indigo-500/40" : "text-amber-300 bg-amber-950/90 border-amber-800/70 border-amber-500/40"
                              } border rounded-md px-1.5 py-0.5 shadow-sm transition-transform duration-200 hover:scale-105`}>
                                {(mapZoomState || mapZoom || REGION_MAP_PRESETS[selectedGeoRegion || "us"].zoom).toFixed(1)}x
                              </span>

                              {/* Zoom Out */}
                              <button
                                type="button"
                                id="google-map-zoom-out-btn"
                                onClick={() => {
                                  const curr = mapZoomState || mapZoom || REGION_MAP_PRESETS[selectedGeoRegion || "us"].zoom;
                                  const stepVal = mapSensitivity === "precise" ? 0.25 : 1.5;
                                  const next = Math.max(2, Math.round((curr - stepVal) * 100) / 100);
                                  setMapZoom(next);
                                  setMapZoomState(next);
                                }}
                                className="p-1 rounded-lg hover:bg-indigo-950/80 text-indigo-400 hover:text-indigo-200 transition-all duration-200 cursor-pointer active:scale-90 hover:scale-110"
                                title={`Zoom Out (${mapSensitivity === "precise" ? "-0.25" : "-1.5"})`}
                              >
                                <ZoomOut className="w-3.5 h-3.5" />
                              </button>

                              {/* Reset View Button */}
                              <button
                                type="button"
                                id="map-reset-view-btn"
                                onClick={() => {
                                  const defaultPreset = REGION_MAP_PRESETS[selectedGeoRegion || "us"] || REGION_MAP_PRESETS["us"];
                                  setMapCenterState(defaultPreset);
                                  setMapZoom(defaultPreset.zoom);
                                  setMapZoomState(defaultPreset.zoom);
                                  setMapActiveJumpToast(null);
                                }}
                                className="w-full pt-1.5 mt-0.5 border-t border-zinc-800/90 text-indigo-400 hover:text-white text-[7px] transition-all duration-200 cursor-pointer font-mono font-bold uppercase flex flex-col items-center justify-center gap-0.5 hover:bg-indigo-950/40 rounded-b-lg active:scale-95 text-center"
                                title="Reset View: Center map and reset zoom level to default"
                              >
                                <RotateCcw className="w-3 h-3 text-indigo-400 shrink-0" />
                                <span className="leading-tight truncate">Reset View</span>
                              </button>
                            </div>

                            {/* Discreet Zoom Level & Granularity Indicator Badge */}
                            {(() => {
                              const currentZoomVal = mapZoomState || mapZoom || REGION_MAP_PRESETS[selectedGeoRegion || "us"].zoom;
                              const zoomGranularity = getZoomGranularityLabel(currentZoomVal);
                              return (
                                <div 
                                  id="map-zoom-granularity-indicator"
                                  className="absolute top-2.5 left-2.5 bg-zinc-950/95 border border-zinc-800/90 rounded-lg px-2.5 py-1.5 text-[9px] font-mono text-slate-300 shadow-xl backdrop-blur-md flex items-center gap-2 z-10 select-none animate-fade-in border-indigo-900/40"
                                >
                                  <span className="relative flex h-2 w-2 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                  </span>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[8px]">Granularity:</span>
                                      <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold border ${zoomGranularity.badgeColor}`}>
                                        {zoomGranularity.label}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 text-[8.5px]">
                                      <span className="text-zinc-500 text-[8px]">{zoomGranularity.detail}</span>
                                      <span className="text-zinc-700">•</span>
                                      <span className="text-indigo-400 font-extrabold font-mono">Zoom: {Math.round(currentZoomVal)}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Floating Heatmap Analyzer Controls Widget & Spectrum Legend */}
                            <div className="absolute top-[58px] left-2.5 bg-zinc-950/95 border border-zinc-800 rounded-lg p-2.5 text-[9px] font-mono text-slate-300 w-44 shadow-2xl backdrop-blur-md z-10 flex flex-col gap-2 select-none animate-fade-in border-rose-950/45">
                              <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5 mb-1">
                                <div className="flex items-center gap-1">
                                  <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                                  <span className="text-zinc-200 font-extrabold uppercase tracking-wider text-[8px]">Heatmap Analyzer</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setShowViolationHeatmap(prev => !prev)}
                                  className={`px-1.5 py-0.5 rounded text-[8px] font-bold border cursor-pointer transition ${
                                    showViolationHeatmap 
                                      ? "bg-rose-950/40 text-rose-400 border-rose-900/30" 
                                      : "bg-zinc-900/40 text-slate-500 border-zinc-800/40"
                                  }`}
                                >
                                  {showViolationHeatmap ? "ON" : "OFF"}
                                </button>
                              </div>

                              {showViolationHeatmap && (
                                <>
                                  {/* Metric Selector */}
                                  <div className="space-y-1">
                                    <label className="text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider">Metric Density Source</label>
                                    <div className="grid grid-cols-3 gap-0.5 bg-zinc-900/60 border border-zinc-850 p-0.5 rounded">
                                      <button
                                        type="button"
                                        onClick={() => setHeatmapIntensityMetric("violations")}
                                        className={`py-0.5 text-[7px] font-extrabold rounded-sm cursor-pointer transition ${
                                          heatmapIntensityMetric === "violations"
                                            ? "bg-rose-950/40 text-rose-400 font-black border border-rose-900/30"
                                            : "text-slate-500 hover:text-slate-300"
                                        }`}
                                        title="Density based on historical count of violating sweeps"
                                      >
                                        History
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setHeatmapIntensityMetric("frequency")}
                                        className={`py-0.5 text-[7px] font-extrabold rounded-sm cursor-pointer transition ${
                                          heatmapIntensityMetric === "frequency"
                                            ? "bg-rose-950/40 text-rose-400 font-black border border-rose-900/30"
                                            : "text-slate-500 hover:text-slate-300"
                                        }`}
                                        title="Density based on frequency of pricing violations %"
                                      >
                                        Freq %
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setHeatmapIntensityMetric("activeViolations")}
                                        className={`py-0.5 text-[7px] font-extrabold rounded-sm cursor-pointer transition ${
                                          heatmapIntensityMetric === "activeViolations"
                                            ? "bg-rose-950/40 text-rose-400 font-black border border-rose-900/30"
                                            : "text-slate-500 hover:text-slate-300"
                                        }`}
                                        title="Density based on current active live violations count"
                                      >
                                        Active
                                      </button>
                                    </div>
                                  </div>

                                  {/* Radius Scale Slider */}
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[7.5px] text-zinc-400 font-bold">
                                      <span className="uppercase tracking-wider">Heat Radius Scale</span>
                                      <span className="text-rose-400 font-extrabold font-mono">{heatmapRadiusScale.toFixed(1)}x</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="0.5"
                                      max="2.5"
                                      step="0.1"
                                      value={heatmapRadiusScale}
                                      onChange={(e) => setHeatmapRadiusScale(parseFloat(e.target.value))}
                                      className="w-full accent-rose-500 bg-zinc-900 h-1 rounded cursor-pointer"
                                    />
                                  </div>

                                  {/* Spectrum Legend */}
                                  <div className="pt-1.5 border-t border-zinc-900 space-y-1">
                                    <span className="text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider block">Violation Density Spectrum</span>
                                    <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 opacity-80" />
                                    <div className="flex justify-between text-[6.5px] text-slate-500 font-bold">
                                      <span>LOW DENSITY</span>
                                      <span>CRITICAL</span>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>

                            <GoogleMap
                              defaultCenter={REGION_MAP_PRESETS[selectedGeoRegion || "us"]}
                              defaultZoom={REGION_MAP_PRESETS[selectedGeoRegion || "us"].zoom}
                              mapId="DEMO_MAP_ID"
                              mapTypeId={mapTypeId}
                              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                              gestureHandling="cooperative"
                              disableDefaultUI={true}
                              style={{ width: "100%", height: "100%" }}
                            >
                              <MapController 
                                center={mapCenterState || REGION_MAP_PRESETS[selectedGeoRegion || "us"]} 
                                zoom={mapZoomState || REGION_MAP_PRESETS[selectedGeoRegion || "us"].zoom} 
                                mapTypeId={mapTypeId}
                                onZoomChange={(z) => {
                                  setMapZoom(z);
                                  setMapZoomState(z);
                                }}
                              />
                              
                              {/* Render reseller partner heatmap nodes with dynamic clustering support */}
                              {showPartnerMarkers && (() => {
                                const activePoints = partnerHeatPoints.filter(point => {
                                  // 1. Severity filter
                                  const sev = getSeverityOfPoint(point);
                                  if (!mapSeverityFilters[sev as keyof typeof mapSeverityFilters]) return false;

                                  // 2. Partner region filter
                                  if (mapRegionFilter !== "all") {
                                    const region = getRegionForPartnerName(point.partner.name, point.partner.domain);
                                    if (region !== mapRegionFilter) return false;
                                  }

                                  // 3. Product category filter
                                  if (mapCategoryFilter !== "all") {
                                    const partnerProductIds = point.partner.associatedProducts || [];
                                    const hasProductInSelectedCategory = partnerProductIds.some((pId: string) => {
                                      const cat = getProductCategory(pId);
                                      return cat === mapCategoryFilter;
                                    });
                                    if (!hasProductInSelectedCategory) return false;
                                  }

                                  // 4. Currently flagged for MAP violations filter
                                  if (mapShowOnlyFlagged) {
                                    const hasActiveViolation = activeViolationsList.some(
                                      v => v.partner === point.partner.name || v.domain === point.partner.domain
                                    );
                                    if (!hasActiveViolation) return false;
                                  }

                                  // 5. Price delta threshold filter
                                  if (mapPriceDeltaFilter !== "all") {
                                    const delta = getPointMaxPriceDelta(point);
                                    if (delta < mapPriceDeltaFilter) return false;
                                  }

                                  return true;
                                });

                                const clusters = getMapClusters(activePoints, mapZoom, isClusteringEnabled);

                                return clusters.map(cluster => {
                                  if (!cluster.isCluster) {
                                    const point = cluster.points[0];
                                    const violationsCount = point.violatingScansWithPartner;
                                    const isPulsing = violationsCount > 0;
                                    const freq = point.frequencyRate;

                                    const partnerActiveViolations = activeViolationsList.filter(
                                      v => v.partner === point.partner.name || v.domain === point.partner.domain
                                    );
                                    const activeViolationsCount = partnerActiveViolations.length;
                                    const historicalViolationsCount = point.violatingScansWithPartner;

                                    // Calculate highest severity based on active violations (if any) or overall historical frequency
                                    let highestSeverity = "Compliant";
                                    let severityColorClass = "text-emerald-400 bg-emerald-950/40 border border-emerald-900/30";

                                    if (activeViolationsCount > 0) {
                                      let maxPct = 0;
                                      partnerActiveViolations.forEach(v => {
                                        const diff = v.map - v.found;
                                        const pct = Math.round((diff / v.map) * 100);
                                        if (pct > maxPct) maxPct = pct;
                                      });

                                      if (maxPct >= 15) {
                                        highestSeverity = "Critical (High)";
                                        severityColorClass = "text-red-400 bg-red-950/40 border border-red-900/30 animate-pulse";
                                      } else if (maxPct >= 5) {
                                        highestSeverity = "Moderate (Medium)";
                                        severityColorClass = "text-amber-400 bg-amber-950/40 border border-amber-900/30";
                                      } else {
                                        highestSeverity = "Minor (Low)";
                                        severityColorClass = "text-orange-400 bg-orange-950/40 border border-orange-900/30";
                                      }
                                    } else if (historicalViolationsCount > 0) {
                                      const overallSev = getSeverityOfPoint(point);
                                      if (overallSev === "high") {
                                        highestSeverity = "High (Historical)";
                                        severityColorClass = "text-red-400 bg-red-950/40 border border-red-900/30";
                                      } else if (overallSev === "medium") {
                                        highestSeverity = "Medium (Historical)";
                                        severityColorClass = "text-amber-400 bg-amber-950/40 border border-amber-900/30";
                                      } else {
                                        highestSeverity = "Low (Historical)";
                                        severityColorClass = "text-orange-400 bg-orange-950/40 border border-orange-900/30";
                                      }
                                    }

                                    return (
                                      <AdvancedMarker
                                        key={cluster.id}
                                        position={{ lat: cluster.lat, lng: cluster.lng }}
                                        title={point.partner.name}
                                        onClick={() => setSelectedPartnerPin(point)}
                                      >
                                        <div className="relative flex items-center justify-center cursor-pointer group">
                                          {isPulsing && (
                                            <span className={`absolute inline-flex h-8 w-8 rounded-full opacity-60 animate-ping ${
                                              violationsCount > 3 ? "bg-red-500" : violationsCount > 1 ? "bg-amber-500" : "bg-orange-400"
                                            }`} />
                                          )}
                                          <div className="relative">
                                            <span className={`relative inline-flex rounded-full h-3.5 w-3.5 border-1.5 border-zinc-950 shadow-md transition-transform group-hover:scale-125 ${
                                              violationsCount > 3 ? "bg-red-600" : violationsCount > 1 ? "bg-amber-500" : violationsCount > 0 ? "bg-orange-400" : "bg-emerald-500"
                                            }`} />
                                            {violationsCount > 0 && (
                                              <span className={`absolute -top-1.5 -right-1.5 flex h-3 min-w-[12px] items-center justify-center rounded-full px-0.5 text-[6.5px] font-extrabold text-white shadow-md border border-zinc-950 select-none ${
                                                violationsCount > 3 ? "bg-red-500" : violationsCount > 1 ? "bg-amber-500" : "bg-orange-500"
                                              }`}>
                                                {violationsCount}
                                              </span>
                                            )}
                                          </div>

                                          {/* Hover Tooltip for Single Reseller Marker */}
                                          <div className="absolute z-50 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full mb-2 px-1 left-1/2 -translate-x-1/2 before:absolute before:h-4 before:w-full before:top-full before:left-0">
                                            <div className="bg-zinc-950/95 border border-zinc-800 text-slate-100 p-3 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.5)] w-56 text-[10px] font-mono leading-normal backdrop-blur-md relative">
                                              
                                              {/* Header */}
                                              <div className="flex items-start justify-between border-b border-zinc-900 pb-1.5 mb-2">
                                                <div className="max-w-[155px]">
                                                  <div className="font-extrabold text-white text-[11px] truncate" title={point.partner.name}>
                                                    {point.partner.name}
                                                  </div>
                                                  <div className="text-[8.5px] text-slate-400 truncate mt-0.5 select-all">
                                                    {point.partner.domain}
                                                  </div>
                                                </div>
                                                
                                                {/* Copy Action Button */}
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigator.clipboard.writeText(`${point.partner.name}\nDomain: ${point.partner.domain}\nActive Violations: ${activeViolationsCount}\nHistorical Violations: ${historicalViolationsCount}\nSeverity: ${highestSeverity}`);
                                                    setCopiedPartnerId(point.partner.id);
                                                    setTimeout(() => setCopiedPartnerId(null), 2000);
                                                  }}
                                                  className="p-1 bg-zinc-900 hover:bg-zinc-800 text-slate-400 hover:text-white border border-zinc-850 rounded transition cursor-pointer shrink-0"
                                                  title="Copy Partner Details"
                                                >
                                                  {copiedPartnerId === point.partner.id ? (
                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                  ) : (
                                                    <Copy className="w-3.5 h-3.5" />
                                                  )}
                                                </button>
                                              </div>

                                              {/* Stats Grid */}
                                              <div className="space-y-1.5">
                                                <div className="flex justify-between">
                                                  <span className="text-slate-400">Compliance Rate:</span>
                                                  <span className={`font-bold ${violationsCount > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                                                    {100 - freq}%
                                                  </span>
                                                </div>
                                                
                                                <div className="flex justify-between">
                                                  <span className="text-slate-400">Active Violations:</span>
                                                  <span className={`font-bold ${activeViolationsCount > 0 ? "text-red-400 font-extrabold" : "text-emerald-400"}`}>
                                                    {activeViolationsCount} active
                                                  </span>
                                                </div>

                                                <div className="flex justify-between">
                                                  <span className="text-slate-400">Historical Sweeps:</span>
                                                  <span className="text-slate-300 font-bold">
                                                    {historicalViolationsCount} of {point.totalScansWithPartner}
                                                  </span>
                                                </div>

                                                <div className="flex flex-col gap-1 border-t border-zinc-900/60 pt-1.5 mt-1.5">
                                                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Highest Severity Level</span>
                                                  <div className={`px-2 py-0.5 rounded font-extrabold text-center text-[9px] uppercase tracking-wide ${severityColorClass}`}>
                                                    {highestSeverity}
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Interactive Action Footer Button */}
                                              <div className="mt-2.5 pt-2 border-t border-zinc-900/60 flex gap-1">
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedPartnerPin(point);
                                                  }}
                                                  className="w-full py-1 bg-indigo-950/60 hover:bg-indigo-900/50 text-[8.5px] font-bold text-indigo-400 border border-indigo-900/40 hover:border-indigo-800/60 rounded transition cursor-pointer text-center flex items-center justify-center gap-1 shadow-[0_0_8px_rgba(99,102,241,0.05)]"
                                                  title="Open detailed compliance inspector panel for this reseller"
                                                >
                                                  <MapPin className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                                                  Inspect Reseller
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </AdvancedMarker>
                                    );
                                  } else {
                                    return (
                                      <AdvancedMarker
                                        key={cluster.id}
                                        position={{ lat: cluster.lat, lng: cluster.lng }}
                                        title={`Cluster: ${cluster.points.length} resellers`}
                                      >
                                        <ClusterMarker cluster={cluster} />
                                      </AdvancedMarker>
                                    );
                                  }
                                });
                              })()}

                              {/* Interactive Region Hotspots with Hover Tooltips */}
                              {(() => {
                                const regionsList = [
                                  { id: "us", name: "United States", lat: 39.8283, lng: -98.5795 },
                                  { id: "ca", name: "Canada", lat: 56.1304, lng: -106.3468 },
                                  { id: "eu", name: "Europe", lat: 50.1109, lng: 8.6821 },
                                  { id: "apac", name: "APAC", lat: 22.3193, lng: 114.1694 },
                                  { id: "latam", name: "LATAM", lat: -15.7832, lng: -55.4915 }
                                ];

                                return regionsList.map(reg => {
                                  const regionPartners = partners.filter(p => getRegionForPartnerName(p.name, p.domain) === reg.name);
                                  const totalPartnersCount = regionPartners.length;
                                  
                                  const regionViolations = activeViolationsList.filter(v => getRegionForPartnerName(v.partner, v.domain) === reg.name);
                                  const activeViolationsCount = regionViolations.length;

                                  const violatingPartnersCount = regionPartners.filter(p => 
                                    p.complianceStatus === "violating" || 
                                    regionViolations.some(v => v.partner === p.name || v.domain === p.domain)
                                  ).length;

                                  const violatingPartnersListInRegion = regionPartners.map(p => {
                                    const partnerViolations = regionViolations.filter(v => v.partner === p.name || v.domain === p.domain);
                                    return {
                                      partner: p,
                                      violationCount: partnerViolations.length,
                                      status: p.complianceStatus || 'compliant'
                                    };
                                  }).filter(item => item.violationCount > 0 || item.status === 'violating' || item.status === 'warning')
                                    .sort((a, b) => b.violationCount - a.violationCount);

                                  const aggregatedDeviation = regionViolations.reduce((sum, v) => {
                                    const diff = v.map - v.found;
                                    return sum + (diff > 0 ? diff : 0);
                                  }, 0);

                                  const isHighViolation = activeViolationsCount > 2;
                                  const isMediumViolation = activeViolationsCount > 0 && activeViolationsCount <= 2;
                                  const hasViolations = activeViolationsCount > 0;

                                  return (
                                    <AdvancedMarker
                                      key={`region-hotspot-${reg.id}`}
                                      position={{ lat: reg.lat, lng: reg.lng }}
                                      title={`Region Center: ${reg.name}`}
                                    >
                                      <div 
                                        className="relative flex items-center justify-center cursor-pointer group"
                                        onMouseEnter={() => setHoveredRegion(reg.id)}
                                        onMouseLeave={() => setHoveredRegion(null)}
                                        onClick={() => setSelectedGeoRegion(reg.id)}
                                      >
                                        {/* Large pulsing glowing ring overlays representing regional impact zones */}
                                        {hasViolations && (
                                          <span className={`absolute inline-flex h-14 w-14 rounded-full opacity-20 animate-ping duration-[3000ms] ${
                                            isHighViolation ? "bg-red-500" : "bg-amber-500"
                                          }`} />
                                        )}
                                        {hasViolations && (
                                          <span className={`absolute inline-flex h-10 w-10 rounded-full opacity-30 ${
                                            isHighViolation ? "bg-red-500/40 animate-pulse" : "bg-amber-500/40 animate-pulse"
                                          }`} />
                                        )}

                                        {/* Core interactive region radar icon button */}
                                        <div className={`relative flex items-center justify-center rounded-full border shadow-xl transition-all duration-300 group-hover:scale-110 ${
                                          isHighViolation 
                                            ? "w-8 h-8 bg-red-950/90 border-red-500 text-red-400" 
                                            : isMediumViolation 
                                              ? "w-7 h-7 bg-amber-950/90 border-amber-500 text-amber-400" 
                                              : "w-6 h-6 bg-emerald-950/90 border-emerald-500 text-emerald-400"
                                        }`}>
                                          <Globe className="w-3.5 h-3.5" />
                                          
                                          {/* Mini violation counts indicator count bubble */}
                                          {hasViolations && (
                                            <span className={`absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-extrabold font-mono text-white ${
                                              isHighViolation ? "bg-red-600 animate-bounce" : "bg-amber-600"
                                            }`}>
                                              {activeViolationsCount}
                                            </span>
                                          )}
                                        </div>

                                        {/* Absolute HTML interactive hover tooltip component */}
                                        <div className="absolute z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full mb-2.5 left-1/2 -translate-x-1/2">
                                          <div className="bg-zinc-950/95 border border-zinc-800 text-slate-100 p-2.5 rounded-lg shadow-xl w-56 text-[10px] font-mono leading-normal backdrop-blur-md">
                                            <div className="flex items-center justify-between border-b border-zinc-800 pb-1 mb-1.5">
                                              <span className="text-white font-extrabold text-[11px] flex items-center gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${hasViolations ? (isHighViolation ? "bg-red-500 animate-pulse" : "bg-amber-500") : "bg-emerald-500"}`} />
                                                {reg.name} Region
                                              </span>
                                              <span className={`px-1 py-0.2 rounded text-[8px] font-bold ${
                                                isHighViolation 
                                                  ? "bg-red-950 text-red-400 border border-red-900/40" 
                                                  : isMediumViolation 
                                                    ? "bg-amber-950 text-amber-400 border border-amber-900/40" 
                                                    : "bg-emerald-950 text-emerald-400 border border-emerald-900/40"
                                              }`}>
                                                {isHighViolation ? "HIGH RISK" : isMediumViolation ? "MODERATE" : "STABLE"}
                                              </span>
                                            </div>
                                            <div className="space-y-1">
                                              <div className="flex justify-between">
                                                <span className="text-slate-400">Total Partners:</span>
                                                <span className="text-white font-bold">{totalPartnersCount}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-slate-400">Violating Partners:</span>
                                                <span className="text-red-400 font-bold">{violatingPartnersCount}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-slate-400">Active Violations:</span>
                                                <span className={`${hasViolations ? "text-red-400 font-bold" : "text-emerald-400"}`}>{activeViolationsCount}</span>
                                              </div>
                                              <div className="flex justify-between pt-1 border-t border-zinc-900/80 mt-1">
                                                <span className="text-slate-400">Price Deviation:</span>
                                                <span className="text-indigo-400 font-extrabold">${aggregatedDeviation.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                              </div>

                                              {/* Specific Violations & Partner details list section */}
                                              {violatingPartnersListInRegion.length > 0 ? (
                                                <div className="mt-2 pt-2 border-t border-zinc-800/80">
                                                  <span className="text-slate-400 font-extrabold block mb-1.5 text-[8.5px] uppercase tracking-wider">Top Violating Partners:</span>
                                                  <div className="space-y-1 max-h-[100px] overflow-y-auto pr-1">
                                                    {violatingPartnersListInRegion.map((item, idx) => (
                                                      <div key={idx} className="flex justify-between items-center text-[8.5px]">
                                                        <span className="text-slate-200 truncate max-w-[125px]" title={`${item.partner.name} (${item.partner.domain})`}>
                                                          {item.partner.name}
                                                        </span>
                                                        <span className={`font-bold shrink-0 font-mono text-[8px] px-1 py-0.2 rounded ${
                                                          item.violationCount > 2 
                                                            ? 'text-red-400 bg-red-950/40' 
                                                            : item.violationCount > 0 
                                                              ? 'text-amber-400 bg-amber-950/40' 
                                                              : 'text-amber-500 bg-zinc-900/40'
                                                        }`}>
                                                          {item.violationCount} {item.violationCount === 1 ? 'alert' : 'alerts'}
                                                        </span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="mt-2 pt-2 border-t border-zinc-800/80 text-center">
                                                  <span className="text-emerald-400 font-bold text-[8.5px] block">✓ All partners compliant</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                      </div>
                                    </AdvancedMarker>
                                  );
                                });
                              })()}

                              {/* Active pin details info window */}
                              {selectedPartnerPin && (() => {
                                const partnerActiveViolations = activeViolationsList.filter(
                                  v => v.partner === selectedPartnerPin.partner.name || v.domain === selectedPartnerPin.partner.domain
                                );
                                return (
                                  <InfoWindow
                                    position={{ lat: selectedPartnerPin.lat, lng: selectedPartnerPin.lng }}
                                    onCloseClick={() => setSelectedPartnerPin(null)}
                                  >
                                    <div className="p-1 font-sans text-xs text-zinc-950 max-w-[200px]">
                                      <h4 className="font-extrabold text-zinc-900 border-b border-zinc-200 pb-0.5 mb-1 flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-indigo-600 shrink-0" />
                                        {selectedPartnerPin.partner.name}
                                      </h4>
                                      <div className="space-y-1 text-[10px] text-zinc-700">
                                        <p><strong className="text-zinc-950">Domain:</strong> {selectedPartnerPin.partner.domain}</p>
                                        <p><strong className="text-zinc-950">City/Reg:</strong> {selectedPartnerPin.city}</p>
                                        <p>
                                          <strong className="text-zinc-950">Status:</strong>{" "}
                                          <span className={`px-1 rounded text-[9px] font-bold ${
                                            selectedPartnerPin.partner.complianceStatus === "compliant"
                                              ? "bg-emerald-100 text-emerald-800"
                                              : selectedPartnerPin.partner.complianceStatus === "violating"
                                                ? "bg-rose-100 text-rose-800"
                                                : "bg-amber-100 text-amber-800"
                                          }`}>
                                            {selectedPartnerPin.partner.complianceStatus?.toUpperCase()}
                                          </span>
                                        </p>
                                        <p>
                                          <strong className="text-zinc-950">MAP Violations:</strong>{" "}
                                          <span className={selectedPartnerPin.violatingScansWithPartner > 0 ? "text-rose-600 font-bold" : "text-emerald-600 font-bold"}>
                                            {selectedPartnerPin.violatingScansWithPartner} of {selectedPartnerPin.totalScansWithPartner} sweeps
                                          </span>
                                        </p>
                                        <p>
                                          <strong className="text-zinc-955">Violation Freq:</strong>{" "}
                                          <span className="font-bold text-indigo-600">{selectedPartnerPin.frequencyRate}%</span>
                                        </p>

                                        {partnerActiveViolations.length > 0 && (
                                          <div className="mt-2 pt-1.5 border-t border-zinc-200">
                                            <strong className="text-zinc-900 text-[9px] block uppercase tracking-wider mb-1">Active MAP Violations:</strong>
                                            <div className="space-y-1 max-h-[100px] overflow-y-auto pr-0.5">
                                              {partnerActiveViolations.map((v, i) => {
                                                const diff = v.map - v.found;
                                                const pct = Math.round((diff / v.map) * 100);
                                                return (
                                                  <div key={i} className="bg-rose-50/50 p-1 rounded border border-rose-100 text-[8.5px]">
                                                    <div className="font-semibold text-zinc-900 truncate">{v.product}</div>
                                                    <div className="flex justify-between text-zinc-650 mt-0.5">
                                                      <span>Listed: <strong className="text-red-600">${v.found.toFixed(2)}</strong></span>
                                                      <span>MAP: ${v.map.toFixed(2)}</span>
                                                    </div>
                                                    <div className="text-red-700 font-bold mt-0.5 text-[8px] flex justify-between">
                                                      <span>Under MAP by:</span>
                                                      <span>-${pct}% (${diff.toFixed(2)})</span>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </InfoWindow>
                                );
                              })()}

                              {/* Historical High-Risk zones based on historical breach density */}
                              {showHistoricalOverlay && (() => {
                                const historicalHighRiskPoints = partnerHeatPoints.filter(point => {
                                  return (point.frequencyRate >= 30 && point.violatingScansWithPartner >= 1) || (point.violatingScansWithPartner >= 2);
                                });

                                const activeHighRiskPoints = historicalHighRiskPoints.filter(point => {
                                  if (mapRegionFilter !== "all") {
                                    const region = getRegionForPartnerName(point.partner.name, point.partner.domain);
                                    if (region !== mapRegionFilter) return false;
                                  }
                                  if (mapCategoryFilter !== "all") {
                                    const partnerProductIds = point.partner.associatedProducts || [];
                                    const hasProductInSelectedCategory = partnerProductIds.some((pId: string) => {
                                      const cat = getProductCategory(pId);
                                      return cat === mapCategoryFilter;
                                    });
                                    if (!hasProductInSelectedCategory) return false;
                                  }
                                  if (mapShowOnlyFlagged) {
                                    const hasActiveViolation = activeViolationsList.some(
                                      v => v.partner === point.partner.name || v.domain === point.partner.domain
                                    );
                                    if (!hasActiveViolation) return false;
                                  }
                                  if (mapPriceDeltaFilter !== "all") {
                                    const delta = getPointMaxPriceDelta(point);
                                    if (delta < mapPriceDeltaFilter) return false;
                                  }
                                  return true;
                                });

                                return activeHighRiskPoints.map((point, index) => {
                                  const partnerActiveViolations = activeViolationsList.filter(
                                    v => v.partner === point.partner.name || v.domain === point.partner.domain
                                  );
                                  const activeCount = partnerActiveViolations.length;
                                  let maxDeficitPct = 0;
                                  partnerActiveViolations.forEach(v => {
                                    const diff = v.map - v.found;
                                    const pct = Math.round((diff / v.map) * 100);
                                    if (pct > maxDeficitPct) maxDeficitPct = pct;
                                  });
                                  const intensityScore = Math.min(100, Math.max(15, Math.round(
                                    (point.frequencyRate * 0.45) + (activeCount * 15) + (point.violatingScansWithPartner * 6) + (maxDeficitPct * 0.5)
                                  )));

                                  return (
                                    <AdvancedMarker
                                      key={`historical-zone-${point.partner.id || index}`}
                                      position={{ lat: point.lat, lng: point.lng }}
                                      title={`Historical High-Risk Zone: ${point.partner.name}`}
                                      onClick={() => setSelectedPartnerPin(point)}
                                    >
                                      <div className="relative flex items-center justify-center cursor-pointer group/zone pointer-events-auto">
                                        {/* Large glowing aura in fuchsia to represent the historical density hotspot */}
                                        <div className="absolute w-20 h-20 bg-fuchsia-600/15 border border-dashed border-fuchsia-500/50 rounded-full animate-pulse flex items-center justify-center transition-transform group-hover/zone:scale-125">
                                          <div className="absolute w-12 h-12 bg-fuchsia-500/10 rounded-full border border-fuchsia-400/30 animate-ping opacity-75" />
                                        </div>
                                        
                                        {/* Small fuchsia radar dot in center */}
                                        <div className="w-2.5 h-2.5 bg-fuchsia-500 rounded-full shadow-[0_0_10px_#d946ef] border border-white/60 transition-transform group-hover/zone:scale-125" />

                                        {/* Custom floating interactive details tooltip */}
                                        <div className="absolute z-50 pointer-events-auto opacity-0 group-hover/zone:opacity-100 transition-opacity duration-200 bottom-full mb-3 left-1/2 -translate-x-1/2 before:absolute before:h-4 before:w-full before:top-full before:left-0">
                                          <div className="bg-zinc-950/95 border border-fuchsia-800/80 text-slate-100 p-2.5 rounded-lg shadow-[0_4px_25px_rgba(217,70,239,0.35)] w-56 text-[9.5px] font-mono leading-normal backdrop-blur-md">
                                            <div className="flex items-center justify-between border-b border-fuchsia-950 pb-1 mb-1.5">
                                              <div className="font-extrabold text-fuchsia-300 text-[10.5px] truncate flex items-center gap-1">
                                                <ShieldAlert className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                                                <span className="truncate" title={point.partner.name}>{point.partner.name}</span>
                                              </div>
                                              <span className="px-1.5 py-0.2 rounded text-[7.5px] font-bold bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800/60 shrink-0">
                                                HISTORIC
                                              </span>
                                            </div>

                                            {/* Violation Intensity Score Meter */}
                                            <div className="bg-fuchsia-950/40 border border-fuchsia-900/50 rounded p-1.5 mb-2">
                                              <div className="flex justify-between items-center text-[9px] mb-1">
                                                <span className="text-zinc-400 font-bold">Violation Intensity Score:</span>
                                                <span className="font-extrabold text-fuchsia-300 font-mono text-[10px]">{intensityScore} / 100</span>
                                              </div>
                                              <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-fuchsia-950">
                                                <div 
                                                  className="bg-gradient-to-r from-purple-500 to-fuchsia-400 h-full rounded-full transition-all duration-300"
                                                  style={{ width: `${intensityScore}%` }}
                                                />
                                              </div>
                                            </div>

                                            <div className="space-y-1 text-[8.5px]">
                                              <div className="flex justify-between">
                                                <span className="text-slate-400">Reseller Domain:</span>
                                                <span className="font-semibold text-slate-300 truncate max-w-[110px]">{point.partner.domain}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-slate-400">Breach Frequency:</span>
                                                <span className="font-bold text-fuchsia-400">{point.frequencyRate}% rate</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-slate-400">Historical Infractions:</span>
                                                <span className="font-bold text-slate-200">{point.violatingScansWithPartner} of {point.totalScansWithPartner} sweeps</span>
                                              </div>
                                              {activeCount > 0 && (
                                                <div className="flex justify-between text-rose-400 font-bold pt-0.5 border-t border-zinc-900">
                                                  <span>Active Breaches:</span>
                                                  <span>{activeCount} active</span>
                                                </div>
                                              )}
                                            </div>

                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedPartnerPin(point);
                                              }}
                                              className="mt-2 w-full py-1 bg-fuchsia-950/70 hover:bg-fuchsia-900/80 text-[8.5px] font-bold text-fuchsia-200 border border-fuchsia-800/60 rounded transition cursor-pointer text-center flex items-center justify-center gap-1 shadow-sm"
                                            >
                                              <MapPin className="w-2.5 h-2.5 text-fuchsia-300 shrink-0" />
                                              Inspect Reseller
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </AdvancedMarker>
                                  );
                                });
                              })()}

                              {/* Geographical Violation Density Heatmap Overlay */}
                              {showViolationHeatmap && (() => {
                                return partnerHeatPoints
                                  .filter(point => point.violatingScansWithPartner > 0)
                                  .filter(point => {
                                    // 1. Severity filter
                                    const sev = getSeverityOfPoint(point);
                                    if (!mapSeverityFilters[sev as keyof typeof mapSeverityFilters]) return false;

                                    // 2. Partner region filter
                                    if (mapRegionFilter !== "all") {
                                      const region = getRegionForPartnerName(point.partner.name, point.partner.domain);
                                      if (region !== mapRegionFilter) return false;
                                    }

                                    // 3. Product category filter
                                    if (mapCategoryFilter !== "all") {
                                      const partnerProductIds = point.partner.associatedProducts || [];
                                      const hasProduct = partnerProductIds.some((pId: string) => getProductCategory(pId) === mapCategoryFilter);
                                      if (!hasProduct) return false;
                                    }

                                    // 4. Currently flagged for MAP violations filter
                                    if (mapShowOnlyFlagged) {
                                      const hasActiveViolation = activeViolationsList.some(
                                        v => v.partner === point.partner.name || v.domain === point.partner.domain
                                      );
                                      if (!hasActiveViolation) return false;
                                    }

                                    // 5. Price delta threshold filter
                                    if (mapPriceDeltaFilter !== "all") {
                                      const delta = getPointMaxPriceDelta(point);
                                      if (delta < mapPriceDeltaFilter) return false;
                                    }

                                    return true;
                                  })
                                  .map((point, idx) => {
                                    const sev = getSeverityOfPoint(point);
                                    let rawIntensity = 40;
                                    if (heatmapIntensityMetric === "frequency") {
                                      rawIntensity = 40 + (point.frequencyRate / 100) * 80;
                                    } else if (heatmapIntensityMetric === "activeViolations") {
                                      const activeCount = activeViolationsList.filter(
                                        v => v.partner === point.partner.name || v.domain === point.partner.domain
                                      ).length;
                                      rawIntensity = 40 + activeCount * 35;
                                    } else {
                                      rawIntensity = 40 + point.violatingScansWithPartner * 25;
                                    }
                                    const intensity = rawIntensity * heatmapRadiusScale;
                                    
                                    let colorGlow = "";
                                    let severityLabel = "Low Risk";
                                    let severityBadgeClass = "bg-orange-950/80 text-orange-400 border-orange-800/60";
                                    let meterGradient = "from-amber-500 to-orange-500";

                                    if (sev === "high") {
                                      colorGlow = "radial-gradient(circle, rgba(239, 68, 68, 0.75) 0%, rgba(239, 68, 68, 0.35) 45%, rgba(239, 68, 68, 0) 72%)";
                                      severityLabel = "Critical Breach";
                                      severityBadgeClass = "bg-red-950/90 text-red-400 border-red-800/80 animate-pulse";
                                      meterGradient = "from-amber-500 via-rose-500 to-red-500";
                                    } else if (sev === "medium") {
                                      colorGlow = "radial-gradient(circle, rgba(245, 158, 11, 0.75) 0%, rgba(245, 158, 11, 0.35) 45%, rgba(245, 158, 11, 0) 72%)";
                                      severityLabel = "Moderate Breach";
                                      severityBadgeClass = "bg-amber-950/90 text-amber-400 border-amber-800/80";
                                      meterGradient = "from-yellow-500 to-amber-500";
                                    } else {
                                      colorGlow = "radial-gradient(circle, rgba(249, 115, 22, 0.65) 0%, rgba(249, 115, 22, 0.25) 45%, rgba(249, 115, 22, 0) 72%)";
                                      severityLabel = "Low Deficit";
                                      severityBadgeClass = "bg-orange-950/90 text-orange-300 border-orange-800/60";
                                      meterGradient = "from-emerald-500 to-amber-500";
                                    }

                                    // Calculate individual partner active violations & max discount deficit
                                    const partnerActiveViolations = activeViolationsList.filter(
                                      v => v.partner === point.partner.name || v.domain === point.partner.domain
                                    );
                                    const activeCount = partnerActiveViolations.length;
                                    let maxDeficitPct = 0;
                                    let maxPriceGap = 0;
                                    partnerActiveViolations.forEach(v => {
                                      const diff = v.map - v.found;
                                      if (diff > 0 && diff > maxPriceGap) maxPriceGap = diff;
                                      const pct = Math.round((diff / v.map) * 100);
                                      if (pct > maxDeficitPct) maxDeficitPct = pct;
                                    });

                                    // Calculated normalized Violation Intensity Score (0 - 100)
                                    const violationIntensityScore = Math.min(100, Math.max(10, Math.round(
                                      (sev === "high" ? 45 : sev === "medium" ? 25 : 10) +
                                      (activeCount * 12) +
                                      (maxDeficitPct * 0.8) +
                                      (point.frequencyRate * 0.3) +
                                      (point.violatingScansWithPartner * 4)
                                    )));

                                    return (
                                      <AdvancedMarker
                                        key={`gmaps-heat-overlay-${point.partner.id || idx}`}
                                        position={{ lat: point.lat, lng: point.lng }}
                                        title={`${point.partner.name} - Violation Intensity Score: ${violationIntensityScore}/100`}
                                        onClick={() => setSelectedPartnerPin(point)}
                                      >
                                        <div className="relative flex items-center justify-center cursor-pointer group/heat-region pointer-events-auto">
                                          {/* Colored Heatmap Density Glow Area */}
                                          <div 
                                            className="rounded-full filter blur-[3px] mix-blend-screen transition-all duration-300 group-hover/heat-region:scale-125 group-hover/heat-region:opacity-100 opacity-85"
                                            style={{
                                              width: `${intensity}px`,
                                              height: `${intensity}px`,
                                              background: colorGlow,
                                            }}
                                          />

                                          {/* Central Pinpoint Marker for precise target hovering & visual clarity */}
                                          <div className={`absolute w-3 h-3 rounded-full border shadow-md flex items-center justify-center transition-transform group-hover/heat-region:scale-150 ${
                                            sev === "high"
                                              ? "bg-red-500 border-white/80 shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-pulse"
                                              : sev === "medium"
                                                ? "bg-amber-500 border-white/80 shadow-[0_0_10px_rgba(245,158,11,0.9)]"
                                                : "bg-orange-500 border-white/80 shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                                          }`}>
                                            <span className="w-1 h-1 bg-white rounded-full" />
                                          </div>

                                          {/* Hover Tooltip displaying Reseller Name, Violation Intensity Score, and breach breakdown */}
                                          <div className="absolute z-50 pointer-events-auto opacity-0 group-hover/heat-region:opacity-100 transition-all duration-200 bottom-full mb-3 px-1 left-1/2 -translate-x-1/2 before:absolute before:h-4 before:w-full before:top-full before:left-0 select-none">
                                            <div className="bg-zinc-950/95 border border-zinc-700/90 text-slate-100 p-3 rounded-xl shadow-[0_6px_30px_rgba(0,0,0,0.8)] w-60 text-[9.5px] font-mono leading-normal backdrop-blur-md relative border-indigo-500/40">
                                              
                                              {/* Tooltip Header with Reseller Name */}
                                              <div className="flex items-start justify-between border-b border-zinc-800 pb-2 mb-2">
                                                <div className="max-w-[160px]">
                                                  <div className="font-extrabold text-white text-[11.5px] truncate flex items-center gap-1.5" title={point.partner.name}>
                                                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                                                      sev === "high" ? "bg-red-500 animate-pulse" : sev === "medium" ? "bg-amber-500" : "bg-orange-400"
                                                    }`} />
                                                    <span className="truncate">{point.partner.name}</span>
                                                  </div>
                                                  <div className="text-[8.5px] text-zinc-400 truncate mt-0.5">
                                                    {point.partner.domain} &bull; {point.city}
                                                  </div>
                                                </div>
                                                
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide border shrink-0 ${severityBadgeClass}`}>
                                                  {severityLabel}
                                                </span>
                                              </div>

                                              {/* Prominent Violation Intensity Score Widget */}
                                              <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-2 mb-2 shadow-inner">
                                                <div className="flex justify-between items-center text-[9px] mb-1">
                                                  <span className="text-zinc-300 font-bold flex items-center gap-1">
                                                    <Zap className="w-3 h-3 text-amber-400" />
                                                    Violation Intensity Score:
                                                  </span>
                                                  <span className={`font-mono font-extrabold text-[11px] ${
                                                    violationIntensityScore >= 70 
                                                      ? "text-red-400" 
                                                      : violationIntensityScore >= 40 
                                                        ? "text-amber-400" 
                                                        : "text-orange-400"
                                                  }`}>
                                                    {violationIntensityScore} / 100
                                                  </span>
                                                </div>
                                                
                                                {/* Animated Score Gradient Progress Bar */}
                                                <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800/80 p-0.5">
                                                  <div 
                                                    className={`h-full rounded-full bg-gradient-to-r ${meterGradient} transition-all duration-300`}
                                                    style={{ width: `${violationIntensityScore}%` }}
                                                  />
                                                </div>

                                                <div className="flex justify-between text-[7.5px] text-zinc-400 mt-1 font-sans">
                                                  <span>Low (0-39)</span>
                                                  <span>Moderate (40-69)</span>
                                                  <span>Critical (70-100)</span>
                                                </div>
                                              </div>

                                              {/* Key Violation Metrics Grid */}
                                              <div className="space-y-1 text-[8.5px]">
                                                <div className="flex justify-between items-center py-0.5 border-b border-zinc-900">
                                                  <span className="text-zinc-400">Active MAP Breaches:</span>
                                                  <span className={`font-bold ${activeCount > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                                                    {activeCount} {activeCount === 1 ? "infraction" : "infractions"}
                                                  </span>
                                                </div>

                                                {maxDeficitPct > 0 && (
                                                  <div className="flex justify-between items-center py-0.5 border-b border-zinc-900">
                                                    <span className="text-zinc-400">Max Under-MAP Deficit:</span>
                                                    <span className="font-extrabold text-red-400">
                                                      -{maxDeficitPct}% (${maxPriceGap.toFixed(2)})
                                                    </span>
                                                  </div>
                                                )}

                                                <div className="flex justify-between items-center py-0.5 border-b border-zinc-900">
                                                  <span className="text-zinc-400">Breach Frequency Rate:</span>
                                                  <span className="font-bold text-amber-300 font-mono">
                                                    {point.frequencyRate}%
                                                  </span>
                                                </div>

                                                <div className="flex justify-between items-center py-0.5">
                                                  <span className="text-zinc-400">Violating Sweeps:</span>
                                                  <span className="text-zinc-200 font-medium">
                                                    {point.violatingScansWithPartner} of {point.totalScansWithPartner} sweeps
                                                  </span>
                                                </div>
                                              </div>

                                              {/* Interactive Action Button */}
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setSelectedPartnerPin(point);
                                                }}
                                                className="mt-2.5 w-full py-1.5 bg-indigo-950/80 hover:bg-indigo-900 text-[9px] font-bold text-indigo-200 hover:text-white border border-indigo-800/70 hover:border-indigo-500 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                                              >
                                                <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                                                <span>Inspect Reseller Details</span>
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </AdvancedMarker>
                                    );
                                  });
                              })()}

                              {/* Search Location Animated Pulse Ring Highlight Marker */}
                              {mapSearchHighlight && (
                                <AdvancedMarker
                                  key={`search-pulse-${mapSearchHighlight.timestamp}`}
                                  position={{ lat: mapSearchHighlight.lat, lng: mapSearchHighlight.lng }}
                                  title={`Search Target: ${mapSearchHighlight.label}`}
                                  zIndex={999}
                                >
                                  <div className="relative flex items-center justify-center pointer-events-auto cursor-pointer group/search-pulse select-none">
                                    {/* Primary subtle outer expanding pulse ring */}
                                    <div className="absolute w-28 h-28 rounded-full border border-indigo-400/60 bg-indigo-500/10 animate-pulse-ring pointer-events-none" />
                                    
                                    {/* Secondary delayed expanding pulse ring */}
                                    <div className="absolute w-40 h-40 rounded-full border border-cyan-400/40 bg-cyan-500/5 animate-pulse-ring-slow pointer-events-none" />
                                    
                                    {/* Rotating radar aura ring */}
                                    <div className="absolute w-20 h-20 rounded-full border border-dashed border-indigo-400/60 bg-gradient-to-r from-indigo-500/15 via-transparent to-cyan-500/15 animate-radar-sweep pointer-events-none" />
                                    
                                    {/* Concentric subtle glowing core circle */}
                                    <div className="absolute w-12 h-12 rounded-full border-2 border-indigo-400/80 bg-indigo-950/70 shadow-[0_0_22px_rgba(99,102,241,0.6)] flex items-center justify-center animate-pulse">
                                      <div className="w-5 h-5 rounded-full bg-cyan-400/30 animate-ping" />
                                    </div>

                                    {/* Center pinpoint coordinate crosshair dot */}
                                    <div className="relative flex items-center justify-center">
                                      <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 border-2 border-white shadow-[0_0_14px_rgba(255,255,255,0.95)] flex items-center justify-center">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                      </span>
                                    </div>

                                    {/* Search Location Interactive Badge Banner */}
                                    <div className="absolute -bottom-8 px-2.5 py-1 rounded-lg bg-zinc-950/95 border border-indigo-500/80 text-white text-[9.5px] font-mono font-extrabold shadow-2xl backdrop-blur-md whitespace-nowrap flex items-center gap-1.5 transition-all group-hover/search-pulse:scale-105">
                                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
                                      <span className="text-indigo-300">Search Target:</span>
                                      <span className="font-bold text-white max-w-[140px] truncate">{mapSearchHighlight.label}</span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setMapSearchHighlight(null);
                                        }}
                                        className="ml-1 p-0.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                                        title="Dismiss Search Highlight"
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                </AdvancedMarker>
                              )}
                            </GoogleMap>

                            {/* Floating Map Layers & Style Controls Top Header Bar */}
                            <div className="absolute top-2.5 left-56 z-30 hidden sm:flex items-center gap-2">
                              {/* Floating Heatmap Layer Visibility Manager Control Panel */}
                              <div 
                                id="google-map-layer-visibility-control"
                                className="bg-zinc-950/95 border border-zinc-800/90 rounded-xl p-1.5 text-[9px] font-mono shadow-2xl backdrop-blur-md flex items-center gap-1.5 select-none border-indigo-900/40"
                              >
                                <div className="flex items-center gap-1 px-1 text-zinc-400 font-extrabold text-[8px] uppercase tracking-wider hidden lg:flex">
                                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                                  <span>Layers:</span>
                                </div>

                                {/* Current Violations Heatmap Layer Toggle */}
                                <button
                                  type="button"
                                  id="toggle-current-violations-layer-btn"
                                  onClick={() => setShowViolationHeatmap(prev => !prev)}
                                  className={`px-2 py-0.5 rounded-lg text-[8.5px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border ${
                                    showViolationHeatmap
                                      ? "bg-rose-950/90 text-rose-200 border-rose-600/80 shadow-md shadow-rose-950/80"
                                      : "bg-zinc-900/80 text-zinc-500 hover:text-zinc-300 border-zinc-800 hover:border-zinc-700 opacity-60"
                                  }`}
                                  title="Toggle Current Real-Time MAP Violations Heatmap Layer"
                                >
                                  <Flame className={`w-3 h-3 ${showViolationHeatmap ? "text-rose-400 animate-pulse" : "text-zinc-500"}`} />
                                  <span className="whitespace-nowrap">Current Violations</span>
                                  <span className={`text-[7.5px] px-1 py-0.2 rounded font-mono font-black ${
                                    showViolationHeatmap ? "bg-rose-900/60 text-rose-200 border border-rose-700/50" : "bg-zinc-800 text-zinc-500"
                                  }`}>
                                    {activeViolationsList.length}
                                  </span>
                                </button>

                                {/* Historical Breach Density Layer Toggle */}
                                <button
                                  type="button"
                                  id="toggle-historical-density-layer-btn"
                                  onClick={() => setShowHistoricalOverlay(prev => !prev)}
                                  className={`px-2 py-0.5 rounded-lg text-[8.5px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border ${
                                    showHistoricalOverlay
                                      ? "bg-fuchsia-950/90 text-fuchsia-200 border-fuchsia-600/80 shadow-md shadow-fuchsia-950/80"
                                      : "bg-zinc-900/80 text-zinc-500 hover:text-zinc-300 border-zinc-800 hover:border-zinc-700 opacity-60"
                                  }`}
                                  title="Toggle Historical Breach Density & Repeat Risk Zones Radar Overlay"
                                >
                                  <ShieldAlert className={`w-3 h-3 ${showHistoricalOverlay ? "text-fuchsia-400" : "text-zinc-500"}`} />
                                  <span className="whitespace-nowrap">Historical Density</span>
                                  <span className={`text-[7.5px] px-1 py-0.2 rounded font-mono font-black ${
                                    showHistoricalOverlay ? "bg-fuchsia-900/60 text-fuchsia-200 border border-fuchsia-700/50" : "bg-zinc-800 text-zinc-500"
                                  }`}>
                                    {partnerHeatPoints.filter(p => (p.frequencyRate >= 30 && p.violatingScansWithPartner >= 1) || p.violatingScansWithPartner >= 2).length}
                                  </span>
                                </button>

                                {/* Reseller Partner Pins Layer Toggle */}
                                <button
                                  type="button"
                                  id="toggle-reseller-markers-layer-btn"
                                  onClick={() => setShowPartnerMarkers(prev => !prev)}
                                  className={`px-2 py-0.5 rounded-lg text-[8.5px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border ${
                                    showPartnerMarkers
                                      ? "bg-indigo-950/90 text-indigo-200 border-indigo-600/80 shadow-md shadow-indigo-950/80"
                                      : "bg-zinc-900/80 text-zinc-500 hover:text-zinc-300 border-zinc-800 hover:border-zinc-700 opacity-60"
                                  }`}
                                  title="Toggle Retailer Coordinate Pinpoint Markers"
                                >
                                  <MapPin className={`w-3 h-3 ${showPartnerMarkers ? "text-indigo-400" : "text-zinc-500"}`} />
                                  <span className="whitespace-nowrap hidden md:inline">Pins</span>
                                  <span className={`text-[7.5px] px-1 py-0.2 rounded font-mono font-black ${
                                    showPartnerMarkers ? "bg-indigo-900/60 text-indigo-200 border border-indigo-700/50" : "bg-zinc-800 text-zinc-500"
                                  }`}>
                                    {partnerHeatPoints.length}
                                  </span>
                                </button>
                              </div>

                              {/* Floating Satellite / Terrain / Standard Map Style Toggle Control Bar */}
                              <div 
                                id="google-map-style-toggle-group"
                                className="bg-zinc-950/95 border border-zinc-800/90 rounded-xl p-1.5 text-[9px] font-mono shadow-2xl backdrop-blur-md flex items-center gap-1 select-none border-indigo-900/40"
                              >
                                <span className="text-[8px] font-extrabold text-zinc-400 uppercase px-1.5 tracking-wider hidden md:inline-block">Style:</span>
                                
                                <button
                                  type="button"
                                  id="map-style-standard-btn"
                                  onClick={() => setMapTypeId("roadmap")}
                                  className={`px-2 py-0.5 rounded-lg text-[8.5px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer border ${
                                    mapTypeId === "roadmap"
                                      ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-950/80"
                                      : "bg-zinc-900/80 text-slate-400 hover:text-white border-zinc-800 hover:border-zinc-700"
                                  }`}
                                  title="Switch to Standard Vector Roadmap View"
                                >
                                  <Map className="w-3 h-3 text-indigo-300 shrink-0" />
                                  <span>Standard</span>
                                </button>

                                <button
                                  type="button"
                                  id="map-style-satellite-btn"
                                  onClick={() => setMapTypeId("hybrid")}
                                  className={`px-2 py-0.5 rounded-lg text-[8.5px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer border ${
                                    mapTypeId === "hybrid" || mapTypeId === "satellite"
                                      ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-950/80"
                                      : "bg-zinc-900/80 text-slate-400 hover:text-white border-zinc-800 hover:border-zinc-700"
                                  }`}
                                  title="Switch to High-Resolution Satellite & Aerial Imagery View"
                                >
                                  <Globe className="w-3 h-3 text-cyan-300 shrink-0" />
                                  <span>Satellite</span>
                                </button>

                                <button
                                  type="button"
                                  id="map-style-terrain-btn"
                                  onClick={() => setMapTypeId("terrain")}
                                  className={`px-2 py-0.5 rounded-lg text-[8.5px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer border ${
                                    mapTypeId === "terrain"
                                      ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-950/80"
                                      : "bg-zinc-900/80 text-slate-400 hover:text-white border-zinc-800 hover:border-zinc-700"
                                  }`}
                                  title="Switch to Topographic Terrain View with Elevation Features"
                                >
                                  <Layers className="w-3 h-3 text-emerald-300 shrink-0" />
                                  <span>Terrain</span>
                                </button>
                              </div>
                            </div>

                            {/* Floating Overlay Toggle Control for Heatmap Layers vs Standard Markers */}
                            <div 
                              id="map-view-mode-toggle"
                              className="absolute bottom-3 right-48 bg-zinc-950/95 border border-zinc-800/90 rounded-xl p-1 text-[9px] font-mono shadow-2xl backdrop-blur-md z-20 hidden md:flex items-center gap-1 select-none border-indigo-900/50"
                            >
                              <span className="text-[7.5px] font-extrabold text-zinc-400 uppercase px-1 hidden xl:inline">Layer:</span>
                              
                              <button
                                type="button"
                                id="layer-mode-current-violations-btn"
                                onClick={() => {
                                  setShowViolationHeatmap(true);
                                  setShowHistoricalOverlay(false);
                                }}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8.5px] font-bold transition cursor-pointer ${
                                  showViolationHeatmap && !showHistoricalOverlay
                                    ? "bg-rose-950/90 text-rose-200 border border-rose-700/80 shadow-md shadow-rose-950/80"
                                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                                }`}
                                title="Show Current Active Violations Heatmap only"
                              >
                                <Flame className={`w-3.5 h-3.5 ${showViolationHeatmap && !showHistoricalOverlay ? "text-rose-400 animate-pulse" : "text-zinc-400"}`} />
                                <span>Current Violations</span>
                              </button>

                              <button
                                type="button"
                                id="layer-mode-historical-density-btn"
                                onClick={() => {
                                  setShowViolationHeatmap(false);
                                  setShowHistoricalOverlay(true);
                                }}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8.5px] font-bold transition cursor-pointer ${
                                  !showViolationHeatmap && showHistoricalOverlay
                                    ? "bg-fuchsia-950/90 text-fuchsia-200 border border-fuchsia-700/80 shadow-md shadow-fuchsia-950/80"
                                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                                }`}
                                title="Show Historical Breach Density Radar Zones only"
                              >
                                <ShieldAlert className={`w-3.5 h-3.5 ${!showViolationHeatmap && showHistoricalOverlay ? "text-fuchsia-400" : "text-zinc-400"}`} />
                                <span>Historical Density</span>
                              </button>

                              <button
                                type="button"
                                id="layer-mode-comparative-both-btn"
                                onClick={() => {
                                  setShowViolationHeatmap(true);
                                  setShowHistoricalOverlay(true);
                                }}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8.5px] font-bold transition cursor-pointer ${
                                  showViolationHeatmap && showHistoricalOverlay
                                    ? "bg-indigo-950/90 text-indigo-200 border border-indigo-700/80 shadow-md shadow-indigo-950/80"
                                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                                }`}
                                title="Show Comparative Overlay (Both Current Violations and Historical Density)"
                              >
                                <Layers className={`w-3.5 h-3.5 ${showViolationHeatmap && showHistoricalOverlay ? "text-indigo-400" : "text-zinc-400"}`} />
                                <span>Both Layers</span>
                              </button>

                              <button
                                type="button"
                                id="layer-mode-pins-toggle-btn"
                                onClick={() => setShowPartnerMarkers(prev => !prev)}
                                className={`flex items-center gap-1 px-1.5 py-1 rounded-lg text-[8px] font-bold transition cursor-pointer border ${
                                  showPartnerMarkers
                                    ? "bg-zinc-900 text-indigo-300 border-indigo-800/60"
                                    : "bg-zinc-950 text-zinc-500 border-zinc-800"
                                }`}
                                title="Toggle Store Pinpoint Markers"
                              >
                                <MapPin className={`w-3 h-3 ${showPartnerMarkers ? "text-indigo-400" : "text-zinc-600"}`} />
                                <span>Pins</span>
                              </button>
                            </div>

                            {/* Visual Zoom & Partner Inspection Controls Overlay with Vertical Range Slider */}
                            <div className="absolute bottom-3 right-3 bg-zinc-950/95 border border-zinc-800/90 rounded-xl p-2.5 text-[9px] font-mono text-slate-300 w-40 shadow-2xl backdrop-blur-md flex flex-col gap-2 z-20 select-none border-indigo-900/30">
                              <div className="flex items-center justify-between border-b border-zinc-850 pb-1.5">
                                <span className="text-[8px] text-zinc-400 font-extrabold uppercase tracking-wider">
                                  Zoom Controls
                                </span>
                                <div className="text-[9px] text-indigo-400 font-bold bg-zinc-900/80 px-1.5 py-0.5 rounded border border-zinc-800 font-mono">
                                  {(mapZoomState || mapZoom || REGION_MAP_PRESETS[selectedGeoRegion || "us"].zoom).toFixed(1)}x
                                </div>
                              </div>

                              {/* Granular Vertical Zoom Slider & Action Column */}
                              <div className="flex gap-2.5 items-center my-0.5">
                                {/* Vertical Range Slider Container */}
                                <div className="flex flex-col items-center justify-between h-28 bg-zinc-900/80 p-1.5 rounded-lg border border-zinc-800/80 shrink-0">
                                  <button
                                    type="button"
                                    onClick={handleZoomIn}
                                    className="p-1 text-slate-300 hover:text-indigo-400 hover:bg-zinc-800 rounded transition cursor-pointer"
                                    title="Zoom In (+)"
                                  >
                                    <ZoomIn className="w-3 h-3 text-indigo-400" />
                                  </button>

                                  <div className="relative flex items-center justify-center my-1 h-16">
                                    <input
                                      type="range"
                                      min={2}
                                      max={18}
                                      step={0.5}
                                      value={mapZoomState || mapZoom || REGION_MAP_PRESETS[selectedGeoRegion || "us"].zoom}
                                      onChange={(e) => {
                                        const z = parseFloat(e.target.value);
                                        setMapZoomState(z);
                                        setMapZoom(z);
                                      }}
                                      className="h-16 w-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 [writing-mode:vertical-lr] [direction:rtl]"
                                      title="Slide vertically for granular map zoom level"
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={handleZoomOut}
                                    className="p-1 text-slate-300 hover:text-indigo-400 hover:bg-zinc-800 rounded transition cursor-pointer"
                                    title="Zoom Out (-)"
                                  >
                                    <ZoomOut className="w-3 h-3 text-indigo-400" />
                                  </button>
                                </div>

                                {/* Right Side: Quick Presets & Flagged Inspector */}
                                <div className="flex-1 flex flex-col gap-1.5">
                                  <span className="text-[7.5px] text-zinc-500 font-bold uppercase tracking-wide">
                                    Presets
                                  </span>
                                  <div className="flex flex-col gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMapZoomState(4);
                                        setMapZoom(4);
                                      }}
                                      className="py-1 px-1.5 text-[7.5px] font-bold text-slate-400 hover:text-indigo-300 bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-800 rounded transition text-left flex items-center justify-between"
                                      title="Macro Regional View (4x)"
                                    >
                                      <span>Macro</span>
                                      <span className="text-[7px] text-zinc-500">4.0x</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMapZoomState(8);
                                        setMapZoom(8);
                                      }}
                                      className="py-1 px-1.5 text-[7.5px] font-bold text-slate-400 hover:text-indigo-300 bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-800 rounded transition text-left flex items-center justify-between"
                                      title="Metro Region View (8x)"
                                    >
                                      <span>Metro</span>
                                      <span className="text-[7px] text-zinc-500">8.0x</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMapZoomState(14);
                                        setMapZoom(14);
                                      }}
                                      className="py-1 px-1.5 text-[7.5px] font-bold text-slate-400 hover:text-indigo-300 bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-800 rounded transition text-left flex items-center justify-between"
                                      title="Inspect Site Level (14x)"
                                    >
                                      <span>Site</span>
                                      <span className="text-[7px] text-zinc-500">14.0x</span>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Inspect Flagged Partner Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  // Locate flagged partners with violations
                                  const flagged = partnerHeatPoints.filter(pt => {
                                    const sev = getSeverityOfPoint(pt);
                                    return sev === "high" || sev === "medium" || pt.violatingScansWithPartner > 0;
                                  });
                                  const targets = flagged.length > 0 ? flagged : partnerHeatPoints;
                                  if (targets.length === 0) return;
                                  
                                  const targetPt = targets[Math.floor(Math.random() * targets.length)];
                                  setMapCenterState({ lat: targetPt.lat, lng: targetPt.lng });
                                  setMapZoomState(14);
                                  setMapZoom(14);

                                  setSelectedPartnerPin(targetPt);
                                  setFocusedPartnerId(targetPt.partner.id);
                                }}
                                className="w-full py-1 text-[8px] font-extrabold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-200 border border-rose-900/50 hover:border-rose-700/60 rounded-lg cursor-pointer transition flex items-center justify-center gap-1 shadow-sm active:scale-98"
                                title="Zoom directly to a flagged partner website location to inspect MAP violations"
                              >
                                <ShieldAlert className="w-3 h-3 text-rose-400 animate-pulse shrink-0" />
                                <span>Inspect Flagged Site</span>
                              </button>

                              <button
                                type="button"
                                id="reset-map-view-bottom-btn"
                                onClick={() => {
                                  const defaultPreset = REGION_MAP_PRESETS[selectedGeoRegion || "us"] || REGION_MAP_PRESETS["us"];
                                  setMapZoomState(defaultPreset.zoom);
                                  setMapZoom(defaultPreset.zoom);
                                  setMapCenterState(defaultPreset);
                                  setMapActiveJumpToast(null);
                                }}
                                className="w-full text-center text-[8px] font-bold bg-indigo-950/60 hover:bg-indigo-900/90 text-indigo-300 hover:text-white border border-indigo-800/60 hover:border-indigo-500 rounded py-1 cursor-pointer transition flex items-center justify-center gap-1 shadow-sm active:scale-95"
                                title="Return map zoom level and center position to default startup state"
                              >
                                <RotateCcw className="w-3 h-3 text-indigo-400 shrink-0" />
                                <span>Reset View</span>
                              </button>
                            </div>
                            
                            {/* Dynamic Filter UI Overlaid on Map */}
                            <div className="absolute top-2 right-2 bg-zinc-950/95 border border-zinc-800 rounded-lg p-2 text-[9px] font-mono text-slate-300 w-48 shadow-2xl backdrop-blur-md space-y-1.5 z-20">
                              <div className="flex items-center gap-1 border-b border-zinc-850 pb-1 mb-1 justify-between">
                                <span className="text-zinc-200 font-extrabold flex items-center gap-1">
                                  <Filter className="w-3 h-3 text-indigo-400" />
                                  Map Filters
                                </span>
                                {(mapRegionFilter !== "all" || mapCategoryFilter !== "all" || !mapSeverityFilters.high || !mapSeverityFilters.medium || !mapSeverityFilters.low || !mapSeverityFilters.compliant) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMapRegionFilter("all");
                                      setMapCategoryFilter("all");
                                      setMapSeverityFilters({
                                        high: true,
                                        medium: true,
                                        low: true,
                                        compliant: true
                                      });
                                    }}
                                    className="text-[8px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer font-bold"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                              <div className="space-y-1.5">
                                <div className="space-y-0.5">
                                  <label className="text-[7.5px] text-slate-400 font-bold block uppercase tracking-wider">Region</label>
                                  <select
                                    value={mapRegionFilter}
                                    onChange={(e) => setMapRegionFilter(e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800 text-slate-200 text-[9px] rounded px-1 py-0.5 outline-none focus:border-indigo-500 cursor-pointer"
                                  >
                                    <option value="all">All Regions</option>
                                    <option value="United States">United States</option>
                                    <option value="Canada">Canada</option>
                                    <option value="Europe">Europe</option>
                                    <option value="APAC">APAC</option>
                                    <option value="LATAM">LATAM</option>
                                  </select>
                                </div>
                                <div className="space-y-0.5">
                                  <label className="text-[7.5px] text-slate-400 font-bold block uppercase tracking-wider">Product Category</label>
                                  <select
                                    value={mapCategoryFilter}
                                    onChange={(e) => setMapCategoryFilter(e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800 text-slate-200 text-[9px] rounded px-1 py-0.5 outline-none focus:border-indigo-500 cursor-pointer"
                                  >
                                    <option value="all">All Categories</option>
                                    <option value="Computer Accessories">Computer Accessories</option>
                                    <option value="Audio & Sound">Audio & Sound</option>
                                    <option value="Gaming Gear">Gaming Gear</option>
                                    <option value="Office Ergonomics">Office Ergonomics</option>
                                  </select>
                                </div>
                                <div className="space-y-0.5">
                                  <label className="text-[7.5px] text-slate-400 font-bold block uppercase tracking-wider">Price Delta Range</label>
                                  <select
                                    value={mapPriceDeltaFilter}
                                    onChange={(e) => setMapPriceDeltaFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                                    className="w-full bg-zinc-900 border border-zinc-800 text-amber-300 font-mono text-[9px] rounded px-1 py-0.5 outline-none focus:border-indigo-500 cursor-pointer"
                                  >
                                    <option value="all">All Deltas</option>
                                    <option value={10}>&gt; $10 Below MAP</option>
                                    <option value={25}>&gt; $25 Below MAP</option>
                                    <option value={50}>&gt; $50 Below MAP</option>
                                    <option value={100}>&gt; $100 Below MAP</option>
                                  </select>
                                </div>
                                <div className="space-y-1 pt-1 border-t border-zinc-900">
                                  <label className="text-[7.5px] text-slate-400 font-bold block uppercase tracking-wider">MAP Severity Toggles</label>
                                  <div className="grid grid-cols-2 gap-1 mt-0.5">
                                    <button
                                      type="button"
                                      onClick={() => setMapSeverityFilters(prev => ({ ...prev, high: !prev.high }))}
                                      className={`flex items-center gap-1 px-1 py-0.5 rounded border text-[8px] font-bold cursor-pointer transition ${
                                        mapSeverityFilters.high
                                          ? "bg-red-950/40 text-red-400 border-red-900/40"
                                          : "bg-zinc-900/40 text-slate-500 border-zinc-800/20 opacity-50"
                                      }`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${mapSeverityFilters.high ? "bg-red-500 animate-pulse" : "bg-zinc-600"}`} />
                                      High
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setMapSeverityFilters(prev => ({ ...prev, medium: !prev.medium }))}
                                      className={`flex items-center gap-1 px-1 py-0.5 rounded border text-[8px] font-bold cursor-pointer transition ${
                                        mapSeverityFilters.medium
                                          ? "bg-amber-950/40 text-amber-400 border-amber-900/40"
                                          : "bg-zinc-900/40 text-slate-500 border-zinc-800/20 opacity-50"
                                      }`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${mapSeverityFilters.medium ? "bg-amber-500 animate-pulse" : "bg-zinc-600"}`} />
                                      Med
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setMapSeverityFilters(prev => ({ ...prev, low: !prev.low }))}
                                      className={`flex items-center gap-1 px-1 py-0.5 rounded border text-[8px] font-bold cursor-pointer transition ${
                                        mapSeverityFilters.low
                                          ? "bg-orange-950/40 text-orange-400 border-orange-900/40"
                                          : "bg-zinc-900/40 text-slate-500 border-zinc-800/20 opacity-50"
                                      }`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${mapSeverityFilters.low ? "bg-orange-500 animate-pulse" : "bg-zinc-600"}`} />
                                      Low
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setMapSeverityFilters(prev => ({ ...prev, compliant: !prev.compliant }))}
                                      className={`flex items-center gap-1 px-1 py-0.5 rounded border text-[8px] font-bold cursor-pointer transition ${
                                        mapSeverityFilters.compliant
                                          ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/40"
                                          : "bg-zinc-900/40 text-slate-500 border-zinc-800/20 opacity-50"
                                      }`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${mapSeverityFilters.compliant ? "bg-emerald-500" : "bg-zinc-600"}`} />
                                      Comp
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Dedicated Floating Map Compliance & Reseller Spectrum Legend */}
                            {(() => {
                              let critical = 0;
                              let moderate = 0;
                              let low = 0;
                              let compliant = 0;
                              let historicalHighRisk = 0;

                              partnerHeatPoints.forEach(point => {
                                const sev = getSeverityOfPoint(point);
                                if (sev === "high") critical++;
                                else if (sev === "medium") moderate++;
                                else if (sev === "low") low++;
                                else compliant++;

                                const isHighRisk = (point.frequencyRate >= 30 && point.violatingScansWithPartner >= 1) || (point.violatingScansWithPartner >= 2);
                                if (isHighRisk) historicalHighRisk++;
                              });

                              return (
                                <MapComplianceLegend
                                  className="absolute bottom-3 left-3 w-64 animate-fade-in"
                                  mapSeverityFilters={mapSeverityFilters}
                                  onToggleSeverity={(sev) => setMapSeverityFilters(prev => ({ ...prev, [sev]: !prev[sev] }))}
                                  showHistoricalOverlay={showHistoricalOverlay}
                                  onToggleHistoricalOverlay={() => setShowHistoricalOverlay(prev => !prev)}
                                  showViolationHeatmap={showViolationHeatmap}
                                  onToggleViolationHeatmap={() => setShowViolationHeatmap(prev => !prev)}
                                  showPartnerMarkers={true}
                                  onDownloadReport={handleDownloadRegionalHeatmapReport}
                                  partnerCounts={{
                                    total: partnerHeatPoints.length,
                                    critical,
                                    moderate,
                                    low,
                                    compliant,
                                    historicalHighRisk
                                  }}
                                  defaultCollapsed={isHeatmapLegendCollapsed}
                                />
                              );
                            })()}
                          </div>
                        </APIProvider>
                      )}
                    </div>
                  ) : mapEngine === "compliance-heatmap" ? (
                    <div className="relative w-full">
                      <ComplianceHeatmapView
                        partners={partners}
                        products={products}
                        scans={scans}
                        onSelectPartner={(partner) => {
                          const point = partnerHeatPoints.find(p => p.partner.id === partner.id);
                          if (point) setSelectedPartnerPin(point);
                          setFocusedPartnerId(partner.id);
                        }}
                        selectedPartnerId={focusedPartnerId}
                        height={380}
                        onTriggerScan={onTriggerScan}
                      />
                    </div>
                  ) : mapEngine === "d3-heatmap" ? (
                    <div className="relative w-full">
                      <GeographicalViolationHeatmapD3
                        partnerHeatPoints={partnerHeatPoints}
                        activeViolationsList={activeViolationsList}
                        onSelectPartner={(point) => setSelectedPartnerPin(point)}
                        selectedPartner={selectedPartnerPin}
                        mapSeverityFilters={mapSeverityFilters}
                        mapRegionFilter={mapRegionFilter}
                        mapCategoryFilter={mapCategoryFilter}
                        mapShowOnlyFlagged={mapShowOnlyFlagged}
                        mapPriceDeltaFilter={mapPriceDeltaFilter}
                        height={330}
                      />
                    </div>
                  ) : (
                    /* SVG Visual World Map with interactive choropleth paths */
                    <div className="relative overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950/80 p-2 shadow-inner h-80 w-full flex flex-col justify-center">
                      {/* Floating Reset View Button */}
                      <button
                        type="button"
                        id="schematic-reset-map-view-btn"
                        onClick={() => {
                          const defaultPreset = REGION_MAP_PRESETS[selectedGeoRegion || "us"] || REGION_MAP_PRESETS["us"];
                          setMapCenterState(defaultPreset);
                          setMapZoom(defaultPreset.zoom);
                          setMapZoomState(defaultPreset.zoom);
                          setMapActiveJumpToast(null);
                        }}
                        className="absolute top-2.5 right-28 bg-zinc-950/95 border border-zinc-800/90 hover:border-indigo-500/80 rounded-md px-2.5 py-1 text-[10px] font-mono font-bold text-slate-300 hover:text-white shadow-xl backdrop-blur-md flex items-center gap-1.5 z-10 transition cursor-pointer active:scale-95 border-indigo-500/30"
                        title="Return map zoom level and center position to default startup state"
                      >
                        <RotateCcw className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span>Reset View</span>
                      </button>

                      {/* Discreet Zoom Level Integer Badge in corner */}
                      <div 
                        id="schematic-map-zoom-level-badge"
                        className="absolute top-2.5 right-2.5 bg-zinc-950/90 border border-zinc-800/90 rounded-md px-2.5 py-1 text-[10px] font-mono font-bold text-indigo-400 shadow-xl backdrop-blur-md flex items-center gap-1.5 z-10 select-none border-indigo-500/30"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        <span>Zoom: {Math.round(mapZoomState || mapZoom || REGION_MAP_PRESETS[selectedGeoRegion || "us"].zoom)}</span>
                      </div>

                      {/* Discreet Zoom Level & Granularity Indicator Badge */}
                      {(() => {
                        const currentZoomVal = mapZoomState || mapZoom || REGION_MAP_PRESETS[selectedGeoRegion || "us"].zoom;
                        const zoomGranularity = getZoomGranularityLabel(currentZoomVal);
                        return (
                          <div 
                            id="schematic-map-zoom-granularity-indicator"
                            className="absolute top-2.5 left-2.5 bg-zinc-950/95 border border-zinc-800/90 rounded-lg px-2.5 py-1.5 text-[9px] font-mono text-slate-300 shadow-xl backdrop-blur-md flex items-center gap-2 z-10 select-none animate-fade-in border-indigo-900/40"
                          >
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[8px]">Granularity:</span>
                                <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold border ${zoomGranularity.badgeColor}`}>
                                  {zoomGranularity.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[8.5px]">
                                <span className="text-zinc-500 text-[8px]">{zoomGranularity.detail}</span>
                                <span className="text-zinc-700">•</span>
                                <span className="text-indigo-400 font-extrabold font-mono">Zoom: {Math.round(currentZoomVal)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Floating Heatmap Analyzer Controls Widget & Spectrum Legend */}
                      <div className="absolute top-[58px] left-2.5 bg-zinc-950/95 border border-zinc-800 rounded-lg p-2.5 text-[9px] font-mono text-slate-300 w-44 shadow-2xl backdrop-blur-md z-10 flex flex-col gap-2 select-none animate-fade-in border-rose-950/45">
                        <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5 mb-1">
                          <div className="flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                            <span className="text-zinc-200 font-extrabold uppercase tracking-wider text-[8px]">Heatmap Analyzer</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowViolationHeatmap(prev => !prev)}
                            className={`px-1.5 py-0.5 rounded text-[8px] font-bold border cursor-pointer transition ${
                              showViolationHeatmap 
                                ? "bg-rose-950/40 text-rose-400 border-rose-900/30" 
                                : "bg-zinc-900/40 text-slate-500 border-zinc-800/40"
                            }`}
                          >
                            {showViolationHeatmap ? "ON" : "OFF"}
                          </button>
                        </div>

                        {showViolationHeatmap && (
                          <>
                            {/* Metric Selector */}
                            <div className="space-y-1">
                              <label className="text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider">Metric Density Source</label>
                              <div className="grid grid-cols-3 gap-0.5 bg-zinc-900/60 border border-zinc-850 p-0.5 rounded">
                                <button
                                  type="button"
                                  onClick={() => setHeatmapIntensityMetric("violations")}
                                  className={`py-0.5 text-[7px] font-extrabold rounded-sm cursor-pointer transition ${
                                    heatmapIntensityMetric === "violations"
                                      ? "bg-rose-950/40 text-rose-400 font-black border border-rose-900/30"
                                      : "text-slate-500 hover:text-slate-300"
                                  }`}
                                  title="Density based on historical count of violating sweeps"
                                >
                                  History
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setHeatmapIntensityMetric("frequency")}
                                  className={`py-0.5 text-[7px] font-extrabold rounded-sm cursor-pointer transition ${
                                    heatmapIntensityMetric === "frequency"
                                      ? "bg-rose-950/40 text-rose-400 font-black border border-rose-900/30"
                                      : "text-slate-500 hover:text-slate-300"
                                  }`}
                                  title="Density based on frequency of pricing violations %"
                                >
                                  Freq %
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setHeatmapIntensityMetric("activeViolations")}
                                  className={`py-0.5 text-[7px] font-extrabold rounded-sm cursor-pointer transition ${
                                    heatmapIntensityMetric === "activeViolations"
                                      ? "bg-rose-950/40 text-rose-400 font-black border border-rose-900/30"
                                      : "text-slate-500 hover:text-slate-300"
                                  }`}
                                  title="Density based on current active live violations count"
                                >
                                  Active
                                </button>
                              </div>
                            </div>

                            {/* Radius Scale Slider */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[7.5px] text-zinc-400 font-bold">
                                <span className="uppercase tracking-wider">Heat Radius Scale</span>
                                <span className="text-rose-400 font-extrabold font-mono">{heatmapRadiusScale.toFixed(1)}x</span>
                              </div>
                              <input
                                type="range"
                                min="0.5"
                                max="2.5"
                                step="0.1"
                                value={heatmapRadiusScale}
                                onChange={(e) => setHeatmapRadiusScale(parseFloat(e.target.value))}
                                className="w-full accent-rose-500 bg-zinc-900 h-1 rounded cursor-pointer"
                              />
                            </div>

                            {/* Spectrum Legend */}
                            <div className="pt-1.5 border-t border-zinc-900 space-y-1">
                              <span className="text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider block">Violation Density Spectrum</span>
                              <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 opacity-80" />
                              <div className="flex justify-between text-[6.5px] text-slate-500 font-bold">
                                <span>LOW DENSITY</span>
                                <span>CRITICAL</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="relative w-full h-44 sm:h-48">
                        <svg viewBox="0 0 200 100" className="w-full h-full" preserveAspectRatio="none">
                        <defs>
                          <filter id="svg-heat-blur">
                            <feGaussianBlur stdDeviation="1.5" />
                          </filter>
                          <radialGradient id="high-heat" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.75" />
                            <stop offset="40%" stopColor="#ef4444" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                          </radialGradient>
                          <radialGradient id="medium-heat" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.75" />
                            <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                          </radialGradient>
                          <radialGradient id="low-heat" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#f97316" stopOpacity="0.65" />
                            <stop offset="40%" stopColor="#f97316" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                          </radialGradient>
                        </defs>
                        {/* Abstract high-tech grids */}
                        <g stroke="#1e1b4b" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.3">
                          <line x1="0" y1="20" x2="200" y2="20" />
                          <line x1="0" y1="50" x2="200" y2="50" />
                          <line x1="0" y1="80" x2="200" y2="80" />
                          <line x1="50" y1="0" x2="50" y2="100" />
                          <line x1="100" y1="0" x2="100" y2="100" />
                          <line x1="150" y1="0" x2="150" y2="100" />
                        </g>

                        {/* Interactive Region Paths */}
                        {(() => {
                          const regionsList = [
                            { id: "ca", name: "Canada", d: "M 15,12 Q 35,8 48,16 T 50,22 Q 38,25 20,20 Z" },
                            { id: "us", name: "United States", d: "M 18,22 Q 38,24 50,24 T 52,35 Q 38,38 20,32 Z" },
                            { id: "eu", name: "Europe", d: "M 90,15 Q 115,10 125,25 T 100,45 Q 90,30 90,15 Z" },
                            { id: "apac", name: "APAC", d: "M 130,15 Q 165,12 185,25 T 155,55 Q 135,40 130,15 Z" },
                            { id: "latam", name: "LATAM", d: "M 45,45 Q 55,50 48,75 T 38,85 Q 35,60 45,45 Z" }
                          ];

                          const getRegionStats = (regionName: string) => {
                            const violations = activeViolationsList.filter(v => getRegionForPartnerName(v.partner, v.domain) === regionName);
                            const count = violations.length;
                            let avgVariance = 0;
                            if (count > 0) {
                              const totalVariance = violations.reduce((acc, v) => {
                                const varPct = Math.max(0, ((v.map - v.found) / v.map) * 100);
                                return acc + varPct;
                              }, 0);
                              avgVariance = Math.round(totalVariance / count);
                            } else {
                              const seedVariance: Record<string, number> = { "United States": 14, "Canada": 8, "Europe": 18, "APAC": 12, "LATAM": 5 };
                              avgVariance = seedVariance[regionName] || 10;
                            }
                            return { count, avgVariance };
                          };

                          const getPathFill = (regionId: string, regionName: string) => {
                            const { count, avgVariance } = getRegionStats(regionName);
                            const isHovered = hoveredRegion === regionId || selectedGeoRegion === regionId;
                            
                            if (heatmapMetric === "count") {
                              if (count === 0) return isHovered ? "rgba(16, 185, 129, 0.25)" : "rgba(16, 185, 129, 0.1)";
                              if (count <= 2) return isHovered ? "rgba(245, 158, 11, 0.4)" : "rgba(245, 158, 11, 0.25)";
                              return isHovered ? "rgba(239, 68, 68, 0.6)" : "rgba(239, 68, 68, 0.4)";
                            } else {
                              if (avgVariance <= 10) return isHovered ? "rgba(16, 185, 129, 0.25)" : "rgba(16, 185, 129, 0.1)";
                              if (avgVariance <= 18) return isHovered ? "rgba(245, 158, 11, 0.4)" : "rgba(245, 158, 11, 0.25)";
                              return isHovered ? "rgba(239, 68, 68, 0.6)" : "rgba(239, 68, 68, 0.4)";
                            }
                          };

                          return regionsList.map((reg) => {
                            const isSelected = selectedGeoRegion === reg.id || (!selectedGeoRegion && reg.id === "us");
                            const isHovered = hoveredRegion === reg.id;
                            return (
                              <path
                                key={reg.id}
                                d={reg.d}
                                fill={getPathFill(reg.id, reg.name)}
                                stroke={isSelected ? "#818cf8" : isHovered ? "#6366f1" : "#312e81"}
                                strokeWidth={isSelected ? "1" : "0.5"}
                                className="transition-all duration-300 cursor-pointer"
                                onMouseEnter={() => setHoveredRegion(reg.id)}
                                onMouseLeave={() => setHoveredRegion(null)}
                                onClick={() => setSelectedGeoRegion(reg.id)}
                              />
                            );
                          });
                        })()}

                        {/* Faint links from hubs */}
                        <g stroke="#312e81" strokeWidth="0.5" strokeDasharray="1,2" opacity="0.4">
                          <line x1="45" y1="35" x2="105" y2="24" />
                          <line x1="45" y1="35" x2="62" y2="68" />
                          <line x1="105" y1="24" x2="155" y2="40" />
                        </g>

                        {/* Regional Hotspot center radar dots */}
                        {(() => {
                          const regionsList = [
                            { id: "us", name: "United States", x: 45, y: 35 },
                            { id: "ca", name: "Canada", x: 42, y: 18 },
                            { id: "eu", name: "Europe", x: 105, y: 24 },
                            { id: "apac", name: "APAC", x: 155, y: 40 },
                            { id: "latam", name: "LATAM", x: 62, y: 68 },
                          ];

                          const getRegionHistoricalStats = (regionName: string) => {
                            const regionPartners = partners.filter(p => getRegionForPartnerName(p.name, p.domain) === regionName);
                            let totalScans = 0;
                            let totalViolating = 0;
                            regionPartners.forEach(p => {
                              const hp = partnerHeatPoints.find(item => item.partner.id === p.id);
                              if (hp) {
                                totalScans += hp.totalScansWithPartner;
                                totalViolating += hp.violatingScansWithPartner;
                              }
                            });
                            const historicalRate = totalScans > 0 ? Math.round((totalViolating / totalScans) * 100) : 0;
                            return { totalScans, totalViolating, historicalRate };
                          };

                          return regionsList.map((reg) => {
                            const violations = activeViolationsList.filter(v => getRegionForPartnerName(v.partner, v.domain) === reg.name);
                            const count = violations.length;
                            const isHovered = hoveredRegion === reg.id || selectedGeoRegion === reg.id;
                            const hasViolations = count > 0;
                            const { historicalRate } = getRegionHistoricalStats(reg.name);
                            const isHighHistoricalRisk = historicalRate >= 20; // 20% or more breach density is high-risk

                            return (
                              <g 
                                key={reg.id} 
                                className="cursor-pointer"
                                onClick={() => setSelectedGeoRegion(reg.id)}
                                onMouseEnter={() => setHoveredRegion(reg.id)}
                                onMouseLeave={() => setHoveredRegion(null)}
                              >
                                {hasViolations && (
                                  <circle
                                    cx={reg.x}
                                    cy={reg.y}
                                    r={isHovered ? 8 : 5}
                                    fill="none"
                                    stroke={reg.id === "us" || reg.id === "eu" ? "#ef4444" : "#f59e0b"}
                                    strokeWidth="1"
                                    className="animate-ping animate-duration-3000 origin-center"
                                  />
                                )}
                                <circle
                                  cx={reg.x}
                                  cy={reg.y}
                                  r={isHovered ? 5 : 3.5}
                                  fill={hasViolations ? (reg.id === "us" || reg.id === "eu" ? "#ef4444" : "#f59e0b") : "#10b981"}
                                  className="transition-all duration-300"
                                />

                                {/* Historical Regional High-Risk Zone dashed SVG circle */}
                                {showHistoricalOverlay && isHighHistoricalRisk && (
                                  <circle
                                    cx={reg.x}
                                    cy={reg.y}
                                    r={isHovered ? 14 : 10}
                                    fill="rgba(217, 70, 239, 0.05)"
                                    stroke="#d946ef"
                                    strokeWidth="0.8"
                                    strokeDasharray="2,2"
                                    className="animate-pulse origin-center"
                                  />
                                )}
                              </g>
                            );
                          });
                        })()}

                        {/* Schematic Geographical Violation Density Heatmap */}
                        {showViolationHeatmap && (() => {
                          return partnerHeatPoints
                            .filter(point => point.violatingScansWithPartner > 0)
                            .filter(point => {
                              // 1. Severity filter
                              const sev = getSeverityOfPoint(point);
                              if (!mapSeverityFilters[sev as keyof typeof mapSeverityFilters]) return false;

                              // 2. Partner region filter
                              if (mapRegionFilter !== "all") {
                                const region = getRegionForPartnerName(point.partner.name, point.partner.domain);
                                if (region !== mapRegionFilter) return false;
                              }

                              // 3. Product category filter
                              if (mapCategoryFilter !== "all") {
                                const partnerProductIds = point.partner.associatedProducts || [];
                                const hasProduct = partnerProductIds.some((pId: string) => getProductCategory(pId) === mapCategoryFilter);
                                if (!hasProduct) return false;
                              }

                              // 4. Currently flagged for MAP violations filter
                              if (mapShowOnlyFlagged) {
                                const hasActiveViolation = activeViolationsList.some(
                                  v => v.partner === point.partner.name || v.domain === point.partner.domain
                                );
                                if (!hasActiveViolation) return false;
                              }

                              // 5. Price delta threshold filter
                              if (mapPriceDeltaFilter !== "all") {
                                const delta = getPointMaxPriceDelta(point);
                                if (delta < mapPriceDeltaFilter) return false;
                              }

                              return true;
                            })
                            .map((point, idx) => {
                              const { x, y } = projectCoordsToSvg(point.lat, point.lng);
                              let rawRadius = 6;
                              if (heatmapIntensityMetric === "frequency") {
                                rawRadius = 6 + (point.frequencyRate / 100) * 15;
                              } else if (heatmapIntensityMetric === "activeViolations") {
                                const activeCount = activeViolationsList.filter(
                                  v => v.partner === point.partner.name || v.domain === point.partner.domain
                                ).length;
                                rawRadius = 6 + activeCount * 6;
                              } else {
                                rawRadius = 6 + point.violatingScansWithPartner * 4;
                              }
                              const radius = rawRadius * heatmapRadiusScale;
                              const sev = getSeverityOfPoint(point);
                              let gradientId = "low-heat";
                              if (sev === "high") gradientId = "high-heat";
                              else if (sev === "medium") gradientId = "medium-heat";

                              return (
                                <g key={`schematic-heat-overlay-${point.partner.id || idx}`}>
                                  {/* Pulsing glow ring */}
                                  <circle
                                    cx={x}
                                    cy={y}
                                    r={radius * 1.3}
                                    fill="none"
                                    stroke={sev === "high" ? "#ef4444" : sev === "medium" ? "#f59e0b" : "#f97316"}
                                    strokeWidth="0.3"
                                    opacity="0.3"
                                    className="animate-pulse origin-center"
                                  />
                                  {/* Blurred density gradient fill */}
                                  <circle
                                    cx={x}
                                    cy={y}
                                    r={radius}
                                    fill={`url(#${gradientId})`}
                                    filter="url(#svg-heat-blur)"
                                    className="pointer-events-none mix-blend-screen"
                                  />
                                  {/* Interactive overlay circle for hovering tooltip */}
                                  <circle
                                    cx={x}
                                    cy={y}
                                    r={Math.max(radius, 6)}
                                    fill="transparent"
                                    className="cursor-pointer"
                                    onMouseEnter={() => {
                                      setHoveredPartnerPoint({
                                        point,
                                        x,
                                        y
                                      });
                                    }}
                                    onMouseLeave={() => {
                                      setHoveredPartnerPoint(null);
                                    }}
                                    onClick={() => setSelectedPartnerPin(point)}
                                  />
                                </g>
                              );
                            });
                        })()}
                      </svg>

                      {/* Flagged Partner Hover Tooltip on Schematic Map */}
                      {hoveredPartnerPoint && (() => {
                        const point = hoveredPartnerPoint.point;
                        const freq = point.frequencyRate;
                        const partnerActiveViolations = activeViolationsList.filter(
                          v => v.partner === point.partner.name || v.domain === point.partner.domain
                        );
                        const activeViolationsCount = partnerActiveViolations.length;
                        const historicalViolationsCount = point.violatingScansWithPartner;

                        // Calculate highest severity based on active violations (if any) or overall historical frequency
                        let highestSeverity = "Compliant";
                        let severityColorClass = "text-emerald-400 bg-emerald-950/40 border border-emerald-900/30";

                        if (activeViolationsCount > 0) {
                          let maxPct = 0;
                          partnerActiveViolations.forEach(v => {
                            const diff = v.map - v.found;
                            const pct = Math.round((diff / v.map) * 100);
                            if (pct > maxPct) maxPct = pct;
                          });

                          if (maxPct >= 15) {
                            highestSeverity = "Critical (High)";
                            severityColorClass = "text-red-400 bg-red-950/40 border border-red-900/30 animate-pulse";
                          } else if (maxPct >= 5) {
                            highestSeverity = "Moderate (Medium)";
                            severityColorClass = "text-amber-400 bg-amber-950/40 border border-amber-900/30";
                          } else {
                            highestSeverity = "Minor (Low)";
                            severityColorClass = "text-orange-400 bg-orange-950/40 border border-orange-900/30";
                          }
                        } else if (historicalViolationsCount > 0) {
                          const overallSev = getSeverityOfPoint(point);
                          if (overallSev === "high") {
                            highestSeverity = "High (Historical)";
                            severityColorClass = "text-red-400 bg-red-950/40 border border-red-900/30";
                          } else if (overallSev === "medium") {
                            highestSeverity = "Medium (Historical)";
                            severityColorClass = "text-amber-400 bg-amber-950/40 border border-amber-900/30";
                          } else {
                            highestSeverity = "Low (Historical)";
                            severityColorClass = "text-orange-400 bg-orange-950/40 border border-orange-900/30";
                          }
                        }

                        return (
                          <div 
                            className="absolute z-50 pointer-events-auto -translate-x-1/2 -translate-y-full mb-3 bg-zinc-950/95 border border-zinc-800 text-slate-100 p-3 rounded-lg shadow-xl w-56 text-[10px] font-mono leading-normal backdrop-blur-md before:absolute before:h-4 before:w-full before:top-full before:left-0"
                            style={{
                              left: `${(hoveredPartnerPoint.x / 200) * 100}%`,
                              top: `${hoveredPartnerPoint.y}%`
                            }}
                          >
                            {/* Header */}
                            <div className="flex items-start justify-between border-b border-zinc-900 pb-1.5 mb-2">
                              <div className="max-w-[155px]">
                                <div className="font-extrabold text-white text-[11px] truncate" title={point.partner.name}>
                                  {point.partner.name}
                                </div>
                                <div className="text-[8.5px] text-slate-400 truncate mt-0.5 select-all">
                                  {point.partner.domain}
                                </div>
                              </div>
                              
                              {/* Copy Action Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(`${point.partner.name}\nDomain: ${point.partner.domain}\nActive Violations: ${activeViolationsCount}\nHistorical Violations: ${historicalViolationsCount}\nSeverity: ${highestSeverity}`);
                                  setCopiedPartnerId(point.partner.id);
                                  setTimeout(() => setCopiedPartnerId(null), 2000);
                                }}
                                className="p-1 bg-zinc-900 hover:bg-zinc-800 text-slate-400 hover:text-white border border-zinc-850 rounded transition cursor-pointer shrink-0"
                                title="Copy Partner Details"
                              >
                                {copiedPartnerId === point.partner.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            {/* Stats Grid */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Compliance Rate:</span>
                                <span className={`font-bold ${point.violatingScansWithPartner > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                                  {100 - freq}%
                                </span>
                              </div>
                              
                              <div className="flex justify-between">
                                <span className="text-slate-400">Active Violations:</span>
                                <span className={`font-bold ${activeViolationsCount > 0 ? "text-red-400 font-extrabold" : "text-emerald-400"}`}>
                                  {activeViolationsCount} active
                                </span>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-slate-400">Historical Sweeps:</span>
                                <span className="text-slate-300 font-bold">
                                  {historicalViolationsCount} of {point.totalScansWithPartner}
                                </span>
                              </div>

                              <div className="flex flex-col gap-1 border-t border-zinc-900/60 pt-1.5 mt-1.5">
                                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Highest Severity Level</span>
                                <div className={`px-2 py-0.5 rounded font-extrabold text-center text-[9px] uppercase tracking-wide ${severityColorClass}`}>
                                  {highestSeverity}
                                </div>
                              </div>
                            </div>

                            {/* Interactive Action Footer Button */}
                            <div className="mt-2.5 pt-2 border-t border-zinc-900/60 flex gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPartnerPin(point);
                                }}
                                className="w-full py-1 bg-indigo-950/60 hover:bg-indigo-900/50 text-[8.5px] font-bold text-indigo-400 border border-indigo-900/40 hover:border-indigo-800/60 rounded transition cursor-pointer text-center flex items-center justify-center gap-1 shadow-[0_0_8px_rgba(99,102,241,0.05)]"
                                title="Open detailed compliance inspector panel for this reseller"
                              >
                                <MapPin className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                                Inspect Reseller
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                      {/* Dynamic floating hovering feedback tooltip built directly in the map overlay */}
                      {(() => {
                        const activeRegionId = hoveredRegion;
                        if (!activeRegionId) return null;
                        
                        const regionsWithCoordinates = [
                          { id: "us", name: "United States", x: 45, y: 35 },
                          { id: "ca", name: "Canada", x: 42, y: 18 },
                          { id: "eu", name: "Europe", x: 105, y: 24 },
                          { id: "apac", name: "APAC", x: 155, y: 40 },
                          { id: "latam", name: "LATAM", x: 62, y: 68 },
                        ];
                        
                        const regInfo = regionsWithCoordinates.find(r => r.id === activeRegionId);
                        if (!regInfo) return null;
                        
                        const regionPartners = partners.filter(p => getRegionForPartnerName(p.name, p.domain) === regInfo.name);
                        const totalPartnersCount = regionPartners.length;
                        
                        const regionViolations = activeViolationsList.filter(v => getRegionForPartnerName(v.partner, v.domain) === regInfo.name);
                        const activeViolationsCount = regionViolations.length;

                        const violatingPartnersCount = regionPartners.filter(p => 
                          p.complianceStatus === "violating" || 
                          regionViolations.some(v => v.partner === p.name || v.domain === p.domain)
                        ).length;

                        let totalScansInRegion = 0;
                        let totalViolatingInRegion = 0;
                        regionPartners.forEach(p => {
                          const hp = partnerHeatPoints.find(item => item.partner.id === p.id);
                          if (hp) {
                            totalScansInRegion += hp.totalScansWithPartner;
                            totalViolatingInRegion += hp.violatingScansWithPartner;
                          }
                        });
                        const historicalRateInRegion = totalScansInRegion > 0 ? Math.round((totalViolatingInRegion / totalScansInRegion) * 100) : 0;

                        const violatingPartnersListInRegion = regionPartners.map(p => {
                          const partnerViolations = regionViolations.filter(v => v.partner === p.name || v.domain === p.domain);
                          return {
                            partner: p,
                            violationCount: partnerViolations.length,
                            status: p.complianceStatus || 'compliant'
                          };
                        }).filter(item => item.violationCount > 0 || item.status === 'violating' || item.status === 'warning')
                          .sort((a, b) => b.violationCount - a.violationCount);

                        const aggregatedDeviation = regionViolations.reduce((sum, v) => {
                          const diff = v.map - v.found;
                          return sum + (diff > 0 ? diff : 0);
                        }, 0);

                        const isHighViolation = activeViolationsCount > 2;
                        const isMediumViolation = activeViolationsCount > 0 && activeViolationsCount <= 2;
                        const hasViolations = activeViolationsCount > 0;

                        // Position tooltip relative to coordinates in percent
                        const leftPct = regInfo.x / 2; // Since width of viewBox is 200, percent is x / 2
                        const topPct = regInfo.y; // Since height of viewBox is 100, percent is y

                        return (
                          <div 
                            className="absolute z-50 pointer-events-none transition-all duration-150 backdrop-blur-md shadow-2xl rounded-lg border border-zinc-800 bg-zinc-950/95 p-2 text-[9px] font-mono leading-normal text-slate-100 w-48"
                            style={{ 
                              left: `${leftPct}%`, 
                              top: `${topPct}%`,
                              transform: 'translate(-50%, -105%)', // Position above the dot
                            }}
                          >
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-1 mb-1.5">
                              <span className="text-white font-extrabold text-[10px] flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${hasViolations ? (isHighViolation ? "bg-red-500 animate-pulse" : "bg-amber-500") : "bg-emerald-500"}`} />
                                {regInfo.name}
                              </span>
                              <span className={`px-1 py-0.2 rounded text-[7.5px] font-bold ${
                                isHighViolation 
                                  ? "bg-red-950 text-red-400 border border-red-900/40" 
                                  : isMediumViolation 
                                    ? "bg-amber-950 text-amber-400 border border-amber-900/40" 
                                    : "bg-emerald-950 text-emerald-400 border border-emerald-900/40"
                              }`}>
                                {isHighViolation ? "HIGH RISK" : isMediumViolation ? "MODERATE" : "STABLE"}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Total Partners:</span>
                                <span className="text-white font-bold">{totalPartnersCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Violating Partners:</span>
                                <span className="text-red-400 font-bold">{violatingPartnersCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Active Violations:</span>
                                <span className={`${hasViolations ? "text-red-400 font-bold" : "text-emerald-400"}`}>{activeViolationsCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Historical Breach:</span>
                                <span className="text-fuchsia-400 font-bold">{historicalRateInRegion}% density</span>
                              </div>
                              <div className="flex justify-between pt-1 border-t border-zinc-900/80 mt-1">
                                <span className="text-slate-400">Deviation:</span>
                                <span className="text-indigo-400 font-extrabold">${aggregatedDeviation.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                              </div>

                              {/* Specific Violations & Partner details list section */}
                              {violatingPartnersListInRegion.length > 0 ? (
                                <div className="mt-1.5 pt-1.5 border-t border-zinc-800/80">
                                  <span className="text-slate-400 font-extrabold block mb-1 text-[7.5px] uppercase tracking-wider">Top Partners:</span>
                                  <div className="space-y-0.5 max-h-[60px] overflow-y-auto pr-1">
                                    {violatingPartnersListInRegion.slice(0, 3).map((item, idx) => (
                                      <div key={idx} className="flex justify-between items-center text-[8px]">
                                        <span className="text-slate-200 truncate max-w-[100px]" title={`${item.partner.name}`}>
                                          {item.partner.name}
                                        </span>
                                        <span className="text-red-400 font-bold font-mono">
                                          {item.violationCount}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-1.5 pt-1.5 border-t border-zinc-800/80 text-center">
                                  <span className="text-emerald-400 font-bold text-[8px] block">✓ All compliant</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Clear Floating MAP Violation Severity Level Legend */}
                      <div 
                        id="schematic-map-severity-legend"
                        className="absolute bottom-3 left-3 bg-zinc-950/95 border border-zinc-800/90 rounded-lg p-2 text-[9px] font-mono shadow-2xl backdrop-blur-md z-20 flex flex-col gap-1.5 select-none border-indigo-900/40 w-48 animate-fade-in"
                      >
                        <div className="flex items-center justify-between border-b border-zinc-850 pb-1">
                          <div className="flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                            <span className="text-[9px] font-bold text-zinc-200 uppercase tracking-wider">MAP Severity Legend</span>
                          </div>
                          <span className="text-[7.5px] text-zinc-500 font-sans">Deficit Rate</span>
                        </div>

                        <div className="space-y-1">
                          {/* High Severity */}
                          <div className="flex items-center justify-between px-1.5 py-0.5 rounded bg-rose-950/40 border border-rose-800/40 text-[8.5px]">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_6px_rgba(244,63,94,0.6)] shrink-0" />
                              <span className="font-bold text-rose-300">High Severity</span>
                            </div>
                            <span className="font-bold text-rose-400 font-mono">&gt;15% below MAP</span>
                          </div>

                          {/* Medium Severity */}
                          <div className="flex items-center justify-between px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-800/40 text-[8.5px]">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)] shrink-0" />
                              <span className="font-bold text-amber-300">Medium Severity</span>
                            </div>
                            <span className="font-bold text-amber-400 font-mono">5% - 15% below</span>
                          </div>

                          {/* Low Severity */}
                          <div className="flex items-center justify-between px-1.5 py-0.5 rounded bg-yellow-950/40 border border-yellow-800/40 text-[8.5px]">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.4)] shrink-0" />
                              <span className="font-bold text-yellow-300">Low Severity</span>
                            </div>
                            <span className="font-bold text-yellow-400 font-mono">&lt;5% below MAP</span>
                          </div>

                          {/* Compliant */}
                          <div className="flex items-center justify-between px-1.5 py-0.5 rounded bg-emerald-950/30 border border-emerald-800/30 text-[8.5px]">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)] shrink-0" />
                              <span className="font-bold text-emerald-300">Compliant</span>
                            </div>
                            <span className="font-bold text-emerald-400 font-mono">0% Deficit</span>
                          </div>
                        </div>

                        {/* Dedicated Download PDF Floating Action Button */}
                        <button
                          type="button"
                          onClick={handleDownloadRegionalHeatmapReport}
                          className="w-full mt-0.5 py-1 px-2 bg-indigo-950/90 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-800/60 hover:border-indigo-500 rounded text-[8.5px] font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                          title="Download Geographic Compliance Snapshot Report (PDF)"
                        >
                          <FileText className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span>Download PDF Report</span>
                        </button>
                      </div>

                      {/* Sensitivity Toggle Button next to vertical zoom slider (Schematic) */}
                      <button
                        type="button"
                        id="schematic-map-sensitivity-toggle-btn"
                        onClick={() => setMapSensitivity(prev => prev === "precise" ? "rapid" : "precise")}
                        className={`absolute top-2.5 right-15 bg-zinc-950/95 border ${
                          mapSensitivity === "precise" 
                            ? "border-indigo-500/60 text-indigo-300 shadow-indigo-500/10 hover:border-indigo-400" 
                            : "border-amber-500/60 text-amber-300 shadow-amber-500/10 hover:border-amber-400"
                        } hover:bg-zinc-900 rounded-xl px-2 py-1.5 text-[9px] font-mono shadow-2xl backdrop-blur-md z-20 flex flex-col items-center gap-1 select-none transition-all duration-300 active:scale-95 cursor-pointer border-indigo-900/50 group`}
                        title={`Sensitivity Mode: ${mapSensitivity === "precise" ? "Precise (fine-grained 0.1x steps)" : "Rapid (coarse-grained 1.0x steps)"}. Click to toggle.`}
                      >
                        <div className="flex items-center gap-1">
                          {mapSensitivity === "precise" ? (
                            <Sliders className="w-3 h-3 text-indigo-400 shrink-0 group-hover:rotate-90 transition-transform duration-300" />
                          ) : (
                            <Zap className="w-3 h-3 text-amber-400 shrink-0 group-hover:scale-125 transition-transform duration-300" />
                          )}
                          <span className="font-extrabold uppercase text-[8px] tracking-wider">
                            {mapSensitivity === "precise" ? "Precise" : "Rapid"}
                          </span>
                        </div>
                        <span className="text-[7px] text-zinc-400 font-mono">
                          {mapSensitivity === "precise" ? "0.1x Step" : "1.0x Step"}
                        </span>
                      </button>

                      {/* Floating Vertical Zoom Slider Control Component (Schematic Map) */}
                      <div 
                        id="schematic-map-vertical-zoom-slider"
                        className="absolute top-2.5 right-2.5 bg-zinc-950/95 border border-zinc-800/90 hover:border-indigo-500/70 rounded-xl p-2 text-[9px] font-mono shadow-2xl backdrop-blur-md z-20 flex flex-col items-center gap-1.5 select-none transition-all duration-300 border-indigo-900/50 w-11 hover:shadow-indigo-500/10 animate-fade-in group"
                      >
                        {/* Zoom In */}
                        <button
                          type="button"
                          id="schematic-map-zoom-in-btn"
                          onClick={() => {
                            const curr = mapZoomState || mapZoom || REGION_MAP_PRESETS[selectedGeoRegion || "us"].zoom;
                            const stepVal = mapSensitivity === "precise" ? 0.25 : 1.5;
                            const next = Math.min(18, Math.round((curr + stepVal) * 100) / 100);
                            setMapZoom(next);
                            setMapZoomState(next);
                          }}
                          className="p-1 rounded-lg hover:bg-indigo-950/80 text-indigo-400 hover:text-indigo-200 transition-all duration-200 cursor-pointer active:scale-90 hover:scale-110"
                          title={`Zoom In (${mapSensitivity === "precise" ? "+0.25" : "+1.5"})`}
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>

                        {/* Vertical Range Slider Track with Smooth Gradient Fill Indicator */}
                        {(() => {
                          const currentZoom = mapZoomState || mapZoom || REGION_MAP_PRESETS[selectedGeoRegion || "us"].zoom;
                          const zoomPercentage = Math.min(100, Math.max(0, ((currentZoom - 2) / 16) * 100));
                          return (
                            <div className="h-24 flex items-center justify-center relative my-0.5 w-full group/track">
                              {/* Background Track Rail */}
                              <div className="absolute inset-y-1 w-1.5 bg-zinc-850 rounded-full overflow-hidden pointer-events-none flex flex-col justify-end">
                                {/* Active Fill Gradient Bar with Smooth CSS Transition */}
                                <div 
                                  className={`w-full bg-gradient-to-t ${
                                    mapSensitivity === "precise" 
                                      ? "from-indigo-600 via-indigo-500 to-cyan-400 shadow-[0_0_8px_rgba(99,102,241,0.6)]" 
                                      : "from-amber-600 via-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                                  } rounded-full transition-all duration-300 ease-out`}
                                  style={{ height: `${zoomPercentage}%` }}
                                />
                              </div>

                              {/* Range Input Slider Control */}
                              <input
                                type="range"
                                min={2}
                                max={18}
                                step={mapSensitivity === "precise" ? 0.1 : 1.0}
                                value={currentZoom}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  setMapZoom(val);
                                  setMapZoomState(val);
                                }}
                                className="h-20 w-3 accent-indigo-500 opacity-80 hover:opacity-100 transition-opacity duration-200 cursor-pointer [writing-mode:vertical-lr] [direction:rtl] z-10"
                                title={`Adjust Map Zoom Level (${mapSensitivity === "precise" ? "Precise 0.1x steps" : "Rapid 1.0x steps"})`}
                              />
                            </div>
                          );
                        })()}

                        {/* Zoom Value Display */}
                        <span className={`text-[8px] font-mono font-extrabold ${
                          mapSensitivity === "precise" ? "text-indigo-300 bg-indigo-950/90 border-indigo-800/70 border-indigo-500/40" : "text-amber-300 bg-amber-950/90 border-amber-800/70 border-amber-500/40"
                        } border rounded-md px-1.5 py-0.5 shadow-sm transition-transform duration-200 hover:scale-105`}>
                          {(mapZoomState || mapZoom || REGION_MAP_PRESETS[selectedGeoRegion || "us"].zoom).toFixed(1)}x
                        </span>

                        {/* Zoom Out */}
                        <button
                          type="button"
                          id="schematic-map-zoom-out-btn"
                          onClick={() => {
                            const curr = mapZoomState || mapZoom || REGION_MAP_PRESETS[selectedGeoRegion || "us"].zoom;
                            const stepVal = mapSensitivity === "precise" ? 0.25 : 1.5;
                            const next = Math.max(2, Math.round((curr - stepVal) * 100) / 100);
                            setMapZoom(next);
                            setMapZoomState(next);
                          }}
                          className="p-1 rounded-lg hover:bg-indigo-950/80 text-indigo-400 hover:text-indigo-200 transition-all duration-200 cursor-pointer active:scale-90 hover:scale-110"
                          title={`Zoom Out (${mapSensitivity === "precise" ? "-0.25" : "-1.5"})`}
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>

                        {/* Reset Preset Zoom Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const defaultPreset = REGION_MAP_PRESETS[selectedGeoRegion || "us"] || REGION_MAP_PRESETS["us"];
                            setMapCenterState(defaultPreset);
                            setMapZoom(defaultPreset.zoom);
                            setMapZoomState(defaultPreset.zoom);
                            setMapActiveJumpToast(null);
                          }}
                          className="pt-1 mt-0.5 border-t border-zinc-850 text-indigo-400 hover:text-white text-[7.5px] transition cursor-pointer font-mono font-semibold uppercase flex items-center gap-0.5 active:scale-95"
                          title="Reset Map Zoom Level & Center Position to Startup State"
                        >
                          <RotateCcw className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                          <span>RESET</span>
                        </button>
                      </div>

                      {/* Floating Overlay Toggle Control for Heatmap vs Standard Markers */}
                      <div 
                        id="schematic-map-view-mode-toggle"
                        className="absolute bottom-3 right-3 bg-zinc-950/95 border border-zinc-800/90 rounded-lg p-1 text-[10px] font-mono shadow-2xl backdrop-blur-md z-20 flex items-center gap-1 select-none border-indigo-900/50"
                      >
                        <button
                          type="button"
                          onClick={() => setShowViolationHeatmap(true)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9.5px] font-bold transition cursor-pointer ${
                            showViolationHeatmap
                              ? "bg-rose-950/80 text-rose-300 border border-rose-800/60 shadow-sm"
                              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                          }`}
                          title="Switch to Heatmap Density Overlay View"
                        >
                          <Flame className={`w-3.5 h-3.5 ${showViolationHeatmap ? "text-rose-400 animate-pulse" : "text-zinc-400"}`} />
                          <span>Heatmap Overlay</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowViolationHeatmap(false)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9.5px] font-bold transition cursor-pointer ${
                            !showViolationHeatmap
                              ? "bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 shadow-sm"
                              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                          }`}
                          title="Switch to Standard Marker View for clear visibility of specific partner incidents"
                        >
                          <MapPin className={`w-3.5 h-3.5 ${!showViolationHeatmap ? "text-indigo-400" : "text-zinc-400"}`} />
                          <span>Standard Markers</span>
                        </button>
                      </div>

                      {/* Dynamic Filter UI Overlaid on Map */}
                      <div className="absolute top-2 right-2 bg-zinc-950/95 border border-zinc-800 rounded-lg p-2 text-[9px] font-mono text-slate-300 w-48 shadow-2xl backdrop-blur-md space-y-1.5 z-10">
                        <div className="flex items-center gap-1 border-b border-zinc-850 pb-1 mb-1 justify-between">
                          <span className="text-zinc-200 font-extrabold flex items-center gap-1">
                            <Filter className="w-3 h-3 text-indigo-400" />
                            Map Filters
                          </span>
                          {(mapRegionFilter !== "all" || mapCategoryFilter !== "all" || !mapSeverityFilters.high || !mapSeverityFilters.medium || !mapSeverityFilters.low || !mapSeverityFilters.compliant) && (
                            <button
                              type="button"
                              onClick={() => {
                                setMapRegionFilter("all");
                                setMapCategoryFilter("all");
                                setMapSeverityFilters({
                                  high: true,
                                  medium: true,
                                  low: true,
                                  compliant: true
                                });
                              }}
                              className="text-[8px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer font-bold"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <div className="space-y-0.5">
                            <label className="text-[7.5px] text-slate-400 font-bold block uppercase tracking-wider">Region</label>
                            <select
                              value={mapRegionFilter}
                              onChange={(e) => setMapRegionFilter(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 text-slate-200 text-[9px] rounded px-1 py-0.5 outline-none focus:border-indigo-500 cursor-pointer"
                            >
                              <option value="all">All Regions</option>
                              <option value="United States">United States</option>
                              <option value="Canada">Canada</option>
                              <option value="Europe">Europe</option>
                              <option value="APAC">APAC</option>
                              <option value="LATAM">LATAM</option>
                            </select>
                          </div>
                          <div className="space-y-0.5">
                            <label className="text-[7.5px] text-slate-400 font-bold block uppercase tracking-wider">Product Category</label>
                            <select
                              value={mapCategoryFilter}
                              onChange={(e) => setMapCategoryFilter(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 text-slate-200 text-[9px] rounded px-1 py-0.5 outline-none focus:border-indigo-500 cursor-pointer"
                            >
                              <option value="all">All Categories</option>
                              <option value="Computer Accessories">Computer Accessories</option>
                              <option value="Audio & Sound">Audio & Sound</option>
                              <option value="Gaming Gear">Gaming Gear</option>
                              <option value="Office Ergonomics">Office Ergonomics</option>
                            </select>
                          </div>
                          <div className="space-y-1 pt-1 border-t border-zinc-900">
                            <label className="text-[7.5px] text-slate-400 font-bold block uppercase tracking-wider">MAP Severity Toggles</label>
                            <div className="grid grid-cols-2 gap-1 mt-0.5">
                              <button
                                type="button"
                                onClick={() => setMapSeverityFilters(prev => ({ ...prev, high: !prev.high }))}
                                className={`flex items-center gap-1 px-1 py-0.5 rounded border text-[8px] font-bold cursor-pointer transition ${
                                  mapSeverityFilters.high
                                    ? "bg-red-950/40 text-red-400 border-red-900/40"
                                    : "bg-zinc-900/40 text-slate-500 border-zinc-800/20 opacity-50"
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${mapSeverityFilters.high ? "bg-red-500 animate-pulse" : "bg-zinc-600"}`} />
                                High
                              </button>
                              <button
                                type="button"
                                onClick={() => setMapSeverityFilters(prev => ({ ...prev, medium: !prev.medium }))}
                                className={`flex items-center gap-1 px-1 py-0.5 rounded border text-[8px] font-bold cursor-pointer transition ${
                                  mapSeverityFilters.medium
                                    ? "bg-amber-950/40 text-amber-400 border-amber-900/40"
                                    : "bg-zinc-900/40 text-slate-500 border-zinc-800/20 opacity-50"
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${mapSeverityFilters.medium ? "bg-amber-500 animate-pulse" : "bg-zinc-600"}`} />
                                Med
                              </button>
                              <button
                                type="button"
                                onClick={() => setMapSeverityFilters(prev => ({ ...prev, low: !prev.low }))}
                                className={`flex items-center gap-1 px-1 py-0.5 rounded border text-[8px] font-bold cursor-pointer transition ${
                                  mapSeverityFilters.low
                                    ? "bg-orange-950/40 text-orange-400 border-orange-900/40"
                                    : "bg-zinc-900/40 text-slate-500 border-zinc-800/20 opacity-50"
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${mapSeverityFilters.low ? "bg-orange-500 animate-pulse" : "bg-zinc-600"}`} />
                                Low
                              </button>
                              <button
                                type="button"
                                onClick={() => setMapSeverityFilters(prev => ({ ...prev, compliant: !prev.compliant }))}
                                className={`flex items-center gap-1 px-1 py-0.5 rounded border text-[8px] font-bold cursor-pointer transition ${
                                  mapSeverityFilters.compliant
                                    ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/40"
                                    : "bg-zinc-900/40 text-slate-500 border-zinc-800/20 opacity-50"
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${mapSeverityFilters.compliant ? "bg-emerald-500" : "bg-zinc-600"}`} />
                                Comp
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Default active selected region helper overlay info bar when not hovering */}
                      {!hoveredRegion && (
                        <div className="absolute bottom-1 right-2 bg-zinc-905/90 border border-zinc-850 rounded px-2 py-1 text-[8px] font-mono text-slate-400 select-none backdrop-blur-md">
                          {(() => {
                            const activeRegionId = selectedGeoRegion || "us";
                            const regionsList = [
                              { id: "us", name: "United States" },
                              { id: "ca", name: "Canada" },
                              { id: "eu", name: "Europe" },
                              { id: "apac", name: "APAC" },
                              { id: "latam", name: "LATAM" },
                            ];
                            const regInfo = regionsList.find(r => r.id === activeRegionId);
                            if (!regInfo) return "Select region";
                            const violations = activeViolationsList.filter(v => getRegionForPartnerName(v.partner, v.domain) === regInfo.name);
                            const count = violations.length;
                            let compliance = 100;
                            if (count > 0) {
                              compliance = Math.max(65, 100 - (count * 5));
                            } else {
                              const seedMap: Record<string, number> = { "United States": 92, "Canada": 98, "Europe": 89, "APAC": 93, "LATAM": 97 };
                              compliance = seedMap[regInfo.name] || 95;
                            }
                            return (
                              <span className="flex items-center gap-1.5">
                                <span className="text-white font-bold">{regInfo.name}</span>: 
                                <span className="text-red-400 font-bold">{count} Alerts</span> | 
                                <span className="text-emerald-400">{compliance}% Compliance</span>
                              </span>
                            );
                          })()}
                        </div>
                      )}

                      {/* Premium Interactive Map Severity & Impact Legend Overlay (Schematic Fallback) */}
                      <div className="absolute bottom-2 left-2 bg-zinc-950/95 border border-zinc-800 rounded-lg p-2 text-[9px] font-mono text-slate-300 w-52 shadow-2xl backdrop-blur-md space-y-1.5 z-10 select-none">
                        <div className="flex flex-col gap-0.5 border-b border-zinc-850 pb-1 mb-1">
                          <div className="flex items-center gap-1.5 justify-between">
                            <span className="text-zinc-200 font-extrabold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                              MAP Violation Severity
                            </span>
                            <span className="text-[7px] font-bold text-slate-500 uppercase tracking-wider">Interactive</span>
                          </div>
                          <span className="text-[7.5px] text-zinc-500 font-sans">Click row to toggle map visibility</span>
                        </div>
                        <div className="space-y-1">
                          {/* High Severity Row */}
                          <div 
                            onClick={() => setMapSeverityFilters(prev => ({ ...prev, high: !prev.high }))}
                            className={`flex items-center justify-between gap-1.5 p-1 rounded hover:bg-zinc-900/60 cursor-pointer transition-all ${
                              mapSeverityFilters.high ? "opacity-100" : "opacity-45"
                            }`}
                            title="Toggle High Severity on map"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="relative flex h-2 w-2">
                                {mapSeverityFilters.high && (
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                )}
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${mapSeverityFilters.high ? "bg-red-600" : "bg-zinc-650"}`}></span>
                              </span>
                              <span className={`font-bold ${mapSeverityFilters.high ? "text-red-400" : "text-slate-500 line-through"}`}>High Severity</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">&gt;50% rate</span>
                              <span className={`px-1 py-0.2 rounded text-[7.5px] font-bold border ${
                                mapSeverityFilters.high 
                                  ? "bg-red-950/50 text-red-400 border-red-900/20" 
                                  : "bg-zinc-900/40 text-slate-500 border-zinc-800/40"
                              }`}>
                                {(() => {
                                  const count = partnerHeatPoints.filter(point => {
                                    if (getSeverityOfPoint(point) !== "high") return false;
                                    if (mapRegionFilter !== "all" && getRegionForPartnerName(point.partner.name, point.partner.domain) !== mapRegionFilter) return false;
                                    if (mapCategoryFilter !== "all") {
                                      const partnerProductIds = point.partner.associatedProducts || [];
                                      const hasProduct = partnerProductIds.some((pId: string) => getProductCategory(pId) === mapCategoryFilter);
                                      if (!hasProduct) return false;
                                    }
                                    return true;
                                  }).length;
                                  return mapSeverityFilters.high ? `${count} ON` : "OFF";
                                })()}
                              </span>
                            </div>
                          </div>

                          {/* Medium Severity Row */}
                          <div 
                            onClick={() => setMapSeverityFilters(prev => ({ ...prev, medium: !prev.medium }))}
                            className={`flex items-center justify-between gap-1.5 p-1 rounded hover:bg-zinc-900/60 cursor-pointer transition-all ${
                              mapSeverityFilters.medium ? "opacity-100" : "opacity-45"
                            }`}
                            title="Toggle Medium Severity on map"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="relative flex h-2 w-2">
                                {mapSeverityFilters.medium && (
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-40"></span>
                                )}
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${mapSeverityFilters.medium ? "bg-amber-500" : "bg-zinc-650"}`}></span>
                              </span>
                              <span className={`font-bold ${mapSeverityFilters.medium ? "text-amber-400" : "text-slate-500 line-through"}`}>Medium Severity</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">25%-50%</span>
                              <span className={`px-1 py-0.2 rounded text-[7.5px] font-bold border ${
                                mapSeverityFilters.medium 
                                  ? "bg-amber-950/50 text-amber-400 border-amber-900/20" 
                                  : "bg-zinc-900/40 text-slate-500 border-zinc-800/40"
                              }`}>
                                {(() => {
                                  const count = partnerHeatPoints.filter(point => {
                                    if (getSeverityOfPoint(point) !== "medium") return false;
                                    if (mapRegionFilter !== "all" && getRegionForPartnerName(point.partner.name, point.partner.domain) !== mapRegionFilter) return false;
                                    if (mapCategoryFilter !== "all") {
                                      const partnerProductIds = point.partner.associatedProducts || [];
                                      const hasProduct = partnerProductIds.some((pId: string) => getProductCategory(pId) === mapCategoryFilter);
                                      if (!hasProduct) return false;
                                    }
                                    return true;
                                  }).length;
                                  return mapSeverityFilters.medium ? `${count} ON` : "OFF";
                                })()}
                              </span>
                            </div>
                          </div>

                          {/* Low Severity Row */}
                          <div 
                            onClick={() => setMapSeverityFilters(prev => ({ ...prev, low: !prev.low }))}
                            className={`flex items-center justify-between gap-1.5 p-1 rounded hover:bg-zinc-900/60 cursor-pointer transition-all ${
                              mapSeverityFilters.low ? "opacity-100" : "opacity-45"
                            }`}
                            title="Toggle Low Severity on map"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="relative flex h-2 w-2">
                                {mapSeverityFilters.low && (
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-350 opacity-40"></span>
                                )}
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${mapSeverityFilters.low ? "bg-orange-400" : "bg-zinc-650"}`}></span>
                              </span>
                              <span className={`font-bold ${mapSeverityFilters.low ? "text-orange-400" : "text-slate-500 line-through"}`}>Low Severity</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">&lt;25% rate</span>
                              <span className={`px-1 py-0.2 rounded text-[7.5px] font-bold border ${
                                mapSeverityFilters.low 
                                  ? "bg-orange-950/50 text-orange-400 border-orange-900/20" 
                                  : "bg-zinc-900/40 text-slate-500 border-zinc-800/40"
                              }`}>
                                {(() => {
                                  const count = partnerHeatPoints.filter(point => {
                                    if (getSeverityOfPoint(point) !== "low") return false;
                                    if (mapRegionFilter !== "all" && getRegionForPartnerName(point.partner.name, point.partner.domain) !== mapRegionFilter) return false;
                                    if (mapCategoryFilter !== "all") {
                                      const partnerProductIds = point.partner.associatedProducts || [];
                                      const hasProduct = partnerProductIds.some((pId: string) => getProductCategory(pId) === mapCategoryFilter);
                                      if (!hasProduct) return false;
                                    }
                                    return true;
                                  }).length;
                                  return mapSeverityFilters.low ? `${count} ON` : "OFF";
                                })()}
                              </span>
                            </div>
                          </div>

                          {/* Fully Compliant Row */}
                          <div 
                            onClick={() => setMapSeverityFilters(prev => ({ ...prev, compliant: !prev.compliant }))}
                            className={`flex items-center justify-between gap-1.5 p-1 rounded hover:bg-zinc-900/60 cursor-pointer transition-all ${
                              mapSeverityFilters.compliant ? "opacity-100" : "opacity-45"
                            }`}
                            title="Toggle Compliant resellers on map"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="relative flex h-2 w-2">
                                {mapSeverityFilters.compliant && (
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40"></span>
                                )}
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${mapSeverityFilters.compliant ? "bg-emerald-500" : "bg-zinc-650"}`}></span>
                              </span>
                              <span className={`font-bold ${mapSeverityFilters.compliant ? "text-emerald-400" : "text-slate-500 line-through"}`}>Compliant</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400 font-sans text-[8px]">0% violations</span>
                              <span className={`px-1 py-0.2 rounded text-[7.5px] font-bold border ${
                                mapSeverityFilters.compliant 
                                  ? "bg-emerald-950/50 text-emerald-400 border-emerald-900/20" 
                                  : "bg-zinc-900/40 text-slate-500 border-zinc-800/40"
                              }`}>
                                {(() => {
                                  const count = partnerHeatPoints.filter(point => {
                                    if (getSeverityOfPoint(point) !== "compliant") return false;
                                    if (mapRegionFilter !== "all" && getRegionForPartnerName(point.partner.name, point.partner.domain) !== mapRegionFilter) return false;
                                    if (mapCategoryFilter !== "all") {
                                      const partnerProductIds = point.partner.associatedProducts || [];
                                      const hasProduct = partnerProductIds.some((pId: string) => getProductCategory(pId) === mapCategoryFilter);
                                      if (!hasProduct) return false;
                                    }
                                    return true;
                                  }).length;
                                  return mapSeverityFilters.compliant ? `${count} ON` : "OFF";
                                })()}
                              </span>
                            </div>
                          </div>

                          {/* Historical High-Risk Zone Row */}
                          <div 
                            onClick={() => setShowHistoricalOverlay(prev => !prev)}
                            className={`flex items-center justify-between gap-1.5 p-1 rounded hover:bg-zinc-900/60 transition-colors border-t border-zinc-900/40 mt-1 pt-1.5 cursor-pointer ${
                              showHistoricalOverlay ? "opacity-100" : "opacity-45"
                            }`}
                            title="Toggle Historical Risk Zones on map"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="relative flex h-2 w-2">
                                {showHistoricalOverlay && (
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
                                )}
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${showHistoricalOverlay ? "bg-fuchsia-500 shadow-[0_0_6px_#d946ef]" : "bg-zinc-700"}`}></span>
                              </span>
                              <span className={`font-bold ${showHistoricalOverlay ? "text-fuchsia-400" : "text-slate-500"}`}>Historical Risk Zone</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">rate &ge; 30%</span>
                              <span className={`px-1 py-0.2 rounded text-[7.5px] font-bold border ${
                                showHistoricalOverlay 
                                  ? "bg-fuchsia-950/50 text-fuchsia-400 border-fuchsia-900/20 shadow-[0_0_5px_rgba(217,70,239,0.1)]" 
                                  : "bg-zinc-900/40 text-slate-500 border-zinc-800/40"
                              }`}>
                                {(() => {
                                  const count = partnerHeatPoints.filter(point => {
                                    const isHighRisk = (point.frequencyRate >= 30 && point.violatingScansWithPartner >= 1) || (point.violatingScansWithPartner >= 2);
                                    if (!isHighRisk) return false;
                                    if (mapRegionFilter !== "all" && getRegionForPartnerName(point.partner.name, point.partner.domain) !== mapRegionFilter) return false;
                                    if (mapCategoryFilter !== "all") {
                                      const partnerProductIds = point.partner.associatedProducts || [];
                                      const hasProduct = partnerProductIds.some((pId: string) => getProductCategory(pId) === mapCategoryFilter);
                                      if (!hasProduct) return false;
                                    }
                                    return true;
                                  }).length;
                                  return showHistoricalOverlay ? `${count} ON` : "OFF";
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Time-Series Forecasting Overlay panel */}
                {(() => {
                  const activeRegionId = hoveredRegion || selectedGeoRegion || "us";
                  const regionIdToName: Record<string, string> = {
                    us: "United States",
                    ca: "Canada",
                    eu: "Europe",
                    apac: "APAC",
                    latam: "LATAM"
                  };
                  const activeRegionName = regionIdToName[activeRegionId] || "United States";
                  const { chartData, slope } = getRegionHistoryAndForecast(activeRegionName);

                  const recommendations: Record<string, string> = {
                    "United States": "Action: Expand multi-variant monitoring on Amazon Marketplace resellers.",
                    "Canada": "Action: Standardize regional policies with authorized partners.",
                    "Europe": "Action: Institute daily enforcement routines due to rising grey-market leaks.",
                    "APAC": "Action: Implement localized pricing audits across electronic boutiques.",
                    "LATAM": "Action: Continue low-level sweep checks. High-compliance baseline maintained."
                  };

                  return (
                    <div className="bg-zinc-950/95 border border-zinc-900 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-wider font-semibold block">Time-Series Forecast Overlay</span>
                          <span className="text-xs font-bold text-white block">Region: {activeRegionName}</span>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            slope > 0.1 
                              ? 'text-rose-400 bg-rose-955 border border-rose-900/40 animate-pulse' 
                              : slope < -0.1 
                                ? 'text-emerald-400 bg-emerald-955 border border-emerald-900/40' 
                                : 'text-slate-400 bg-zinc-900 border border-zinc-800'
                          }`}>
                            {slope > 0.1 ? '↑ Rising Risk' : slope < -0.1 ? '↓ Declining Risk' : '→ Stable'}
                          </span>
                        </div>
                      </div>

                      {/* Forecasting Line Chart */}
                      <div className="h-28 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -32, bottom: 0 }}>
                            <CartesianGrid stroke="#18181b" strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                              dataKey="name" 
                              stroke="#52525b" 
                              fontSize={8} 
                              tickLine={false} 
                              axisLine={false}
                            />
                            <YAxis 
                              stroke="#52525b" 
                              fontSize={8} 
                              tickLine={false} 
                              axisLine={false}
                              allowDecimals={false}
                            />
                            <Tooltip
                              contentStyle={{ background: "#09090b", borderColor: "#18181b", borderRadius: "6px", fontSize: "10px" }}
                              labelStyle={{ color: "#a1a1aa", fontWeight: "bold" }}
                              itemStyle={{ color: "#f4f4f5" }}
                            />
                            {/* Solid Historical Line */}
                            <Line 
                              type="monotone" 
                              dataKey="violations" 
                              name="Violations (Hist)" 
                              stroke="#6366f1" 
                              strokeWidth={2} 
                              dot={{ r: 2, stroke: "#6366f1", strokeWidth: 1 }}
                              activeDot={{ r: 4 }}
                              connectNulls
                            />
                            {/* Dashed Forecast Line */}
                            <Line 
                              type="monotone" 
                              dataKey="forecast" 
                              name="Forecast (Proj)" 
                              stroke="#f43f5e" 
                              strokeWidth={2} 
                              strokeDasharray="4 4"
                              dot={{ r: 2, stroke: "#f43f5e", strokeWidth: 1 }}
                              activeDot={{ r: 4 }}
                              connectNulls
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="p-1.5 bg-zinc-900/30 rounded border border-zinc-900/50 flex flex-col gap-0.5">
                        <span className="text-[8.5px] font-mono text-indigo-400 font-semibold uppercase tracking-tight block">Targeted Enforcement Strategy</span>
                        <p className="text-[9px] text-slate-300 font-sans leading-tight">
                          {recommendations[activeRegionName] || "Action: Evaluate dealer listings for anomalies."}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Regions Breakdown stats list */}
                <div className="space-y-3 pt-1 border-t border-zinc-900">
                  {(() => {
                    const regionsList = [
                      { id: "us", name: "United States" },
                      { id: "ca", name: "Canada" },
                      { id: "eu", name: "Europe" },
                      { id: "apac", name: "APAC" },
                      { id: "latam", name: "LATAM" },
                    ];

                    return regionsList.map((region, idx) => {
                      const violations = activeViolationsList.filter(v => getRegionForPartnerName(v.partner, v.domain) === region.name);
                      const count = violations.length;
                      let compliance = 100;
                      if (count > 0) {
                        compliance = Math.max(65, 100 - (count * 5));
                      } else {
                        const seedMap: Record<string, number> = { "United States": 92, "Canada": 98, "Europe": 89, "APAC": 93, "LATAM": 97 };
                        compliance = seedMap[region.name] || 95;
                      }
                      const activeRegionId = hoveredRegion || selectedGeoRegion || "us";
                      const isSelected = activeRegionId === region.id;

                      return (
                        <div 
                          key={idx} 
                          className={`space-y-1 transition p-2 rounded-lg cursor-pointer ${
                            isSelected ? 'bg-zinc-900/60 border border-zinc-800' : 'border border-transparent hover:bg-zinc-950/40'
                          }`}
                          onClick={() => setSelectedGeoRegion(region.id)}
                          onMouseEnter={() => setHoveredRegion(region.id)}
                          onMouseLeave={() => setHoveredRegion(null)}
                        >
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-400 flex items-center gap-1.5">
                              <MapPin className={`w-3.5 h-3.5 ${count > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
                              {region.name}
                            </span>
                            <span className="text-slate-300 font-bold">
                              {compliance}% <span className="text-[10px] text-slate-500 font-normal">({count} breaches)</span>
                            </span>
                          </div>
                          <div className="w-full bg-zinc-800/60 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-500 ${compliance >= 95 ? 'bg-emerald-500' : compliance >= 85 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${compliance}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            );
          })()}

            {/* TAB CONTENT: Partner Categories Heatmap */}
            {heatmapTab === 'categories' && (
              <div className="space-y-3.5 animate-fade-in">
                <div className="space-y-2.5">
                  {(() => {
                    const categoriesList = [
                      { name: "Online Marketplaces", desc: "Third-party broad platforms", color: "bg-indigo-500" },
                      { name: "Big Box Retailers", desc: "Department stores & chains", color: "bg-sky-500" },
                      { name: "Specialty Electronics", desc: "Niche consumer tech outlets", color: "bg-emerald-500" },
                      { name: "Liquidation Sites", desc: "Unauthorized surplus outlets", color: "bg-rose-500" },
                      { name: "Authorized Distributors", desc: "Wholesale & direct distributors", color: "bg-amber-500" },
                    ];

                    return categoriesList.map((cat, idx) => {
                      const violations = activeViolationsList.filter(v => getCategoryForPartnerName(v.partner, v.domain) === cat.name);
                      const count = violations.length;
                      const totalV = activeViolationsList.length || 1;
                      const sharePercent = Math.max(10, Math.round((count / totalV) * 100));
                      
                      let riskLevel = "Minor";
                      let riskColor = "text-emerald-400 bg-emerald-950/40 border-emerald-900/40";
                      if (count > 5 || sharePercent > 35) {
                        riskLevel = "Critical";
                        riskColor = "text-rose-400 bg-rose-950/40 border-rose-900/40 animate-pulse";
                      } else if (count > 2 || sharePercent > 20) {
                        riskLevel = "Elevated";
                        riskColor = "text-amber-400 bg-amber-950/40 border-amber-900/40";
                      } else if (count > 0) {
                        riskLevel = "Moderate";
                        riskColor = "text-indigo-400 bg-indigo-950/40 border-indigo-900/40";
                      }

                      const isHovered = hoveredCategory === cat.name;

                      return (
                        <div 
                          key={idx}
                          onMouseEnter={() => setHoveredCategory(cat.name)}
                          onMouseLeave={() => setHoveredCategory(null)}
                          className={`p-2 bg-zinc-950/40 border rounded-xl flex flex-col gap-1.5 transition-all duration-200 ${
                            isHovered 
                              ? "border-indigo-800 bg-indigo-950/10 shadow-sm" 
                              : "border-zinc-850/80 border-zinc-805"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-0.5">
                              <span className="text-xs font-semibold text-slate-200 block font-sans leading-tight">
                                {cat.name}
                              </span>
                              <span className="text-[8.5px] text-slate-400 font-sans block leading-none">
                                {cat.desc}
                              </span>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold uppercase tracking-wider border ${riskColor}`}>
                              {riskLevel}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3 text-xs font-mono">
                            <div className="flex-1 bg-zinc-900 rounded-full h-1 overflow-hidden">
                              <div 
                                className={`${cat.color} h-1 rounded-full transition-all duration-500`}
                                style={{ width: `${sharePercent}%` }}
                              />
                            </div>
                            <span className="text-slate-300 font-bold font-mono text-[10px] shrink-0">
                              {count} alerts ({sharePercent}%)
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Ecosystem Channels (Original Content) */}
            {heatmapTab === 'channels' && (
              <div className="space-y-5 animate-fade-in">
                {channelStats.map((channel, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">{channel.name}</span>
                      <span className="text-slate-200 font-bold">{channel.percent}%</span>
                    </div>
                    <div className="w-full bg-zinc-805 bg-zinc-800/80 rounded-full h-2 overflow-hidden animate-pulse">
                      <div 
                        className={`${channel.color} h-2 rounded-full transition-all duration-505`} 
                        style={{ width: `${channel.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-zinc-800 flex items-center justify-between font-mono">
            <div className="text-center flex-1">
              <div className="text-xl font-bold text-white">1,042</div>
              <div className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">Scans/Min</div>
            </div>
            <div className="w-px h-8 bg-zinc-800"></div>
            <div className="text-center flex-1">
              <div className="text-xl font-bold text-white">4.2s</div>
              <div className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">Avg Latency</div>
            </div>
          </div>
        </div>

      </div>

      {/* Compliance Audit Log Panel */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden" id="compliance-audit-log-panel">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/5 rounded-full filter blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-violet-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-violet-400" />
                SYSTEM OPERATIONS AUDIT TRAIL
              </span>
              <span className="text-[9px] bg-violet-950/40 border border-violet-900/40 text-violet-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">SECURE LEDGER</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white font-display">
              Compliance Audit Log
            </h2>
            <p className="text-xs text-slate-400">
              A historical, chronological roster of manual tag toggles, internal note updates, legal routing entries, and partner violation flags.
            </p>
          </div>
          
          <button
            type="button"
            onClick={fetchLogs}
            disabled={isLoadingLogs}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold font-mono uppercase tracking-wider border border-zinc-800 hover:border-zinc-750 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
            {isLoadingLogs ? "Syncing ledger..." : "Sync Audit Trail"}
          </button>
        </div>

        {/* Filters and Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-zinc-500" />
            </span>
            <input
              type="text"
              placeholder="Search by message, SKU, user or metadata details..."
              value={logsSearchQuery}
              onChange={(e) => setLogsSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-3 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-sans"
            />
            {logsSearchQuery && (
              <button 
                type="button" 
                onClick={() => setLogsSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[10px] font-mono text-zinc-500 shrink-0 uppercase tracking-wider">Filter Type:</span>
            <select
              value={logsTypeFilter}
              onChange={(e) => setLogsTypeFilter(e.target.value)}
              className="bg-zinc-950/80 border border-zinc-800 text-xs rounded-xl px-3 py-2.5 text-slate-300 focus:outline-none focus:border-violet-500 transition cursor-pointer w-full sm:w-48 font-semibold font-mono"
            >
              <option value="all">All Operations</option>
              <option value="legal_flag">⚖️ Legal Flags</option>
              <option value="tag_change">🏷️ Tag Modifications</option>
              <option value="notes_update">📝 Note Additions</option>
              <option value="priority_override">⚡ Priority Overrides</option>
              <option value="compliance_update">🛡️ Compliance Audits</option>
              <option value="price_change">💵 Price/MAP Updates</option>
              <option value="registry">📦 Registry Changes</option>
            </select>
          </div>
        </div>

        {/* Audit Log Timeline */}
        <div className="border border-zinc-850 rounded-2xl bg-zinc-950/40 divide-y divide-zinc-900 overflow-hidden">
          {(() => {
            const filteredLogs = auditLogs.filter(log => {
              // 1. Filter by Log Type
              if (logsTypeFilter !== "all" && log.type !== logsTypeFilter) return false;
              
              // 2. Filter by Search Query
              if (logsSearchQuery.trim()) {
                const q = logsSearchQuery.toLowerCase();
                const textToSearch = `${log.message || ""} ${log.details || ""} ${log.sku || ""} ${log.user || ""} ${log.type || ""}`.toLowerCase();
                if (!textToSearch.includes(q)) return false;
              }
              return true;
            });

            if (filteredLogs.length === 0) {
              return (
                <div className="p-16 text-center text-zinc-500 space-y-4">
                  <ClipboardList className="w-12 h-12 text-zinc-700 mx-auto" strokeWidth={1.5} />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-zinc-450">No matching audit logs found</h3>
                    <p className="text-zinc-500 max-w-md mx-auto text-xs leading-relaxed">
                      Try broadening your search query or choosing another action filter above. All system operations are maintained securely.
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div className="divide-y divide-zinc-900/65 max-h-[500px] overflow-y-auto custom-scrollbar">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  
                  // Style configurations based on log type
                  const typeConfigs: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
                    legal_flag: {
                      label: "Legal Flag",
                      badge: "bg-violet-950/50 text-violet-300 border-violet-900/50",
                      icon: <ShieldAlert className="w-4 h-4 text-violet-400" />
                    },
                    tag_change: {
                      label: "Tag Modified",
                      badge: "bg-pink-950/50 text-pink-300 border-pink-900/50",
                      icon: <Tag className="w-4 h-4 text-pink-400" />
                    },
                    notes_update: {
                      label: "Note Update",
                      badge: "bg-amber-950/50 text-amber-300 border-amber-900/50",
                      icon: <FileText className="w-4 h-4 text-amber-400" />
                    },
                    priority_override: {
                      label: "Priority Override",
                      badge: "bg-rose-950/50 text-rose-300 border-rose-900/50",
                      icon: <AlertTriangle className="w-4 h-4 text-rose-400" />
                    },
                    compliance_update: {
                      label: "Compliance Scan",
                      badge: "bg-emerald-950/50 text-emerald-300 border-emerald-900/50",
                      icon: <Shield className="w-4 h-4 text-emerald-400" />
                    },
                    price_change: {
                      label: "MAP Rule Change",
                      badge: "bg-sky-950/50 text-sky-300 border-sky-900/50",
                      icon: <DollarSign className="w-4 h-4 text-sky-400" />
                    },
                    registry: {
                      label: "Registry Update",
                      badge: "bg-indigo-950/50 text-indigo-300 border-indigo-900/50",
                      icon: <Package2 className="w-4 h-4 text-indigo-400" />
                    }
                  };

                  const config = typeConfigs[log.type] || {
                    label: "System Log",
                    badge: "bg-zinc-900 text-zinc-400 border-zinc-800",
                    icon: <Activity className="w-4 h-4 text-zinc-400" />
                  };

                  return (
                    <div key={log.id} className="transition-all hover:bg-zinc-900/30">
                      {/* Log Row Header */}
                      <div 
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <span className="p-2 rounded-lg bg-zinc-900 border border-zinc-850 mt-0.5 sm:mt-0 shrink-0">
                            {config.icon}
                          </span>
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono border uppercase tracking-wider ${config.badge}`}>
                                {config.label}
                              </span>
                              {log.sku && (
                                <span className="text-[10px] font-mono text-violet-400 font-bold bg-violet-950/20 border border-violet-900/30 px-1.5 py-0.5 rounded">
                                  SKU: {log.sku}
                                </span>
                              )}
                              <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
                                <User className="w-3.5 h-3.5" />
                                {log.user || "System Operations Admin"}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-200 font-sans leading-relaxed">{log.message}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <div className="text-right space-y-0.5">
                            <span className="text-[10px] font-mono text-zinc-400 font-bold block flex items-center justify-end gap-1">
                              <Clock className="w-3.5 h-3.5 text-zinc-500" />
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                            <span className="text-[9px] font-mono text-zinc-600 block">ID: {log.id}</span>
                          </div>
                          
                          <span className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded-lg transition-colors">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </span>
                        </div>
                      </div>

                      {/* Log Row Details (Expanded) */}
                      {isExpanded && (
                        <div className="px-14 pb-4 pt-1 border-t border-zinc-900/60 bg-zinc-950/80 space-y-3 font-sans text-xs text-zinc-400">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Metadata Details</span>
                              <p className="bg-zinc-900/40 p-2.5 border border-zinc-850 rounded-xl leading-relaxed text-[11px] font-mono select-text whitespace-pre-wrap break-all">
                                {log.details || log.message || "No expanded metadata available."}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                                <div>
                                  <span className="text-zinc-500 block">Operation Timestamp</span>
                                  <span className="text-zinc-300 font-bold">{new Date(log.timestamp).toUTCString()}</span>
                                </div>
                                <div>
                                  <span className="text-zinc-500 block">Action ID</span>
                                  <span className="text-zinc-300 font-bold">{log.id}</span>
                                </div>
                                <div>
                                  <span className="text-zinc-500 block">Responsible User</span>
                                  <span className="text-zinc-300 font-bold">{log.user || "System Operations Admin"}</span>
                                </div>
                                <div>
                                  <span className="text-zinc-500 block">Product ID Reference</span>
                                  <span className="text-zinc-300 font-semibold">{log.productId || "None"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* AI Summarized Insights & Strategies Section */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl relative overflow-hidden">
        {/* Background Glow ornaments */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/5 rounded-full filter blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                INTELLIGENT INTEGRITY ENGINE
              </span>
              <span className="text-[9px] bg-indigo-950/40 border border-indigo-900/40 text-indigo-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">AI INSIGHTS</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white font-display">
              Compliance Insights & Enforcement Strategies
            </h2>
            <p className="text-xs text-slate-400">
              Summarizing top MAP trends from the last 30 days with automated, high-fidelity enforcement playbooks.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleFetchInsights(true)}
            disabled={isGeneratingInsights}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingInsights ? 'animate-spin' : ''}`} />
            {isGeneratingInsights ? "Analyzing Data..." : "Regenerate insights"}
          </button>
        </div>

        {isGeneratingInsights && !insights ? (
          <div className="py-16 text-center space-y-4">
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-zinc-800" />
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-bold">Querying Gemini Intelligence...</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Aggregating active catalog SKU lists, authorized partner compliance history, and latest pricing scan indexes to generate high-fidelity trend vectors.
              </p>
            </div>
          </div>
        ) : insightsError ? (
          <div className="p-6 bg-rose-950/10 border border-rose-900/30 rounded-2xl text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-200">Failed to Generate Compliance Insights</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {insightsError}. Please check your connection or try again.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleFetchInsights(true)}
              className="px-4 py-2 bg-rose-950/40 hover:bg-rose-950/60 text-rose-300 border border-rose-900/40 rounded-xl text-xs font-bold font-mono uppercase"
            >
              Retry Analysis
            </button>
          </div>
        ) : insights ? (
          <div className="space-y-8 animate-fade-in">
            {/* High-Level Overview Box */}
            <div className="p-5 bg-gradient-to-r from-indigo-950/20 to-zinc-950 border border-indigo-900/30 rounded-2xl space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-[0.03] pointer-events-none">
                <Shield className="w-24 h-24 text-indigo-400" />
              </div>
              <span className="text-[9.5px] font-mono text-indigo-400 uppercase tracking-widest font-bold bg-indigo-950/60 border border-indigo-900/30 px-2 py-0.5 rounded-full inline-block">
                30-Day Executive Summary
              </span>
              <p className="text-sm text-slate-200 leading-relaxed font-sans font-medium">
                {insights.summary}
              </p>
            </div>

            {/* Main Content Layout Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              
              {/* Left Side: Observed Trends & High-Risk Categories */}
              <div className="space-y-6">
                
                {/* 30-Day Compliance Trends */}
                <div className="space-y-4">
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    Observed Market Compliance Trends
                  </h3>
                  <div className="space-y-3">
                    {insights.trends.map((trend, idx) => (
                      <div key={idx} className="p-3.5 bg-zinc-950/40 border border-zinc-850/60 rounded-xl flex items-start gap-3 transition hover:border-zinc-800">
                        <span className="w-5 h-5 rounded-full bg-indigo-950/40 border border-indigo-900/30 text-[10.5px] font-mono font-bold text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {trend}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk Category Matrix */}
                <div className="space-y-4">
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4 text-rose-400" />
                    Retail Category Risk Profile Matrix
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {insights.highRiskCategories.map((cat, idx) => {
                      let scoreColor = "text-emerald-400 bg-emerald-950/30 border-emerald-900/30";
                      let barColor = "bg-emerald-500";
                      if (cat.riskScore >= 75) {
                        scoreColor = "text-rose-400 bg-rose-950/30 border-rose-900/30";
                        barColor = "bg-rose-500";
                      } else if (cat.riskScore >= 45) {
                        scoreColor = "text-amber-400 bg-amber-950/30 border-amber-900/30";
                        barColor = "bg-amber-500";
                      }

                      return (
                        <div key={idx} className="p-4 bg-zinc-950/40 border border-zinc-850/60 rounded-xl space-y-3 transition hover:border-zinc-800">
                          <div className="flex justify-between items-start">
                            <div className="space-y-0.5">
                              <span className="text-xs font-semibold text-slate-200 block truncate max-w-[130px]" title={cat.categoryName}>
                                {cat.categoryName}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono block">
                                {cat.violationCount} Active Alert{cat.violationCount === 1 ? "" : "s"}
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${scoreColor}`}>
                              {cat.riskScore}% Risk
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                              <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${cat.riskScore}%` }} />
                            </div>
                            <p className="text-[10px] text-slate-400 leading-snug">
                              {cat.reason}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Right Side: Actionable Enforcement Strategies */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                  Suggested Unilateral Enforcement Strategies
                </h3>
                <div className="space-y-3">
                  {insights.actionableStrategies.map((strat, idx) => {
                    let urgencyColor = "text-emerald-400 bg-emerald-950/40 border-emerald-900/40";
                    if (strat.urgency.toLowerCase() === "high") {
                      urgencyColor = "text-rose-400 bg-rose-950/40 border-rose-900/40";
                    } else if (strat.urgency.toLowerCase() === "medium") {
                      urgencyColor = "text-amber-400 bg-amber-950/40 border-amber-900/40";
                    }

                    return (
                      <div key={idx} className="p-4 bg-zinc-950/30 hover:bg-zinc-950/60 border border-zinc-850 rounded-xl space-y-3 transition group">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {strat.title}
                          </h4>
                          <div className="flex gap-1.5 shrink-0">
                            <span className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold uppercase tracking-wider bg-zinc-900 text-slate-400 border border-zinc-800">
                              {strat.targetCategory}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold uppercase tracking-wider border ${urgencyColor}`}>
                              {strat.urgency} Priority
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-sans">
                          {strat.actionStep}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="py-12 text-center space-y-4 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20">
            <Radio className="w-10 h-10 text-indigo-400/50 mx-auto animate-pulse" />
            <div className="space-y-1">
              <h3 className="text-xs font-mono text-slate-300 font-bold uppercase">Ready to compile strategic analysis</h3>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                No insights are staged in the memory buffer. Click 'Regenerate insights' to audit compliance data.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleFetchInsights(true)}
              className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-mono text-xs font-bold uppercase rounded-lg border border-indigo-550 cursor-pointer"
            >
              Analyze Catalog Compliance
            </button>
          </div>
        )}
      </div>

      {/* Historical Price Tracking & Dynamic Alerts Bento Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left Column: Historical Price Trend indexer */}
        <div className="lg:col-span-3 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none">
            <TrendingUp className="w-32 h-32 text-indigo-400 font-bold" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-indigo-400" />
                  Historical price trends
                </span>
                <span className="text-[9px] bg-indigo-950/40 border border-indigo-900/40 text-indigo-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase">RETAINING CONTINUOUS INDEX</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white font-display">
                Infraction Frequency Explorer
              </h2>
            </div>

            {/* SKU Selector Dropdown */}
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">TARGET SKU:</span>
              <select
                value={selectedSkuTrend}
                onChange={e => setSelectedSkuTrend(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-xs font-semibold rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id} className="bg-zinc-950 text-white">{p.name.substring(0, 20)}...</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sku Trend Stats Row */}
          {(() => {
            const fallbackTrendProduct: Product = {
              id: "1",
              name: "Apex Pro Sound System",
              sku: "APX-900",
              mapPrice: 299.99,
              description: "Reference audio monitoring system"
            };
            const currentTrendProduct = products.find(p => p.id === selectedSkuTrend) || products[0] || fallbackTrendProduct;
            const matchingScans = scans.filter(s => s.productId === selectedSkuTrend);
            const scanCount = matchingScans.length || 3;
            const violations = matchingScans.filter(s => s.items.some((i: any) => i.status === "violating")).length || 1;
            const infractionRate = Math.round((violations / scanCount) * 100);
            
            return (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1 w-full">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Monitored Audits</span>
                    <span className="text-xl font-bold text-white font-display">{scanCount} runs</span>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1 w-full">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Violation Frequency</span>
                    <span className="text-xl font-bold text-red-400 font-display">{infractionRate}%</span>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1 w-full">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Established MAP Floor</span>
                    <span className="text-xl font-bold text-emerald-450 text-emerald-400 font-display">${(currentTrendProduct?.mapPrice ?? 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* 30-Day interactive Line Chart displaying price violation trends */}
                <div className="space-y-4 bg-zinc-950/40 p-5 rounded-xl border border-zinc-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block font-bold">
                        30-Day Shield Timeline
                      </span>
                      <p className="text-[10px] text-slate-400 font-sans leading-tight">
                        Displaying continuous historical infraction activity and shield coverage for {currentTrendProduct?.name || "Target SKU"}
                      </p>
                    </div>

                    {/* Metric Select Buttons */}
                    <div className="flex bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg shrink-0 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setChartMetric('violations')}
                        className={`px-2.5 py-1 text-[9px] font-mono font-bold uppercase rounded-md transition cursor-pointer ${
                          chartMetric === 'violations'
                            ? 'bg-rose-950/40 text-rose-455 text-rose-400 border border-red-900/40 font-extrabold'
                            : 'text-slate-400 hover:text-white font-medium'
                        }`}
                      >
                        Violations Count
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartMetric('compliance')}
                        className={`px-2.5 py-1 text-[9px] font-mono font-bold uppercase rounded-md transition cursor-pointer ${
                          chartMetric === 'compliance'
                            ? 'bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 font-extrabold'
                            : 'text-slate-400 hover:text-white font-medium'
                        }`}
                      >
                        Compliance %
                      </button>
                    </div>
                  </div>

                  {/* Recharts Container */}
                  <div className="h-56 w-full font-mono text-xs select-none pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={generateTrendData(currentTrendProduct?.id || "1")}
                        margin={{ top: 10, right: 15, left: -25, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#737373" 
                          tickLine={false} 
                          axisLine={false}
                          tick={{ fontSize: 9, fill: "#a3a3a3" }}
                          dy={10}
                        />
                        <YAxis 
                          stroke="#737373" 
                          tickLine={false} 
                          axisLine={false}
                          tick={{ fontSize: 9, fill: "#a3a3a3" }}
                          domain={chartMetric === 'violations' ? [0, 'auto'] : [0, 100]}
                          tickFormatter={(val) => chartMetric === 'compliance' ? `${val}%` : val}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#171717',
                            border: '1px solid #262626',
                            borderRadius: '12px',
                            padding: '10px 14px',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.5)'
                          }}
                          labelStyle={{ color: '#a3a3a3', fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace', marginBottom: '4px' }}
                          itemStyle={{ fontSize: '11px', color: chartMetric === 'violations' ? '#ef4444' : '#10b981', fontFamily: 'sans-serif', padding: '2px 0' }}
                          formatter={(value: any) => [
                            chartMetric === 'violations' ? `${value} Breaches` : `${value}% Compliant`,
                            chartMetric === 'violations' ? 'MAP Violations' : 'Compliance Rate'
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey={chartMetric}
                          name={chartMetric === 'violations' ? "Violations" : "Compliance Rate (%)"}
                          stroke={chartMetric === 'violations' ? "#ef4444" : "#10b981"}
                          strokeWidth={2.5}
                          dot={{ r: 3, strokeWidth: 1.5, fill: '#171717', stroke: chartMetric === 'violations' ? "#ef4444" : "#10b981" }}
                          activeDot={{ r: 5, strokeWidth: 1.5 }}
                          label={<CustomPeakLabel trendData={generateTrendData(currentTrendProduct?.id || "1")} chartMetric={chartMetric} />}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Visual Breach Timeline mapping out violation history with First Infraction vs Recurring Breach */}
                <SkuBreachTimeline 
                  product={currentTrendProduct} 
                  scans={scans} 
                  partners={partners} 
                  className="mt-4"
                />
              </div>
            );
          })()}
        </div>

        {/* Right Column: Dynamic Alert System & suspicious activity alerts */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Action Panel 1: Notification Gateway */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-6 sm:p-7 space-y-4 shadow-sm">
            <div className="space-y-1">
              <h3 className="font-bold font-display text-white text-base flex items-center gap-1.5">
                <BellRing className="w-4 h-4 text-purple-400" />
                Dynamic Alert System
              </h3>
              <p className="text-[11px] text-slate-400 font-sans leading-normal">
                Instantly trigger notification dispatches when unauthorized reseller pricing drops below MAP policies.
              </p>
            </div>

            {/* Toggle Config Fields */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-305 text-slate-300 font-medium font-sans">Slack Webhook Interceptors</span>
                <button
                  type="button"
                  onClick={() => setAlertConfig(p => ({ ...p, slack: !p.slack }))}
                  className={`px-3 py-1 text-[10px] font-mono rounded font-bold transition uppercase tracking-wider cursor-pointer ${
                    alertConfig.slack 
                      ? "bg-[#10b981]/25 border border-[#10b981]/40 text-emerald-400" 
                      : "bg-zinc-800 text-slate-400 border border-zinc-700 hover:text-white"
                  }`}
                >
                  {alertConfig.slack ? "Active" : "Disabled"}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-305 text-slate-300 font-medium font-sans">Email Dispatch Alerting</span>
                <button
                  type="button"
                  onClick={() => setAlertConfig(p => ({ ...p, email: !p.email }))}
                  className={`px-3 py-1 text-[10px] font-mono rounded font-bold transition uppercase tracking-wider cursor-pointer ${
                    alertConfig.email 
                      ? "bg-[#10b981]/25 border border-[#10b981]/40 text-emerald-400" 
                      : "bg-zinc-800 text-slate-400 border border-zinc-700 hover:text-white"
                  }`}
                >
                  {alertConfig.email ? "Active" : "Disabled"}
                </button>
              </div>
            </div>

            {/* Test alert button */}
            <button
              onClick={() => {
                if (isTestingWebhook) return;
                setIsTestingWebhook(true);
                setWebhookLogs([]);
                
                const steps = [
                  "🌐 Establishing secure notification handshake with alert gateway...",
                  `🔔 Pricing anomaly flagging active for verified SKU catalog`,
                  `💬 Testing automated email warning notice directly`,
                  "🚀 Verification broadcast complete. Channels are working!"
                ];

                steps.forEach((step, idx) => {
                  setTimeout(() => {
                    setWebhookLogs(prev => [...prev, step]);
                    if (idx === steps.length - 1) {
                      setIsTestingWebhook(false);
                    }
                  }, (idx + 1) * 600);
                });
              }}
              disabled={isTestingWebhook}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-xs font-bold text-white rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {isTestingWebhook ? "Testing Dispatches..." : "Dispatch Testing Alert Handshake"}
            </button>

            {/* Webhook logs */}
            {webhookLogs.length > 0 && (
              <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-855 border-zinc-800 max-h-[140px] overflow-y-auto font-mono text-[9px] text-slate-300 space-y-1.5 scrollbar-thin select-text leading-tight">
                {webhookLogs.map((log, index) => (
                  <div key={index} className="border-l border-indigo-500 pl-2">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Panel 2: Unauthorized Seller tracking */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-6 sm:p-7 space-y-4 shadow-sm">
            <div className="space-y-1">
              <h3 className="font-bold font-display text-white text-base flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Unauthorized Sellers active list
              </h3>
              <p className="text-[11px] text-slate-400 font-sans leading-normal">
                Non-authorized retail storefronts detected advertising price drops below MAP, without holding a licensed partner contract agreement.
              </p>
            </div>

            <div className="space-y-3.5 pt-2 border-t border-zinc-800">
              <div className="space-y-2">
                
                <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl flex items-center justify-between text-xs gap-3">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-100">GlobalMarket-Extremelow</span>
                    <span className="block text-[9px] font-mono text-red-400">eBay Marketplace • Apex MK1 ($169.00)</span>
                  </div>
                  <span className="shrink-0 bg-red-950/40 text-red-400 border border-red-900/50 px-2 py-0.5 rounded font-mono text-[9px] font-bold">UNLICENSED VENDOR</span>
                </div>

                <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl flex items-center justify-between text-xs gap-3">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-100">LowCostElectronics Direct</span>
                    <span className="block text-[9px] font-mono text-red-400">Amazon unofficial shop • SoundWave ($220.00)</span>
                  </div>
                  <span className="shrink-0 bg-red-950/40 text-red-400 border border-red-900/50 px-2 py-0.5 rounded font-mono text-[9px] font-bold">UNLICENSED VENDOR</span>
                </div>

                <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl flex items-center justify-between text-xs gap-3">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-100">ValueSaver Depot</span>
                    <span className="block text-[9px] font-mono text-red-400">Walmart Thirdparty • webcam ($115.00)</span>
                  </div>
                  <span className="shrink-0 bg-[#3a0f12] bg-red-950/40 text-red-400 border border-red-900/50 px-2 py-0.5 rounded font-mono text-[9px] font-bold">UNLICENSED VENDOR</span>
                </div>

              </div>
            </div>
          </div>

        </div>

      </div>

      {selectedViolation && (
        <ViolationScreenshot
          product={selectedViolation.product}
          partner={selectedViolation.partner}
          domain={selectedViolation.domain}
          mapPrice={selectedViolation.map}
          detectedPrice={selectedViolation.found}
          url={selectedViolation.url}
          timestamp={selectedViolation.time}
          onClose={() => setSelectedViolation(null)}
        />
      )}

      {/* Interactive Executive Board PDF Report Stager */}
      {isExecutiveReportOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex flex-col md:flex-row overflow-hidden font-sans text-slate-200">
          {/* Custom CSS for window.print() layout adjustments */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              /* Ensure full system reset for paper output */
              html, body {
                background: #ffffff !important;
                color: #000000 !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: auto !important;
                font-size: 11pt !important;
              }
              /* Hide all web elements like sidebars, dialogs, custom fields */
              body > * {
                display: none !important;
              }
              #executive-print-section {
                display: block !important;
                position: absolute;
                left: 0;
                top: 0;
                width: 100% !important;
                height: auto !important;
                margin: 0 !important;
                padding: 40px !important;
                background: #ffffff !important;
                color: #000000 !important;
                box-shadow: none !important;
                border: none !important;
              }
              /* Hide web-only controls */
              .no-print {
                display: none !important;
              }
              /* High contrast for table borders on paper */
              table, th, td {
                border-color: #000000 !important;
              }
              /* Exact color printing for graphics, charts, status badges */
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              /* Page break guidelines for clean tables */
              tr {
                page-break-inside: avoid !important;
              }
            }
          `}} />

          {/* Left Panel: Report Customizer and Commands */}
          <div className="w-full md:w-80 shrink-0 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-900/60 p-6 flex flex-col justify-between overflow-y-auto no-print">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                    <FileText className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Report Customizer</h3>
                    <p className="text-[10px] text-slate-400">Board Executive Staging</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-normal pt-1">
                  Adjust report variables in real-time below. The interactive print preview on the right instantly reflects your customizations.
                </p>
              </div>

              <div className="space-y-4 border-t border-zinc-800/80 pt-4">
                {/* Title field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block">Document Title</label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="Enter document title"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-900 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                  />
                </div>

                {/* Cover Note field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block">Executive Cover Note</label>
                  <textarea
                    rows={4}
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    placeholder="Enter executive brief summary..."
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-900 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Signatory field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block">Prepared By (Signatory)</label>
                  <input
                    type="text"
                    value={reportSignatory}
                    onChange={(e) => setReportSignatory(e.target.value)}
                    placeholder="E.g., Compliance Lead"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-900 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-zinc-800/80 mt-6">
              {/* Export Trigger */}
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                Print / Save PDF Report
              </button>

              {/* Close Overlay */}
              <button
                type="button"
                onClick={() => setIsExecutiveReportOpen(false)}
                className="w-full py-2 bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 text-slate-400 hover:text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Exit Stager
              </button>
            </div>
          </div>

          {/* Right Panel: WYSIWYG Print Preview */}
          <div className="flex-1 bg-zinc-950/60 p-4 sm:p-8 overflow-y-auto flex items-start justify-center">
            
            <div 
              id="executive-print-section"
              className="bg-white text-zinc-900 shadow-2xl border border-zinc-200 p-8 sm:p-12 w-full max-w-[800px] min-h-[1050px] font-sans flex flex-col justify-between rounded-lg select-text print:shadow-none print:border-none print:p-0"
            >
              <div className="space-y-6">
                
                {/* 1. Header Corporate Branding */}
                <div className="flex items-start justify-between border-b border-zinc-300 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-zinc-900 text-white rounded">
                        <Shield className="w-5 h-5" />
                      </div>
                      <span className="font-extrabold tracking-tight text-zinc-900 text-lg uppercase font-sans">
                        MAPShield™ Intelligence
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
                      Brand Policy Protection Network
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="inline-block bg-zinc-900 text-white font-mono font-bold text-[9px] px-2 py-0.5 rounded tracking-wide">
                      BOARD REPORT
                    </span>
                    <p className="text-[9px] text-zinc-500 font-mono">
                      Generated: {new Date().toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* 2. Document Title and Reference */}
                <div className="space-y-2">
                  <h1 className="text-2xl font-black text-zinc-900 tracking-tight leading-none uppercase">
                    {reportTitle}
                  </h1>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-zinc-50 p-3 rounded-lg border border-zinc-200 font-mono text-[10px]">
                    <div>
                      <span className="text-zinc-450 uppercase block font-semibold text-[8px]">Ref ID</span>
                      <span className="text-zinc-800 font-bold">MS-AUD-2026-Q2</span>
                    </div>
                    <div>
                      <span className="text-zinc-455 uppercase block font-semibold text-[8px]">Audit Cycle</span>
                      <span className="text-zinc-800 font-bold">Live Crawler Sweep</span>
                    </div>
                    <div>
                      <span className="text-zinc-460 uppercase block font-semibold text-[8px]">Classification</span>
                      <span className="text-red-600 font-extrabold">CONFIDENTIAL</span>
                    </div>
                    <div>
                      <span className="text-zinc-465 uppercase block font-semibold text-[8px]">Enforcement Index</span>
                      <span className="text-emerald-600 font-extrabold">
                        {complianceHealthScore}% Integrity
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Executive Cover Note */}
                {reportNotes && (
                  <div className="space-y-1.5 p-4 bg-zinc-50 border-l-4 border-zinc-900 rounded-r-lg">
                    <span className="text-[9px] font-mono font-extrabold text-zinc-500 uppercase tracking-widest block">Executive Summary Briefing</span>
                    <p className="text-xs text-zinc-700 leading-relaxed font-sans italic">
                      "{reportNotes}"
                    </p>
                  </div>
                )}

                {/* 4. KPI Health Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                  <div className="p-3 border border-zinc-200 rounded-lg text-center bg-zinc-50/50">
                    <span className="text-[8.5px] font-mono uppercase tracking-widest font-extrabold text-zinc-400 block">Compliance Rate</span>
                    <span className="text-2xl font-black text-zinc-900 block mt-1">{complianceHealthScore}%</span>
                    <span className="text-[8px] font-mono text-zinc-500 block">({compliantProductsCount} of {totalProducts} SKUs OK)</span>
                  </div>
                  <div className="p-3 border border-zinc-200 rounded-lg text-center bg-zinc-50/50">
                    <span className="text-[8.5px] font-mono uppercase tracking-widest font-extrabold text-zinc-400 block">Active Breaches</span>
                    <span className="text-2xl font-black text-red-600 block mt-1">{activeViolationsList.length}</span>
                    <span className="text-[8px] font-mono text-zinc-500 block">Across storefronts</span>
                  </div>
                  <div className="p-3 border border-zinc-200 rounded-lg text-center bg-zinc-50/50">
                    <span className="text-[8.5px] font-mono uppercase tracking-widest font-extrabold text-zinc-400 block">Total Catalog</span>
                    <span className="text-2xl font-black text-zinc-900 block mt-1">{totalProducts}</span>
                    <span className="text-[8px] font-mono text-zinc-500 block">Products registered</span>
                  </div>
                  <div className="p-3 border border-zinc-200 rounded-lg text-center bg-zinc-50/50">
                    <span className="text-[8.5px] font-mono uppercase tracking-widest font-extrabold text-zinc-400 block">Partners</span>
                    <span className="text-2xl font-black text-zinc-900 block mt-1">{partners.length}</span>
                    <span className="text-[8px] font-mono text-zinc-500 block">Authorized resellers</span>
                  </div>
                </div>

                {/* 5. SVG Compliance Heatmap Visualization */}
                <div className="space-y-2 pt-2">
                  <span className="text-[9px] font-mono font-extrabold text-zinc-500 uppercase tracking-widest block">Regional Compliance Geographic Grid</span>
                  <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 p-3 flex flex-col items-center">
                    
                    {/* Compact printable high-contrast SVG Map */}
                    <svg viewBox="0 0 200 100" className="w-full h-32 sm:h-36 max-w-[500px]" preserveAspectRatio="none">
                      {/* Grid overlay */}
                      <g stroke="#e4e4e7" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.8">
                        <line x1="0" y1="20" x2="200" y2="20" />
                        <line x1="0" y1="50" x2="200" y2="50" />
                        <line x1="0" y1="80" x2="200" y2="80" />
                        <line x1="50" y1="0" x2="50" y2="100" />
                        <line x1="100" y1="0" x2="100" y2="100" />
                        <line x1="150" y1="0" x2="150" y2="100" />
                      </g>

                      {/* Region Paths with High-Contrast Print Fills */}
                      {(() => {
                        const regionsList = [
                          { id: "ca", name: "Canada", d: "M 15,12 Q 35,8 48,16 T 50,22 Q 38,25 20,20 Z" },
                          { id: "us", name: "United States", d: "M 18,22 Q 38,24 50,24 T 52,35 Q 38,38 20,32 Z" },
                          { id: "eu", name: "Europe", d: "M 90,15 Q 115,10 125,25 T 100,45 Q 90,30 90,15 Z" },
                          { id: "apac", name: "APAC", d: "M 130,15 Q 165,12 185,25 T 155,55 Q 135,40 130,15 Z" },
                          { id: "latam", name: "LATAM", d: "M 45,45 Q 55,50 48,75 T 38,85 Q 35,60 45,45 Z" }
                        ];

                        const getRegionStats = (regionName: string) => {
                          const violations = activeViolationsList.filter(v => getRegionForPartnerName(v.partner, v.domain) === regionName);
                          const count = violations.length;
                          let avgVariance = 0;
                          if (count > 0) {
                            const totalVariance = violations.reduce((acc, v) => {
                              const varPct = Math.max(0, ((v.map - v.found) / v.map) * 100);
                              return acc + varPct;
                            }, 0);
                            avgVariance = Math.round(totalVariance / count);
                          } else {
                            const seedVariance: Record<string, number> = { "United States": 14, "Canada": 8, "Europe": 18, "APAC": 12, "LATAM": 5 };
                            avgVariance = seedVariance[regionName] || 10;
                          }
                          return { count, avgVariance };
                        };

                        const getPathFill = (regionName: string) => {
                          const { count } = getRegionStats(regionName);
                          if (count === 0) return "#f4f4f5"; // Ultra light gray for optimal
                          if (count <= 2) return "#fef3c7"; // Pale amber for moderate risk
                          return "#fee2e2"; // Pale rose for high risk
                        };

                        return regionsList.map((reg) => (
                          <path
                            key={reg.id}
                            d={reg.d}
                            fill={getPathFill(reg.name)}
                            stroke="#52525b"
                            strokeWidth="0.5"
                          />
                        ));
                      })()}

                      {/* Faint connections */}
                      <g stroke="#d4d4d8" strokeWidth="0.5" strokeDasharray="1,2">
                        <line x1="45" y1="35" x2="105" y2="24" />
                        <line x1="105" y1="24" x2="155" y2="40" />
                      </g>

                      {/* Hotspot Radar Pins */}
                      {(() => {
                        const regionsList = [
                          { id: "us", name: "United States", x: 45, y: 35 },
                          { id: "ca", name: "Canada", x: 32, y: 18 },
                          { id: "eu", name: "Europe", x: 105, y: 24 },
                          { id: "apac", name: "APAC", x: 155, y: 40 },
                          { id: "latam", name: "LATAM", x: 62, y: 68 },
                        ];

                        return regionsList.map((reg) => {
                          const count = activeViolationsList.filter(v => getRegionForPartnerName(v.partner, v.domain) === reg.name).length;
                          const hasViolations = count > 0;
                          return (
                            <g key={reg.id}>
                              <circle
                                cx={reg.x}
                                cy={reg.y}
                                r={hasViolations ? 3 : 2}
                                fill={hasViolations ? "#dc2626" : "#2563eb"}
                              />
                            </g>
                          );
                        });
                      })()}
                    </svg>

                    {/* Simple Map Legend */}
                    <div className="flex gap-4 mt-2 text-[8px] font-mono text-zinc-500 border-t border-zinc-200/60 pt-1.5 w-full justify-center">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-1.5 rounded bg-zinc-150 border border-zinc-300 inline-block"></span>
                        No Active Alerts (100% OK)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-1.5 rounded bg-amber-100 border border-amber-300 inline-block"></span>
                        Moderate Alert Rating (1-2 Breaches)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-1.5 rounded bg-rose-100 border border-rose-300 inline-block"></span>
                        High Risk Level (&gt;2 Breaches)
                      </span>
                    </div>

                  </div>

                  {/* Heatmap Stats Breakdown Table */}
                  <table className="w-full text-left font-sans text-[10px] border border-zinc-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-zinc-100 text-zinc-700 font-bold uppercase tracking-wider text-[8px] border-b border-zinc-200">
                        <th className="px-3 py-2">Region</th>
                        <th className="px-3 py-2 text-center">Alert Count</th>
                        <th className="px-3 py-2 text-center">Avg Pricing Variance</th>
                        <th className="px-3 py-2 text-center">Current Projected Risk</th>
                        <th className="px-3 py-2">Targeted Operational Directive</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 text-zinc-700">
                      {(() => {
                        const regionsData = [
                          { id: "us", name: "United States", action: "Deploy automated MAP warning dispatches to secondary resellers." },
                          { id: "ca", name: "Canada", action: "Verify authorized contract pricing guidelines on web storefronts." },
                          { id: "eu", name: "Europe", action: "Institute legal sweeps across electronics e-boutiques." },
                          { id: "apac", name: "APAC", action: "Low level localized crawl sweeps. Compliance baseline maintained." },
                          { id: "latam", name: "LATAM", action: "Continuous monitoring active. Compliance index remains high." }
                        ];

                        return regionsData.map((reg) => {
                          const violations = activeViolationsList.filter(v => getRegionForPartnerName(v.partner, v.domain) === reg.name);
                          const count = violations.length;
                          let avgVariance = 0;
                          if (count > 0) {
                            const totalVariance = violations.reduce((acc, v) => {
                              const varPct = Math.max(0, ((v.map - v.found) / v.map) * 100);
                              return acc + varPct;
                            }, 0);
                            avgVariance = Math.round(totalVariance / count);
                          } else {
                            const seedVariance: Record<string, number> = { "United States": 14, "Canada": 8, "Europe": 18, "APAC": 12, "LATAM": 5 };
                            avgVariance = seedVariance[reg.name] || 10;
                          }

                          return (
                            <tr key={reg.id} className={count > 0 ? "bg-rose-50/20" : ""}>
                              <td className="px-3 py-1.5 font-bold text-zinc-900">{reg.name}</td>
                              <td className={`px-3 py-1.5 text-center font-bold ${count > 0 ? "text-red-600" : "text-emerald-600"}`}>
                                {count}
                              </td>
                              <td className="px-3 py-1.5 text-center font-mono">
                                {count > 0 ? `-${avgVariance}%` : `-${avgVariance}% avg`}
                              </td>
                              <td className="px-3 py-1.5 text-center">
                                <span className={`inline-block px-1.5 py-0.5 text-[8px] font-bold rounded ${
                                  count > 2 
                                    ? "bg-rose-100 text-rose-800" 
                                    : count > 0 
                                      ? "bg-amber-100 text-amber-800" 
                                      : "bg-emerald-100 text-emerald-800"
                                }`}>
                                  {count > 2 ? "↑ Rising" : count > 0 ? "→ Stable" : "↓ Minimal Risk"}
                                </span>
                              </td>
                              <td className="px-3 py-1.5 text-zinc-600 text-[9.5px] italic">{reg.action}</td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* 6. Recent Infractions Table */}
                <div className="space-y-2 pt-2">
                  <span className="text-[9px] font-mono font-extrabold text-zinc-500 uppercase tracking-widest block">Active Breach Intelligence Ledger</span>
                  {activeViolationsList.length === 0 ? (
                    <div className="text-center p-6 border border-zinc-200 rounded-lg bg-zinc-50/50 text-[10px] text-zinc-500 font-medium">
                      No active MAP policy violations detected in current live indexes.
                    </div>
                  ) : (
                    <table className="w-full text-left font-sans text-[9.5px] border border-zinc-200 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-zinc-100 text-zinc-750 font-bold uppercase tracking-wider text-[8px] border-b border-zinc-200">
                          <th className="px-3 py-2">Authorized SKU</th>
                          <th className="px-3 py-2">Merchant Storefront</th>
                          <th className="px-3 py-2">Established MAP</th>
                          <th className="px-3 py-2">Listed Violation</th>
                          <th className="px-3 py-2">Variance</th>
                          <th className="px-3 py-2 text-right">Date Checked</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 text-zinc-700">
                        {activeViolationsList.slice(0, 7).map((violation, idx) => {
                          const variancePercent = Math.round(((violation.map - violation.found) / violation.map) * 100);
                          const matchingProduct = products.find(p => p.name === violation.product);
                          const sku = matchingProduct ? matchingProduct.sku : "SKU-N/A";
                          return (
                            <tr 
                              key={idx} 
                              className="hover:bg-zinc-100 cursor-pointer transition-colors group font-sans"
                              onClick={() => {
                                handleViolationClick(violation);
                                setIsExecutiveReportOpen(false); // Close modal so user can view map
                              }}
                              title="Click to locate on map"
                            >
                              <td className="px-3 py-2 font-mono font-semibold text-zinc-900">{sku}</td>
                              <td className="px-3 py-2 text-zinc-800">
                                <div className="flex items-center gap-1.5">
                                  <div>
                                    <span className="font-bold group-hover:text-indigo-600 transition-colors">{violation.partner}</span>
                                    <span className="block text-[8px] text-zinc-500 font-mono">({violation.domain})</span>
                                  </div>
                                  <MapPin className="w-2.5 h-2.5 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                </div>
                              </td>
                              <td className="px-3 py-2 font-mono text-zinc-600">${violation.map.toFixed(2)}</td>
                              <td className="px-3 py-2 font-mono text-red-600 font-bold">${violation.found.toFixed(2)}</td>
                              <td className="px-3 py-2">
                                <span className="inline-block bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-[8px] font-bold">
                                  -{variancePercent}%
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-zinc-500 text-[8.5px]">
                                {violation.time ? new Date(violation.time).toLocaleDateString() : "N/A"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

              </div>

              {/* 7. Certification, strategic guidelines, and signatory footer */}
              <div className="border-t border-zinc-300 pt-6 space-y-4">
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded text-[9px] text-zinc-500 leading-normal font-sans italic">
                  <strong>Strategic Operational Mandate:</strong> Resellers holding a positive variance of more than 10% are subject to immediate warning dispatching, followed by a formal contract hold if unresolved within 48 business hours. This report is designated for executive review and is fully certified by authorized MAPShield automated scraping crawler protocols.
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-2">
                  <div className="space-y-1">
                    <div className="border-b border-zinc-450 border-zinc-400 w-48 h-5"></div>
                    <span className="text-[9px] font-mono text-zinc-450 text-zinc-400 uppercase tracking-widest block font-bold">
                      Prepared By: {reportSignatory || "Compliance Director"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="border-b border-zinc-450 border-zinc-400 w-48 h-5"></div>
                    <span className="text-[9px] font-mono text-zinc-450 text-zinc-400 uppercase tracking-widest block font-bold">
                      Executive Sponsor Approval Sign-off
                    </span>
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="border-b border-zinc-450 border-zinc-400 w-32 h-5 text-left text-zinc-850 text-[10px] pl-1 font-mono text-zinc-700">
                      {new Date().toLocaleDateString()}
                    </div>
                    <span className="text-[9px] font-mono text-zinc-450 text-zinc-400 uppercase tracking-widest block font-bold">
                      Effective Audit Date
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
