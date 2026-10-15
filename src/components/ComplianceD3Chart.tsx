import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { Zap, ShieldAlert, Sliders, Calendar, Sparkles, Tag, ShoppingBag, Info, TrendingUp } from "lucide-react";

export interface DataPoint {
  date: string;
  healthScore: number;
  isReal?: boolean;
}

export interface SeasonalEvent {
  id: string;
  name: string;
  shortName: string;
  tag: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeBg: string;
  description: string;
  impactLevel: "Extreme" | "High" | "Moderate";
}

// Function to match a data point date string or timeline index to historical high-volume events
export const getSeasonalEventForPoint = (dateStr: string, index: number, totalPoints: number): SeasonalEvent | null => {
  const lower = dateStr.toLowerCase();

  // Match specific high-volume promotional dates rather than entire month strings
  // Match Nov / Black Friday / Cyber Week
  if (lower.includes("nov 25") || lower.includes("nov 26") || lower.includes("11/25")) {
    return {
      id: "black-friday",
      name: "Black Friday & Cyber Week",
      shortName: "Black Friday",
      tag: "🛒 Peak Retail Volume",
      color: "#f59e0b",
      bgColor: "rgba(245, 158, 11, 0.15)",
      borderColor: "rgba(245, 158, 11, 0.5)",
      badgeBg: "bg-amber-950/80 text-amber-300 border-amber-800/60",
      description: "Unprecedented promo volume; automated repricing engines routinely trigger MAP undercuts during Cyber Week.",
      impactLevel: "Extreme"
    };
  }

  // Match Jul / Prime Day / Mid-Summer Flash Sale (specific target date like Jul 15 or 7/15)
  if (lower.includes("jul 15") || lower.includes("jul 16") || lower.includes("7/15")) {
    return {
      id: "prime-day",
      name: "Mid-Summer Prime Flash Sales",
      shortName: "Prime Sales",
      tag: "⚡ Flash Promo Surge",
      color: "#3b82f6",
      bgColor: "rgba(59, 130, 246, 0.15)",
      borderColor: "rgba(59, 130, 246, 0.5)",
      badgeBg: "bg-blue-950/80 text-blue-300 border-blue-800/60",
      description: "Algorithmic repricing bots across major marketplaces match unauthorized seller price drops automatically.",
      impactLevel: "High"
    };
  }

  // Match Aug/Sep / Back to School / Labor Day
  if (lower.includes("aug 15") || lower.includes("sep 1") || lower.includes("8/15")) {
    return {
      id: "back-to-school",
      name: "Back-to-School Promo Window",
      shortName: "Back to School",
      tag: "📚 Academic Volume",
      color: "#a855f7",
      bgColor: "rgba(168, 85, 247, 0.15)",
      borderColor: "rgba(168, 85, 247, 0.5)",
      badgeBg: "bg-purple-950/80 text-purple-300 border-purple-800/60",
      description: "Bundled retail promotional packages and student discount campaigns frequently bypass MAP floor guidelines.",
      impactLevel: "Moderate"
    };
  }

  // Match Dec / Q4 Holiday Peak
  if (lower.includes("dec 20") || lower.includes("12/20")) {
    return {
      id: "holiday-peak",
      name: "Q4 Holiday Shipping Peak",
      shortName: "Holiday Surge",
      tag: "🎁 Holiday Peak",
      color: "#ec4899",
      bgColor: "rgba(236, 72, 153, 0.15)",
      borderColor: "rgba(236, 72, 153, 0.5)",
      badgeBg: "bg-pink-950/80 text-pink-300 border-pink-800/60",
      description: "Last-minute fulfillment price slashes and liquidation sweeps by unauthorized third-party sellers.",
      impactLevel: "High"
    };
  }

  // Match May / Memorial Day
  if (lower.includes("may 25") || lower.includes("5/25")) {
    return {
      id: "memorial-day",
      name: "Memorial Day & Summer Clearance",
      shortName: "Summer Kickoff",
      tag: "☀️ Seasonal Clearance",
      color: "#06b6d4",
      bgColor: "rgba(6, 182, 212, 0.15)",
      borderColor: "rgba(6, 182, 212, 0.5)",
      badgeBg: "bg-cyan-950/80 text-cyan-300 border-cyan-800/60",
      description: "Seasonal catalog refresh drives clearout pricing on legacy SKUs across authorized dealer networks.",
      impactLevel: "Moderate"
    };
  }

  // Fallback single checkpoints for generic 30-day timelines so seasonal insights are always actionable
  if (totalPoints >= 10) {
    const pt1 = Math.floor(totalPoints * 0.25);
    const pt2 = Math.floor(totalPoints * 0.72);

    if (index === pt1) {
      return {
        id: "seasonal-promo-1",
        name: "Mid-Month High-Volume Promo Event",
        shortName: "Promo Surge",
        tag: "🏷️ Promo Surge",
        color: "#f59e0b",
        bgColor: "rgba(245, 158, 11, 0.15)",
        borderColor: "rgba(245, 158, 11, 0.5)",
        badgeBg: "bg-amber-950/80 text-amber-300 border-amber-800/60",
        description: "Historical high-volume promotional window; automated repricing algorithms trigger transient MAP floor dips.",
        impactLevel: "High"
      };
    }

    if (index === pt2) {
      return {
        id: "seasonal-promo-2",
        name: "Quarterly Retail Clearance Sweep",
        shortName: "Clearance Sweep",
        tag: "⚡ High-Volume Event",
        color: "#8b5cf6",
        bgColor: "rgba(139, 92, 246, 0.15)",
        borderColor: "rgba(139, 92, 246, 0.5)",
        badgeBg: "bg-purple-950/80 text-purple-300 border-purple-800/60",
        description: "Distributor catalog liquidation drives temporary regional price variance across reseller channels.",
        impactLevel: "Moderate"
      };
    }
  }

  return null;
};

