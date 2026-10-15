import React, { useState, useRef } from "react";
import { Product, ScanJob } from "../types";
import { 
  Plus, Trash2, Tag, Search, DollarSign, Upload, FileSpreadsheet, 
  AlertCircle, CheckCircle2, Download, ChevronDown, ChevronUp, 
  Calendar, ShieldCheck, Shield, AlertTriangle, ExternalLink, ShieldAlert, Clock, Activity, Zap,
  History, Edit3, Save, FileText, TrendingUp, X, Sparkles, GitCompare, Mail, Loader2, FileJson, Package, Image as ImageIcon
} from "lucide-react";
import Papa from "papaparse";
import { jsPDF } from "jspdf";
import SearchBar from "./SearchBar";
import SkuSearchFilter, { ComplianceFilterStatus, SkuSortOption } from "./SkuSearchFilter";
import SkuBreachTimeline from "./SkuBreachTimeline";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
  ReferenceLine
} from "recharts";

interface ProductsViewProps {
  products: Product[];
  onAddProduct: (name: string, sku: string, mapPrice: number, description: string, imageUrl?: string, mapThresholdPercent?: number) => void;
  onBulkAddProducts?: (items: { name: string; sku: string; mapPrice: number; description: string; imageUrl?: string; mapThresholdPercent?: number }[]) => Promise<void>;
  onDeleteProduct: (id: string) => void;
  scans?: ScanJob[];
  onUpdateProduct?: (id: string, name: string, sku: string, mapPrice: number, description: string, imageUrl?: string, mapThresholdPercent?: number) => Promise<void> | void;
}

