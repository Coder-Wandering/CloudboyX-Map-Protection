import React, { useState } from "react";
import { 
  X, FileText, Download, Printer, ShieldAlert, CheckCircle2, 
  ExternalLink, Mail, Phone, Calendar, Copy, Check, Info,
  AlertTriangle, Bookmark, Activity, Sparkles, User, Layers, Scale
} from "lucide-react";
import { Partner, ScanJob, NotificationAlert } from "../types";
import { InfractionTimelineSVG } from "./InfractionTimelineSVG";

interface LegalDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  toast: any;
  partners: Partner[];
  scans: ScanJob[];
  notifications: NotificationAlert[];
  onGeneratePdf: (toast: any) => void;
}

export const LegalDossierModal: React.FC<LegalDossierModalProps> = ({
  isOpen,
  onClose,
  toast,
  partners,
  scans,
  notifications,
  onGeneratePdf
}) => {
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [activeSection, setActiveSection] = useState<"all" | "evidence" | "profile" | "comms" | "history">("all");

  if (!isOpen || !toast) return null;

  // 1. Identify involved partner
  const violation = toast.violations && toast.violations[0];
  const partnerName = violation ? violation.partnerName : "Unknown Partner";
  
  const partner = violation ? partners.find(p => 
    p.name.toLowerCase() === violation.partnerName.toLowerCase() || 
    p.domain.toLowerCase() === violation.partnerName.toLowerCase() || 
    p.domain.toLowerCase() === (violation.partnerDomain || "").toLowerCase()
  ) : null;

  const partnerDomain = partner ? partner.domain : (violation ? (violation.partnerDomain || "partner-store.com") : "partner-store.com");
  const partnerEmail = partner ? partner.contactEmail : `compliance@${partnerDomain !== "N/A" ? partnerDomain : "partner.com"}`;
  const partnerContactPerson = partner ? (partner.contactPerson || "Authorized Merchant Representative") : "Authorized Merchant Representative";
  const partnerContactPhone = partner ? (partner.contactPhone || "+1 (800) 555-0199") : "+1 (800) 555-0199";
  const partnerNotes = partner ? (partner.notes || "Standard authorized reseller agreement on file.") : "Standard authorized reseller agreement on file.";
  const onboardingDate = partner?.onboardingDate ? new Date(partner.onboardingDate).toLocaleDateString() : new Date(toast.timestamp || Date.now()).toLocaleDateString();

  // 2. Outbound communications
  const communicationHistory = notifications.filter(n => {
    const isMatch = (partner && n.partnerId === partner.id) ||
      n.partnerName.toLowerCase() === partnerName.toLowerCase() ||
      n.partnerDomain.toLowerCase() === partnerDomain.toLowerCase() ||
      n.recipientEmail.toLowerCase() === partnerEmail.toLowerCase();
    return isMatch;
  });

  // 3. Historical past infractions from scans
  const previousInfractions: Array<{
    productSku: string;
    productName: string;
    mapPrice: number;
    detectedPrice: number;
    priceDifference: number;
    date: string;
  }> = [];

  scans.forEach(scan => {
    if (scan.items && scan.items.length > 0) {
      scan.items.forEach(item => {
        const isMatch = (partner && item.partnerId === partner.id) ||
          item.partnerName.toLowerCase() === partnerName.toLowerCase() ||
          item.partnerDomain.toLowerCase() === partnerDomain.toLowerCase();
        
        if (isMatch && item.status === "violating") {
          previousInfractions.push({
            productSku: "SKU-" + scan.productId.substring(0, 6).toUpperCase(),
            productName: scan.productName,
            mapPrice: scan.mapPrice,
            detectedPrice: item.detectedPrice || 0,
            priceDifference: scan.mapPrice - (item.detectedPrice || 0),
            date: new Date(scan.finishedAt || scan.startedAt).toLocaleDateString()
          });
        }
      });
    }
  });

  const toastViolations = toast.violations || [];
  const dossierCaseId = `MAP-DOSSIER-${partnerName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8)}-${new Date(toast.timestamp || Date.now()).toISOString().split('T')[0].replace(/-/g, '')}`;

  const handleCopySummary = () => {
    const summaryText = `--- MAP POLICY ENFORCEMENT LEGAL DOSSIER ---
Case ID: ${dossierCaseId}
Partner: ${partnerName} (${partnerDomain})
Generated: ${new Date().toLocaleString()}
Alert Incident: ${toast.message || "Active price undercutting in breach of MAP"}
Active Violating SKUs: ${toastViolations.map((v: any) => `${v.productSku} (MAP: $${v.mapPrice}, Detected: $${v.detectedPrice}, Deficit: -$${(v.mapPrice - v.detectedPrice).toFixed(2)})`).join("; ")}
Outbound Warnings Dispatched: ${communicationHistory.length}
Historical Breaches in Database: ${previousInfractions.length}
Status: Under Legal Enforcement Review
-------------------------------------------------`;
    
    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto font-sans"
      id="legal-dossier-modal-backdrop"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div 
        className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-5xl my-auto overflow-hidden shadow-2xl relative text-slate-200 max-h-[92vh] flex flex-col"
        id="legal-dossier-modal-window"
      >
        {/* Modal Top Banner & Actions Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-950/40 text-amber-400 border border-amber-800/40 shadow-inner">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight font-display">
                  MAP Policy Enforcement • Legal Compliance Dossier
                </h3>
                <span className="px-2 py-0.5 rounded text-[8px] font-mono font-extrabold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Case: {dossierCaseId}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Privileged Counsel Record • Target Entity: <strong className="text-white">{partnerName}</strong> ({partnerDomain})
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Copy executive dossier summary to clipboard"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedSummary ? "Copied" : "Copy Summary"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Print legal dossier document"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={() => onGeneratePdf(toast)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-amber-950/50 hover:brightness-110 active:scale-95"
              id="export-pdf-dossier-btn"
              title="Download consolidated PDF legal compliance dossier"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer ml-1"
              title="Close dossier viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Dossier Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar text-xs font-sans">
          
          {/* Header Metadata Callout Box */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 font-bold">Investigation File</span>
              <div className="text-sm font-bold text-white font-mono">{partnerName} • Compliance Case Dossier</div>
              <div className="text-[10px] text-slate-400">Generated: {new Date().toLocaleString()} • Authorized User: Legal Counsel & Brand Protection</div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase bg-rose-950/60 text-rose-300 border border-rose-800/60 flex items-center gap-1.5">
                <ShieldAlert className="w-3 h-3 text-rose-400 animate-pulse" />
                Active MAP Violation In Effect
              </span>
              <span className="px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase bg-slate-900 text-slate-300 border border-slate-800">
                Risk: {(partner?.riskSensitivity || "High").toUpperCase()}
              </span>
            </div>
          </div>

          {/* SECTION 1: PARTNER PROFILE & RISK ANALYSIS */}
          <div className="space-y-2.5" id="dossier-section-partner-profile">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px]">1</span>
                Partner Profile & Risk Analysis
              </h4>
              <span className="text-[9px] font-mono text-slate-500">Authorized Dealer Master File</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/50 border border-slate-850 rounded-xl p-4">
              <div className="space-y-2">
                <div className="flex justify-between border-b border-slate-900 pb-1 text-[10px]">
                  <span className="text-slate-500 font-mono">Entity / Partner Name:</span>
                  <span className="font-bold text-slate-200">{partnerName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1 text-[10px]">
                  <span className="text-slate-500 font-mono">Primary Web Domain:</span>
                  <span className="font-mono text-indigo-400 font-semibold">{partnerDomain}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1 text-[10px]">
                  <span className="text-slate-500 font-mono">Compliance Tier:</span>
                  <span className="font-bold text-rose-400 uppercase font-mono">
                    {partner?.complianceStatus || "Violating"}
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500 font-mono">Onboarding Agreement Date:</span>
                  <span className="font-mono text-slate-300">{onboardingDate}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between border-b border-slate-900 pb-1 text-[10px]">
                  <span className="text-slate-500 font-mono">Designated Contact:</span>
                  <span className="font-medium text-slate-200">{partnerContactPerson}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1 text-[10px]">
                  <span className="text-slate-500 font-mono">Compliance Notice Email:</span>
                  <span className="font-mono text-slate-200">{partnerEmail}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1 text-[10px]">
                  <span className="text-slate-500 font-mono">Support Phone:</span>
                  <span className="font-mono text-slate-300">{partnerContactPhone}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500 font-mono">Audit Account Notes:</span>
                  <span className="text-slate-300 truncate max-w-[220px]" title={partnerNotes}>{partnerNotes}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: ACTIVE INFRACTION EVIDENCE (WITH 30-DAY SVG TIMELINE) */}
          <div className="space-y-3.5" id="dossier-section-active-evidence">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 flex items-center justify-center text-[10px] font-bold">2</span>
                <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                  Active Infraction Evidence
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Live Evidence Artifact
              </span>
            </div>

            {/* Alert Message Summary Box */}
            <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-3.5 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-950/60 text-rose-400 border border-rose-800/60 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-mono font-bold text-rose-300 uppercase tracking-wider">
                  Incident Diagnostic Notification
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {toast.message || "Active price undercutting detected in breach of brand MAP thresholds."}
                </p>
                <div className="text-[9px] font-mono text-slate-400 flex items-center gap-2">
                  <span>Incident ID: #{toast.id}</span>
                  <span>•</span>
                  <span>Detected: {new Date(toast.timestamp || Date.now()).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* EMBEDDED VISUAL INFRACTION TIMELINE (30-DAY SVG PATH) */}
            <div className="space-y-1.5" id="dossier-infraction-timeline-section">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-rose-400" />
                  Partner 30-Day Infraction Frequency & Severity Curve
                </span>
                <span className="text-slate-400 text-[8.5px]">
                  Cubic SVG Path Mapping • Escalation Trend Analysis
                </span>
              </div>

              {/* The SVG Visual Timeline Component */}
              <InfractionTimelineSVG
                partnerName={partnerName}
                partnerDomain={partnerDomain}
                partnerId={partner?.id}
                partner={partner}
                scans={scans}
                activeToastViolations={toastViolations}
                activeAlertDate={toast.timestamp}
                interactive={true}
                showControls={true}
              />
            </div>

            {/* Table of Active Violations in Current Incident */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                Itemized Incident SKU Violations ({toastViolations.length})
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/60">
                <table className="w-full text-left border-collapse text-[10px] font-mono">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-bold uppercase text-[8.5px]">
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3 font-sans">Product Name</th>
                      <th className="py-2.5 px-3">Established MAP</th>
                      <th className="py-2.5 px-3">Detected Price</th>
                      <th className="py-2.5 px-3">Price Deficit</th>
                      <th className="py-2.5 px-3">Severity Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {toastViolations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-slate-500 font-mono">
                          No active violation items parsed in incident payload.
                        </td>
                      </tr>
                    ) : (
                      toastViolations.map((v: any, idx: number) => {
                        const map = v.mapPrice || 100;
                        const det = v.detectedPrice || 0;
                        const diff = map - det;
                        const pct = ((diff) / map) * 100;

                        return (
                          <tr key={idx} className="hover:bg-slate-900/50 transition">
                            <td className="py-2.5 px-3 font-bold text-slate-300">{v.productSku || "SKU-ALERT"}</td>
                            <td className="py-2.5 px-3 font-sans font-medium text-slate-200">{v.productName || "Authorized Catalog Product"}</td>
                            <td className="py-2.5 px-3 text-slate-300">${map.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-rose-400 font-bold">${det.toFixed(2)}</td>
                            <td className="py-2.5 px-3 font-bold text-rose-400">
                              -${diff.toFixed(2)} (-{pct.toFixed(1)}%)
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                pct >= 20 ? "bg-rose-950 text-rose-300 border border-rose-800" :
                                pct >= 10 ? "bg-amber-950 text-amber-300 border border-amber-800" :
                                "bg-indigo-950 text-indigo-300 border border-indigo-800"
                              }`}>
                                {pct >= 20 ? "Critical Breach" : pct >= 10 ? "High Deficit" : "Moderate Breach"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SECTION 3: COMPLIANCE COMMUNICATION HISTORY */}
          <div className="space-y-2.5" id="dossier-section-communication-history">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px]">3</span>
                Compliance Communication History
              </h4>
              <span className="text-[9px] font-mono text-slate-500">
                {communicationHistory.length} Registered Outbound Dispatches
              </span>
            </div>

            {communicationHistory.length === 0 ? (
              <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 text-center text-slate-500 font-mono text-[10px]">
                No previous outbound warning compliance emails registered in system logs for this partner domain.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {communicationHistory.map((n, idx) => (
                  <div key={idx} className="bg-slate-950/60 border border-slate-850 rounded-xl p-3 space-y-1 text-[9.5px]">
                    <div className="flex items-center justify-between font-mono text-slate-400 text-[8.5px]">
                      <span className="font-bold text-indigo-400">DISPATCH #{idx + 1} • {new Date(n.sentAt).toLocaleString()}</span>
                      <span>TO: {n.recipientEmail}</span>
                    </div>
                    <div className="font-bold text-white font-sans">{n.subject}</div>
                    <p className="text-slate-400 font-sans line-clamp-2 leading-relaxed">
                      {n.body || "No body preview."}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 4: HISTORICAL INFRACTION RECORD */}
          <div className="space-y-2.5" id="dossier-section-historical-infractions">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px]">4</span>
                Historical Infraction Record (Database Sweeps)
              </h4>
              <span className="text-[9px] font-mono text-slate-500">
                {previousInfractions.length} Historical Incidents Archived
              </span>
            </div>

            {previousInfractions.length === 0 ? (
              <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 text-center text-slate-500 font-mono text-[10px]">
                No historical pricing infractions found for this partner domain in completed database sweeps.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/60 max-h-48 custom-scrollbar">
                <table className="w-full text-left border-collapse text-[9.5px] font-mono">
                  <thead className="sticky top-0 bg-slate-900 text-slate-400 border-b border-slate-800 font-bold uppercase text-[8px]">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">SKU</th>
                      <th className="py-2 px-3 font-sans">Product</th>
                      <th className="py-2 px-3">MAP</th>
                      <th className="py-2 px-3">Detected</th>
                      <th className="py-2 px-3">Deficit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {previousInfractions.slice(0, 10).map((inf, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 text-slate-400">{inf.date}</td>
                        <td className="py-2 px-3 text-slate-300 font-bold">{inf.productSku}</td>
                        <td className="py-2 px-3 font-sans text-slate-200 truncate max-w-[160px]">{inf.productName}</td>
                        <td className="py-2 px-3 text-slate-400">${inf.mapPrice.toFixed(2)}</td>
                        <td className="py-2 px-3 text-slate-300">${inf.detectedPrice.toFixed(2)}</td>
                        <td className="py-2 px-3 font-bold text-rose-400">-${inf.priceDifference.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 5: CONFIDENTIALITY & PRIVILEGED LEGAL NOTICE */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2 text-[9px] font-mono">
            <div className="flex items-center justify-between text-slate-400 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1 text-slate-300">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                Confidentiality & Privileged Legal Notice
              </span>
              <span className="text-slate-500">Distribution Code: CONF-MAP-LEGAL-77</span>
            </div>
            <p className="text-slate-400 leading-relaxed font-sans text-[8.5px]">
              This legal compliance dossier comprises automated pricing diagnostics, outbound notifications, and system infraction logs, gathered chronologically in support of brand MAP protection protocols. This information is privileged, strictly confidential, and intended solely for immediate legal review, counsel counseling, or dispute filings. Distribution of this dossier is governed by internal brand authorization procedures.
            </p>
            <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[8px] text-slate-500">
              <span>Digital Verification ID: {dossierCaseId}</span>
              <span>Generated via MAPShield Automated Protection Core</span>
            </div>
          </div>

        </div>

        {/* Modal Bottom Sticky Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400 text-[10px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Consolidated Evidence Dossier Ready for Formal Counsel Action</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition font-medium cursor-pointer"
            >
              Close Dossier
            </button>

            <button
              type="button"
              onClick={() => onGeneratePdf(toast)}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-amber-950/50 hover:brightness-110 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Signed PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
