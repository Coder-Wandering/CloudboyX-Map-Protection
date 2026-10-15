import React, { useState, useEffect } from "react";
import { Partner, Product, MapPolicy, ScanJob, PartnerSnoozeRule } from "../types";
import { InfractionTimelineSVG } from "./InfractionTimelineSVG";
import { 
  Plus, Trash2, Globe, Mail, Search, Building2, ShieldCheck, 
  ShieldAlert, Edit3, Save, FileText, Check, Calendar, 
  AlertTriangle, Send, ChevronRight, X, ExternalLink,
  ChevronDown, MessageSquare, Phone, User, History, Award, TrendingUp,
  Bell, BellOff, Clock, Timer, CheckCircle2, Sparkles, PauseCircle, PlayCircle
} from "lucide-react";

interface PartnersViewProps {
  partners: Partner[];
  products: Product[];
  policies: MapPolicy[];
  scans?: ScanJob[];
  onAddPartner: (
    name: string, 
    domain: string, 
    contactEmail: string, 
    contactPerson?: string,
    contactPhone?: string,
    associatedPolicies?: string[], 
    associatedProducts?: string[], 
    complianceStatus?: string, 
    notes?: string,
    mapThresholdPercent?: number,
    riskSensitivity?: string,
    snoozeRule?: PartnerSnoozeRule | null
  ) => void;
  onUpdatePartner: (id: string, updatedFields: any) => void;
  onDeletePartner: (id: string) => void;
  highlightPartnerName?: string;
  onClearHighlight?: () => void;
}

