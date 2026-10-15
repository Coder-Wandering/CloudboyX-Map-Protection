import React, { useState, useMemo, useEffect } from "react";
import { 
  ShieldAlert, Shield, Globe, Trash2, HelpCircle, Eye, RefreshCw, Download, 
  FileText, CheckCircle2, ArrowRight, Search, AlertTriangle, Fingerprint, 
  Gavel, Calendar, Plus, Link2, ExternalLink, Mail, Check, X, Flame, Layers, 
  MapPin, Sliders, Maximize2, TrendingUp, BarChart2, Filter, Zap, Target, 
  ZoomIn, ZoomOut, RotateCcw, AlertOctagon, Activity 
} from "lucide-react";
import { APIProvider, Map as GoogleMap, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";

interface BrandProtectionViewProps {
  products?: any[];
  partners?: any[];
  scans?: any[];
}

interface TrademarkAsset {
  id: string;
  name: string;
  type: "Wordmark" | "Logo" | "Design Patent" | "Slogan";
  regNumber: string;
  status: "Registered" | "Pending" | "Under Review";
  filingDate: string;
}

interface DomainIncident {
  id: string;
  domain: string;
  detectedAt: string;
  score: number; // calculated threat score (e.g. 0 to 100)
  status: "Flagged" | "Takedown Sent" | "Resolved" | "Ignored";
  registrar: string;
  abuseContact: string;
  similarityType: "Typosquatting" | "Brand Jacking" | "Combosquatting";
}

interface InfringementListing {
  id: string;
  platform: string;
  title: string;
  url: string;
  sellerName: string;
  infringementType: "Authorized Asset Misuse" | "Counterfeit / Replica" | "Copyright Photo Stealing";
  flaggedDate: string;
  severity: "High" | "Medium" | "Low";
  status: "Active" | "Notice Sent" | "Offline";
}

// Map presets for regional focus panning/zooming
const MAP_PRESETS = {
  global: { lat: 25.0, lng: 10.0, zoom: 2 },
  na: { lat: 39.8283, lng: -98.5795, zoom: 4 },
  eu: { lat: 50.1109, lng: 8.6821, zoom: 4 },
  apac: { lat: 15.3193, lng: 114.1694, zoom: 4 },
  latam: { lat: -15.7832, lng: -55.4915, zoom: 3 }
};

// SVG viewBox projection bounds by region
const SVG_VIEWBOX_PRESETS = {
  global: "0 0 1000 500",
  na: "20 30 380 270",
  eu: "420 30 250 230",
  apac: "620 70 330 280",
  latam: "170 200 270 270"
};

// Coordinates for registrars and platforms to dynamically plot active state cases
const REGISTRAR_COORDINATES: Record<string, { lat: number, lng: number, region: "North America" | "Europe" | "APAC" | "LATAM" }> = {
  "NameCheap Inc": { lat: 27.9506, lng: -82.4572, region: "North America" }, // Tampa, FL
  "GoDaddy LLC": { lat: 33.4255, lng: -111.9400, region: "North America" }, // Tempe, AZ
  "Dynadot LLC": { lat: 37.5630, lng: -122.3255, region: "North America" }, // San Mateo, CA
  "REGRU LLC": { lat: 55.7558, lng: 37.6173, region: "Europe" }, // Moscow
  "Cloudflare Inc": { lat: 37.7749, lng: -122.4194, region: "North America" }, // San Francisco, CA
  "NameSilo LLC": { lat: 33.4484, lng: -112.0740, region: "North America" } // Phoenix, AZ
};

const PLATFORM_COORDINATES: Record<string, { lat: number, lng: number, region: "North America" | "Europe" | "APAC" | "LATAM" }> = {
  "eBay Store": { lat: 37.3382, lng: -121.8863, region: "North America" }, // San Jose, CA
  "AliExpress": { lat: 22.5431, lng: 114.0579, region: "APAC" }, // Shenzhen
  "Walmart Marketplace": { lat: 36.3729, lng: -94.2088, region: "North America" }, // Bentonville, AR
  "Weebly Rogue Shop": { lat: 37.7749, lng: -122.4194, region: "North America" }, // San Francisco, CA
  "Amazon Storefront": { lat: 47.6062, lng: -122.3321, region: "North America" }, // Seattle, WA
  "Amazon Storefront ": { lat: 47.6062, lng: -122.3321, region: "North America" }
};

// Equirectangular projection mapping lat (-90..90) & lng (-180..180) to 1000x500 SVG coordinates
function projectLatLngToSvg(lat: number, lng: number) {
  const x = ((lng + 180) / 360) * 1000;
  const y = ((90 - lat) / 180) * 500;
  return { x, y };
}

interface HeatmapPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  intensity: number; // 1 to 5 for rendering size & glow
  violationsCount: number;
  type: "domain" | "listing" | "map" | "map_breach";
  platformOrRegistrar: string;
  region: "North America" | "Europe" | "APAC" | "LATAM";
  topSellers: string[];
  avgDeficitPct?: number;
  avgDeficitAmount?: number;
  affectedSkus?: string[];
  severity?: "Critical" | "High" | "Medium" | "Low";
}

// Static historical violation cluster hotspots
const HEATMAP_POINTS: HeatmapPoint[] = [
  { id: "hp-1", name: "Phoenix Hub (NameCheap Registrar Scams)", lat: 33.4484, lng: -112.0740, intensity: 4, violationsCount: 14, type: "domain", platformOrRegistrar: "NameCheap Inc", region: "North America", topSellers: ["mapshielld.com", "mapssshield.net"], avgDeficitPct: 22.4, avgDeficitAmount: 45.0, severity: "High" },
  { id: "hp-2", name: "Tempe Hub (GoDaddy Registrar Scams)", lat: 33.4255, lng: -111.9400, intensity: 3, violationsCount: 9, type: "domain", platformOrRegistrar: "GoDaddy LLC", region: "North America", topSellers: ["mapshield-discounts.net"], avgDeficitPct: 15.0, avgDeficitAmount: 28.0, severity: "Medium" },
  { id: "hp-3", name: "San Jose (eBay Store Counterfeits)", lat: 37.3382, lng: -121.8863, intensity: 5, violationsCount: 22, type: "listing", platformOrRegistrar: "eBay Store", region: "North America", topSellers: ["GlobalExpressDeals", "RefurbWorldWide"], avgDeficitPct: 28.5, avgDeficitAmount: 62.0, severity: "Critical" },
  { id: "hp-4", name: "Seattle Hub (Amazon MAP Underpricing)", lat: 47.6062, lng: -122.3321, intensity: 4, violationsCount: 18, type: "map_breach", platformOrRegistrar: "Amazon Marketplace", region: "North America", topSellers: ["SuperDuppyKeyboards", "GizmoMart Online"], avgDeficitPct: 18.2, avgDeficitAmount: 38.5, severity: "High" },
  { id: "hp-5", name: "Moscow Copycats (REGRU Abuse)", lat: 55.7558, lng: 37.6173, intensity: 5, violationsCount: 25, type: "domain", platformOrRegistrar: "REGRU LLC", region: "Europe", topSellers: ["mapshield-support.ru", "apexpro-shop.ru"], avgDeficitPct: 32.0, avgDeficitAmount: 74.0, severity: "Critical" },
  { id: "hp-6", name: "London Retailers (Shopify Underpricing)", lat: 51.5074, lng: -0.1278, intensity: 3, violationsCount: 11, type: "map_breach", platformOrRegistrar: "Shopify Storefronts", region: "Europe", topSellers: ["EuroTechDirect", "ApexPROUK"], avgDeficitPct: 14.8, avgDeficitAmount: 26.0, severity: "Medium" },
  { id: "hp-7", name: "Frankfurt Nodes (Domain Spoofs)", lat: 50.1109, lng: 8.6821, region: "Europe", intensity: 2, violationsCount: 6, type: "domain", platformOrRegistrar: "DeutsDNS LLC", topSellers: ["mapshield-de.com"], avgDeficitPct: 12.0, avgDeficitAmount: 18.0, severity: "Low" },
  { id: "hp-8", name: "Shenzhen Manufacturing (AliExpress Replicas)", lat: 22.5431, lng: 114.0579, intensity: 5, violationsCount: 38, type: "listing", platformOrRegistrar: "AliExpress", region: "APAC", topSellers: ["Shenzhen Keyboard Tech", "ReplicaApexPRO", "SuperElectronicSellers"], avgDeficitPct: 35.4, avgDeficitAmount: 88.0, severity: "Critical" },
  { id: "hp-9", name: "Tokyo Distributors (Yahoo Auctions Overstock)", lat: 35.6762, lng: 139.6503, intensity: 3, violationsCount: 8, type: "map_breach", platformOrRegistrar: "Yahoo Japan", region: "APAC", topSellers: ["TokyoKeyboards", "GizmoTokyo"], avgDeficitPct: 16.2, avgDeficitAmount: 31.0, severity: "Medium" },
  { id: "hp-10", name: "Hong Kong Grey Market Routes", lat: 22.3193, lng: 114.1694, intensity: 4, violationsCount: 16, type: "listing", platformOrRegistrar: "Alibaba Direct", region: "APAC", topSellers: ["HKDistributors", "ApexAsiaSolutions"], avgDeficitPct: 24.0, avgDeficitAmount: 52.0, severity: "High" },
  { id: "hp-11", name: "Sao Paulo Overstock (MercadoLibre Sales)", lat: -23.5505, lng: -46.6333, intensity: 4, violationsCount: 15, type: "map_breach", platformOrRegistrar: "MercadoLibre", region: "LATAM", topSellers: ["SampaElectronics", "ApexBrasilStore"], avgDeficitPct: 21.8, avgDeficitAmount: 42.0, severity: "High" },
  { id: "hp-12", name: "Mexico City Hub (Weebly Retailers)", lat: 19.4326, lng: -99.1332, intensity: 3, violationsCount: 7, type: "domain", platformOrRegistrar: "Weebly Rogue Shop", region: "LATAM", topSellers: ["apexpro-outlet.weebly.com"], avgDeficitPct: 17.5, avgDeficitAmount: 34.0, severity: "Medium" }
];

