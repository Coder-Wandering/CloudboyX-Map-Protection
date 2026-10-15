import React from "react";

interface CloudboyLogoProps {
  className?: string; // Standard className support
  size?: number;      // Size in pixels (default 40)
  animated?: boolean; // Enable gear rotation animation
}

export default function CloudboyLogo({ className = "", size = 40, animated = true }: CloudboyLogoProps) {
  // Safe default dimensions
  const width = size;
  const height = size;

  // React helper to generate the mathematical gear path
  const getGearPath = (cx: number, cy: number, rOut: number, rIn: number, teeth: number, rotation: number) => {
    const pathParts: string[] = [];
    const anglePerTooth = (2 * Math.PI) / teeth;
    
    for (let i = 0; i < teeth; i++) {
      const angle = (i * anglePerTooth) + (rotation * Math.PI / 180);
      
      // Each tooth has 4 profile vertices to look like an actual gear tooth (trapezoidal bevel)
      const a0 = angle;
      const a1 = angle + anglePerTooth * 0.20;
      const a2 = angle + anglePerTooth * 0.40;
      const a3 = angle + anglePerTooth * 0.50;
      const a4 = angle + anglePerTooth * 0.70;
      
      // Outer tooth peaks
      const x1 = cx + Math.cos(a1) * rOut;
      const y1 = cy + Math.sin(a1) * rOut;
      const x2 = cx + Math.cos(a2) * rOut;
      const y2 = cy + Math.sin(a2) * rOut;
      
      // Inner tooth valley
      const x3 = cx + Math.cos(a3) * rIn;
      const y3 = cy + Math.sin(a3) * rIn;
      const x4 = cx + Math.cos(a4) * rIn;
      const y4 = cy + Math.sin(a4) * rIn;
      
      if (i === 0) {
        // Start from base of first tooth
        const x0 = cx + Math.cos(a0) * rIn;
        const y0 = cy + Math.sin(a0) * rIn;
        pathParts.push(`M ${x0} ${y0}`);
      }
      
      pathParts.push(`L ${x1} ${y1}`);
      pathParts.push(`L ${x2} ${y2}`);
      pathParts.push(`L ${x3} ${y3}`);
      pathParts.push(`L ${x4} ${y4}`);
    }
    
    pathParts.push("Z");
    return pathParts.join(" ");
  };

  // Pre-calculated beautiful paths matching the user's uploaded logo exactly:
  // Red C shape left
  const redCPath = "M 41,21 A 33 33 0 0 0 41,87 L 41,73 A 19 19 0 0 1 41,35 Z";
  
  // Black Hook right (S-like sweep)
  const blackHookPath = "M 45,87 C 68,87 81,72 81,49 C 81,34 83,25 93,25 L 93,37 C 87,37 86,41 86,49 C 86,67 76,73 45,73 Z";

  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 110 110" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none shrink-0 ${className}`}
      aria-label="Cloudboy Protect Logo"
    >
      <defs>
        {/* Subtle radial and linear gradient overlays for premium 3D lighting */}
        <linearGradient id="redGradient" x1="15" y1="20" x2="45" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff4545" />
          <stop offset="50%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>

        <linearGradient id="blackGradient" x1="45" y1="25" x2="95" y2="87" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3f3f46" />
          <stop offset="30%" stopColor="#18181b" />
          <stop offset="100%" stopColor="#09090b" />
        </linearGradient>

        <linearGradient id="silverGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#cbd5e1" />
          <stop offset="70%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        <linearGradient id="innerHoleGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#020202" />
          <stop offset="100%" stopColor="#1e1e24" />
        </linearGradient>

        {/* Drop shadow for depth feel */}
        <filter id="logoShadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="1.5" dy="2.5" stdDeviation="2.5" floodColor="#000" floodOpacity="0.65" />
        </filter>

        <style>
          {`
            @keyframes spin-clockwise {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes spin-counter {
              from { transform: rotate(0deg); }
              to { transform: rotate(-360deg); }
            }
            .gear-top {
              transform-origin: 59px 28px;
              animation: spin-clockwise 16s linear infinite;
            }
            .gear-bot {
              transform-origin: 47px 57px;
              animation: spin-counter 16s linear infinite;
            }
            .animated-logo:hover .gear-top {
              animation-duration: 4s;
            }
            .animated-logo:hover .gear-bot {
              animation-duration: 4s;
            }
          `}
        </style>
      </defs>

      <g filter="url(#logoShadow)" className={animated ? "animated-logo" : ""}>
        {/* Left red C-bracket */}
        <path 
          d={redCPath} 
          fill="url(#redGradient)" 
          stroke="#ef4444" 
          strokeWidth="0.75" 
          strokeLinejoin="round" 
        />

        {/* Right black J-hook */}
        <path 
          d={blackHookPath} 
          fill="url(#blackGradient)" 
          stroke="#27272a" 
          strokeWidth="0.75" 
          strokeLinejoin="round" 
        />

        {/* Bottom Gear - Black (intermeshes with Top Gear) */}
        <g className="gear-bot">
          <path 
            d={getGearPath(47, 57, 14.5, 9.5, 10, 18)} 
            fill="url(#blackGradient)" 
            stroke="#27272a" 
            strokeWidth="0.5" 
          />
          {/* Silver hub ring */}
          <circle cx="47" cy="57" r="6.2" fill="url(#silverGradient)" stroke="#475569" strokeWidth="0.5" />
          <circle cx="47" cy="57" r="4.2" fill="url(#innerHoleGradient)" />
        </g>

        {/* Top Gear - Red */}
        <g className="gear-top">
          <path 
            d={getGearPath(59, 28, 14.5, 9.5, 10, 0)} 
            fill="url(#redGradient)" 
            stroke="#b91c1c" 
            strokeWidth="0.5" 
          />
          {/* Silver hub ring */}
          <circle cx="59" cy="28" r="6.2" fill="url(#silverGradient)" stroke="#475569" strokeWidth="0.5" />
          <circle cx="59" cy="28" r="4.2" fill="url(#innerHoleGradient)" />
        </g>
      </g>
    </svg>
  );
}
