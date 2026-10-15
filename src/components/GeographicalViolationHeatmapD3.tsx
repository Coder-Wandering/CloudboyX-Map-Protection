import React, { useRef, useEffect, useState, useMemo } from "react";
import * as d3 from "d3";
import { Partner, Product, ScanJob } from "../types";
import {
  Flame,
  Layers,
  Sliders,
  Filter,
  Download,
  Sparkles,
  Zap,
  Info,
  Maximize2,
  Minimize2,
  RefreshCw,
  Eye,
  EyeOff,
  Crosshair,
  ShieldAlert,
  MapPin,
  TrendingUp,
  DollarSign,
  Activity
} from "lucide-react";

export interface GeographicalViolationHeatmapD3Props {
  partnerHeatPoints: Array<{
    partner: Partner;
    city?: string;
    state?: string;
    zipCode?: string;
    lat: number;
    lng: number;
    totalScansWithPartner: number;
    violatingScansWithPartner: number;
    frequencyRate: number;
  }>;
  activeViolationsList?: Array<{
    partner: string;
    domain: string;
    sku?: string;
    product?: string;
    map: number;
    found: number;
    url?: string;
    time?: string;
  }>;
  onSelectPartner?: (point: any) => void;
  selectedPartner?: any;
  mapSeverityFilters?: {
    high: boolean;
    medium: boolean;
    low: boolean;
    compliant: boolean;
  };
  mapRegionFilter?: string;
  mapCategoryFilter?: string;
  mapShowOnlyFlagged?: boolean;
  mapPriceDeltaFilter?: number | "all";
  viewMode?: "standalone" | "overlay";
  height?: number | string;
}