export default function PartnersView({ 
  partners = [], 
  products = [], 
  policies = [], 
  scans = [],
  onAddPartner, 
  onUpdatePartner, 
  onDeletePartner,
  highlightPartnerName,
  onClearHighlight
}: PartnersViewProps) {
  // Navigation & filter states
  const [filterQuery, setFilterQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [selectedMapRegion, setSelectedMapRegion] = useState<string | null>(null);

  // Live timer for real-time snooze countdown updates
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Per-partner Snooze Modal State
  const [isSnoozeModalOpen, setIsSnoozeModalOpen] = useState(false);
  const [snoozeTargetPartner, setSnoozeTargetPartner] = useState<Partner | null>(null);
  const [snoozeDurationHours, setSnoozeDurationHours] = useState<number>(24);
  const [isCustomSnooze, setIsCustomSnooze] = useState(false);
  const [customSnoozeDate, setCustomSnoozeDate] = useState("");
  const [snoozeReason, setSnoozeReason] = useState("");
  const [snoozeAutoDismiss, setSnoozeAutoDismiss] = useState(true);

  // Active view tab for the selected partner: 'overview' | 'compliance_history'
  const [activePartnerTab, setActivePartnerTab] = useState<'overview' | 'compliance_history'>('overview');

  useEffect(() => {
    if (highlightPartnerName) {
      const match = partners.find(
        p => p.name.toLowerCase() === highlightPartnerName.toLowerCase() ||
             p.domain.toLowerCase() === highlightPartnerName.toLowerCase()
      );
      if (match) {
        setSelectedPartner(match);
        setSelectedStatusFilter("all");
        setFilterQuery(""); // Clear search filter to make sure it's visible
      }
      if (onClearHighlight) {
        onClearHighlight();
      }
    }
  }, [highlightPartnerName, partners, onClearHighlight]);
  
  // Onboarding Form States
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDomain, setFormDomain] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPerson, setFormPerson] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formStatus, setFormStatus] = useState<string>("pending");
  const [formSelectedPolicies, setFormSelectedPolicies] = useState<string[]>(["pol-1"]);
  const [formSelectedProducts, setFormSelectedProducts] = useState<string[]>([]);
  const [formMapThresholdPercent, setFormMapThresholdPercent] = useState<number>(0);
  const [formRiskSensitivity, setFormRiskSensitivity] = useState<'critical' | 'high' | 'medium' | 'low'>('critical');
  
  // Partner Editing States
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPerson, setEditPerson] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editMapThresholdPercent, setEditMapThresholdPercent] = useState<number>(0);
  const [editRiskSensitivity, setEditRiskSensitivity] = useState<'critical' | 'high' | 'medium' | 'low'>('critical');

  // Simulated Email dispatch state
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  // Helper to check if a partner is actively snoozed
  const isPartnerSnoozed = (p: Partner) => {
    return !!(p.snoozeRule && p.snoozeRule.snoozedUntil > currentTime);
  };

  // Helper stats deriving
  const totalCount = partners.length;
  const compliantCount = partners.filter(p => p.complianceStatus === "compliant").length;
  const violatingCount = partners.filter(p => p.complianceStatus === "violating").length;
  const warningCount = partners.filter(p => p.complianceStatus === "warning").length;
  const pendingCount = partners.filter(p => p.complianceStatus === "pending").length;
  const snoozedCount = partners.filter(p => isPartnerSnoozed(p)).length;

  const formatRemainingTime = (snoozedUntil: number) => {
    const diffMs = snoozedUntil - currentTime;
    if (diffMs <= 0) return "Expired";
    const totalSec = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const handleOpenSnoozeModal = (partner: Partner) => {
    setSnoozeTargetPartner(partner);
    if (partner.snoozeRule && partner.snoozeRule.snoozedUntil > currentTime) {
      setSnoozeReason(partner.snoozeRule.reason || "");
      setSnoozeAutoDismiss(partner.snoozeRule.autoDismissViolations !== false);
      const remainingHours = Math.max(1, Math.round((partner.snoozeRule.snoozedUntil - currentTime) / 3600000));
      setSnoozeDurationHours(partner.snoozeRule.snoozeHours || remainingHours);
      setIsCustomSnooze(false);
    } else {
      setSnoozeDurationHours(24);
      setIsCustomSnooze(false);
      setSnoozeReason("Authorized promotional clearance waiver");
      setSnoozeAutoDismiss(true);
    }
    setIsSnoozeModalOpen(true);
  };

  const handleSaveSnoozeRule = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!snoozeTargetPartner) return;

    let targetUntilMs: number;
    let durationHoursCalculated = snoozeDurationHours;

    if (isCustomSnooze && customSnoozeDate) {
      targetUntilMs = new Date(customSnoozeDate).getTime();
      durationHoursCalculated = Math.max(1, Math.round((targetUntilMs - Date.now()) / 3600000));
    } else {
      targetUntilMs = Date.now() + snoozeDurationHours * 3600000;
    }

    if (targetUntilMs <= Date.now()) {
      alert("Please choose a future date/time for the snooze expiration.");
      return;
    }

    const newRule: PartnerSnoozeRule = {
      snoozedUntil: targetUntilMs,
      snoozeHours: durationHoursCalculated,
      reason: snoozeReason.trim() || "Promotional clearance waiver",
      autoDismissViolations: snoozeAutoDismiss,
      createdAt: Date.now(),
      createdByUser: "Compliance Operations"
    };

    onUpdatePartner(snoozeTargetPartner.id, { snoozeRule: newRule });
    if (selectedPartner && selectedPartner.id === snoozeTargetPartner.id) {
      setSelectedPartner({ ...selectedPartner, snoozeRule: newRule });
    }
    setIsSnoozeModalOpen(false);
    setSnoozeTargetPartner(null);
  };

  const handleClearSnooze = (partner: Partner) => {
    onUpdatePartner(partner.id, { snoozeRule: null });
    if (selectedPartner && selectedPartner.id === partner.id) {
      setSelectedPartner({ ...selectedPartner, snoozeRule: null });
    }
  };

  const handleExtendSnoozeHours = (partner: Partner, extraHours: number) => {
    const baseUntil = partner.snoozeRule && partner.snoozeRule.snoozedUntil > currentTime 
      ? partner.snoozeRule.snoozedUntil 
      : currentTime;
    const newUntil = baseUntil + extraHours * 3600000;
    const newRule: PartnerSnoozeRule = {
      ...(partner.snoozeRule || {}),
      snoozedUntil: newUntil,
      snoozeHours: (partner.snoozeRule?.snoozeHours || 0) + extraHours,
      reason: partner.snoozeRule?.reason || "Extended clearance waiver",
      autoDismissViolations: partner.snoozeRule?.autoDismissViolations !== false,
      createdAt: Date.now(),
      createdByUser: "Compliance Operations"
    };

    onUpdatePartner(partner.id, { snoozeRule: newRule });
    if (selectedPartner && selectedPartner.id === partner.id) {
      setSelectedPartner({ ...selectedPartner, snoozeRule: newRule });
    }
  };

  const handleSubmitOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formDomain) return;
    
    // Pass everything to parent callback
    onAddPartner(
      formName, 
      formDomain, 
      formEmail, 
      formPerson,
      formPhone,
      formSelectedPolicies, 
      formSelectedProducts, 
      formStatus as any, 
      formNotes,
      formMapThresholdPercent,
      formRiskSensitivity
    );

    // Reset states
    setFormName("");
    setFormDomain("");
    setFormEmail("");
    setFormPerson("");
    setFormPhone("");
    setFormNotes("");
    setFormStatus("pending");
    setFormSelectedPolicies(["pol-1"]);
    setFormSelectedProducts([]);
    setFormMapThresholdPercent(0);
    setFormRiskSensitivity("critical");
    setIsOnboardingOpen(false);
  };

  const handleToggleProductInForm = (productId: string) => {
    setFormSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };

  const handleTogglePolicyInForm = (policyId: string) => {
    setFormSelectedPolicies(prev => 
      prev.includes(policyId) 
        ? prev.filter(id => id !== policyId) 
        : [...prev, policyId]
    );
  };

  const handleToggleProductForSelectedPartner = (productId: string) => {
    if (!selectedPartner) return;
    const currentProducts = selectedPartner.associatedProducts || [];
    const updatedProducts = currentProducts.includes(productId)
      ? currentProducts.filter(id => id !== productId)
      : [...currentProducts, productId];
      
    // Update server and local active selection view
    onUpdatePartner(selectedPartner.id, { associatedProducts: updatedProducts });
    setSelectedPartner(prev => prev ? { ...prev, associatedProducts: updatedProducts } : null);
  };

  const handleTogglePolicyForSelectedPartner = (policyId: string) => {
    if (!selectedPartner) return;
    const currentPolicies = selectedPartner.associatedPolicies || [];
    const updatedPolicies = currentPolicies.includes(policyId)
      ? currentPolicies.filter(id => id !== policyId)
      : [...currentPolicies, policyId];
      
    onUpdatePartner(selectedPartner.id, { associatedPolicies: updatedPolicies });
    setSelectedPartner(prev => prev ? { ...prev, associatedPolicies: updatedPolicies } : null);
  };

  const handleUpdateStatus = (partnerId: string, status: string) => {
    onUpdatePartner(partnerId, { complianceStatus: status });
    if (selectedPartner && selectedPartner.id === partnerId) {
      setSelectedPartner(prev => prev ? { ...prev, complianceStatus: status as any } : null);
    }
  };

  const handleSaveMetaChanges = () => {
    if (!selectedPartner) return;
    const updated = {
      name: editName,
      domain: editDomain,
      contactEmail: editEmail,
      contactPerson: editPerson,
      contactPhone: editPhone,
      notes: editNotes,
      mapThresholdPercent: editMapThresholdPercent,
      riskSensitivity: editRiskSensitivity
    };
    onUpdatePartner(selectedPartner.id, updated);
    setSelectedPartner(prev => prev ? { ...prev, ...updated } : null);
    setIsEditingMeta(false);
  };

  const handleTriggerEditState = (partner: Partner) => {
    setEditName(partner.name);
    setEditDomain(partner.domain);
    setEditEmail(partner.contactEmail);
    setEditPerson(partner.contactPerson || "");
    setEditPhone(partner.contactPhone || "");
    setEditNotes(partner.notes || "");
    setEditMapThresholdPercent(partner.mapThresholdPercent !== undefined ? partner.mapThresholdPercent : 0);
    setEditRiskSensitivity(partner.riskSensitivity || "critical");
    setIsEditingMeta(true);
  };

  const handleSimulateWarningDispatch = (partner: Partner) => {
    setIsDispatching(true);
    setDispatchSuccess(null);
    setTimeout(() => {
      setIsDispatching(false);
      setDispatchSuccess(`Compliance Warning drafted and dispatched to ${partner.contactEmail || "authorized web contacts"} successfully!`);
      setTimeout(() => setDispatchSuccess(null), 5000);
    }, 1200);
  };

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

  // Extract latest scans for active violations list
  const lastScanForEachProduct: Record<string, ScanJob> = {};
  (scans || []).forEach(scan => {
    const existing = lastScanForEachProduct[scan.productId];
    if (!existing || new Date(scan.startedAt).getTime() > new Date(existing.startedAt).getTime()) {
      lastScanForEachProduct[scan.productId] = scan;
    }
  });

  const activeViolationsList: { product: string; partnerId: string; partner: string; domain: string; map: number; found: number; url: string; time: string }[] = [];
  Object.values(lastScanForEachProduct).forEach(scan => {
    (scan.items || []).forEach(item => {
      if (item.status === 'violating') {
        activeViolationsList.push({
          product: scan.productName,
          partnerId: item.partnerId || '',
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

  // Filter partners list
  const filteredPartners = partners.filter(p => {
    const query = filterQuery.toLowerCase();
    const matchesQuery = p.name.toLowerCase().includes(query) || p.domain.toLowerCase().includes(query);
    let matchesStatus = true;
    if (selectedStatusFilter === "snoozed") {
      matchesStatus = isPartnerSnoozed(p);
    } else if (selectedStatusFilter !== "all") {
      matchesStatus = p.complianceStatus === selectedStatusFilter;
    }
    const matchesRegion = !selectedMapRegion || getRegionForPartnerName(p.name, p.domain) === selectedMapRegion;
    return matchesQuery && matchesStatus && matchesRegion;
  });

  // Safe getter for compliance badges
  const getStatusBadge = (partnerOrStatus: Partner | string | undefined) => {
    const status = typeof partnerOrStatus === 'object' ? partnerOrStatus.complianceStatus : partnerOrStatus;
    const partner = typeof partnerOrStatus === 'object' ? partnerOrStatus : undefined;
    const isSnoozed = partner && isPartnerSnoozed(partner);

    if (isSnoozed && partner?.snoozeRule) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950/50 text-amber-300 border border-amber-800/60 shadow-sm" title={`Snoozed until ${new Date(partner.snoozeRule.snoozedUntil).toLocaleString()}`}>
          <BellOff className="w-3 h-3 text-amber-400 animate-pulse" />
          Snoozed ({formatRemainingTime(partner.snoozeRule.snoozedUntil)})
        </span>
      );
    }

    switch (status) {
      case "compliant":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-900/40">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Compliant
          </span>
        );
      case "violating":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/45 text-rose-400 border border-rose-900/40 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            Violating
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/40 text-amber-300 border border-amber-900/30">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
            Warning Status
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-900 text-zinc-400 border border-zinc-700/60">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500"></span>
            Pending Sweep
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 font-sans" id="partners-module-root">
      
      {/* Active Partner Snooze Alert Banner if any partners are snoozed */}
      {snoozedCount > 0 && (
        <div className="bg-amber-950/30 border border-amber-800/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
              <BellOff className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-300 flex items-center gap-2">
                <span>{snoozedCount} Reseller{snoozedCount > 1 ? "s" : ""} Auto-Dismissing Alerts</span>
                <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-semibold">
                  Custom Snooze Active
                </span>
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Time-based auto-dismissal is active for specific partners without muting system-wide breach tracking.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedStatusFilter("snoozed")}
            className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl transition cursor-pointer font-mono shrink-0"
          >
            View {snoozedCount} Snoozed Partner{snoozedCount > 1 ? "s" : ""} →
          </button>
        </div>
      )}

      {/* 1. Header Overview Cards */}
      <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold block -mb-4">Compliance Statistics Panel</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Total stats */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">REGISTRY SIZE</p>
          <p className="text-2xl font-black text-white mt-1.5">{totalCount}</p>
          <p className="text-[9px] text-zinc-500 mt-1 uppercase font-semibold">Active resellers</p>
        </div>

        {/* Compliant stats */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-[10px] font-bold text-emerald-450 uppercase tracking-widest font-mono text-emerald-400">FULLY COMPLIANT</p>
          <p className="text-2xl font-black text-emerald-400 mt-1.5">{compliantCount}</p>
          <p className="text-[9px] text-emerald-500 mt-1 uppercase font-semibold">
            {totalCount > 0 ? Math.round((compliantCount / totalCount) * 100) : 100}% of catalog
          </p>
        </div>

        {/* Violating stats */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-[10px] font-bold text-rose-450 uppercase tracking-widest font-mono text-rose-400">BREACHED TRACKS</p>
          <p className="text-2xl font-black text-rose-400 mt-1.5">{violatingCount}</p>
          <p className="text-[9px] text-rose-500 mt-1 uppercase font-semibold text-rose-500/80 animate-pulse">Action required</p>
        </div>

        {/* Warning stats */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-[10px] font-bold text-amber-450 uppercase tracking-widest font-mono text-amber-300">BORDERLINE MAP</p>
          <p className="text-2xl font-black text-amber-300 mt-1.5">{warningCount}</p>
          <p className="text-[9px] text-amber-500/80 mt-1 uppercase font-semibold text-amber-500">Under surveillance</p>
        </div>

        {/* Snoozed stats */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono flex items-center justify-center gap-1">
            <BellOff className="w-3 h-3" /> SNOOZED
          </p>
          <p className="text-2xl font-black text-amber-400 mt-1.5">{snoozedCount}</p>
          <p className="text-[9px] text-amber-500/80 mt-1 uppercase font-semibold">Auto-dismiss active</p>
        </div>

        {/* Pending stats */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono text-zinc-400">PENDING AUDIT</p>
          <p className="text-2xl font-black text-zinc-400 mt-1.5">{pendingCount}</p>
          <p className="text-[9px] text-zinc-500 mt-1 uppercase font-semibold">Unchecked slots</p>
        </div>

      </div>

      {/* Geographical Policy Heatmap Section */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6" id="geographical-heatmap-container">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide font-mono">
              <Globe className="w-4 h-4 text-indigo-400" />
              Global Reseller Policy Heatmap
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Geographical distribution of reseller network compliance and concentration of MAP policy violations.
            </p>
          </div>
          {selectedMapRegion && (
            <button
              onClick={() => setSelectedMapRegion(null)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer font-mono"
            >
              <X className="w-3.5 h-3.5" />
              Reset Region Filter: {selectedMapRegion}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Map Section (7 cols) */}
          <div className="lg:col-span-7 bg-zinc-950/40 rounded-xl border border-zinc-850 p-4 flex flex-col justify-between min-h-[220px] relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Interactive Policy Density</span>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Compliant</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Warning</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> High Risk</span>
              </div>
            </div>

            {/* SVG MAP */}
            <div className="relative flex-1 flex items-center justify-center">
              <svg viewBox="0 0 200 100" className="w-full max-w-[550px] h-auto" preserveAspectRatio="xMidYMid meet">
                {/* Abstract high-tech grid overlay */}
                <g stroke="#1e1b4b" strokeWidth="0.4" strokeDasharray="2,2" opacity="0.25">
                  <line x1="0" y1="20" x2="200" y2="20" />
                  <line x1="0" y1="50" x2="200" y2="50" />
                  <line x1="0" y1="80" x2="200" y2="80" />
                  <line x1="50" y1="0" x2="50" y2="100" />
                  <line x1="100" y1="0" x2="100" y2="100" />
                  <line x1="150" y1="0" x2="150" y2="100" />
                </g>

                {/* SVG region paths */}
                {(() => {
                  const mapRegions = [
                    { id: "ca", name: "Canada", d: "M 15,12 Q 35,8 48,16 T 50,22 Q 38,25 20,20 Z" },
                    { id: "us", name: "United States", d: "M 18,22 Q 38,24 50,24 T 52,35 Q 38,38 20,32 Z" },
                    { id: "eu", name: "Europe", d: "M 90,15 Q 115,10 125,25 T 100,45 Q 90,30 90,15 Z" },
                    { id: "apac", name: "APAC", d: "M 130,15 Q 165,12 185,25 T 155,55 Q 135,40 130,15 Z" },
                    { id: "latam", name: "LATAM", d: "M 45,45 Q 55,50 48,75 T 38,85 Q 35,60 45,45 Z" }
                  ];

                  return mapRegions.map(reg => {
                    const regionPartners = partners.filter(p => getRegionForPartnerName(p.name, p.domain) === reg.name);
                    const regionViolations = activeViolationsList.filter(v => getRegionForPartnerName(v.partner, v.domain) === reg.name);
                    const activeViolationsCount = regionViolations.length;
                    
                    const isSelected = selectedMapRegion === reg.name;
                    const isHovered = hoveredRegion === reg.id;

                    // Color based on active violations density
                    let fillColor = "rgba(24, 24, 27, 0.4)"; // dark default
                    if (regionPartners.length > 0) {
                      if (activeViolationsCount === 0) {
                        fillColor = isHovered || isSelected ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.12)";
                      } else if (activeViolationsCount <= 2) {
                        fillColor = isHovered || isSelected ? "rgba(245, 158, 11, 0.45)" : "rgba(245, 158, 11, 0.22)";
                      } else {
                        fillColor = isHovered || isSelected ? "rgba(239, 68, 68, 0.55)" : "rgba(239, 68, 68, 0.28)";
                      }
                    }

                    return (
                      <path
                        key={reg.id}
                        d={reg.d}
                        fill={fillColor}
                        stroke={isSelected ? "#818cf8" : isHovered ? "#6366f1" : "#27272a"}
                        strokeWidth={isSelected ? "1.2" : "0.6"}
                        className="transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setHoveredRegion(reg.id)}
                        onMouseLeave={() => setHoveredRegion(null)}
                        onClick={() => setSelectedMapRegion(reg.name === selectedMapRegion ? null : reg.name)}
                      />
                    );
                  });
                })()}

                {/* Connections overlay */}
                <g stroke="#312e81" strokeWidth="0.5" strokeDasharray="1,2" opacity="0.3">
                  <line x1="45" y1="35" x2="105" y2="24" />
                  <line x1="45" y1="35" x2="62" y2="68" />
                  <line x1="105" y1="24" x2="155" y2="40" />
                </g>

                {/* Hotspot radar points */}
                {(() => {
                  const regionCoordinates = [
                    { id: "us", name: "United States", x: 45, y: 35 },
                    { id: "ca", name: "Canada", x: 42, y: 18 },
                    { id: "eu", name: "Europe", x: 105, y: 24 },
                    { id: "apac", name: "APAC", x: 155, y: 40 },
                    { id: "latam", name: "LATAM", x: 62, y: 68 },
                  ];

                  return regionCoordinates.map(reg => {
                    const regionPartners = partners.filter(p => getRegionForPartnerName(p.name, p.domain) === reg.name);
                    const regionViolations = activeViolationsList.filter(v => getRegionForPartnerName(v.partner, v.domain) === reg.name);
                    const activeViolationsCount = regionViolations.length;
                    
                    if (regionPartners.length === 0) return null;

                    const isSelected = selectedMapRegion === reg.name;
                    const isHovered = hoveredRegion === reg.id;
                    const hasViolations = activeViolationsCount > 0;

                    let pointColor = "#10b981"; // compliant green
                    if (activeViolationsCount > 2) {
                      pointColor = "#ef4444"; // red high risk
                    } else if (activeViolationsCount > 0) {
                      pointColor = "#f59e0b"; // amber warn
                    }

                    return (
                      <g
                        key={reg.id}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredRegion(reg.id)}
                        onMouseLeave={() => setHoveredRegion(null)}
                        onClick={() => setSelectedMapRegion(reg.name === selectedMapRegion ? null : reg.name)}
                      >
                        {hasViolations && (
                          <circle
                            cx={reg.x}
                            cy={reg.y}
                            r={isHovered || isSelected ? 8 : 4.5}
                            fill="none"
                            stroke={pointColor}
                            strokeWidth="1"
                            className="animate-ping origin-center"
                            style={{ animationDuration: '3s' }}
                          />
                        )}
                        <circle
                          cx={reg.x}
                          cy={reg.y}
                          r={isHovered || isSelected ? 4.5 : 3}
                          fill={pointColor}
                          className="transition-all duration-200"
                        />
                      </g>
                    );
                  });
                })()}
              </svg>

              {/* FLOATING MAP TOOLTIP (Shows on hover of any region) */}
              {(() => {
                const activeId = hoveredRegion;
                if (!activeId) return null;
                
                const regionCoordinates = [
                  { id: "us", name: "United States", x: 45, y: 35 },
                  { id: "ca", name: "Canada", x: 42, y: 18 },
                  { id: "eu", name: "Europe", x: 105, y: 24 },
                  { id: "apac", name: "APAC", x: 155, y: 40 },
                  { id: "latam", name: "LATAM", x: 62, y: 68 },
                ];
                
                const regInfo = regionCoordinates.find(r => r.id === activeId);
                if (!regInfo) return null;

                const regionPartners = partners.filter(p => getRegionForPartnerName(p.name, p.domain) === regInfo.name);
                const regionViolations = activeViolationsList.filter(v => getRegionForPartnerName(v.partner, v.domain) === regInfo.name);
                const violationCount = regionViolations.length;

                const isHigh = violationCount > 2;
                const isMedium = violationCount > 0 && violationCount <= 2;

                const leftPct = regInfo.x / 2; // since x is 0-200
                const topPct = regInfo.y; // since y is 0-100

                return (
                  <div
                    className="absolute z-50 pointer-events-none transition-all duration-150 backdrop-blur-md shadow-2xl rounded-xl border border-zinc-800 bg-zinc-950/95 p-3 text-[10px] font-mono leading-normal text-slate-100 w-52"
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      transform: 'translate(-50%, -105%)',
                    }}
                  >
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-2">
                      <span className="text-white font-extrabold text-[11px] flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${violationCount > 0 ? (isHigh ? "bg-red-500 animate-pulse" : "bg-amber-500") : "bg-emerald-500"}`} />
                        {regInfo.name}
                      </span>
                      <span className={`px-1 py-0.5 rounded text-[8px] font-bold ${
                        isHigh 
                          ? "bg-red-950/50 text-red-400 border border-red-900/40" 
                          : isMedium 
                            ? "bg-amber-950/50 text-amber-400 border border-amber-900/40" 
                            : "bg-emerald-950/50 text-emerald-400 border border-emerald-900/40"
                      }`}>
                        {isHigh ? "HIGH RISK" : isMedium ? "MODERATE" : "STABLE"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Resellers:</span>
                        <span className="text-white font-bold">{regionPartners.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">MAP Violations:</span>
                        <span className={`font-bold ${violationCount > 0 ? "text-red-400" : "text-emerald-400"}`}>{violationCount}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            <div className="text-[9px] font-mono text-zinc-500 text-center mt-2">
              💡 Click any region path or dot to filter the Reseller directory.
            </div>
          </div>

          {/* Regional Analytics Grid (5 cols) */}
          <div className="lg:col-span-5 bg-zinc-950/20 rounded-xl border border-zinc-850 p-4 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Regional Breakdown Analysis</span>
              
              <div className="space-y-3 max-h-[195px] overflow-y-auto pr-1">
                {(() => {
                  const regionsData = [
                    { id: "us", name: "United States", flag: "🇺🇸" },
                    { id: "ca", name: "Canada", flag: "🇨🇦" },
                    { id: "eu", name: "Europe", flag: "🇪🇺" },
                    { id: "apac", name: "APAC", flag: "🌏" },
                    { id: "latam", name: "LATAM", flag: "🌎" }
                  ];

                  return regionsData.map(reg => {
                    const regionPartners = partners.filter(p => getRegionForPartnerName(p.name, p.domain) === reg.name);
                    const regionViolations = activeViolationsList.filter(v => getRegionForPartnerName(v.partner, v.domain) === reg.name);
                    const activeViolationsCount = regionViolations.length;
                    
                    const isSelected = selectedMapRegion === reg.name;
                    const hasPartners = regionPartners.length > 0;

                    // Get top violating partners in region
                    const violatingPartners = regionPartners.map(p => {
                      const partnerViolations = regionViolations.filter(v => v.partner === p.name || v.domain === p.domain);
                      return {
                        name: p.name,
                        vCount: partnerViolations.length,
                        status: p.complianceStatus || 'compliant'
                      };
                    }).filter(item => item.vCount > 0 || item.status === 'violating' || item.status === 'warning')
                      .sort((a, b) => b.vCount - a.vCount);

                    return (
                      <div
                        key={reg.id}
                        onClick={() => setSelectedMapRegion(reg.name === selectedMapRegion ? null : reg.name)}
                        className={`p-3 rounded-xl border transition cursor-pointer text-left ${
                          isSelected
                            ? "bg-indigo-950/25 border-indigo-500 text-indigo-200"
                            : "bg-zinc-900/40 hover:bg-zinc-900/70 border-zinc-850 text-zinc-400"
                        } ${!hasPartners ? "opacity-40" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs">{reg.flag}</span>
                            <span className="font-bold text-xs text-white uppercase tracking-tight">{reg.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-zinc-400">
                              {regionPartners.length} {regionPartners.length === 1 ? 'reseller' : 'resellers'}
                            </span>
                            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                              activeViolationsCount > 2 
                                ? "bg-red-950/50 text-red-400 border border-red-900/40 animate-pulse" 
                                : activeViolationsCount > 0 
                                  ? "bg-amber-950/50 text-amber-300 border border-amber-900/40" 
                                  : "bg-emerald-950/50 text-emerald-400 border border-emerald-900/40"
                            }`}>
                              {activeViolationsCount} {activeViolationsCount === 1 ? 'incident' : 'incidents'}
                            </span>
                          </div>
                        </div>

                        {/* Expand to show Top Violators in region if selected */}
                        {isSelected && hasPartners && (
                          <div className="mt-2.5 pt-2 border-t border-zinc-800 space-y-1.5 animate-fade-in text-[10px]">
                            <span className="text-zinc-500 uppercase tracking-wider font-extrabold text-[8.5px] block">Top Violating Partners in {reg.name}:</span>
                            {violatingPartners.length > 0 ? (
                              <div className="space-y-1">
                                {violatingPartners.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-black/30 p-1.5 rounded border border-zinc-850/50">
                                    <span className="text-slate-200 truncate max-w-[170px]" title={item.name}>
                                      {item.name}
                                    </span>
                                    <span className={`font-mono font-bold shrink-0 text-[9px] px-1.5 py-0.2 rounded ${
                                      item.vCount > 2 
                                        ? 'text-red-400 bg-red-950/40' 
                                        : item.vCount > 0 
                                          ? 'text-amber-400 bg-amber-950/40' 
                                          : 'text-amber-500 bg-zinc-900/40'
                                    }`}>
                                      {item.vCount} {item.vCount === 1 ? 'alert' : 'alerts'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-emerald-400 text-center font-bold text-[9px] py-1">
                                ✓ 100% Compliant — No active violations
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-850 flex items-center justify-between text-[10px] font-mono text-zinc-500 mt-2">
              <span>Active regional deviation index</span>
              <span className="text-red-400 font-bold font-mono">
                {activeViolationsList.length} global breaches
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Controls, Filter and Registry Wrapper */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Direct Left Column / Partner List Directory */}
        <div className="flex-1 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-4 rounded-2xl border border-zinc-800 shadow-sm">
            
            {/* Left aligned: query filter and status filters */}
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="text" 
                  value={filterQuery}
                  onChange={e => setFilterQuery(e.target.value)}
                  placeholder="Search manufacturer list or URL..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 transition font-mono"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
                {["all", "compliant", "violating", "warning", "snoozed", "pending"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setSelectedStatusFilter(v)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer select-none border-transparent uppercase text-[9px] font-mono tracking-wider flex items-center gap-1.5 ${
                      selectedStatusFilter === v 
                        ? v === "snoozed"
                          ? "bg-amber-500 text-black font-bold"
                          : "bg-indigo-600 text-white font-bold"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {v === "snoozed" && <BellOff className="w-3 h-3" />}
                    <span>{v}</span>
                    {v === "snoozed" && snoozedCount > 0 && (
                      <span className="bg-amber-400/20 text-amber-300 px-1 py-0.2 rounded text-[8px] font-bold">
                        {snoozedCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Onboard Partner trigger button */}
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-indigo-500/10 shrink-0 uppercase tracking-widest font-mono"
            >
              <Plus className="w-3.5 h-3.5" />
              Onboard Partner
            </button>
          </div>

          {/* Core Directory Checklist */}
          {filteredPartners.length === 0 ? (
            <div className="p-16 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 text-center shadow-sm">
              <Building2 className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-base font-bold text-zinc-300">No Reseller Partners Match</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 font-mono">
                No onboarded resellers met the status filter constraints of "{selectedStatusFilter}". Try resetting your filter queries.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPartners.map(partner => {
                const isCurrentActive = selectedPartner && selectedPartner.id === partner.id;
                const activeProdCount = partner.associatedProducts?.length || 0;
                const activePolCount = partner.associatedPolicies?.length || 0;
                const isSnoozed = isPartnerSnoozed(partner);

                return (
                  <div
                    key={partner.id}
                    onClick={() => {
                      setSelectedPartner(partner);
                      setIsEditingMeta(false);
                      setDispatchSuccess(null);
                    }}
                    className={`p-5 rounded-2xl border transition duration-155 cursor-pointer text-left relative overflow-hidden group flex flex-col justify-between ${
                      isCurrentActive 
                        ? "bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border-indigo-500/85 ring-1 ring-indigo-500/20 shadow-xl" 
                        : isSnoozed
                          ? "bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border-amber-900/50 hover:border-amber-700 shadow-sm"
                          : "bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border-zinc-800/85 hover:border-zinc-700 shadow-sm"
                    }`}
                  >
                    {/* Background accent ring */}
                    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl transition-all ${
                      isSnoozed ? "bg-amber-500/10" : "bg-indigo-500/5 group-hover:bg-indigo-500/10"
                    }`}></div>
                    
                    <div className="space-y-3.5 z-10 w-full">
                      
                      {/* Name & Title */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-zinc-100 text-sm truncate uppercase tracking-tight flex items-center gap-1.5">
                            {partner.name}
                            {isSnoozed && (
                              <span title="Snooze rule active" className="text-amber-400">
                                <BellOff className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </h3>
                          <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 mt-1 font-semibold hover:text-indigo-400 overflow-hidden text-ellipsis">
                            <Globe className="w-3.5 h-3.5" />
                            {partner.domain}
                          </span>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          {getStatusBadge(partner)}
                        </div>
                      </div>

                      {/* Brief details checklist */}
                      <div className="space-y-2 border-t border-zinc-800 pt-3">
                        <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                          <span>Monitored products</span>
                          <span className="font-bold text-zinc-200">{activeProdCount} / {products.length} SKUs</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                          <span>Associated MAP rules</span>
                          <span className="font-bold text-indigo-400">{activePolCount} active</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                          <span>Risk sensitivity</span>
                          <span className={`font-bold uppercase ${
                            partner.riskSensitivity === 'critical'
                              ? 'text-rose-400'
                              : partner.riskSensitivity === 'high'
                                ? 'text-amber-400'
                                : partner.riskSensitivity === 'medium'
                                  ? 'text-yellow-300'
                                  : 'text-emerald-400'
                          }`}>
                            {partner.riskSensitivity || 'critical'} ({partner.mapThresholdPercent !== undefined ? partner.mapThresholdPercent : 0}%)
                          </span>
                        </div>
                        
                        {/* Snooze Status in card */}
                        {isSnoozed && partner.snoozeRule && (
                          <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-800/50 flex items-center justify-between gap-2 text-[10.5px]">
                            <div className="flex items-center gap-1.5 text-amber-300 min-w-0">
                              <Clock className="w-3 h-3 shrink-0 text-amber-400" />
                              <span className="truncate font-mono font-bold">
                                Auto-dismiss: {formatRemainingTime(partner.snoozeRule.snoozedUntil)}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClearSnooze(partner);
                              }}
                              className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white shrink-0 cursor-pointer"
                              title="Resume live alert notifications for this partner"
                            >
                              Resume
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Internal Notes Preview */}
                      {partner.notes && (
                        <p className="text-[10.5px] text-zinc-500 bg-black/40 rounded px-2.5 py-1.5 border border-zinc-850 truncate font-sans">
                          "{partner.notes}"
                        </p>
                      )}

                    </div>

                    <div className="flex justify-between items-center mt-4 pt-3.5 border-t border-zinc-800/60 text-[10px] font-mono text-zinc-500">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSnoozeModal(partner);
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[10px] font-semibold transition cursor-pointer ${
                          isSnoozed
                            ? "bg-amber-950/40 border-amber-800/60 text-amber-300 hover:bg-amber-900/50"
                            : "bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <BellOff className="w-3 h-3" />
                        <span>{isSnoozed ? "Edit Snooze" : "Snooze Alerts"}</span>
                      </button>
                      <span className="text-indigo-400 group-hover:translate-x-1 transition flex items-center gap-1 font-semibold uppercase tracking-wider">
                        Configure <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic Right Column: Partner compliance workspace config */}
        <div className="w-full lg:w-[420px] shrink-0">
          {selectedPartner ? (
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 rounded-2xl p-6 sticky top-24 font-sans space-y-6 shadow-xl relative overflow-hidden text-left">
              
              {/* Header profile with logo / delete */}
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                      <Building2 className="w-5 h-5" />
                    </span>
                    <h3 className="text-base font-bold text-white uppercase tracking-tight">{selectedPartner.name}</h3>
                  </div>
                  <a 
                    href={`https://${selectedPartner.domain}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-xs text-indigo-400 font-mono flex items-center gap-1 hover:underline mt-1"
                  >
                    {selectedPartner.domain}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleTriggerEditState(selectedPartner)}
                    className="p-2 transition bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl cursor-pointer"
                    title="Edit Partner Meta Details"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delist and delete ${selectedPartner.name}?`)) {
                        onDeletePartner(selectedPartner.id);
                        setSelectedPartner(null);
                      }
                    }}
                    className="p-2 transition bg-zinc-850 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-900 text-zinc-400 hover:text-rose-400 rounded-xl cursor-pointer"
                    title="Delist and remove partner"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Status override toolbar */}
              <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-3 space-y-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Active Monitoring Enforcement State</p>
                <div className="grid grid-cols-4 gap-1">
                  {(["compliant", "violating", "warning", "pending"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(selectedPartner.id, status)}
                      className={`py-1.5 rounded-lg text-[9px] font-bold uppercase transition cursor-pointer font-mono border ${
                        selectedPartner.complianceStatus === status
                          ? status === "compliant"
                            ? "bg-emerald-950/60 border-emerald-500 text-emerald-400"
                            : status === "violating"
                              ? "bg-rose-950/60 border-rose-500 text-rose-400 animate-pulse"
                              : status === "warning"
                                ? "bg-amber-950/60 border-amber-500 text-amber-300"
                                : "bg-zinc-800 border-zinc-650 text-zinc-300"
                          : "bg-zinc-900 border-zinc-90 w-full text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {status === "violating" ? "Violating" : status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabs for Overview / Compliance History */}
              <div className="flex border-b border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActivePartnerTab('overview')}
                  className={`flex-1 pb-3 text-center font-bold tracking-wide uppercase transition cursor-pointer ${
                    activePartnerTab === 'overview'
                      ? "text-indigo-400 border-b-2 border-indigo-500 font-semibold"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActivePartnerTab('compliance_history')}
                  className={`flex-1 pb-3 text-center font-bold tracking-wide uppercase transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    activePartnerTab === 'compliance_history'
                      ? "text-indigo-400 border-b-2 border-indigo-500 font-semibold"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  Compliance History
                </button>
              </div>

              {activePartnerTab === 'overview' ? (
                <div className="space-y-6">
                  {/* Meta editing or metadata description */}
                  {isEditingMeta ? (
                    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">Modify Metadata</span>
                        <button onClick={() => setIsEditingMeta(false)} className="text-zinc-500 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Company Name</label>
                          <input 
                            type="text" 
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-200"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Domain Link</label>
                          <input 
                            type="text" 
                            value={editDomain}
                            onChange={e => setEditDomain(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Representative Name</label>
                            <input 
                              type="text" 
                              value={editPerson}
                              onChange={e => setEditPerson(e.target.value)}
                              placeholder="e.g. Sarah Jenkins"
                              className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-200"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Direct Phone</label>
                            <input 
                              type="text" 
                              value={editPhone}
                              onChange={e => setEditPhone(e.target.value)}
                              placeholder="e.g. +1 (555) 234-5678"
                              className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Support Contact Email</label>
                          <input 
                            type="email" 
                            value={editEmail}
                            onChange={e => setEditEmail(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Risk Sensitivity</label>
                            <select
                              value={editRiskSensitivity}
                              onChange={e => {
                                const val = e.target.value as 'critical' | 'high' | 'medium' | 'low';
                                setEditRiskSensitivity(val);
                                if (val === 'critical') setEditMapThresholdPercent(0);
                                else if (val === 'high') setEditMapThresholdPercent(2);
                                else if (val === 'medium') setEditMapThresholdPercent(5);
                                else if (val === 'low') setEditMapThresholdPercent(10);
                              }}
                              className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono"
                            >
                              <option value="critical">Critical (0% Buffer)</option>
                              <option value="high">High (2% Buffer)</option>
                              <option value="medium">Medium (5% Buffer)</option>
                              <option value="low">Low (10% Buffer)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">MAP Threshold (%)</label>
                            <input 
                              type="number" 
                              min="0"
                              max="100"
                              value={editMapThresholdPercent}
                              onChange={e => setEditMapThresholdPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                              className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Admin Notes</label>
                          <textarea
                            rows={2}
                            value={editNotes}
                            onChange={e => setEditNotes(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-200 resize-none font-sans"
                          />
                        </div>

                        <button
                          onClick={handleSaveMetaChanges}
                          className="w-full py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Save Modifications
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Contact Profile Details Card */}
                      <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-3">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-1.5 border-b border-zinc-900 pb-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-400" /> Reseller Contact Profile
                        </p>
                        <div className="grid grid-cols-1 gap-2 text-xs text-zinc-300">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500 font-mono">Representative</span>
                            <span className="font-semibold text-zinc-200">{selectedPartner.contactPerson || "Not Assigned"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500 font-mono">Direct Phone</span>
                            <span className="font-semibold text-zinc-200">{selectedPartner.contactPhone || "Not Assigned"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500 font-mono">Secure Email</span>
                            <span className="font-semibold text-zinc-200 truncate max-w-[200px]" title={selectedPartner.contactEmail}>
                              {selectedPartner.contactEmail || "Not Assigned"}
                            </span>
                          </div>
                          <div className="border-t border-zinc-900 pt-2 mt-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-500 font-mono">Risk Sensitivity</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                selectedPartner.riskSensitivity === 'critical'
                                  ? 'bg-rose-950/50 text-rose-400 border border-rose-900'
                                  : selectedPartner.riskSensitivity === 'high'
                                    ? 'bg-amber-950/50 text-amber-400 border border-amber-900'
                                    : selectedPartner.riskSensitivity === 'medium'
                                      ? 'bg-yellow-950/50 text-yellow-300 border border-yellow-900'
                                      : 'bg-emerald-950/50 text-emerald-400 border border-emerald-900'
                              }`}>
                                {selectedPartner.riskSensitivity || 'critical'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-500 font-mono">MAP Threshold Buffer</span>
                              <span className="font-mono text-zinc-200 font-bold text-xs">
                                {selectedPartner.mapThresholdPercent !== undefined ? selectedPartner.mapThresholdPercent : 0}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-3.5 bg-zinc-950 border border-zinc-850 rounded-xl">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono mb-1">Internal Operations Memo</p>
                        <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                          {selectedPartner.notes || "No monitoring memos registered yet. Click edit above to include special clearance annotations."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Reseller Alert Snooze Rules Module */}
                  <div className="space-y-3 pt-1">
                    <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <BellOff className="w-3.5 h-3.5 text-amber-400" />
                        Reseller Alert Snooze Rules
                      </span>
                      {isPartnerSnoozed(selectedPartner) && (
                        <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">
                          Auto-dismiss Active
                        </span>
                      )}
                    </div>

                    {isPartnerSnoozed(selectedPartner) && selectedPartner.snoozeRule ? (
                      <div className="bg-amber-950/20 border border-amber-800/60 rounded-xl p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">Countdown Remaining:</span>
                              <span className="text-sm font-mono font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded">
                                {formatRemainingTime(selectedPartner.snoozeRule.snoozedUntil)}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-400 font-mono mt-1">
                              Expires on: {new Date(selectedPartner.snoozeRule.snoozedUntil).toLocaleString()}
                            </p>
                          </div>
                          <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                            <Clock className="w-4 h-4" />
                          </span>
                        </div>

                        {selectedPartner.snoozeRule.reason && (
                          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-2.5">
                            <p className="text-[9px] font-mono uppercase text-zinc-500 font-bold">Waiver / Clearance Reason</p>
                            <p className="text-xs text-zinc-300 mt-0.5 italic font-sans">
                              "{selectedPartner.snoozeRule.reason}"
                            </p>
                          </div>
                        )}

                        <div className="text-[10.5px] text-zinc-400 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Violations auto-dismissed & alerts muted for {selectedPartner.name} only.</span>
                        </div>

                        {/* Quick Snooze Actions */}
                        <div className="flex flex-wrap gap-2 pt-1 border-t border-amber-900/40">
                          <button
                            type="button"
                            onClick={() => handleExtendSnoozeHours(selectedPartner, 24)}
                            className="flex-1 py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold rounded-lg transition cursor-pointer text-center"
                          >
                            +24h Extend
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExtendSnoozeHours(selectedPartner, 168)}
                            className="flex-1 py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold rounded-lg transition cursor-pointer text-center"
                          >
                            +7d Extend
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenSnoozeModal(selectedPartner)}
                            className="py-1.5 px-2.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 text-zinc-200 text-[10px] font-mono font-bold rounded-lg transition cursor-pointer"
                          >
                            Edit Rule
                          </button>
                          <button
                            type="button"
                            onClick={() => handleClearSnooze(selectedPartner)}
                            className="py-1.5 px-2.5 bg-zinc-900 hover:bg-red-950/40 border border-zinc-800 hover:border-red-900/60 text-zinc-400 hover:text-red-300 text-[10px] font-mono font-bold rounded-lg transition cursor-pointer"
                          >
                            Resume Alerts
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-zinc-950/60 border border-zinc-850 rounded-xl p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                            <Bell className="w-3.5 h-3.5 text-emerald-400" />
                            Live Alert Notifications Active
                          </span>
                          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            Unmuted
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                          Define temporary auto-dismissal rules for {selectedPartner.name} during promotions or seasonal waivers without disabling global alert monitoring.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleOpenSnoozeModal(selectedPartner)}
                          className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-bold font-mono rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
                        >
                          <BellOff className="w-3.5 h-3.5" />
                          Set Custom Snooze Rule
                        </button>
                      </div>
                    )}
                  </div>

                  {/* MAP policies multi selection checklist */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
                      <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider font-mono">Assigned MAP Policies</span>
                      <span className="text-[9px] text-zinc-500 font-mono">{(selectedPartner.associatedPolicies || []).length} associated</span>
                    </div>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {policies.map(policy => {
                        const isChecked = (selectedPartner.associatedPolicies || []).includes(policy.id);
                        return (
                          <div 
                            key={policy.id}
                            onClick={() => handleTogglePolicyForSelectedPartner(policy.id)}
                            className={`p-2.5 rounded-xl border transition duration-100 cursor-pointer flex items-start gap-2.5 ${
                              isChecked 
                                ? "bg-indigo-950/20 border-indigo-900 text-zinc-100" 
                                : "bg-zinc-950/45 border-zinc-850/80 hover:border-zinc-800 text-zinc-400"
                            }`}
                          >
                            <div className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center shrink-0 ${
                              isChecked 
                                ? "border-indigo-500 bg-indigo-500 text-white" 
                                : "border-zinc-700"
                            }`}>
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 font-sans leading-none uppercase tracking-wide">
                                {policy.name}
                                <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded capitalize">
                                  {policy.allowedDiscountPercent}% limit
                                </span>
                              </p>
                              <p className="text-[10px] text-zinc-500 mt-1 leading-snug">{policy.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Products selection list */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
                      <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider font-mono">Monitored Product list</span>
                      <span className="text-[9px] text-zinc-500 font-mono">{(selectedPartner.associatedProducts || []).length} / {products.length} SKUs</span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {products.map(prod => {
                        const isChecked = (selectedPartner.associatedProducts || []).includes(prod.id);
                        return (
                          <div 
                            key={prod.id}
                            onClick={() => handleToggleProductForSelectedPartner(prod.id)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              isChecked 
                                ? "bg-zinc-900 border-zinc-750 text-white" 
                                : "bg-zinc-950/20 border-zinc-900/60 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                isChecked 
                                  ? "border-indigo-500 bg-indigo-500 text-white" 
                                  : "border-zinc-800 bg-zinc-950"
                              }`}>
                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold truncate text-zinc-200">{prod.name}</p>
                                <p className="text-[9px] font-mono text-zinc-500 tracking-wide">{prod.sku} • MAP: ${(prod?.mapPrice ?? 0).toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pre draft violations automatic simulation warnings dispatch */}
                  <div className="pt-2 border-t border-zinc-850 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> Compliance Dispatcher
                      </span>
                    </div>

                    {selectedPartner.complianceStatus === "violating" ? (
                      <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-3 space-y-3 text-xs leading-relaxed text-red-300">
                        <div>
                          <p className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest leading-none mb-1">AUTOMATIC NOTICE PREVIEW</p>
                          <p className="font-sans leading-snug text-zinc-300 text-left">
                            "Your current online listed price for SKU(s) violates active wholesale MAP policy rules. Restore compliant advertised price immediately to avoid distribution suspension/holds."
                          </p>
                        </div>

                        <button
                          onClick={() => handleSimulateWarningDispatch(selectedPartner)}
                          disabled={isDispatching}
                          className="w-full py-2.5 px-3 bg-red-650 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 bg-red-600 cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {isDispatching ? "Dispatching compliance warnings..." : "Send Violation Warning"}
                        </button>
                      </div>
                    ) : (
                      <div className="bg-indigo-950/10 border border-indigo-900/40 rounded-xl p-3 text-xs leading-relaxed text-zinc-400 text-center">
                        <p className="font-semibold text-zinc-300 mb-0.5">Partner in Good Standing</p>
                        Only violating resellers require official automated cease-and-desist warnings. You can manually simulate violations by overriding their status badge above.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Dynamic History Calculation & Render */}
                  {(() => {
                    // Extract items for this partner from scans
                    const partnerScanItems = scans.flatMap(scan => 
                      (scan.items || [])
                        .filter(item => item.partnerId === selectedPartner.id)
                        .map(item => ({
                          ...item,
                          startedAt: scan.startedAt,
                          productId: scan.productId,
                          productName: scan.productName,
                          mapPrice: scan.mapPrice,
                          policyName: "Standard Catalog MAP"
                        }))
                    ).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

                    const totalPartnerScans = partnerScanItems.length;
                    const compliantPartnerScans = partnerScanItems.filter(item => item.status === "compliant").length;
                    const violatingPartnerScans = partnerScanItems.filter(item => item.status === "violating").length;
                    const partnerComplianceRate = totalPartnerScans > 0 
                      ? Math.round((compliantPartnerScans / totalPartnerScans) * 100) 
                      : 100;

                    return (
                      <div className="space-y-5 text-left">
                        {/* Score Metrics Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-zinc-950 border border-zinc-850 p-3 rounded-xl space-y-1">
                            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Total Audits</p>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xl font-bold text-white font-mono">{totalPartnerScans}</span>
                              <span className="text-[10px] text-zinc-400">runs</span>
                            </div>
                          </div>
                          <div className="bg-zinc-950 border border-zinc-850 p-3 rounded-xl space-y-1">
                            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Compliance Rate</p>
                            <div className="flex items-baseline gap-1.5">
                              <span className={`text-xl font-bold font-mono ${
                                partnerComplianceRate >= 90
                                  ? "text-emerald-400"
                                  : partnerComplianceRate >= 70
                                    ? "text-amber-300"
                                    : "text-rose-400 animate-pulse"
                              }`}>
                                {partnerComplianceRate}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 30-Day Partner Infraction Timeline */}
                        <div className="border border-zinc-800 rounded-xl bg-zinc-950/60 p-3 overflow-hidden shadow-sm">
                          <InfractionTimelineSVG
                            partnerName={selectedPartner.name}
                            partnerDomain={selectedPartner.domain}
                            partner={selectedPartner}
                            recentScans={scans}
                            height={150}
                          />
                        </div>

                        {/* Audit Trail list */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-zinc-850 pb-1.5">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono flex items-center gap-1">
                              <History className="w-3.5 h-3.5 text-indigo-400" /> Compliance Audit Trail
                            </span>
                            <span className="text-[9px] text-zinc-500 font-mono">Reverse Chronological</span>
                          </div>

                          {partnerScanItems.length === 0 ? (
                            <div className="p-8 text-center bg-zinc-950/40 border border-zinc-900 border-dashed rounded-2xl space-y-2">
                              <ShieldCheck className="w-8 h-8 text-zinc-600 mx-auto" />
                              <p className="text-xs text-zinc-400 font-sans font-medium">No historical compliance records found</p>
                              <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
                                Run a real-time policy sweep inside the <strong>Scanner module</strong>. The scanner automatically indexes results directly into this reseller's historic compliance ledger.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                              {partnerScanItems.map((item, index) => {
                                const scanDate = new Date(item.startedAt).toLocaleString();
                                const priceDiffPercent = (item.mapPrice && item.mapPrice > 0 && item.detectedPrice)
                                  ? Math.round(((item.mapPrice - item.detectedPrice) / item.mapPrice) * 100) 
                                  : 0;

                                return (
                                  <div 
                                    key={index} 
                                    className={`p-3 rounded-xl border bg-zinc-950/50 text-xs transition duration-150 flex flex-col gap-2 relative pl-4 ${
                                      item.status === 'compliant'
                                        ? 'border-zinc-850 border-l-4 border-l-emerald-500'
                                        : item.status === 'violating'
                                          ? 'border-rose-950/40 border-l-4 border-l-rose-500'
                                          : item.status === 'not_found'
                                            ? 'border-zinc-850 border-l-4 border-l-zinc-650'
                                            : 'border-zinc-850 border-l-4 border-l-amber-500'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between font-sans">
                                      <span className="font-semibold text-zinc-200 truncate max-w-[170px]" title={item.productName}>
                                        {item.productName}
                                      </span>
                                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono uppercase tracking-wider ${
                                        item.status === 'compliant'
                                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                          : item.status === 'violating'
                                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                      }`}>
                                        {item.status === 'violating' ? 'Breach' : item.status}
                                      </span>
                                    </div>

                                    <div className="text-[10px] text-zinc-450 text-zinc-400 space-y-1 font-mono">
                                      {item.status === 'compliant' && (
                                        <p className="text-zinc-400">
                                          Advertised at <strong className="text-emerald-400">${item.detectedPrice?.toFixed(2)}</strong> (MAP: ${item.mapPrice?.toFixed(2)})
                                        </p>
                                      )}
                                      {item.status === 'violating' && (
                                        <div className="space-y-0.5">
                                          <p className="text-rose-350 text-rose-400 font-semibold">
                                            Advertised at <strong className="text-rose-400 underline">${item.detectedPrice?.toFixed(2)}</strong>
                                          </p>
                                          <p className="text-zinc-500 text-[9px]">
                                            Below ${item.mapPrice?.toFixed(2)} MAP limit by <strong className="text-rose-400">{priceDiffPercent}%</strong>
                                          </p>
                                        </div>
                                      )}
                                      {item.status === 'not_found' && (
                                        <p className="text-zinc-500">
                                          Product SKU was out of stock or not advertised on this domain.
                                        </p>
                                      )}
                                      {item.status === 'error' && (
                                        <p className="text-amber-400">
                                          Automated checker request blocked by reseller firewall or captcha.
                                        </p>
                                      )}
                                      <p className="text-[9px] text-zinc-500 pt-1 font-sans flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> {scanDate}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

                {dispatchSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-900 text-emerald-400 text-[11px] font-mono leading-relaxed animate-fade-in text-center shadow-lg">
                    {dispatchSuccess}
                  </div>
                )}

              </div>

          ) : (
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 border-dashed rounded-2xl p-12 text-center text-zinc-500 h-96 flex flex-col justify-center items-center font-sans space-y-3 shadow-sm">
              <Building2 className="w-10 h-10 text-zinc-650 text-indigo-400" />
              <h3 className="font-bold text-zinc-305 text-zinc-300 uppercase tracking-wide text-xs">Reseller Profile Terminal</h3>
              <p className="text-xs text-zinc-500 max-w-[240px] leading-relaxed mx-auto">
                No reseller partner remains selected. Click any active reseller card on the left to verify policies, toggle allowed products, override status indicators, and simulate warnings.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* 3. Onboarding modal panel Dialog */}
      {isOnboardingOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-999 flex items-center justify-center p-4 overflow-y-auto animate-fade-in" style={{ zIndex: 9999 }}>
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative scrollbar-none transform transition-all duration-300 animate-slide-up text-left">
            
            {/* Modal header */}
            <div className="flex justify-between items-start pb-4 border-b border-zinc-800 mb-6">
              <div>
                <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
                  <Building2 className="w-5.5 h-5.5 text-indigo-400" />
                  Onboard reseller partner
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Introduce and configure wholesale distributon policy checks inside cloud monitoring indexes.
                </p>
              </div>
              <button 
                onClick={() => setIsOnboardingOpen(false)}
                className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitOnboarding} className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2 font-bold">Reseller Company Name *</label>
                  <input 
                    type="text" 
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Best Buy Electronics Co"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder:text-zinc-650"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2 font-bold">Web Domain Link *</label>
                  <input 
                    type="text" 
                    required
                    value={formDomain}
                    onChange={e => setFormDomain(e.target.value)}
                    placeholder="e.g. bestbuy.com"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder:text-zinc-650 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2 font-bold">Compliance Contact Email</label>
                  <input 
                    type="email" 
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="e.g. compliance@bestbuy.com"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder:text-zinc-650 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2 font-bold">Initial Compliance Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 appearance-none font-mono"
                  >
                    <option value="pending">Pending (Awaiting Sweep)</option>
                    <option value="compliant">Compliant (In Good Standing)</option>
                    <option value="warning">Warning Status</option>
                    <option value="violating">Violating (Price Breach)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2 font-bold">Representative Name</label>
                  <input 
                    type="text" 
                    value={formPerson}
                    onChange={e => setFormPerson(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder:text-zinc-650"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2 font-bold">Direct Phone Number</label>
                  <input 
                    type="text" 
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 234-5678"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder:text-zinc-650 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2 font-bold">Partner Risk Sensitivity</label>
                  <select
                    value={formRiskSensitivity}
                    onChange={e => {
                      const val = e.target.value as 'critical' | 'high' | 'medium' | 'low';
                      setFormRiskSensitivity(val);
                      if (val === 'critical') setFormMapThresholdPercent(0);
                      else if (val === 'high') setFormMapThresholdPercent(2);
                      else if (val === 'medium') setFormMapThresholdPercent(5);
                      else if (val === 'low') setFormMapThresholdPercent(10);
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="critical">Critical (0% Buffer)</option>
                    <option value="high">High (2% Buffer)</option>
                    <option value="medium">Medium (5% Buffer)</option>
                    <option value="low">Low (10% Buffer)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2 font-bold">Custom MAP Threshold Buffer (%)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={formMapThresholdPercent}
                    onChange={e => setFormMapThresholdPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="e.g. 5"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Admin Note text area */}
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2 font-bold">Corporate Monitoring Notes</label>
                <textarea 
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="e.g. Authorised retail partner representing general regional sales tags."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder:text-zinc-600 resize-none font-sans"
                />
              </div>

              {/* Associating MAP policies configuration */}
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2 font-bold">Associate MAP policies</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                  {policies.map(policy => {
                    const isChecked = formSelectedPolicies.includes(policy.id);
                    return (
                      <div
                        key={policy.id}
                        type="button"
                        onClick={() => handleTogglePolicyInForm(policy.id)}
                        className={`p-2.5 rounded-xl border transition text-left cursor-pointer flex items-start gap-2.5 ${
                          isChecked 
                            ? "bg-indigo-950/15 border-indigo-500/80 text-white" 
                            : "bg-zinc-900/60 border-zinc-850 hover:border-zinc-80D text-zinc-450 text-zinc-400"
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded mt-0.5 border flex items-center justify-center shrink-0 ${
                          isChecked 
                            ? "border-indigo-505 bg-indigo-505 bg-indigo-500 text-white" 
                            : "border-zinc-700 bg-zinc-950"
                        }`}>
                          {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold truncate leading-none uppercase">{policy.name}</p>
                          <p className="text-[9.5px] text-zinc-500 mt-1 truncate">{policy.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Associating product list checklist */}
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2 font-bold">Authorized Distribution SKU Catalogue</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                  {products.map(prod => {
                    const isChecked = formSelectedProducts.includes(prod.id);
                    return (
                      <div
                        key={prod.id}
                        type="button"
                        onClick={() => handleToggleProductInForm(prod.id)}
                        className={`p-2.5 rounded-xl border transition text-left cursor-pointer flex items-center gap-2.5 ${
                          isChecked 
                            ? "bg-zinc-850 border-zinc-700 text-white" 
                            : "bg-zinc-900/60 border-zinc-850 hover:border-zinc-80D text-zinc-400"
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                          isChecked 
                            ? "border-indigo-500 bg-indigo-500 text-white" 
                            : "border-zinc-800 bg-zinc-950"
                        }`}>
                          {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold truncate leading-none text-zinc-300">{prod.name}</p>
                          <p className="text-[9px] font-mono text-zinc-500 mt-1">{prod.sku} • MAP: ${(prod?.mapPrice ?? 0).toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button 
                  type="button" 
                  onClick={() => setIsOnboardingOpen(false)}
                  className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-lg shadow-indigo-500/10"
                >
                  Register Partner Account
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 4. Reseller Snooze Configuration Modal */}
      {isSnoozeModalOpen && snoozeTargetPartner && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <BellOff className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-tight">Configure Alert Snooze Rule</h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    Target Reseller: <span className="text-amber-300 font-bold">{snoozeTargetPartner.name}</span> ({snoozeTargetPartner.domain})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsSnoozeModalOpen(false);
                  setSnoozeTargetPartner(null);
                }}
                className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSnoozeRule} className="space-y-4">
              
              {/* Duration Presets */}
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2 font-bold flex items-center justify-between">
                  <span>Snooze Duration Window</span>
                  <span className="text-amber-400">
                    {isCustomSnooze 
                      ? "Custom Date/Time" 
                      : `${snoozeDurationHours} hour${snoozeDurationHours > 1 ? "s" : ""} (${snoozeDurationHours >= 24 ? (snoozeDurationHours / 24) + "d" : ""})`
                    }
                  </span>
                </label>
                
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: "1 Hour", hours: 1 },
                    { label: "6 Hours", hours: 6 },
                    { label: "12 Hours", hours: 12 },
                    { label: "24h (1d)", hours: 24 },
                    { label: "3 Days", hours: 72 },
                    { label: "7 Days", hours: 168 },
                    { label: "14 Days", hours: 336 },
                    { label: "Custom...", hours: -1 }
                  ].map((preset) => {
                    const isSelected = preset.hours === -1 ? isCustomSnooze : (!isCustomSnooze && snoozeDurationHours === preset.hours);
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          if (preset.hours === -1) {
                            setIsCustomSnooze(true);
                            if (!customSnoozeDate) {
                              const d = new Date(Date.now() + 48 * 3600000);
                              setCustomSnoozeDate(d.toISOString().slice(0, 16));
                            }
                          } else {
                            setIsCustomSnooze(false);
                            setSnoozeDurationHours(preset.hours);
                          }
                        }}
                        className={`py-2 px-1 text-center rounded-xl text-[10px] font-mono font-bold transition cursor-pointer border ${
                          isSelected
                            ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20 font-black"
                            : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {isCustomSnooze && (
                  <div className="mt-2.5">
                    <input 
                      type="datetime-local" 
                      value={customSnoozeDate}
                      onChange={(e) => setCustomSnoozeDate(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Snooze Reason & Quick Presets */}
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5 font-bold">
                  Snooze Reason / Audit Trail Memo
                </label>
                
                {/* Reason Quick Buttons */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    "Promotional clearance waiver",
                    "MAP grace period review",
                    "Authorized holiday campaign",
                    "Temporary bundle markdown",
                    "Contract renegotiation pause"
                  ].map((presetReason) => (
                    <button
                      key={presetReason}
                      type="button"
                      onClick={() => setSnoozeReason(presetReason)}
                      className={`text-[9px] font-mono px-2 py-1 rounded-lg border transition cursor-pointer ${
                        snoozeReason === presetReason 
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold" 
                          : "bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {presetReason}
                    </button>
                  ))}
                </div>

                <input 
                  type="text"
                  value={snoozeReason}
                  onChange={(e) => setSnoozeReason(e.target.value)}
                  placeholder="e.g. Authorized promotional clearance waiver until weekend end"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              {/* Auto-Dismiss Option Checkbox */}
              <div 
                onClick={() => setSnoozeAutoDismiss(!snoozeAutoDismiss)}
                className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl flex items-start gap-3 cursor-pointer hover:border-zinc-800 transition"
              >
                <div className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center shrink-0 ${
                  snoozeAutoDismiss 
                    ? "bg-amber-500 border-amber-400 text-black" 
                    : "border-zinc-700 bg-zinc-900"
                }`}>
                  {snoozeAutoDismiss && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div className="text-xs">
                  <p className="font-bold text-zinc-200 font-sans">Auto-Dismiss & Suppress Alert Popups</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Breach violations from {snoozeTargetPartner.name} will be automatically dismissed from active alerts during this period. Alerting remains live for all other partners.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                {snoozeTargetPartner.snoozeRule && isPartnerSnoozed(snoozeTargetPartner) ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleClearSnooze(snoozeTargetPartner);
                      setIsSnoozeModalOpen(false);
                      setSnoozeTargetPartner(null);
                    }}
                    className="px-4 py-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-900/60 text-red-300 text-xs font-bold rounded-xl transition cursor-pointer font-mono"
                  >
                    Clear Snooze (Resume)
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSnoozeModalOpen(false);
                      setSnoozeTargetPartner(null);
                    }}
                    className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-xl transition cursor-pointer shadow-lg shadow-amber-500/20 uppercase tracking-wider font-mono flex items-center gap-1.5"
                  >
                    <BellOff className="w-3.5 h-3.5" />
                    Activate Snooze Rule
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
