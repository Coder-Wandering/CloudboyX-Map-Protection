import React, { useState, useEffect } from "react";
import { Product, Partner } from "../types";
import { 
  Truck, Box, Barcode, Scale, Printer, MapPin, Sparkles, Check, Plus, 
  Search, Download, ShieldAlert, AlertTriangle, FileText, ArrowRight, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ShippingCoreViewProps {
  products: Product[];
  partners: Partner[];
}

interface ShipmentItem {
  id: string;
  orderId: string;
  customerName: string;
  destination: string;
  carrier: "FedEx" | "UPS" | "USPS" | "DHL";
  classTier: "Ground" | "Express" | "Overnight";
  weight: number; // in lbs
  dimensions: { l: number; w: number; h: number }; // in inches
  trackingNum: string;
  status: "Ready" | "Picked" | "Packed" | "Dispatched" | "transit" | "delivered";
  hazardChecked: boolean;
}

export default function ShippingCoreView({ products, partners }: ShippingCoreViewProps) {
  // Mock shipments matching partners and custom items
  const [shipments, setShipments] = useState<ShipmentItem[]>([
    {
      id: "SHP-001",
      orderId: "ORD-PRE-81A",
      customerName: "TechDelight Electronics",
      destination: "450 Enterprise Way, San Jose, CA 95134",
      carrier: "FedEx",
      classTier: "Ground",
      weight: 12.5,
      dimensions: { l: 15, w: 10, h: 6 },
      trackingNum: "771892190812",
      status: "Dispatched",
      hazardChecked: true
    },
    {
      id: "SHP-002",
      orderId: "ORD-PRE-90B",
      customerName: "GizmoMart Online",
      destination: "300 Commerce Blvd, Austin, TX 78701",
      carrier: "UPS",
      classTier: "Express",
      weight: 8.2,
      dimensions: { l: 12, w: 12, h: 8 },
      trackingNum: "1Z999AA1012345678",
      status: "transit",
      hazardChecked: true
    },
    {
      id: "SHP-003",
      orderId: "ORD-CSV-402",
      customerName: "PixelPerfect Supplies",
      destination: "128 Digital Pkwy, Seattle, WA 98101",
      carrier: "USPS",
      classTier: "Ground",
      weight: 1.5,
      dimensions: { l: 8, w: 6, h: 4 },
      trackingNum: "9400100000000000000012",
      status: "Packed",
      hazardChecked: true
    }
  ]);

  // Active carton dimensions being visualized
  const [activeCarton, setActiveCarton] = useState({
    l: 16,
    w: 12,
    h: 10,
    weight: 14.5
  });

  const [activeCarrier, setActiveCarrier] = useState<"FedEx" | "UPS" | "USPS" | "DHL">("FedEx");
  const [activeClass, setActiveClass] = useState<"Ground" | "Express" | "Overnight">("Ground");
  const [destinationInput, setDestinationInput] = useState("PixelPerfect Supplies East, Atlanta, GA 30303");
  const [carrierSelectedOrder, setCarrierSelectedOrder] = useState("ORD-CSV-403");

  // Selected packaging simulation modes
  const [isLabelGenerating, setIsLabelGenerating] = useState(false);
  const [activeLabelShipment, setActiveLabelShipment] = useState<ShipmentItem | null>(shipments[0]);

  // Active metrics calculation
  const volumetricWeight = parseFloat(((activeCarton.l * activeCarton.w * activeCarton.h) / 139).toFixed(2));
  const billableWeight = Math.max(activeCarton.weight, volumetricWeight);
  
  const carrierRates = {
    FedEx: { Ground: 12.45, Express: 34.20, Overnight: 68.10 },
    UPS: { Ground: 13.10, Express: 36.80, Overnight: 71.40 },
    USPS: { Ground: 6.85, Express: 21.30, Overnight: 45.00 },
    DHL: { Ground: 28.50, Express: 52.12, Overnight: 94.60 }
  };

  const selectedBaseRate = carrierRates[activeCarrier][activeClass];
  const totalCost = parseFloat((selectedBaseRate + (billableWeight * 1.05)).toFixed(2));

  // Add shipment simulation
  const handleCreateShipment = () => {
    const trackingPrefixes = {
      FedEx: "77" + Math.floor(Math.random() * 899999 + 100000),
      UPS: "1Z" + Math.floor(Math.random() * 899999 + 100000) + "AA1",
      USPS: "9400" + Math.floor(Math.random() * 899999 + 100000),
      DHL: "DHL" + Math.floor(Math.random() * 899999 + 100000)
    };

    const newShipment: ShipmentItem = {
      id: `SHP-${String(shipments.length + 1).padStart(3, "0")}`,
      orderId: carrierSelectedOrder || "ORD-CUSTOM-60",
      customerName: destinationInput.split(",")[0] || "Custom Consignee",
      destination: destinationInput,
      carrier: activeCarrier,
      classTier: activeClass,
      weight: activeCarton.weight,
      dimensions: { l: activeCarton.l, w: activeCarton.w, h: activeCarton.h },
      trackingNum: trackingPrefixes[activeCarrier] + String(Math.floor(Math.random() * 89999) + 10000),
      status: "Ready",
      hazardChecked: true
    };

    setIsLabelGenerating(true);
    setTimeout(() => {
      setShipments(prev => [newShipment, ...prev]);
      setActiveLabelShipment(newShipment);
      setIsLabelGenerating(false);
    }, 1000);
  };

  // Tracking timeline labels
  const getTimelineProgress = (status: string) => {
    switch (status) {
      case "Ready": return 1;
      case "Picked": return 2;
      case "Packed": return 3;
      case "Dispatched": return 4;
      case "transit": return 5;
      case "delivered": return 6;
      default: return 1;
    }
  };

  // Label print action simulation
  const handlePrintLabel = () => {
    if (!activeLabelShipment) return;
    
    // Simple window callback alternative that is frame friendly
    alert(`DISPATCH COURIER PRINTER:\nSending high-contrast 4x6 Thermal PDF manifest label for Shipment ID ${activeLabelShipment.id} (Tracking: ${activeLabelShipment.trackingNum}) to default warehouse spool...`);
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans" id="shipping-core-view-root">
      
      {/* Top Banner Card */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-505/10">
                <Truck className="w-5 h-5 animate-pulse" />
              </span>
              <span className="text-xs font-mono font-bold text-slate-400 tracking-wider uppercase">FULFILLMENT DISPATCH ACTIVE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Warenhaus Shipping & Logistics Core</h2>
            <p className="text-sm text-slate-400 max-w-2xl">
              Compare shipping rates, simulate dimensional box volumes, configure auto-calculating dimensional weight balances, and print carrier thermal shipping labels for integrated wholesale orders.
            </p>
          </div>
        </div>
      </div>

      {/* Grid containing Dimensional Packaging Visualizer and Carrier Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Volumetric Package Visualizer & Controls */}
        <div className="lg:col-span-4 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-3xl p-6 space-y-6 shadow-sm">
          <div className="border-b border-rose-900/10 pb-4">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Box className="w-4 h-4 text-emerald-400" />
              Package Carton Modeler
            </h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Determine dimensional weight variables</p>
          </div>

          <div className="space-y-4">
            {/* Length inputs */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold text-slate-400">Length (in)</label>
                <input 
                  type="number"
                  value={activeCarton.l}
                  onChange={(e) => setActiveCarton({ ...activeCarton, l: Math.max(1, parseFloat(e.target.value) || 0) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs font-mono text-slate-200 outline-none focus:border-emerald-505"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold text-slate-400">Width (in)</label>
                <input 
                  type="number"
                  value={activeCarton.w}
                  onChange={(e) => setActiveCarton({ ...activeCarton, w: Math.max(1, parseFloat(e.target.value) || 0) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs font-mono text-slate-200 outline-none focus:border-emerald-505"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold text-slate-400">Height (in)</label>
                <input 
                  type="number"
                  value={activeCarton.h}
                  onChange={(e) => setActiveCarton({ ...activeCarton, h: Math.max(1, parseFloat(e.target.value) || 0) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs font-mono text-slate-200 outline-none focus:border-emerald-505"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-mono font-bold text-slate-400 flex justify-between">
                <span>Actual Package Weight (lbs)</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1"><Scale className="w-3 h-3 text-emerald-400" /> Auto-Sensed</span>
              </label>
              <input 
                type="number"
                value={activeCarton.weight}
                onChange={(e) => setActiveCarton({ ...activeCarton, weight: Math.max(0.1, parseFloat(e.target.value) || 0) })}
                step="0.1"
                className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs font-mono text-slate-200 outline-none focus:border-emerald-505"
              />
            </div>

            {/* volumetric visualizer box details */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 space-y-3 font-mono text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>Carton Volume:</span>
                <span className="text-slate-200 font-bold">{(activeCarton.l * activeCarton.w * activeCarton.h).toLocaleString()} in³</span>
              </div>
              <div className="flex justify-between">
                <span>Volumetric Divider (139):</span>
                <span>/ 139</span>
              </div>
              <div className="flex justify-between border-t border-slate-900 pt-2 text-xs">
                <span>Estimated Vol. Weight:</span>
                <span className="text-indigo-400 font-bold">{volumetricWeight} lbs</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Billable Cargo Weight:</span>
                <span className="text-emerald-400 font-bold">{billableWeight} lbs</span>
              </div>
            </div>

            {/* Dimensional CSS Carton Box Visualizer */}
            <div className="h-44 bg-slate-950/80 rounded-2xl border border-slate-850 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-emerald-500/5 to-transparent"></div>
              
              {/* Box Drawing wireframe */}
              <div 
                className="border border-indigo-500/30 bg-indigo-505/5 rounded-lg flex items-center justify-center transition-all duration-300 transform rotate-12 rotate-y-45 relative"
                style={{
                  width: `${Math.min(130, Math.max(40, activeCarton.l * 8))}px`,
                  height: `${Math.min(100, Math.max(40, activeCarton.h * 8))}px`,
                  borderWidth: "1.5px",
                  boxShadow: "0 0 20px rgba(99,102,241,0.05)"
                }}
              >
                <div className="absolute inset-2 border border-dashed border-indigo-500/10 flex flex-col justify-between p-1.5 text-[8px] font-mono text-indigo-400/60 leading-none select-none">
                  <div className="text-left">H: {activeCarton.h}"</div>
                  <div className="text-right">L: {activeCarton.l}"</div>
                </div>
                <span className="text-[10px] font-bold text-indigo-400 font-mono">PACK CARTON</span>
              </div>

              <div className="absolute bottom-2.5 right-3 text-[9px] font-mono text-slate-600">
                W: {activeCarton.w}"
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Courier Integration & Rates Config */}
        <div className="lg:col-span-5 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-3xl p-6 space-y-6 shadow-sm">
          <div className="border-b border-rose-900/10 pb-4">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-400 animate-bounce" />
              Carrier Router & Sizing
            </h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Automated zone mapping pricing metrics</p>
          </div>

          <div className="space-y-4">
            {/* Carrier Radio selection row */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-bold text-slate-400">Target Express Courier Service</label>
              <div className="grid grid-cols-4 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
                {(["FedEx", "UPS", "USPS", "DHL"] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => setActiveCarrier(c)}
                    className={`p-2 rounded-lg text-[10px] font-mono font-bold text-center tracking-tight cursor-pointer ${
                      activeCarrier === c 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Class tier */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-bold text-slate-400">Logistics dispatch tier urgency</label>
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
                {(["Ground", "Express", "Overnight"] as const).map(tier => (
                  <button
                    key={tier}
                    onClick={() => setActiveClass(tier)}
                    className={`p-2 rounded-lg text-[10px] font-mono font-bold text-center tracking-tight cursor-pointer ${
                      activeClass === tier 
                        ? "bg-indigo-500/10 text-indigo-400 border border-indigo-505/20" 
                        : "text-slate-505 hover:text-slate-300"
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            {/* Consignee inputs */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono font-bold text-slate-400">Consignee Destination Point</label>
              <div className="relative">
                <input 
                  type="text"
                  value={destinationInput}
                  onChange={(e) => setDestinationInput(e.target.value)}
                  placeholder="e.g. Acme Corp Depot, Atlanta, GA 30301"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs font-semibold text-slate-200 outline-none focus:border-emerald-505 font-sans"
                />
                <MapPin className="w-4 h-4 text-slate-600 absolute left-3 top-3" />
              </div>
            </div>

            {/* Reference order selection */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono font-bold text-slate-400">Linked Wholesale Order SKU Reference</label>
              <div className="relative">
                <input 
                  type="text"
                  value={carrierSelectedOrder}
                  onChange={(e) => setCarrierSelectedOrder(e.target.value)}
                  placeholder="e.g. ORD-CSV-403"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs font-mono text-slate-200 outline-none focus:border-emerald-505"
                />
                <Barcode className="w-4 h-4 text-slate-605 absolute left-3 top-3" />
              </div>
            </div>

            {/* Rate calculation layout */}
            <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 flex justify-between items-center text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold text-slate-550 block">LIVE DOCKET ESTIMATOR RATE</span>
                <span className="text-slate-350 font-sans">{activeCarrier} - {activeClass} Delivery</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-xs text-slate-500 mr-1.5 font-normal">Est. Invoice Charge:</span>
                <span className="text-emerald-400 font-bold text-base font-mono">${totalCost.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCreateShipment}
              disabled={isLabelGenerating || !destinationInput.trim()}
              className="w-full py-3 rounded-2xl bg-indigo-500 text-white hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-505 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              {isLabelGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Airway Bill & Custom Manifest...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Formulate Carrier Label & Ship Docket
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Thermal Carrier Label Visualizer */}
        <div className="lg:col-span-3 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-3xl p-6 flex flex-col justify-between shadow-sm">
          <div className="border-b border-rose-900/10 pb-4 mb-4">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-indigo-400" />
              Thermal 4x6 Label maker
            </h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Audit generated air dockets</p>
          </div>

          {activeLabelShipment ? (
            <div className="flex-1 flex flex-col justify-between space-y-4">
              {/* White Background Thermal Label Visual representation */}
              <div className="bg-white text-slate-950 p-4 rounded-xl border border-slate-300 font-mono text-[9px] space-y-3 shadow-md">
                
                {/* Header courier logo */}
                <div className="flex justify-between items-start border-b-2 border-slate-950 pb-2">
                  <div className="font-extrabold text-xs uppercase italic tracking-tighter text-slate-900">
                    {activeLabelShipment.carrier} PRIORITY
                  </div>
                  <div className="text-right text-[8px] leading-tight">
                    DEPO ID: WUX-889<br />
                    WT: <b>{activeLabelShipment.weight.toFixed(1)} LBS</b>
                  </div>
                </div>

                {/* Addresses */}
                <div className="grid grid-cols-1 divide-y divide-slate-300 gap-1.5 text-[8px] leading-tight pb-1 border-b border-slate-300">
                  <div className="pb-1">
                    <span className="font-bold block uppercase text-[7px] text-slate-500 font-mono">FROM:</span>
                    CLOUDBOY METRICS LOGISTICS<br />
                    100 SHIPWAY ROAD UNIT C<br />
                    OAKLAND, CA 94607
                  </div>
                  <div className="pt-1">
                    <span className="font-bold block uppercase text-[7px] text-slate-500 font-mono">TO (CONSIGNEE SHIPMENT):</span>
                    <span className="font-bold">{activeLabelShipment.customerName}</span><br />
                    {activeLabelShipment.destination.replace(activeLabelShipment.customerName + ", ", "")}
                  </div>
                </div>

                {/* Tracking large codes & barcode simulation */}
                <div className="space-y-1.5 text-center py-1">
                  <span className="text-[7px] uppercase font-bold text-slate-500 font-mono">TRACKING NUMBER BARCODE SYMBOLOGY</span>
                  
                  {/* Visual Barcode pattern using pure divs */}
                  <div className="bg-slate-950 h-8 flex items-stretch gap-[1.5px] px-2 overflow-hidden mx-auto max-w-[180px]">
                    {Array.from({ length: 32 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="bg-white" 
                        style={{ 
                          width: `${(i % 3 === 0 ? 3 : (i % 5 === 0 ? 1 : 2.5))}px`,
                          backgroundColor: i % 7 === 0 ? "transparent" : "white"
                        }}
                      ></div>
                    ))}
                  </div>

                  <span className="font-bold text-xs uppercase block leading-none font-sans px-1 text-slate-900 tracking-wider">
                    {activeLabelShipment.trackingNum}
                  </span>
                </div>

                {/* Footer instructions */}
                <div className="border-t-2 border-slate-950 pt-2 flex justify-between items-center text-[7px] font-bold leading-none">
                  <span>CLASS: {activeLabelShipment.classTier.toUpperCase()}</span>
                  <span>DOCNUM: {activeLabelShipment.orderId}</span>
                </div>

              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <button
                  onClick={handlePrintLabel}
                  className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-205 text-slate-200 border border-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition select-none cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-300" />
                  Print Thermal 4x6 PDF
                </button>
              </div>

            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 font-mono text-xs max-w-[160px] mx-auto">
              No shipment selected. Formulate a carrier label on the left to review or print thermals.
            </div>
          )}

        </div>

      </div>

      {/* Aggregate Manifest Dispatch table listing active warehouse shipments */}
      <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 mt-4">
        <FileText className="w-4 h-4 text-emerald-400" />
        Aggregate logistics manifest & tracking pipeline
      </h3>

      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-3xl p-6 overflow-x-auto shadow-sm">
        <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
          <h4 className="text-xs font-bold text-white">Warehouse Manifest Logs ({shipments.length})</h4>
          <span className="text-[9px] font-mono text-slate-505 bg-slate-950 px-2.5 py-1 rounded border border-slate-850 flex items-center gap-1">
            <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse mr-0.5"></span>
            CARRIER API DISPATCH HUB ACTIVE
          </span>
        </div>

        {shipments.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs font-mono">
            No active carrier shipment manifest records found. Create one.
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-850 text-slate-505 font-mono text-[10px] uppercase">
                <th className="py-2.5 px-3">Ship ID</th>
                <th className="py-2.5 px-3">Courier Link</th>
                <th className="py-2.5 px-3 font-mono">Related Order</th>
                <th className="py-2.5 px-3">Consignee Target</th>
                <th className="py-2.5 px-3">Carton Info</th>
                <th className="py-2.5 px-3 text-center">Dispatch Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60 font-sans">
              {shipments.map((ship) => (
                <tr key={ship.id} className={`hover:bg-slate-900/30 transition-all ${activeLabelShipment?.id === ship.id ? "bg-slate-900/40 border-l border-indigo-405 border-l-2" : ""}`}>
                  <td className="py-3 px-3 font-mono font-bold text-white">{ship.id}</td>
                  <td className="py-3 px-3 font-mono font-semibold">
                    <span className={`px-2 py-0.5 rounded border text-[9px] border-emerald-500/10 font-bold mr-1.5 ${
                      ship.carrier === "FedEx" ? "bg-purple-500/10 text-purple-400" :
                      ship.carrier === "UPS" ? "bg-amber-550/10 text-amber-500" :
                      ship.carrier === "USPS" ? "bg-blue-500/10 text-blue-400" :
                      "bg-indigo-500/10 text-indigo-400"
                    }`}>
                      {ship.carrier}
                    </span>
                    <span className="text-slate-400 font-bold tracking-tight text-[11px]">{ship.trackingNum}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-zinc-400">{ship.orderId}</td>
                  <td className="py-3 px-3 font-semibold text-slate-202 text-slate-200 truncate max-w-[200px]" title={ship.destination}>
                    {ship.customerName}
                    <span className="block text-[8px] font-mono text-slate-550 font-normal truncate max-w-[180px] mt-0.5">{ship.destination}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-450 leading-relaxed text-[11px]">
                    {ship.weight.toFixed(1)} lbs
                    <span className="block text-[9px] text-slate-550 font-normal leading-none mt-0.5">{ship.dimensions.l}x{ship.dimensions.w}x{ship.dimensions.h} in</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                      ship.status === "Ready" ? "bg-slate-800 text-slate-400 border border-slate-700" :
                      ship.status === "transit" ? "bg-indigo-505/10 text-indigo-400 border border-indigo-500/10" :
                      ship.status === "delivered" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" :
                      "bg-slate-950 text-slate-400 border border-slate-800"
                    }`}>
                      {ship.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => setActiveLabelShipment(ship)}
                      className="px-2.5 py-1 text-[10px] font-mono font-bold hover:bg-slate-850 hover:text-white rounded-lg transition"
                    >
                      LOAD LABEL DOCK
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