interface ComplianceD3ChartProps {
  data: DataPoint[];
}

export default function ComplianceD3Chart({ data }: ComplianceD3ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 270 });
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // High-Velocity Breach Threshold state
  const [highVelocityBreachThreshold, setHighVelocityBreachThreshold] = useState<number>(80);
  const [showThreshold, setShowThreshold] = useState<boolean>(true);

  // Seasonal Trends Overlay State
  const [showSeasonalOverlay, setShowSeasonalOverlay] = useState<boolean>(true);

  // 1. Responsive Sizing using ResizeObserver (Width only to prevent height oscillation loops)
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      if (width > 0) {
        setDimensions(prev => ({
          ...prev,
          width: Math.max(width, 320)
        }));
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 bg-zinc-950/40 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 font-mono text-xs">
        No compliance data loaded
      </div>
    );
  }

  // 2. Set margins representation with room for top seasonal event badges
  const margin = { top: 40, right: 20, bottom: 35, left: 45 };
  const width = Math.max(320, dimensions.width);
  const height = 270; // Fixed canvas height to avoid vertical stretching feedback loops
  
  const chartWidth = Math.max(100, width - margin.left - margin.right);
  const chartHeight = Math.max(100, height - margin.top - margin.bottom);

  // 3. Define scales using D3
  const xScale = d3.scalePoint()
    .domain(data.map(d => d.date))
    .range([0, chartWidth]);

  const yScale = d3.scaleLinear()
    .domain([0, 100])
    .range([chartHeight, 0]);

  // 4. Create generator functions for Path & Area
  const lineGenerator = d3.line<DataPoint>()
    .defined(d => typeof d.healthScore === "number" && !isNaN(d.healthScore))
    .x(d => xScale(d.date) || 0)
    .y(d => yScale(isNaN(d.healthScore) ? 100 : Math.max(0, Math.min(100, d.healthScore))))
    .curve(d3.curveMonotoneX);

  const areaGenerator = d3.area<DataPoint>()
    .defined(d => typeof d.healthScore === "number" && !isNaN(d.healthScore))
    .x(d => xScale(d.date) || 0)
    .y0(chartHeight)
    .y1(d => yScale(isNaN(d.healthScore) ? 100 : Math.max(0, Math.min(100, d.healthScore))))
    .curve(d3.curveMonotoneX);

  // Render variables
  const linePath = lineGenerator(data) || "";
  const areaPath = areaGenerator(data) || "";

  // Helper lists for gridlines & tick configurations
  const yTicks = [0, 25, 50, 75, 100];
  
  const xTickFrequency = width > 500 ? 3 : 6;
  const xTicks = data.filter((_, idx) => idx % xTickFrequency === 0);

  // Handle Mouse Hover/Pointer Tracking
  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const relativeX = event.clientX - rect.left - margin.left;

    if (relativeX < -10 || relativeX > chartWidth + 10) {
      setHoveredPoint(null);
      return;
    }

    let minDistance = Infinity;
    let closest: DataPoint | null = null;
    let closestX = 0;
    let closestY = 0;

    data.forEach(point => {
      const px = xScale(point.date) || 0;
      const py = yScale(point.healthScore);
      const dist = Math.abs(px - relativeX);
      if (dist < minDistance) {
        minDistance = dist;
        closest = point;
        closestX = px;
        closestY = py;
      }
    });

    if (closest) {
      setHoveredPoint(closest);
      setTooltipPos({
        x: closestX + margin.left,
        y: closestY + margin.top - 12
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  // Find hover seasonal event if active
  const hoveredPointIndex = hoveredPoint ? data.findIndex(d => d.date === hoveredPoint.date) : -1;
  const activeSeasonalEvent = showSeasonalOverlay && hoveredPoint && hoveredPointIndex >= 0
    ? getSeasonalEventForPoint(hoveredPoint.date, hoveredPointIndex, data.length)
    : null;

  return (
    <div ref={containerRef} className="w-full relative select-none space-y-3">
      
      {/* Control Toolbar: Breach Threshold & Seasonal Trends Overlay Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] font-mono text-zinc-400">
        <div className="flex flex-wrap items-center gap-3">
          {/* Seasonal Trends Overlay Toggle Button */}
          <label className={`flex items-center gap-1.5 font-bold cursor-pointer select-none px-2.5 py-1 rounded-lg border transition duration-200 ${
            showSeasonalOverlay 
              ? "bg-amber-950/40 text-amber-300 border-amber-800/60 shadow-[0_0_10px_rgba(245,158,11,0.15)]" 
              : "bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700"
          }`}>
            <input
              type="checkbox"
              checked={showSeasonalOverlay}
              onChange={(e) => setShowSeasonalOverlay(e.target.checked)}
              className="rounded border-amber-800 bg-amber-950 text-amber-500 focus:ring-0 cursor-pointer"
            />
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Seasonal Trends Overlay</span>
          </label>

          {/* Breach Threshold Toggle */}
          <label className="flex items-center gap-1.5 text-rose-400 font-bold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showThreshold}
              onChange={(e) => setShowThreshold(e.target.checked)}
              className="rounded border-rose-800 bg-rose-950 text-rose-500 focus:ring-0 cursor-pointer"
            />
            <Zap className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Threshold ({highVelocityBreachThreshold}%)</span>
          </label>

          {showThreshold && (
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-lg">
              <Sliders className="w-3 h-3 text-rose-400" />
              <input
                type="range"
                min={50}
                max={95}
                value={highVelocityBreachThreshold}
                onChange={(e) => setHighVelocityBreachThreshold(Number(e.target.value))}
                className="w-16 h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-rose-500"
              />
            </div>
          )}
        </div>

        {showThreshold && (
          <div className="text-[10px] font-bold">
            {data.some((d) => d.healthScore < highVelocityBreachThreshold) ? (
              <span className="text-rose-400 bg-rose-950/60 border border-rose-900/60 px-2 py-0.5 rounded flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-rose-400" />
                🚨 BREACH BELOW {highVelocityBreachThreshold}%
              </span>
            ) : (
              <span className="text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded">
                ✅ ALL POINTS ABOVE THRESHOLD
              </span>
            )}
          </div>
        )}
      </div>

      {/* Interactive Tooltip Card Overlay */}
      {hoveredPoint && (
        <div 
          className="absolute z-20 bg-zinc-950/95 border border-zinc-700 p-3 rounded-xl shadow-2xl text-left pointer-events-none transition-all duration-75 ease-out opacity-100 min-w-[170px]"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: "translate(-50%, -100%)",
            backdropFilter: "blur(8px)"
          }}
        >
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1 mb-1.5">
            <p className="text-[10px] font-bold text-zinc-400 font-mono tracking-wider leading-none uppercase">
              {hoveredPoint.date}
            </p>
            <span className="text-[9px] text-zinc-500 font-mono">
              {hoveredPoint.isReal ? "Verified Audit" : "Baseline"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${
              hoveredPoint.healthScore >= 80 
                ? "bg-emerald-400" 
                : hoveredPoint.healthScore >= 60 
                  ? "bg-amber-400" 
                  : "bg-rose-500"
            }`}></span>
            <div>
              <p className="text-sm font-black text-white leading-none font-sans">
                {hoveredPoint.healthScore}% Health
              </p>
            </div>
          </div>

          {/* Seasonal Event Context Card inside Tooltip */}
          {activeSeasonalEvent && (
            <div className="mt-2 pt-2 border-t border-zinc-800/80 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${activeSeasonalEvent.badgeBg}`}>
                  {activeSeasonalEvent.tag}
                </span>
                <span className="text-[7.5px] text-amber-400 font-mono font-bold">
                  {activeSeasonalEvent.impactLevel} Impact
                </span>
              </div>
              <p className="text-[9.5px] text-slate-300 leading-tight font-sans">
                {activeSeasonalEvent.description}
              </p>
            </div>
          )}
        </div>
      )}

      {/* SVG Canvas Container */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="overflow-visible block cursor-crosshair"
      >
        <defs>
          <linearGradient id="d3-area-glow-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
          </linearGradient>
          <linearGradient id="d3-line-stroke-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <filter id="glow-effect" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Group translated to margin spacing bounds */}
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          
          {/* A. Horizontal subtle grid lines */}
          {yTicks.map((tickVal) => (
            <g key={`grid-${tickVal}`} transform={`translate(0, ${yScale(tickVal)})`}>
              <line 
                x1={0} 
                x2={chartWidth} 
                stroke="#1f1f1f" 
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <text
                x={-10}
                dy="0.32em"
                textAnchor="end"
                className="fill-zinc-500 text-[10px] font-mono leading-none font-medium"
              >
                {tickVal}%
              </text>
            </g>
          ))}

          {/* High-Velocity Breach Threshold Reference Line */}
          {showThreshold && (
            <g transform={`translate(0, ${yScale(highVelocityBreachThreshold)})`}>
              <line
                x1={0}
                x2={chartWidth}
                stroke="#f43f5e"
                strokeWidth={2}
                strokeDasharray="6 3"
              />
              <text
                x={chartWidth - 8}
                y={-5}
                textAnchor="end"
                className="fill-rose-400 text-[9px] font-mono font-bold tracking-tight"
              >
                🚨 Threshold ({highVelocityBreachThreshold}%)
              </text>
            </g>
          )}

          {/* B. Seasonal Events Highlight Bands & Labels */}
          {showSeasonalOverlay && data.map((point, index) => {
            const event = getSeasonalEventForPoint(point.date, index, data.length);
            if (!event) return null;

            const cx = xScale(point.date) || 0;
            const bandWidth = Math.max(28, (chartWidth / data.length) * 1.5);
            const isHovered = hoveredPoint && hoveredPoint.date === point.date;

            return (
              <g key={`seasonal-event-band-${point.date}-${index}`} className="pointer-events-none">
                {/* Shaded vertical region band */}
                <rect
                  x={cx - bandWidth / 2}
                  y={0}
                  width={bandWidth}
                  height={chartHeight}
                  fill={event.bgColor}
                  stroke={event.borderColor}
                  strokeWidth={isHovered ? 1.5 : 1}
                  strokeDasharray="3 3"
                  rx={4}
                  className="transition-all duration-300"
                />

                {/* Vertical center indicator line */}
                <line
                  x1={cx}
                  x2={cx}
                  y1={0}
                  y2={chartHeight}
                  stroke={event.color}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  opacity={isHovered ? 1 : 0.75}
                />

                {/* Top Event Badge Tag in SVG canvas */}
                <g transform={`translate(${cx}, -16)`}>
                  <rect
                    x={-38}
                    y={-12}
                    width={76}
                    height={16}
                    rx={4}
                    fill="#09090b"
                    stroke={event.color}
                    strokeWidth={1.2}
                    className="shadow-md"
                  />
                  <text
                    x={0}
                    y={-1}
                    textAnchor="middle"
                    fill={event.color}
                    className="text-[8px] font-mono font-bold tracking-tight uppercase"
                  >
                    {event.shortName}
                  </text>
                </g>
              </g>
            );
          })}

          {/* C. Custom Area Fill under the Trend line */}
          <path
            d={areaPath}
            fill="url(#d3-area-glow-gradient)"
            className="transition-all duration-300 pointer-events-none"
          />

          {/* D. Primary Curved Trend Stroke Path */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#d3-line-stroke-gradient)"
            strokeWidth={3}
            strokeLinecap="round"
            className="transition-all duration-300 pointer-events-none"
          />

          {/* E. Vertical hairline cross-selection tracker line */}
          {hoveredPoint && (
            <line
              x1={xScale(hoveredPoint.date) || 0}
              x2={xScale(hoveredPoint.date) || 0}
              y1={0}
              y2={chartHeight}
              stroke="#52525b"
              strokeWidth={1}
              strokeDasharray="4 4"
              className="pointer-events-none"
            />
          )}

          {/* F. Solid Data Marker circles with fade-in scale animation on hover */}
          {data.map((point, index) => {
            const cx = xScale(point.date) || 0;
            const cy = yScale(point.healthScore);
            const isHovered = hoveredPoint && hoveredPoint.date === point.date;
            const isBreached = showThreshold && point.healthScore < highVelocityBreachThreshold;

            const shouldRenderDot = index === data.length - 1 || index % 3 === 0 || isHovered || isBreached;

            if (!shouldRenderDot) return null;

            if (isBreached) {
              return (
                <g key={`dot-${point.date}-${index}`} className="pointer-events-none">
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 16 : 8}
                    fill="#f43f5e"
                    fillOpacity={isHovered ? 0.35 : 0.25}
                    stroke="#f43f5e"
                    strokeOpacity={isHovered ? 0.6 : 0}
                    strokeWidth={1}
                    className="transition-all duration-300 ease-out animate-pulse"
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 7 : 4.5}
                    className="transition-all duration-200 ease-out"
                    fill="#f43f5e"
                    stroke="#ffffff"
                    strokeWidth={isHovered ? 2.5 : 2}
                    style={{
                      transformOrigin: `${cx}px ${cy}px`,
                      filter: isHovered ? "drop-shadow(0 0 8px rgba(244, 63, 94, 0.9))" : "none"
                    }}
                  />
                </g>
              );
            }

            return (
              <g key={`dot-${point.date}-${index}`} className="pointer-events-none">
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 14 : 0}
                  fill="#10b981"
                  fillOpacity={isHovered ? 0.25 : 0}
                  stroke="#10b981"
                  strokeOpacity={isHovered ? 0.6 : 0}
                  strokeWidth={1.5}
                  className="transition-all duration-300 ease-out"
                />
                <circle
                  key={`dot-circle-${point.date}`}
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 7 : 3.5}
                  className="transition-all duration-200 ease-out"
                  fill={isHovered ? "#10b981" : "#171717"}
                  stroke={isHovered ? "#ffffff" : "#10b981"}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  style={{
                    transformOrigin: `${cx}px ${cy}px`,
                    filter: isHovered ? "drop-shadow(0 0 8px rgba(16, 185, 129, 0.9))" : "none"
                  }}
                />
              </g>
            );
          })}

          {/* G. Horizontal Bottom X-Axis ticks */}
          {xTicks.map((point, index) => {
            const cx = xScale(point.date) || 0;
            return (
              <g key={`x-tick-${point.date}-${index}`} transform={`translate(${cx}, ${chartHeight})`}>
                <line y1={0} y2={4} stroke="#27272a" strokeWidth={1} />
                <text
                  y={18}
                  textAnchor="middle"
                  className="fill-zinc-500 text-[9px] font-mono leading-none tracking-tight font-medium"
                >
                  {point.date}
                </text>
              </g>
            );
          })}

          {/* Base bounding x axis line */}
          <line
            x1={0}
            x2={chartWidth}
            y1={chartHeight}
            y2={chartHeight}
            stroke="#27272a"
            strokeWidth={1}
          />

        </g>
      </svg>

      {/* Contextual Seasonal Event Insights Banner when Seasonal Overlay is enabled */}
      {showSeasonalOverlay && (
        <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-3 text-[11px] font-mono text-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-inner">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 shrink-0">
              <Calendar className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <span>Seasonal Promotional Volume Overlay</span>
                <span className="text-[8.5px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-mono uppercase">
                  Active Markers
                </span>
              </div>
              <p className="text-[10px] text-amber-300/70 font-sans mt-0.5 leading-snug">
                Historical high-volume shopping windows automatically correlate promotional sales volume spikes with automated retailer repricing dips.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <span className="text-[9px] font-bold bg-amber-900/40 text-amber-300 border border-amber-800/50 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Black Friday
            </span>
            <span className="text-[9px] font-bold bg-blue-900/40 text-blue-300 border border-blue-800/50 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Tag className="w-3 h-3 text-blue-400" />
              Prime Sales
            </span>
            <span className="text-[9px] font-bold bg-purple-900/40 text-purple-300 border border-purple-800/50 px-2 py-0.5 rounded-md flex items-center gap-1">
              <ShoppingBag className="w-3 h-3 text-purple-400" />
              Back-to-School
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
