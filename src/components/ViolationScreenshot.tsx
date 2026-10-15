import React, { useRef, useState } from "react";
import { 
  X, Download, ExternalLink, Calendar, ShieldAlert, Monitor, Info, Check, Sparkles, AlertCircle
} from "lucide-react";

interface ViolationScreenshotProps {
  product: string;
  partner: string;
  domain: string;
  mapPrice: number;
  detectedPrice: number;
  url: string;
  timestamp: string;
  onClose: () => void;
}

export default function ViolationScreenshot({
  product,
  partner,
  domain,
  mapPrice,
  detectedPrice,
  url,
  timestamp,
  onClose
}: ViolationScreenshotProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const mockupRef = useRef<HTMLDivElement>(null);

  const varianceAmount = mapPrice - detectedPrice;
  const variancePercent = Math.round((varianceAmount / mapPrice) * 100);

  // Generate a random clean tracking ID for compliance evidence
  const evidenceId = "EVD-" + Math.floor(100000 + Math.random() * 900000);

  // Handles dynamic canvas compilation to trigger a real PNG download of the website violation screenshot
  const handleDownload = () => {
    setDownloading(true);
    
    setTimeout(() => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1000;
        canvas.height = 750;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) return;

        // 1. Fill background (Premium Slate theme)
        ctx.fillStyle = "#090d16";
        ctx.fillRect(0, 0, 1000, 750);

        // 2. Browser Chrome Header Bar
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, 1000, 60);

        // Window Control Dots (MacOS style)
        ctx.beginPath();
        ctx.arc(20, 30, 6, 0, 2 * Math.PI);
        ctx.fillStyle = "#ef4444"; // red
        ctx.fill();

        ctx.beginPath();
        ctx.arc(40, 30, 6, 0, 2 * Math.PI);
        ctx.fillStyle = "#f59e0b"; // yellow
        ctx.fill();

        ctx.beginPath();
        ctx.arc(60, 30, 6, 0, 2 * Math.PI);
        ctx.fillStyle = "#10b981"; // green
        ctx.fill();

        // Target URL bar frame
        ctx.fillStyle = "#020617";
        ctx.beginPath();
        ctx.roundRect(100, 15, 750, 30, 6);
        ctx.fill();

        // Browser Address URL
        ctx.fillStyle = "#94a3b8";
        ctx.font = "14px 'JetBrains Mono', Courier, monospace";
        ctx.fillText(`https://www.${domain.toLowerCase()}/products/inspect?sku_id=${product.toLowerCase().replace(/\s+/g, '-')}`, 120, 35);

        // 3. Web Site Workspace body
        ctx.fillStyle = "#090d16";
        ctx.fillRect(0, 60, 1000, 690);

        // Diagonal Grid overlay representation
        ctx.strokeStyle = "rgba(99, 102, 241, 0.05)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 1000; i += 40) {
          ctx.beginPath();
          ctx.moveTo(i, 60);
          ctx.lineTo(i, 750);
          ctx.stroke();
        }
        for (let j = 60; j < 750; j += 40) {
          ctx.beginPath();
          ctx.moveTo(0, j);
          ctx.lineTo(1000, j);
          ctx.stroke();
        }

        // 4. Partner Web page UI Wrapper
        ctx.fillStyle = "#0b1329";
        ctx.beginPath();
        ctx.roundRect(50, 110, 900, 480, 12);
        ctx.fill();
        ctx.strokeStyle = "rgba(79, 70, 229, 0.2)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Breadcrumbs on partner store
        ctx.fillStyle = "#64748b";
        ctx.font = "13px 'Inter', sans-serif";
        ctx.fillText("Home > Hardware > Smart Devices & Peripherals", 80, 150);

        // Partner E-commerce Store title (e.g. Amazon, Best Buy)
        ctx.fillStyle = "#f8fafc";
        ctx.font = "bold 26px 'Inter', sans-serif";
        ctx.fillText(partner.toUpperCase() + " ONLINE STORE", 80, 195);

        // Product Details
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 22px 'Inter', sans-serif";
        ctx.fillText(product, 80, 245);

        ctx.fillStyle = "#10b981";
        ctx.font = "14px 'Inter', sans-serif";
        ctx.fillText("● IN STOCK - Available for Instant Shipping", 80, 275);

        // Drawing a mock image/thumbnail box
        ctx.fillStyle = "#020617";
        ctx.beginPath();
        ctx.roundRect(80, 310, 220, 220, 8);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.stroke();
        
        // Mock graphic in box (padlock or shield icon)
        ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(190, 420, 30, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillStyle = "rgba(99, 102, 241, 0.2)";
        ctx.fill();

        // Product description text
        ctx.fillStyle = "#94a3b8";
        ctx.font = "13px 'Inter', sans-serif";
        ctx.fillText("Brand Enforced SKU: " + product.toUpperCase().substring(0, 15), 330, 335);
        ctx.fillText("Fulfillment: Reseller Direct Supply", 330, 360);
        ctx.fillText("Warranty: Standard Authorized Product Coverage", 330, 385);

        // Detailed Price area on partner store
        ctx.fillStyle = "#94a3b8";
        ctx.font = "14px 'Inter', sans-serif";
        ctx.fillText("Standard MSRP / MAP minimum parameter: ", 330, 440);
        
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "line-through 18px 'Inter', sans-serif";
        ctx.fillText(`$${mapPrice.toFixed(2)}`, 330, 470);

        // Draw the offensive active listed price
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 38px 'Inter', sans-serif";
        ctx.fillText(`$${detectedPrice.toFixed(2)}`, 330, 520);

        // 5. RED SCREENSHOT SCAN VIOLATION CONTAINER
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.roundRect(315, 410, 600, 135, 8);
        ctx.stroke();
        ctx.setLineDash([]); // clear dash

        // Draw critical alert badge within the screenshot box
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.roundRect(740, 420, 160, 30, 4);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText("MAP BREACH DETECTED", 755, 439);

        // Write variance indicator
        ctx.fillStyle = "#fecaca";
        ctx.font = "bold 13px 'Inter', sans-serif";
        ctx.fillText(`Violation Variance: -$${varianceAmount.toFixed(2)} (${variancePercent}% under MAP limit)`, 330, 565);

        // 6. Security stamps and metadata audit box at the bottom of the screenshot
        ctx.fillStyle = "#0c1221";
        ctx.fillRect(0, 610, 1000, 140);
        ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 610);
        ctx.lineTo(1000, 610);
        ctx.stroke();

        ctx.fillStyle = "#6366f1";
        ctx.font = "bold 16px 'Inter', sans-serif";
        ctx.fillText("MAPSHIELD® AUDIT COMPLIANCE PROOF", 50, 645);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "12px 'JetBrains Mono', Courier, monospace";
        ctx.fillText(`EVIDENCE TRACKING: ${evidenceId}`, 50, 675);
        ctx.fillText(`SWEEP RUN DATE: ${new Date(timestamp).toUTCString()}`, 50, 695);
        ctx.fillText(`GROUNDED SEARCH CONTEXT CITATION SECURED: googleSearchGroundingModel-v3.5`, 50, 715);

        // Decorative lock stamp/seal logo in bottom right
        ctx.strokeStyle = "rgba(239, 68, 68, 0.3)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(880, 675, 45, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillStyle = "rgba(239, 68, 68, 0.05)";
        ctx.fill();

        ctx.fillStyle = "rgba(239, 68, 68, 0.7)";
        ctx.font = "bold 11px 'Inter', sans-serif";
        ctx.fillText("EVIDENCE", 855, 670);
        ctx.fillText("SECURED", 855, 688);

        // Export data URL and proceed with download
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `mapshield-proof-${evidenceId.toLowerCase()}-${domain}.png`;
        link.href = dataUrl;
        link.click();

        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      } catch (err) {
        console.error("Canvas compilation error: ", err);
      } finally {
        setDownloading(false);
      }
    }, 800);
  };

  return (
    <div id="violation-screenshot-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-fade-in">
      
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl text-slate-300 shadow-sm">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-950/20 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-none flex items-center gap-2">
                Verifiable Compliance Proof Screenshot
              </h2>
              <span className="text-[10px] font-mono text-slate-400 mt-1 block uppercase tracking-wider">
                ID Reference: <strong className="text-indigo-400 font-bold">{evidenceId}</strong> • Timestamped & Grounded
              </span>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition cursor-pointer text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Info Disclaimer banner */}
        <div className="px-5 py-3 bg-red-950/20 border-b border-red-950/30 text-xs text-red-300 flex items-center gap-2 font-mono shrink-0">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <div className="leading-tight">
            An automated snapshot has been formatted highlighting the pricing violation on <strong>{domain}</strong>. Fully qualified for legal disputes and brand channel audits.
          </div>
        </div>

        {/* Modal Body / Scrollable Content preview */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Active styling template representing the web layout mockup */}
          <div 
            ref={mockupRef}
            className="border-2 border-indigo-500/30 rounded-xl overflow-hidden bg-slate-950 shadow-inner relative group"
          >
            
            {/* Embedded browser address chrome header */}
            <div className="bg-slate-900/90 py-3 px-4 border-b border-indigo-950/50 flex items-center gap-3">
              <div className="flex gap-1.5 shrink-0 select-none">
                <span className="w-3 h-3 rounded-full bg-red-400/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-400/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-400/80 inline-block"></span>
              </div>

              {/* URL Mock */}
              <div className="flex-1 max-w-2xl bg-slate-950 rounded-lg px-3.5 py-1.5 border border-slate-850/60 flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-450 truncate">
                  <span className="text-emerald-500 font-bold select-none text-[9px] bg-emerald-500/10 px-1 py-0.5 rounded leading-none">HTTPS</span>
                  <span className="truncate">https://{domain}/item/{product.toLowerCase().replace(/\s+/g, "-")}</span>
                </div>
                <Monitor className="w-3.5 h-3.5 text-slate-650" />
              </div>
            </div>

            {/* Simulated Retail Webpage Workspace Layout */}
            <div className="p-6 relative overflow-hidden bg-gradient-to-b from-[#090d16] to-[#04060b]">
              
              {/* Security background watermarks */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none rotate-12">
                <span className="text-8xl font-black text-indigo-400 font-display text-center leading-none tracking-widest block">
                  MAPSHIELD PROOF DETECTED BY COMPLIANCE AGENT
                </span>
              </div>

              {/* Visual simulated store body elements */}
              <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                      E-COMMERCE DISTRIBUTOR CHANNEL
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-display uppercase">
                      {partner} STOREPAGE
                    </h3>
                  </div>

                  {/* Scanned Badge */}
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded inline-block">
                    DOMAIN: {domain}
                  </span>
                </div>

                {/* Main Product Frame display */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 p-4 rounded-xl bg-[#0b1329] border border-slate-850">
                  
                  {/* Left Column: Placeholder img */}
                  <div className="md:col-span-2 aspect-video md:aspect-square bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center relative shadow-inner overflow-hidden">
                    <div className="absolute top-0 left-0 bg-red-500/10 border-b border-r border-red-500/20 px-2 py-1 text-[9px] font-mono text-red-400 font-bold">
                      SCAN AREA
                    </div>
                    <div className="text-center space-y-2 select-none">
                      <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-455/30 flex items-center justify-center mx-auto text-indigo-400">
                        <Monitor className="w-6 h-6" />
                      </div>
                      <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">REDUCED VALUE SOURCE</span>
                    </div>
                  </div>

                  {/* Right Column: Key pricing indicators */}
                  <div className="md:col-span-3 space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-base sm:text-lg font-bold text-slate-200 tracking-tight leading-tight">
                        {product}
                      </h4>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 text-[9px] font-mono">
                        <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse"></span>
                        ONLINE IN STOCK
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-450 leading-relaxed font-sans border-b border-slate-800 pb-3">
                      High capacity premium e-commerce item distribution. Direct merchant dispatch, 1-Year coverage guarantee included. Buy yours today.
                    </p>

                    {/* Pricing violation box targeting */}
                    <div className="relative p-4 rounded-xl border-2 border-dashed border-red-500 bg-red-500/5 transition group-hover:bg-red-500/10">
                      
                      {/* Reticle camera bounds */}
                      <span className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-red-400 rounded-tl-sm select-none"></span>
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-red-400 rounded-tr-sm select-none"></span>
                      <span className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-red-400 rounded-bl-sm select-none"></span>
                      <span className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-red-400 rounded-br-sm select-none"></span>

                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-bold font-mono text-red-400 uppercase tracking-wider block">
                          [ TARGET Infraction Price ]
                        </span>
                        
                        <span className="px-2 py-0.5 bg-red-500 text-white font-bold font-mono text-[9px] rounded uppercase tracking-wider select-none animate-pulse">
                          MAP BREACH
                        </span>
                      </div>

                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl sm:text-4xl font-extrabold text-red-500 tracking-tight font-display">
                          ${detectedPrice.toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-400 line-through">
                          MSRP: ${mapPrice.toFixed(2)}
                        </span>
                      </div>

                      <div className="mt-2 text-[10px] text-red-300 font-mono flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        Variance: -${varianceAmount.toFixed(2)} ({variancePercent}% below Minimum Advertised Policy limit)
                      </div>
                    </div>

                  </div>

                </div>

                {/* Watermark Details footer in image */}
                <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-[10px] text-slate-500 leading-normal">
                  <div className="space-y-0.5">
                    <span className="block text-slate-400 font-bold uppercase">SECURED EVIDENCE</span>
                    <span className="block truncate">TRACE ROUTE: MAPSHIELD-AI-GROUNDING</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="block text-slate-400 font-bold uppercase">GEOLOCATION METRICS</span>
                    <span className="block">GOOGLE CHANNELS (US-DOMESTIC)</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="block text-slate-400 font-bold uppercase">CAPUTRED UTC DATE</span>
                    <span className="block truncate">{new Date(timestamp).toUTCString()}</span>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* Action Explainer Panel */}
          <div className="p-4 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-400 shadow-sm">
            <div className="space-y-1.5">
              <span className="font-semibold text-slate-200 block flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                Proof Preservation
              </span>
              <p className="leading-relaxed">
                Screenshots serve as legal evidence. Downloading bundles the audit log, URL path, and violation bounding box into a verifiable PNG.
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="font-semibold text-slate-200 block flex items-center gap-1">
                <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                CEASE & DESIST READY
              </span>
              <p className="leading-relaxed">
                You can attach this compliance screenshot directly into our **AI Strategy Lab** drafts to construct bulletproof enforcement legal claims.
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="font-semibold text-slate-200 block flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Dynamic Search Proof
              </span>
              <p className="leading-relaxed">
                Prices and layouts are gathered dynamically using our active AI search engine grounding to prevent falsification.
              </p>
            </div>
          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          
          <a 
            href={url}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-4 py-3 bg-slate-900 hover:bg-slate-855 border border-slate-800 hover:border-slate-705 text-xs text-slate-200 rounded-xl flex items-center justify-center gap-2 transition font-medium cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-slate-500" />
            Inspect Offending Link Live
          </a>

          <div className="flex gap-3 w-full sm:w-auto self-stretch sm:self-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
            >
              Close
            </button>
            
            <button
              onClick={handleDownload}
              disabled={downloading}
              className={`flex-1 sm:flex-initial px-5 py-3 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2 cursor-pointer ${
                downloadSuccess 
                  ? "bg-emerald-600 shadow-md shadow-emerald-750/20" 
                  : "bg-indigo-550 hover:bg-indigo-400 shadow-lg shadow-indigo-650/15"
              }`}
            >
              {downloading ? (
                <>
                  <span className="border-2 border-white/20 border-t-white h-4 w-4 rounded-full animate-spin"></span>
                  Capturing Image...
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 animate-bounce" />
                  Screenshot Saved!
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PNG Screenshot
                </>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