// MapController helper to pan and zoom map
function MapController({ 
  center, 
  zoom 
}: { 
  center: { lat: number, lng: number }, 
  zoom: number 
}) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.panTo(center);
      map.setZoom(zoom);
    }
  }, [map, center, zoom]);
  return null;
}

export default function BrandProtectionView({
  products = [],
  partners = [],
  scans = []
}: BrandProtectionViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"domains" | "trademarks" | "infringements" | "legal">("domains");
  
  // 1. Trademarks State Array
  const [trademarks, setTrademarks] = useState<TrademarkAsset[]>([
    { id: "tm-1", name: "MAPShield", type: "Wordmark", regNumber: "US-749210-A", status: "Registered", filingDate: "2024-04-12" },
    { id: "tm-2", name: "Monitoring Systems Logo", type: "Logo", regNumber: "US-881920-E", status: "Registered", filingDate: "2024-08-19" },
    { id: "tm-3", name: "Apex Pro Shield Design", type: "Design Patent", regNumber: "US-PAT-9912", status: "Registered", filingDate: "2025-01-30" },
    { id: "tm-4", name: "Compliance Core Radar", type: "Slogan", regNumber: "US-PEND-331", status: "Pending", filingDate: "2026-02-15" }
  ]);

  // Trademark Form State
  const [showAddTmModal, setShowAddTmModal] = useState(false);
  const [newTmName, setNewTmName] = useState("");
  const [newTmType, setNewTmType] = useState<"Wordmark" | "Logo" | "Design Patent" | "Slogan">("Wordmark");
  const [newTmReg, setNewTmReg] = useState("");
  const [newTmStatus, setNewTmStatus] = useState<"Registered" | "Pending" | "Under Review">("Registered");

  // 2. Domain Squatting Incidents
  const [domains, setDomains] = useState<DomainIncident[]>([
    { id: "dom-1", domain: "mapshielld.com", detectedAt: "2026-06-12T10:14:00Z", score: 88, status: "Flagged", registrar: "NameCheap Inc", abuseContact: "abuse@namecheap.com", similarityType: "Typosquatting" },
    { id: "dom-2", domain: "mapshield-discounts.net", detectedAt: "2026-06-14T08:21:00Z", score: 95, status: "Takedown Sent", registrar: "GoDaddy LLC", abuseContact: "abuse@godaddy.com", similarityType: "Brand Jacking" },
    { id: "dom-3", domain: "mapshieldlabs.org", detectedAt: "2026-06-11T12:05:00Z", score: 72, status: "Resolved", registrar: "Dynadot LLC", abuseContact: "abuse@dynadot.com", similarityType: "Combosquatting" },
    { id: "dom-4", domain: "mapshield-support.ru", detectedAt: "2026-06-14T22:30:00Z", score: 99, status: "Flagged", registrar: "REGRU LLC", abuseContact: "abuse@reg.ru", similarityType: "Brand Jacking" },
    { id: "dom-5", domain: "m-apshield.com", detectedAt: "2026-06-13T16:45:00Z", score: 65, status: "Ignored", registrar: "Cloudflare Inc", abuseContact: "abuse@cloudflare.com", similarityType: "Typosquatting" }
  ]);

  const [domainSearchQuery, setDomainSearchQuery] = useState("");
  const [isScanningDomains, setIsScanningDomains] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<DomainIncident | null>(null);

  // 3. Counterfeit Listings State
  const [listings, setListings] = useState<InfringementListing[]>([
    { id: "list-1", platform: "eBay Store", title: "Original APEX Pro Keyboard 99% New", url: "https://www.ebay.com/itm/192019210", sellerName: "GlobalExpressDeals", infringementType: "Copyright Photo Stealing", flaggedDate: "2026-06-13T14:00:00Z", severity: "Medium", status: "Active" },
    { id: "list-2", platform: "AliExpress", title: "Apex Shield Pro Mechanical Switches Replica", url: "https://www.aliexpress.com/item/10050012", sellerName: "Shenzhen Keyboard Tech", infringementType: "Counterfeit / Replica", flaggedDate: "2026-06-14T02:11:00Z", severity: "High", status: "Active" },
    { id: "list-3", platform: "Walmart Marketplace", title: "Soundwave Headsets ANC - refurbished factory", url: "https://www.walmart.com/ip/881290", sellerName: "RefurbWorldWide", infringementType: "Authorized Asset Misuse", flaggedDate: "2026-06-11T09:12:00Z", severity: "Low", status: "Offline" },
    { id: "list-4", platform: "Weebly Rogue Shop", title: "Official APEX Pro Premium Keyboards Storefront", url: "https://apexpro-outlet.weebly.com", sellerName: "ApexProOutletAdmin", infringementType: "Authorized Asset Misuse", flaggedDate: "2026-06-14T11:55:00Z", severity: "High", status: "Notice Sent" }
  ]);

  const [listingSearchQuery, setListingSearchQuery] = useState("");
  const [isCrawlingListings, setIsCrawlingListings] = useState(false);

  // 4. Legalese Form Generator states
  const [legalTargetType, setLegalTargetType] = useState<"domain" | "listing">("domain");
  const [legalRecipientName, setLegalRecipientName] = useState("NameCheap Registrar Dispute Counsel");
  const [legalRecipientEmail, setLegalRecipientEmail] = useState("abuse@namecheap.com");
  const [legalInfractionSource, setLegalInfractionSource] = useState("mapshielld.com");
  const [legalBrandTrademark, setLegalBrandTrademark] = useState("MAPShield (US-749210-A)");
  const [generatedDraft, setGeneratedDraft] = useState("");
  const [copiedDraft, setCopiedDraft] = useState(false);

  // Trigger feedback/toast helpers
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Map control states
  const [mapTypeFilter, setMapTypeFilter] = useState<"all" | "map_breach" | "domain" | "listing">("all");
  const [mapRegionFocus, setMapRegionFocus] = useState<"global" | "na" | "eu" | "apac" | "latam">("global");
  const [heatmapLayerMode, setHeatmapLayerMode] = useState<"density" | "pins" | "choropleth">("density");
  const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "high">("all");
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number, lng: number }>(MAP_PRESETS.global);
  const [mapZoom, setMapZoom] = useState<number>(MAP_PRESETS.global.zoom);

  // Pan and zoom when focus region changes
  useEffect(() => {
    const target = MAP_PRESETS[mapRegionFocus];
    if (target) {
      setMapCenter({ lat: target.lat, lng: target.lng });
      setMapZoom(target.zoom);
    }
  }, [mapRegionFocus]);

  // Dynamic map points calculated from domains, listings, and scan MAP breaches
  const dynamicMapPoints = useMemo(() => {
    const points: HeatmapPoint[] = [];

    // Map scan job violations if scans are provided
    if (scans && scans.length > 0) {
      scans.forEach((scanJob: any) => {
        if (scanJob.items && Array.isArray(scanJob.items)) {
          scanJob.items.forEach((item: any, idx: number) => {
            const itemMapPrice = item.mapPrice || scanJob.mapPrice || 100;
            if (item.status === "violating" || (item.detectedPrice && item.detectedPrice < itemMapPrice)) {
              const partner = partners.find((p: any) => p.id === item.partnerId) || { name: item.partnerName || "Partner", region: "North America" };
              const prod = products.find((p: any) => p.id === item.productId) || { name: "Product", mapPrice: itemMapPrice };
              
              // Assign lat/lng coordinates based on platform or region
              const regionName: "North America" | "Europe" | "APAC" | "LATAM" = partner.region || "North America";
              let baseCoord = { lat: 39.8283, lng: -98.5795 };
              if (regionName === "Europe") baseCoord = { lat: 50.1109, lng: 8.6821 };
              else if (regionName === "APAC") baseCoord = { lat: 22.5431, lng: 114.0579 };
              else if (regionName === "LATAM") baseCoord = { lat: -15.7832, lng: -55.4915 };

              const offset = (idx % 7) * 0.22 - 0.5;
              const mapPrice = item.mapPrice || scanJob.mapPrice || prod?.mapPrice || 100;
              const detected = item.detectedPrice || (mapPrice * 0.85);
              const deficit = Math.max(0, mapPrice - detected);
              const deficitPct = Math.round((deficit / mapPrice) * 100);

              points.push({
                id: `scan-breach-${scanJob.id}-${idx}`,
                name: `MAP Underpricing: ${prod.name || 'SKU'} by ${partner.name || 'Reseller'}`,
                lat: baseCoord.lat + offset,
                lng: baseCoord.lng + offset,
                intensity: deficitPct > 20 ? 5 : deficitPct > 10 ? 3 : 2,
                violationsCount: 1,
                type: "map_breach",
                platformOrRegistrar: partner.name || "Reseller Storefront",
                region: regionName,
                topSellers: [partner.name || "Rogue Merchant"],
                avgDeficitPct: deficitPct,
                avgDeficitAmount: Math.round(deficit * 100) / 100,
                affectedSkus: [prod.name || "SKU Item"],
                severity: deficitPct > 20 ? "Critical" : deficitPct > 10 ? "High" : "Medium"
              });
            }
          });
        }
      });
    }

    // Map domains
    domains.forEach((dom) => {
      const coord = REGISTRAR_COORDINATES[dom.registrar];
      if (coord) {
        const offset = (dom.domain.length % 5) * 0.15 - 0.3;
        points.push({
          id: dom.id,
          name: `${dom.domain} (Registrant Hub)`,
          lat: coord.lat + offset,
          lng: coord.lng + offset,
          intensity: dom.score >= 85 ? 4 : 2,
          violationsCount: 1,
          type: "domain",
          platformOrRegistrar: dom.registrar,
          region: coord.region,
          topSellers: [dom.domain],
          avgDeficitPct: dom.score >= 85 ? 25.0 : 15.0,
          avgDeficitAmount: dom.score >= 85 ? 50.0 : 30.0,
          severity: dom.score >= 85 ? "Critical" : "High"
        });
      }
    });

    // Map listings
    listings.forEach((list) => {
      const coord = PLATFORM_COORDINATES[list.platform];
      if (coord) {
        const offset = (list.sellerName.length % 5) * 0.15 - 0.3;
        points.push({
          id: list.id,
          name: `${list.title} by ${list.sellerName}`,
          lat: coord.lat + offset,
          lng: coord.lng + offset,
          intensity: list.severity === "High" ? 5 : list.severity === "Medium" ? 3 : 1,
          violationsCount: 1,
          type: "listing",
          platformOrRegistrar: list.platform,
          region: coord.region,
          topSellers: [list.sellerName],
          avgDeficitPct: list.severity === "High" ? 28.0 : 14.0,
          avgDeficitAmount: list.severity === "High" ? 60.0 : 25.0,
          severity: list.severity === "High" ? "Critical" : list.severity === "Medium" ? "High" : "Medium"
        });
      }
    });

    return points;
  }, [domains, listings, scans, products, partners]);

  // Combine static clusters and dynamic active infractions
  const combinedHeatPoints = useMemo(() => {
    const mappedDynamic = dynamicMapPoints.map(p => ({
      ...p,
      type: p.type as "domain" | "listing" | "map"
    }));
    return [...HEATMAP_POINTS, ...mappedDynamic];
  }, [dynamicMapPoints]);

  const selectedPoint = useMemo(() => {
    if (!selectedPointId) return null;
    return combinedHeatPoints.find(p => p.id === selectedPointId) || null;
  }, [selectedPointId, combinedHeatPoints]);

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 4500);
  };

  const handleRunDomainScan = () => {
    setIsScanningDomains(true);
    setTimeout(() => {
      // Add a simulated incident
      const newDomain = {
        id: "dom-" + Date.now(),
        domain: "mapssshield.net",
        detectedAt: new Date().toISOString(),
        score: Math.floor(Math.random() * 30) + 70,
        status: "Flagged" as const,
        registrar: "NameSilo LLC",
        abuseContact: "abuse@namesilo.com",
        similarityType: "Typosquatting" as const
      };
      setDomains(prev => [newDomain, ...prev]);
      setIsScanningDomains(false);
      showToast("Domain Squatting Radar search completed. Found 1 high-probability misspelling target.");
    }, 2500);
  };

  const handleRunListingCrawl = () => {
    setIsCrawlingListings(true);
    setTimeout(() => {
      // Add a simulated listing infringement
      const newListing = {
        id: "list-" + Date.now(),
        platform: "Amazon Storefront",
        title: "Brand New Premium APEX mechanical keyboard custom high mechanical switches",
        url: "https://www.amazon.com/dp/B00FAKE99",
        sellerName: "SuperDuppyKeyboards",
        infringementType: "Copyright Photo Stealing" as const,
        flaggedDate: new Date().toISOString(),
        severity: "High" as const,
        status: "Active" as const
      };
      setListings(prev => [newListing, ...prev]);
      setIsCrawlingListings(false);
      showToast("Rogue third-party e-commerce listing crawler finished. Flagged 1 copyright photo abuse.");
    }, 2500);
  };

  const handleUpdateDomainStatus = (id: string, nextStatus: DomainIncident["status"]) => {
    setDomains(prev => prev.map(d => d.id === id ? { ...d, status: nextStatus } : d));
    showToast(`Domain record status updated to [${nextStatus}] successfully.`);
  };

  const handleUpdateListingStatus = (id: string, nextStatus: InfringementListing["status"]) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: nextStatus } : l));
    showToast(`Listing infringement record status changed to [${nextStatus}].`);
  };

  const handleAddTrademark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTmName || !newTmReg) return;
    const newTm: TrademarkAsset = {
      id: "tm-" + Date.now(),
      name: newTmName,
      type: newTmType,
      regNumber: newTmReg,
      status: newTmStatus,
      filingDate: new Date().toISOString().split("T")[0]
    };
    setTrademarks(prev => [...prev, newTm]);
    setShowAddTmModal(false);
    setNewTmName("");
     setNewTmReg("");
    showToast(`Asset "${newTmName}" registered in the brand protection shield index.`);
  };

  const handleDeleteTrademark = (id: string) => {
    const asset = trademarks.find(t => t.id === id);
    setTrademarks(prev => prev.filter(t => t.id !== id));
    showToast(`Asset "${asset?.name}" removed from tracking registry.`);
  };

  const handleGenerateNoticeDraft = () => {
    const dateFormatted = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    const standardDraft = `FORMAL CEASE AND DESIST NOTICE: TRADEMARK INFRINGEMENT

Date: ${dateFormatted}
Attention: Legal Counsel & Abuse Team
Entity In Breach: ${legalRecipientName} (${legalRecipientEmail})
Flagged Asset / Threat Location: ${legalInfractionSource}

RE: Unauthorized abuse of trademark "${legalBrandTrademark}" under active protection.

To Whom It May Concern,

This letter constitutes formal notification that your current registration, hosting, or hosting operations in connection with the asset "${legalInfractionSource}" are in direct violation of our registered trademark, intellectual property, and copyright assets.

Our firm owns the proprietary intellectual property and active marketing trademarks for:
- Trademark: ${legalBrandTrademark}
- Protected Classifications: Intellectual Property, Brand Integrity, and Retail Protective Software structures.

Our automated active crawler scans have flagged this activity as unauthorized, designed to mislead purchasing consumers, or directly steal branded assets (including premium product photography, designs, layout, or wordmarks), causing severe brand de-evaluation.

REQUIRED ACTION REQUIRED WITHIN 48 HOURS:
1. De-register, take down, or safely remove the infringing content at ${legalInfractionSource}.
2. Terminate the sale of replica or counterfeit goods under our proprietary brand names.
3. Affirm in writing that you have ceased and desisted from any future unauthorized usage.

Failure to remedy these devaluing infractions within forty-eight (45) hours of receiving this legal advisory will leave us with no corporate alternative but to escalate this matter to formal legal enforcement channels (including registrars, host legal departments, and international commercial arbitration forums).

Sincerely,
Brand Protection & Anti-Counterfeit Council
MAPShield Systems Corp.
legal@mapshield.io
`;
    setGeneratedDraft(standardDraft);
    setCopiedDraft(false);
  };

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(generatedDraft);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  // Filter listings
  const filteredIncidents = domains.filter(d => {
    const q = domainSearchQuery.toLowerCase();
    return d.domain.toLowerCase().includes(q) || d.registrar.toLowerCase().includes(q) || d.similarityType.toLowerCase().includes(q);
  });

  const filteredListings = listings.filter(l => {
    const q = listingSearchQuery.toLowerCase();
    return l.title.toLowerCase().includes(q) || l.platform.toLowerCase().includes(q) || l.sellerName.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6" id="brand-protection-radar-module">
      {/* Toast Notice */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-[200] max-w-sm bg-slate-900 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl shadow-2xl flex items-start gap-2.5 animate-bounce font-sans">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-slate-100 font-mono text-emerald-400">BRAND SECURED</h4>
            <p className="text-[11px] text-slate-350 leading-relaxed mt-1 font-sans">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Fingerprint className="w-32 h-32 text-indigo-400" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold tracking-widest uppercase rounded-full font-mono">Brand Integrity Lab</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">Brand Protection & IP Radar</h1>
            <p className="text-xs text-slate-400 max-w-2xl font-sans">
              Proactively safeguard your brand assets from counterfeiters, grey market distribution leaks, trademark hijackers, and domain squatting spoof pages.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleRunDomainScan}
              disabled={isScanningDomains}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-505 disabled:bg-indigo-805 disabled:opacity-50 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition duration-150 shadow-lg cursor-pointer max-w-xs justify-center"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanningDomains ? "animate-spin" : ""}`} />
              {isScanningDomains ? "Scanning Typos..." : "Scan Domain Typos"}
            </button>
            <button
              onClick={handleRunListingCrawl}
              disabled={isCrawlingListings}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition duration-150 border border-slate-700 cursor-pointer max-w-xs justify-center"
            >
              <Gavel className={`w-3.5 h-3.5 ${isCrawlingListings ? "animate-spin" : ""}`} />
              Crawl Rogue Stores
            </button>
          </div>
        </div>

        {/* Horizontal sub tabs switcher */}
        <div className="flex border-b border-slate-800/85 mt-6 gap-6 font-mono text-[11px] uppercase tracking-wider overflow-x-auto">
          <button
            onClick={() => setActiveSubTab("domains")}
            className={`pb-3 font-semibold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeSubTab === "domains" ? "border-indigo-400 text-indigo-400" : "border-transparent text-slate-450 hover:text-slate-300"
            }`}
          >
            <Globe className="w-4 h-4" />
            Typosquatter Radar ({domains.length})
          </button>
          <button
            onClick={() => setActiveSubTab("infringements")}
            className={`pb-3 font-semibold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeSubTab === "infringements" ? "border-indigo-400 text-indigo-400" : "border-transparent text-slate-450 hover:text-slate-300"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Rogue Listings ({listings.length})
          </button>
          <button
            onClick={() => setActiveSubTab("trademarks")}
            className={`pb-3 font-semibold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeSubTab === "trademarks" ? "border-indigo-400 text-indigo-400" : "border-transparent text-slate-450 hover:text-slate-300"
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            Trademark Registry ({trademarks.length})
          </button>
          <button
            onClick={() => setActiveSubTab("legal")}
            className={`pb-3 font-semibold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeSubTab === "legal" ? "border-indigo-400 text-indigo-400" : "border-transparent text-slate-450 hover:text-slate-300"
            }`}
          >
            <FileText className="w-4 h-4" />
            Cease & Desist Drafter
          </button>
        </div>
      </div>

      {/* Geographical Infraction Heatmap Radar Section */}
      {(() => {
        const API_KEY =
          process.env.GOOGLE_MAPS_PLATFORM_KEY ||
          (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
          (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
          "";
        const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

        // Filter map points according to selected filters
        const activeMapPoints = combinedHeatPoints.filter((pt) => {
          if (mapTypeFilter !== "all" && pt.type !== mapTypeFilter) return false;
          if (severityFilter === "critical" && pt.severity !== "Critical") return false;
          if (severityFilter === "high" && (pt.severity !== "Critical" && pt.severity !== "High")) return false;
          if (mapRegionFocus !== "global") {
            if (mapRegionFocus === "na" && pt.region !== "North America") return false;
            if (mapRegionFocus === "eu" && pt.region !== "Europe") return false;
            if (mapRegionFocus === "apac" && pt.region !== "APAC") return false;
            if (mapRegionFocus === "latam" && pt.region !== "LATAM") return false;
          }
          return true;
        });

        // Compute live regional statistics
        const regionalStats = {
          na: combinedHeatPoints.filter(p => p.region === "North America"),
          eu: combinedHeatPoints.filter(p => p.region === "Europe"),
          apac: combinedHeatPoints.filter(p => p.region === "APAC"),
          latam: combinedHeatPoints.filter(p => p.region === "LATAM")
        };

        const totalIncidents = combinedHeatPoints.reduce((acc, p) => acc + p.violationsCount, 0);
        const totalDeficitValue = combinedHeatPoints.reduce((acc, p) => acc + (p.avgDeficitAmount || 0), 0);
        const avgGlobalDeficitPct = Math.round(
          combinedHeatPoints.reduce((acc, p) => acc + (p.avgDeficitPct || 15), 0) / (combinedHeatPoints.length || 1)
        );

        return (
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800/85 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden mb-6" id="geo-heatmap-radar-container">
            
            {/* Card Header with Live Status & Controls */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
                  <Flame className="w-5 h-5 text-rose-400 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base tracking-tight font-display">Geographical MAP Violation Density Heatmap</h3>
                    <span className="px-2 py-0.5 bg-rose-500/15 text-rose-400 border border-rose-500/25 text-[9px] font-mono font-bold rounded-full uppercase tracking-wider animate-pulse">
                      Live Density Grid
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Visualizing regional concentration of MAP underpricing, rogue e-commerce listings, and typosquatting clusters.
                  </p>
                </div>
              </div>

              {/* Quick Filter Controls Bar */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full lg:w-auto">
                {/* Heatmap Layer View Mode */}
                <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[10px] font-mono font-bold">
                  <button
                    type="button"
                    onClick={() => setHeatmapLayerMode("density")}
                    className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
                      heatmapLayerMode === "density" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "text-slate-400 hover:text-slate-200"
                    }`}
                    title="Gaussian Density Heatmap Gradient"
                  >
                    <Flame className="w-3 h-3" />
                    Heat Gradient
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeatmapLayerMode("pins")}
                    className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
                      heatmapLayerMode === "pins" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "text-slate-400 hover:text-slate-200"
                    }`}
                    title="Interactive Incident Node Pins"
                  >
                    <MapPin className="w-3 h-3" />
                    Pins
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeatmapLayerMode("choropleth")}
                    className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
                      heatmapLayerMode === "choropleth" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-slate-400 hover:text-slate-200"
                    }`}
                    title="Regional Density Zones"
                  >
                    <Layers className="w-3 h-3" />
                    Choropleth
                  </button>
                </div>

                {/* Threat Category Filter */}
                <select
                  value={mapTypeFilter}
                  onChange={(e: any) => {
                    setMapTypeFilter(e.target.value);
                    setSelectedPointId(null);
                  }}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-[10px] font-mono font-bold rounded-lg px-2.5 py-1.5 outline-none transition cursor-pointer"
                  id="map-type-filter"
                >
                  <option value="all">🌐 All Incidents ({combinedHeatPoints.length})</option>
                  <option value="map_breach">📉 MAP Breaches</option>
                  <option value="domain">🔒 Typo Domains</option>
                  <option value="listing">🛍️ Rogue Listings</option>
                </select>

                {/* Region Focus Switcher */}
                <select
                  value={mapRegionFocus}
                  onChange={(e: any) => {
                    setMapRegionFocus(e.target.value);
                    setSelectedPointId(null);
                  }}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-[10px] font-mono font-bold rounded-lg px-2.5 py-1.5 outline-none transition cursor-pointer"
                  id="map-region-focus"
                >
                  <option value="global">🌍 Global View</option>
                  <option value="na">🇺🇸 North America</option>
                  <option value="eu">🇪🇺 Europe</option>
                  <option value="apac">🇨🇳 APAC</option>
                  <option value="latam">🇧🇷 LATAM</option>
                </select>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-850/80 text-[11px]">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Total MAP Breaches</span>
                <strong className="text-white text-sm font-bold font-mono flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  {totalIncidents} Incidents
                </strong>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Avg Underpricing Deficit</span>
                <strong className="text-amber-400 text-sm font-bold font-mono">
                  -{avgGlobalDeficitPct}% Below MAP
                </strong>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Estimated Capital Deficit</span>
                <strong className="text-rose-400 text-sm font-bold font-mono">
                  ${totalDeficitValue.toLocaleString()} / mo
                </strong>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Top Hotspot Hub</span>
                <strong className="text-indigo-400 text-sm font-bold font-mono truncate block">
                  Shenzhen APAC & NA West
                </strong>
              </div>
            </div>

            {/* Map Canvas and Side Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              
              {/* Selected Node Profile & Inspector Panel */}
              <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl flex flex-col justify-between gap-4 min-h-[320px] lg:h-[420px]">
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-indigo-400" />
                      Geographical Node Inspector
                    </span>
                    {selectedPoint && (
                      <button
                        type="button"
                        onClick={() => setSelectedPointId(null)}
                        className="text-[10px] text-slate-500 hover:text-slate-300 font-mono underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {selectedPoint ? (
                    <div className="space-y-3 text-xs leading-normal" id="heatmap-node-details">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="text-slate-100 font-bold text-xs font-display leading-tight">{selectedPoint.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold tracking-wider shrink-0 ${
                            selectedPoint.type === "map_breach" ? "bg-rose-500/15 text-rose-400 border border-rose-500/30" :
                            selectedPoint.type === "domain" ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30" :
                            "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          }`}>
                            {selectedPoint.type.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">Region: <strong className="text-slate-200">{selectedPoint.region}</strong></p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-2.5 border border-slate-850 rounded-lg text-[10px] font-mono">
                        <div>
                          <span className="text-slate-500 block uppercase">Incidents Count</span>
                          <strong className="text-white text-xs">{selectedPoint.violationsCount} Breaches</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase">MAP Deficit</span>
                          <strong className="text-rose-400 text-xs">-{selectedPoint.avgDeficitPct || 18}% (${selectedPoint.avgDeficitAmount || 35})</strong>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-[11px] text-slate-300 bg-slate-900/40 p-2 rounded-lg border border-slate-850/60 font-sans">
                        <p className="line-clamp-1"><span className="text-slate-500 font-mono">Channel Host:</span> <strong className="text-slate-200">{selectedPoint.platformOrRegistrar}</strong></p>
                        <p className="line-clamp-2"><span className="text-slate-500 font-mono">Primary Sellers:</span> <strong className="text-slate-200">{selectedPoint.topSellers.join(", ")}</strong></p>
                        {selectedPoint.affectedSkus && selectedPoint.affectedSkus.length > 0 && (
                          <p className="line-clamp-1"><span className="text-slate-500 font-mono">Affected SKU:</span> <strong className="text-slate-200">{selectedPoint.affectedSkus.join(", ")}</strong></p>
                        )}
                      </div>

                      {/* Immediate Legal Enforcement Action Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setLegalRecipientName(`${selectedPoint.platformOrRegistrar} Legal Ops`);
                          setLegalRecipientEmail(`legal@${selectedPoint.platformOrRegistrar.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`);
                          setLegalInfractionSource(selectedPoint.topSellers[0] || selectedPoint.name);
                          setActiveSubTab("legal");
                          handleGenerateNoticeDraft();
                          showToast(`Loaded ${selectedPoint.name} details directly into Cease & Desist generator.`);
                        }}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-550 text-white rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer mt-2"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        Draft Cease & Desist Notice
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-[11px] text-slate-400 italic font-sans leading-relaxed">
                        Hover or click any regional density hotspot or pulsing radar pin on the map to inspect location data, seller handles, underpricing deficit, and trigger 1-click enforcement notices.
                      </p>
                      
                      {/* Live Density Breakdown */}
                      <div className="space-y-2 border-t border-slate-850 pt-3">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Hotspot Density Index</span>
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded border border-slate-850">
                            <span className="flex items-center gap-2 text-slate-300 font-sans">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                              Critical Density (&gt;25 cases)
                            </span>
                            <span className="font-mono text-rose-400 font-bold">4 Nodes</span>
                          </div>
                          <div className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded border border-slate-850">
                            <span className="flex items-center gap-2 text-slate-300 font-sans">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                              High Density (10-24 cases)
                            </span>
                            <span className="font-mono text-amber-400 font-bold">5 Nodes</span>
                          </div>
                          <div className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded border border-slate-850">
                            <span className="flex items-center gap-2 text-slate-300 font-sans">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                              Moderate Density (1-9 cases)
                            </span>
                            <span className="font-mono text-emerald-400 font-bold">6 Nodes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom summary */}
                <div className="text-[9.5px] text-slate-400 font-mono leading-relaxed bg-slate-900/50 p-2.5 rounded-lg border border-slate-850">
                  ⚡ <strong>Map Coverage:</strong> {activeMapPoints.length} active incidents plotted across {mapRegionFocus.toUpperCase()} regional projection layers.
                </div>

              </div>

              {/* Geographical Map Display Canvas */}
              <div className="lg:col-span-3 bg-slate-950 rounded-xl overflow-hidden border border-slate-850 h-[360px] lg:h-[420px] relative select-none">
                
                {/* Custom Interactive SVG Geographical Heatmap Map Component */}
                <div className="w-full h-full relative bg-slate-950 flex items-center justify-center">
                  
                  <svg
                    viewBox={SVG_VIEWBOX_PRESETS[mapRegionFocus]}
                    className="w-full h-full object-cover transition-all duration-500"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <defs>
                      {/* Gaussian Blur filter for the smooth density heatmap aura */}
                      <filter id="map-heat-blur" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="12" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                      <filter id="map-glow-light" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="5" />
                      </filter>

                      {/* Radial Gradients for Heat Auras */}
                      <radialGradient id="heat-critical" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
                        <stop offset="40%" stopColor="#f97316" stopOpacity="0.55" />
                        <stop offset="80%" stopColor="#eab308" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                      </radialGradient>
                      <radialGradient id="heat-high" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#f97316" stopOpacity="0.75" />
                        <stop offset="50%" stopColor="#eab308" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                      </radialGradient>
                      <radialGradient id="heat-medium" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#eab308" stopOpacity="0.65" />
                        <stop offset="60%" stopColor="#10b981" stopOpacity="0.30" />
                        <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    {/* Dark Grid Background */}
                    <rect width="1000" height="500" fill="#030712" />

                    {/* Latitude / Longitude Dotted Grid Lines */}
                    <g stroke="#1e293b" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.6">
                      {/* Longitude lines */}
                      <line x1="100" y1="0" x2="100" y2="500" />
                      <line x1="250" y1="0" x2="250" y2="500" />
                      <line x1="400" y1="0" x2="400" y2="500" />
                      <line x1="550" y1="0" x2="550" y2="500" />
                      <line x1="700" y1="0" x2="700" y2="500" />
                      <line x1="850" y1="0" x2="850" y2="500" />
                      {/* Latitude lines */}
                      <line x1="0" y1="100" x2="1000" y2="100" />
                      <line x1="0" y1="200" x2="1000" y2="200" />
                      <line x1="0" y1="300" x2="1000" y2="300" />
                      <line x1="0" y1="400" x2="1000" y2="400" />
                      {/* Equator */}
                      <line x1="0" y1="250" x2="1000" y2="250" stroke="#334155" strokeWidth="1" strokeDasharray="none" />
                    </g>

                    {/* Stylized World Continent Outlines */}
                    <g fill="#111827" stroke="#1f2937" strokeWidth="1.2">
                      {/* North America */}
                      <path d="M 80 80 Q 150 40 260 70 T 340 180 Q 280 220 200 220 T 80 140 Z" fill={mapRegionFocus === 'na' ? '#1e1b4b' : '#111827'} stroke={mapRegionFocus === 'na' ? '#6366f1' : '#1f2937'} />
                      {/* South America */}
                      <path d="M 220 230 Q 300 230 310 320 T 250 430 Q 200 370 210 270 Z" fill={mapRegionFocus === 'latam' ? '#1e1b4b' : '#111827'} stroke={mapRegionFocus === 'latam' ? '#6366f1' : '#1f2937'} />
                      {/* Europe */}
                      <path d="M 430 80 Q 520 60 580 90 T 560 160 Q 480 180 430 130 Z" fill={mapRegionFocus === 'eu' ? '#1e1b4b' : '#111827'} stroke={mapRegionFocus === 'eu' ? '#6366f1' : '#1f2937'} />
                      {/* Africa */}
                      <path d="M 430 170 Q 530 160 570 230 T 510 370 Q 430 320 420 220 Z" />
                      {/* Asia */}
                      <path d="M 570 70 Q 750 40 920 100 T 880 250 Q 720 280 580 180 Z" fill={mapRegionFocus === 'apac' ? '#1e1b4b' : '#111827'} stroke={mapRegionFocus === 'apac' ? '#6366f1' : '#1f2937'} />
                      {/* Australia / Oceania */}
                      <path d="M 780 290 Q 890 280 910 370 T 800 420 Q 760 360 780 290 Z" fill={mapRegionFocus === 'apac' ? '#1e1b4b' : '#111827'} stroke={mapRegionFocus === 'apac' ? '#6366f1' : '#1f2937'} />
                    </g>

                    {/* Regional Choropleth Density Fill Layer */}
                    {heatmapLayerMode === "choropleth" && (
                      <g opacity="0.35">
                        <rect x="30" y="40" width="350" height="200" rx="20" fill="#ef4444" opacity="0.2" />
                        <text x="50" y="65" fill="#f87171" fontSize="10" fontFamily="monospace" fontWeight="bold">NORTH AMERICA: HIGH DENSITY (42 Breach Cases)</text>
                        
                        <rect x="420" y="40" width="180" height="150" rx="20" fill="#f97316" opacity="0.2" />
                        <text x="430" y="65" fill="#fb923c" fontSize="10" fontFamily="monospace" fontWeight="bold">EUROPE: 28 Cases</text>
                        
                        <rect x="620" y="60" width="300" height="220" rx="20" fill="#ef4444" opacity="0.25" />
                        <text x="635" y="85" fill="#f87171" fontSize="10" fontFamily="monospace" fontWeight="bold">APAC: CRITICAL HOTSPOT (62 Cases)</text>

                        <rect x="180" y="240" width="180" height="200" rx="20" fill="#eab308" opacity="0.15" />
                        <text x="195" y="265" fill="#facc15" fontSize="10" fontFamily="monospace" fontWeight="bold">LATAM: 18 Cases</text>
                      </g>
                    )}

                    {/* Gaussian Blur Density Heatmap Gradient Layer */}
                    {(heatmapLayerMode === "density" || heatmapLayerMode === "choropleth") && (
                      <g filter="url(#map-heat-blur)">
                        {activeMapPoints.map((pt) => {
                          const { x, y } = projectLatLngToSvg(pt.lat, pt.lng);
                          const radius = Math.max(18, pt.intensity * 11);
                          const gradId = pt.intensity >= 5 ? "url(#heat-critical)" : pt.intensity >= 3 ? "url(#heat-high)" : "url(#heat-medium)";

                          return (
                            <circle
                              key={`heat-blur-${pt.id}`}
                              cx={x}
                              cy={y}
                              r={radius}
                              fill={gradId}
                              opacity={selectedPointId === pt.id ? 0.95 : 0.75}
                            />
                          );
                        })}
                      </g>
                    )}

                    {/* Interactive Incident Pins & Pulsing Radar Rings */}
                    <g>
                      {activeMapPoints.map((pt) => {
                        const { x, y } = projectLatLngToSvg(pt.lat, pt.lng);
                        const isSelected = selectedPointId === pt.id;
                        const isCritical = pt.intensity >= 5;
                        const isHigh = pt.intensity >= 3;

                        const coreFill = isCritical ? "#ef4444" : isHigh ? "#f97316" : "#facc15";
                        const strokeColor = isSelected ? "#38bdf8" : "#030712";

                        return (
                          <g
                            key={`node-pin-${pt.id}`}
                            transform={`translate(${x}, ${y})`}
                            onClick={() => setSelectedPointId(pt.id)}
                            className="cursor-pointer group"
                          >
                            {/* Outer pulsing radar ring */}
                            <circle
                              r={isSelected ? 16 : isCritical ? 12 : 9}
                              fill="none"
                              stroke={coreFill}
                              strokeWidth={isSelected ? "2" : "1.5"}
                              opacity="0.6"
                            >
                              <animate attributeName="r" values={`${isSelected ? 12 : 8};${isSelected ? 22 : 16}`} dur="2s" repeatCount="indefinite" />
                              <animate attributeName="opacity" values="0.8;0" dur="2s" repeatCount="indefinite" />
                            </circle>

                            {/* Node Core Circle */}
                            <circle
                              r={isSelected ? 7 : 5}
                              fill={coreFill}
                              stroke={strokeColor}
                              strokeWidth={isSelected ? "2.5" : "1.5"}
                              className="transition-all duration-200"
                            />

                            {/* Center Dot */}
                            <circle r="1.5" fill="#ffffff" />

                            {/* Incident Badge Number */}
                            <text
                              x="10"
                              y="3"
                              fill="#f3f4f6"
                              fontSize="9"
                              fontFamily="monospace"
                              fontWeight="bold"
                              className="opacity-90 group-hover:opacity-100"
                            >
                              {pt.violationsCount > 1 ? pt.violationsCount : ""}
                            </text>

                            {/* Tooltip on hover */}
                            <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                              <rect
                                x="-60"
                                y="-28"
                                width="120"
                                height="18"
                                rx="4"
                                fill="#0f172a"
                                stroke="#334155"
                                strokeWidth="1"
                              />
                              <text
                                x="0"
                                y="-16"
                                textAnchor="middle"
                                fill="#e2e8f0"
                                fontSize="8"
                                fontFamily="sans-serif"
                                fontWeight="bold"
                              >
                                {pt.name.length > 22 ? pt.name.substring(0, 20) + "..." : pt.name}
                              </text>
                            </g>
                          </g>
                        );
                      })}
                    </g>
                  </svg>

                  {/* Interactive Map Overlay Controls */}
                  <div className="absolute top-3 right-3 flex flex-col gap-1.5 bg-slate-950/90 border border-slate-800 p-1.5 rounded-lg backdrop-blur-md shadow-xl z-20">
                    <button
                      type="button"
                      onClick={() => setMapRegionFocus("global")}
                      className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition cursor-pointer"
                      title="Reset View to Global Map"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const regions: Array<"global" | "na" | "eu" | "apac" | "latam"> = ["global", "na", "eu", "apac", "latam"];
                        const nextIdx = (regions.indexOf(mapRegionFocus) + 1) % regions.length;
                        setMapRegionFocus(regions[nextIdx]);
                      }}
                      className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition cursor-pointer"
                      title="Cycle Focus Region"
                    >
                      <Globe className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Region Indicator Watermark */}
                  <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-800/80 px-2.5 py-1 rounded-md text-[9px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-sm pointer-events-none">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Region: <strong className="text-white">{mapRegionFocus.toUpperCase()} PROLECTION</strong>
                  </div>

                </div>

              </div>
            </div>

            {/* 4-Card Regional Incident Density Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 border-t border-slate-800/80 pt-4">
              
              {/* North America */}
              <div className="bg-slate-950/90 p-3.5 border border-slate-850 rounded-xl space-y-2 hover:border-slate-700 transition">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white font-mono flex items-center gap-1">
                    🇺🇸 North America
                  </span>
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-mono font-bold rounded">
                    High Risk
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-xs font-mono">
                  <span className="text-slate-400">Incidents Density:</span>
                  <strong className="text-white font-bold">{regionalStats.na.length} Breaches</strong>
                </div>
                <div className="flex justify-between items-baseline text-[10px] font-mono">
                  <span className="text-slate-500">Avg Deficit:</span>
                  <span className="text-rose-400 font-bold">-21.4% below MAP</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMapRegionFocus("na")}
                  className="w-full py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 rounded text-[9.5px] font-mono transition cursor-pointer"
                >
                  Focus Map on NA
                </button>
              </div>

              {/* Europe */}
              <div className="bg-slate-950/90 p-3.5 border border-slate-850 rounded-xl space-y-2 hover:border-slate-700 transition">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white font-mono flex items-center gap-1">
                    🇪🇺 Europe
                  </span>
                  <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-mono font-bold rounded">
                    Critical
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-xs font-mono">
                  <span className="text-slate-400">Incidents Density:</span>
                  <strong className="text-white font-bold">{regionalStats.eu.length} Breaches</strong>
                </div>
                <div className="flex justify-between items-baseline text-[10px] font-mono">
                  <span className="text-slate-500">Avg Deficit:</span>
                  <span className="text-rose-400 font-bold">-24.8% below MAP</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMapRegionFocus("eu")}
                  className="w-full py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 rounded text-[9.5px] font-mono transition cursor-pointer"
                >
                  Focus Map on Europe
                </button>
              </div>

              {/* APAC */}
              <div className="bg-slate-950/90 p-3.5 border border-slate-850 rounded-xl space-y-2 hover:border-slate-700 transition">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white font-mono flex items-center gap-1">
                    🇨🇳 APAC Hub
                  </span>
                  <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-mono font-bold rounded">
                    Hotspot Peak
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-xs font-mono">
                  <span className="text-slate-400">Incidents Density:</span>
                  <strong className="text-white font-bold">{regionalStats.apac.length} Breaches</strong>
                </div>
                <div className="flex justify-between items-baseline text-[10px] font-mono">
                  <span className="text-slate-500">Avg Deficit:</span>
                  <span className="text-rose-400 font-bold">-31.2% below MAP</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMapRegionFocus("apac")}
                  className="w-full py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 rounded text-[9.5px] font-mono transition cursor-pointer"
                >
                  Focus Map on APAC
                </button>
              </div>

              {/* LATAM */}
              <div className="bg-slate-950/90 p-3.5 border border-slate-850 rounded-xl space-y-2 hover:border-slate-700 transition">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white font-mono flex items-center gap-1">
                    🇧🇷 LATAM
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono font-bold rounded">
                    Moderate Risk
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-xs font-mono">
                  <span className="text-slate-400">Incidents Density:</span>
                  <strong className="text-white font-bold">{regionalStats.latam.length} Breaches</strong>
                </div>
                <div className="flex justify-between items-baseline text-[10px] font-mono">
                  <span className="text-slate-500">Avg Deficit:</span>
                  <span className="text-rose-400 font-bold">-18.6% below MAP</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMapRegionFocus("latam")}
                  className="w-full py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 rounded text-[9.5px] font-mono transition cursor-pointer"
                >
                  Focus Map on LATAM
                </button>
              </div>

            </div>

          </div>
        );
      })()}

      {/* Grid of details based on active tab selection */}
      <div className="grid grid-cols-1 gap-6 font-sans">
        
        {/* TAB 1: DOMAIN SQUATTER MONITORING */}
        {activeSubTab === "domains" && (
          <div className="space-y-4" id="view-domains-tab">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 p-4 rounded-xl shadow-sm">
              <div className="relative w-full sm:max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search flagged threat domains..."
                  value={domainSearchQuery}
                  onChange={(e) => setDomainSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 placeholder-slate-500 text-xs rounded-xl pl-9 pr-4 py-2 focus:outline-none transition font-sans"
                />
              </div>
              <div className="text-[10px] text-slate-500 font-mono tracking-wide uppercase flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                Threat Model: Typos & Copycats ACTIVE
              </div>
            </div>

            {/* Main Domains incident table/list */}
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-800 bg-slate-950/20 flex justify-between items-center">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Domain Infraction Records</h3>
                <span className="text-[10px] text-slate-500 font-mono">Matching Targets: {filteredIncidents.length}</span>
              </div>

              {filteredIncidents.length === 0 ? (
                <div className="p-12 text-center space-y-2 text-slate-550">
                  <Globe className="w-8 h-8 mx-auto text-slate-750" />
                  <p className="text-xs">No domain violations match your filter criteria.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {filteredIncidents.map((inc) => {
                    const isHighRisk = inc.score >= 85;
                    const isTakedown = inc.status === "Takedown Sent";
                    const isResolved = inc.status === "Resolved";
                    
                    return (
                      <div key={inc.id} className="p-4 hover:bg-slate-850/20 transition flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-sans">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-bold text-slate-200 text-sm tracking-tight">{inc.domain}</span>
                            <span className="text-[9px] px-2 py-0.5 bg-slate-950 text-slate-400 border border-slate-800 rounded font-mono">
                              {inc.similarityType}
                            </span>
                            <span className={`text-[10px] px-2 rounded-full font-mono font-semibold ${
                              isHighRisk ? "bg-rose-500/10 text-rose-450 text-rose-400 border border-rose-500/20" : "bg-amber-500/10 text-amber-450 text-amber-400 border border-amber-500/20"
                            }`}>
                              Threat Score: {inc.score}%
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-[11px] text-slate-450 font-mono">
                            <span>Registrar: <strong>{inc.registrar}</strong></span>
                            <span>•</span>
                            <span>Detected: <strong>{new Date(inc.detectedAt).toLocaleDateString()}</strong></span>
                            <span>•</span>
                            <span className="text-slate-505">Abuse Contact: {inc.abuseContact}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                          {/* Current status display badge */}
                          <span className={`px-2.5 py-1 text-[10px] rounded-full font-bold uppercase tracking-wide font-mono ${
                            inc.status === "Flagged" ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" :
                            inc.status === "Takedown Sent" ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20" :
                            inc.status === "Resolved" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 animate-pulse" :
                            "bg-slate-800 text-slate-500"
                          }`}>
                            {inc.status}
                          </span>

                          {/* Actions */}
                          <div className="flex gap-1.5">
                            {inc.status === "Flagged" && (
                              <button
                                onClick={() => {
                                  setLegalRecipientName(`${inc.registrar} Compliance Dispute Ops`);
                                  setLegalRecipientEmail(inc.abuseContact);
                                  setLegalInfractionSource(inc.domain);
                                  setActiveSubTab("legal");
                                  handleGenerateNoticeDraft();
                                  handleUpdateDomainStatus(inc.id, "Takedown Sent");
                                }}
                                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-505 font-medium rounded-lg text-[10px] font-mono text-white tracking-wide transition cursor-pointer"
                                title="Load into Cease and Desist generator and send take down warning notice"
                              >
                                Draft Notice
                              </button>
                            )}
                            
                            {inc.status !== "Resolved" && (
                              <button
                                onClick={() => handleUpdateDomainStatus(inc.id, "Resolved")}
                                className="p-1 px-2 hover:bg-slate-800 hover:text-emerald-400 border border-slate-800 rounded-lg text-[10px] transition cursor-pointer font-semibold text-slate-400"
                                title="Mark domain as taken down / resolved offline"
                              >
                                <Check className="w-3.5 h-3.5 inline mr-1" />
                                Resolve
                              </button>
                            )}

                            {inc.status === "Flagged" && (
                              <button
                                onClick={() => handleUpdateDomainStatus(inc.id, "Ignored")}
                                className="p-1 px-2 hover:bg-slate-800 hover:text-rose-450 border border-slate-850 rounded-lg text-[10px] text-slate-500 transition cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5 inline mr-1" />
                                Ignore
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Squatting analysis strategy info card */}
            <div className="bg-amber-500/5 border border-indigo-500/10 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-slate-600 select-none">
              <Shield className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 font-mono uppercase tracking-wide text-[11px] block mb-0.5">Corporate Domain Defense Matrix</strong>
                Our active system tracks WHOIS revisions, domain registrars, DNS MX logs, and similarity algorithms to detect typosquatting profiles. If rogue operators host false shopping engines targeting your SKUs on these domains, they mislead consumers, steal logins, and violate pricing MAP unilaterally. Take action immediately with verified letters.
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ROGUE LISTINGS AND COPYRIGHT CONTROL */}
        {activeSubTab === "infringements" && (
          <div className="space-y-4" id="view-infringements-tab">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 p-4 rounded-xl shadow-sm">
              <div className="relative w-full sm:max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search rogue third-party listings..."
                  value={listingSearchQuery}
                  onChange={(e) => setListingSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 placeholder-slate-500 text-xs rounded-xl pl-9 pr-4 py-2 focus:outline-none transition font-sans"
                />
              </div>
              <span className="text-[10px] text-slate-505 font-mono uppercase tracking-widest">
                Scouring AliExpress, Amazon, eBay, Weebly, Shopify APIs
              </span>
            </div>

            {/* Listings table */}
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-800 bg-slate-955/20 flex justify-between items-center">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Counterfeit & Asset Misuse Logs</h3>
                <span className="text-[10px] text-slate-500 font-mono">Instances Flagged: {filteredListings.length}</span>
              </div>

              {filteredListings.length === 0 ? (
                <div className="p-12 text-center text-slate-550 italic">
                  No counterfeits detected within current search constraints.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {filteredListings.map((list) => {
                    const isHigh = list.severity === "High";
                    const isMed = list.severity === "Medium";
                    
                    return (
                      <div key={list.id} className="p-4 hover:bg-slate-850/10 transition flex flex-col sm:flex-row sm:items-center gap-4 text-xs font-sans">
                        <div className="space-y-1.5 flex-1 select-text">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-indigo-500/10 text-indigo-400 text-[10px] border border-indigo-500/20 px-2 py-0.5 rounded font-bold uppercase font-mono">
                              {list.platform}
                            </span>
                            <span className="font-bold text-slate-200 text-sm tracking-tight">{list.title}</span>
                            
                            <span className={`text-[10px] px-2 rounded-full font-mono ${
                              isHigh ? "bg-rose-500/15 text-rose-450 text-rose-400 border border-rose-500/20" :
                              isMed ? "bg-amber-500/15 text-amber-450 text-amber-400 border border-amber-500/20" :
                              "bg-slate-800 text-slate-400"
                            }`}>
                              {list.severity} Priority
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-[11px] text-slate-450 font-mono">
                            <span>Seller Account: <strong className="text-slate-350">{list.sellerName}</strong></span>
                            <span>•</span>
                            <span className="text-slate-455">Doubt Type: <strong className="text-indigo-400">{list.infringementType}</strong></span>
                            <span>•</span>
                            <span className="text-slate-505">Incident: {new Date(list.flaggedDate).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 justify-end shrink-0">
                          {/* Target e-commerce URL indicator */}
                          <a 
                            href={list.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-1 px-2.5 bg-slate-950 text-slate-400 hover:text-white border border-slate-850 rounded-lg text-[10px] font-mono flex items-center gap-1 cursor-pointer transition"
                            title="Visit raw listing site page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Listing
                          </a>

                          {/* Status Badge */}
                          <span className={`px-2 py-0.5 font-mono font-bold text-[10px] rounded uppercase tracking-wide border ${
                            list.status === "Active" ? "bg-red-500/10 text-red-400 border-red-500/20" : 
                            list.status === "Notice Sent" ? "bg-indigo-505/10 text-indigo-400 border-indigo-500/20" :
                            "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}>
                            {list.status}
                          </span>

                          {/* Action drop downs or toggles */}
                          <div className="flex gap-1">
                            {list.status === "Active" && (
                              <button
                                onClick={() => {
                                  setLegalRecipientName(`${list.sellerName} - Merchant Admin via Platform`);
                                  setLegalRecipientEmail(`legal@platform-escalation.com`);
                                  setLegalInfractionSource(list.url);
                                  setLegalBrandTrademark(`Premium Asset Copyright Proof`);
                                  setActiveSubTab("legal");
                                  handleGenerateNoticeDraft();
                                  handleUpdateListingStatus(list.id, "Notice Sent");
                                }}
                                className="p-1 px-2 bg-indigo-600 hover:bg-indigo-505 text-white rounded text-[10.5px] cursor-pointer transition font-mono font-bold uppercase"
                              >
                                Takedown
                              </button>
                            )}
                            
                            {list.status !== "Offline" && (
                              <button
                                onClick={() => handleUpdateListingStatus(list.id, "Offline")}
                                className="p-1 px-2 bg-slate-800 hover:bg-slate-750 text-slate-350 hover:text-emerald-400 rounded text-[10.5px] cursor-pointer transition font-mono"
                              >
                                Offline
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-amber-500/5 p-4 rounded-xl border border-dashed border-slate-200 flex gap-3 text-xs leading-relaxed text-slate-600 select-none">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 font-mono uppercase tracking-wide text-[10px] block mb-0.5">Asset & Artwork Theft Protections</strong>
                Many unauthorized drop-shippers copy-paste your professional product graphics, logos, and high-fidelity product lifestyle photos straight into unapproved listings. This devalues your brand and is actionable under DMCA specifications immediately. Use our notice builder to request platform removal.
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TRADEMARK & INTELLECTUAL PROPERTY CATALOG */}
        {activeSubTab === "trademarks" && (
          <div className="space-y-4 font-sans" id="view-trademarks-tab">
            <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base tracking-tight font-display">Intellectual Property Index</h3>
                <p className="text-[11px] text-slate-500 leading-normal">Monitoring systems align pricing compliance crawls with these active trademarks</p>
              </div>
              <button
                onClick={() => setShowAddTmModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-505 text-white text-xs font-semibold rounded-xl transition shadow cursor-pointer font-mono"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Asset
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {trademarks.map((tm) => (
                <div key={tm.id} className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-xl p-5 space-y-4 hover:border-slate-700/80 transition relative select-none shadow-sm">
                  {/* Trademark top header row */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="p-1 px-2.5 bg-slate-950 text-slate-400 border border-slate-850 rounded text-[9px] font-mono font-bold uppercase tracking-wide">
                      {tm.type}
                    </span>
                    <button
                      onClick={() => handleDeleteTrademark(tm.id)}
                      className="p-1 bg-slate-955 hover:bg-slate-800 text-slate-505 hover:text-rose-400 rounded-lg transition opacity-0 hover:opacity-100 group-hover:opacity-100 focus:opacity-100 focus:outline-none absolute top-4 right-4"
                      title="Remove trademark from catalog"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-slate-205 text-white leading-snug tracking-tight truncate max-w-[180px]">{tm.name}</h4>
                    <p className="text-[10px] font-mono text-slate-500">Reg: <strong className="text-slate-350">{tm.regNumber}</strong></p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-mono">Filing: {tm.filingDate}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      tm.status === "Registered" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-505/20" :
                      tm.status === "Pending" ? "bg-amber-500/10 text-amber-400 border border-amber-505/20" :
                      "bg-slate-805 text-slate-405"
                    }`}>
                      {tm.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Simulated Add Trademark Modal */}
            {showAddTmModal && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                <form 
                  onSubmit={handleAddTrademark}
                  className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative font-sans shadow-sm"
                >
                  <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">Add Trademark to Defense Base</h3>
                      <p className="text-[10px] text-slate-500 font-mono">This will update pricing crawlers with copyright assets</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setShowAddTmModal(false)}
                      className="p-1 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-300">Trademark Word or Logo Label</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. MAPShield Pro"
                        value={newTmName}
                        onChange={(e) => setNewTmName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 outline-none focus:border-indigo-500 transition font-sans"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-300">Asset Type</label>
                        <select
                          value={newTmType}
                          onChange={(e: any) => setNewTmType(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 outline-none focus:border-indigo-550 transition cursor-pointer"
                        >
                          <option value="Wordmark">Wordmark</option>
                          <option value="Logo">Logo / Icon</option>
                          <option value="Design Patent">Design Patent</option>
                          <option value="Slogan">Brand Slogan</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-300">Registration Number</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. US-891002-K"
                          value={newTmReg}
                          onChange={(e) => setNewTmReg(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 outline-none focus:border-indigo-505 transition font-sans font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-300">Current Filing Status</label>
                      <select
                        value={newTmStatus}
                        onChange={(e: any) => setNewTmStatus(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 outline-none focus:border-indigo-505 transition cursor-pointer"
                      >
                        <option value="Registered">Registered (Active Protections)</option>
                        <option value="Pending">Pending Application</option>
                        <option value="Under Review">Under Review</option>
                      </select>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-950/70 border-t border-slate-800 flex justify-end gap-3 font-mono text-xs">
                    <button 
                      type="button" 
                      onClick={() => setShowAddTmModal(false)}
                      className="px-4 py-2 text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-505 text-white font-semibold rounded-xl shadow cursor-pointer text-center"
                    >
                      Save Trademark
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: AUTOMATIC CEASE & DESIST NOTICE BUILDER */}
        {activeSubTab === "legal" && (
          <div className="space-y-6 font-sans" id="view-legal-tab">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Draft Parameters Card */}
              <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-6 space-y-4 h-fit shadow-sm">
                <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
                  <Gavel className="w-4.5 h-4.5 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm sm:text-base tracking-tight font-display">Document Parameters</h3>
                </div>

                <div className="space-y-4 text-xs font-sans">
                  
                  {/* Select infraction type */}
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-350">Mitigation Target Type</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 border border-slate-855 rounded-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setLegalTargetType("domain");
                          setLegalRecipientName("NameCheap Domain Operations Help");
                          setLegalRecipientEmail("abuse@namecheap.com");
                          setLegalInfractionSource("mapshielld.com");
                        }}
                        className={`py-2 rounded-lg text-[10.5px] font-mono uppercase font-bold text-center cursor-pointer transition ${
                          legalTargetType === "domain" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "text-slate-450 hover:text-slate-350"
                        }`}
                      >
                        Target Domain
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLegalTargetType("listing");
                          setLegalRecipientName("AliExpress Vendor Legal Escalations");
                          setLegalRecipientEmail("disputes@alibaba-inc.com");
                          setLegalInfractionSource("aliexpress.com/item/keyboard-copy");
                        }}
                        className={`py-2 rounded-lg text-[10.5px] font-mono uppercase font-bold text-center cursor-pointer transition ${
                          legalTargetType === "listing" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "text-slate-450 hover:text-slate-350"
                        }`}
                      >
                        Rogue Listing
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-350">Recipient / Registrar Abuse Contact</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 outline-none rounded-xl focus:border-indigo-505 transition"
                      value={legalRecipientName}
                      onChange={(e) => setLegalRecipientName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-350">Abuse Email Address</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 outline-none rounded-xl focus:border-indigo-505 transition font-mono"
                      value={legalRecipientEmail}
                      onChange={(e) => setLegalRecipientEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-350">Infrac / Abuse Location (Domain/URL)</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 outline-none rounded-xl focus:border-indigo-505 transition font-mono"
                      value={legalInfractionSource}
                      onChange={(e) => setLegalInfractionSource(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-350">Violated Corporate Trademark</label>
                    <select
                      value={legalBrandTrademark}
                      onChange={(e) => setLegalBrandTrademark(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-slate-200 outline-none rounded-xl focus:border-indigo-505 transition cursor-pointer font-sans"
                    >
                      {trademarks.map((t) => (
                        <option key={t.id} value={`${t.name} (${t.regNumber})`}>
                          {t.name} ({t.regNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleGenerateNoticeDraft}
                    type="button"
                    className="w-full mt-2 font-mono py-2.5 bg-indigo-600 hover:bg-indigo-505 text-white font-bold uppercase rounded-xl transition cursor-pointer text-center tracking-wider"
                  >
                    Generate Draft C&D Notice
                  </button>

                </div>
              </div>

              {/* Legal Draft Preview Window */}
              <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-6 lg:col-span-2 space-y-4 shadow-sm">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4.5 h-4.5 text-indigo-400" />
                    <div>
                      <h3 className="font-bold text-white text-sm sm:text-base tracking-tight font-display">Legalese Document Draft</h3>
                      <p className="text-[10px] text-slate-500 font-mono">Tailored enforcement compliant with DMCA & Lanham Act standards</p>
                    </div>
                  </div>

                  {generatedDraft && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyDraft}
                        className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-350 hover:text-white rounded-lg text-xs font-mono transition flex items-center gap-1 cursor-pointer select-none border border-slate-850"
                      >
                        {copiedDraft ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            Copy Draft Text
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {generatedDraft ? (
                  <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl">
                    <pre className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap select-all font-mono max-h-[500px] overflow-y-auto">
                      {generatedDraft}
                    </pre>
                  </div>
                ) : (
                  <div className="p-16 text-center text-slate-550 border border-dashed border-slate-800 rounded-xl space-y-2 select-none">
                    <FileText className="w-10 h-10 mx-auto text-slate-750" />
                    <p className="text-xs">Adjust your parameters and click <strong>Generate Draft C&D Notice</strong> on the left to review structural legal notifications.</p>
                  </div>
                )}

                {generatedDraft && (
                  <div className="flex items-start gap-2 text-[10px] text-slate-505 bg-slate-950/60 p-3 rounded-lg border border-slate-900">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Safe Harbor Warning:</strong> This automated text template constitutes generic business brand protection strategies. Under the Lanham Act, formal letters should be scrutinized by corporate general counsel before direct dispatch to ensure correct jurisdiction compliance.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