export default function GeographicalViolationHeatmapD3({
  partnerHeatPoints,
  activeViolationsList = [],
  onSelectPartner,
  selectedPartner,
  mapSeverityFilters = { high: true, medium: true, low: true, compliant: true },
  mapRegionFilter = "all",
  mapCategoryFilter = "all",
  mapShowOnlyFlagged = false,
  mapPriceDeltaFilter = "all",
  viewMode = "standalone",
  height = 420,
}: GeographicalViolationHeatmapD3Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Heatmap Customization State
  const [metric, setMetric] = useState<"frequency" | "activeCount" | "violations" | "priceDelta">("frequency");
  const [colorScheme, setColorScheme] = useState<"flame" | "inferno" | "turbo" | "plasma" | "viridis">("flame");
  const [bandwidth, setBandwidth] = useState<number>(24);
  const [thresholdCount, setThresholdCount] = useState<number>(10);
  const [layerOpacity, setLayerOpacity] = useState<number>(0.85);
  const [showContours, setShowContours] = useState<boolean>(true);
  const [showHalos, setShowHalos] = useState<boolean>(true);
  const [showCentroids, setShowCentroids] = useState<boolean>(true);
  const [showPartnerPins, setShowPartnerPins] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: typeof height === "number" ? height : 420,
  });

  // Observe container resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height: h } = entries[0].contentRect;
        setContainerDimensions({
          width: Math.max(400, width),
          height: Math.max(300, h || (typeof height === "number" ? height : 420)),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [height]);

  // Helper for Partner max price delta
  const getPointMaxPriceDelta = (point: any) => {
    const partnerActive = activeViolationsList.filter(
      (v) => v.partner === point.partner.name || v.domain === point.partner.domain
    );
    let maxDelta = 0;
    partnerActive.forEach((v) => {
      const diff = v.map - v.found;
      if (diff > maxDelta) maxDelta = diff;
    });
    return maxDelta;
  };

  // Helper to determine severity level
  const getSeverityOfPoint = (point: any) => {
    const freq = point.frequencyRate;
    if (freq === 0) return "compliant";
    if (freq < 25) return "low";
    if (freq <= 50) return "medium";
    return "high";
  };

  // Helper to filter points based on active filter props
  const filteredPoints = useMemo(() => {
    return partnerHeatPoints.filter((point) => {
      // 1. Severity filter
      const sev = getSeverityOfPoint(point);
      if (!mapSeverityFilters[sev as keyof typeof mapSeverityFilters]) return false;

      // 2. Currently flagged for MAP violations filter
      if (mapShowOnlyFlagged) {
        const hasActiveViolation = activeViolationsList.some(
          (v) => v.partner === point.partner.name || v.domain === point.partner.domain
        );
        if (!hasActiveViolation) return false;
      }

      // 3. Price delta threshold filter
      if (mapPriceDeltaFilter !== "all") {
        const delta = getPointMaxPriceDelta(point);
        if (delta < mapPriceDeltaFilter) return false;
      }

      return true;
    });
  }, [
    partnerHeatPoints,
    activeViolationsList,
    mapSeverityFilters,
    mapShowOnlyFlagged,
    mapPriceDeltaFilter,
  ]);

  // Equirectangular projection mapping lat/lng to SVG pixel coordinates
  const projectCoords = useMemo(() => {
    const w = containerDimensions.width;
    const h = containerDimensions.height;
    return (lat: number, lng: number) => {
      // Scale lat from [-60, 75] to [h - padding, padding]
      // Scale lng from [-160, 160] to [padding, w - padding]
      const padX = 40;
      const padY = 40;
      const normX = (lng + 170) / 340;
      const normY = 1 - (lat + 60) / 135;

      const x = padX + normX * (w - padX * 2);
      const y = padY + Math.max(0, Math.min(1, normY)) * (h - padY * 2);
      return { x, y };
    };
  }, [containerDimensions]);

  // World Region Outlines for context
  const worldLandPaths = useMemo(() => {
    const w = containerDimensions.width;
    const h = containerDimensions.height;

    // Simplified continental landmass bounding polygons mapped through projectCoords
    const continentalPolys = [
      // North America
      [
        { lat: 70, lng: -160 }, { lat: 70, lng: -70 }, { lat: 50, lng: -55 },
        { lat: 30, lng: -80 }, { lat: 20, lng: -90 }, { lat: 15, lng: -95 },
        { lat: 30, lng: -120 }, { lat: 60, lng: -140 }, { lat: 70, lng: -160 }
      ],
      // South America
      [
        { lat: 12, lng: -75 }, { lat: -5, lng: -35 }, { lat: -25, lng: -45 },
        { lat: -55, lng: -65 }, { lat: -45, lng: -75 }, { lat: -15, lng: -75 },
        { lat: 0, lng: -80 }, { lat: 12, lng: -75 }
      ],
      // Europe
      [
        { lat: 70, lng: 20 }, { lat: 60, lng: 40 }, { lat: 45, lng: 40 },
        { lat: 36, lng: -5 }, { lat: 45, lng: -10 }, { lat: 55, lng: 5 },
        { lat: 70, lng: 20 }
      ],
      // Asia
      [
        { lat: 70, lng: 40 }, { lat: 70, lng: 170 }, { lat: 40, lng: 140 },
        { lat: 20, lng: 120 }, { lat: 10, lng: 100 }, { lat: 25, lng: 60 },
        { lat: 45, lng: 40 }, { lat: 70, lng: 40 }
      ],
      // Africa
      [
        { lat: 35, lng: -5 }, { lat: 30, lng: 35 }, { lat: 10, lng: 50 },
        { lat: -35, lng: 20 }, { lat: -35, lng: 15 }, { lat: 5, lng: 0 },
        { lat: 15, lng: -15 }, { lat: 35, lng: -5 }
      ],
      // Australia / Oceania
      [
        { lat: -12, lng: 130 }, { lat: -15, lng: 150 }, { lat: -38, lng: 150 },
        { lat: -35, lng: 115 }, { lat: -20, lng: 115 }, { lat: -12, lng: 130 }
      ]
    ];

    const pathGenerator = d3.line<{ lat: number; lng: number }>()
      .x(d => projectCoords(d.lat, d.lng).x)
      .y(d => projectCoords(d.lat, d.lng).y)
      .curve(d3.curveCardinalClosed.tension(0.4));

    return continentalPolys.map(poly => pathGenerator(poly) || "");
  }, [containerDimensions, projectCoords]);

  // Projected Points with weights
  const weightedPoints = useMemo(() => {
    return filteredPoints.map((point) => {
      const { x, y } = projectCoords(point.lat, point.lng);

      const activeCount = activeViolationsList.filter(
        (v) => v.partner === point.partner.name || v.domain === point.partner.domain
      ).length;
      const priceDelta = getPointMaxPriceDelta(point);

      let weight = 1;
      if (metric === "frequency") {
        weight = Math.max(1, (point.frequencyRate / 100) * 10 + 1);
      } else if (metric === "activeCount") {
        weight = Math.max(1, activeCount * 4 + 1);
      } else if (metric === "violations") {
        weight = Math.max(1, point.violatingScansWithPartner * 3 + 1);
      } else if (metric === "priceDelta") {
        weight = Math.max(1, (priceDelta / 20) * 4 + 1);
      }

      return {
        ...point,
        x,
        y,
        weight,
        activeCount,
        priceDelta,
      };
    });
  }, [filteredPoints, projectCoords, metric, activeViolationsList]);

  // D3 Color Interpolator based on selected scheme
  const getColorInterpolator = useMemo(() => {
    switch (colorScheme) {
      case "inferno":
        return d3.interpolateInferno;
      case "turbo":
        return d3.interpolateTurbo;
      case "plasma":
        return d3.interpolatePlasma;
      case "viridis":
        return d3.interpolateViridis;
      case "flame":
      default:
        return (t: number) => {
          // Custom Flame gradient: Deep Charcoal -> Orange -> Amber -> Intense Red-Pink -> White
          return d3.interpolateRgbBasis([
            "rgba(15, 23, 42, 0)",
            "rgba(249, 115, 22, 0.4)",
            "rgba(245, 158, 11, 0.7)",
            "rgba(244, 63, 94, 0.9)",
            "rgba(239, 68, 68, 1)",
            "rgba(255, 255, 255, 1)"
          ])(t);
        };
    }
  }, [colorScheme]);

  // D3 Render Effect
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll(".d3-heat-dynamic").remove();

    const w = containerDimensions.width;
    const h = containerDimensions.height;

    const mainG = svg.append("g").attr("class", "d3-heat-dynamic");

    // 1. Render D3 Kernel Density Contours (KDE)
    if (showContours && weightedPoints.length > 0) {
      const densityGroup = mainG.append("g").attr("class", "d3-density-contours");

      try {
        // Expand weighted points according to their calculated weight for KDE
        const sampleCoords: [number, number][] = [];
        weightedPoints.forEach((p) => {
          const count = Math.round(p.weight * 2);
          for (let i = 0; i < count; i++) {
            // Slight jitter to create smooth continuous field
            const jitterX = (Math.random() - 0.5) * 4;
            const jitterY = (Math.random() - 0.5) * 4;
            sampleCoords.push([p.x + jitterX, p.y + jitterY]);
          }
        });

        const density = d3
          .contourDensity<[number, number]>()
          .x((d) => d[0])
          .y((d) => d[1])
          .size([w, h])
          .bandwidth(bandwidth)
          .thresholds(thresholdCount)(sampleCoords);

        const values = density.map((d) => d.value);
        const maxVal = d3.max(values) || 0.001;

        const colorScale = d3
          .scaleSequential((t) => getColorInterpolator(t))
          .domain([0, maxVal]);

        const geoPath = d3.geoPath();

        densityGroup
          .selectAll("path.contour")
          .data(density)
          .enter()
          .append("path")
          .attr("class", "contour")
          .attr("d", geoPath)
          .attr("fill", (d) => colorScale(d.value))
          .attr("opacity", layerOpacity)
          .attr("stroke", (d) => colorScale(d.value))
          .attr("stroke-width", 0.6)
          .attr("stroke-opacity", 0.7)
          .style("mix-blend-mode", "screen");
      } catch (err) {
        console.warn("D3 contourDensity error:", err);
      }
    }

    // 2. Render Glowing D3 Radial Halos around Partner Locations
    if (showHalos && weightedPoints.length > 0) {
      const haloGroup = mainG.append("g").attr("class", "d3-density-halos");

      weightedPoints.forEach((p) => {
        const radius = Math.min(60, Math.max(16, p.weight * 8));
        const sev = getSeverityOfPoint(p);
        const color = sev === "high" ? "#ef4444" : sev === "medium" ? "#f59e0b" : "#f97316";

        // Multi-tier radial aura
        haloGroup
          .append("circle")
          .attr("cx", p.x)
          .attr("cy", p.y)
          .attr("r", radius * 1.5)
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "3 2")
          .attr("opacity", 0.35)
          .attr("class", "origin-center");

        haloGroup
          .append("circle")
          .attr("cx", p.x)
          .attr("cy", p.y)
          .attr("r", radius)
          .attr("fill", color)
          .attr("opacity", 0.22)
          .attr("filter", "blur(8px)")
          .style("mix-blend-mode", "screen");
      });
    }

    // 3. Render High-Risk Centroids
    if (showCentroids) {
      const centroidGroup = mainG.append("g").attr("class", "d3-hotspot-centroids");

      // Filter critical hotspots (severity === high or activeCount >= 2)
      const hotspots = weightedPoints.filter(
        (p) => getSeverityOfPoint(p) === "high" || p.activeCount >= 2
      );

      hotspots.forEach((p) => {
        // Radar sweep rings
        centroidGroup
          .append("circle")
          .attr("cx", p.x)
          .attr("cy", p.y)
          .attr("r", 18)
          .attr("fill", "none")
          .attr("stroke", "#f43f5e")
          .attr("stroke-width", 1.2)
          .attr("opacity", 0.8)
          .attr("stroke-dasharray", "4 2");

        centroidGroup
          .append("circle")
          .attr("cx", p.x)
          .attr("cy", p.y)
          .attr("r", 5)
          .attr("fill", "#f43f5e")
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 1.5);
      });
    }

    // 4. Render Interactive Partner Marker Nodes
    if (showPartnerPins) {
      const pinGroup = mainG.append("g").attr("class", "d3-partner-pins");

      weightedPoints.forEach((p) => {
        const sev = getSeverityOfPoint(p);
        const isSelected = selectedPartner && selectedPartner.partner.id === p.partner.id;
        const color =
          sev === "high"
            ? "#ef4444"
            : sev === "medium"
            ? "#f59e0b"
            : sev === "low"
            ? "#f97316"
            : "#10b981";

        const node = pinGroup
          .append("g")
          .attr("class", "partner-pin-node cursor-pointer")
          .attr("transform", `translate(${p.x}, ${p.y})`);

        // Outer glow
        node
          .append("circle")
          .attr("r", isSelected ? 9 : 6)
          .attr("fill", color)
          .attr("stroke", "#ffffff")
          .attr("stroke-width", isSelected ? 2 : 1)
          .attr("filter", "drop-shadow(0 0 4px rgba(0,0,0,0.8))");

        // Center dot
        node
          .append("circle")
          .attr("r", 2)
          .attr("fill", "#ffffff");

        // Events
        node
          .on("mouseenter", (event) => {
            setHoveredPoint(p);
            if (containerRef.current) {
              const [mouseX, mouseY] = d3.pointer(event, containerRef.current);
              setTooltipPos({ x: mouseX, y: mouseY });
            }
          })
          .on("mousemove", (event) => {
            if (containerRef.current) {
              const [mouseX, mouseY] = d3.pointer(event, containerRef.current);
              setTooltipPos({ x: mouseX, y: mouseY });
            }
          })
          .on("mouseleave", () => {
            setHoveredPoint(null);
          })
          .on("click", () => {
            if (onSelectPartner) onSelectPartner(p);
          });
      });
    }
  }, [
    weightedPoints,
    containerDimensions,
    bandwidth,
    thresholdCount,
    layerOpacity,
    showContours,
    showHalos,
    showCentroids,
    showPartnerPins,
    getColorInterpolator,
    selectedPartner,
    onSelectPartner,
  ]);

  // CSV Export for Geographical Density
  const handleExportCsv = () => {
    const headers = [
      "Partner Name",
      "Domain",
      "City",
      "State",
      "Latitude",
      "Longitude",
      "Infraction Frequency (%)",
      "Active Breaches Count",
      "Historical Violating Sweeps",
      "Max Price Deficit ($)",
      "Severity Status",
    ];

    const rows = weightedPoints.map((p) => [
      `"${p.partner.name}"`,
      `"${p.partner.domain}"`,
      `"${p.city}"`,
      `"${p.state}"`,
      p.lat,
      p.lng,
      p.frequencyRate,
      p.activeCount,
      p.violatingScansWithPartner,
      p.priceDelta,
      `"${getSeverityOfPoint(p).toUpperCase()}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `partner-violation-density-heatmap-d3-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl bg-zinc-950 border border-zinc-850 overflow-hidden shadow-2xl font-mono text-xs select-none"
      id="geographical-violation-heatmap-d3-root"
      style={{ height: typeof height === "number" ? `${height}px` : height }}
    >
      {/* Top Floating Control Bar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex flex-wrap items-center justify-between gap-2 bg-zinc-950/90 backdrop-blur-md border border-zinc-800/90 px-3 py-1.5 rounded-xl shadow-lg">
        {/* Left: Metric & Title */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-rose-950/80 border border-rose-800/60 text-rose-400">
            <Flame className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-white text-[11px] flex items-center gap-1.5">
              D3 Geographical Heatmap
              <span className="text-[8px] px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                KDE Contours
              </span>
            </span>
            <span className="text-[8.5px] text-zinc-400 block font-sans">
              Overlaying partner violation densities with continuous 2D Gaussian density estimation
            </span>
          </div>
        </div>

        {/* Center: Metric Selectors */}
        <div className="flex items-center gap-1 bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800/80 text-[9px]">
          <span className="text-zinc-500 px-1 text-[8px] font-bold uppercase">Weight:</span>
          {(
            [
              { id: "frequency", label: "Infraction %" },
              { id: "activeCount", label: "Active MAP" },
              { id: "violations", label: "Sweeps" },
              { id: "priceDelta", label: "Price Delta" },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMetric(m.id)}
              className={`px-2 py-0.5 rounded text-[8.5px] font-bold transition cursor-pointer ${
                metric === m.id
                  ? "bg-rose-900/80 text-rose-200 border border-rose-700/60 shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Right: Color Scheme & Export */}
        <div className="flex items-center gap-1.5">
          {/* Color Palette Selector */}
          <select
            value={colorScheme}
            onChange={(e) => setColorScheme(e.target.value as any)}
            className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-[9px] rounded-lg px-2 py-1 font-mono focus:outline-none cursor-pointer"
            title="Choose D3 Continuous Color Scale"
          >
            <option value="flame">Flame (Crimson)</option>
            <option value="inferno">Inferno</option>
            <option value="turbo">Turbo Spectrum</option>
            <option value="plasma">Plasma</option>
            <option value="viridis">Viridis</option>
          </select>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-750 rounded-lg text-[9px] font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
            title="Download partner density table as CSV"
          >
            <Download className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Interactive Bottom Control Toolbar */}
      <div className="absolute bottom-2.5 left-2.5 z-20 flex flex-wrap items-center gap-3 bg-zinc-950/90 backdrop-blur-md border border-zinc-800/90 px-3 py-1.5 rounded-xl shadow-lg text-[9px]">
        {/* Layer Visibility Toggles */}
        <div className="flex items-center gap-2 border-r border-zinc-800 pr-3">
          <label className="flex items-center gap-1 text-zinc-300 cursor-pointer font-bold select-none">
            <input
              type="checkbox"
              checked={showContours}
              onChange={(e) => setShowContours(e.target.checked)}
              className="rounded bg-zinc-900 border-zinc-700 text-rose-500 focus:ring-0 cursor-pointer"
            />
            <span>Contours</span>
          </label>

          <label className="flex items-center gap-1 text-zinc-300 cursor-pointer font-bold select-none">
            <input
              type="checkbox"
              checked={showHalos}
              onChange={(e) => setShowHalos(e.target.checked)}
              className="rounded bg-zinc-900 border-zinc-700 text-rose-500 focus:ring-0 cursor-pointer"
            />
            <span>Halos</span>
          </label>

          <label className="flex items-center gap-1 text-zinc-300 cursor-pointer font-bold select-none">
            <input
              type="checkbox"
              checked={showCentroids}
              onChange={(e) => setShowCentroids(e.target.checked)}
              className="rounded bg-zinc-900 border-zinc-700 text-rose-500 focus:ring-0 cursor-pointer"
            />
            <span>Hotspots</span>
          </label>

          <label className="flex items-center gap-1 text-zinc-300 cursor-pointer font-bold select-none">
            <input
              type="checkbox"
              checked={showPartnerPins}
              onChange={(e) => setShowPartnerPins(e.target.checked)}
              className="rounded bg-zinc-900 border-zinc-700 text-rose-500 focus:ring-0 cursor-pointer"
            />
            <span>Pins</span>
          </label>
        </div>

        {/* Bandwidth / Smoothness Slider */}
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500 text-[8px] uppercase font-bold">Kernel Blur:</span>
          <input
            type="range"
            min={12}
            max={48}
            step={2}
            value={bandwidth}
            onChange={(e) => setBandwidth(Number(e.target.value))}
            className="w-16 h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-rose-500"
            title="Adjust Gaussian Kernel Estimation Bandwidth"
          />
          <span className="text-rose-400 font-bold">{bandwidth}px</span>
        </div>

        {/* Contour Threshold Levels Slider */}
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500 text-[8px] uppercase font-bold">Contour Levels:</span>
          <input
            type="range"
            min={4}
            max={18}
            step={1}
            value={thresholdCount}
            onChange={(e) => setThresholdCount(Number(e.target.value))}
            className="w-16 h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-indigo-500"
            title="Adjust D3 Density Isoband Threshold Counts"
          />
          <span className="text-indigo-400 font-bold">{thresholdCount}</span>
        </div>

        {/* Opacity Slider */}
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500 text-[8px] uppercase font-bold">Opacity:</span>
          <input
            type="range"
            min={0.2}
            max={1.0}
            step={0.05}
            value={layerOpacity}
            onChange={(e) => setLayerOpacity(Number(e.target.value))}
            className="w-14 h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-emerald-500"
            title="Adjust Density Layer Opacity"
          />
          <span className="text-emerald-400 font-bold">{Math.round(layerOpacity * 100)}%</span>
        </div>
      </div>

      {/* Bottom Right Spectrum Legend */}
      <div className="absolute bottom-2.5 right-2.5 z-20 bg-zinc-950/90 backdrop-blur-md border border-zinc-800/90 px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-2 text-[8px]">
        <span className="text-zinc-400 font-bold uppercase">Density:</span>
        <span className="text-zinc-500 font-mono">Low</span>
        <div
          className="h-2 w-20 rounded-md border border-zinc-700"
          style={{
            background:
              colorScheme === "flame"
                ? "linear-gradient(to right, #1e293b, #f97316, #f43f5e, #ef4444, #ffffff)"
                : colorScheme === "inferno"
                ? "linear-gradient(to right, #000004, #57106e, #bb3754, #f98e09, #fcffa4)"
                : colorScheme === "turbo"
                ? "linear-gradient(to right, #30123b, #4582ec, #35b779, #fde725)"
                : colorScheme === "plasma"
                ? "linear-gradient(to right, #0d0887, #6a00a8, #b12a90, #e16462, #fca636, #f0f921)"
                : "linear-gradient(to right, #440154, #3b528b, #21918c, #5ec962, #fde725)",
          }}
        />
        <span className="text-rose-400 font-extrabold font-mono">High</span>
      </div>

      {/* Main SVG Visualization Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full block"
        style={{ width: "100%", height: "100%" }}
      >
        {/* Background Subtle Coordinate Grids */}
        <g stroke="#27272a" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.35">
          {Array.from({ length: 9 }).map((_, i) => (
            <line
              key={`grid-x-${i}`}
              x1={(containerDimensions.width / 8) * i}
              y1={0}
              x2={(containerDimensions.width / 8) * i}
              y2={containerDimensions.height}
            />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <line
              key={`grid-y-${i}`}
              x1={0}
              y1={(containerDimensions.height / 5) * i}
              x2={containerDimensions.width}
              y2={(containerDimensions.height / 5) * i}
            />
          ))}
        </g>

        {/* Global Continental Outlines */}
        <g className="world-continents">
          {worldLandPaths.map((d, idx) => (
            <path
              key={`continent-${idx}`}
              d={d}
              fill="rgba(39, 39, 42, 0.22)"
              stroke="rgba(63, 63, 70, 0.45)"
              strokeWidth="0.8"
            />
          ))}
        </g>
      </svg>

      {/* Hover Tooltip Overlay */}
      {hoveredPoint && (
        <div
          className="absolute pointer-events-none z-50 bg-zinc-950/95 border border-rose-800/80 p-3 rounded-xl shadow-2xl text-[9.5px] font-mono space-y-1.5 w-60 backdrop-blur-md animate-fade-in"
          style={{
            left: Math.min(tooltipPos.x + 12, containerDimensions.width - 250),
            top: Math.max(10, Math.min(tooltipPos.y - 80, containerDimensions.height - 180)),
          }}
        >
          <div className="flex items-start justify-between border-b border-zinc-800 pb-1 mb-1">
            <div className="max-w-[150px]">
              <strong className="text-white font-bold text-[11px] block truncate">
                {hoveredPoint.partner.name}
              </strong>
              <span className="text-[8px] text-zinc-400 block truncate">
                {hoveredPoint.partner.domain} &bull; {hoveredPoint.city}, {hoveredPoint.state}
              </span>
            </div>
            <span
              className={`px-1.5 py-0.2 rounded text-[7.5px] font-bold uppercase tracking-wider ${
                getSeverityOfPoint(hoveredPoint) === "high"
                  ? "bg-red-950 text-red-400 border border-red-800 animate-pulse"
                  : getSeverityOfPoint(hoveredPoint) === "medium"
                  ? "bg-amber-950 text-amber-400 border border-amber-800"
                  : "bg-orange-950 text-orange-400 border border-orange-800"
              }`}
            >
              {getSeverityOfPoint(hoveredPoint).toUpperCase()}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-rose-300">
              <span>Infraction Frequency:</span>
              <strong className="font-extrabold text-[10.5px]">
                {hoveredPoint.frequencyRate}%
              </strong>
            </div>

            <div className="flex justify-between items-center text-zinc-300">
              <span>Active MAP Breaches:</span>
              <strong className="font-bold text-amber-400">
                {hoveredPoint.activeCount}
              </strong>
            </div>

            <div className="flex justify-between items-center text-zinc-400">
              <span>Historical Violating Sweeps:</span>
              <span>
                {hoveredPoint.violatingScansWithPartner} / {hoveredPoint.totalScansWithPartner}
              </span>
            </div>

            {hoveredPoint.priceDelta > 0 && (
              <div className="flex justify-between items-center text-rose-400 pt-0.5 border-t border-zinc-900">
                <span>Max Deficit Below MAP:</span>
                <strong className="font-bold">${hoveredPoint.priceDelta.toFixed(2)}</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