export default function ProductsView({ products, onAddProduct, onBulkAddProducts, onDeleteProduct, scans, onUpdateProduct }: ProductsViewProps) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [mapPrice, setMapPrice] = useState("");
  const [customMapThresholdPercent, setCustomMapThresholdPercent] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [complianceFilter, setComplianceFilter] = useState<ComplianceFilterStatus>("all");
  const [skuSortBy, setSkuSortBy] = useState<SkuSortOption>("name-asc");
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // Expanded panel active detail tab per SKU
  const [activeDetailTabs, setActiveDetailTabs] = useState<{ [productId: string]: "monitoring" | "audit_log" }>({});

  // Audit Logs cache map on client side
  const [productAuditLogs, setProductAuditLogs] = useState<{ [productId: string]: any[] }>({});
  const [isLoadingLogs, setIsLoadingLogs] = useState<{ [productId: string]: boolean }>({});

  // Inline pricing update fields
  const [editingPriceMapId, setEditingPriceMapId] = useState<string | null>(null);
  const [editedPriceStr, setEditedPriceStr] = useState<string>("");
  const [editingPriceError, setEditingPriceError] = useState<string | null>(null);

  // Inline threshold update fields
  const [editingThresholdMapId, setEditingThresholdMapId] = useState<string | null>(null);
  const [editedThresholdStr, setEditedThresholdStr] = useState<string>("");
  const [editingThresholdError, setEditingThresholdError] = useState<string | null>(null);

  // Dedicated threshold quick override modal
  const [quickThresholdModalProduct, setQuickThresholdModalProduct] = useState<Product | null>(null);
  const [modalThresholdVal, setModalThresholdVal] = useState<number>(80);

  // Comprehensive analytics modal selected product
  const [selectedAnalyticsProduct, setSelectedAnalyticsProduct] = useState<Product | null>(null);

  // Multi-select comparison states
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

  const getProductCompareStats = (product: Product) => {
    const productScans = (scans || []).filter(s => s.productId === product.id);
    const sortedProductScans = [...productScans].sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );

    // Completed scans with item violations
    const completedScans = sortedProductScans.filter(s => s.status === 'completed');
    const allViolations = completedScans
      .flatMap(s => (s.items || []).map(item => ({ ...item, scanDate: s.startedAt, scanId: s.id })))
      .filter(item => item.status === 'violating');

    // Latest scan details
    const latestCompleted = completedScans[0];
    const activeBreaches = latestCompleted 
      ? (latestCompleted.items || []).filter(item => item.status === 'violating')
      : [];

    const latestPrice = activeBreaches.length > 0 
      ? Math.min(...activeBreaches.map(item => item.detectedPrice || product.mapPrice))
      : product.mapPrice;

    const minDetectedPrice = allViolations.length > 0
      ? Math.min(...allViolations.map(v => v.detectedPrice || product.mapPrice))
      : product.mapPrice;

    // Historical Price Deviation
    const avgDeviationVal = allViolations.length > 0
      ? allViolations.reduce((sum, v) => sum + Math.max(0, product.mapPrice - (v.detectedPrice || 0)), 0) / allViolations.length
      : 0;
    const avgDeviationPct = product.mapPrice > 0 ? (avgDeviationVal / product.mapPrice) * 100 : 0;
    const maxDeviationVal = allViolations.length > 0
      ? Math.max(...allViolations.map(v => Math.max(0, product.mapPrice - (v.detectedPrice || 0))))
      : 0;
    const maxDeviationPct = product.mapPrice > 0 ? (maxDeviationVal / product.mapPrice) * 100 : 0;

    // Breach Frequency & Historical Compliance
    const totalScans = completedScans.length;
    const spottedBreaches = allViolations.length;
    const breachFreq = totalScans > 0 ? (spottedBreaches / totalScans) * 100 : 0;
    const historicalComplianceRate = totalScans > 0 ? Math.max(0, 100 - breachFreq) : 100;

    // Breach Intensity Rating
    let breachIntensity: "LOW" | "MODERATE" | "HIGH" | "EXTREME" = "LOW";
    if (breachFreq > 60 || maxDeviationPct > 25) {
      breachIntensity = "EXTREME";
    } else if (breachFreq > 30 || maxDeviationPct > 15) {
      breachIntensity = "HIGH";
    } else if (breachFreq > 10 || maxDeviationPct > 5) {
      breachIntensity = "MODERATE";
    }

    // Financial Impact Calculations
    const configVolume = estimatedVolumes[product.id] !== undefined ? estimatedVolumes[product.id] : 350;
    const simDisc = simulatedDiscounts[product.id] !== undefined ? simulatedDiscounts[product.id] : 15;
    const simRet = simulatedRetailers[product.id] !== undefined ? simulatedRetailers[product.id] : 3;

    let projectedMonthlyLoss = 0;
    if (activeBreaches.length > 0) {
      const totalUnitDeficit = activeBreaches.reduce((sum, item) => sum + Math.max(product.mapPrice - (item.detectedPrice || 0), 0), 0);
      const avgDeficitAmount = totalUnitDeficit / activeBreaches.length;
      projectedMonthlyLoss = avgDeficitAmount * configVolume;
    } else if (allViolations.length > 0) {
      projectedMonthlyLoss = avgDeviationVal * configVolume;
    } else {
      const avgDeficitAmount = product.mapPrice * (simDisc / 100);
      projectedMonthlyLoss = avgDeficitAmount * configVolume * (simRet / 3);
    }
    const projectedAnnualLoss = projectedMonthlyLoss * 12;

    // Price Trajectory: last 5 prices from scans
    const priceTrajectory = completedScans.slice(0, 5).map(s => {
      const scanViolations = (s.items || []).filter(item => item.status === 'violating');
      const price = scanViolations.length > 0 
        ? Math.min(...scanViolations.map(v => v.detectedPrice || product.mapPrice))
        : product.mapPrice;
      return { date: new Date(s.startedAt).toLocaleDateString(), price };
    }).reverse();

    return {
      product,
      totalScans,
      spottedBreaches,
      breachFreq,
      historicalComplianceRate,
      breachIntensity,
      latestPrice,
      minDetectedPrice,
      avgDeviationVal,
      avgDeviationPct,
      maxDeviationVal,
      maxDeviationPct,
      configVolume,
      simDisc,
      simRet,
      projectedMonthlyLoss,
      projectedAnnualLoss,
      priceTrajectory,
      complianceStatus: breachFreq > 50 ? "CRITICAL" : breachFreq > 0 ? "MODERATE" : "COMPLIANT"
    };
  };

  // SKU Comparison System states
  const [compareProductAId, setCompareProductAId] = useState<string>("");
  const [compareProductBId, setCompareProductBId] = useState<string>("");
  const [compareChartType, setCompareChartType] = useState<'absolute' | 'deviation'>('absolute');
  const [activeCatalogTab, setActiveCatalogTab] = useState<"registry" | "comparison" | "history">("registry");

  // Interactive History Tab States
  const [historyProductAId, setHistoryProductAId] = useState<string>("");
  const [historyProductBId, setHistoryProductBId] = useState<string>("");
  const [infractionThreshold, setInfractionThreshold] = useState<number>(-2.0);
  const [hoveredInfraction, setHoveredInfraction] = useState<{ date: string; sku: string; value: number } | null>(null);

  // Interactive History Annotations
  const [trendAnnotations, setTrendAnnotations] = useState<{ [key: string]: string }>(() => {
    const saved = localStorage.getItem("map_compliance_interactive_trend_annotations");
    return saved ? JSON.parse(saved) : {};
  });
  const [annotationModal, setAnnotationModal] = useState<{
    sku: string;
    pointName: string;
    price: number;
    map: number;
    deviation: number;
  } | null>(null);
  const [annotationInput, setAnnotationInput] = useState<string>("");
  const longPressTimer = useRef<any>(null);

  // Aggregated Financial Impact slider/model states
  const [estimatedVolumes, setEstimatedVolumes] = useState<{ [productId: string]: number }>(() => {
    const saved = localStorage.getItem("map_compliance_estimated_volumes");
    return saved ? JSON.parse(saved) : {};
  });
  const [simulatedDiscounts, setSimulatedDiscounts] = useState<{ [productId: string]: number }>({});
  const [simulatedRetailers, setSimulatedRetailers] = useState<{ [productId: string]: number }>({});
  const [activeFinancialCharts, setActiveFinancialCharts] = useState<{ [productId: string]: "loss" | "recovery" }>({});

  // Send Automated Warning states
  const [warningDraft, setWarningDraft] = useState<{
    product: Product;
    violation: any;
    recipientEmail: string;
    subject: string;
    body: string;
  } | null>(null);
  const [isSendingWarning, setIsSendingWarning] = useState(false);
  const [sendingStep, setSendingStep] = useState<string>("");
  const [sendSuccess, setSendSuccess] = useState(false);

  const getDefaultEmail = (name: string, domain: string) => {
    const d = (domain || "").toLowerCase();
    const n = (name || "").toLowerCase();
    if (d.includes("amazon") || n.includes("gizmo")) return "partner-relations@gizmomart.com";
    if (d.includes("bestbuy") || n.includes("delight")) return "compliance@techdelight.com";
    if (d.includes("newegg")) return "legal@neweggpartner.com";
    return `compliance@${d || "retailer.com"}`;
  };

  const handleInitiateWarning = (product: Product, v: any) => {
    if (!product || !v) return;
    const mapPrice = product.mapPrice || 100;
    const deficit = mapPrice - (v.detectedPrice || 0);
    const percentDeficit = mapPrice > 0 ? (deficit / mapPrice) * 100 : 0;
    const recipientEmail = getDefaultEmail(v.partnerName || v.partnerDomain, v.partnerDomain);
    
    const subject = `URGENT: Minimum Advertised Price (MAP) Violation Notice - ${product.sku || "Product"}`;
    const body = `Dear Store Operations Team,\n\nThis communication serves as an official notice that your current advertised price for ${product.name} is in direct violation of our established Minimum Advertised Price (MAP) Policy.\n\nProduct Details:\n* SKU: ${product.sku}\n* Product Name: ${product.name}\n* Established MAP: $${mapPrice.toFixed(2)}\n* Your Advertised Price: $${(v.detectedPrice || 0).toFixed(2)}\n* Price Discrepancy: -$${deficit.toFixed(2)} (${percentDeficit.toFixed(1)}%)\n* Detected URL: ${v.detectedUrl || "N/A"}\n\nRequired Curative Action:\nYou are requested to immediately adjust your advertised price on this listing to align with or exceed our established MAP of $${mapPrice.toFixed(2)}.\n\nPlease implement this correction within twenty-four (24) business hours to maintain your status as an authorized reseller and prevent temporary distribution suspension.\n\nBest regards,\nMAP Policy Enforcement Team\nCloudboyX Brand Protection`;

    setWarningDraft({
      product,
      violation: v,
      recipientEmail,
      subject,
      body
    });
    setSendSuccess(false);
    setIsSendingWarning(false);
  };

  const handleSendWarning = async () => {
    if (!warningDraft) return;
    setIsSendingWarning(true);
    setSendSuccess(false);

    const steps = [
      "Constructing Warning Notice...",
      "Validating Compliance Contact Email...",
      "Transmitting secure template notice...",
      "Delivered successfully! System alerts updated."
    ];

    for (let i = 0; i < steps.length - 1; i++) {
      setSendingStep(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    try {
      const response = await fetch("/api/notifications/send-warning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: warningDraft.product.id,
          partnerId: warningDraft.violation.partnerId,
          partnerName: warningDraft.violation.partnerName,
          partnerDomain: warningDraft.violation.partnerDomain,
          mapPrice: warningDraft.product?.mapPrice || 0,
          detectedPrice: warningDraft.violation.detectedPrice,
          recipientEmail: warningDraft.recipientEmail,
          subject: warningDraft.subject,
          body: warningDraft.body
        })
      });

      if (response.ok) {
        setSendingStep(steps[steps.length - 1]);
        setSendSuccess(true);
        // Refresh audit logs in UI
        fetchAuditLogs(warningDraft.product.id);
        // Clean draft after a short success show
        setTimeout(() => {
          setWarningDraft(null);
          setSendSuccess(false);
          setIsSendingWarning(false);
        }, 2000);
      } else {
        const errorData = await response.json();
        setSendingStep(`Dispatch failed: ${errorData.error || "Internal Error"}`);
        setTimeout(() => {
          setIsSendingWarning(false);
        }, 3000);
      }
    } catch (err: any) {
      console.error(err);
      setSendingStep(`Network transmission failed: ${err.message}`);
      setTimeout(() => {
        setIsSendingWarning(false);
      }, 3000);
    }
  };

  React.useEffect(() => {
    localStorage.setItem("map_compliance_interactive_trend_annotations", JSON.stringify(trendAnnotations));
  }, [trendAnnotations]);

  React.useEffect(() => {
    localStorage.setItem("map_compliance_estimated_volumes", JSON.stringify(estimatedVolumes));
  }, [estimatedVolumes]);

  React.useEffect(() => {
    if (products.length >= 2) {
      if (!historyProductAId) setHistoryProductAId(products[0].id);
      if (!historyProductBId) setHistoryProductBId(products[1].id);
    } else if (products.length === 1) {
      if (!historyProductAId) setHistoryProductAId(products[0].id);
    }
  }, [products, historyProductAId, historyProductBId]);

  // Multi-SKU 90-day Comparison Chart States
  const [multiSelectCompareProductIds, setMultiSelectCompareProductIds] = useState<string[]>([]);
  const [multiSelectSearchQuery, setMultiSelectSearchQuery] = useState<string>("");

  const productsLength = products.length;
  React.useEffect(() => {
    if (productsLength > 0 && multiSelectCompareProductIds.length === 0) {
      setMultiSelectCompareProductIds(products.slice(0, 3).map(p => p.id));
    }
  }, [productsLength]);

  // Fetch audit logs for specified SKU
  const fetchAuditLogs = async (productId: string) => {
    setIsLoadingLogs(prev => ({ ...prev, [productId]: true }));
    try {
      const response = await fetch(`/api/audit-logs?productId=${productId}`);
      if (response.ok) {
        const data = await response.json();
        setProductAuditLogs(prev => ({ ...prev, [productId]: data }));
      }
    } catch (err) {
      console.error("Error loading SKU audit trajectory:", err);
    } finally {
      setIsLoadingLogs(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleToggleExpand = (productId: string) => {
    if (expandedProductId === productId) {
      setExpandedProductId(null);
    } else {
      setExpandedProductId(productId);
      fetchAuditLogs(productId);
    }
  };

  const getComparisonStats = (prodId: string) => {
    const product = products.find(p => p.id === prodId);
    if (!product) return null;

    const productScans = (scans || []).filter(s => s.productId === prodId);
    const completedScans = productScans.filter(s => s.status === 'completed');
    
    // Violations from completed scans
    const violations = completedScans.flatMap(s => 
      (s.items || [])
        .map(item => ({ ...item, scanDate: s.startedAt, scanId: s.id }))
    ).filter(item => item.status === 'violating');

    const totalScansCount = completedScans.length;
    const scansWithViolationsCount = completedScans.filter(s => 
      (s.items || []).some(item => item.status === 'violating')
    ).length;

    // Breach frequency ratio or text
    const breachFrequencyPct = totalScansCount > 0 
      ? Math.round((scansWithViolationsCount / totalScansCount) * 100)
      : 0;
    
    const breachFrequencyStr = totalScansCount > 0 
      ? `${scansWithViolationsCount} of ${totalScansCount} scans (${breachFrequencyPct}%)`
      : "0 scans run";

    // --- 30-day Metrics ---
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completedScans30d = completedScans.filter(s => {
      const d = new Date(s.startedAt);
      return d >= thirtyDaysAgo;
    });

    const totalScansCount30d = completedScans30d.length;
    const scansWithViolationsCount30d = completedScans30d.filter(s => 
      (s.items || []).some(item => item.status === 'violating')
    ).length;

    const breachFrequencyPct30d = totalScansCount30d > 0 
      ? Math.round((scansWithViolationsCount30d / totalScansCount30d) * 100)
      : 0;

    const breachFrequencyStr30d = totalScansCount30d > 0 
      ? `${scansWithViolationsCount30d} of ${totalScansCount30d} scans (${breachFrequencyPct30d}%)`
      : "0 scans run (last 30d)";

    const violations30d = violations.filter(v => {
      const d = new Date(v.scanDate);
      return d >= thirtyDaysAgo;
    });

    let totalDeviation30d = 0;
    let deviationCount30d = 0;
    violations30d.forEach(v => {
      if (v.detectedPrice !== null && v.detectedPrice < product.mapPrice) {
        totalDeviation30d += (product.mapPrice - v.detectedPrice);
        deviationCount30d++;
      }
    });

    const avgDeviationVal30d = deviationCount30d > 0 ? (totalDeviation30d / deviationCount30d) : 0;
    const avgDeviationPct30d = product.mapPrice > 0 ? (avgDeviationVal30d / product.mapPrice) * 100 : 0;

    // Average price deviation (overall)
    let totalDeviation = 0;
    let deviationCount = 0;
    violations.forEach(v => {
      if (v.detectedPrice !== null && v.detectedPrice < product.mapPrice) {
        totalDeviation += (product.mapPrice - v.detectedPrice);
        deviationCount++;
      }
    });

    const avgDeviationVal = deviationCount > 0 ? (totalDeviation / deviationCount) : 0;
    const avgDeviationPct = product.mapPrice > 0 ? (avgDeviationVal / product.mapPrice) * 100 : 0;

    // Aggregate Risk Rating
    let riskLevel: "Low" | "Medium" | "High" | "Critical" = "Low";
    if (breachFrequencyPct > 50 || avgDeviationPct > 15) {
      riskLevel = "Critical";
    } else if (breachFrequencyPct > 25 || avgDeviationPct > 8) {
      riskLevel = "High";
    } else if (breachFrequencyPct > 0) {
      riskLevel = "Medium";
    }

    return {
      product,
      totalScansCount,
      scansWithViolationsCount,
      breachFrequencyPct,
      breachFrequencyStr,
      avgDeviationVal,
      avgDeviationPct,
      totalViolations: violations.length,
      riskLevel,
      // 30-day stats
      totalScansCount30d,
      scansWithViolationsCount30d,
      breachFrequencyPct30d,
      breachFrequencyStr30d,
      avgDeviationVal30d,
      avgDeviationPct30d,
      totalViolations30d: violations30d.length
    };
  };

  const handleDownloadComparison = () => {
    if (!compareProductAId || !compareProductBId) return;
    const statsA = getComparisonStats(compareProductAId);
    const statsB = getComparisonStats(compareProductBId);
    if (!statsA || !statsB) return;

    const data = [
      {
        Parameter: "Product Name",
        [statsA.product.name]: statsA.product.name,
        [statsB.product.name]: statsB.product.name,
      },
      {
        Parameter: "SKU Code",
        [statsA.product.name]: statsA.product.sku,
        [statsB.product.name]: statsB.product.sku,
      },
      {
        Parameter: "MAP Threshold Price ($)",
        [statsA.product.name]: statsA.product.mapPrice.toFixed(2),
        [statsB.product.name]: statsB.product.mapPrice.toFixed(2),
      },
      {
        Parameter: "Breach Frequency (Last 30 Days)",
        [statsA.product.name]: statsA.breachFrequencyStr30d,
        [statsB.product.name]: statsB.breachFrequencyStr30d,
      },
      {
        Parameter: "Breach Frequency (Lifetime)",
        [statsA.product.name]: statsA.breachFrequencyStr,
        [statsB.product.name]: statsB.breachFrequencyStr,
      },
      {
        Parameter: "Average Price Deviation (Last 30 Days)",
        [statsA.product.name]: statsA.avgDeviationVal30d > 0 ? `-$${statsA.avgDeviationVal30d.toFixed(2)} (-${statsA.avgDeviationPct30d.toFixed(1)}%)` : "$0.00 (0.0%)",
        [statsB.product.name]: statsB.avgDeviationVal30d > 0 ? `-$${statsB.avgDeviationVal30d.toFixed(2)} (-${statsB.avgDeviationPct30d.toFixed(1)}%)` : "$0.00 (0.0%)",
      },
      {
        Parameter: "Avg Deficit Value ($) (Last 30 Days)",
        [statsA.product.name]: statsA.avgDeviationVal30d > 0 ? `-$${statsA.avgDeviationVal30d.toFixed(2)}` : "$0.00",
        [statsB.product.name]: statsB.avgDeviationVal30d > 0 ? `-$${statsB.avgDeviationVal30d.toFixed(2)}` : "$0.00",
      },
      {
        Parameter: "Avg Deficit Ratio (Overall)",
        [statsA.product.name]: statsA.avgDeviationPct > 0 ? `-${statsA.avgDeviationPct.toFixed(1)}%` : "0.0%",
        [statsB.product.name]: statsB.avgDeviationPct > 0 ? `-${statsB.avgDeviationPct.toFixed(1)}%` : "0.0%",
      },
      {
        Parameter: "Avg Deficit Value ($) (Overall)",
        [statsA.product.name]: statsA.avgDeviationVal > 0 ? `-$${statsA.avgDeviationVal.toFixed(2)}` : "$0.00",
        [statsB.product.name]: statsB.avgDeviationVal > 0 ? `-$${statsB.avgDeviationVal.toFixed(2)}` : "$0.00",
      },
      {
        Parameter: "Total Scans Conducted",
        [statsA.product.name]: statsA.totalScansCount,
        [statsB.product.name]: statsB.totalScansCount,
      },
      {
        Parameter: "Total Violations Flagged",
        [statsA.product.name]: statsA.totalViolations,
        [statsB.product.name]: statsB.totalViolations,
      },
      {
        Parameter: "Risk Exposure Class",
        [statsA.product.name]: statsA.riskLevel,
        [statsB.product.name]: statsB.riskLevel,
      },
    ];

    const csvString = Papa.unparse(data);
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `MAP_Comparison_${statsA.product.sku}_vs_${statsB.product.sku}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadComparisonPDF = () => {
    if (!compareProductAId || !compareProductBId) return;
    const statsA = getComparisonStats(compareProductAId);
    const statsB = getComparisonStats(compareProductBId);
    if (!statsA || !statsB) return;

    try {
      const doc = new jsPDF();
      
      // Top Header Banner
      doc.setFillColor(15, 23, 42); 
      doc.rect(0, 0, 210, 12, 'F');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text("SKU CATALOG COMPARATIVE ANALYSIS REPORT", 14, 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), 196, 8, { align: "right" });

      let y = 22;

      // Title & Subtitle
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text("SKU Side-by-Side Pricing & MAP Comparison", 14, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Comparative evaluation between Candidate A (${statsA.product.sku}) and Candidate B (${statsB.product.sku})`, 14, y);
      y += 8;

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, y, 196, y);
      y += 10;

      // Candidate Summary Cards (2 Columns)
      // Candidate A Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, y, 88, 32, 2, 2, 'FD');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(79, 70, 229); // Indigo
      doc.text("CANDIDATE A", 18, y + 6);
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      const nameA = statsA.product.name.length > 28 ? statsA.product.name.substring(0, 26) + "..." : statsA.product.name;
      doc.text(nameA, 18, y + 13);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`SKU Code: ${statsA.product.sku}`, 18, y + 20);
      doc.text(`MAP Threshold Price: $${statsA.product.mapPrice.toFixed(2)}`, 18, y + 26);

      // Candidate B Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(108, y, 88, 32, 2, 2, 'FD');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(16, 185, 129); // Emerald
      doc.text("CANDIDATE B", 112, y + 6);
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      const nameB = statsB.product.name.length > 28 ? statsB.product.name.substring(0, 26) + "..." : statsB.product.name;
      doc.text(nameB, 112, y + 13);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`SKU Code: ${statsB.product.sku}`, 112, y + 20);
      doc.text(`MAP Threshold Price: $${statsB.product.mapPrice.toFixed(2)}`, 112, y + 26);

      y += 40;

      // Table Header Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("Comparative MAP & Pricing Metrics Summary", 14, y);
      y += 6;

      doc.setFillColor(15, 23, 42);
      doc.rect(14, y, 182, 8, 'F');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("METRICS PARAMETER", 18, y + 5.5);
      doc.text("CANDIDATE A", 95, y + 5.5);
      doc.text("CANDIDATE B", 150, y + 5.5);

      y += 8;

      const rowData = [
        {
          param: "MAP Threshold Price ($)",
          valA: `$${statsA.product.mapPrice.toFixed(2)}`,
          valB: `$${statsB.product.mapPrice.toFixed(2)}`
        },
        {
          param: "Breach Frequency (Last 30 Days)",
          valA: statsA.breachFrequencyStr30d,
          valB: statsB.breachFrequencyStr30d
        },
        {
          param: "Breach Frequency (Lifetime)",
          valA: statsA.breachFrequencyStr,
          valB: statsB.breachFrequencyStr
        },
        {
          param: "Avg 30-Day Price Deviation",
          valA: statsA.avgDeviationVal30d > 0 ? `-$${statsA.avgDeviationVal30d.toFixed(2)} (-${statsA.avgDeviationPct30d.toFixed(1)}%)` : "$0.00 (0.0%)",
          valB: statsB.avgDeviationVal30d > 0 ? `-$${statsB.avgDeviationVal30d.toFixed(2)} (-${statsB.avgDeviationPct30d.toFixed(1)}%)` : "$0.00 (0.0%)"
        },
        {
          param: "Lifetime Avg Price Deficit",
          valA: statsA.avgDeviationVal > 0 ? `-$${statsA.avgDeviationVal.toFixed(2)} (-${statsA.avgDeviationPct.toFixed(1)}%)` : "$0.00 (0.0%)",
          valB: statsB.avgDeviationVal > 0 ? `-$${statsB.avgDeviationVal.toFixed(2)} (-${statsB.avgDeviationPct.toFixed(1)}%)` : "$0.00 (0.0%)"
        },
        {
          param: "Total Scans Conducted",
          valA: `${statsA.totalScansCount} scans`,
          valB: `${statsB.totalScansCount} scans`
        },
        {
          param: "Total Infractions Flagged",
          valA: `${statsA.totalViolations} infractions`,
          valB: `${statsB.totalViolations} infractions`
        },
        {
          param: "Risk Exposure Level",
          valA: statsA.riskLevel.toUpperCase(),
          valB: statsB.riskLevel.toUpperCase()
        }
      ];

      rowData.forEach((row, idx) => {
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, y, 182, 8, 'F');
        }
        doc.setDrawColor(226, 232, 240);
        doc.rect(14, y, 182, 8, 'S');

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text(row.param, 18, y + 5.5);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        doc.text(row.valA, 95, y + 5.5);
        doc.text(row.valB, 150, y + 5.5);

        y += 8;
      });

      y += 10;

      // Footer Notes & Certification Block
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, y, 182, 22, 2, 2, 'F');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text("AUDIT CERTIFICATION & METRIC NOTES", 18, y + 6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("This comparative summary compiles automated partner storefront audits, historical scan logs, and MAP threshold deviations.", 18, y + 12);
      doc.text(`Generated by MAP Enforcement Platform • Timestamp: ${new Date().toISOString()}`, 18, y + 17);

      doc.save(`SKU_Comparison_Report_${statsA.product.sku}_vs_${statsB.product.sku}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
  };

  const handleDownloadTrendData = () => {
    const { data: chartData, prodA, prodB } = getTwoProductHistoryData();
    if (!prodA && !prodB) return;

    const skuA = prodA?.sku || "Product A";
    const skuB = prodB?.sku || "Product B";
    const nameA = prodA?.name || "N/A";
    const nameB = prodB?.name || "N/A";
    const mapPriceA = prodA?.mapPrice;
    const mapPriceB = prodB?.mapPrice;

    const data = chartData.map(row => {
      const rowData: any = { Date: row.date };
      if (prodA) {
        rowData[`Product A Name`] = nameA;
        rowData[`Product A SKU`] = skuA;
        rowData[`Product A MAP ($)`] = mapPriceA !== undefined ? `$${mapPriceA.toFixed(2)}` : "N/A";
        rowData[`Product A Deviation (%)`] = row[skuA] !== undefined ? `${row[skuA]}%` : "—";
      }
      if (prodB) {
        rowData[`Product B Name`] = nameB;
        rowData[`Product B SKU`] = skuB;
        rowData[`Product B MAP ($)`] = mapPriceB !== undefined ? `$${mapPriceB.toFixed(2)}` : "N/A";
        rowData[`Product B Deviation (%)`] = row[skuB] !== undefined ? `${row[skuB]}%` : "—";
      }
      return rowData;
    });

    const csvString = Papa.unparse(data);
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `MAP_90Day_Trend_${skuA}_vs_${skuB}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getComparePriceEvolutionData = (idA: string, idB: string) => {
    const prodA = products.find(p => p.id === idA);
    const prodB = products.find(p => p.id === idB);
    if (!prodA || !prodB) return { data: [], isSample: false };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Filter scans
    const completedScans30d = (scans || []).filter(s => {
      if (s.status !== 'completed') return false;
      const d = new Date(s.startedAt);
      return d >= thirtyDaysAgo;
    });

    const dates: string[] = [];
    const scanMap: Record<string, { priceA?: number; priceB?: number }> = {};

    completedScans30d.forEach(s => {
      const dateStr = new Date(s.startedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
      if (!dates.includes(dateStr)) {
        dates.push(dateStr);
      }
      if (!scanMap[dateStr]) {
        scanMap[dateStr] = {};
      }

      const prices = s.items?.map(i => i.detectedPrice).filter((p): p is number => p !== null && p !== undefined) || [];
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        if (s.productId === idA) {
          scanMap[dateStr].priceA = minPrice;
        } else if (s.productId === idB) {
          scanMap[dateStr].priceB = minPrice;
        }
      }
    });

    const isSample = dates.length === 0;
    let finalData = [];

    if (isSample) {
      const today = new Date();
      for (let i = 9; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i * 3);
        const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        
        // Generate simulated prices with fluctuating compliance and deviation
        const priceA = prodA.mapPrice * (1 + (Math.sin(i * 1.2) * 0.05) - (i % 3 === 0 ? 0.06 : 0));
        const priceB = prodB.mapPrice * (1 + (Math.cos(i * 0.9) * 0.04) - (i % 4 === 0 ? 0.10 : 0));

        finalData.push({
          date: dateStr,
          priceA: parseFloat(priceA.toFixed(2)),
          priceB: parseFloat(priceB.toFixed(2)),
          mapA: prodA.mapPrice,
          mapB: prodB.mapPrice,
          devA: parseFloat((((priceA - prodA.mapPrice) / prodA.mapPrice) * 100).toFixed(2)),
          devB: parseFloat((((priceB - prodB.mapPrice) / prodB.mapPrice) * 100).toFixed(2)),
        });
      }
    } else {
      // Sort dates chronologically
      dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

      let lastPriceA = prodA.mapPrice;
      let lastPriceB = prodB.mapPrice;

      finalData = dates.map(dateStr => {
        const priceA = scanMap[dateStr].priceA !== undefined ? scanMap[dateStr].priceA! : lastPriceA;
        const priceB = scanMap[dateStr].priceB !== undefined ? scanMap[dateStr].priceB! : lastPriceB;
        lastPriceA = priceA;
        lastPriceB = priceB;

        return {
          date: dateStr,
          priceA: parseFloat(priceA.toFixed(2)),
          priceB: parseFloat(priceB.toFixed(2)),
          mapA: prodA.mapPrice,
          mapB: prodB.mapPrice,
          devA: parseFloat((((priceA - prodA.mapPrice) / prodA.mapPrice) * 100).toFixed(2)),
          devB: parseFloat((((priceB - prodB.mapPrice) / prodB.mapPrice) * 100).toFixed(2)),
        };
      });
    }

    return { data: finalData, isSample };
  };

  const getMultiProductHistoryData = () => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const selectedProds = products.filter(p => multiSelectCompareProductIds.includes(p.id));
    if (selectedProds.length === 0) return { data: [], selectedProds: [], isSample: false };

    // Find completed scans in last 90 days
    const completedScans90d = (scans || []).filter(s => {
      if (s.status !== 'completed') return false;
      const d = new Date(s.startedAt);
      return d >= ninetyDaysAgo;
    });

    const dayMap: { [dateStr: string]: { [prodId: string]: number[] } } = {};
    
    completedScans90d.forEach(s => {
      const dateStr = new Date(s.startedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
      if (!dayMap[dateStr]) {
        dayMap[dateStr] = {};
      }
      if (!dayMap[dateStr][s.productId]) {
        dayMap[dateStr][s.productId] = [];
      }
      const prices = s.items?.map(i => i.detectedPrice).filter((p): p is number => p !== null && p !== undefined) || [];
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        dayMap[dateStr][s.productId].push(minPrice);
      }
    });

    const dateListWithTs = Object.keys(dayMap).map(dateStr => {
      const matchingScan = completedScans90d.find(s => {
        const dStr = new Date(s.startedAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric'
        });
        return dStr === dateStr;
      });
      return {
        dateStr,
        ts: matchingScan ? new Date(matchingScan.startedAt).getTime() : 0
      };
    }).sort((a, b) => a.ts - b.ts);

    let chartData = dateListWithTs.map(item => {
      const row: any = { date: item.dateStr };
      selectedProds.forEach(p => {
        const prices = dayMap[item.dateStr][p.id] || [];
        if (prices.length > 0) {
          const minPrice = Math.min(...prices);
          const deviationPct = ((minPrice - p.mapPrice) / p.mapPrice) * 100;
          row[p.sku] = parseFloat(deviationPct.toFixed(2));
        } else {
          row[p.sku] = undefined;
        }
      });
      return row;
    });

    // Interpolate missing values
    selectedProds.forEach(p => {
      let lastKnownVal = 0;
      chartData.forEach(row => {
        if (row[p.sku] !== undefined) {
          lastKnownVal = row[p.sku];
        } else {
          row[p.sku] = lastKnownVal;
        }
      });
    });

    const isSample = chartData.length === 0;
    if (isSample) {
      const samplePoints = 7;
      const today = new Date();
      chartData = Array.from({ length: samplePoints }).map((_, idx) => {
        const d = new Date();
        d.setDate(today.getDate() - (samplePoints - 1 - idx) * 15);
        const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        
        const row: any = { date: dateStr };
        selectedProds.forEach((p, pIdx) => {
          const phase = (idx * 1.5) + (pIdx * 2);
          let deviation = Math.sin(phase) * 8 - 4;
          deviation += Math.cos(idx * 3) * 2;
          row[p.sku] = parseFloat(deviation.toFixed(2));
        });
        return row;
      });
    }

    return {
      data: chartData,
      selectedProds,
      isSample
    };
  };

  const getTwoProductHistoryData = () => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const prodA = products.find(p => p.id === historyProductAId);
    const prodB = products.find(p => p.id === historyProductBId);

    if (!prodA && !prodB) return { data: [], prodA: null, prodB: null, isSample: false, correlation: null };

    // Find completed scans in last 90 days
    const completedScans90d = (scans || []).filter(s => {
      if (s.status !== 'completed') return false;
      const d = new Date(s.startedAt);
      return d >= ninetyDaysAgo;
    });

    const dayMap: { [dateStr: string]: { [prodId: string]: number[] } } = {};
    
    completedScans90d.forEach(s => {
      const dateStr = new Date(s.startedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
      if (!dayMap[dateStr]) {
        dayMap[dateStr] = {};
      }
      if (!dayMap[dateStr][s.productId]) {
        dayMap[dateStr][s.productId] = [];
      }
      const prices = s.items?.map(i => i.detectedPrice).filter((p): p is number => p !== null && p !== undefined) || [];
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        dayMap[dateStr][s.productId].push(minPrice);
      }
    });

    const dateListWithTs = Object.keys(dayMap).map(dateStr => {
      const matchingScan = completedScans90d.find(s => {
        const dStr = new Date(s.startedAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric'
        });
        return dStr === dateStr;
      });
      return {
        dateStr,
        ts: matchingScan ? new Date(matchingScan.startedAt).getTime() : 0
      };
    }).sort((a, b) => a.ts - b.ts);

    let chartData = dateListWithTs.map(item => {
      const row: any = { date: item.dateStr };
      if (prodA) {
        const prices = dayMap[item.dateStr][prodA.id] || [];
        if (prices.length > 0) {
          const minPrice = Math.min(...prices);
          const deviationPct = ((minPrice - prodA.mapPrice) / prodA.mapPrice) * 100;
          row[prodA.sku] = parseFloat(deviationPct.toFixed(2));
        } else {
          row[prodA.sku] = undefined;
        }
      }
      if (prodB) {
        const prices = dayMap[item.dateStr][prodB.id] || [];
        if (prices.length > 0) {
          const minPrice = Math.min(...prices);
          const deviationPct = ((minPrice - prodB.mapPrice) / prodB.mapPrice) * 100;
          row[prodB.sku] = parseFloat(deviationPct.toFixed(2));
        } else {
          row[prodB.sku] = undefined;
        }
      }
      return row;
    });

    // Interpolate missing values
    [prodA, prodB].forEach(p => {
      if (!p) return;
      let lastKnownVal = 0;
      chartData.forEach(row => {
        if (row[p.sku] !== undefined) {
          lastKnownVal = row[p.sku];
        } else {
          row[p.sku] = lastKnownVal;
        }
      });
    });

    const isSample = chartData.length === 0;
    if (isSample) {
      const samplePoints = 10;
      const today = new Date();
      chartData = Array.from({ length: samplePoints }).map((_, idx) => {
        const d = new Date();
        d.setDate(today.getDate() - (samplePoints - 1 - idx) * 10);
        const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        
        const row: any = { date: dateStr };
        const marketTrend = Math.sin(idx * 0.8) * 6 - 3;
        
        if (prodA) {
          const randomNoise = Math.cos(idx * 1.5) * 2;
          row[prodA.sku] = parseFloat((marketTrend + randomNoise).toFixed(2));
        }
        if (prodB) {
          const randomNoise = Math.sin(idx * 2) * 3 - 2;
          row[prodB.sku] = parseFloat((marketTrend * 1.2 + randomNoise).toFixed(2));
        }
        return row;
      });
    }

    let correlationText = "No direct data points to correlate.";
    let correlationValue = 0;
    let correlationType = "neutral";

    if (prodA && prodB && chartData.length > 1) {
      const valsA = chartData.map(r => r[prodA.sku]).filter(v => v !== undefined) as number[];
      const valsB = chartData.map(r => r[prodB.sku]).filter(v => v !== undefined) as number[];

      if (valsA.length === valsB.length && valsA.length > 0) {
        const meanA = valsA.reduce((sum, v) => sum + v, 0) / valsA.length;
        const meanB = valsB.reduce((sum, v) => sum + v, 0) / valsB.length;
        
        let num = 0;
        let denA = 0;
        let denB = 0;
        
        for (let i = 0; i < valsA.length; i++) {
          const diffA = valsA[i] - meanA;
          const diffB = valsB[i] - meanB;
          num += diffA * diffB;
          denA += diffA * diffA;
          denB += diffB * diffB;
        }
        
        if (denA > 0 && denB > 0) {
          correlationValue = num / Math.sqrt(denA * denB);
          if (correlationValue > 0.7) {
            correlationText = `Highly Correlated (${(correlationValue * 100).toFixed(0)}% positive correlation). Both SKUs exhibit synchronized pricing shifts, pointing to shared rogue resellers or general market repricing dynamics.`;
            correlationType = "positive_strong";
          } else if (correlationValue > 0.3) {
            correlationText = `Moderately Correlated (${(correlationValue * 100).toFixed(0)}% positive correlation). They share general directional trends, though independent retailer actions are also present.`;
            correlationType = "positive_moderate";
          } else if (correlationValue < -0.3) {
            correlationText = `Inversely Correlated (${(correlationValue * 100).toFixed(0)}% negative correlation). One product's MAP violations correspond to stability in the other, suggesting substitution behavior or targeted competitor promotions.`;
            correlationType = "negative";
          } else {
            correlationText = `Weakly Correlated (${(correlationValue * 100).toFixed(0)}% correlation). Their compliance behaviors appear independent, suggesting unique market factors or different seller networks.`;
            correlationType = "weak";
          }
        }
      }
    }

    return {
      data: chartData,
      prodA,
      prodB,
      isSample,
      correlation: {
        text: correlationText,
        value: correlationValue,
        type: correlationType
      }
    };
  };

  const startEditProductPrice = (product: Product) => {
    setEditingPriceMapId(product.id);
    setEditedPriceStr(String(product.mapPrice));
    setEditingPriceError(null);
  };

  const saveProductPrice = async (product: Product) => {
    const parsedPrice = parseFloat(editedPriceStr);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setEditingPriceError("Price must be a valid positive number");
      return;
    }

    if (onUpdateProduct) {
      const activeThreshold = product.mapThresholdPercent !== undefined 
        ? product.mapThresholdPercent 
        : product.customMapThresholdPercent;
      await onUpdateProduct(product.id, product.name, product.sku, parsedPrice, product.description, product.imageUrl, activeThreshold);
      setEditingPriceMapId(null);
      // Re-fetch audit logs to capture trace event chronologically
      fetchAuditLogs(product.id);
    }
  };

  const startEditProductThreshold = (product: Product) => {
    setEditingThresholdMapId(product.id);
    const currentPct = product.mapThresholdPercent !== undefined 
      ? product.mapThresholdPercent 
      : (product.customMapThresholdPercent !== undefined ? product.customMapThresholdPercent : 80);
    setEditedThresholdStr(String(currentPct));
    setEditingThresholdError(null);
  };

  const saveProductThreshold = async (product: Product, overridePct?: number) => {
    let targetPct: number | undefined;
    if (overridePct !== undefined) {
      targetPct = overridePct;
    } else {
      if (!editedThresholdStr || editedThresholdStr.trim() === "") {
        targetPct = undefined; // reset to global default
      } else {
        const parsed = parseFloat(editedThresholdStr);
        if (isNaN(parsed) || parsed < 1 || parsed > 100) {
          setEditingThresholdError("Threshold % must be between 1 and 100");
          return;
        }
        targetPct = parsed;
      }
    }

    if (onUpdateProduct) {
      await onUpdateProduct(
        product.id,
        product.name,
        product.sku,
        product.mapPrice,
        product.description,
        product.imageUrl,
        targetPct
      );
      setEditingThresholdMapId(null);
      fetchAuditLogs(product.id);
    }
  };

  const openQuickThresholdModal = (product: Product) => {
    setQuickThresholdModalProduct(product);
    const activePct = product.mapThresholdPercent !== undefined 
      ? product.mapThresholdPercent 
      : (product.customMapThresholdPercent !== undefined ? product.customMapThresholdPercent : 80);
    setModalThresholdVal(activePct);
  };

  const handleApplyModalThreshold = async () => {
    if (!quickThresholdModalProduct) return;
    await saveProductThreshold(quickThresholdModalProduct, modalThresholdVal);
    setQuickThresholdModalProduct(null);
  };

  const handleResetModalThresholdToDefault = async () => {
    if (!quickThresholdModalProduct) return;
    if (onUpdateProduct) {
      await onUpdateProduct(
        quickThresholdModalProduct.id,
        quickThresholdModalProduct.name,
        quickThresholdModalProduct.sku,
        quickThresholdModalProduct.mapPrice,
        quickThresholdModalProduct.description,
        quickThresholdModalProduct.imageUrl,
        undefined // clears custom override, restoring 80% global default
      );
      fetchAuditLogs(quickThresholdModalProduct.id);
    }
    setQuickThresholdModalProduct(null);
  };

  // Dynamic Map Distribution Stats for high-fidelity compliance metrics visualization
  const chartData = React.useMemo(() => {
    let lowCount = 0;
    let highCount = 0;

    products.forEach(p => {
      const hash = p.sku.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const variancePercent = ((hash % 30) - 15); // -15% to +14% variance
      const estimatedMarketAverage = Math.max(p.mapPrice * (1 + (variancePercent / 100)), 1);
      const isLowPrice = p.mapPrice < estimatedMarketAverage;
      if (isLowPrice) {
        lowCount++;
      } else {
        highCount++;
      }
    });

    return [
      { name: "Low MAP Threshold", count: lowCount, color: "#f59e0b", label: "Low MAP" },
      { name: "High MAP Threshold", count: highCount, color: "#6366f1", label: "High MAP" },
    ];
  }, [products]);

  // Real-time Input Validation States
  const [skuError, setSkuError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);

  const validateSkuId = (value: string): string | null => {
    if (!value) return "SKU ID is required";
    if (value.length < 3) return "SKU must be at least 3 characters";
    if (value.length > 32) return "SKU must be 32 characters or fewer";
    
    // Alphanumeric + hyphens + underscores only. No spaces or dynamic symbols.
    const skuRegex = /^[A-Z0-9-_]+$/i;
    if (!skuRegex.test(value)) {
      return "SKU must contain only letters, numbers, hyphens (-), and underscores (_)";
    }
    return null;
  };

  const validatePriceValue = (value: string): string | null => {
    if (!value) return "MAP price is required";
    const num = parseFloat(value);
    if (isNaN(num)) return "MAP price must be a valid number";
    if (num <= 0) return "Price must be greater than $0.00";
    
    // Check for max 2 decimal places
    const priceRegex = /^\d+(\.\d{1,2})?$/;
    if (!priceRegex.test(value)) {
      return "Price must have at most 2 decimal places (e.g. 199.99)";
    }
    return null;
  };

  const handleSkuChange = (val: string) => {
    // Automatically uppercase SKU codes for clean standardization
    const uppercased = val.toUpperCase();
    setSku(uppercased);
    
    // Live update validation once an error is shown or dynamically as they type
    if (skuError || uppercased.length >= 3) {
      setSkuError(validateSkuId(uppercased));
    }
  };

  const handlePriceChange = (val: string) => {
    setMapPrice(val);
    
    // Live update price errors
    if (priceError || val.length > 0) {
      setPriceError(validatePriceValue(val));
    }
  };

  // Bulk CSV States
  const [isDragging, setIsDragging] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [showPasteForm, setShowPasteForm] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // High-fidelity Preview Staging States
  const [csvPreviewItems, setCsvPreviewItems] = useState<Array<{
    name: string;
    sku: string;
    mapPrice: number;
    description: string;
    mapThresholdPercent?: number;
    status: "valid" | "invalid";
    error?: string;
    row: number;
  }> | null>(null);
  const [previewSource, setPreviewSource] = useState<string | null>(null);

  const handleProcessCSVData = (text: string, source: string) => {
    try {
      Papa.parse<string[]>(text, {
        skipEmptyLines: "greedy",
        complete: (results) => {
          const rows = results.data;
          if (!rows || rows.length === 0) {
            setImportFeedback({
              type: "error",
              text: `No records found in CSV resource: ${source}`
            });
            return;
          }

          let nameIdx = 0;
          let skuIdx = 1;
          let priceIdx = 2;
          let threshIdx = -1;
          let descIdx = 3;

          let startIndex = 0;
          const firstRow = rows[0].map(c => (c || "").toLowerCase().trim());
          const hasHeader = firstRow.some(cell => cell.includes("sku") || cell.includes("name") || cell.includes("price") || cell.includes("map") || cell.includes("desc") || cell.includes("threshold") || cell.includes("pct") || cell.includes("%"));

          if (hasHeader) {
            startIndex = 1;
            const sIdx = firstRow.findIndex(cell => cell.includes("sku"));
            if (sIdx !== -1) skuIdx = sIdx;
            const nIdx = firstRow.findIndex(cell => cell.includes("name") || cell.includes("product") || cell.includes("title"));
            if (nIdx !== -1) nameIdx = nIdx;
            const pIdx = firstRow.findIndex(cell => cell.includes("price") || cell.includes("map") || cell.includes("cost") || cell.includes("msrp"));
            if (pIdx !== -1) priceIdx = pIdx;
            const tIdx = firstRow.findIndex(cell => cell.includes("threshold") || cell.includes("pct") || cell.includes("%") || cell.includes("override"));
            if (tIdx !== -1) threshIdx = tIdx;
            const dIdx = firstRow.findIndex(cell => cell.includes("desc") || cell.includes("detail") || cell.includes("summary"));
            if (dIdx !== -1) descIdx = dIdx;
          }

          const previewRows: Array<{
            name: string;
            sku: string;
            mapPrice: number;
            description: string;
            mapThresholdPercent?: number;
            status: "valid" | "invalid";
            error?: string;
            row: number;
          }> = [];

          for (let i = startIndex; i < rows.length; i++) {
            const rowValues = rows[i];
            if (!rowValues || rowValues.length === 0 || (rowValues.length === 1 && !rowValues[0])) continue;

            const rNum = i + 1; // 1-based row number
            const nameVal = (rowValues[nameIdx] || "").trim();
            const skuVal = (rowValues[skuIdx] || "").trim().toUpperCase();
            const priceStr = (rowValues[priceIdx] || "").trim().replace(/[$,]/g, '');
            
            // Check for threshold column or auto position 3 if length > 4 without header
            let threshValStr = "";
            if (threshIdx !== -1) {
              threshValStr = (rowValues[threshIdx] || "").trim().replace(/[%]/g, '');
            } else if (!hasHeader && rowValues.length >= 5) {
              // Position 3 is threshold, position 4 is description
              threshValStr = (rowValues[3] || "").trim().replace(/[%]/g, '');
              descIdx = 4;
            }
            
            const descVal = rowValues[descIdx] ? (rowValues[descIdx] || "").trim() : "";
            const parsedThreshPct = threshValStr && !isNaN(parseFloat(threshValStr)) && parseFloat(threshValStr) > 0 ? parseFloat(threshValStr) : undefined;

            if (!nameVal) {
              previewRows.push({
                name: "[Missing Name]",
                sku: skuVal || "[Missing SKU]",
                mapPrice: 0,
                description: descVal,
                mapThresholdPercent: parsedThreshPct,
                status: "invalid",
                error: "Product Name is missing",
                row: rNum
              });
              continue;
            }

            const skuErr = validateSkuId(skuVal);
            if (skuErr) {
              previewRows.push({
                name: nameVal,
                sku: skuVal || "[Missing SKU]",
                mapPrice: 0,
                description: descVal,
                mapThresholdPercent: parsedThreshPct,
                status: "invalid",
                error: `SKU: ${skuErr}`,
                row: rNum
              });
              continue;
            }

            const priceErr = validatePriceValue(priceStr);
            if (priceErr) {
              previewRows.push({
                name: nameVal,
                sku: skuVal,
                mapPrice: 0,
                description: descVal,
                mapThresholdPercent: parsedThreshPct,
                status: "invalid",
                error: `MAP Price: ${priceErr}`,
                row: rNum
              });
              continue;
            }

            const priceNum = parseFloat(priceStr);
            previewRows.push({
              name: nameVal,
              sku: skuVal,
              mapPrice: priceNum,
              description: descVal,
              mapThresholdPercent: parsedThreshPct,
              status: "valid",
              row: rNum
            });
          }

          if (previewRows.length === 0) {
            setImportFeedback({
              type: "error",
              text: `No valid or invalid rows to parse in ${source}. Please check the layout headers.`
            });
            return;
          }

          setCsvPreviewItems(previewRows);
          setPreviewSource(source);
          
          const validCount = previewRows.filter(r => r.status === "valid").length;
          setImportFeedback({
            type: "success",
            text: `Parsed ${validCount} valid items (out of ${previewRows.length} total rows) from ${source}. Review the list below and click 'Confirm Bulk Import' to complete onboarding.`
          });
        },
        error: (err) => {
          setImportFeedback({
            type: "error",
            text: `PapaParse failed to read CSV structure: ${err.message}`
          });
        }
      });
    } catch (err) {
      setImportFeedback({
        type: "error",
        text: `Failed scanning file structure: ${(err as Error).message}`
      });
    }
  };

  const handleCommitBulkImport = async () => {
    if (!csvPreviewItems) return;
    const validItems = csvPreviewItems.filter(item => item.status === "valid");
    if (validItems.length === 0) {
      setImportFeedback({
        type: "error",
        text: "Cannot import: No valid records in the current preview staging area."
      });
      return;
    }

    try {
      if (onBulkAddProducts) {
        await onBulkAddProducts(validItems.map(item => ({
          name: item.name,
          sku: item.sku,
          mapPrice: item.mapPrice,
          description: item.description,
          mapThresholdPercent: item.mapThresholdPercent
        })));
      } else {
        // Fallback: add iteratively
        for (const item of validItems) {
          onAddProduct(item.name, item.sku, item.mapPrice, item.description, undefined, item.mapThresholdPercent);
        }
      }

      setImportFeedback({
        type: "success",
        text: `Successfully imported and protected ${validItems.length} products into active monitoring!`
      });
      setCsvPreviewItems(null);
      setPreviewSource(null);
      setPastedText("");
    } catch (err) {
      setImportFeedback({
        type: "error",
        text: `Failed bulk import operation: ${(err as Error).message || err}`
      });
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        handleProcessCSVData(text, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        handleProcessCSVData(text, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleImportPastedCSV = () => {
    if (!pastedText.trim()) return;
    handleProcessCSVData(pastedText, "direct text input");
  };

  const handleLoadSampleCSV = () => {
    setPastedText(
      "Apex Pro Keyboard, APEX-PRO-MK1, 199.99, 85, High-fidelity gaming mechanical keyboard\n" +
      "Soundwave Pro Headset, SNDWR-ANC-9, 149.50, 80, Active noise cancellation audio suite\n" +
      "Omni Light Kit, OMNI-LED-V2, 89.99, 90, Custom ambient multi-zone backlighting panel\n" +
      "Command mousepad XL, CMD-MPAD, 29.99, 75, Extra large clean workspace surface microtexture"
    );
    setShowPasteForm(true);
    setImportFeedback({
      type: "success",
      text: "Sample catalog data loaded! Review the records in the preview block and click 'Parse & Import'."
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const sErr = validateSkuId(sku);
    const pErr = validatePriceValue(mapPrice);

    if (sErr || pErr) {
      setSkuError(sErr);
      setPriceError(pErr);
      return;
    }

    if (!name) return;
    
    const parsedThreshold = customMapThresholdPercent.trim() !== "" ? parseFloat(customMapThresholdPercent) : undefined;
    onAddProduct(name, sku, parseFloat(mapPrice), description, imageUrl, parsedThreshold);
    setName("");
    setSku("");
    setMapPrice("");
    setCustomMapThresholdPercent("");
    setDescription("");
    setImageUrl("");
    setSkuError(null);
    setPriceError(null);
  };

  // Helper to calculate product compliance status
  const getProductComplianceStatus = (product: Product) => {
    const productScans = (scans || []).filter(s => s.productId === product.id);
    const completedScans = productScans.filter(s => s.status === 'completed');
    const violations = completedScans
      .flatMap(s => (s.items || []).map(item => ({ ...item, scanDate: s.startedAt, scanId: s.id })))
      .filter(item => item.status === 'violating');

    const count = violations.length;
    if (count >= 2) return "critical";
    if (count > 0) return "violating";
    return "compliant";
  };

  const compliantCount = products.filter(p => getProductComplianceStatus(p) === "compliant").length;
  const violatingCount = products.filter(p => getProductComplianceStatus(p) === "violating").length;
  const criticalCount = products.filter(p => getProductComplianceStatus(p) === "critical").length;

  const handleResetSkuFilters = () => {
    setSearchQuery("");
    setComplianceFilter("all");
    setSkuSortBy("name-asc");
  };

  const filteredProducts = products.filter(p => {
    // 1. Keyword search (Name, SKU, Description)
    const q = searchQuery.toLowerCase().trim();
    const matchesKeyword = !q || 
      (p.name || "").toLowerCase().includes(q) || 
      (p.sku || "").toLowerCase().includes(q) || 
      (p.description || "").toLowerCase().includes(q);

    if (!matchesKeyword) return false;

    // 2. Compliance status filter
    const status = getProductComplianceStatus(p);
    if (complianceFilter === "compliant" && status !== "compliant") return false;
    if (complianceFilter === "violating" && status !== "violating" && status !== "critical") return false;
    if (complianceFilter === "critical" && status !== "critical") return false;

    return true;
  }).sort((a, b) => {
    if (skuSortBy === "name-asc") {
      return (a.name || "").localeCompare(b.name || "");
    }
    if (skuSortBy === "name-desc") {
      return (b.name || "").localeCompare(a.name || "");
    }
    if (skuSortBy === "price-high") {
      return b.mapPrice - a.mapPrice;
    }
    if (skuSortBy === "price-low") {
      return a.mapPrice - b.mapPrice;
    }
    if (skuSortBy === "violations-desc") {
      const vA = (scans || []).filter(s => s.productId === a.id && s.status === 'completed')
        .flatMap(s => (s.items || []).filter(item => item.status === 'violating')).length;
      const vB = (scans || []).filter(s => s.productId === b.id && s.status === 'completed')
        .flatMap(s => (s.items || []).filter(item => item.status === 'violating')).length;
      return vB - vA;
    }
    if (skuSortBy === "breach-intensity-desc") {
      const getBreachIntensity = (p: Product) => {
        if (!p.mapPrice || p.mapPrice <= 0) return 0;
        const pScans = (scans || []).filter(s => s.productId === p.id && s.status === 'completed');
        const violations = pScans.flatMap(s => (s.items || []).filter(item => item.status === 'violating'));
        if (violations.length === 0) return 0;
        const maxPct = Math.max(...violations.map(v => {
          const deficit = Math.max(0, p.mapPrice - (v.detectedPrice || 0));
          return (deficit / p.mapPrice) * 100;
        }));
        return isFinite(maxPct) ? maxPct : 0;
      };
      const intensityA = getBreachIntensity(a);
      const intensityB = getBreachIntensity(b);
      if (intensityB !== intensityA) {
        return intensityB - intensityA;
      }
    }
    if (skuSortBy === "scan-frequency-desc") {
      const countA = (scans || []).filter(s => s.productId === a.id).length;
      const countB = (scans || []).filter(s => s.productId === b.id).length;
      if (countB !== countA) {
        return countB - countA;
      }
    }
    return 0;
  });

  const handleDownloadTemplate = () => {
    try {
      const headers = ["Name", "SKU", "MAP Price ($)", "MAP Threshold (%)", "Description"];
      const sampleData = [
        ["Apex Pro Mechanical Keyboard", "APEX-PRO-MK1", "199.99", "85", "Premium gaming mechanical keyboard"],
        ["ProFocus 4K Ultra Webcam", "PRO-FOCUS-4K", "129.50", "90", "High-fidelity professional camera suite"],
        ["PureStream Wave Microphone", "PSTRM-WAVE", "89.99", "80", "Pro-grade studio cardioid microphone"]
      ];

      const escapeCSVField = (val: string) => {
        const str = (val || "").toString().replace(/"/g, '""');
        if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
          return `"${str}"`;
        }
        return str;
      };

      const rows = sampleData.map(row => [
        escapeCSVField(row[0]),
        escapeCSVField(row[1]),
        row[2],
        row[3],
        escapeCSVField(row[4])
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "MAPShield-Catalog-Import-Template.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed downloading CSV template:", err);
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = [
        "Product Name",
        "SKU Code",
        "MAP Threshold ($)",
        "Compliance Status",
        "Active Violations Count",
        "Lowest Observed Price ($)",
        "Description"
      ];

      const escapeCSVField = (val: string) => {
        const str = (val || "").toString().replace(/"/g, '""');
        if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
          return `"${str}"`;
        }
        return str;
      };

      const rows = filteredProducts.map(p => {
        const status = getProductComplianceStatus(p);
        let statusText = "Compliant";
        if (status === "critical") statusText = "Critical Alert";
        else if (status === "violating") statusText = "Violating / At-Risk";

        const productScans = (scans || []).filter(s => s.productId === p.id);
        const completedScans = productScans.filter(s => s.status === 'completed');
        const violations = completedScans
          .flatMap(s => (s.items || []).map(item => ({ ...item, scanDate: s.startedAt, scanId: s.id })))
          .filter(item => item.status === 'violating');

        const violationCount = violations.length;
        const lowestObservedPrice = violations.length > 0
          ? Math.min(...violations.map(v => v.detectedPrice)).toFixed(2)
          : "N/A";

        return [
          escapeCSVField(p.name),
          escapeCSVField(p.sku),
          p.mapPrice.toFixed(2),
          escapeCSVField(statusText),
          violationCount,
          lowestObservedPrice,
          escapeCSVField(p.description)
        ];
      });

      const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      let prefix = "MAPShield";
      try {
        const saved = localStorage.getItem("mapshield_whitelabel_config");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.brandName) prefix = parsed.brandName.replace(/\s+/g, '-');
        }
      } catch (e) {}

      const dateStr = new Date().toISOString().split("T")[0];
      const filterSuffix = complianceFilter !== "all" ? `-${complianceFilter}` : "";
      link.setAttribute("download", `${prefix}-Filtered-SKUs${filterSuffix}-${dateStr}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const handleExportJSON = () => {
    try {
      let prefix = "MAPShield";
      try {
        const saved = localStorage.getItem("mapshield_whitelabel_config");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.brandName) prefix = parsed.brandName.replace(/\s+/g, '-');
        }
      } catch (e) {}

      const exportData = {
        catalogName: `${prefix} Product SKU Catalog`,
        exportedAt: new Date().toISOString(),
        totalProducts: filteredProducts.length,
        complianceFilter: complianceFilter,
        products: filteredProducts.map(p => {
          const status = getProductComplianceStatus(p);
          let statusText = "compliant";
          if (status === "critical") statusText = "critical";
          else if (status === "violating") statusText = "at-risk";

          const productScans = (scans || []).filter(s => s.productId === p.id);
          const completedScans = productScans.filter(s => s.status === 'completed');
          const violations = completedScans
            .flatMap(s => (s.items || []).map(item => ({ ...item, scanDate: s.startedAt, scanId: s.id })))
            .filter(item => item.status === 'violating');

          const activeThreshold = p.mapThresholdPercent !== undefined 
            ? p.mapThresholdPercent 
            : (p.customMapThresholdPercent !== undefined ? p.customMapThresholdPercent : 80);

          const dollarFloor = (p.mapPrice * activeThreshold) / 100;

          return {
            id: p.id,
            name: p.name,
            sku: p.sku,
            mapPrice: p.mapPrice,
            mapThresholdPercent: activeThreshold,
            minimumPriceFloor: dollarFloor,
            description: p.description,
            imageUrl: p.imageUrl || null,
            complianceStatus: statusText,
            activeViolationsCount: violations.length,
            lowestObservedPrice: violations.length > 0 ? Math.min(...violations.map(v => v.detectedPrice)) : null
          };
        })
      };

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportData, null, 2))}`;
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      const filterSuffix = complianceFilter !== "all" ? `-${complianceFilter}` : "";
      link.setAttribute("href", jsonString);
      link.setAttribute("download", `${prefix}-SKU-Catalog${filterSuffix}-${dateStr}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export JSON failed:", err);
    }
  };

  const handleDownloadProductJson = (product: Product) => {
    try {
      const productScans = (scans || []).filter(s => s.productId === product.id);
      const sortedProductScans = [...productScans].sort((a, b) => 
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );

      // Violations from completed scans
      const violations = sortedProductScans
        .filter(s => s.status === 'completed')
        .flatMap(s => (s.items || []).map(item => ({ 
          partnerId: item.partnerId,
          partnerName: item.partnerName,
          partnerDomain: item.partnerDomain,
          detectedPrice: item.detectedPrice,
          priceDifference: product.mapPrice - (item.detectedPrice || 0),
          percentDifference: item.detectedPrice ? ((product.mapPrice - item.detectedPrice) / product.mapPrice) * 100 : 0,
          status: item.status,
          scanDate: s.startedAt, 
          scanId: s.id 
        })))
        .filter(item => item.status === 'violating');

      const configVolume = estimatedVolumes[product.id] !== undefined ? estimatedVolumes[product.id] : 350;
      const simDisc = simulatedDiscounts[product.id] !== undefined ? simulatedDiscounts[product.id] : 15;
      const simRet = simulatedRetailers[product.id] !== undefined ? simulatedRetailers[product.id] : 3;

      const auditLogs = productAuditLogs[product.id] || [];

      const fullData = {
        exportMetadata: {
          generatedAt: new Date().toISOString(),
          brandProtectionVersion: "MAPShield v2.5",
          authorEmail: "gocloudboy2@gmail.com"
        },
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          mapPrice: product.mapPrice,
          description: product.description || "No description provided."
        },
        metrics: {
          totalScansRun: productScans.length,
          totalCompletedScans: productScans.filter(s => s.status === 'completed').length,
          totalDetectedViolations: violations.length,
          hasRecurringViolations: violations.length >= 2,
          currentRiskLevel: violations.length >= 3 ? "CRITICAL" : violations.length >= 1 ? "MODERATE" : "COMPLIANT"
        },
        financialImpactSimulation: {
          estimatedSalesVolumeMonthly: configVolume,
          simulatedDiscountPercent: simDisc,
          simulatedRetailersCount: simRet,
          calculatedProjectedMonthlyLoss: violations.length > 0 ? (configVolume * (violations.reduce((sum, item) => sum + Math.max(product.mapPrice - (item.detectedPrice || 0), 0), 0) / violations.length)) : 0
        },
        violationHistory: violations,
        auditLogs: auditLogs
      };

      const jsonString = JSON.stringify(fullData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("download", `MAPShield_SKU_Audit_${product.sku.replace(/[^a-z0-9]/gi, '_').toUpperCase()}_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Log the action to server audit-logs API
      fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "audit_intelligence",
          message: `Exported full SKU JSON audit data for "${product.name}" (SKU: ${product.sku}).`,
          details: `Includes metadata, ${violations.length} violations, and audit history.`,
          user: "Compliance Officer"
        })
      }).catch(err => console.error("Failed to post audit log:", err));

    } catch (err) {
      console.error("Failed to download product JSON data:", err);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="products-tab-container">
      {/* Onboard SKU Form */}
      <div className="lg:col-span-1 space-y-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 space-y-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              Onboard Product
            </h2>
            <p className="text-xs text-slate-400">
              Set policy parameters for products in your core catalog requiring MAP compliance enforcement. This protects catalog premium thresholds.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Item Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Apex Pro Mechanical Keyboard"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-700"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">SKU ID</label>
                <input 
                  type="text" 
                  required
                  value={sku}
                  onChange={e => handleSkuChange(e.target.value)}
                  placeholder="e.g. APEX-PRO-MK1"
                  className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none placeholder:text-slate-700 font-mono transition-colors ${
                    skuError 
                      ? "border-rose-500/50 focus:border-rose-500 bg-rose-500/5" 
                      : "border-slate-800 focus:border-indigo-500"
                  }`}
                />
                {skuError && (
                  <p className="mt-1.5 text-[10px] text-rose-400 font-sans leading-relaxed flex items-start gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{skuError}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">MAP Price ($)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <DollarSign className="w-4 h-4" />
                  </span>
                  <input 
                    type="text" 
                    required
                    value={mapPrice}
                    onChange={e => handlePriceChange(e.target.value)}
                    placeholder="199.99"
                    className={`w-full bg-slate-950 border rounded-xl pl-9 pr-4 py-3 text-sm text-slate-200 focus:outline-none placeholder:text-slate-700 font-mono transition-colors ${
                      priceError 
                        ? "border-rose-500/50 focus:border-rose-500 bg-rose-500/5" 
                        : "border-slate-800 focus:border-indigo-500"
                    }`}
                  />
                </div>
                {priceError && (
                  <p className="mt-1.5 text-[10px] text-rose-400 font-sans leading-relaxed flex items-start gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{priceError}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Custom MAP Threshold (%) Section */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                  Custom MAP Threshold (%)
                </label>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                  Global Default: 80%
                </span>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <input 
                    type="number" 
                    min="1"
                    max="100"
                    step="0.5"
                    value={customMapThresholdPercent}
                    onChange={e => setCustomMapThresholdPercent(e.target.value)}
                    placeholder="80 (Leave blank for default 80%)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 font-mono font-bold text-xs pointer-events-none">
                    %
                  </span>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-mono text-slate-500 mr-1">Presets:</span>
                  {[75, 80, 85, 90, 95].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setCustomMapThresholdPercent(String(pct))}
                      className={`px-2 py-1 text-[10px] font-mono font-bold rounded-lg border transition ${
                        customMapThresholdPercent === String(pct)
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
                      }`}
                    >
                      {pct}%{pct === 80 ? " (Default)" : ""}
                    </button>
                  ))}
                  {customMapThresholdPercent !== "" && (
                    <button
                      type="button"
                      onClick={() => setCustomMapThresholdPercent("")}
                      className="px-2 py-1 text-[10px] font-mono font-bold rounded-lg border bg-rose-950/30 text-rose-400 border-rose-900/40 hover:bg-rose-900/50 transition ml-auto"
                    >
                      Clear Override
                    </button>
                  )}
                </div>

                {/* Live Real-Time Dollar Calculation Box */}
                {(() => {
                  const numPrice = parseFloat(mapPrice);
                  const effectivePct = customMapThresholdPercent.trim() !== "" && !isNaN(parseFloat(customMapThresholdPercent))
                    ? parseFloat(customMapThresholdPercent)
                    : 80;
                  const isOverride = customMapThresholdPercent.trim() !== "" && parseFloat(customMapThresholdPercent) !== 80;
                  const effectiveFloor = !isNaN(numPrice) ? (numPrice * effectivePct) / 100 : 0;
                  const defaultFloor = !isNaN(numPrice) ? (numPrice * 80) / 100 : 0;

                  return (
                    <div className="mt-2.5 p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono">
                        <span className="text-slate-400 text-[11px]">Effective MAP Floor:</span>
                        <span className="text-emerald-400 font-bold text-sm">
                          ${!isNaN(numPrice) ? effectiveFloor.toFixed(2) : "0.00"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        {isOverride ? (
                          <span className="text-purple-300 font-medium">
                            ★ Custom product override active: {effectivePct}% threshold requiring min price floor of ${effectiveFloor.toFixed(2)} (vs ${defaultFloor.toFixed(2)} global default).
                          </span>
                        ) : (
                          <span>Using global baseline threshold of 80% (${defaultFloor.toFixed(2)} floor).</span>
                        )}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Description</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                placeholder="Brief summary of specific options or model year details..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Product Thumbnail Image URL (Optional)</label>
              <div className="flex gap-3 items-center">
                <input 
                  type="url" 
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-... or custom image URL"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-700"
                />
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Thumbnail Preview"
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-xl object-cover border border-slate-800 bg-slate-950 shrink-0 shadow-sm"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center text-slate-600 shrink-0">
                    <ImageIcon className="w-5 h-5 text-slate-600" />
                  </div>
                )}
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-3.5 px-4 bg-indigo-500 hover:bg-indigo-400 font-bold text-white rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" />
              Onboard & Protect Price
            </button>
          </form>
        </div>

        {/* Bulk CSV Import Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 space-y-5 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
              Bulk Import SKU Catalog
            </h2>
            <p className="text-xs text-slate-400">
              Onboard multiple premium items instantly using standard CSV spreadsheets.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="w-full py-2.5 px-4 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-md select-none"
            id="download-csv-template-btn"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            Download CSV Template
          </button>

          {/* Feedback Area */}
          {importFeedback && (
            <div className={`p-4 rounded-xl text-xs flex items-start gap-2.5 animate-fade-in ${
              importFeedback.type === "success" 
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
            }`}>
              {importFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span className="font-sans text-[11px] font-medium leading-relaxed">{importFeedback.text}</span>
            </div>
          )}

          {/* Interactive Staging and Preview Workspace */}
          {csvPreviewItems ? (
            <div className="space-y-4 border border-indigo-900/30 bg-indigo-950/5 p-4 rounded-xl animate-fade-in">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800/80">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">Staging Preview</span>
                  <span className="text-xs text-slate-200 block truncate max-w-[200px] font-medium" title={previewSource || "pasted data"}>
                    📁 {previewSource || "Direct Copy-Paste"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCsvPreviewItems(null);
                    setPreviewSource(null);
                    setImportFeedback(null);
                  }}
                  className="px-2.5 py-1 text-[10px] font-mono text-slate-400 hover:text-rose-400 bg-zinc-900 hover:bg-rose-950/20 border border-zinc-800 hover:border-rose-900/50 rounded transition cursor-pointer font-bold uppercase"
                >
                  Cancel & Reset
                </button>
              </div>

              {/* Counters */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 bg-emerald-950/20 border border-emerald-900/30 rounded-lg">
                  <span className="text-xs font-mono text-emerald-500 block">Ready to Import</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    {csvPreviewItems.filter(r => r.status === "valid").length}
                  </span>
                </div>
                <div className="p-2 bg-rose-950/20 border border-rose-900/30 rounded-lg">
                  <span className="text-xs font-mono text-rose-500 block font-semibold">Errors Found</span>
                  <span className="text-lg font-bold text-rose-400 font-mono">
                    {csvPreviewItems.filter(r => r.status === "invalid").length}
                  </span>
                </div>
              </div>

              {/* Scrollable Preview List */}
              <div className="max-h-56 overflow-y-auto border border-zinc-900 bg-zinc-950/90 rounded-xl divide-y divide-zinc-900/60 p-1.5 custom-scrollbar">
                {csvPreviewItems.map((item, idx) => (
                  <div key={idx} className="p-2 flex flex-col gap-1 text-[11px] font-sans">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.status === "valid" ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                        )}
                        <span className="text-slate-200 font-medium truncate" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                      <span className="font-mono text-slate-400 text-[10px] shrink-0 font-bold bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                        ${item.mapPrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1.5 text-[9.5px] font-mono text-slate-500">
                      <span>Row {item.row} • SKU: <strong className="text-slate-400">{item.sku}</strong></span>
                      {item.status === "invalid" && (
                        <span className="text-rose-400 bg-rose-950/40 border border-rose-900/30 px-1 py-0.5 rounded text-[8.5px] leading-none shrink-0 font-semibold max-w-[150px] truncate" title={item.error}>
                          {item.error}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Commit Button */}
              <button
                type="button"
                onClick={handleCommitBulkImport}
                disabled={csvPreviewItems.filter(r => r.status === "valid").length === 0}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 select-none"
              >
                <Plus className="w-4 h-4" />
                Confirm Bulk Onboarding ({csvPreviewItems.filter(r => r.status === "valid").length} items)
              </button>
            </div>
          ) : (
            <>
              {/* Drag and Drop Zone */}
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2 select-none ${
                  isDragging 
                    ? "border-indigo-500 bg-indigo-500/5 text-indigo-300" 
                    : "border-slate-800 hover:border-slate-755 bg-slate-950/40 text-slate-400 hover:text-slate-300"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-indigo-400 mb-1" />
                <span className="text-xs font-semibold text-slate-200">Drag & drop your CSV file here</span>
                <span className="text-[10px] text-slate-500 font-mono">or click to browse local files</span>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,.txt"
                  className="hidden" 
                />
              </div>

              {/* Guidelines & Paste Box */}
              <div className="space-y-3.5 pt-1">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  <span>Expected column layout:</span>
                  <button 
                    type="button"
                    onClick={handleLoadSampleCSV}
                    className="text-indigo-400 hover:text-indigo-300 cursor-pointer font-bold lowercase hover:underline"
                  >
                    (load sample data)
                  </button>
                </div>
                
                <div className="p-3 bg-slate-950 rounded-lg text-[10px] font-mono text-slate-400 leading-snug divide-y divide-slate-900">
                  <div className="pb-1 text-slate-500">Name, SKU, Price, Description</div>
                  <div className="pt-1 text-[9px] text-slate-600">e.g. Apex Pro Screen, APEX-SCR-1, 249.99, Premium IPS Panel</div>
                </div>

                <div className="text-xs">
                  <button
                    type="button"
                    onClick={() => setShowPasteForm(!showPasteForm)}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer transition"
                  >
                    {showPasteForm ? "Hide text import workspace" : "Or copy & paste spreadsheet rows..."}
                  </button>

                  {showPasteForm && (
                    <div className="mt-3 space-y-2 animate-fade-in">
                      <textarea
                        rows={4}
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        placeholder="e.g.&#10;Apex Pro Keyboard, APEX-PRO-MK1, 199.99, High-fidelity key switches&#10;Silent Mouse, SLNT-MSE-X, 49.99, Ergonomic clickers"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono placeholder:text-slate-700 leading-relaxed"
                      />
                      <button
                        type="button"
                        onClick={handleImportPastedCSV}
                        className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-white border border-indigo-500/20 font-bold uppercase text-[10px] font-mono tracking-wider rounded-xl transition cursor-pointer"
                      >
                        Parse & Preview pasted records
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Catalog Registry (Right 2 Cols) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800" id="catalog-tab-switcher">
          <button
            type="button"
            onClick={() => setActiveCatalogTab("registry")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
              activeCatalogTab === "registry"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Tag className="w-4 h-4" />
            <span className="hidden sm:inline">Catalog Registry & Distribution</span>
            <span className="inline sm:hidden">Registry</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCatalogTab("comparison")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
              activeCatalogTab === "comparison"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
            id="comparative-analysis-tab-btn"
          >
            <GitCompare className="w-4 h-4" />
            <span className="hidden sm:inline">Comparative Analysis</span>
            <span className="inline sm:hidden">Comparison</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCatalogTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
              activeCatalogTab === "history"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
            id="interactive-history-tab-btn"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Interactive History</span>
            <span className="inline sm:hidden">History</span>
          </button>
        </div>

        {/* Dynamic MAP Valuation Distribution Stats Visualization */}
        {activeCatalogTab === "registry" && products.length > 0 && (
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  Market Position Monitoring
                </span>
                <h3 className="text-base font-bold text-slate-200">MAP Threshold Distribution</h3>
              </div>
              <div className="flex gap-4 font-mono text-[11px] self-start sm:self-auto">
                <div className="flex items-center gap-1.5 bg-slate-950/50 px-2.5 py-1 rounded-lg border border-slate-800">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-slate-500">Low MAP:</span>
                  <span className="text-amber-400 font-bold">{chartData[0].count}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950/50 px-2.5 py-1 rounded-lg border border-slate-800">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span className="text-slate-500">High MAP:</span>
                  <span className="text-indigo-400 font-bold">{chartData[1].count}</span>
                </div>
              </div>
            </div>

            <div className="h-44 w-full font-mono text-[10px] select-none pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                  barSize={40}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    stroke="#475569" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                  />
                  <YAxis 
                    stroke="#475569" 
                    tickLine={false} 
                    axisLine={false}
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-xl font-mono text-xs space-y-1">
                            <p className="font-semibold text-slate-200">{data.name}</p>
                            <p className="text-indigo-450">
                              <span className="text-slate-500 text-[10px]">SKU Volume: </span>
                              <span className="font-bold text-white text-sm">{data.count}</span>
                            </p>
                            <p className="text-[10px] text-slate-500 max-w-[200px] leading-relaxed pt-1 border-t border-slate-800/80 mt-1">
                              {data.label === "Low MAP" 
                                ? "SKUs with a listed MAP price below their estimated market average."
                                : "SKUs listed at or above the estimated market average limit."}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Comparative Analysis Tab Content */}
        {activeCatalogTab === "comparison" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 rounded-2xl p-6 space-y-5 shadow-xl relative overflow-hidden animate-fade-in" id="sku-comparison-hub">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
            <div className="flex flex-col sm:flex-row sm:items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-3">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                  <GitCompare className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  Comparative Deep Dive Analysis
                </span>
                <h3 className="text-base font-bold text-slate-200">SKU Side-by-Side Comparison</h3>
                <p className="text-xs text-slate-500">Select two different catalog items to evaluate MAP thresholds, 30-day/lifetime breaches, and price deviations.</p>
              </div>
              {compareProductAId && compareProductBId && (
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={handleDownloadComparisonPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-rose-600/10 hover:shadow-rose-600/20 transition duration-150 cursor-pointer"
                    id="download-comparison-pdf-btn"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Download PDF Report</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadComparison}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition duration-150 cursor-pointer"
                    id="download-comparison-csv-btn"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              )}
            </div>

            {products.length < 2 ? (
              <div className="p-8 rounded-xl border border-dashed border-slate-800 text-center bg-slate-900/10">
                <Tag className="w-8 h-8 text-indigo-500 mx-auto mb-3 opacity-60" />
                <p className="text-xs text-slate-400 font-semibold mb-1">Insufficient SKU Volume</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">You need to onboard at least 2 products in the catalog to perform comparative analyses.</p>
              </div>
            ) : (
              <>
                {/* Selection Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">SKU Candidate A</label>
                    <select
                      value={compareProductAId}
                      onChange={(e) => setCompareProductAId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
                      id="compare-product-a-select"
                    >
                      <option value="">-- Select Product A --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id} disabled={p.id === compareProductBId}>
                          {p.sku} - {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">SKU Candidate B</label>
                    <select
                      value={compareProductBId}
                      onChange={(e) => setCompareProductBId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
                      id="compare-product-b-select"
                    >
                      <option value="">-- Select Product B --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id} disabled={p.id === compareProductAId}>
                          {p.sku} - {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Comparative Table */}
                {(() => {
                  if (!compareProductAId || !compareProductBId) {
                    return (
                      <div className="p-8 rounded-xl border border-dashed border-slate-800 text-center bg-slate-900/10">
                        <Sparkles className="w-6 h-6 text-indigo-500 mx-auto mb-2 opacity-60" />
                        <p className="text-xs text-slate-400 font-semibold mb-1">Select Candidates</p>
                        <p className="text-[11px] text-slate-500 max-w-xs mx-auto">Please select two different products above to compile comparative MAP statistics.</p>
                      </div>
                    );
                  }

                  const statsA = getComparisonStats(compareProductAId);
                  const statsB = getComparisonStats(compareProductBId);

                  if (!statsA || !statsB) return null;

                  // Helper for risk badge styling
                  const getRiskBadge = (level: "Low" | "Medium" | "High" | "Critical") => {
                    const styles = {
                      Low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                      Medium: "bg-amber-500/10 text-amber-550 border-amber-500/20",
                      High: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                      Critical: "bg-rose-500/20 text-red-400 border-rose-500/30 font-extrabold animate-pulse",
                    };
                    return (
                      <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${styles[level]}`}>
                        {level}
                      </span>
                    );
                  };

                  return (
                    <div className="space-y-4">
                      <div className="overflow-x-auto rounded-xl border border-slate-800">
                        <table className="w-full text-left border-collapse font-sans text-xs">
                          <thead>
                            <tr className="bg-slate-950/70 border-b border-slate-800">
                              <th className="p-3 text-slate-500 font-mono text-[10px] uppercase tracking-wider w-1/3">Metrics Parameter</th>
                              <th className="p-3 font-semibold text-indigo-450 max-w-[200px] truncate">{statsA.product.name}</th>
                              <th className="p-3 font-semibold text-emerald-400 max-w-[200px] truncate">{statsB.product.name}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850/60 text-slate-300">
                            <tr>
                              <td className="p-3 text-slate-500 font-mono text-[10px] uppercase tracking-wider bg-slate-950/20">SKU Code</td>
                              <td className="p-3 font-mono font-bold text-slate-200">{statsA.product.sku}</td>
                              <td className="p-3 font-mono font-bold text-slate-200">{statsB.product.sku}</td>
                            </tr>
                            <tr>
                              <td className="p-3 text-slate-500 font-mono text-[10px] uppercase tracking-wider bg-slate-950/20">MAP Threshold</td>
                              <td className="p-3 font-mono text-emerald-400 font-bold">${(statsA.product?.mapPrice ?? 0).toFixed(2)}</td>
                              <td className="p-3 font-mono text-emerald-400 font-bold">${(statsB.product?.mapPrice ?? 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td className="p-3 text-slate-500 font-mono text-[10px] uppercase tracking-wider bg-slate-950/20">Breach Frequency (Last 30 Days)</td>
                              <td className="p-3 font-mono">
                                <span className={`text-[11px] ${statsA.scansWithViolationsCount30d > 0 ? "text-rose-400 font-bold" : "text-slate-400"}`}>
                                  {statsA.breachFrequencyStr30d}
                                </span>
                              </td>
                              <td className="p-3 font-mono">
                                <span className={`text-[11px] ${statsB.scansWithViolationsCount30d > 0 ? "text-rose-400 font-bold" : "text-slate-400"}`}>
                                  {statsB.breachFrequencyStr30d}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td className="p-3 text-slate-500 font-mono text-[10px] uppercase tracking-wider bg-slate-950/20">Breach Frequency (Lifetime)</td>
                              <td className="p-3 font-mono">
                                <span className={`text-[11px] ${statsA.scansWithViolationsCount > 0 ? "text-rose-400/80" : "text-slate-450"}`}>
                                  {statsA.breachFrequencyStr}
                                </span>
                              </td>
                              <td className="p-3 font-mono">
                                <span className={`text-[11px] ${statsB.scansWithViolationsCount > 0 ? "text-rose-400/80" : "text-slate-450"}`}>
                                  {statsB.breachFrequencyStr}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td className="p-3 text-slate-500 font-mono text-[10px] uppercase tracking-wider bg-slate-950/20 font-bold">Average Price Deviation (Last 30 Days)</td>
                              <td className="p-3 font-mono font-bold">
                                {statsA.avgDeviationVal30d > 0 ? (
                                  <span className="text-rose-400">
                                    -${statsA.avgDeviationVal30d.toFixed(2)} (-{statsA.avgDeviationPct30d.toFixed(1)}%)
                                  </span>
                                ) : (
                                  <span className="text-emerald-400 font-semibold">$0.00 (0.0%)</span>
                                )}
                              </td>
                              <td className="p-3 font-mono font-bold">
                                {statsB.avgDeviationVal30d > 0 ? (
                                  <span className="text-rose-400">
                                    -${statsB.avgDeviationVal30d.toFixed(2)} (-{statsB.avgDeviationPct30d.toFixed(1)}%)
                                  </span>
                                ) : (
                                  <span className="text-emerald-400 font-semibold">$0.00 (0.0%)</span>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td className="p-3 text-slate-500 font-mono text-[10px] uppercase tracking-wider bg-slate-950/20">Avg Deficit Ratio (Overall)</td>
                              <td className="p-3 font-mono text-rose-400 font-bold font-display">
                                {statsA.avgDeviationPct > 0 ? `-${statsA.avgDeviationPct.toFixed(1)}%` : "0.0%"}
                              </td>
                              <td className="p-3 font-mono text-rose-400 font-bold font-display">
                                {statsB.avgDeviationPct > 0 ? `-${statsB.avgDeviationPct.toFixed(1)}%` : "0.0%"}
                              </td>
                            </tr>
                            <tr>
                              <td className="p-3 text-slate-500 font-mono text-[10px] uppercase tracking-wider bg-slate-950/20 font-mono">Total Scans Conducted</td>
                              <td className="p-3 font-mono text-slate-300">{statsA.totalScansCount} total scans</td>
                              <td className="p-3 font-mono text-slate-300">{statsB.totalScansCount} total scans</td>
                            </tr>
                            <tr>
                              <td className="p-3 text-slate-500 font-mono text-[10px] uppercase tracking-wider bg-slate-950/20">Total Violations Flagged</td>
                              <td className="p-3 font-mono text-slate-350">
                                <span className={statsA.totalViolations > 0 ? "text-rose-400 font-semibold bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/10" : "text-slate-450"}>
                                  {statsA.totalViolations} infractions
                                </span>
                              </td>
                              <td className="p-3 font-mono text-slate-350">
                                <span className={statsB.totalViolations > 0 ? "text-rose-400 font-semibold bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/10" : "text-slate-450"}>
                                  {statsB.totalViolations} infractions
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td className="p-3 text-slate-500 font-mono text-[10px] uppercase tracking-wider bg-slate-950/20">Risk Exposure Class</td>
                              <td className="p-3">{getRiskBadge(statsA.riskLevel)}</td>
                              <td className="p-3">{getRiskBadge(statsB.riskLevel)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Interactive Price Evolution Chart */}
                      {(() => {
                        const evoData = getComparePriceEvolutionData(compareProductAId, compareProductBId);
                        
                        return (
                          <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 space-y-4 animate-fade-in" id="compare-modal-price-evolution-chart">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-900">
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                                  30-Day Price Evolution
                                </span>
                                <h4 className="text-xs font-bold text-slate-200">Interactive MAP Behavior Tracking</h4>
                              </div>
                              
                              {/* Chart Type Selector */}
                              <div className="flex bg-slate-950 border border-slate-800 p-0.5 rounded-lg text-[9px] font-mono self-start sm:self-auto">
                                <button
                                  type="button"
                                  onClick={() => setCompareChartType('absolute')}
                                  className={`px-2.5 py-1 rounded-md transition duration-150 cursor-pointer ${
                                    compareChartType === 'absolute'
                                      ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-900/40 font-bold'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  Absolute Price ($)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCompareChartType('deviation')}
                                  className={`px-2.5 py-1 rounded-md transition duration-150 cursor-pointer ${
                                    compareChartType === 'deviation'
                                      ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-900/40 font-bold'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  MAP Deviation (%)
                                </button>
                              </div>
                            </div>

                            {/* Chart render stage */}
                            <div className="h-64 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                {compareChartType === 'absolute' ? (
                                  <LineChart data={evoData.data} margin={{ top: 15, right: 10, left: -15, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis 
                                      dataKey="date" 
                                      stroke="#475569" 
                                      tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} 
                                      dy={5}
                                    />
                                    <YAxis 
                                      yAxisId="left"
                                      stroke="#6366f1"
                                      tick={{ fill: '#818cf8', fontSize: 10, fontFamily: 'monospace' }}
                                      domain={['auto', 'auto']}
                                    />
                                    <YAxis 
                                      yAxisId="right"
                                      orientation="right"
                                      stroke="#10b981"
                                      tick={{ fill: '#34d399', fontSize: 10, fontFamily: 'monospace' }}
                                      domain={['auto', 'auto']}
                                    />
                                    <Tooltip 
                                      contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '12px' }}
                                      labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                                      itemStyle={{ fontSize: '11px' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                    
                                    {/* Product A */}
                                    <Line 
                                      yAxisId="left"
                                      name={`${statsA.product.sku} Price`}
                                      type="monotone" 
                                      dataKey="priceA" 
                                      stroke="#6366f1" 
                                      strokeWidth={2.5}
                                      activeDot={{ r: 6 }} 
                                    />
                                    <ReferenceLine 
                                      yAxisId="left"
                                      y={statsA.product?.mapPrice || 0} 
                                      label={{ value: `${statsA.product?.sku || 'A'} MAP`, fill: '#818cf8', position: 'top', fontSize: 8 }} 
                                      stroke="#818cf8" 
                                      strokeDasharray="4 4" 
                                    />

                                    {/* Product B */}
                                    <Line 
                                      yAxisId="right"
                                      name={`${statsB.product?.sku || 'B'} Price`}
                                      type="monotone" 
                                      dataKey="priceB" 
                                      stroke="#10b981" 
                                      strokeWidth={2.5}
                                      activeDot={{ r: 6 }} 
                                    />
                                    <ReferenceLine 
                                      yAxisId="right"
                                      y={statsB.product?.mapPrice || 0} 
                                      label={{ value: `${statsB.product?.sku || 'B'} MAP`, fill: '#34d399', position: 'bottom', fontSize: 8 }} 
                                      stroke="#34d399" 
                                      strokeDasharray="4 4" 
                                    />
                                  </LineChart>
                                ) : (
                                  <LineChart data={evoData.data} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis 
                                      dataKey="date" 
                                      stroke="#475569" 
                                      tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} 
                                      dy={5}
                                    />
                                    <YAxis 
                                      stroke="#94a3b8"
                                      tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                                      unit="%"
                                    />
                                    <Tooltip 
                                      contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '12px' }}
                                      labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                                      itemStyle={{ fontSize: '11px' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                    <ReferenceLine 
                                      y={0} 
                                      stroke="#ef4444" 
                                      strokeWidth={1.5}
                                      label={{ value: 'MAP Boundary (0%)', fill: '#ef4444', position: 'top', fontSize: 8 }} 
                                    />
                                    <Line 
                                      name={`${statsA.product.sku} MAP Dev`}
                                      type="monotone" 
                                      dataKey="devA" 
                                      stroke="#6366f1" 
                                      strokeWidth={2.5}
                                      activeDot={{ r: 6 }} 
                                    />
                                    <Line 
                                      name={`${statsB.product.sku} MAP Dev`}
                                      type="monotone" 
                                      dataKey="devB" 
                                      stroke="#10b981" 
                                      strokeWidth={2.5}
                                      activeDot={{ r: 6 }} 
                                    />
                                  </LineChart>
                                )}
                              </ResponsiveContainer>
                            </div>
                            
                            <div className="text-[9px] font-mono text-slate-500 leading-normal bg-slate-950/20 p-2 rounded-lg border border-slate-900/50 flex items-start gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                              <span>
                                {evoData.isSample 
                                  ? "Note: Displaying synthesized price trajectory matrices because insufficient multi-partner compliance diagnostic scans are available in current databases."
                                  : "Live compliance stream: Pricing paths represent direct min-advertised values captured across all authorized reseller scraping pipelines."
                                }
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Visual Progress Bar chart overlay */}
                      <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 text-[11px] font-mono space-y-3">
                        <span className="text-slate-400 uppercase tracking-widest text-[9px] block">Relative 30-Day Deficit Exposure</span>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-slate-300 mb-1">
                              <span>{statsA.product.sku} ({statsA.product.name})</span>
                              <span className="text-rose-400">-{statsA.avgDeviationPct30d.toFixed(1)}% 30d deficit</span>
                            </div>
                            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(100, Math.max(statsA.avgDeviationPct30d * 4, statsA.avgDeviationPct30d > 0 ? 5 : 0))}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-slate-300 mb-1">
                              <span>{statsB.product.sku} ({statsB.product.name})</span>
                              <span className="text-rose-400">-{statsB.avgDeviationPct30d.toFixed(1)}% 30d deficit</span>
                            </div>
                            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(100, Math.max(statsB.avgDeviationPct30d * 4, statsB.avgDeviationPct30d > 0 ? 5 : 0))}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Reset/Clear Comparison button */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-1 gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={handleDownloadComparisonPDF}
                            className="px-3.5 py-2 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 rounded-xl text-[10px] font-mono text-rose-400 hover:text-rose-300 transition cursor-pointer flex items-center justify-center gap-1.5"
                            id="export-comparison-pdf-footer-btn"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Download PDF Report</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleDownloadComparison}
                            className="px-3.5 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 rounded-xl text-[10px] font-mono text-indigo-400 hover:text-indigo-300 transition cursor-pointer flex items-center justify-center gap-1.5"
                            id="export-comparison-csv-footer-btn"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export Comparison to CSV</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCompareProductAId("");
                            setCompareProductBId("");
                          }}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-[10px] font-mono text-slate-400 hover:text-slate-200 transition cursor-pointer text-center"
                        >
                          Reset Candidates Selection
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>

          {/* Multi-SKU 90-Day MAP Deviation History Chart Card */}
          {(() => {
            const { data: chartData, selectedProds, isSample } = getMultiProductHistoryData();
            const filteredProducts = products.filter(p => 
              p.name.toLowerCase().includes(multiSelectSearchQuery.toLowerCase()) ||
              p.sku.toLowerCase().includes(multiSelectSearchQuery.toLowerCase())
            );
            const lineColors = ["#6366f1", "#10b981", "#f43f5e", "#f59e0b", "#06b6d4", "#8b5cf6"];

            return (
              <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden animate-fade-in" id="multi-sku-trend-card">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      Multi-SKU Price Trajectory
                    </span>
                    <h3 className="text-base font-bold text-slate-200">90-Day MAP Deviation History</h3>
                    <p className="text-xs text-slate-500">
                      Compare long-term pricing deviations from MAP side-by-side. 0% is exact compliance. Negative values represent MAP violations.
                    </p>
                  </div>
                  {isSample && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 animate-pulse">
                      <Sparkles className="w-3.5 h-3.5" />
                      Sample Preview
                    </div>
                  )}
                </div>

                {/* Product Selector Container */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      Select products to compare ({selectedProds.length} selected)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMultiSelectCompareProductIds(products.map(p => p.id))}
                        className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-slate-700 text-[10px] font-mono">|</span>
                      <button
                        type="button"
                        onClick={() => setMultiSelectCompareProductIds([])}
                        className="text-[10px] font-mono text-slate-400 hover:text-slate-300 transition cursor-pointer"
                      >
                        Clear All
                      </button>
                      <span className="text-slate-700 text-[10px] font-mono">|</span>
                      <button
                        type="button"
                        onClick={() => setMultiSelectCompareProductIds(products.slice(0, 3).map(p => p.id))}
                        className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                      >
                        Reset Default
                      </button>
                    </div>
                  </div>

                  {/* Search Input for selection */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search products by SKU or Name to filter candidates..."
                      value={multiSelectSearchQuery}
                      onChange={(e) => setMultiSelectSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  {/* Horizontal scroll or flexible wrap list of clickable product tags */}
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 border border-slate-900 rounded-xl bg-slate-950/40">
                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-center w-full text-xs text-slate-600 font-mono">
                        No products found matching "{multiSelectSearchQuery}"
                      </div>
                    ) : (
                      filteredProducts.map(p => {
                        const isSelected = multiSelectCompareProductIds.includes(p.id);
                        return (
                          <button
                            type="button"
                            key={p.id}
                            onClick={() => {
                              if (isSelected) {
                                setMultiSelectCompareProductIds(prev => prev.filter(id => id !== p.id));
                              } else {
                                setMultiSelectCompareProductIds(prev => [...prev, p.id]);
                              }
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition duration-150 cursor-pointer border ${
                              isSelected
                                ? "bg-indigo-600/10 text-indigo-300 border-indigo-500/40 font-semibold"
                                : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-750 hover:bg-slate-850"
                            }`}
                          >
                            <div className={`w-3 h-3 rounded flex items-center justify-center border ${
                              isSelected ? "bg-indigo-500 border-indigo-500 text-slate-950" : "border-slate-700"
                            }`}>
                              {isSelected && (
                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className="font-mono text-[10px] bg-slate-950/70 px-1 py-0.5 rounded border border-slate-850 text-slate-350">
                              {p.sku}
                            </span>
                            <span className="truncate max-w-[150px]">{p.name}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Chart Render Block */}
                {selectedProds.length === 0 ? (
                  <div className="p-12 rounded-xl border border-dashed border-slate-850 text-center bg-slate-950/20">
                    <TrendingUp className="w-8 h-8 text-slate-500 mx-auto mb-3 opacity-40" />
                    <p className="text-xs text-slate-400 font-semibold mb-1">No SKUs Selected</p>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">Please toggle the checkboxes above to display the side-by-side 90-day price trends chart.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="h-80 w-full font-mono text-[10px] select-none">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#475569" 
                            fontSize={9} 
                            tickLine={false}
                            fontFamily="monospace"
                          />
                          <YAxis 
                            stroke="#475569" 
                            fontSize={9} 
                            tickLine={false} 
                            fontFamily="monospace"
                            tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`}
                            domain={['auto', 'auto']}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#0f172a', 
                              borderColor: '#334155', 
                              borderRadius: '0.75rem', 
                              fontSize: '11px', 
                              fontFamily: 'monospace',
                              color: '#e2e8f0'
                            }} 
                            itemStyle={{ padding: '2px 0' }}
                            formatter={(value: any, name: string) => {
                              const numVal = typeof value === 'number' ? value : parseFloat(value);
                              return [`${numVal > 0 ? '+' : ''}${numVal.toFixed(2)}% deviation`, name];
                            }}
                          />
                          <Legend 
                            wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingTop: '15px' }}
                          />
                          <ReferenceLine 
                            y={0} 
                            stroke="#ef4444" 
                            strokeDasharray="5 5" 
                            strokeWidth={1.5}
                            label={{ value: 'MAP Threshold (0%)', fill: '#f87171', fontSize: 9, position: 'top', fontFamily: 'monospace' }} 
                          />
                          {selectedProds.map((p, index) => (
                            <Line
                              key={p.id}
                              type="monotone"
                              dataKey={p.sku}
                              stroke={lineColors[index % lineColors.length]}
                              strokeWidth={2.5}
                              activeDot={{ r: 6 }}
                              name={`${p.sku} (${p.name})`}
                              dot={{ strokeWidth: 1, r: 2 }}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="p-3.5 bg-slate-950/40 border border-slate-900 rounded-xl text-[11px] text-slate-400 space-y-2">
                      <span className="font-bold text-slate-300 block uppercase tracking-wider text-[9px] font-mono">Legend Details & Analysis</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        {selectedProds.map((p, idx) => {
                          const color = lineColors[idx % lineColors.length];
                          return (
                            <div key={p.id} className="flex items-center gap-2 p-1.5 rounded bg-slate-900/60 border border-slate-850">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                              <div className="truncate font-mono text-[10px]">
                                <span className="font-bold text-slate-200">{p.sku}:</span>{" "}
                                <span className="text-slate-400">${p.mapPrice.toFixed(2)} MAP</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

        {/* Interactive History Tab Content */}
        {activeCatalogTab === "history" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden animate-fade-in" id="interactive-history-section">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
              
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    Interactive Compliance History
                  </span>
                  <h3 className="text-base font-bold text-slate-200">90-Day Price Trajectory & Correlation</h3>
                  <p className="text-xs text-slate-500">
                    Analyze the long-term relationship between two SKUs to discover shared reseller networks, substitution behavior, and synchronized violations.
                  </p>
                </div>
              </div>

              {products.length < 2 ? (
                <div className="p-8 rounded-xl border border-dashed border-slate-800 text-center bg-slate-900/10">
                  <Tag className="w-8 h-8 text-indigo-500 mx-auto mb-3 opacity-60" />
                  <p className="text-xs text-slate-400 font-semibold mb-1">Insufficient SKU Volume</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">Please add at least two products to your catalog to use the interactive history feature.</p>
                </div>
              ) : (
                <>
                  {/* Selectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">Product A (Primary SKU)</label>
                      <select
                        value={historyProductAId}
                        onChange={(e) => setHistoryProductAId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
                        id="history-product-a-select"
                      >
                        <option value="">-- Select Product A --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id} disabled={p.id === historyProductBId}>
                            {p.sku} - {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">Product B (Comparison SKU)</label>
                      <select
                        value={historyProductBId}
                        onChange={(e) => setHistoryProductBId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
                        id="history-product-b-select"
                      >
                        <option value="">-- Select Product B --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id} disabled={p.id === historyProductAId}>
                            {p.sku} - {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Actions & Swapper */}
                  {historyProductAId && historyProductBId && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                      <button
                        type="button"
                        onClick={handleDownloadTrendData}
                        className="w-full sm:w-auto px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl text-[11px] font-mono font-semibold text-indigo-400 hover:text-indigo-300 transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 shadow-inner"
                        id="download-trend-csv-btn"
                      >
                        <Download className="w-4 h-4 text-indigo-400" />
                        <span>Download Trend Data (CSV)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const temp = historyProductAId;
                          setHistoryProductAId(historyProductBId);
                          setHistoryProductBId(temp);
                        }}
                        className="w-full sm:w-auto px-3.5 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-750 rounded-xl text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <GitCompare className="w-3.5 h-3.5 rotate-90" />
                        <span>Swap Candidates</span>
                      </button>
                    </div>
                  )}

                  {/* Chart Render Block */}
                  {(!historyProductAId || !historyProductBId) ? (
                    <div className="p-12 rounded-xl border border-dashed border-slate-850 text-center bg-slate-950/20">
                      <Activity className="w-8 h-8 text-indigo-500 mx-auto mb-3 opacity-40" />
                      <p className="text-xs text-slate-400 font-semibold mb-1">Select SKUs to Plot Trajectories</p>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto">Please select both SKU products above to render their 90-day interactive history trajectories.</p>
                    </div>
                  ) : (() => {
                    const { data: chartData, prodA, prodB, isSample, correlation } = getTwoProductHistoryData();

                    // Generate the Timeline of Infractions List
                    const infractionsList: { date: string; sku: string; name: string; value: number; severity: "moderate" | "severe" | "critical" }[] = [];
                    chartData.forEach(row => {
                      [prodA, prodB].forEach(p => {
                        if (!p) return;
                        const val = row[p.sku];
                        if (val !== undefined && val < 0) {
                          if (val <= infractionThreshold) {
                            let severity: "moderate" | "severe" | "critical" = "moderate";
                            if (val <= -10.0) {
                              severity = "critical";
                            } else if (val <= -5.0) {
                              severity = "severe";
                            }
                            infractionsList.push({
                              date: row.date,
                              sku: p.sku,
                              name: p.name,
                              value: val,
                              severity
                            });
                          }
                        }
                      });
                    });
                    // Reverse to show newest infractions first
                    infractionsList.reverse();

                    const CustomDot = (props: any) => {
                      const { cx, cy, value, dataKey, payload } = props;
                      if (value === undefined || value === null) return null;

                      const isInfraction = value < 0;
                      const isSignificant = value <= infractionThreshold;

                      const isHovered = hoveredInfraction && hoveredInfraction.date === payload.date && hoveredInfraction.sku === dataKey;
                      const annotationKey = `${dataKey}-${payload.date}`;
                      const hasAnnotation = !!trendAnnotations[annotationKey];

                      const product = products.find(p => p.sku === dataKey);
                      const mapPrice = product ? product.mapPrice : 0;
                      const deviation = payload[dataKey] || 0;
                      const computedPrice = Number((mapPrice * (1 + deviation / 100)).toFixed(2));

                      const handleTriggerModal = () => {
                        setAnnotationInput(trendAnnotations[annotationKey] || "");
                        setAnnotationModal({
                          sku: dataKey,
                          pointName: payload.date,
                          price: computedPrice,
                          map: mapPrice,
                          deviation: deviation
                        });
                      };

                      return (
                        <g
                          className="cursor-pointer select-none"
                          onMouseEnter={() => setHoveredInfraction({ date: payload.date, sku: dataKey, value })}
                          onMouseLeave={() => setHoveredInfraction(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTriggerModal();
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleTriggerModal();
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            if (longPressTimer.current) clearTimeout(longPressTimer.current);
                            longPressTimer.current = setTimeout(() => {
                              handleTriggerModal();
                            }, 500);
                          }}
                          onMouseUp={(e) => {
                            e.stopPropagation();
                            if (longPressTimer.current) {
                              clearTimeout(longPressTimer.current);
                              longPressTimer.current = null;
                            }
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            if (longPressTimer.current) clearTimeout(longPressTimer.current);
                            longPressTimer.current = setTimeout(() => {
                              handleTriggerModal();
                            }, 500);
                          }}
                          onTouchEnd={() => {
                            if (longPressTimer.current) {
                              clearTimeout(longPressTimer.current);
                              longPressTimer.current = null;
                            }
                          }}
                        >
                          {/* Invisible hit area */}
                          <circle cx={cx} cy={cy} r={12} fill="transparent" stroke="none" />

                          {/* Pulsing ring if has annotation */}
                          {hasAnnotation && (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={isInfraction ? (isSignificant ? 11 : 7) : 5}
                              fill="none"
                              stroke={isInfraction ? "#ef4444" : "#6366f1"}
                              strokeWidth={1.5}
                              className="animate-ping"
                              style={{ transformOrigin: `${cx}px ${cy}px` }}
                            />
                          )}

                          {/* Dot styling based on types */}
                          {!isInfraction ? (
                            <circle 
                              cx={cx} 
                              cy={cy} 
                              r={hasAnnotation ? 4 : (isHovered ? 5 : 2)} 
                              stroke={hasAnnotation ? "#ffffff" : (dataKey === (prodA?.sku) ? "#6366f1" : "#10b981")} 
                              strokeWidth={hasAnnotation ? 1.5 : (isHovered ? 2 : 1)} 
                              fill={hasAnnotation ? (dataKey === (prodA?.sku) ? "#6366f1" : "#10b981") : (isHovered ? "#ffffff" : "#0f172a")} 
                            />
                          ) : !isSignificant ? (
                            <circle 
                              cx={cx} 
                              cy={cy} 
                              r={hasAnnotation ? 5.5 : (isHovered ? 6 : 3.5)} 
                              stroke={hasAnnotation ? "#ffffff" : "#ef4444"} 
                              strokeWidth={hasAnnotation ? 1.5 : 1}
                              fill="#ef4444" 
                              fillOpacity={hasAnnotation ? 1.0 : 0.6}
                            />
                          ) : (
                            <>
                              <circle
                                cx={cx}
                                cy={cy}
                                r={isHovered ? 14 : 9}
                                fill="#f43f5e"
                                fillOpacity={0.25}
                                className="animate-pulse"
                              />
                              <circle
                                cx={cx}
                                cy={cy}
                                r={hasAnnotation ? 6 : (isHovered ? 7 : 4.5)}
                                fill="#f43f5e"
                                stroke={hasAnnotation ? "#ffffff" : "#ffffff"}
                                strokeWidth={hasAnnotation ? 2.0 : 1.5}
                              />
                            </>
                          )}
                        </g>
                      );
                    };

                    const CustomTooltip = ({ active, payload, label }: any) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-2xl font-mono text-[10.5px] space-y-2">
                            <p className="text-slate-400 font-bold border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
                              <span>Date: {label}</span>
                              <span className="text-[8px] text-slate-500 font-normal uppercase">Click dot to annotate</span>
                            </p>
                            <div className="space-y-1">
                              {payload.map((entry: any, index: number) => {
                                const annotationKey = `${entry.dataKey}-${label}`;
                                const annotationText = trendAnnotations[annotationKey];
                                return (
                                  <div key={index} className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                      <span className="text-slate-200">
                                        {entry.name}: <span className="font-bold">{entry.value > 0 ? '+' : ''}{entry.value}%</span>
                                      </span>
                                    </div>
                                    {annotationText && (
                                      <div className="bg-indigo-950/40 border border-indigo-900/40 text-indigo-300 rounded px-2 py-1 text-[9.5px] max-w-[220px] leading-relaxed break-words font-sans">
                                        <span className="font-bold text-[8px] uppercase tracking-wider block text-indigo-400 font-mono">Note:</span>
                                        {annotationText}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    };

                    return (
                      <div className="space-y-6">
                        {/* Interactive Grid Layout: Chart & Timeline */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Left Column: Deviation Timeline Chart */}
                          <div className="lg:col-span-2 space-y-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">90-Day MAP Price Deviation Timeline (%)</span>
                                {isSample && (
                                  <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/25 uppercase tracking-wider">Synthesized Compliance History</span>
                                )}
                              </div>
                              
                              <div className="h-80 w-full font-mono text-[10px] select-none">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis 
                                      dataKey="date" 
                                      stroke="#475569" 
                                      fontSize={9} 
                                      tickLine={false}
                                      fontFamily="monospace"
                                    />
                                    <YAxis 
                                      stroke="#475569" 
                                      fontSize={9} 
                                      tickLine={false} 
                                      fontFamily="monospace"
                                      tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`}
                                      domain={['auto', 'auto']}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingTop: '15px' }} />
                                    <ReferenceLine 
                                      y={0} 
                                      stroke="#ef4444" 
                                      strokeDasharray="5 5" 
                                      strokeWidth={1.5}
                                      label={{ value: 'MAP Threshold (0%)', fill: '#f87171', fontSize: 9, position: 'top', fontFamily: 'monospace' }} 
                                    />
                                    {prodA && (
                                      <Line
                                        type="monotone"
                                        dataKey={prodA.sku}
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        activeDot={{ r: 6 }}
                                        name={`${prodA.sku} (${prodA.name})`}
                                        dot={<CustomDot />}
                                      />
                                    )}
                                    {prodB && (
                                      <Line
                                        type="monotone"
                                        dataKey={prodB.sku}
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        activeDot={{ r: 6 }}
                                        name={`${prodB.sku} (${prodB.name})`}
                                        dot={<CustomDot />}
                                      />
                                    )}
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Timeline of Infractions Visualizer Panel */}
                          <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-5 flex flex-col justify-between space-y-4">
                            <div className="space-y-3 flex-1 flex flex-col">
                              {/* Title Header with Icon */}
                              <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                                <div className="flex items-center gap-1.5">
                                  <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                                  <span className="text-[10px] font-mono text-rose-400 uppercase tracking-widest font-bold">
                                    Infractions Timeline
                                  </span>
                                </div>
                                <span className="text-[9px] bg-rose-950/40 border border-rose-900/40 text-rose-400 px-1.5 py-0.5 rounded font-mono font-bold">
                                  {infractionsList.length} breaches
                                </span>
                              </div>

                              {/* Interactive Threshold Slider */}
                              <div className="bg-slate-900/40 border border-slate-850/60 rounded-lg p-2.5 space-y-2">
                                <div className="flex justify-between items-center text-[9px] font-mono">
                                  <span className="text-slate-400 uppercase">Significance Filter</span>
                                  <span className="text-rose-400 font-bold">{infractionThreshold === 0 ? "Any < 0%" : `≤ ${infractionThreshold}%`}</span>
                                </div>
                                <input
                                  type="range"
                                  min="-10"
                                  max="0"
                                  step="0.5"
                                  value={infractionThreshold}
                                  onChange={(e) => setInfractionThreshold(parseFloat(e.target.value))}
                                  className="w-full accent-rose-500 bg-slate-950 rounded-lg appearance-none h-1.5 cursor-pointer"
                                />
                                <div className="flex justify-between text-[8px] font-mono text-slate-600">
                                  <span>0% (All deviations)</span>
                                  <span>-10% (Critical)</span>
                                </div>
                              </div>

                              {/* Scrollable Infractions List */}
                              <div className="flex-1 overflow-y-auto max-h-[190px] custom-scrollbar pr-1 space-y-2">
                                {infractionsList.length === 0 ? (
                                  <div className="py-8 text-center text-slate-500 flex flex-col items-center justify-center space-y-2 h-full">
                                    <ShieldCheck className="w-8 h-8 text-emerald-400" />
                                    <div className="space-y-0.5">
                                      <p className="text-[11px] font-sans font-bold text-slate-300">Perfect Compliance</p>
                                      <p className="text-[10px] text-slate-500 max-w-[180px] leading-normal">
                                        No historical breaches found matching or exceeding {infractionThreshold === 0 ? "0%" : `${infractionThreshold}%`}.
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  infractionsList.map((inf, idx) => {
                                    const isHovered = hoveredInfraction?.date === inf.date && hoveredInfraction?.sku === inf.sku;
                                    
                                    let badgeColor = "bg-amber-950/20 text-amber-500 border-amber-900/30";
                                    let severityLabel = "MODERATE";
                                    if (inf.severity === "critical") {
                                      badgeColor = "bg-red-950/40 text-red-400 border-red-900/40 animate-pulse";
                                      severityLabel = "CRITICAL";
                                    } else if (inf.severity === "severe") {
                                      badgeColor = "bg-orange-950/30 text-orange-400 border-orange-900/35";
                                      severityLabel = "SEVERE";
                                    }

                                    const annotationKey = `${inf.sku}-${inf.date}`;
                                    const hasNote = trendAnnotations[annotationKey];

                                    return (
                                      <div
                                        key={idx}
                                        onMouseEnter={() => setHoveredInfraction({ date: inf.date, sku: inf.sku, value: inf.value })}
                                        onMouseLeave={() => setHoveredInfraction(null)}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const product = products.find(p => p.sku === inf.sku);
                                          const mapPrice = product ? product.mapPrice : 0;
                                          const computedPrice = Number((mapPrice * (1 + inf.value / 100)).toFixed(2));
                                          setAnnotationInput(trendAnnotations[annotationKey] || "");
                                          setAnnotationModal({
                                            sku: inf.sku,
                                            pointName: inf.date,
                                            price: computedPrice,
                                            map: mapPrice,
                                            deviation: inf.value
                                          });
                                        }}
                                        className={`p-2 rounded-lg border transition-all duration-200 cursor-pointer text-[10.5px] select-none ${
                                          isHovered 
                                            ? "bg-rose-950/20 border-rose-500/50 translate-x-1 shadow-inner" 
                                            : "bg-slate-900/30 border-slate-850 hover:bg-slate-900/60 hover:border-slate-800"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between gap-1.5 mb-1">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                            <span className="font-mono text-[10px] font-bold text-slate-300 truncate" title={inf.name}>
                                              {inf.sku}
                                            </span>
                                          </div>
                                          <span className="font-mono text-[9px] text-slate-500 shrink-0">
                                            {inf.date}
                                          </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-1 text-[9.5px]">
                                          <span className="text-rose-400 font-mono font-bold">
                                            {inf.value.toFixed(2)}% deviation
                                          </span>
                                          <span className={`px-1.5 py-0.5 rounded font-mono text-[8px] font-bold border ${badgeColor}`}>
                                            {severityLabel}
                                          </span>
                                        </div>

                                        {hasNote && (
                                          <div className="mt-1.5 bg-indigo-950/45 border border-indigo-900/40 text-indigo-300 rounded p-1.5 text-[9px] font-sans leading-relaxed flex items-start gap-1">
                                            <Tag className="w-2.5 h-2.5 text-indigo-400 mt-0.5 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                              <span className="font-mono text-[7px] uppercase font-bold text-indigo-400 block tracking-wider mb-0.5">Annotated Note:</span>
                                              <p className="break-words">{hasNote}</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-900 text-[8.5px] font-mono text-slate-500 leading-normal">
                              💡 Hover timeline cards to highlight the breach event coordinates on the deviation trajectory chart.
                            </div>
                          </div>
                        </div>

                        {/* Interactive Behavior Correlation Panel */}
                        {correlation && (
                          <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-5 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5" />
                                Correlation Insights Engine
                              </span>
                              <div className="text-right">
                                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Pearson r</span>
                                <div className="text-xs font-mono font-bold text-slate-300">
                                  {correlation.value > 0 ? "+" : ""}{correlation.value.toFixed(3)}
                                </div>
                              </div>
                            </div>

                            {/* Correlation Meter Slider */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                                <span>-1.0 (Inversely Correlated)</span>
                                <span>0.0 (Independent)</span>
                                <span>+1.0 (Identical Action)</span>
                              </div>
                              <div className="relative h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                {/* Zero Line marker */}
                                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-700/60 z-10"></div>
                                {/* Value Pinpoint */}
                                <div 
                                  className={`absolute top-0 bottom-0 w-3 -ml-1.5 rounded-full z-25 ${
                                    correlation.type.includes("strong") 
                                      ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" 
                                      : correlation.type.includes("moderate") 
                                      ? "bg-indigo-400" 
                                      : correlation.type === "negative" 
                                      ? "bg-amber-500" 
                                      : "bg-slate-500"
                                  }`}
                                  style={{ left: `${((correlation.value + 1) / 2) * 100}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Interpretive Commentary */}
                            <div className="p-3.5 bg-slate-900/40 rounded-lg border border-slate-850/60 flex items-start gap-3">
                              <div className="mt-0.5">
                                {correlation.value > 0.5 ? (
                                  <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0" />
                                ) : correlation.value > 0.1 ? (
                                  <Activity className="w-5 h-5 text-indigo-300 shrink-0" />
                                ) : correlation.value < -0.1 ? (
                                  <TrendingUp className="w-5 h-5 text-amber-400 shrink-0" />
                                ) : (
                                  <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0" />
                                )}
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs font-bold text-slate-200">
                                  {correlation.value > 0.7 
                                    ? "Strong Positive Compliance Co-dependency" 
                                    : correlation.value > 0.3 
                                    ? "Moderate pricing synchrony" 
                                    : correlation.value < -0.3 
                                    ? "Significant Inverse Pricing Behavior" 
                                    : "Independent Pricing Behavior"}
                                </span>
                                <p className="text-[11px] leading-relaxed text-slate-400">
                                  {correlation.text}
                                </p>
                              </div>
                            </div>

                            {/* Deep stats side-by-side table */}
                            {prodA && prodB && (() => {
                              // Calculate metrics
                              const valuesA = chartData.map(r => r[prodA.sku]).filter(v => v !== undefined) as number[];
                              const valuesB = chartData.map(r => r[prodB.sku]).filter(v => v !== undefined) as number[];

                              const avgDevA = valuesA.length > 0 ? (valuesA.reduce((a, b) => a + b, 0) / valuesA.length) : 0;
                              const avgDevB = valuesB.length > 0 ? (valuesB.reduce((a, b) => a + b, 0) / valuesB.length) : 0;

                              const minDevA = valuesA.length > 0 ? Math.min(...valuesA) : 0;
                              const minDevB = valuesB.length > 0 ? Math.min(...valuesB) : 0;

                              const breachesA = valuesA.filter(v => v < -0.01).length;
                              const breachesB = valuesB.filter(v => v < -0.01).length;

                              const breachFreqA = valuesA.length > 0 ? ((breachesA / valuesA.length) * 100) : 0;
                              const breachFreqB = valuesB.length > 0 ? ((breachesB / valuesB.length) * 100) : 0;

                              return (
                                <div className="space-y-2 pt-2 border-t border-slate-900">
                                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Side-by-Side 90-Day Enriched Compliance Metrics</span>
                                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="col-span-1 p-2 rounded bg-slate-900/30 border border-slate-900 flex flex-col justify-center text-left">
                                      <span className="text-[10px] font-bold text-slate-400">Metric (90d)</span>
                                    </div>
                                    <div className="col-span-1 p-2 rounded bg-indigo-950/10 border border-indigo-900/20 text-indigo-300">
                                      <div className="font-bold truncate text-[10px] font-mono">{prodA.sku}</div>
                                      <span className="text-[9px] text-slate-500">Primary</span>
                                    </div>
                                    <div className="col-span-1 p-2 rounded bg-emerald-950/10 border border-emerald-900/20 text-emerald-300">
                                      <div className="font-bold truncate text-[10px] font-mono">{prodB.sku}</div>
                                      <span className="text-[9px] text-slate-500">Comparison</span>
                                    </div>

                                    {/* MAP Prices */}
                                    <div className="col-span-1 p-2 rounded bg-slate-900/30 border border-slate-900 text-left font-semibold text-slate-400">
                                      MAP Threshold
                                    </div>
                                    <div className="col-span-1 p-2 rounded bg-slate-900/50 border border-slate-850 text-slate-200 font-mono">
                                      ${prodA.mapPrice.toFixed(2)}
                                    </div>
                                    <div className="col-span-1 p-2 rounded bg-slate-900/50 border border-slate-850 text-slate-200 font-mono">
                                      ${prodB.mapPrice.toFixed(2)}
                                    </div>

                                    {/* Average Deviation */}
                                    <div className="col-span-1 p-2 rounded bg-slate-900/30 border border-slate-900 text-left font-semibold text-slate-400">
                                      Avg Price Deviation
                                    </div>
                                    <div className={`col-span-1 p-2 rounded bg-slate-900/50 border border-slate-850 font-mono ${avgDevA < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                                      {avgDevA > 0 ? "+" : ""}{avgDevA.toFixed(2)}%
                                    </div>
                                    <div className={`col-span-1 p-2 rounded bg-slate-900/50 border border-slate-850 font-mono ${avgDevB < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                                      {avgDevB > 0 ? "+" : ""}{avgDevB.toFixed(2)}%
                                    </div>

                                    {/* Maximum Violation Drop */}
                                    <div className="col-span-1 p-2 rounded bg-slate-900/30 border border-slate-900 text-left font-semibold text-slate-400">
                                      Worst Deviation
                                    </div>
                                    <div className={`col-span-1 p-2 rounded bg-slate-900/50 border border-slate-850 font-mono ${minDevA < 0 ? "text-rose-500 font-bold" : "text-slate-300"}`}>
                                      {minDevA > 0 ? "+" : ""}{minDevA.toFixed(2)}%
                                    </div>
                                    <div className={`col-span-1 p-2 rounded bg-slate-900/50 border border-slate-850 font-mono ${minDevB < 0 ? "text-rose-500 font-bold" : "text-slate-300"}`}>
                                      {minDevB > 0 ? "+" : ""}{minDevB.toFixed(2)}%
                                    </div>

                                    {/* Violation Frequency */}
                                    <div className="col-span-1 p-2 rounded bg-slate-900/30 border border-slate-900 text-left font-semibold text-slate-400">
                                      Breach Frequency
                                    </div>
                                    <div className={`col-span-1 p-2 rounded bg-slate-900/50 border border-slate-850 font-mono ${breachFreqA > 0 ? "text-rose-400" : "text-slate-400"}`}>
                                      {breachFreqA.toFixed(1)}% ({breachesA} of {valuesA.length})
                                    </div>
                                    <div className={`col-span-1 p-2 rounded bg-slate-900/50 border border-slate-850 font-mono ${breachFreqB > 0 ? "text-rose-400" : "text-slate-400"}`}>
                                      {breachFreqB.toFixed(1)}% ({breachesB} of {valuesB.length})
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {/* Breach Timeline visualizer below deviation chart mapping history of violations */}
                        {prodA && (
                          <SkuBreachTimeline 
                            product={prodA} 
                            scans={scans} 
                            className="mt-6"
                          />
                        )}
                        {prodB && (
                          <SkuBreachTimeline 
                            product={prodB} 
                            scans={scans} 
                            className="mt-6"
                          />
                        )}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        )}

        {activeCatalogTab === "registry" && (
          <>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold font-display flex items-center gap-2 text-white">
                  <Tag className="w-5 h-5 text-indigo-400" />
                  Protected Products Registry ({products.length})
                </h2>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {/* Compare Selected Button */}
                  <button 
                    id="compare-selected-btn"
                    type="button"
                    disabled={selectedCompareIds.length === 0}
                    onClick={() => setIsCompareModalOpen(true)}
                    className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl transition cursor-pointer font-sans text-xs font-semibold shrink-0 select-none ${
                      selectedCompareIds.length > 0 
                        ? "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-white border border-amber-500/30 font-bold"
                        : "bg-slate-900 text-slate-500 border border-slate-850 cursor-not-allowed opacity-50"
                    }`}
                    title={selectedCompareIds.length === 0 ? "Select products below to compare" : "Compare selected products side-by-side"}
                  >
                    <GitCompare className="w-4 h-4" />
                    <span>Compare Selected {selectedCompareIds.length > 0 ? `(${selectedCompareIds.length})` : ""}</span>
                  </button>

                  {/* Download Catalog Options (CSV & JSON) */}
                  {products.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={handleExportCSV}
                        id="download-catalog-csv-btn"
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 hover:text-white border border-indigo-500/20 transition cursor-pointer font-sans text-xs font-semibold shrink-0"
                        title="Download catalog as a CSV spreadsheet file"
                      >
                        <Download className="w-4 h-4 text-indigo-400" />
                        <span>Download CSV</span>
                      </button>

                      <button 
                        type="button"
                        onClick={handleExportJSON}
                        id="download-catalog-json-btn"
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 hover:text-white border border-purple-500/20 transition cursor-pointer font-sans text-xs font-semibold shrink-0"
                        title="Download catalog as a JSON data file"
                      >
                        <FileJson className="w-4 h-4 text-purple-400" />
                        <span>Download JSON</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Comprehensive SKU Search and Compliance Filter Component */}
              <SkuSearchFilter 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                complianceFilter={complianceFilter}
                onComplianceFilterChange={setComplianceFilter}
                sortBy={skuSortBy}
                onSortByChange={setSkuSortBy}
                totalProductsCount={products.length}
                filteredProductsCount={filteredProducts.length}
                compliantCount={compliantCount}
                violatingCount={violatingCount}
                criticalCount={criticalCount}
                onResetFilters={handleResetSkuFilters}
                onExportCSV={handleExportCSV}
                onExportJSON={handleExportJSON}
              />
            </div>

            {filteredProducts.length === 0 ? (
              <div className="p-12 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 text-center text-slate-400 shadow-sm space-y-3">
                <Tag className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-md font-semibold text-slate-300">
                  {products.length === 0 ? "No Products Registered" : "No SKUs Match Your Search or Filter"}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto font-mono">
                  {products.length === 0 
                    ? "Register pricing thresholds above or import a CSV catalog to activate MAP compliance tracking." 
                    : "Try adjusting your keyword query or resetting the active compliance status filter."}
                </p>
                {products.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetSkuFilters}
                    id="reset-sku-filters-empty-btn"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-bold transition cursor-pointer mt-2"
                  >
                    Reset Search & Filters
                  </button>
                )}
              </div>
            ) : (
          <div className="space-y-4">
            {filteredProducts.map(product => {
              // Deterministic estimated market average based on SKU contents
              const hash = product.sku.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
              const variancePercent = ((hash % 30) - 15); // -15% to +14% variance
              const estimatedMarketAverage = Math.max(product.mapPrice * (1 + (variancePercent / 100)), 1);
              const isLowPrice = product.mapPrice < estimatedMarketAverage;

              const isExpanded = expandedProductId === product.id;

              // Gather scans matching this product
              const productScans = (scans || []).filter(s => s.productId === product.id);
              const sortedProductScans = [...productScans].sort((a, b) => 
                new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
              );

              // Violations from completed scans
              const violations = sortedProductScans
                .filter(s => s.status === 'completed')
                .flatMap(s => (s.items || []).map(item => ({ ...item, scanDate: s.startedAt, scanId: s.id })))
                .filter(item => item.status === 'violating');

              const hasRecurringViolations = violations.length >= 2;

              return (
                <div 
                  key={product.id} 
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden group shadow-sm ${
                    isExpanded 
                      ? "border-indigo-550 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/20 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border-zinc-800" 
                      : hasRecurringViolations
                        ? "border-rose-900/40 hover:border-rose-500/40 bg-rose-950/5 shadow-md shadow-rose-950/5"
                        : "border-zinc-800 border-zinc-805/85 hover:border-zinc-700 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black"
                  }`}
                >
                  {/* Main Row / Header (clickable) */}
                  <div 
                    onClick={() => handleToggleExpand(product.id)}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden cursor-pointer select-none"
                  >
                    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl ${hasRecurringViolations ? "bg-rose-500/10" : "bg-indigo-500/5"}`}></div>
                    
                    <div className="flex items-start sm:items-center gap-3.5 z-10 flex-1 min-w-0">
                      {/* Product Thumbnail Image Badge */}
                      <div className="relative group/thumb shrink-0 self-start sm:self-center">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 rounded-xl object-cover border border-slate-800 bg-slate-950 group-hover/thumb:border-indigo-500/50 transition shadow-sm"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                              const sibling = (e.target as HTMLElement).nextElementSibling;
                              if (sibling) (sibling as HTMLElement).style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-14 h-14 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-black items-center justify-center text-slate-400 group-hover/thumb:border-indigo-500/40 transition shrink-0 shadow-sm ${
                            product.imageUrl ? 'hidden' : 'flex'
                          }`}
                        >
                          <Package className="w-6 h-6 text-indigo-400/80" />
                        </div>
                      </div>

                      <div className="space-y-1.5 max-w-lg flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          {/* Compare Checkbox */}
                          <label 
                            onClick={e => e.stopPropagation()} 
                            className="flex items-center gap-1.5 cursor-pointer select-none bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/20 px-2 py-1 rounded transition"
                            id={`compare-label-${product.id}`}
                          >
                            <input 
                              type="checkbox" 
                              checked={selectedCompareIds.includes(product.id)}
                              onChange={() => {
                                setSelectedCompareIds(prev => 
                                  prev.includes(product.id)
                                    ? prev.filter(id => id !== product.id)
                                    : [...prev, product.id]
                                );
                              }}
                              className="w-3.5 h-3.5 rounded border-slate-700 text-indigo-500 focus:ring-indigo-500/40 focus:ring-offset-0 bg-slate-950 accent-indigo-500 cursor-pointer"
                            />
                            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Compare</span>
                          </label>

                          {(() => {
                            const query = searchQuery.trim().toLowerCase();
                            const isSkuMatch = query && product.sku.toLowerCase().includes(query);
                            const isNameMatch = query && product.name.toLowerCase().includes(query);

                            return (
                              <>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition-all ${
                                  isSkuMatch
                                    ? "bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-sm shadow-amber-500/20 font-extrabold"
                                    : hasRecurringViolations 
                                      ? "bg-rose-500/10 text-rose-400 border-rose-450/20" 
                                      : "bg-indigo-500/10 text-indigo-400 border-indigo-400/20"
                                }`}>
                                  {product.sku}
                                </span>
                                <h3 className={`font-bold text-base flex flex-wrap items-center gap-1.5 transition-colors ${
                                  isNameMatch ? "text-indigo-300 underline underline-offset-4 decoration-indigo-500/50" : "text-slate-200"
                                }`}>
                                  {product.name}
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-slate-500 transition-colors group-hover:text-slate-300 shrink-0" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-500 transition-colors group-hover:text-slate-300 shrink-0" />
                                  )}
                                </h3>
                              </>
                            );
                          })()}
                          {hasRecurringViolations && (
                            <div className="flex items-center gap-1.5 ml-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold font-mono bg-rose-500/10 text-rose-450 border border-rose-500/20 uppercase tracking-wider animate-pulse whitespace-nowrap">
                                <AlertTriangle className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                                Alert
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold font-mono bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-widest whitespace-nowrap">
                                High-Priority
                              </span>
                            </div>
                          )}

                          {/* Smart Sort Active Badges */}
                          {(() => {
                            const breachDeficitPcts = violations.map(v => {
                              const deficit = Math.max(0, product.mapPrice - (v.detectedPrice || 0));
                              return product.mapPrice > 0 ? (deficit / product.mapPrice) * 100 : 0;
                            });
                            const maxDeficitPct = breachDeficitPcts.length > 0 ? Math.max(...breachDeficitPcts) : 0;

                            if (skuSortBy === "breach-intensity-desc") {
                              return (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold font-mono uppercase tracking-wider whitespace-nowrap border shadow-sm ${
                                  maxDeficitPct > 0 
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40" 
                                    : "bg-slate-900 text-slate-500 border-slate-800"
                                }`}>
                                  <Zap className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                                  {maxDeficitPct > 0 ? `Breach Deficit: -${maxDeficitPct.toFixed(1)}%` : "No Active Deficit"}
                                </span>
                              );
                            }
                            if (skuSortBy === "scan-frequency-desc") {
                              return (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase tracking-wider whitespace-nowrap shadow-sm">
                                  <Activity className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                                  Audits: {productScans.length} {productScans.length === 1 ? "Scan" : "Scans"}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <p className="text-xs text-slate-450 leading-relaxed truncate">
                          {product.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 justify-between sm:justify-end z-10">
                      {(() => {
                        const activeThreshPct = product.mapThresholdPercent !== undefined 
                          ? product.mapThresholdPercent 
                          : (product.customMapThresholdPercent !== undefined ? product.customMapThresholdPercent : 80);
                        const isCustomOverride = product.mapThresholdPercent !== undefined || product.customMapThresholdPercent !== undefined;
                        const dollarFloor = (product.mapPrice * activeThreshPct) / 100;

                        return (
                          <div className="text-right flex flex-col items-end">
                            <div className="flex items-center gap-1.5 mb-1">
                              {/* Custom vs Global Threshold Badge */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openQuickThresholdModal(product);
                                }}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider transition border cursor-pointer ${
                                  isCustomOverride
                                    ? "bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25"
                                    : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300"
                                }`}
                                title={`Click to adjust custom MAP threshold % (Current: ${activeThreshPct}%)`}
                              >
                                {isCustomOverride ? (
                                  <ShieldCheck className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                                ) : (
                                  <Shield className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                                )}
                                <span>{activeThreshPct}% MAP</span>
                                {isCustomOverride && <span className="text-[8px] text-purple-300 font-bold ml-0.5">(Custom)</span>}
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              {isLowPrice ? (
                                <span 
                                  className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase" 
                                  title={`Estimated Market Average: $${estimatedMarketAverage.toFixed(2)}`}
                                >
                                  Low MAP
                                </span>
                              ) : (
                                <span 
                                  className="text-[9px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded uppercase" 
                                  title={`Estimated Market Average: $${estimatedMarketAverage.toFixed(2)}`}
                                >
                                  High MAP
                                </span>
                              )}
                              <span className="text-xl font-bold font-display text-emerald-400">${product.mapPrice.toFixed(2)}</span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 mt-1">
                              <span>Floor: <span className="text-emerald-300 font-semibold">${dollarFloor.toFixed(2)}</span></span>
                              <span>•</span>
                              <span>Avg: <span className="text-slate-400">${estimatedMarketAverage.toFixed(2)}</span></span>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <button 
                          id={`product-threshold-btn-${product.id}`}
                          onClick={() => openQuickThresholdModal(product)}
                          className={`p-2.5 rounded-xl border transition cursor-pointer ${
                            (product.mapThresholdPercent !== undefined || product.customMapThresholdPercent !== undefined)
                              ? "bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border-purple-500/30"
                              : "bg-slate-950/50 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-300 border-slate-800"
                          }`}
                          title="Set Product-Specific MAP Threshold (%)"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                        <button 
                          id={`download-sku-json-btn-${product.id}`}
                          onClick={() => handleDownloadProductJson(product)}
                          className="p-2.5 rounded-xl bg-slate-950/50 hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 border border-slate-800 transition cursor-pointer"
                          title="Download SKU Data (JSON)"
                        >
                          <FileJson className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setSelectedAnalyticsProduct(product)}
                          className="p-2.5 rounded-xl bg-slate-950/50 hover:bg-indigo-500/10 text-indigo-400 hover:text-indigo-300 border border-slate-800 transition cursor-pointer"
                          title="View SKU Analytics"
                          id={`product-analytics-btn-${product.id}`}
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onDeleteProduct(product.id)}
                          className="p-2.5 rounded-xl bg-slate-950/50 hover:bg-red-500/10 text-slate-500 hover:text-red-400 border border-slate-800 transition cursor-pointer"
                          title="Remove from monitoring"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detailed Panel */}
                  {isExpanded && (() => {
                    const activeTab = activeDetailTabs[product.id] || "monitoring";
                    return (
                      <div className="border-t border-slate-800/80 bg-slate-950/40 p-5 space-y-6 animate-fade-in text-sans">
                        
                        {/* Detailed Panel Tab Controls */}
                        <div className="flex border-b border-slate-800 pb-px gap-6">
                           <button
                            type="button"
                            onClick={() => setActiveDetailTabs(prev => ({ ...prev, [product.id]: 'monitoring' }))}
                            className={`flex items-center gap-2 px-1 py-2 border-b-2 text-xs font-bold uppercase tracking-wider transition font-mono cursor-pointer pb-2.5 ${
                              activeTab === 'monitoring'
                                ? "border-indigo-500 text-indigo-400"
                                : "border-transparent text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            <Activity className="w-3.5 h-3.5" />
                            Monitoring & Violations
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveDetailTabs(prev => ({ ...prev, [product.id]: 'audit_log' }))}
                            className={`flex items-center gap-2 px-1 py-2 border-b-2 text-xs font-bold uppercase tracking-wider transition font-mono cursor-pointer pb-2.5 ${
                              activeTab === 'audit_log'
                                ? "border-indigo-500 text-indigo-400"
                                : "border-transparent text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            <History className="w-3.5 h-3.5" />
                            Audit Log
                          </button>
                        </div>

                        {activeTab === "monitoring" ? (
                          <div className="space-y-6 animate-fade-in">
                            {/* 1. Full Description & Asset Preview */}
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                                SKU Visual Recognition & Meta Description
                              </h4>
                              <div className="flex flex-col sm:flex-row gap-4 bg-slate-950/60 border border-slate-800/60 rounded-xl p-4 items-start sm:items-center">
                                <div className="shrink-0 flex flex-col items-center gap-1.5 p-2 bg-slate-900/50 border border-slate-800 rounded-xl">
                                  {product.imageUrl ? (
                                    <img
                                      src={product.imageUrl}
                                      alt={product.name}
                                      referrerPolicy="no-referrer"
                                      className="w-20 h-20 rounded-lg object-cover border border-slate-800 bg-slate-950 shadow-sm"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                        const sibling = (e.target as HTMLElement).nextElementSibling;
                                        if (sibling) (sibling as HTMLElement).style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div 
                                    className={`w-20 h-20 rounded-lg border border-slate-800 bg-gradient-to-br from-slate-900 to-black items-center justify-center text-slate-500 shadow-sm ${
                                      product.imageUrl ? 'hidden' : 'flex'
                                    }`}
                                  >
                                    <Package className="w-8 h-8 text-indigo-400/80" />
                                  </div>
                                  <span className="text-[9px] font-mono font-semibold text-slate-500 uppercase tracking-wider">Catalog Asset</span>
                                </div>
                                <div className="space-y-1.5 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white">{product.name}</span>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{product.sku}</span>
                                  </div>
                                  <p className="text-xs text-slate-300 leading-relaxed">
                                    {product.description || "No detailed description registered for this product."}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Product-Specific MAP Threshold & Policy Specification Card */}
                            <div className="space-y-3 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-xl p-4 shadow-sm">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                                <div className="space-y-0.5">
                                  <h4 className="text-xs font-bold font-mono text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                                    SKU MAP Threshold Policy Overrides
                                  </h4>
                                  <p className="text-[11px] text-slate-400">
                                    Configure product-specific threshold percentages that take priority over the global 80% baseline.
                                  </p>
                                </div>
                                <div>
                                  {(product.mapThresholdPercent !== undefined || product.customMapThresholdPercent !== undefined) ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm">
                                      <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                      Custom Override Active
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-slate-900 text-slate-400 border border-slate-800">
                                      Global 80% Baseline Active
                                    </span>
                                  )}
                                </div>
                              </div>

                              {(() => {
                                const activePct = product.mapThresholdPercent !== undefined 
                                  ? product.mapThresholdPercent 
                                  : (product.customMapThresholdPercent !== undefined ? product.customMapThresholdPercent : 80);
                                const isCustom = product.mapThresholdPercent !== undefined || product.customMapThresholdPercent !== undefined;
                                const calculatedFloor = (product.mapPrice * activePct) / 100;
                                const defaultFloor = (product.mapPrice * 80) / 100;

                                return (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                                    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 space-y-1">
                                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Catalog MAP Price</span>
                                      <div className="text-lg font-bold font-display text-white">${product.mapPrice.toFixed(2)}</div>
                                      <span className="text-[10px] text-slate-500 block">Base SKU MSRP/MAP</span>
                                    </div>

                                    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 space-y-1">
                                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Effective MAP Threshold %</span>
                                      <div className="text-lg font-bold font-display text-purple-300 flex items-center gap-1.5">
                                        {activePct}%
                                        {isCustom && <span className="text-[10px] font-mono font-semibold bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">Custom</span>}
                                      </div>
                                      <span className="text-[10px] text-slate-500 block">
                                        {isCustom ? `Overriding default 80%` : `Standard global baseline`}
                                      </span>
                                    </div>

                                    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 space-y-1">
                                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Minimum Price Floor</span>
                                      <div className="text-lg font-bold font-display text-emerald-400">${calculatedFloor.toFixed(2)}</div>
                                      <span className="text-[10px] text-slate-500 block">
                                        {calculatedFloor !== defaultFloor 
                                          ? `${calculatedFloor > defaultFloor ? '+' : ''}${(calculatedFloor - defaultFloor).toFixed(2)} vs default floor ($${defaultFloor.toFixed(2)})`
                                          : `Matches $${defaultFloor.toFixed(2)} global floor`}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}

                              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openQuickThresholdModal(product)}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Configure Custom Threshold (%)
                                  </button>
                                  {(product.mapThresholdPercent !== undefined || product.customMapThresholdPercent !== undefined) && (
                                    <button
                                      type="button"
                                      onClick={() => saveProductThreshold(product, undefined)}
                                      className="px-3 py-1.5 bg-slate-900 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 border border-rose-900/30 rounded-lg text-xs font-semibold transition cursor-pointer"
                                    >
                                      Reset to 80% Default
                                    </button>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  Audit scans evaluate compliance against ${((product.mapPrice * (product.mapThresholdPercent ?? product.customMapThresholdPercent ?? 80)) / 100).toFixed(2)} floor.
                                </span>
                              </div>
                            </div>

                            {/* Aggregated Financial Impact Widget */}
                            {(() => {
                              // Calculate metrics for latest Completed scan
                              const latestCompleted = sortedProductScans.find(s => s.status === 'completed');
                              const activeBreachesList = latestCompleted 
                                ? (latestCompleted.items || []).filter(item => item.status === 'violating')
                                : [];
                              
                              const activeBreachCount = activeBreachesList.length;
                              const hasActiveBreaches = activeBreachCount > 0;
                              
                              // Configured estimated sales volume
                              const configVolume = estimatedVolumes[product.id] !== undefined ? estimatedVolumes[product.id] : 350;
                              
                              // Configured simulator values
                              const simDisc = simulatedDiscounts[product.id] !== undefined ? simulatedDiscounts[product.id] : 15;
                              const simRet = simulatedRetailers[product.id] !== undefined ? simulatedRetailers[product.id] : 3;

                              // Calculated metrics
                              let totalUnitDeficit = 0;
                              let avgDeficitAmount = 0;
                              let avgDeficitPct = 0;
                              let projectedMonthlyLoss = 0;
                              
                              if (hasActiveBreaches) {
                                totalUnitDeficit = activeBreachesList.reduce((sum, item) => {
                                  const price = item.detectedPrice || 0;
                                  return sum + Math.max(product.mapPrice - price, 0);
                                }, 0);
                                avgDeficitAmount = totalUnitDeficit / activeBreachCount;
                                avgDeficitPct = (avgDeficitAmount / product.mapPrice) * 100;
                                // Monthly potential loss = Avg unit deficit * configured volume
                                projectedMonthlyLoss = avgDeficitAmount * configVolume;
                              } else {
                                // Simulation calculation
                                avgDeficitAmount = product.mapPrice * (simDisc / 100);
                                avgDeficitPct = simDisc;
                                // Projected loss with active violators undercutting
                                projectedMonthlyLoss = avgDeficitAmount * configVolume * (simRet / 3);
                              }

                              // Loss trajectory projection data for Recharts
                              const projectedLossData = [
                                { period: "1 Month", "Projected Revenue Loss": Math.round(projectedMonthlyLoss) },
                                { period: "3 Months", "Projected Revenue Loss": Math.round(projectedMonthlyLoss * 3) },
                                { period: "6 Months", "Projected Revenue Loss": Math.round(projectedMonthlyLoss * 6) },
                                { period: "12 Months", "Projected Revenue Loss": Math.round(projectedMonthlyLoss * 12) },
                              ];

                              const formatCurrency = (val: number) => {
                                return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
                              };

                              return (
                                <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-5 animate-fade-in text-sans" id={`financial-impact-widget-${product.id}`}>
                                  {/* Title & Badge */}
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <div className="space-y-1">
                                      <h4 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-emerald-400" />
                                        Aggregated Financial Impact Projection
                                      </h4>
                                      <p className="text-[10px] text-slate-500 font-sans">
                                        Quantifies potential revenue dilution and channel conflict cost under MAP policy violations
                                      </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      {hasActiveBreaches ? (
                                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono font-bold uppercase tracking-wider animate-pulse">
                                          <ShieldAlert className="w-3.5 h-3.5" />
                                          {activeBreachCount} Active Breaches
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                                          <ShieldCheck className="w-3.5 h-3.5" />
                                          Compliance Stable (Simulating)
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Main Stats Grid */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    
                                    {/* Stat 1: Deficit details */}
                                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850/60 flex flex-col justify-between space-y-2">
                                      <div>
                                        <span className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">Average Unit Deficit</span>
                                        <span className={`text-xl font-extrabold font-display block mt-1 ${hasActiveBreaches ? "text-rose-400" : "text-indigo-400"}`}>
                                          {formatCurrency(avgDeficitAmount)}
                                        </span>
                                      </div>
                                      <span className="text-[9.5px] text-slate-450 font-sans leading-normal">
                                        Average discount under MAP threshold ({avgDeficitPct.toFixed(1)}% erosion)
                                      </span>
                                    </div>

                                    {/* Stat 2: Active / Simulated Volume Slider */}
                                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850/60 flex flex-col justify-between space-y-3">
                                      <div className="space-y-1">
                                        <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                                          <span>Projected Monthly Volume</span>
                                          <span className="text-emerald-400 font-mono text-xs font-bold">{configVolume} units</span>
                                        </div>
                                        <input 
                                          type="range" 
                                          min="10" 
                                          max="2500" 
                                          step="10"
                                          value={configVolume} 
                                          onChange={(e) => setEstimatedVolumes(prev => ({ ...prev, [product.id]: parseInt(e.target.value) }))}
                                          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 mt-2" 
                                        />
                                      </div>
                                      <span className="text-[9.5px] text-slate-450 leading-normal">
                                        Adjust to estimate total channel sales subject to MAP pricing erosion
                                      </span>
                                    </div>

                                    {/* Stat 3: Big Loss Figure */}
                                    <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 transition-all ${
                                      projectedMonthlyLoss > 5000 
                                        ? "bg-rose-950/20 border-rose-900/30" 
                                        : "bg-indigo-950/15 border-indigo-900/30"
                                    }`}>
                                      <div>
                                        <span className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">Projected Revenue Erosion</span>
                                        <span className={`text-2xl font-black font-display block mt-1 ${
                                          projectedMonthlyLoss > 1000 ? "text-rose-400" : "text-emerald-400"
                                        }`}>
                                          {formatCurrency(projectedMonthlyLoss)}
                                        </span>
                                      </div>
                                      <span className="text-[9.5px] text-slate-400 font-semibold font-mono">
                                        Estimated monthly loss trajectory
                                      </span>
                                    </div>
                                  </div>

                                  {/* Dynamic Simulator Row (when no active breaches) */}
                                  {!hasActiveBreaches && (
                                    <div className="p-4 rounded-xl bg-indigo-950/10 border border-indigo-900/20 space-y-3">
                                      <div className="flex items-center gap-1.5 border-b border-indigo-900/30 pb-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                        <span className="text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-wider">MAP Erosion Risk Scenario Modeler</span>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Sim Discount slider */}
                                        <div className="space-y-1.5">
                                          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                                            <span>Simulated Violation Discount</span>
                                            <span className="text-indigo-300 font-bold font-mono">{simDisc}% below MAP</span>
                                          </div>
                                          <input 
                                            type="range" 
                                            min="5" 
                                            max="40" 
                                            value={simDisc} 
                                            onChange={(e) => setSimulatedDiscounts(prev => ({ ...prev, [product.id]: parseInt(e.target.value) }))}
                                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                                          />
                                        </div>

                                        {/* Sim Retailers slider */}
                                        <div className="space-y-1.5">
                                          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                                            <span>Simulated Violating Outlets</span>
                                            <span className="text-indigo-300 font-bold font-mono">{simRet} stores</span>
                                          </div>
                                          <input 
                                            type="range" 
                                            min="1" 
                                            max="10" 
                                            value={simRet} 
                                            onChange={(e) => setSimulatedRetailers(prev => ({ ...prev, [product.id]: parseInt(e.target.value) }))}
                                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Cumulative Loss Scenario Chart & Recommendation Column */}
                                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1.5">
                                    {/* Recommendation & Insights Column */}
                                    <div className="lg:col-span-5 p-4 rounded-xl bg-slate-950/40 border border-slate-850/60 flex flex-col justify-between gap-3">
                                      <div className="space-y-2">
                                        <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Risk Assessment Engine</span>
                                        <p className="text-xs text-slate-350 leading-relaxed font-sans">
                                          {hasActiveBreaches ? (
                                            <>
                                              Retailers are undercutting the brand value of <span className="font-semibold text-slate-200">{product.name}</span>. 
                                              With an average discount of <span className="font-semibold text-rose-450">${avgDeficitAmount.toFixed(2)}</span>, 
                                              a monthly sales volume of <span className="font-semibold text-slate-200">{configVolume} units</span> is projected to dilute 
                                              direct revenue by <span className="font-bold text-rose-450">{formatCurrency(projectedMonthlyLoss)}</span>.
                                            </>
                                          ) : (
                                            <>
                                              This product is currently stable, but a simulated MAP price breach of <span className="font-semibold text-slate-200">{simDisc}%</span> across <span className="font-semibold text-slate-200">{simRet} sellers</span> 
                                              would pose a potential monthly risk of <span className="font-bold text-indigo-400">{formatCurrency(projectedMonthlyLoss)}</span> 
                                              assuming an estimated volume of <span className="font-semibold text-slate-200">{configVolume} units</span>.
                                            </>
                                          )}
                                        </p>
                                      </div>

                                      <div className={`p-3 rounded-lg border flex items-start gap-2 text-[10px] leading-relaxed ${
                                        projectedMonthlyLoss > 5000 
                                          ? "bg-rose-950/20 border-rose-900/40 text-rose-350" 
                                          : "bg-indigo-950/20 border-indigo-900/30 text-indigo-300"
                                      }`}>
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <div>
                                          <span className="font-bold uppercase font-mono block text-[8px] tracking-wider mb-0.5">Automated Policy Playbook:</span>
                                          {projectedMonthlyLoss > 5000 ? (
                                            <span>CRITICAL ALERT: Initiate immediate automated legal warning notices, place violating seller accounts on direct product-shipment holds.</span>
                                          ) : projectedMonthlyLoss > 1000 ? (
                                            <span>HIGH PRIORITY: Issue official notices of MAP violation. Schedule automated re-scans in 12 hours to verify compliance response.</span>
                                          ) : (
                                            <span>MONITORING STATUS: Policy alignment remains within optimal risk boundaries. Standard scheduled sweeping active.</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Cumulative Scenario Chart Column */}
                                    <div className="lg:col-span-7 p-4 rounded-xl bg-slate-950/40 border border-slate-850/60 space-y-2">
                                      {(() => {
                                        const chartTab = activeFinancialCharts[product.id] || "loss";
                                        const dailyLoss = avgDeficitAmount * (configVolume / 30);
                                        const recoveryForecastData = [1, 5, 10, 15, 20, 25, 30].map(d => {
                                          let gradualRecovery = 0;
                                          for (let t = 1; t <= d; t++) {
                                            gradualRecovery += dailyLoss * (t / 30);
                                          }
                                          return {
                                            day: `Day ${d}`,
                                            "Uncontrolled Loss": Math.round(dailyLoss * d),
                                            "Gradual Recovery (Linear Compliance)": Math.round(gradualRecovery),
                                            "Immediate Recovery (Instant 100%)": Math.round(dailyLoss * d)
                                          };
                                        });

                                        return (
                                          <>
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/80 pb-2 mb-2 gap-2">
                                              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                                                {chartTab === "loss" ? "Compounded Revenue Loss Over Time" : "30-Day Revenue Recovery Projection"}
                                              </span>
                                              <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 shrink-0">
                                                <button
                                                  type="button"
                                                  onClick={() => setActiveFinancialCharts(prev => ({ ...prev, [product.id]: "loss" }))}
                                                  className={`px-2 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                                                    chartTab === "loss" 
                                                      ? "bg-slate-800 text-slate-100 border border-slate-700 shadow" 
                                                      : "text-slate-500 hover:text-slate-300 border border-transparent"
                                                  }`}
                                                >
                                                  Erosion
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => setActiveFinancialCharts(prev => ({ ...prev, [product.id]: "recovery" }))}
                                                  className={`px-2 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1 ${
                                                    chartTab === "recovery" 
                                                      ? "bg-indigo-950/80 text-indigo-300 border border-indigo-900/60 shadow" 
                                                      : "text-slate-500 hover:text-slate-300 border border-transparent"
                                                  }`}
                                                >
                                                  <Sparkles className="w-2.5 h-2.5" />
                                                  Recovery 30D
                                                </button>
                                              </div>
                                            </div>

                                            {chartTab === "loss" ? (
                                              <div className="w-full h-32 mt-1">
                                                <ResponsiveContainer width="100%" height="100%">
                                                  <BarChart data={projectedLossData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                                    <defs>
                                                      <linearGradient id={`financialErosionGradient-${product.id}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={projectedMonthlyLoss > 1000 ? "#f43f5e" : "#10b981"} stopOpacity={0.85}/>
                                                        <stop offset="95%" stopColor={projectedMonthlyLoss > 1000 ? "#f43f5e" : "#10b981"} stopOpacity={0.25}/>
                                                      </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                                                    <XAxis 
                                                      dataKey="period" 
                                                      stroke="#475569" 
                                                      fontSize={8.5} 
                                                      tickLine={false}
                                                      fontFamily="monospace"
                                                    />
                                                    <YAxis 
                                                      stroke="#475569" 
                                                      fontSize={8.5} 
                                                      tickLine={false}
                                                      fontFamily="monospace"
                                                      tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                                                    />
                                                    <Tooltip 
                                                      contentStyle={{ 
                                                        backgroundColor: '#0f172a', 
                                                        borderColor: '#334155', 
                                                        borderRadius: '0.5rem', 
                                                        fontSize: '10px', 
                                                        fontFamily: 'monospace',
                                                        color: '#e2e8f0'
                                                      }} 
                                                      formatter={(value: any) => [formatCurrency(value), "Compounded Loss"]}
                                                    />
                                                    <Bar 
                                                      dataKey="Projected Revenue Loss" 
                                                      fill={`url(#financialErosionGradient-${product.id})`} 
                                                      radius={[6, 6, 0, 0]}
                                                      maxBarSize={32}
                                                    >
                                                      {projectedLossData.map((entry, idx) => (
                                                        <Cell 
                                                          key={`cell-${idx}`} 
                                                          fill={
                                                            idx === 3 
                                                              ? (projectedMonthlyLoss > 1000 ? "#e11d48" : "#059669") 
                                                              : (projectedMonthlyLoss > 1000 ? "#f43f5e" : "#10b981")
                                                          } 
                                                        />
                                                      ))}
                                                    </Bar>
                                                  </BarChart>
                                                </ResponsiveContainer>
                                              </div>
                                            ) : (
                                              <div className="w-full h-32 mt-1">
                                                <ResponsiveContainer width="100%" height="100%">
                                                  <AreaChart data={recoveryForecastData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                                    <defs>
                                                      <linearGradient id={`recoveryLossGrad-${product.id}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.01}/>
                                                      </linearGradient>
                                                      <linearGradient id={`recoveryGradualGrad-${product.id}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                                                      </linearGradient>
                                                      <linearGradient id={`recoveryImmediateGrad-${product.id}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                                                      </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                                                    <XAxis 
                                                      dataKey="day" 
                                                      stroke="#475569" 
                                                      fontSize={8} 
                                                      tickLine={false}
                                                      fontFamily="monospace"
                                                    />
                                                    <YAxis 
                                                      stroke="#475569" 
                                                      fontSize={8} 
                                                      tickLine={false}
                                                      fontFamily="monospace"
                                                      tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                                                    />
                                                    <Tooltip 
                                                      contentStyle={{ 
                                                        backgroundColor: '#0f172a', 
                                                        borderColor: '#334155', 
                                                        borderRadius: '0.5rem', 
                                                        fontSize: '9px', 
                                                        fontFamily: 'monospace',
                                                        color: '#e2e8f0'
                                                      }} 
                                                      formatter={(value: any, name: any) => [formatCurrency(Number(value)), name]}
                                                    />
                                                    <Legend 
                                                      verticalAlign="top" 
                                                      height={18} 
                                                      iconSize={6} 
                                                      iconType="circle" 
                                                      wrapperStyle={{ fontSize: '8px', fontFamily: 'monospace', marginTop: '-4px' }} 
                                                    />
                                                    <Area 
                                                      type="monotone" 
                                                      dataKey="Uncontrolled Loss" 
                                                      stroke="#f43f5e" 
                                                      fill={`url(#recoveryLossGrad-${product.id})`} 
                                                      strokeWidth={1.2}
                                                      strokeDasharray="3 3"
                                                    />
                                                    <Area 
                                                      type="monotone" 
                                                      dataKey="Gradual Recovery (Linear Compliance)" 
                                                      stroke="#3b82f6" 
                                                      fill={`url(#recoveryGradualGrad-${product.id})`} 
                                                      strokeWidth={1.8}
                                                    />
                                                    <Area 
                                                      type="monotone" 
                                                      dataKey="Immediate Recovery (Instant 100%)" 
                                                      stroke="#10b981" 
                                                      fill={`url(#recoveryImmediateGrad-${product.id})`} 
                                                      strokeWidth={1.8}
                                                    />
                                                  </AreaChart>
                                                </ResponsiveContainer>
                                              </div>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Breach Timeline visualizer mapping out violation history with First Infraction vs Recurring Breach */}
                            <SkuBreachTimeline 
                              product={product} 
                              scans={scans} 
                              className="mt-4"
                            />

                            {/* Two-Column Grid for History & Violations */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Column 1: Scan History */}
                              <div className="space-y-3">
                                <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                                  Compliance Scan History
                                </h4>
                                
                                {sortedProductScans.length === 0 ? (
                                  <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center bg-slate-900/10">
                                    <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                    <span className="text-xs text-slate-500 block">No scans have been run for this SKU yet.</span>
                                  </div>
                                ) : (
                                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {sortedProductScans.map((scan) => {
                                      const totalResultCount = scan.items?.length || 0;
                                      const scanViolatingCount = scan.items?.filter(i => i.status === 'violating').length || 0;

                                      return (
                                        <div 
                                          key={scan.id} 
                                          className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                                        >
                                          <div className="space-y-1">
                                            <span className="block text-xs font-semibold text-slate-300">
                                              {new Date(scan.startedAt).toLocaleString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                                            </span>
                                            <span className="text-[10px] text-slate-500 block font-mono">
                                              ID: {scan.id.substring(0, 8)}...
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-2">
                                            {scanViolatingCount > 0 ? (
                                              <span className="flex items-center gap-1 text-[10px] font-mono bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
                                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                                {scanViolatingCount} Violations
                                              </span>
                                            ) : (
                                              <span className="flex items-center gap-1 text-[10px] font-mono bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                <ShieldCheck className="w-3 h-3 shrink-0" />
                                                Compliant
                                              </span>
                                            )}

                                            <span className="text-[10px] font-mono text-slate-400">
                                              ({totalResultCount} domains checked)
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Column 2: Recent Violations */}
                              <div className="space-y-3">
                                <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                                  Recent Violations Found
                                </h4>

                                {violations.length === 0 ? (
                                  <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center bg-slate-900/10 flex flex-col justify-center items-center h-[180px]">
                                    <ShieldCheck className="w-8 h-8 text-emerald-500 mb-2" />
                                    <span className="text-xs text-slate-300 font-semibold">100% Compliant SKU</span>
                                    <span className="text-[10px] text-slate-500 mt-1">No violations have been flagged in previous scans.</span>
                                  </div>
                                ) : (
                                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                    {violations.map((v, index) => (
                                      <div 
                                        key={`${v.id}-${index}`}
                                        className="p-3 rounded-xl bg-red-500/5 hover:bg-red-500/[0.08] border border-red-500/15 text-xs space-y-2 transition-colors"
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="font-semibold text-slate-200">
                                            {v.partnerName || v.partnerDomain}
                                          </div>
                                          <span className="text-[9px] font-mono text-slate-500">
                                            {new Date(v.scanDate).toLocaleDateString(undefined, {
                                              month: 'short',
                                              day: 'numeric'
                                            })}
                                          </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-1 text-[11px]">
                                          <div className="flex items-baseline gap-1 bg-red-950/40 text-red-400 px-2 py-1 rounded font-mono">
                                            <span>Detected:</span>
                                            <span className="font-bold font-display text-white">${v.detectedPrice?.toFixed(2) || "None"}</span>
                                            <span className="text-[9px] text-red-400/80">(MAP: ${product.mapPrice.toFixed(2)})</span>
                                          </div>

                                          {v.detectedUrl && (
                                            <a 
                                              href={v.detectedUrl} 
                                              target="_blank" 
                                              referrerPolicy="no-referrer"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline shrink-0"
                                            >
                                              <span>Product Link</span>
                                              <ExternalLink className="w-2.5 h-2.5" />
                                            </a>
                                          )}
                                        </div>

                                        {v.snippet && (
                                          <div className="bg-slate-950/80 border border-slate-800 p-2 rounded-lg text-[10px] text-slate-400 font-mono leading-relaxed max-h-20 overflow-y-auto scrollbar-thin">
                                            {v.snippet}
                                          </div>
                                        )}

                                        <div className="flex items-center justify-between pt-2 border-t border-slate-900 mt-2 gap-2 flex-wrap">
                                          <span className="text-[9px] text-slate-500 font-mono">
                                            Compliance: {v.partnerDomain ? `compliance@${v.partnerDomain}` : "Pending"}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleInitiateWarning(product, v);
                                            }}
                                            className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded font-mono text-[9px] font-bold uppercase tracking-wider cursor-pointer transition-all"
                                          >
                                            <Mail className="w-3 h-3 text-amber-400" />
                                            <span>Send Warning</span>
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4 animate-fade-in text-sans">
                            {/* Inline adjustment for actual mapping thresholds */}
                            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/30 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-0.5">
                                  <h4 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                    <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                                    Authorized MAP Threshold Modification
                                  </h4>
                                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">Edit this entry to store an authorized price change chronologically in the audit logs.</p>
                                </div>

                                {editingPriceMapId === product.id ? (
                                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                    <div className="relative">
                                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500 text-xs font-mono">$</span>
                                      <input
                                        type="text"
                                        value={editedPriceStr}
                                        onChange={e => setEditedPriceStr(e.target.value)}
                                        className="w-24 pl-5 pr-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-emerald-400 focus:outline-none focus:border-emerald-500 font-mono"
                                      />
                                    </div>
                                    <button
                                      onClick={() => saveProductPrice(product)}
                                      className="p-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg transition shrink-0 cursor-pointer"
                                      title="Save pricing threshold change"
                                    >
                                      <Save className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingPriceMapId(null)}
                                      className="px-2.5 py-1.5 bg-slate-850 hover:bg-slate-750 text-slate-350 hover:text-white rounded-lg transition text-xs font-mono shrink-0 cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => startEditProductPrice(product)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-400/20 text-xs transition font-semibold cursor-pointer shrink-0"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Adjust Threshold</span>
                                  </button>
                                )}
                              </div>
                              {editingPriceError && (
                                <p className="text-[10px] text-red-400 font-semibold font-mono">{editingPriceError}</p>
                              )}
                            </div>

                            {/* Chronological Trajectory Trail */}
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                  <History className="w-3.5 h-3.5 text-indigo-400" />
                                  SKU Registry Audit Trail History
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => fetchAuditLogs(product.id)}
                                  className="text-[10px] font-mono text-slate-500 hover:text-indigo-400 flex items-center gap-1 transition cursor-pointer"
                                >
                                  <span>↺ Pull Refresh</span>
                                </button>
                              </div>

                              {isLoadingLogs[product.id] ? (
                                <div className="p-10 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/10">
                                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                  <span className="text-xs text-slate-500 font-mono">Retrieving operations ledger...</span>
                                </div>
                              ) : !productAuditLogs[product.id] || productAuditLogs[product.id].length === 0 ? (
                                <div className="p-10 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/10">
                                  <Clock className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                                  <span className="text-xs text-slate-500 font-mono">No actions registered in registry history.</span>
                                </div>
                              ) : (
                                <div className="relative border-l border-slate-800 pl-4 ml-2 my-1 space-y-5">
                                  {productAuditLogs[product.id].map((log) => {
                                    let typeLabel = "System Registry";
                                    let typeColor = "bg-blue-500/15 text-blue-400 border-blue-500/20";
                                    let dotColor = "bg-blue-400 ring-blue-500/20";
                                    
                                    if (log.type === "price_change") {
                                      typeLabel = "Price Modification";
                                      typeColor = "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
                                      dotColor = "bg-emerald-450 ring-emerald-500/20";
                                    } else if (log.type === "compliance_update") {
                                      const isFaulty = log.message.toLowerCase().includes("violation") || log.message.toLowerCase().includes("flagged");
                                      typeLabel = "Compliance Status";
                                      typeColor = isFaulty 
                                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                        : "bg-emerald-605/10 text-emerald-400 border-emerald-600/20";
                                      dotColor = isFaulty ? "bg-rose-500 ring-rose-500/15" : "bg-emerald-500 ring-emerald-500/15";
                                    }

                                    return (
                                      <div key={log.id} className="relative group">
                                        <div className={`absolute -left-[21.5px] top-1.5 w-2 h-2 rounded-full ring-4 ${dotColor} transition-transform duration-200 group-hover:scale-125`}></div>
                                        
                                        <div className="space-y-1 bg-slate-900/40 hover:bg-slate-900/50 transition p-3 rounded-xl border border-slate-850/50">
                                          <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${typeColor}`}>
                                                {typeLabel}
                                              </span>
                                              <span className="text-[10px] font-mono text-slate-550">
                                                by {log.user || "System Ledger"}
                                              </span>
                                            </div>
                                            <span className="text-[10px] font-mono text-slate-500">
                                              {new Date(log.timestamp).toLocaleString(undefined, {
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                second: "2-digit"
                                              })}
                                            </span>
                                          </div>

                                          <p className="text-xs text-slate-200 font-sans leading-relaxed">
                                            {log.message}
                                          </p>

                                          {log.details && (
                                            <div className="text-[9px] text-slate-500 font-mono bg-slate-950 p-2 rounded-lg leading-relaxed mt-1 max-h-24 overflow-y-auto">
                                              <span className="text-slate-605 font-bold block text-[8px] uppercase tracking-wider mb-0.5">Surrendered Site Scans:</span>
                                              {log.details}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}
          </>
        )}
      </div>
    </div>

    {/* COMPREHENSIVE SKU ANALYTICS MODAL */}
    {selectedAnalyticsProduct && (() => {
      const product = selectedAnalyticsProduct;
      // Gather scans matching this product
      const productScans = (scans || []).filter(s => s.productId === product.id);
      const completedScans = productScans.filter(s => s.status === 'completed');
      
      // Calculate long term pricing history
      const chartData = [...completedScans]
        .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
        .map(s => {
          const prices = s.items?.map(i => i.detectedPrice).filter((p): p is number => p !== null && p !== undefined) || [];
          const minPrice = prices.length > 0 ? Math.min(...prices) : s.mapPrice;
          const avgPrice = prices.length > 0 ? prices.reduce((sum, p) => sum + p, 0) / prices.length : s.mapPrice;
          return {
            date: new Date(s.startedAt).toLocaleDateString(undefined, { 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            "MAP Price": s.mapPrice,
            "Min Price": parseFloat(minPrice.toFixed(2)),
            "Avg Price": parseFloat(avgPrice.toFixed(2)),
          };
        });

      const isSampleData = chartData.length === 0;
      const finalChartData = chartData.length > 0 ? chartData : [
        { date: "Day 1 (Sample)", "MAP Price": product.mapPrice, "Min Price": product.mapPrice, "Avg Price": product.mapPrice * 1.05 },
        { date: "Day 2 (Sample)", "MAP Price": product.mapPrice, "Min Price": product.mapPrice * 0.92, "Avg Price": product.mapPrice * 0.98 },
        { date: "Day 3 (Sample)", "MAP Price": product.mapPrice, "Min Price": product.mapPrice * 0.88, "Avg Price": product.mapPrice * 0.95 },
        { date: "Day 4 (Sample)", "MAP Price": product.mapPrice, "Min Price": product.mapPrice, "Avg Price": product.mapPrice * 1.02 },
        { date: "Day 5 (Sample)", "MAP Price": product.mapPrice, "Min Price": product.mapPrice, "Avg Price": product.mapPrice * 1.05 },
      ];

      // Gather active infringements (from latest scan)
      const latestScan = [...completedScans].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];
      const activeInfringements = latestScan 
        ? (latestScan.items || []).filter(item => item.status === 'violating')
        : [];

      // All historical infringements for this SKU (all scans)
      const historicalInfringements = [...completedScans]
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
        .flatMap(s => (s.items || []).map(item => ({ ...item, scanDate: s.startedAt, scanId: s.id })))
        .filter(item => item.status === 'violating');

      // Let's compute some KPIs
      const totalPartnersChecked = latestScan ? latestScan.items?.length || 0 : 0;
      const compliantCount = latestScan ? (latestScan.items || []).filter(i => i.status === 'compliant').length : 0;
      const healthScore = totalPartnersChecked > 0 
        ? Math.round((compliantCount / totalPartnersChecked) * 100) 
        : 100;

      // Lowest price currently detected
      const currentPrices = latestScan?.items?.map(i => i.detectedPrice).filter((p): p is number => p !== null && p !== undefined) || [];
      const currentMinPrice = currentPrices.length > 0 ? Math.min(...currentPrices) : null;
      const currentAvgPrice = currentPrices.length > 0 ? currentPrices.reduce((sum, p) => sum + p, 0) / currentPrices.length : null;

      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in" id="sku-analytics-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl relative font-sans flex flex-col max-h-[90vh]">
            
            {/* Modal Header bar */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                    SKU Analytics Dashboard
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Real-time policy health & multi-channel compliance trail
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedAnalyticsProduct(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                id="close-analytics-modal-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content Scroll Area */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* 1. Profile / Meta Card */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {product.sku}
                    </span>
                    <h4 className="text-base font-bold text-white">{product.name}</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                    {product.description || "No detailed metadata description provided for this SKU in the master inventory catalog."}
                  </p>
                </div>
                <div className="text-left md:text-right shrink-0">
                  <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">Required MAP Threshold</span>
                  <span className="text-2xl font-bold font-display text-emerald-400 mt-0.5 block">${product.mapPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* 2. KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Health Score */}
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Health Score</span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className={`text-2xl font-extrabold font-display ${healthScore === 100 ? "text-emerald-400" : healthScore >= 75 ? "text-amber-400" : "text-rose-400"}`}>
                      {healthScore}%
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1">
                    {compliantCount} / {totalPartnersChecked} domains compliant
                  </span>
                </div>

                {/* Active Infringements */}
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Active Violations</span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className={`text-2xl font-extrabold font-display ${activeInfringements.length > 0 ? "text-rose-400 animate-pulse" : "text-emerald-400"}`}>
                      {activeInfringements.length}
                    </span>
                    <span className="text-[10px] text-slate-450">Current</span>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1">
                    {activeInfringements.length > 0 ? "Require immediate action" : "Perfect partner alignment"}
                  </span>
                </div>

                {/* Lowest Market Price */}
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Lowest Market Price</span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    {currentMinPrice !== null ? (
                      <span className={`text-2xl font-extrabold font-display ${currentMinPrice < product.mapPrice ? "text-rose-400" : "text-emerald-400"}`}>
                        ${currentMinPrice.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-sm font-semibold">No active data</span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1">
                    {currentMinPrice !== null && currentMinPrice < product.mapPrice 
                      ? `-$${(product.mapPrice - currentMinPrice).toFixed(2)} (${(((product.mapPrice - currentMinPrice) / product.mapPrice) * 100).toFixed(1)}% deficit)` 
                      : "No MAP violations detected"}
                  </span>
                </div>

                {/* Average Market Price */}
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Average Market Price</span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    {currentAvgPrice !== null ? (
                      <span className="text-2xl font-extrabold font-display text-slate-200">
                        ${currentAvgPrice.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-sm font-semibold">No active data</span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1">
                    Across checked retail channels
                  </span>
                </div>
              </div>

              {/* Aggregated Financial Impact Widget */}
              {(() => {
                const sortedProductScans = [...completedScans].sort((a, b) => 
                  new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
                );
                // Calculate metrics for latest Completed scan
                const latestCompleted = sortedProductScans[0];
                const activeBreachesList = latestCompleted 
                  ? (latestCompleted.items || []).filter(item => item.status === 'violating')
                  : [];
                
                const activeBreachCount = activeBreachesList.length;
                const hasActiveBreaches = activeBreachCount > 0;
                
                // Configured estimated sales volume
                const configVolume = estimatedVolumes[product.id] !== undefined ? estimatedVolumes[product.id] : 350;
                
                // Configured simulator values
                const simDisc = simulatedDiscounts[product.id] !== undefined ? simulatedDiscounts[product.id] : 15;
                const simRet = simulatedRetailers[product.id] !== undefined ? simulatedRetailers[product.id] : 3;

                // Calculated metrics
                let totalUnitDeficit = 0;
                let avgDeficitAmount = 0;
                let avgDeficitPct = 0;
                let projectedMonthlyLoss = 0;
                
                if (hasActiveBreaches) {
                  totalUnitDeficit = activeBreachesList.reduce((sum, item) => {
                    const price = item.detectedPrice || 0;
                    return sum + Math.max(product.mapPrice - price, 0);
                  }, 0);
                  avgDeficitAmount = totalUnitDeficit / activeBreachCount;
                  avgDeficitPct = (avgDeficitAmount / product.mapPrice) * 100;
                  // Monthly potential loss = Avg unit deficit * configured volume
                  projectedMonthlyLoss = avgDeficitAmount * configVolume;
                } else {
                  // Simulation calculation
                  avgDeficitAmount = product.mapPrice * (simDisc / 100);
                  avgDeficitPct = simDisc;
                  // Projected loss with active violators undercutting
                  projectedMonthlyLoss = avgDeficitAmount * configVolume * (simRet / 3);
                }

                // Loss trajectory projection data for Recharts
                const projectedLossData = [
                  { period: "1 Month", "Projected Revenue Loss": Math.round(projectedMonthlyLoss) },
                  { period: "3 Months", "Projected Revenue Loss": Math.round(projectedMonthlyLoss * 3) },
                  { period: "6 Months", "Projected Revenue Loss": Math.round(projectedMonthlyLoss * 6) },
                  { period: "12 Months", "Projected Revenue Loss": Math.round(projectedMonthlyLoss * 12) },
                ];

                const formatCurrency = (val: number) => {
                  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
                };

                return (
                  <div className="p-5 rounded-2xl bg-slate-950/30 border border-slate-800/80 space-y-5 animate-fade-in text-sans" id={`financial-impact-widget-modal-${product.id}`}>
                    {/* Title & Badge */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-widest flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-400" />
                          Aggregated Financial Impact Projection
                        </h4>
                        <p className="text-[10px] text-slate-500 font-sans">
                          Quantifies potential revenue dilution and channel conflict cost under MAP policy violations
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {hasActiveBreaches ? (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono font-bold uppercase tracking-wider animate-pulse">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            {activeBreachCount} Active Breaches
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Compliance Stable (Simulating)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Main Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* Stat 1: Deficit details */}
                      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 flex flex-col justify-between space-y-2">
                        <div>
                          <span className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">Average Unit Deficit</span>
                          <span className={`text-xl font-extrabold font-display block mt-1 ${hasActiveBreaches ? "text-rose-400" : "text-indigo-400"}`}>
                            {formatCurrency(avgDeficitAmount)}
                          </span>
                        </div>
                        <span className="text-[9.5px] text-slate-450 font-sans leading-normal">
                          Average discount under MAP threshold ({avgDeficitPct.toFixed(1)}% erosion)
                        </span>
                      </div>

                      {/* Stat 2: Active / Simulated Volume Slider */}
                      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                            <span>Projected Monthly Volume</span>
                            <span className="text-emerald-400 font-mono text-xs font-bold">{configVolume} units</span>
                          </div>
                          <input 
                            type="range" 
                            min="10" 
                            max="2500" 
                            step="10"
                            value={configVolume} 
                            onChange={(e) => setEstimatedVolumes(prev => ({ ...prev, [product.id]: parseInt(e.target.value) }))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 mt-2" 
                          />
                        </div>
                        <span className="text-[9.5px] text-slate-450 leading-normal">
                          Adjust to estimate total channel sales subject to MAP pricing erosion
                        </span>
                      </div>

                      {/* Stat 3: Big Loss Figure */}
                      <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 transition-all ${
                        projectedMonthlyLoss > 5000 
                          ? "bg-rose-950/20 border-rose-900/30" 
                          : "bg-indigo-950/15 border-indigo-900/30"
                      }`}>
                        <div>
                          <span className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">Projected Revenue Erosion</span>
                          <span className={`text-2xl font-black font-display block mt-1 ${
                            projectedMonthlyLoss > 1000 ? "text-rose-400" : "text-emerald-400"
                          }`}>
                            {formatCurrency(projectedMonthlyLoss)}
                          </span>
                        </div>
                        <span className="text-[9.5px] text-slate-400 font-semibold font-mono">
                          Estimated monthly loss trajectory
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Simulator Row (when no active breaches) */}
                    {!hasActiveBreaches && (
                      <div className="p-4 rounded-xl bg-indigo-950/10 border border-indigo-900/20 space-y-3">
                        <div className="flex items-center gap-1.5 border-b border-indigo-900/30 pb-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-wider">MAP Erosion Risk Scenario Modeler</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Sim Discount slider */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                              <span>Simulated Violation Discount</span>
                              <span className="text-indigo-300 font-bold font-mono">{simDisc}% below MAP</span>
                            </div>
                            <input 
                              type="range" 
                              min="5" 
                              max="40" 
                              value={simDisc} 
                              onChange={(e) => setSimulatedDiscounts(prev => ({ ...prev, [product.id]: parseInt(e.target.value) }))}
                              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                            />
                          </div>

                          {/* Sim Retailers slider */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                              <span>Simulated Violating Outlets</span>
                              <span className="text-indigo-300 font-bold font-mono">{simRet} stores</span>
                            </div>
                            <input 
                              type="range" 
                              min="1" 
                              max="10" 
                              value={simRet} 
                              onChange={(e) => setSimulatedRetailers(prev => ({ ...prev, [product.id]: parseInt(e.target.value) }))}
                              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cumulative Loss Scenario Chart & Recommendation Column */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1.5">
                      {/* Recommendation & Insights Column */}
                      <div className="lg:col-span-5 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 flex flex-col justify-between gap-3">
                        <div className="space-y-2">
                          <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Risk Assessment Engine</span>
                          <p className="text-xs text-slate-350 leading-relaxed font-sans">
                            {hasActiveBreaches ? (
                              <>
                                Retailers are undercutting brand value for <span className="font-semibold text-slate-200">{product.name}</span>. 
                                With an average discount of <span className="font-semibold text-rose-450">${avgDeficitAmount.toFixed(2)}</span>, 
                                a monthly sales volume of <span className="font-semibold text-slate-200">{configVolume} units</span> is projected to dilute 
                                direct revenue by <span className="font-bold text-rose-450">{formatCurrency(projectedMonthlyLoss)}</span>.
                              </>
                            ) : (
                              <>
                                This product is currently stable, but a simulated MAP price breach of <span className="font-semibold text-slate-200">{simDisc}%</span> across <span className="font-semibold text-slate-200">{simRet} sellers</span> 
                                would pose a potential monthly risk of <span className="font-bold text-indigo-400">{formatCurrency(projectedMonthlyLoss)}</span> 
                                assuming an estimated volume of <span className="font-semibold text-slate-200">{configVolume} units</span>.
                              </>
                            )}
                          </p>
                        </div>

                        <div className={`p-3 rounded-lg border flex items-start gap-2 text-[10px] leading-relaxed ${
                          projectedMonthlyLoss > 5000 
                            ? "bg-rose-950/20 border-rose-900/40 text-rose-350" 
                            : "bg-indigo-950/20 border-indigo-900/30 text-indigo-300"
                        }`}>
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold uppercase font-mono block text-[8px] tracking-wider mb-0.5">Automated Policy Playbook:</span>
                            {projectedMonthlyLoss > 5000 ? (
                              <span>CRITICAL ALERT: Initiate immediate automated legal warning notices, place violating seller accounts on direct product-shipment holds.</span>
                            ) : projectedMonthlyLoss > 1000 ? (
                              <span>HIGH PRIORITY: Issue official notices of MAP violation. Schedule automated re-scans in 12 hours to verify compliance response.</span>
                            ) : (
                              <span>MONITORING STATUS: Policy alignment remains within optimal risk boundaries. Standard scheduled sweeping active.</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Cumulative Scenario Chart Column */}
                      <div className="lg:col-span-7 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 space-y-2">
                        {(() => {
                          const chartTab = activeFinancialCharts[product.id] || "loss";
                          const dailyLoss = avgDeficitAmount * (configVolume / 30);
                          const recoveryForecastData = [1, 5, 10, 15, 20, 25, 30].map(d => {
                            let gradualRecovery = 0;
                            for (let t = 1; t <= d; t++) {
                              gradualRecovery += dailyLoss * (t / 30);
                            }
                            return {
                              day: `Day ${d}`,
                              "Uncontrolled Loss": Math.round(dailyLoss * d),
                              "Gradual Recovery (Linear Compliance)": Math.round(gradualRecovery),
                              "Immediate Recovery (Instant 100%)": Math.round(dailyLoss * d)
                            };
                          });

                          return (
                            <>
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/80 pb-2 mb-2 gap-2">
                                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                                  {chartTab === "loss" ? "Compounded Revenue Loss Over Time" : "30-Day Revenue Recovery Projection"}
                                </span>
                                <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-805 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setActiveFinancialCharts(prev => ({ ...prev, [product.id]: "loss" }))}
                                    className={`px-2 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                                      chartTab === "loss" 
                                        ? "bg-slate-800 text-slate-100 border border-slate-700 shadow" 
                                        : "text-slate-500 hover:text-slate-300 border border-transparent"
                                    }`}
                                  >
                                    Erosion
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setActiveFinancialCharts(prev => ({ ...prev, [product.id]: "recovery" }))}
                                    className={`px-2 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1 ${
                                      chartTab === "recovery" 
                                        ? "bg-indigo-950/80 text-indigo-300 border border-indigo-900/60 shadow" 
                                        : "text-slate-500 hover:text-slate-300 border border-transparent"
                                    }`}
                                  >
                                    <Sparkles className="w-2.5 h-2.5" />
                                    Recovery 30D
                                  </button>
                                </div>
                              </div>

                              {chartTab === "loss" ? (
                                <div className="w-full h-32 mt-1">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={projectedLossData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                      <defs>
                                        <linearGradient id={`financialErosionGradient-modal-${product.id}`} x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor={projectedMonthlyLoss > 1000 ? "#f43f5e" : "#10b981"} stopOpacity={0.85}/>
                                          <stop offset="95%" stopColor={projectedMonthlyLoss > 1000 ? "#f43f5e" : "#10b981"} stopOpacity={0.25}/>
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                                      <XAxis 
                                        dataKey="period" 
                                        stroke="#475569" 
                                        fontSize={8.5} 
                                        tickLine={false}
                                        fontFamily="monospace"
                                      />
                                      <YAxis 
                                        stroke="#475569" 
                                        fontSize={8.5} 
                                        tickLine={false}
                                        fontFamily="monospace"
                                        tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                                      />
                                      <Tooltip 
                                        contentStyle={{ 
                                          backgroundColor: '#0f172a', 
                                          borderColor: '#334155', 
                                          borderRadius: '0.5rem', 
                                          fontSize: '10px', 
                                          fontFamily: 'monospace',
                                          color: '#e2e8f0'
                                        }} 
                                        formatter={(value: any) => [formatCurrency(value), "Compounded Loss"]}
                                      />
                                      <Bar 
                                        dataKey="Projected Revenue Loss" 
                                        fill={`url(#financialErosionGradient-modal-${product.id})`} 
                                        radius={[6, 6, 0, 0]}
                                        maxBarSize={32}
                                      >
                                        {projectedLossData.map((entry, idx) => (
                                          <Cell 
                                            key={`cell-${idx}`} 
                                            fill={
                                              idx === 3 
                                                ? (projectedMonthlyLoss > 1000 ? "#e11d48" : "#059669") 
                                                : (projectedMonthlyLoss > 1000 ? "#f43f5e" : "#10b981")
                                            } 
                                          />
                                        ))}
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              ) : (
                                <div className="w-full h-32 mt-1">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={recoveryForecastData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                      <defs>
                                        <linearGradient id={`recoveryLossGrad-modal-${product.id}`} x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.01}/>
                                        </linearGradient>
                                        <linearGradient id={`recoveryGradualGrad-modal-${product.id}`} x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                                        </linearGradient>
                                        <linearGradient id={`recoveryImmediateGrad-modal-${product.id}`} x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                                      <XAxis 
                                        dataKey="day" 
                                        stroke="#475569" 
                                        fontSize={8} 
                                        tickLine={false}
                                        fontFamily="monospace"
                                      />
                                      <YAxis 
                                        stroke="#475569" 
                                        fontSize={8} 
                                        tickLine={false}
                                        fontFamily="monospace"
                                        tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                                      />
                                      <Tooltip 
                                        contentStyle={{ 
                                          backgroundColor: '#0f172a', 
                                          borderColor: '#334155', 
                                          borderRadius: '0.5rem', 
                                          fontSize: '9px', 
                                          fontFamily: 'monospace',
                                          color: '#e2e8f0'
                                        }} 
                                        formatter={(value: any, name: any) => [formatCurrency(Number(value)), name]}
                                      />
                                      <Legend 
                                        verticalAlign="top" 
                                        height={18} 
                                        iconSize={6} 
                                        iconType="circle" 
                                        wrapperStyle={{ fontSize: '8px', fontFamily: 'monospace', marginTop: '-4px' }} 
                                      />
                                      <Area 
                                        type="monotone" 
                                        dataKey="Uncontrolled Loss" 
                                        stroke="#f43f5e" 
                                        fill={`url(#recoveryLossGrad-modal-${product.id})`} 
                                        strokeWidth={1.2}
                                        strokeDasharray="3 3"
                                      />
                                      <Area 
                                        type="monotone" 
                                        dataKey="Gradual Recovery (Linear Compliance)" 
                                        stroke="#3b82f6" 
                                        fill={`url(#recoveryGradualGrad-modal-${product.id})`} 
                                        strokeWidth={1.8}
                                      />
                                      <Area 
                                        type="monotone" 
                                        dataKey="Immediate Recovery (Instant 100%)" 
                                        stroke="#10b981" 
                                        fill={`url(#recoveryImmediateGrad-modal-${product.id})`} 
                                        strokeWidth={1.8}
                                      />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 3. Pricing History Chart */}
              <div className="p-5 rounded-2xl bg-slate-950/30 border border-slate-800/80 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-400" />
                      Long-Term Pricing Trendline History
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Tracks minimum and average market prices across all compliance scans compared against your MAP threshold
                    </p>
                  </div>

                  {isSampleData && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 animate-pulse">
                      <Sparkles className="w-3.5 h-3.5" />
                      Sample Preview
                    </div>
                  )}
                </div>

                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={finalChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="chartMinGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="chartAvgGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#475569" 
                        fontSize={9} 
                        tickLine={false}
                        fontFamily="monospace"
                      />
                      <YAxis 
                        stroke="#475569" 
                        fontSize={9} 
                        tickLine={false} 
                        domain={['auto', 'auto']}
                        fontFamily="monospace"
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderColor: '#334155', 
                          borderRadius: '0.75rem', 
                          fontSize: '11px', 
                          fontFamily: 'monospace',
                          color: '#e2e8f0'
                        }} 
                        itemStyle={{ padding: '2px 0' }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingTop: '15px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Min Price" 
                        stroke="#f43f5e" 
                        fillOpacity={1} 
                        fill="url(#chartMinGradient)" 
                        strokeWidth={2}
                        name="Market Minimum Price"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Avg Price" 
                        stroke="#10b981" 
                        fillOpacity={1} 
                        fill="url(#chartAvgGradient)" 
                        strokeWidth={2}
                        name="Market Average Price"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="MAP Price" 
                        stroke="#6366f1" 
                        strokeWidth={2} 
                        strokeDasharray="5 5"
                        name="MAP Policy Threshold"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Breach Timeline visualizer mapping out violation history with First Infraction vs Recurring Breach */}
              <SkuBreachTimeline 
                product={product} 
                scans={scans} 
                className="mt-2"
              />

              {/* 4. Active Partner Infringements */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    Active Partner Infringements
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    (Flagged in the latest compliance check)
                  </span>
                </div>

                {activeInfringements.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-emerald-500/20 text-center bg-emerald-500/[0.02] flex flex-col justify-center items-center">
                    <ShieldCheck className="w-10 h-10 text-emerald-500 mb-2" />
                    <span className="text-sm text-emerald-400 font-bold uppercase tracking-wider">Perfect Alignment</span>
                    <span className="text-xs text-slate-450 mt-1 max-w-md">
                      All monitored retail partners are currently compliant with your MAP policy for this SKU. No price undercutting detected.
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeInfringements.map((item, idx) => {
                      const price = item.detectedPrice || 0;
                      const deficit = product.mapPrice - price;
                      const percentDeficit = (deficit / product.mapPrice) * 100;
                      const isHighRisk = percentDeficit >= 10;

                      return (
                        <div 
                          key={`${item.id}-${idx}`}
                          className="p-4 rounded-xl border bg-slate-950/40 border-rose-500/20 shadow-lg shadow-rose-950/5 flex flex-col justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-slate-200 text-sm">
                                {item.partnerName || item.partnerDomain}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono uppercase tracking-wider ${
                                isHighRisk 
                                  ? "bg-rose-500/15 text-rose-450 border border-rose-500/20 animate-pulse" 
                                  : "bg-amber-500/15 text-amber-500 border border-amber-500/20"
                              }`}>
                                {isHighRisk ? "Severe Breach" : "Minor Violation"}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono block">
                              Domain: {item.partnerDomain}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-slate-500">MAP Threshold:</span>
                              <span className="text-slate-300 font-semibold">${product.mapPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-red-400">
                              <span className="text-red-400/80">Advertised Price:</span>
                              <span className="font-bold font-display">${price.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-800/80 pt-1.5 text-rose-450">
                              <span>Deficit Violation:</span>
                              <span className="font-bold">-${deficit.toFixed(2)} ({percentDeficit.toFixed(1)}%)</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-900 mt-1 gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleInitiateWarning(product, item)}
                              className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded font-mono text-[9px] font-bold uppercase tracking-wider cursor-pointer transition-all"
                            >
                              <Mail className="w-3 h-3 text-amber-400" />
                              <span>Send Warning</span>
                            </button>

                            {item.detectedUrl && (
                              <a 
                                href={item.detectedUrl} 
                                target="_blank" 
                                referrerPolicy="no-referrer"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline transition uppercase tracking-wider"
                              >
                                <span>Verify Listing</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 5. Historical Violations Trail */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-400" />
                    Historical Violations Trail Log
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    (Total: {historicalInfringements.length} records)
                  </span>
                </div>

                {historicalInfringements.length === 0 ? (
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/10 text-center text-xs text-slate-500">
                    No historical violations found in previous completed scans.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {historicalInfringements.map((item, idx) => {
                      const price = item.detectedPrice || 0;
                      const deficit = product.mapPrice - price;
                      return (
                        <div 
                          key={`hist-${item.id}-${idx}`}
                          className="p-3 rounded-xl bg-slate-950/20 border border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <span className="font-bold text-slate-300">
                              {item.partnerName || item.partnerDomain}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                              <span>Domain: {item.partnerDomain}</span>
                              <span>•</span>
                              <span>Scan Date: {new Date(item.scanDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 font-mono text-[11px] text-right">
                            <div className="text-slate-400">
                              Advertised: <span className="font-bold text-red-400">${price.toFixed(2)}</span>
                            </div>
                            <span className="text-rose-400 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/10">
                              -${deficit.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer bar */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setSelectedAnalyticsProduct(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition font-mono cursor-pointer"
              >
                Close Analytics
              </button>
            </div>

          </div>
        </div>
      );
    })()}

    {/* Interactive Trend Data Point Annotation Modal Dialog */}
    {annotationModal && (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in" id="interactive-trend-annotation-modal">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative font-sans">
          
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl text-indigo-400 bg-indigo-950/50 border border-indigo-900/50">
                <Tag className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  Interactive Trend Note
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">Annotating SKU: {annotationModal.sku} ({annotationModal.pointName})</p>
              </div>
            </div>
            
            <button 
              onClick={() => setAnnotationModal(null)}
              className="p-1 px-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-lg transition shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Details / Inputs */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-850">
              <div>
                <p className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest leading-none">Price Shift</p>
                <p className={`text-sm font-extrabold mt-1 font-mono ${annotationModal.deviation < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  {annotationModal.deviation > 0 ? "+" : ""}{annotationModal.deviation.toFixed(2)}% deviation
                </p>
              </div>
              <div>
                <p className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest leading-none">Est. Violator Price</p>
                <p className={`text-sm font-extrabold mt-1 font-mono ${annotationModal.deviation < 0 ? "text-rose-450" : "text-slate-300"}`}>
                  ${annotationModal.price.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">Deviation Cause & Notes</label>
              <textarea 
                value={annotationInput}
                onChange={(e) => setAnnotationInput(e.target.value)}
                placeholder="e.g. Approved holiday promotional event, unauthorized retailer flash sales, or price matcher algorithmic error..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition font-sans leading-relaxed resize-none"
                id="interactive-annotation-memo-input"
              />
            </div>
          </div>

          {/* Modal Footer / Action buttons */}
          <div className="px-6 py-4 bg-slate-950/70 border-t border-slate-800 flex gap-3 justify-end">
            <button 
              onClick={() => {
                // Delete annotation
                const key = `${annotationModal.sku}-${annotationModal.pointName}`;
                setTrendAnnotations(prev => {
                  const next = { ...prev };
                  delete next[key];
                  return next;
                });
                setAnnotationModal(null);
              }}
              className="px-4 py-2 text-xs font-bold text-rose-400 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 rounded-xl cursor-pointer transition-all text-center shrink-0 select-none"
              id="clear-interactive-annotation-btn"
            >
              Clear Note
            </button>

            <button 
              onClick={() => {
                // Save annotation
                const key = `${annotationModal.sku}-${annotationModal.pointName}`;
                setTrendAnnotations(prev => ({
                  ...prev,
                  [key]: annotationInput.trim()
                }));
                setAnnotationModal(null);
              }}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl cursor-pointer hover:brightness-110 active:scale-95 transition-all text-center shrink-0 select-none"
              id="save-interactive-annotation-btn"
            >
              Save Note
            </button>
          </div>

        </div>
      </div>
    )}

    {/* Side-by-Side Multi-SKU Comparison Modal */}
    {isCompareModalOpen && (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in" id="multi-sku-compare-modal">
        <div 
          className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <GitCompare className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-widest">
                  Multi-SKU Side-by-Side Audit
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  Comparative compliance analysis, price history, and financial impact projection
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setIsCompareModalOpen(false)}
              className="text-slate-500 hover:text-slate-350 hover:bg-slate-850 p-1.5 rounded-lg transition shrink-0 cursor-pointer"
              id="close-compare-modal-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {selectedCompareIds.length === 0 ? (
              <div className="p-16 text-center text-slate-400">
                <Tag className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-md font-semibold text-slate-300">No SKUs Selected</h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">Select some products in the catalog using the checkboxes to generate a comparison view.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/30">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800">
                      <th className="p-4 text-xs font-bold font-mono text-slate-400 uppercase tracking-widest w-[180px] sticky left-0 bg-slate-950 z-20">Metric</th>
                      {products.filter(p => selectedCompareIds.includes(p.id)).map(product => (
                        <th key={product.id} className="p-4 text-xs font-bold font-mono text-slate-200 border-l border-slate-800">
                          <div className="flex justify-between items-start gap-3">
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-indigo-400 font-mono px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded">
                                {product.sku}
                              </span>
                              <div className="font-semibold text-slate-100 max-w-[150px] truncate animate-fade-in" title={product.name}>
                                {product.name}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedCompareIds(prev => prev.filter(id => id !== product.id))}
                              className="text-rose-400/70 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition shrink-0 cursor-pointer"
                              title="Remove from comparison"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Basic Info Group */}
                    <tr className="bg-slate-900/40 border-b border-slate-800/60">
                      <td colSpan={selectedCompareIds.length + 1} className="px-4 py-2 text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest bg-slate-950/45">
                        Product Specification
                      </td>
                    </tr>
                    <tr className="border-b border-slate-850">
                      <td className="p-4 text-xs font-semibold text-slate-400 sticky left-0 bg-slate-950/30 z-10">MAP Threshold</td>
                      {products.filter(p => selectedCompareIds.includes(p.id)).map(product => (
                        <td key={product.id} className="p-4 text-sm font-bold font-mono text-emerald-400 border-l border-slate-800">
                          ${product.mapPrice.toFixed(2)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-850">
                      <td className="p-4 text-xs font-semibold text-slate-400 sticky left-0 bg-slate-950/30 z-10">Description</td>
                      {products.filter(p => selectedCompareIds.includes(p.id)).map(product => (
                        <td key={product.id} className="p-4 text-xs text-slate-400 border-l border-slate-800 max-w-[200px] truncate" title={product.description || "No description provided."}>
                          {product.description || "No description provided."}
                        </td>
                      ))}
                    </tr>

                    {/* Price History Group */}
                    <tr className="bg-slate-900/40 border-b border-slate-800/60">
                      <td colSpan={selectedCompareIds.length + 1} className="px-4 py-2 text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest bg-slate-950/45">
                        Price History & Trajectory
                      </td>
                    </tr>
                    <tr className="border-b border-slate-850">
                      <td className="p-4 text-xs font-semibold text-slate-400 sticky left-0 bg-slate-950/30 z-10">Latest Detected Price</td>
                      {products.filter(p => selectedCompareIds.includes(p.id)).map(product => {
                        const stats = getProductCompareStats(product);
                        const isViolating = stats.latestPrice < product.mapPrice;
                        return (
                          <td key={product.id} className="p-4 text-xs font-mono border-l border-slate-800">
                            <span className={`font-bold text-sm ${isViolating ? "text-rose-400" : "text-emerald-400"}`}>
                              ${stats.latestPrice.toFixed(2)}
                            </span>
                            {isViolating && (
                              <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase font-bold">
                                Violating
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b border-slate-850">
                      <td className="p-4 text-xs font-semibold text-slate-400 sticky left-0 bg-slate-950/30 z-10">Lowest Ever Price</td>
                      {products.filter(p => selectedCompareIds.includes(p.id)).map(product => {
                        const stats = getProductCompareStats(product);
                        const isViolating = stats.minDetectedPrice < product.mapPrice;
                        return (
                          <td key={product.id} className="p-4 text-xs font-bold font-mono border-l border-slate-800">
                            <span className={isViolating ? "text-rose-450" : "text-emerald-400"}>
                              ${stats.minDetectedPrice.toFixed(2)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b border-slate-850">
                      <td className="p-4 text-xs font-semibold text-slate-400 sticky left-0 bg-slate-950/30 z-10">Historical Price Deviation</td>
                      {products.filter(p => selectedCompareIds.includes(p.id)).map(product => {
                        const stats = getProductCompareStats(product);
                        const hasDev = stats.avgDeviationVal > 0;
                        return (
                          <td key={product.id} className="p-4 text-xs font-mono border-l border-slate-800">
                            {hasDev ? (
                              <div className="space-y-1">
                                <div className="text-rose-400 font-bold text-xs">
                                  -${stats.avgDeviationVal.toFixed(2)} (-{stats.avgDeviationPct.toFixed(1)}%)
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  Max Deficit: -${stats.maxDeviationVal.toFixed(2)} (-{stats.maxDeviationPct.toFixed(1)}%)
                                </div>
                              </div>
                            ) : (
                              <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> 0% (Compliant)
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b border-slate-850">
                      <td className="p-4 text-xs font-semibold text-slate-400 sticky left-0 bg-slate-950/30 z-10">Recent Scan Trajectory</td>
                      {products.filter(p => selectedCompareIds.includes(p.id)).map(product => {
                        const stats = getProductCompareStats(product);
                        return (
                          <td key={product.id} className="p-4 text-xs border-l border-slate-800 font-mono">
                            {stats.priceTrajectory.length === 0 ? (
                              <span className="text-slate-500 text-[10px]">No scan history yet</span>
                            ) : (
                              <div className="space-y-1.5 max-w-[200px]">
                                {stats.priceTrajectory.map((pt, index) => {
                                  const isViolating = pt.price < product.mapPrice;
                                  return (
                                    <div key={index} className="flex justify-between items-center text-[10px] border-b border-slate-900 pb-1 last:border-0 last:pb-0">
                                      <span className="text-slate-500">{pt.date}</span>
                                      <span className={`font-bold ${isViolating ? "text-rose-400" : "text-emerald-400"}`}>
                                        ${pt.price.toFixed(2)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Historical MAP Compliance Status Group */}
                    <tr className="bg-slate-900/40 border-b border-slate-800/60">
                      <td colSpan={selectedCompareIds.length + 1} className="px-4 py-2 text-[10px] font-bold font-mono text-indigo-400 uppercase tracking-widest bg-slate-950/45">
                        Historical MAP Compliance Status
                      </td>
                    </tr>
                    <tr className="border-b border-slate-850">
                      <td className="p-4 text-xs font-semibold text-slate-400 sticky left-0 bg-slate-950/30 z-10">Compliance Risk Level</td>
                      {products.filter(p => selectedCompareIds.includes(p.id)).map(product => {
                        const stats = getProductCompareStats(product);
                        const isCritical = stats.complianceStatus === "CRITICAL";
                        const isModerate = stats.complianceStatus === "MODERATE";
                        return (
                          <td key={product.id} className="p-4 text-xs border-l border-slate-800">
                            {isCritical ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold font-mono bg-rose-500/10 text-rose-400 border border-rose-500/30 uppercase tracking-wider animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-rose-400" /> Critical Risk
                              </span>
                            ) : isModerate ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                                <AlertCircle className="w-3 h-3 text-amber-400" /> Moderate Risk
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Fully Compliant
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b border-slate-850">
                      <td className="p-4 text-xs font-semibold text-slate-400 sticky left-0 bg-slate-950/30 z-10">Historical Compliance Rate</td>
                      {products.filter(p => selectedCompareIds.includes(p.id)).map(product => {
                        const stats = getProductCompareStats(product);
                        const rate = stats.historicalComplianceRate;
                        return (
                          <td key={product.id} className="p-4 text-xs font-mono border-l border-slate-800">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold text-sm ${rate >= 90 ? "text-emerald-400" : rate >= 60 ? "text-amber-400" : "text-rose-400"}`}>
                                {rate.toFixed(1)}%
                              </span>
                              <span className="text-[10px] text-slate-500 font-sans">
                                ({stats.totalScans - stats.spottedBreaches}/{stats.totalScans} clean runs)
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Breach Intensity Group */}
                    <tr className="bg-slate-900/40 border-b border-slate-800/60">
                      <td colSpan={selectedCompareIds.length + 1} className="px-4 py-2 text-[10px] font-bold font-mono text-amber-400 uppercase tracking-widest bg-slate-950/45">
                        Breach Intensity & Deviation Analysis
                      </td>
                    </tr>
                    <tr className="border-b border-slate-850">
                      <td className="p-4 text-xs font-semibold text-slate-400 sticky left-0 bg-slate-950/30 z-10">Breach Intensity Rating</td>
                      {products.filter(p => selectedCompareIds.includes(p.id)).map(product => {
                        const stats = getProductCompareStats(product);
                        const intensity = stats.breachIntensity;
                        return (
                          <td key={product.id} className="p-4 text-xs border-l border-slate-800">
                            {intensity === "EXTREME" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-widest">
                                Extreme Intensity
                              </span>
                            ) : intensity === "HIGH" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-orange-500/20 text-orange-300 border border-orange-500/40 uppercase tracking-widest">
                                High Intensity
                              </span>
                            ) : intensity === "MODERATE" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-widest">
                                Moderate Intensity
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 uppercase tracking-widest">
                                Low / Minimal
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b border-slate-850">
                      <td className="p-4 text-xs font-semibold text-slate-400 sticky left-0 bg-slate-950/30 z-10">Breach Frequency</td>
                      {products.filter(p => selectedCompareIds.includes(p.id)).map(product => {
                        const stats = getProductCompareStats(product);
                        const freq = Math.round(stats.breachFreq);
                        return (
                          <td key={product.id} className="p-4 text-xs font-bold font-mono border-l border-slate-800">
                            <span className={freq > 50 ? "text-rose-400" : freq > 0 ? "text-amber-400" : "text-emerald-400"}>
                              {freq}% ({stats.spottedBreaches} infractions in {stats.totalScans} scans)
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b border-slate-850">
                      <td className="p-4 text-xs font-semibold text-slate-400 sticky left-0 bg-slate-950/30 z-10">Avg & Peak Deficit</td>
                      {products.filter(p => selectedCompareIds.includes(p.id)).map(product => {
                        const stats = getProductCompareStats(product);
                        return (
                          <td key={product.id} className="p-4 text-xs font-mono border-l border-slate-800 space-y-1">
                            {stats.avgDeviationVal > 0 ? (
                              <>
                                <div className="text-rose-400 font-semibold">
                                  Avg Deficit: -${stats.avgDeviationVal.toFixed(2)} (-{stats.avgDeviationPct.toFixed(1)}%)
                                </div>
                                <div className="text-rose-500 text-[10px]">
                                  Peak Deficit: -${stats.maxDeviationVal.toFixed(2)} (-{stats.maxDeviationPct.toFixed(1)}%)
                                </div>
                              </>
                            ) : (
                              <span className="text-emerald-400 font-semibold">$0.00 (0.0% deficit)</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Total Potential Financial Impact Group */}
                    <tr className="bg-slate-900/40 border-b border-slate-800/60">
                      <td colSpan={selectedCompareIds.length + 1} className="px-4 py-2 text-[10px] font-bold font-mono text-rose-400 uppercase tracking-widest bg-slate-950/45">
                        Total Potential Financial Impact
                      </td>
                    </tr>
                    <tr className="border-b border-slate-850">
                      <td className="p-4 text-xs font-semibold text-slate-400 sticky left-0 bg-slate-950/30 z-10">Estimated Monthly Volume</td>
                      {products.filter(p => selectedCompareIds.includes(p.id)).map(product => {
                        const stats = getProductCompareStats(product);
                        return (
                          <td key={product.id} className="p-4 text-xs font-mono border-l border-slate-800 text-slate-300">
                            {stats.configVolume.toLocaleString()} units/mo
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b border-slate-850">
                      <td className="p-4 text-xs font-semibold text-slate-400 sticky left-0 bg-slate-950/30 z-10">Projected Monthly Loss</td>
                      {products.filter(p => selectedCompareIds.includes(p.id)).map(product => {
                        const stats = getProductCompareStats(product);
                        return (
                          <td key={product.id} className="p-4 text-xs font-bold font-mono border-l border-slate-800 text-rose-400">
                            ${stats.projectedMonthlyLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b border-slate-850">
                      <td className="p-4 text-xs font-semibold text-slate-400 sticky left-0 bg-slate-950/30 z-10">Total Projected Annual Impact</td>
                      {products.filter(p => selectedCompareIds.includes(p.id)).map(product => {
                        const stats = getProductCompareStats(product);
                        return (
                          <td key={product.id} className="p-4 text-xs font-bold font-mono border-l border-slate-800 text-rose-400 bg-rose-950/10">
                            <div className="text-sm text-rose-300 font-bold">
                              ${stats.projectedAnnualLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-[10px] text-slate-500 font-normal">
                              Estimated 12-month exposure
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center gap-3">
            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Dynamic side-by-side catalog analysis
            </span>

            <div className="flex items-center gap-2">
              {selectedCompareIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCompareIds([])}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl cursor-pointer transition border border-rose-500/20"
                >
                  Clear Selection
                </button>
              )}
              <button 
                type="button"
                onClick={() => setIsCompareModalOpen(false)}
                className="px-5 py-2 text-xs font-bold font-mono uppercase text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer transition border border-slate-700 shadow-sm"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Send Automated Warning Notice Modal */}
    {warningDraft && (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
        <div 
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Mail className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-widest">
                  Automated Warning Dispatch
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  Review & transmit enforcement notice to infringing reseller
                </p>
              </div>
            </div>
            <button 
              type="button"
              disabled={isSendingWarning}
              onClick={() => setWarningDraft(null)}
              className="text-slate-500 hover:text-slate-350 hover:bg-slate-850 p-1.5 rounded-lg transition disabled:opacity-30"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Violation Context */}
          <div className="p-5 bg-amber-500/[0.02] border-b border-slate-850 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-[9px] text-slate-500 uppercase block">Target Reseller</span>
              <span className="font-bold text-slate-200 mt-0.5 block truncate">
                {warningDraft.violation.partnerName || warningDraft.violation.partnerDomain}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 uppercase block">Violated SKU</span>
              <span className="font-bold text-indigo-400 mt-0.5 block truncate">
                {warningDraft.product.sku}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 uppercase block">Established MAP</span>
              <span className="font-bold text-slate-300 mt-0.5 block">
                ${(warningDraft.product?.mapPrice ?? 0).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-rose-450 uppercase block">Underpricing</span>
              <span className="font-bold text-rose-500 mt-0.5 block">
                ${(warningDraft.violation.detectedPrice || 0).toFixed(2)} (-${((warningDraft.product?.mapPrice ?? 0) - (warningDraft.violation.detectedPrice || 0)).toFixed(2)})
              </span>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Recipient */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold font-mono text-slate-350 uppercase tracking-wider">
                Reseller Compliance Email
              </label>
              <input 
                type="email"
                value={warningDraft.recipientEmail}
                onChange={(e) => setWarningDraft({ ...warningDraft, recipientEmail: e.target.value })}
                disabled={isSendingWarning}
                placeholder="compliance@reseller-domain.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-250 text-xs rounded-xl px-3.5 py-2.5 outline-none transition font-mono disabled:opacity-50"
              />
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold font-mono text-slate-350 uppercase tracking-wider">
                Message Subject Line
              </label>
              <input 
                type="text"
                value={warningDraft.subject}
                onChange={(e) => setWarningDraft({ ...warningDraft, subject: e.target.value })}
                disabled={isSendingWarning}
                placeholder="Notice of MAP Pricing Violation"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-250 text-xs rounded-xl px-3.5 py-2.5 outline-none transition font-sans font-semibold disabled:opacity-50"
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold font-mono text-slate-350 uppercase tracking-wider">
                Warning Notice Message Body
              </label>
              <textarea 
                value={warningDraft.body}
                onChange={(e) => setWarningDraft({ ...warningDraft, body: e.target.value })}
                disabled={isSendingWarning}
                rows={11}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-350 text-xs rounded-xl px-3.5 py-3 outline-none transition font-mono leading-relaxed resize-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center gap-3">
            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500/60" />
              This will update the partner's status to 'Warning'
            </span>

            <div className="flex gap-3">
              <button 
                type="button"
                disabled={isSendingWarning}
                onClick={() => setWarningDraft(null)}
                className="px-4 py-2 text-xs font-bold font-mono uppercase text-slate-400 hover:text-slate-200 hover:bg-slate-850 rounded-xl cursor-pointer transition-all border border-slate-800"
              >
                Cancel
              </button>

              <button 
                type="button"
                disabled={isSendingWarning}
                onClick={handleSendWarning}
                className="px-5 py-2 text-xs font-bold font-mono uppercase text-white bg-amber-500 hover:bg-amber-400 rounded-xl cursor-pointer hover:brightness-110 active:scale-95 transition-all text-center flex items-center gap-1.5 shadow-lg shadow-amber-950/20"
              >
                {isSendingWarning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Mail className="w-3.5 h-3.5" />
                )}
                <span>{isSendingWarning ? "Transmitting..." : "Send Notice"}</span>
              </button>
            </div>
          </div>

          {/* Sending / Success Overlay */}
          {isSendingWarning && (
            <div className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col items-center justify-center p-6 animate-fade-in">
              <div className="w-full max-w-sm text-center space-y-6">
                {sendSuccess ? (
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 flex items-center justify-center animate-bounce">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold font-mono text-emerald-400 uppercase tracking-widest">
                        Dispatch Succeeded
                      </h4>
                      <p className="text-xs text-slate-400 font-sans">
                        Notice has been successfully recorded in notifications and log trails.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative mx-auto w-12 h-12 flex items-center justify-center">
                      <Loader2 className="w-10 h-10 text-amber-400 animate-spin absolute" />
                      <Mail className="w-5 h-5 text-amber-500/50" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-widest animate-pulse">
                        {sendingStep}
                      </h4>
                      {/* Fake animated progress bar */}
                      <div className="w-full h-1.5 bg-slate-850 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full animate-pulse w-4/5" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Dedicated Quick MAP Threshold Override Modal */}
    {quickThresholdModalProduct && (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
        <div 
          className="relative w-full max-w-lg bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
                  Product MAP Threshold Override
                </h3>
                <p className="text-[11px] text-slate-400 font-sans">
                  Set SKU-specific minimum pricing threshold percentage
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setQuickThresholdModalProduct(null)}
              className="text-slate-500 hover:text-slate-300 hover:bg-slate-850 p-1.5 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Product Meta */}
          <div className="p-5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 block w-fit mb-1">
                {quickThresholdModalProduct.sku}
              </span>
              <h4 className="text-sm font-bold text-white leading-tight">
                {quickThresholdModalProduct.name}
              </h4>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">MAP Base Price</span>
              <span className="text-lg font-bold font-display text-emerald-400">
                ${quickThresholdModalProduct.mapPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                  MAP Threshold Percentage
                </label>
                <span className="text-sm font-mono font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-lg">
                  {modalThresholdVal}% MAP
                </span>
              </div>

              {/* Slider Control */}
              <input 
                type="range"
                min="50"
                max="100"
                step="1"
                value={modalThresholdVal}
                onChange={e => setModalThresholdVal(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />

              {/* Preset Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2">
                {[75, 80, 85, 90, 95, 100].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setModalThresholdVal(pct)}
                    className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg border transition ${
                      modalThresholdVal === pct
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    {pct}%{pct === 80 ? " (Default)" : ""}
                  </button>
                ))}
              </div>
            </div>

            {/* Impact Calculation Preview Box */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 font-mono">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Calculated Min Price Floor:</span>
                <span className="text-emerald-400 font-bold text-base">
                  ${((quickThresholdModalProduct.mapPrice * modalThresholdVal) / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Global 80% Baseline Floor:</span>
                <span className="text-slate-400">
                  ${((quickThresholdModalProduct.mapPrice * 80) / 100).toFixed(2)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-sans leading-relaxed">
                {modalThresholdVal !== 80 ? (
                  <span className="text-purple-300 font-medium flex items-center gap-1">
                    <Zap className="w-3 h-3 text-purple-400 shrink-0" />
                    This SKU override will require resellers to stay above ${((quickThresholdModalProduct.mapPrice * modalThresholdVal) / 100).toFixed(2)} to avoid violation alerts.
                  </span>
                ) : (
                  <span>Using standard global default of 80% (${((quickThresholdModalProduct.mapPrice * 80) / 100).toFixed(2)} floor).</span>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetModalThresholdToDefault}
              className="px-3.5 py-2 text-xs font-mono font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-rose-900/30 rounded-xl transition cursor-pointer"
            >
              Reset to 80% Default
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuickThresholdModalProduct(null)}
                className="px-4 py-2 text-xs font-mono font-bold text-slate-400 hover:text-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyModalThreshold}
                className="px-5 py-2 text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-900/30 transition cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                Save Custom Threshold
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
