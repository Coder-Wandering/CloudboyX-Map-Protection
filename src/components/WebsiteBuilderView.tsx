import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, Trash2, ArrowUp, ArrowDown, Edit3, Eye, Download, Copy, 
  RotateCcw, Code, Monitor, Tablet, Smartphone, Sparkles, Check, 
  Layers, Settings, ChevronDown, ChevronUp, Image, FileText, Globe, 
  Link as LinkIcon, RefreshCw, Undo, PanelRight, Play, GripVertical,
  ArrowLeft, Maximize2, ChevronRight, Wand2, ShoppingBag
} from "lucide-react";

// Define Types for Website Builder
interface SectionBlock {
  id: string;
  type: "navbar" | "hero" | "features" | "pricing" | "testimonials" | "faq" | "cta" | "contact" | "footer";
  title: string;
  fields: {
    // Shared
    bgColor: "slate-dark" | "blue-dark" | "light-gray" | "clean-white" | "gradient-indigo";
    textColor: "light" | "dark";
    paddingY: "py-3" | "py-4" | "py-5" | "py-6";
    
    // Navbar specific
    brandName?: string;
    navLinks?: Array<{ label: string; href: string }>;
    ctaText?: string;
    ctaHref?: string;
    
    // Hero specific
    heading?: string;
    subheading?: string;
    buttonPrimaryText?: string;
    buttonPrimaryHref?: string;
    buttonSecondaryText?: string;
    buttonSecondaryHref?: string;
    imageUrl?: string;
    layout?: "centered" | "split";
    
    // Features specific
    featuresList?: Array<{ icon: string; title: string; desc: string }>;
    
    // Pricing specific
    pricingTiers?: Array<{
      tierName: string;
      price: string;
      period: string;
      badge?: string;
      features: string[];
      buttonText: string;
      isHighlighted: boolean;
    }>;
    
    // Testimonials specific
    testimonialsList?: Array<{ quote: string; author: string; role: string; avatarUrl?: string }>;
    
    // FAQ specific
    faqList?: Array<{ question: string; answer: string }>;
    
    // CTA specific
    ctaHeading?: string;
    ctaSubheading?: string;
    ctaButtonText?: string;
    ctaButtonHref?: string;

    // Contact specific
    contactHeading?: string;
    contactSubheading?: string;
    contactEmail?: string;
    contactPhone?: string;
    buttonText?: string;

    // Footer specific
    footerText?: string;
    socialIconLabels?: string[];

    // Custom design and typography fields
    headingFont?: string;
    bodyFont?: string;
    headingColor?: string;
    bodyColor?: string;
    headingSize?: string;
    textAlign?: string;
    btnRadius?: string;
    borderStyle?: string;
  };
}

interface LibrarySectionTemplate {
  id: string;
  name: string;
  description: string;
  category: "hero" | "features" | "pricing" | "contact" | "testimonials" | "faq" | "navigation" | "footer";
  icon: string;
  block: Omit<SectionBlock, "id">;
}

const LIBRARY_SECTION_TEMPLATES: LibrarySectionTemplate[] = [
  {
    id: "lib-hero-saas-clean",
    name: "Modern SaaS Centerpiece",
    description: "Centered, spacious design with prominent split actions and mock preview image. Perfect for modern web products.",
    category: "hero",
    icon: "🚀",
    block: {
      type: "hero",
      title: "Hero: SaaS Centerpiece",
      fields: {
        bgColor: "gradient-indigo",
        textColor: "light",
        paddingY: "py-6",
        heading: "Manage Complex Deployments and Infrastructure on autopilot",
        subheading: "Gain complete regulatory compliance, real-time latency reporting, and white-labeled audit exports — all from one beautiful workspace.",
        buttonPrimaryText: "Start Free 14-day Trial",
        buttonPrimaryHref: "#pricing",
        buttonSecondaryText: "Request Technical Demo",
        buttonSecondaryHref: "#features",
        imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60",
        layout: "centered"
      }
    }
  },
  {
    id: "lib-hero-split-cyber",
    name: "Bold Split Cyber-Guard",
    description: "Asymmetric split layout with safe, dark futuristic aesthetic designed for software compliance or cloud protection.",
    category: "hero",
    icon: "🛡️",
    block: {
      type: "hero",
      title: "Hero: Split Cyber-Guard",
      fields: {
        bgColor: "slate-dark",
        textColor: "light",
        paddingY: "py-6",
        heading: "Enterprise Threat Vector Sentinel Protection",
        subheading: "Block automated price scraping, enforce MAP compliance policies across external networks, and protect reseller integrity seamlessly.",
        buttonPrimaryText: "Deploy Sentinel Node",
        buttonPrimaryHref: "#contact",
        buttonSecondaryText: "Read Cybersecurity Brochure",
        buttonSecondaryHref: "#features",
        imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=60",
        layout: "split"
      }
    }
  },
  {
    id: "lib-hero-digital-agency",
    name: "Aesthetic Creative Minimal",
    description: "Elegant off-white background focusing on pure typography with left-to-right imagery.",
    category: "hero",
    icon: "⚡",
    block: {
      type: "hero",
      title: "Hero: Creative Minimalist",
      fields: {
        bgColor: "light-gray",
        textColor: "dark",
        paddingY: "py-6",
        heading: "We design flawless interfaces for outstanding teams",
        subheading: "Bespoke digital design, WebFlow & React engineering, and strategic positioning to make your agency or product stand out instantly.",
        buttonPrimaryText: "Consult Our Portfolio",
        buttonPrimaryHref: "#portfolio",
        buttonSecondaryText: "Schedule Sprint Session",
        buttonSecondaryHref: "#contact",
        imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=60",
        layout: "split"
      }
    }
  },
  {
    id: "lib-features-bento",
    name: "Three-way Benefit Bento Grid",
    description: "A gorgeous 3-column feature grid showcasing micro-icons, bold core statements, and concise feature descriptions.",
    category: "features",
    icon: "⚡",
    block: {
      type: "features",
      title: "Features: Benefit Bento Grid",
      fields: {
        bgColor: "clean-white",
        textColor: "dark",
        paddingY: "py-5",
        featuresList: [
          { icon: "⚡", title: "Sub-second Analysis", desc: "Our real-time crawler operates in milliseconds to discover MAP breaches globally." },
          { icon: "🛡️", title: "Ironclad Security", desc: "No credentials to leak. Safe, sandboxed API queries and OAuth endpoints protect your store integrity." },
          { icon: "📈", title: "Reseller Intelligence", desc: "Get dynamic analytics plotting historical pricing performance across retail nodes." }
        ]
      }
    }
  },
  {
    id: "lib-features-corporate",
    name: "Asymmetrical Feature Highlights",
    description: "Spacious dark row with structured checklist details to validate product features cleanly.",
    category: "features",
    icon: "🌟",
    block: {
      type: "features",
      title: "Features: High-Impact Highlighting",
      fields: {
        bgColor: "blue-dark",
        textColor: "light",
        paddingY: "py-5",
        featuresList: [
          { icon: "💎", title: "Precision Mapping", desc: "Geo-targeted scanning captures pricing data across isolated regional sub-markets." },
          { icon: "🔔", title: "Slack / Email Broadcasts", desc: "Immediate visual ping cards are transmitted automatically when a pricing discrepancy occurs." },
          { icon: "🔄", title: "Smart Remediation", desc: "Generate legal notices or contact information with our AI strategic copywriting helper." }
        ]
      }
    }
  },
  {
    id: "lib-pricing-tri",
    name: "Popular Trio Price Grid",
    description: "Clean standard cloud pricing matrix featuring a strongly highlighted middle tier to maximize professional sign-ups.",
    category: "pricing",
    icon: "💳",
    block: {
      type: "pricing",
      title: "Pricing: SaaS Triple Tier",
      fields: {
        bgColor: "light-gray",
        textColor: "dark",
        paddingY: "py-5",
        pricingTiers: [
          {
            tierName: "Solo Builder",
            price: "29",
            period: "mo",
            features: [
              "Up to 2 monitored domains",
              "Standard daily reporting",
              "Access to public forums"
            ],
            buttonText: "Join Solo",
            isHighlighted: false
          },
          {
            tierName: "Growth Scaling",
            price: "89",
            period: "mo",
            badge: "Best Value",
            features: [
              "Up to 15 monitored domains",
              "Sub-hour scrapers",
              "Webhooks and Slack integration",
              "Priority chat team support"
            ],
            buttonText: "Start Free Trial",
            isHighlighted: true
          },
          {
            tierName: "Elite Corp",
            price: "249",
            period: "mo",
            features: [
              "Unlimited environments",
              "Continuous live monitoring",
              "Dedicated technical engineer",
              "Custom SLA guarantees"
            ],
            buttonText: "Schedule Meeting",
            isHighlighted: false
          }
        ]
      }
    }
  },
  {
    id: "lib-contact-full",
    name: "Dual-Column Contact & Support",
    description: "Responsive 2-column contact section featuring direct email/phone buttons and a modern lead-capture form layout.",
    category: "contact",
    icon: "✉",
    block: {
      type: "contact",
      title: "Contact: Dual-Column Form",
      fields: {
        bgColor: "slate-dark",
        textColor: "light",
        paddingY: "py-5",
        contactHeading: "Initiate Global Scaling Discussions",
        contactSubheading: "Our engineering operations team is online 24/7/365. Reach out for technical consultation.",
        contactEmail: "ops@compliance-shield.io",
        contactPhone: "+1 (800) 555-SAFE",
        buttonText: "Submit Project Specification"
      }
    }
  },
  {
    id: "lib-contact-newsletter",
    name: "Interactive Lead Strip",
    description: "Compact high-contrast visual CTA strip optimized for newsletter and general signup captures.",
    category: "contact",
    icon: "📢",
    block: {
      type: "contact",
      title: "Contact: Newsletter Signup",
      fields: {
        bgColor: "gradient-indigo",
        textColor: "light",
        paddingY: "py-4",
        contactHeading: "Get Weekly Compliance Audits",
        contactSubheading: "Join our community of over 12,000 security directors getting our intelligence updates directly in their inbox.",
        contactEmail: "updates@compliance-shield.io",
        contactPhone: "N/A",
        buttonText: "Subscribe Free"
      }
    }
  },
  {
    id: "lib-testimonials-grid",
    name: "High-Credibility Customer Grid",
    description: "A clean dual-column quote grid highlighting specific customer trust testimonials with name and role titles.",
    category: "testimonials",
    icon: "💬",
    block: {
      type: "testimonials",
      title: "Testimonials: User Social Proof",
      fields: {
        bgColor: "clean-white",
        textColor: "dark",
        paddingY: "py-5",
        testimonialsList: [
          {
            quote: "Using the CloudboyX Builder we deployed our compliance protection portals in hours. It's saved our security team hundreds of hours auditing manually.",
            author: "Sarah Jenkins",
            role: "Director of Brand Integrity at SecureStore"
          },
          {
            quote: "The visual modular system combined with the AI strategist let our marketing department update promotional copy on the fly.",
            author: "Tobias Lindt",
            role: "Co-Founder and CTO of WebOps Swiss"
          }
        ]
      }
    }
  },
  {
    id: "lib-features-shipping",
    name: "Logistics & Fulfillment Channels",
    description: "Highlight delivery speed, volumetric cargo calculations, and cross-border carrier compliance features.",
    category: "features",
    icon: "🚚",
    block: {
      type: "features",
      title: "Features: Logistics Controls",
      fields: {
        bgColor: "blue-dark",
        textColor: "light",
        paddingY: "py-5",
        featuresList: [
          { icon: "📦", title: "Volumetric Auto-Sizing", desc: "Instantly calculate dimensional volumetric weights to optimize box dimensions and lower billable cost weight boundaries." },
          { icon: "✈️", title: "Global Carrier Matrix", desc: "Select carrier rates across FedEx, UPS, USPS, and DHL instantly, routing through the most automated, cost-efficient nodes." },
          { icon: "🏷️", title: "Instant Label Despatch", desc: "Generate standards-compliant packing barcodes and printable shipping routing slips directly in the dashboard on demand." }
        ]
      }
    }
  },
  {
    id: "lib-pricing-shipping",
    name: "Shipping Service Level Tiers",
    description: "Service levels and courier speed categories suited to modern distribution and e-commerce portfolios.",
    category: "pricing",
    icon: "🚢",
    block: {
      type: "pricing",
      title: "Pricing: Shipping Class Tiers",
      fields: {
        bgColor: "light-gray",
        textColor: "dark",
        paddingY: "py-5",
        pricingTiers: [
          {
            tierName: "Standard Ground",
            price: "12",
            period: "shipment",
            features: [
              "Estimated 3-5 day transit window",
              "Integrated carrier tracking num",
              "Standard packaging options"
            ],
            buttonText: "Book Ground",
            isHighlighted: false
          },
          {
            tierName: "Express Air Freight",
            price: "36",
            period: "shipment",
            badge: "Most Selected",
            features: [
              "Guaranteed 1-2 day delivery",
              "Volumetric weight offsets applied",
              "Priority warehouse handling status",
              "Hazardous materials certified check"
            ],
            buttonText: "Book Express Air",
            isHighlighted: true
          },
          {
            tierName: "Overnight Cargo Hub",
            price: "72",
            period: "shipment",
            features: [
              "Next-day regional delivery",
              "Direct terminal transfer feeds",
              "White-label webhook alerts",
              "Sameday dispatch priority route"
            ],
            buttonText: "Book Overnight Dispatch",
            isHighlighted: false
          }
        ]
      }
    }
  }
];

// Interactive Blueprint miniature schematic component for layout thumbnails
const TemplateThumbnail = ({ block }: { block: any }) => {
  const f = block.fields || {};
  
  // Choose colors based on the template fields definition to create high-fidelity micro-skeletons
  let bgClass = "bg-[#0b0c10]";
  let borderClass = "border-slate-800/80";
  let activeDotClass = "bg-indigo-500";

  switch (f.bgColor) {
    case "slate-dark":
      bgClass = "bg-[#0F172A]";
      borderClass = "border-slate-800";
      activeDotClass = "bg-indigo-400";
      break;
    case "blue-dark":
      bgClass = "bg-[#070e1b]";
      borderClass = "border-slate-900";
      activeDotClass = "bg-emerald-400";
      break;
    case "light-gray":
      bgClass = "bg-slate-50";
      borderClass = "border-slate-200";
      activeDotClass = "bg-indigo-600";
      break;
    case "gradient-indigo":
      bgClass = "bg-gradient-to-br from-indigo-700 to-indigo-950";
      borderClass = "border-indigo-650";
      activeDotClass = "bg-emerald-450";
      break;
    default:
      bgClass = "bg-white";
      borderClass = "border-slate-100";
      activeDotClass = "bg-indigo-600";
  }

  return (
    <div className={`w-full aspect-[4/3] sm:aspect-[16/10] ${bgClass} border ${borderClass} rounded-xl p-3.5 flex flex-col justify-between overflow-hidden relative shadow-inner select-none`}>
      {/* Visual representation based on block type */}
      {block.type === "navbar" && (
        <div className="space-y-4 w-full my-auto">
          <div className="flex items-center justify-between border-b pb-2 border-dashed border-slate-500/25">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded ${activeDotClass}`}></div>
              <div className="w-8 h-1 bg-slate-400/80 rounded-full"></div>
            </div>
            <div className="flex gap-1">
              <div className="w-5 h-0.5 bg-slate-500/40 rounded-full"></div>
              <div className="w-5 h-0.5 bg-slate-500/40 rounded-full"></div>
            </div>
            <div className={`w-6 h-2 rounded-full ${activeDotClass} opacity-90`}></div>
          </div>
          <div className="text-center font-mono text-[9px] text-slate-550/80 tracking-wider">Nav Hierarchy Strip</div>
        </div>
      )}

      {block.type === "hero" && (
        f.layout === "split" ? (
          <div className="grid grid-cols-2 gap-2 h-full items-center">
            <div className="space-y-2 text-left">
              <div className={`w-1/3 h-1 ${activeDotClass} rounded-full`}></div>
              <div className="space-y-1">
                <div className="w-full h-1.5 bg-slate-450/80 rounded-full"></div>
                <div className="w-11/12 h-1.5 bg-slate-450/80 rounded-full"></div>
                <div className="w-3/4 h-1.5 bg-slate-500/60 rounded-full"></div>
              </div>
              <div className="flex gap-1 pt-1">
                <div className={`w-6 h-2 rounded ${activeDotClass}`}></div>
                <div className="w-6 h-2 rounded bg-slate-500/30"></div>
              </div>
            </div>
            <div className="w-full h-4/5 rounded-lg border border-dashed border-slate-500/30 bg-slate-900/45 flex items-center justify-center p-1 overflow-hidden">
              <div className="w-full h-full rounded bg-slate-950/20 border border-slate-800/40 flex flex-col justify-end p-1.5">
                <div className="w-1/2 h-1 bg-slate-700/60 rounded mb-0.5"></div>
                <div className="w-1/3 h-1 bg-slate-700/40 rounded"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
            <div className={`w-1/4 h-1 ${activeDotClass} rounded-full`}></div>
            <div className="w-5/6 h-2.5 bg-slate-450/85 rounded-full"></div>
            <div className="w-2/3 h-1.5 bg-slate-500/60 rounded-full"></div>
            <div className="flex gap-1.5 justify-center pt-1 w-full">
              <div className={`w-8 h-2 rounded ${activeDotClass}`}></div>
              <div className="w-8 h-2 rounded bg-slate-500/30"></div>
            </div>
          </div>
        )
      )}

      {block.type === "features" && (
        <div className="flex flex-col justify-between h-full w-full py-1">
          <div className="text-center space-y-1 mb-2">
            <div className="w-14 h-1.5 bg-slate-400/90 rounded-full mx-auto"></div>
            <div className="w-10 h-0.5 bg-slate-500/50 rounded-full mx-auto"></div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 flex-1 items-stretch">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-500/5 border border-slate-550/15 rounded-lg p-1.5 flex flex-col justify-between">
                <div className={`w-2.5 h-2.5 rounded-full ${activeDotClass} bg-opacity-95`}></div>
                <div className="space-y-1 mt-1.5">
                  <div className="w-full h-0.5 bg-slate-450/85 rounded-full"></div>
                  <div className="w-5/6 h-0.5 bg-slate-500/55 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {block.type === "pricing" && (
        <div className="flex flex-col justify-between h-full w-full py-1">
          <div className="text-center space-y-1 mb-2">
            <div className="w-16 h-1.5 bg-slate-400/90 rounded-full mx-auto"></div>
          </div>
          <div className="grid grid-cols-3 gap-1 flex-1 items-stretch">
            {[
              { highlighted: false },
              { highlighted: true },
              { highlighted: false }
            ].map((p, idx) => (
              <div 
                key={idx} 
                className={`border rounded-lg p-1 text-center flex flex-col justify-between ${
                  p.highlighted 
                    ? "bg-slate-950/70 border-indigo-500 scale-[1.04] z-10 shadow-sm shadow-indigo-500/10" 
                    : "bg-slate-500/5 border-slate-500/10"
                }`}
              >
                <div className="space-y-1">
                  <div className={`w-2/3 h-0.5 mx-auto ${p.highlighted ? "bg-indigo-400" : "bg-slate-450/70"} rounded-full`}></div>
                  <div className={`w-1/2 h-1 mx-auto ${p.highlighted ? "bg-white" : "bg-slate-400/90"} rounded-full`}></div>
                </div>
                <div className={`w-full h-1.5 rounded-sm mt-1.5 ${p.highlighted ? "bg-indigo-600" : "bg-slate-500/40"}`}></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {block.type === "testimonials" && (
        <div className="flex flex-col justify-between h-full w-full py-1">
          <div className="text-center mb-2">
            <div className="w-16 h-1.5 bg-slate-400/90 rounded-full mx-auto"></div>
          </div>
          <div className="grid grid-cols-2 gap-2 flex-1 items-center">
            {[1, 2].map((i) => (
              <div key={i} className="bg-slate-500/5 border border-slate-550/15 rounded-lg p-2 space-y-2">
                <div className="space-y-1">
                  <div className="w-full h-0.5 bg-slate-450/70 rounded-full"></div>
                  <div className="w-11/12 h-0.5 bg-slate-450/70 rounded-full"></div>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <div className={`w-3 h-3 rounded-full ${activeDotClass} bg-opacity-80 shrink-0`}></div>
                  <div className="space-y-0.5">
                    <div className="w-6 h-0.5 bg-slate-450/80 rounded-full"></div>
                    <div className="w-4 h-0.5 bg-slate-500/50 rounded-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {block.type === "faq" && (
        <div className="flex flex-col justify-center h-full w-full space-y-1 py-1">
          <div className="w-16 h-1.5 bg-slate-400/90 rounded-full mx-auto mb-1.5"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-500/5 border border-slate-550/15 rounded py-1 px-1.5 flex items-center justify-between">
              <div className="w-3/4 h-0.5 bg-slate-450/70 rounded-full font-mono text-[8px] outline-none"></div>
              <div className={`w-1 h-1 rounded-full ${activeDotClass} bg-opacity-80`}></div>
            </div>
          ))}
        </div>
      )}

      {block.type === "contact" && (
        <div className="grid grid-cols-2 gap-2 h-full items-center">
          <div className="space-y-2 text-left">
            <div className="w-3/4 h-1.5 bg-slate-400/90 rounded-full"></div>
            <div className="w-1/2 h-0.5 bg-slate-500/60 rounded-full"></div>
            <div className="space-y-1 pt-1.5">
              <div className="w-11/12 h-0.5 bg-slate-500/30 rounded-full"></div>
              <div className="w-3/4 h-0.5 bg-slate-500/30 rounded-full"></div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded p-1.5 space-y-1.5 flex flex-col justify-between">
            <div className="w-full h-1 bg-slate-850 rounded"></div>
            <div className="w-full h-1 bg-slate-850 rounded"></div>
            <div className={`w-full h-2 rounded-sm mt-1 ${activeDotClass}`}></div>
          </div>
        </div>
      )}

      {block.type === "cta" && (
        <div className="flex flex-col items-center justify-center text-center h-full space-y-2 py-2">
          <div className="w-24 h-2 bg-slate-400/95 rounded-full"></div>
          <div className="w-16 h-1 bg-slate-500/40 rounded-full"></div>
          <div className={`w-10 h-2.5 rounded mt-1 ${activeDotClass}`}></div>
        </div>
      )}

      {block.type === "footer" && (
        <div className="flex items-center justify-between border-t border-slate-500/20 pt-1.5 w-full mt-auto">
          <div className="w-14 h-1 bg-slate-400/70 rounded-full"></div>
          <div className="w-8 h-1 bg-slate-500/40 rounded-full"></div>
        </div>
      )}
    </div>
  );
};

// Preset Starter Kits / Templates
const STARTER_TEMPLATES: Record<string, { name: string; desc: string; blocks: SectionBlock[] }> = {
  saas: {
    name: "SaaS Rocket Landing Page",
    desc: "Perfect for software products, analytics platforms, and digital tools.",
    blocks: [
      {
        id: "nav-saas",
        type: "navbar",
        title: "Main Navigation",
        fields: {
          bgColor: "slate-dark",
          textColor: "light",
          paddingY: "py-3",
          brandName: "SaaSify Pro",
          navLinks: [
            { label: "Features", href: "#features" },
            { label: "Pricing", href: "#pricing" },
            { label: "FAQ", href: "#faq" }
          ],
          ctaText: "Get Started Free",
          ctaHref: "#pricing"
        }
      },
      {
        id: "hero-saas",
        type: "hero",
        title: "Hero Banner",
        fields: {
          bgColor: "gradient-indigo",
          textColor: "light",
          paddingY: "py-6",
          heading: "Supercharge Your Cloud Workflows Instantly",
          subheading: "Monitor pricing compliance, analyze customer churn, and dispatch automated compliance sweeps with our industry-leading developer toolbox.",
          buttonPrimaryText: "Start 14-Day Free Trial",
          buttonPrimaryHref: "#pricing",
          buttonSecondaryText: "Watch Demo",
          buttonSecondaryHref: "#features",
          imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60",
          layout: "split"
        }
      },
      {
        id: "features-saas",
        type: "features",
        title: "Product Features Grid",
        fields: {
          bgColor: "light-gray",
          textColor: "dark",
          paddingY: "py-5",
          featuresList: [
            { icon: "🛡️", title: "Real-time Compliance", desc: "Instantly detect violations across Amazon, Best Buy, and hundreds of online global retail channels." },
            { icon: "⚡", title: "AI-Powered Analysis", desc: "Let our copywriting suite suggest optimized, compliant pricing points and reseller incentives." },
            { icon: "📊", title: "Automated Reporting", desc: "Direct integration with Slack and email channels alerts your team instantly when a sweep completes." }
          ]
        }
      },
      {
        id: "pricing-saas",
        type: "pricing",
        title: "Pricing Plans",
        fields: {
          bgColor: "clean-white",
          textColor: "dark",
          paddingY: "py-5",
          pricingTiers: [
            {
              tierName: "Starter",
              price: "49",
              period: "mo",
              features: [
                "Up to 5 monitored SKUs",
                "Daily sweep intervals",
                "Email support access"
              ],
              buttonText: "Activate Starter",
              isHighlighted: false
            },
            {
              tierName: "Professional",
              price: "149",
              period: "mo",
              badge: "Popular Choice",
              features: [
                "Unlimited SKUs monitored",
                "Hourly custom schedules",
                "Slack & Teams native channels",
                "Dedicated customer partner rep"
              ],
              buttonText: "Join Pro Trial",
              isHighlighted: true
            },
            {
              tierName: "Enterprise",
              price: "399",
              period: "mo",
              features: [
                "Continuous scans (sub-hour)",
                "Full REST API integration",
                "White-label branding controls",
                "Custom visual export modules"
              ],
              buttonText: "Contact Enterprise",
              isHighlighted: false
            }
          ]
        }
      },
      {
        id: "faq-saas",
        type: "faq",
        title: "Frequently Asked Questions",
        fields: {
          bgColor: "light-gray",
          textColor: "dark",
          paddingY: "py-4",
          faqList: [
            { question: "How does the pricing protection engine work?", answer: "We deploy distributed global scrapers to scan designated product urls every hour, ensuring your MAP policies are adhered to without manual audits." },
            { question: "Are there any setup fees or hidden costs?", answer: "No setup fees whatsoever! You can scale your billing tier up or down instantly. Subscriptions can be canceled at any time from your settings panel." }
          ]
        }
      },
      {
        id: "footer-saas",
        type: "footer",
        title: "Footer Navigation",
        fields: {
          bgColor: "slate-dark",
          textColor: "light",
          paddingY: "py-4",
          footerText: "© 2026 SaaSify Pro Technologies Inc. All rights reserved. Crafted for visual cloud builders."
        }
      }
    ]
  },
  agency: {
    name: "Stellar Agency Portfolio",
    desc: "A bold, modern showcase for designers, creative agencies, and developers.",
    blocks: [
      {
        id: "nav-agency",
        type: "navbar",
        title: "Agency Navigation",
        fields: {
          bgColor: "blue-dark",
          textColor: "light",
          paddingY: "py-3",
          brandName: "Nova Studios",
          navLinks: [
            { label: "Portfolio", href: "#portfolio" },
            { label: "Client Testimonials", href: "#testimonials" },
            { label: "Get In Touch", href: "#contact" }
          ],
          ctaText: "Let's Chat",
          ctaHref: "#contact"
        }
      },
      {
        id: "hero-agency",
        type: "hero",
        title: "Hero Banner",
        fields: {
          bgColor: "blue-dark",
          textColor: "light",
          paddingY: "py-6",
          heading: "We Engineer Brand Journeys That Dominate",
          subheading: "Nova Studios is a bespoke design and visual workspace craft workshop. We turn early-stage ideas into highly competitive digital products that users love.",
          buttonPrimaryText: "Discover Our Works",
          buttonPrimaryHref: "#portfolio",
          buttonSecondaryText: "Read Story",
          buttonSecondaryHref: "#testimonials",
          imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=60",
          layout: "centered"
        }
      },
      {
        id: "testimonial-agency",
        type: "testimonials",
        title: "Testimonials Panel",
        fields: {
          bgColor: "clean-white",
          textColor: "dark",
          paddingY: "py-5",
          testimonialsList: [
            {
              quote: "The team at Nova delivered our entire rebrand and landing suite 2 weeks ahead of schedule. The quality was absolutely peerless.",
              author: "Elena Rostova",
              role: "Head of Marketing at CloudScale"
            },
            {
              quote: "Unlike basic templated builders, Nova designed customized component structures that increased our signup conversion rate by 42%.",
              author: "Marcus Vance",
              role: "VP of Product at HyperFlow"
            }
          ]
        }
      },
      {
        id: "contact-agency",
        type: "contact",
        title: "Ready to Launch Banner",
        fields: {
          bgColor: "gradient-indigo",
          textColor: "light",
          paddingY: "py-5",
          contactHeading: "Let's Ignite Your Next Enterprise Project",
          contactSubheading: "Ready to outpace the competition? Contact us for a complimentary design sprint workshop.",
          contactEmail: "hello@novastudios.com",
          contactPhone: "+1 (888) 555-NOVA",
          buttonText: "Book Your Slot Now"
        }
      },
      {
        id: "footer-agency",
        type: "footer",
        title: "Agency Footer",
        fields: {
          bgColor: "blue-dark",
          textColor: "light",
          paddingY: "py-3",
          footerText: "© 2026 Nova Studios Media. Crafted with Swiss modern display layouts."
        }
      }
    ]
  },
  logistics: {
    name: "SafeShip Logistical Portal",
    desc: "A powerful, clean dashboard page for shippers, freight operators, and supply chain channels.",
    blocks: [
      {
        id: "nav-logistics",
        type: "navbar",
        title: "Logistics Navigation",
        fields: {
          bgColor: "slate-dark",
          textColor: "light",
          paddingY: "py-3",
          brandName: "SafeShip Cargo",
          navLinks: [
            { label: "Dispatch Channels", href: "#features" },
            { label: "Service Tiers", href: "#pricing" },
            { label: "Transit Support", href: "#contact" }
          ],
          ctaText: "Calculate Rate",
          ctaHref: "#pricing"
        }
      },
      {
        id: "hero-logistics",
        type: "hero",
        title: "Logistics Hero Banner",
        fields: {
          bgColor: "gradient-indigo",
          textColor: "light",
          paddingY: "py-6",
          heading: "Intelligent Parcel Routing & Multi-Carrier Dispatch",
          subheading: "Manage dimensional package weights, compare dynamic FedEx, UPS, USPS, or DHL transit tariffs, and deploy standardized shipping labels in seconds.",
          buttonPrimaryText: "Launch Carrier Sandbox",
          buttonPrimaryHref: "#pricing",
          buttonSecondaryText: "Download SDK",
          buttonSecondaryHref: "#features",
          imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=60",
          layout: "split"
        }
      },
      {
        id: "features-logistics",
        type: "features",
        title: "Logistics Efficiency Grid",
        fields: {
          bgColor: "light-gray",
          textColor: "dark",
          paddingY: "py-5",
          featuresList: [
            { icon: "📦", title: "Volumetric Weight Optimizer", desc: "Our layout system dynamically calculates density quotients to guarantee you never overpay for oversized empty space." },
            { icon: "⚙️", title: "Automated Dispatch Slips", desc: "Instant printing of standardized cargo barcodes and tracking codes directly from the browser window." },
            { icon: "🛡️", title: "Compliance Hazard Audits", desc: "All shipments automatically pass a multi-point regulatory validation sweep before label dispatch." }
          ]
        }
      },
      {
        id: "pricing-logistics",
        type: "pricing",
        title: "Shipping Courier Tariffs",
        fields: {
          bgColor: "clean-white",
          textColor: "dark",
          paddingY: "py-5",
          pricingTiers: [
            {
              tierName: "Consolidated Ground",
              price: "12",
              period: "parcel",
              features: [
                "3-5 days delivery window",
                "Full route tracking num",
                "Self-service carrier drops"
              ],
              buttonText: "Schedule Ground",
              isHighlighted: false
            },
            {
              tierName: "Air Freight Priority",
              price: "36",
              period: "parcel",
              badge: "Best Value",
              features: [
                "Next-day priority air flight",
                "Dynamic billing weight match",
                "Hazard certification pre-signed",
                "Automated delivery webhook updates"
              ],
              buttonText: "Schedule Priority Air",
              isHighlighted: true
            },
            {
              tierName: "Overnight Hot-Shot",
              price: "72",
              period: "parcel",
              features: [
                "Hand-delivered overnight cargo",
                "Custom visual dispatch reports",
                "Dedicated channel load rep",
                "Direct API gateway access"
              ],
              buttonText: "Schedule Hot-Shot",
              isHighlighted: false
            }
          ]
        }
      },
      {
        id: "contact-logistics",
        type: "contact",
        title: "Quotation Dispatch Board",
        fields: {
          bgColor: "slate-dark",
          textColor: "light",
          paddingY: "py-5",
          contactHeading: "Request Custom Freight Quotation",
          contactSubheading: "Our terminal logistics experts are available to structure customized commercial routes for bulk partners.",
          contactEmail: "freight@safeship-cargo.com",
          contactPhone: "+1 (800) SHIP-SAFE",
          buttonText: "Submit Route Details"
        }
      },
      {
        id: "footer-logistics",
        type: "footer",
        title: "Logistics Footer",
        fields: {
          bgColor: "slate-dark",
          textColor: "light",
          paddingY: "py-3",
          footerText: "© 2026 SafeShip Cargo Operations Ltd. Powered by CloudboyX Web Technology."
        }
      }
    ]
  },
  brand_protection: {
    name: "BrandShield MAP Integrity Portal",
    desc: "A protective, legal-oriented compliance page designed for brand enforcement directors and distributors.",
    blocks: [
      {
        id: "nav-brand",
        type: "navbar",
        title: "Compliance Navigation",
        fields: {
          bgColor: "slate-dark",
          textColor: "light",
          paddingY: "py-3",
          brandName: "BrandShield x Compliance",
          navLinks: [
            { label: "Enforcement Suite", href: "#features" },
            { label: "Compliance Plans", href: "#pricing" },
            { label: "Submit Violators", href: "#contact" }
          ],
          ctaText: "Enforce My MAP",
          ctaHref: "#pricing"
        }
      },
      {
        id: "hero-brand",
        type: "hero",
        title: "MAP Hero Banner",
        fields: {
          bgColor: "gradient-indigo",
          textColor: "light",
          paddingY: "py-6",
          heading: "Guard Your Brand Margin Value Globally",
          subheading: "Continuous autonomous audits identify pricing degradation in real time. Safeguard premium MAP benchmarks and automate warning cascades.",
          buttonPrimaryText: "Enforce Standards Now",
          buttonPrimaryHref: "#pricing",
          buttonSecondaryText: "Download Defense Guide",
          buttonSecondaryHref: "#features",
          imageUrl: "https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=800&auto=format&fit=crop&q=60",
          layout: "split"
        }
      },
      {
        id: "features-brand",
        type: "features",
        title: "Compliance Features Grid",
        fields: {
          bgColor: "clean-white",
          textColor: "dark",
          paddingY: "py-5",
          featuresList: [
            { icon: "🛡️", title: "Global Marketplace Audits", desc: "Our crawlers run hour-by-hour scans across major retail networks and localized e-commerce channels to trace leakage." },
            { icon: "⚖️", title: "Automated Warning Dispatch", desc: "Instantly compile legal, notarized cease-and-desist alerts tailored to target SKU compliance policies." },
            { icon: "🔒", title: "Channel Authorized Whitelists", desc: "Establish structured, authenticated distribution pathways, freezing supply chains to rogue third-party aggregators." }
          ]
        }
      },
      {
        id: "pricing-brand",
        type: "pricing",
        title: "Protection Solutions",
        fields: {
          bgColor: "light-gray",
          textColor: "dark",
          paddingY: "py-5",
          pricingTiers: [
            {
              tierName: "Sentry Core",
              price: "99",
              period: "mo",
              features: [
                "Scan up to 10 product SKUs",
                "Daily automated sweeps",
                "Pre-drafted warning formats"
              ],
              buttonText: "Deploy Sentry Core",
              isHighlighted: false
            },
            {
              tierName: "Shield Professional",
              price: "299",
              period: "mo",
              badge: "Highly Selected",
              features: [
                "Scan up to 100 product SKUs",
                "Hourly sweep rest intervals",
                "Automated email warning cascades",
                "Slack warnings & API webhook pings"
              ],
              buttonText: "Join Professional Suite",
              isHighlighted: true
            },
            {
              tierName: "Fortress Enterprise",
              price: "799",
              period: "mo",
              features: [
                "Scan complete SKU catalog",
                "Sub-hour continuous monitoring",
                "White-labeled reseller portals",
                "Immediate legal advisory counsel check"
              ],
              buttonText: "Request Enterprise Quote",
              isHighlighted: false
            }
          ]
        }
      },
      {
        id: "faq-brand",
        type: "faq",
        title: "Policy FAQ Panel",
        fields: {
          bgColor: "light-gray",
          textColor: "dark",
          paddingY: "py-4",
          faqList: [
            { question: "What is MAP and why monitor it?", answer: "Minimum Advertised Price (MAP) maintains your premium positioning. Monitoring and enforcing prevent downward price-spirals initiated by automated dealer bots." },
            { question: "How do automated warnings get transmitted?", answer: "Our backend detects price-drops instantly and auto-generates legal warning notices, routing them directly to verified partner administration channels." }
          ]
        }
      },
      {
        id: "contact-brand",
        type: "contact",
        title: "Violation Dispatcher Board",
        fields: {
          bgColor: "slate-dark",
          textColor: "light",
          paddingY: "py-5",
          contactHeading: "Submit Rogue Price-Breaker Report",
          contactSubheading: "Spotted an authorized or unauthorized seller dumping retail values? Push their domain to our compliance desk for immediate legal audit.",
          contactEmail: "enforcement@brandshield-map.com",
          contactPhone: "+1 (800) MAP-GUARD",
          buttonText: "Trigger Enforcement Check"
        }
      },
      {
        id: "footer-brand",
        type: "footer",
        title: "BrandShield Footer",
        fields: {
          bgColor: "slate-dark",
          textColor: "light",
          paddingY: "py-3",
          footerText: "© 2026 BrandShield Integrity Systems LLC. Powered by CloudboyX Technologies."
        }
      }
    ]
  },
  ecom_wholesale: {
    name: "B2B Authorized Reseller Portal",
    desc: "A professional B2B landing page structured to acquire, onboard, and streamline premium authorized trade partners.",
    blocks: [
      {
        id: "nav-ecom",
        type: "navbar",
        title: "B2B Navigation",
        fields: {
          bgColor: "clean-white",
          textColor: "dark",
          paddingY: "py-3",
          brandName: "ApexSupply Wholesale",
          navLinks: [
            { label: "Partner Perks", href: "#features" },
            { label: "Minimum Order Tiers", href: "#pricing" },
            { label: "Apply Online", href: "#contact" }
          ],
          ctaText: "Apply For Trade Account",
          ctaHref: "#contact"
        }
      },
      {
        id: "hero-ecom",
        type: "hero",
        title: "B2B Front Hero",
        fields: {
          bgColor: "blue-dark",
          textColor: "light",
          paddingY: "py-6",
          heading: "Secure Direct Factory Sourcing & Guaranteed Margin Protection",
          subheading: "Partner with ApexSupply to offer premium ergonomic seating and tech hardware, backed by a strict, non-negotiable global compliance framework built to block low-margin dumping.",
          buttonPrimaryText: "Submit Commercial Intake",
          buttonPrimaryHref: "#contact",
          buttonSecondaryText: "Browse Wholesale Items",
          buttonSecondaryHref: "#features",
          imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=60",
          layout: "split"
        }
      },
      {
        id: "features-ecom",
        type: "features",
        title: "Reseller Benefits",
        fields: {
          bgColor: "light-gray",
          textColor: "dark",
          paddingY: "py-5",
          featuresList: [
            { icon: "💎", title: "Universal MAP Enforcement", desc: "Our strict price policing ensures all authorized resellers maintain premium margins, preventing undercutting by automated scrape bots." },
            { icon: "📦", title: "Volumetric Shipping Savings", desc: "Same-day bulk shipping dispatch from regional warehouses with automatically optimized freight packaging to reduce cargo overhead." },
            { icon: "💻", title: "Pre-Authorized Media Sourcing", desc: "Unrestricted download access to premium high-resolution product photography, compliance assets, and descriptive brochures." }
          ]
        }
      },
      {
        id: "testimonials-ecom",
        type: "testimonials",
        title: "Partner Social Proof",
        fields: {
          bgColor: "clean-white",
          textColor: "dark",
          paddingY: "py-5",
          testimonialsList: [
            {
              quote: "ApexSupply's strict MAP protection has allowed my independent boutiques to thrive. We are never forced to slash margins to compete with rogue Amazon sellers.",
              author: "Dimitri Moretti",
              role: "Creative Director at Moretti Design Hub"
            },
            {
              quote: "The visual portal streamlined our intake completely. We calculate volumetric profiles, print direct shipping slips, and track compliance warnings seamlessly.",
              author: "Chloe Lin",
              role: "Head of Procurement at Pacific Goods Group"
            }
          ]
        }
      },
      {
        id: "pricing-ecom",
        type: "pricing",
        title: "Minimum Trade Order Tiers",
        fields: {
          bgColor: "light-gray",
          textColor: "dark",
          paddingY: "py-5",
          pricingTiers: [
            {
              tierName: "Silver Trade Level",
              price: "500",
              period: "order",
              features: [
                "Full access to standard stock catalogs",
                "Standard ground freight shipping rates",
                "Universal product marketing assets access"
              ],
              buttonText: "Apply For Silver Account",
              isHighlighted: false
            },
            {
              tierName: "Gold Preferred Level",
              price: "2500",
              period: "order",
              badge: "Highly Prevalent",
              features: [
                "Priority same-day warehouse dispatch",
                "Exclusive access to premium limited catalog releases",
                "Permitted 5% promotional MAP pricing buffer allowance",
                "Direct eligibility for quarterly co-op marketing funds"
              ],
              buttonText: "Apply For Gold Account",
              isHighlighted: true
            },
            {
              tierName: "Platinum Direct Line",
              price: "10000",
              period: "order",
              features: [
                "Direct-to-factory container pallet shipments",
                "Custom visual branding and white-label boxing options",
                "Dedicated corporate account manager assignment",
                "Flexible commercial finance and extended billing terms"
              ],
              buttonText: "Schedule Platinum Intake",
              isHighlighted: false
            }
          ]
        }
      },
      {
        id: "contact-ecom",
        type: "contact",
        title: "Authorized Reseller Application",
        fields: {
          bgColor: "slate-dark",
          textColor: "light",
          paddingY: "py-5",
          contactHeading: "Submit Dealer Account Application",
          contactSubheading: "Begin our reseller onboarding vetting process. Provide certified business tax credentials and corporate domains.",
          contactEmail: "trade@apexsupply.com",
          contactPhone: "+1 (800) APEX-TRADE",
          buttonText: "Transmit Partner Assets"
        }
      },
      {
        id: "footer-ecom",
        type: "footer",
        title: "ApexSupply Footer",
        fields: {
          bgColor: "blue-dark",
          textColor: "light",
          paddingY: "py-3",
          footerText: "© 2026 ApexSupply B2B Wholesalers Inc. Partner compliance monitored and supported on CloudboyX."
        }
      }
    ]
  }
};

const DEFAULT_BLOCKS: SectionBlock[] = STARTER_TEMPLATES.saas.blocks;

interface WebsiteBuilderProps {
  isStandaloneMode?: boolean;
  setIsStandaloneMode?: (value: boolean) => void;
  currentUser?: any;
}

// Firebase persistence imports
import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where 
} from "../firebase";
import { Folder, Save, Database, Trash, Briefcase } from "lucide-react";

export default function WebsiteBuilderView({
  isStandaloneMode = false,
  setIsStandaloneMode,
  currentUser
}: WebsiteBuilderProps) {
  // Firestore User Projects States
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projectNameInput, setProjectNameInput] = useState("");
  const [projectDescInput, setProjectDescInput] = useState("");
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [projectSuccessMsg, setProjectSuccessMsg] = useState<string | null>(null);

  // Fetch all projects for this user on mount & when currentUser changes
  const fetchUserProjects = async () => {
    if (!currentUser) return;
    setIsLoadingProjects(true);
    setProjectError(null);
    try {
      const q = query(
        collection(db, "projects"),
        where("userId", "==", currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const list: any[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort client-side by updatedAt descending
      list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setProjects(list);
      // Cache locally for offline usage
      localStorage.setItem(`offline_projects_${currentUser.uid}`, JSON.stringify(list));
    } catch (err: any) {
      console.warn("Firestore projects load failed, falling back to offline cache:", err);
      const cached = localStorage.getItem(`offline_projects_${currentUser.uid}`);
      if (cached) {
        try {
          const list = JSON.parse(cached);
          setProjects(list);
          return;
        } catch (_) {}
      }
      setProjectError(err.message || "Failed to load database projects.");
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUserProjects();
    }
  }, [currentUser]);

  const handleSaveToFirestore = async (name: string, description: string) => {
    if (!currentUser) {
      setProjectError("You must be authenticated to perform database operations.");
      return;
    }
    if (!name.trim()) {
      setProjectError("Project name is required.");
      return;
    }

    setIsSavingProject(true);
    setProjectError(null);
    setProjectSuccessMsg(null);

    try {
      const projId = activeProjectId || `proj_${Date.now()}`;
      const projectDoc = {
        id: projId,
        name: name.trim(),
        description: description.trim(),
        userId: currentUser.uid,
        blocks: blocks, // active blocks
        brandIdentity: brandIdentity, // save brand identity state
        createdAt: activeProjectId ? (projects.find(p => p.id === activeProjectId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, "projects", projId), projectDoc);
        setProjectSuccessMsg("Project saved to your secure cloud database!");
      } catch (dbErr: any) {
        console.warn("Firestore save failed, caching to local storage offline fallback:", dbErr);
        const cached = localStorage.getItem(`offline_projects_${currentUser.uid}`);
        let list: any[] = [];
        if (cached) {
          try { list = JSON.parse(cached); } catch (_) {}
        }
        const idx = list.findIndex(p => p.id === projId);
        if (idx > -1) {
          list[idx] = projectDoc;
        } else {
          list.unshift(projectDoc);
        }
        localStorage.setItem(`offline_projects_${currentUser.uid}`, JSON.stringify(list));
        setProjects(list);
        setProjectSuccessMsg("Project saved locally (offline cache mode)!");
      }

      setActiveProjectId(projId);
      setTimeout(() => setProjectSuccessMsg(null), 3000);
      await fetchUserProjects();
    } catch (err: any) {
      console.warn("Failed saving project:", err);
      setProjectError(err.message || "Failed to save project.");
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleLoadProject = (proj: any) => {
    setActiveProjectId(proj.id);
    setProjectNameInput(proj.name);
    setProjectDescInput(proj.description || "");
    setBlocks(proj.blocks);
    if (proj.brandIdentity) {
      setBrandIdentity(proj.brandIdentity);
    }
    if (proj.blocks && proj.blocks.length > 0) {
      setActiveSectionId(proj.blocks[0].id || proj.blocks[1]?.id || null);
    }
  };

  const handleDeleteProject = async (projId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // don't load the project on delete click
    if (!currentUser) return;
    if (!window.confirm("Are you sure you want to permanently delete this project?")) return;
    
    setProjectError(null);
    try {
      try {
        await deleteDoc(doc(db, "projects", projId));
      } catch (dbErr: any) {
        console.warn("Firestore delete failed, falling back to offline cache removal:", dbErr);
        const cached = localStorage.getItem(`offline_projects_${currentUser.uid}`);
        if (cached) {
          try {
            let list = JSON.parse(cached);
            list = list.filter((p: any) => p.id !== projId);
            localStorage.setItem(`offline_projects_${currentUser.uid}`, JSON.stringify(list));
            setProjects(list);
          } catch (_) {}
        }
      }
      if (activeProjectId === projId) {
        setActiveProjectId(null);
        setProjectNameInput("");
        setProjectDescInput("");
      }
      await fetchUserProjects();
    } catch (err: any) {
      console.warn("Failed deleting project:", err);
      setProjectError(err.message || "Failed to delete project.");
    }
  };

  const handleCreateNewProject = () => {
    setActiveProjectId(null);
    setProjectNameInput("");
    setProjectDescInput("");
    setBlocks(DEFAULT_BLOCKS);
    if (DEFAULT_BLOCKS.length > 0) {
      setActiveSectionId(DEFAULT_BLOCKS[1]?.id || DEFAULT_BLOCKS[0].id || null);
    }
  };

  // Live Publishing States
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const handlePublishLive = async () => {
    setIsPublishing(true);
    setPublishError(null);
    setPublishSuccess(false);
    try {
      const code = generateHTMLCode(true);
      const response = await fetch("/api/website/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ htmlCode: code })
      });
      if (!response.ok) {
        throw new Error("Failed to post compiled catalog output.");
      }
      const data = await response.json();
      if (data.success) {
        setPublishedUrl(data.urlPath);
        setPublishSuccess(true);
      } else {
        throw new Error("Server reporting incomplete compilation trace.");
      }
    } catch (err: any) {
      console.error(err);
      setPublishError(err.message || "Failed to publish built document live.");
    } finally {
      setIsPublishing(false);
    }
  };

  const [blocks, setBlocks] = useState<SectionBlock[]>(() => {
    const saved = localStorage.getItem("mapshield_web_builder_blocks");
    return saved ? JSON.parse(saved) : DEFAULT_BLOCKS;
  });

  const [brandIdentity, setBrandIdentity] = useState<{
    companyName: string;
    slogan: string;
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    headingFont: string;
    bodyFont: string;
    industry: string;
  }>(() => {
    const saved = localStorage.getItem("mapshield_web_builder_brand");
    return saved ? JSON.parse(saved) : {
      companyName: "SafeShip Cargo",
      slogan: "Precision Freight & Worldwide Logistics Solutions",
      logoUrl: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=120&q=80",
      primaryColor: "#6366f1",
      secondaryColor: "#94a3b8",
      accentColor: "#10b981",
      headingFont: "'Space Grotesk', sans-serif",
      bodyFont: "'Plus Jakarta Sans', sans-serif",
      industry: "Logistics & Supply Chain"
    };
  });

  useEffect(() => {
    localStorage.setItem("mapshield_web_builder_brand", JSON.stringify(brandIdentity));
  }, [brandIdentity]);

  const [activeSectionId, setActiveSectionId] = useState<string | null>(() => {
    return DEFAULT_BLOCKS[1]?.id || null;
  });

  const [editorTab, setEditorTab] = useState<"structure" | "templates" | "editor" | "ai-copywriter" | "projects" | "brand" | "ai-generator" | "extensions" | "publishing">("structure");
  
  // Custom Raw HTML string override for advanced Code Editor
  const [customHtmlOverride, setCustomHtmlOverride] = useState<string | null>(null);
  
  // Dynamic Integrated Extensions Configs
  const [smartCart, setSmartCart] = useState<{
    enabled: boolean;
    currency: string;
    checkoutEmail: string;
    buttonLabel: string;
  }>(() => {
    const saved = localStorage.getItem("mapshield_web_builder_cart");
    return saved ? JSON.parse(saved) : {
      enabled: false,
      currency: "USD",
      checkoutEmail: "gocloudboy2@gmail.com",
      buttonLabel: "🛒 Add to Smart Cart"
    };
  });

  const [socialFeed, setSocialFeed] = useState<{
    enabled: boolean;
    platform: "instagram" | "twitter" | "facebook";
    feedName: string;
    embedUrl: string;
  }>(() => {
    const saved = localStorage.getItem("mapshield_web_builder_social");
    return saved ? JSON.parse(saved) : {
      enabled: false,
      platform: "twitter",
      feedName: "ComplianceShieldNews",
      embedUrl: "https://twitter.com/cloudboy_ops/status/178000"
    };
  });

  const [popup, setPopup] = useState<{
    enabled: boolean;
    title: string;
    description: string;
    buttonText: string;
    delaySeconds: number;
    triggerEvent: "time" | "exit";
    theme: "dark" | "light" | "indigo";
  }>(() => {
    const saved = localStorage.getItem("mapshield_web_builder_popup");
    return saved ? JSON.parse(saved) : {
      enabled: false,
      title: "🎁 Special Compliant Deal",
      description: "Unlock premium regional carrier routing maps! Sign up with your secure enterprise contact email.",
      buttonText: "Activate Routing Terminal",
      delaySeconds: 3,
      triggerEvent: "time",
      theme: "indigo"
    };
  });

  const [contactConfig, setContactConfig] = useState<{
    recaptcha: boolean;
    successMessage: string;
    webhookUrl: string;
  }>(() => {
    const saved = localStorage.getItem("mapshield_web_builder_contact_config");
    return saved ? JSON.parse(saved) : {
      recaptcha: true,
      successMessage: "Your secure dispatch telemetry check was successful. Our logistics network operations desk is mapping your parameters.",
      webhookUrl: "https://api.cloudboy-ops.net/webhooks/compliance"
    };
  });

  // Flexible Publishing Node Configurations
  const [publishingSettings, setPublishingSettings] = useState<{
    subdomain: string;
    domainType: "subdomain" | "custom";
    customDomain: string;
    isOfflineMode: boolean;
    ftpServer: string;
    ftpPort: number;
    ftpUser: string;
    ftpDir: string;
  }>(() => {
    const saved = localStorage.getItem("mapshield_web_builder_publishing");
    return saved ? JSON.parse(saved) : {
      subdomain: "safeship-portal",
      domainType: "subdomain",
      customDomain: "logistics.safeship.com",
      isOfflineMode: false,
      ftpServer: "ftp.safeship.com",
      ftpPort: 21,
      ftpUser: "safeship_ops",
      ftpDir: "/public_html/carrier-portal"
    };
  });

  // Sync state values to localStorage
  useEffect(() => {
    localStorage.setItem("mapshield_web_builder_cart", JSON.stringify(smartCart));
  }, [smartCart]);

  useEffect(() => {
    localStorage.setItem("mapshield_web_builder_social", JSON.stringify(socialFeed));
  }, [socialFeed]);

  useEffect(() => {
    localStorage.setItem("mapshield_web_builder_popup", JSON.stringify(popup));
  }, [popup]);

  useEffect(() => {
    localStorage.setItem("mapshield_web_builder_contact_config", JSON.stringify(contactConfig));
  }, [contactConfig]);

  useEffect(() => {
    localStorage.setItem("mapshield_web_builder_publishing", JSON.stringify(publishingSettings));
  }, [publishingSettings]);
  // AI Website Generator States
  const [promptInput, setPromptInput] = useState("A professional dark-themed technology promotions page mapping regional carrier compliance coordinates under secure cloud shield logs.");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("saas");
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Template Live Preview States
  const [previewingTemplate, setPreviewingTemplate] = useState<LibrarySectionTemplate | null>(null);
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);

  // Drag and Drop States for components
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedType, setDraggedType] = useState<SectionBlock["type"] | null>(null);
  const [draggedLibraryTemplate, setDraggedLibraryTemplate] = useState<LibrarySectionTemplate | null>(null);
  const [dragMode, setDragMode] = useState<"reorder" | "new" | "library-template" | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"preview" | "visual-layout">("visual-layout");

  // Filter & Search states for the templates library
  const [librarySearchQuery, setLibrarySearchQuery] = useState("");
  const [libraryCategory, setLibraryCategory] = useState<string>("all");

  // AI Copywriter support values
  const [aiNiche, setAiNiche] = useState("Cybersecurity Solutions");
  const [aiTone, setAiTone] = useState("Premium & Tech-Forward");
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ heading: string; subheading: string; tag: string }>>([]);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // History/Undo Stack
  const [history, setHistory] = useState<SectionBlock[][]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("mapshield_web_builder_blocks", JSON.stringify(blocks));
  }, [blocks]);

  // Keep history for Undo
  const saveStateToHistory = (currentBlocks: SectionBlock[]) => {
    setHistory(prev => {
      const updated = [...prev, JSON.parse(JSON.stringify(currentBlocks))];
      if (updated.length > 20) updated.shift(); // Max 20 states
      return updated;
    });
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory(prev => prev.slice(0, prev.length - 1));
    setBlocks(previous);
  };

  // AI Copywriter Generation triggers
  const handleAIGenerateSite = async () => {
    if (!promptInput.trim()) {
      setGenerationError("Please specify a prompt description.");
      return;
    }
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const res = await fetch("/api/website/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptInput,
          brandName: brandIdentity.companyName || "Nova"
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.blocks) && data.blocks.length > 0) {
        saveStateToHistory(blocks);
        setBlocks(data.blocks);
        setActiveSectionId(data.blocks[1]?.id || data.blocks[0]?.id || null);
        setEditorTab("structure"); // Bounce to hierarchy tab so they see generated segments
      } else {
        throw new Error(data.error || "The AI model returned empty layout blocks.");
      }
    } catch (err: any) {
      console.error("AI Generator Error:", err);
      setGenerationError(err.message || "Compilation connection interrupted.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Switch to a Preset Template
  const handleLoadTemplate = (key: string) => {
    if (window.confirm("Are you sure? This will replace your current webpage assembly preview.")) {
      saveStateToHistory(blocks);
      const chosen = STARTER_TEMPLATES[key];
      if (chosen) {
        setBlocks(JSON.parse(JSON.stringify(chosen.blocks)));
        setActiveSectionId(chosen.blocks[1]?.id || chosen.blocks[0]?.id || null);
        setSelectedTemplate(key);
      }
    }
  };

  // Brand identity application handlers
  const handleApplyBrandingToAll = () => {
    saveStateToHistory(blocks);
    const updated = blocks.map(block => {
      const f = { ...block.fields };

      // Overwrite fonts if set
      if (brandIdentity.headingFont) f.headingFont = brandIdentity.headingFont;
      if (brandIdentity.bodyFont) f.bodyFont = brandIdentity.bodyFont;

      // Overwrite colors
      if (brandIdentity.primaryColor) f.headingColor = brandIdentity.primaryColor;
      if (brandIdentity.secondaryColor) f.bodyColor = brandIdentity.secondaryColor === "#94a3b8" ? "#e2e8f0" : brandIdentity.secondaryColor;

      // Set rounded buttons if not set
      if (!f.btnRadius) {
        f.btnRadius = "8px"; 
      }

      // Navbar specific updates
      if (block.type === "navbar") {
        if (brandIdentity.companyName) f.brandName = brandIdentity.companyName;
        if (brandIdentity.logoUrl) f.imageUrl = brandIdentity.logoUrl;
      }

      // Footer corporate metadata
      if (block.type === "footer") {
        f.footerText = `© ${new Date().getFullYear()} ${brandIdentity.companyName || "Company"}. All rights reserved. ${brandIdentity.slogan ? `| ${brandIdentity.slogan}` : ""}`;
      }

      // Hero content tuning
      if (block.type === "hero") {
        if (brandIdentity.slogan) {
          f.subheading = brandIdentity.slogan;
        }
        if (f.heading && brandIdentity.companyName) {
          f.heading = f.heading.replace(/SafeShip Cargo|BrandShield|B2B Authorized Reseller/gi, brandIdentity.companyName);
        }
      }

      // Contact headings
      if (block.type === "contact") {
        if (brandIdentity.companyName) {
          f.heading = `Get in Touch with ${brandIdentity.companyName}`;
        }
      }

      return {
        ...block,
        fields: f
      };
    });

    setBlocks(updated);
    alert(`Successfully synchronized "${brandIdentity.companyName}" Brand attributes & corporate guidelines to all ${blocks.length} page sections!`);
  };

  const handleApplyBrandingToActive = () => {
    if (!activeSectionId) {
      alert("Please select a section block in the webpage hierarchy first.");
      return;
    }
    saveStateToHistory(blocks);
    const updated = blocks.map(block => {
      if (block.id !== activeSectionId) return block;
      
      const f = { ...block.fields };
      if (brandIdentity.headingFont) f.headingFont = brandIdentity.headingFont;
      if (brandIdentity.bodyFont) f.bodyFont = brandIdentity.bodyFont;
      if (brandIdentity.primaryColor) f.headingColor = brandIdentity.primaryColor;
      if (brandIdentity.secondaryColor) f.bodyColor = brandIdentity.secondaryColor === "#94a3b8" ? "#e2e8f0" : brandIdentity.secondaryColor;
      
      if (block.type === "navbar") {
        if (brandIdentity.companyName) f.brandName = brandIdentity.companyName;
        if (brandIdentity.logoUrl) f.imageUrl = brandIdentity.logoUrl;
      }

      if (block.type === "footer") {
        f.footerText = `© ${new Date().getFullYear()} ${brandIdentity.companyName || "Company"}. All rights reserved. ${brandIdentity.slogan ? `| ${brandIdentity.slogan}` : ""}`;
      }

      if (block.type === "hero") {
        if (brandIdentity.companyName) {
          f.heading = brandIdentity.companyName;
        }
        if (brandIdentity.slogan) {
          f.subheading = brandIdentity.slogan;
        }
      }
      
      return { ...block, fields: f };
    });
    setBlocks(updated);
    alert(`Applied brand parameters to the active section block!`);
  };

  // Re-ordering blocks
  const moveBlock = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === blocks.length - 1) return;
    
    saveStateToHistory(blocks);
    const updated = [...blocks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setBlocks(updated);
  };

  // Block deletion
  const deleteBlock = (id: string) => {
    if (blocks.length <= 1) {
      alert("A webpage must contain at least 1 section block.");
      return;
    }
    saveStateToHistory(blocks);
    const filtered = blocks.filter(b => b.id !== id);
    setBlocks(filtered);
    if (activeSectionId === id) {
      setActiveSectionId(filtered[0]?.id || null);
    }
  };

  // Helper to construct a new block instance based on type
  const createNewBlockInstance = (type: SectionBlock["type"], randomId: string): SectionBlock => {
    switch (type) {
      case "navbar":
        return {
          id: randomId,
          type: "navbar",
          title: "Custom Brand Navigation",
          fields: {
            bgColor: "slate-dark",
            textColor: "light",
            paddingY: "py-3",
            brandName: "CloudboyX Inc",
            navLinks: [
              { label: "Products", href: "#features" },
              { label: "Pricing", href: "#pricing" }
            ],
            ctaText: "Inquire Now",
            ctaHref: "#contact"
          }
        };
      case "hero":
        return {
          id: randomId,
          type: "hero",
          title: "Promotional Banner",
          fields: {
            bgColor: "gradient-indigo",
            textColor: "light",
            paddingY: "py-5",
            heading: "Engineered For Outstanding Conversion",
            subheading: "Explain your brand visual proposition and design goals with a clean aesthetic and high-contrast spacing layouts.",
            buttonPrimaryText: "Get Started Now",
            buttonPrimaryHref: "#pricing",
            buttonSecondaryText: "Learn More",
            buttonSecondaryHref: "#features",
            imageUrl: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=800&auto=format&fit=crop&q=60",
            layout: "split"
          }
        };
      case "features":
        return {
          id: randomId,
          type: "features",
          title: "Feature Core Benefits",
          fields: {
            bgColor: "light-gray",
            textColor: "dark",
            paddingY: "py-5",
            featuresList: [
              { icon: "🎨", title: "Peerless Design Quality", desc: "No templates or rigid grid structures. Custom spacing tailored strictly back to your brand requirements." },
              { icon: "🛡️", title: "Enterprise Grade", desc: "Compiled optimized Bootstrap layout with zero heavy library bundles for blistering fast render times." }
            ]
          }
        };
      case "pricing":
        return {
          id: randomId,
          type: "pricing",
          title: "Subscription Matrix",
          fields: {
            bgColor: "clean-white",
            textColor: "dark",
            paddingY: "py-5",
            pricingTiers: [
              {
                tierName: "Growth",
                price: "29",
                period: "mo",
                features: ["All core UI blocks included", "Email alert integrations"],
                buttonText: "Start Simple",
                isHighlighted: false
              },
              {
                tierName: "Professional",
                price: "89",
                period: "mo",
                badge: "Suggested",
                features: ["Durable custom domain setups", "Advanced support ticketing", "White label dashboard access"],
                buttonText: "Go Enterprise",
                isHighlighted: true
              }
            ]
          }
        };
      case "testimonials":
        return {
          id: randomId,
          type: "testimonials",
          title: "Customer Praise Grid",
          fields: {
            bgColor: "clean-white",
            textColor: "dark",
            paddingY: "py-5",
            testimonialsList: [
              {
                quote: "MapShield's system design is the best tool we have added to our workflow this quarter. Simple, blazing fast, and clean.",
                author: "Sarah Jenkins",
                role: "Operations Chief at SwiftLabs"
              }
            ]
          }
        };
      case "faq":
        return {
          id: randomId,
          type: "faq",
          title: "FAQ List Accordion",
          fields: {
            bgColor: "light-gray",
            textColor: "dark",
            paddingY: "py-4",
            faqList: [
              { question: "Is this builder compatible with native WordPress or Webflow?", answer: "Yes, it produces clean, standard Bootstrap 5 and standard HTML/CSS code that can be easily migrated to any hosting provider." }
            ]
          }
        };
      case "contact":
        return {
          id: randomId,
          type: "contact",
          title: "Contact Callout Section",
          fields: {
            bgColor: "slate-dark",
            textColor: "light",
            paddingY: "py-5",
            contactHeading: "Ready to secure your pricing strategy?",
            contactSubheading: "Speak with one of our specialized MAP protection analysts today.",
            contactEmail: "support@mapshield.io",
            contactPhone: "+1 (800) MAP-SHIELD",
            buttonText: "Schedule Consultation"
          }
        };
      case "cta":
        return {
          id: randomId,
          type: "cta",
          title: "Action Banner Callout",
          fields: {
            bgColor: "gradient-indigo",
            textColor: "light",
            paddingY: "py-5",
            ctaHeading: "Ready to experience instant scaling?",
            ctaSubheading: "Create your free Sandbox sandbox account right now to see benefits.",
            ctaButtonText: "Bootstrap CloudboyX",
            ctaButtonHref: "#pricing"
          }
        };
      case "footer":
        return {
          id: randomId,
          type: "footer",
          title: "Resource Footer Panel",
          fields: {
            bgColor: "slate-dark",
            textColor: "light",
            paddingY: "py-4",
            footerText: "© 2026 Sandbox Interactive Workspace Ltd. All rights designed."
          }
        };
      default:
        return {
          id: randomId,
          type: "footer",
          title: "Resource Footer Panel",
          fields: {
            bgColor: "slate-dark",
            textColor: "light",
            paddingY: "py-4",
            footerText: "© 2026 Sandbox Interactive Workspace Ltd. All rights designed."
          }
        };
    }
  };

  // Adding blocks (appends at the end)
  const addBlock = (type: SectionBlock["type"]) => {
    saveStateToHistory(blocks);
    const randomId = `${type}-${Date.now().toString().substring(8)}`;
    const newBlock = createNewBlockInstance(type, randomId);

    setBlocks(prev => [...prev, newBlock]);
    setActiveSectionId(newBlock.id);
    setEditorTab("editor");
  };

  // HTML5 Drag and Drop event handlers
  const handleDragStart = (e: React.DragEvent, index: number, mode: "reorder" | "new") => {
    setDragMode(mode);
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragStartNew = (e: React.DragEvent, type: SectionBlock["type"]) => {
    setDragMode("new");
    setDraggedType(type);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragStartTemplate = (e: React.DragEvent, template: LibrarySectionTemplate) => {
    setDragMode("library-template");
    setDraggedLibraryTemplate(template);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDraggedType(null);
    setDraggedLibraryTemplate(null);
    setDragMode(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (dragMode === "reorder" && draggedIndex !== null) {
      if (draggedIndex === targetIndex) return;
      saveStateToHistory(blocks);
      const updated = [...blocks];
      const itemToMove = updated[draggedIndex];
      updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, itemToMove);
      setBlocks(updated);
    } else if (dragMode === "new" && draggedType !== null) {
      saveStateToHistory(blocks);
      const randomId = `${draggedType}-${Date.now().toString().substring(8)}`;
      const newBlock = createNewBlockInstance(draggedType, randomId);
      
      const updated = [...blocks];
      updated.splice(targetIndex, 0, newBlock);
      setBlocks(updated);
      setActiveSectionId(newBlock.id);
      setEditorTab("editor");
    } else if (dragMode === "library-template" && draggedLibraryTemplate !== null) {
      saveStateToHistory(blocks);
      const randomId = `${draggedLibraryTemplate.block.type}-${Date.now().toString().substring(8)}`;
      const newBlock: SectionBlock = {
        ...draggedLibraryTemplate.block,
        id: randomId
      } as SectionBlock;
      
      const updated = [...blocks];
      updated.splice(targetIndex, 0, newBlock);
      setBlocks(updated);
      setActiveSectionId(newBlock.id);
      setEditorTab("editor");
    }
    
    setDraggedIndex(null);
    setDraggedType(null);
    setDraggedLibraryTemplate(null);
    setDragMode(null);
    setDragOverIndex(null);
  };

  const handleDropAppend = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragMode === "new" && draggedType !== null) {
      addBlock(draggedType);
    } else if (dragMode === "library-template" && draggedLibraryTemplate !== null) {
      saveStateToHistory(blocks);
      const randomId = `${draggedLibraryTemplate.block.type}-${Date.now().toString().substring(8)}`;
      const newBlock: SectionBlock = {
        ...draggedLibraryTemplate.block,
        id: randomId
      } as SectionBlock;
      setBlocks(prev => [...prev, newBlock]);
      setActiveSectionId(newBlock.id);
      setEditorTab("editor");
    } else if (dragMode === "reorder" && draggedIndex !== null) {
      saveStateToHistory(blocks);
      const updated = [...blocks];
      const itemToMove = updated[draggedIndex];
      updated.splice(draggedIndex, 1);
      updated.push(itemToMove);
      setBlocks(updated);
    }
    setDraggedIndex(null);
    setDraggedType(null);
    setDraggedLibraryTemplate(null);
    setDragMode(null);
    setDragOverIndex(null);
  };

  const addLibraryTemplate = (template: LibrarySectionTemplate) => {
    saveStateToHistory(blocks);
    const randomId = `${template.block.type}-${Date.now().toString().substring(8)}`;
    const newBlock: SectionBlock = {
      ...template.block,
      id: randomId
    } as SectionBlock;
    setBlocks(prev => [...prev, newBlock]);
    setActiveSectionId(newBlock.id);
    setEditorTab("editor");
  };

  // Editing Block fields helper
  const updateBlockField = (blockId: string, fieldName: string, value: any) => {
    saveStateToHistory(blocks);
    setBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        return {
          ...b,
          fields: {
            ...b.fields,
            [fieldName]: value
          }
        };
      }
      return b;
    }));
  };

  // AI Copywriting generator mock (Offline templates matching parameters)
  const handleGenerateAiCopy = () => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      const generated = [
        {
          heading: `Next-Gen ${aiNiche} Engineered for Speed`,
          subheading: `The ultimate enterprise-grade suite built specifically for teams seeking ${aiTone.toLowerCase()} infrastructure. Deploy in seconds.`,
          tag: "Modern Approach"
        },
        {
          heading: `Stops Vulnerabilities Before They Start`,
          subheading: `Our high-performance ${aiNiche} matrix monitors, audits, and immunizes your workflows with fully automated intelligence.`,
          tag: "Mission Critical"
        },
        {
          heading: `Uncompromising ${aiNiche} Mastery`,
          subheading: `Crafted for leaders who demand rigorous performance, strict privacy, and visually pristine dashboard execution.`,
          tag: "Peerless Quality"
        }
      ];
      setAiSuggestions(generated);
      setIsGeneratingAi(false);
    }, 1200);
  };

  const applyCopySuggestion = (headline: string, desc: string) => {
    if (!activeSectionId) return;
    const target = blocks.find(b => b.id === activeSectionId);
    if (!target) return;

    saveStateToHistory(blocks);
    setBlocks(prev => prev.map(b => {
      if (b.id === activeSectionId) {
        const updatedFields = { ...b.fields };
        if ("heading" in updatedFields) updatedFields.heading = headline;
        if ("subheading" in updatedFields) updatedFields.subheading = desc;
        if ("ctaHeading" in updatedFields) updatedFields.ctaHeading = headline;
        if ("ctaSubheading" in updatedFields) updatedFields.ctaSubheading = desc;
        if ("contactHeading" in updatedFields) updatedFields.contactHeading = headline;
        if ("contactSubheading" in updatedFields) updatedFields.contactSubheading = desc;

        return {
          ...b,
          fields: updatedFields
        };
      }
      return b;
    }));
    
    // Simple mini feedback toast
    alert("AI copy applied successfully to your active section block!");
  };

  // Master Generator function for compiled interactive responsive viewport iframe
  const generateHTMLCode = (forExport = false): string => {
    if (customHtmlOverride) {
      return customHtmlOverride;
    }
    const blocksHtml = blocks.map(block => {
      const f = block.fields;
      
      // Determine Bootstrap class for background configuration
      let bgStyle = "";
      let textStyle = "text-dark";
      if (f.bgColor === "slate-dark") {
        bgStyle = "background-color: #0F172A; border-bottom: 1px solid rgba(255,255,255,0.06);";
        textStyle = "text-light";
      } else if (f.bgColor === "blue-dark") {
        bgStyle = "background-color: #070e1b; border-bottom: 1px solid rgba(255,255,255,0.04);";
        textStyle = "text-light";
      } else if (f.bgColor === "light-gray") {
        bgStyle = "background-color: #f8fafc; border-bottom: 1px solid rgba(0,0,0,0.04);";
        textStyle = "text-dark";
      } else if (f.bgColor === "gradient-indigo") {
        bgStyle = "background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%);";
        textStyle = "text-light";
      } else {
        bgStyle = "background-color: #ffffff; border-bottom: 1px solid rgba(0,0,0,0.04);";
        textStyle = "text-dark";
      }

      // Map padding size classes to actual bootstrap spacing values
      const padY = f.paddingY === "py-6" ? "py-5 py-md-6" : f.paddingY === "py-5" ? "py-4 py-md-5" : f.paddingY === "py-4" ? "py-3 py-md-4" : "py-2 py-md-3";

      // Render block contents individually
      switch (block.type) {
        case "navbar":
          return `
          <nav class="navbar navbar-expand-lg navbar-dark static-top transition-all" style="${bgStyle} padding-top: 1rem; padding-bottom: 1rem;" id="${block.id}">
            <div class="container px-4">
              <a class="navbar-brand fw-extrabold text-white d-flex align-items-center gap-2" href="#">
                <span style="background: linear-gradient(135deg, #6366f1, #a855f7); width: 24px; height: 24px; border-radius: 6px; display: inline-flex; align-items: center; justify-center: center;"></span>
                ${f.brandName || "Nova"}
              </a>
              <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav-${block.id}">
                <span class="navbar-toggler-icon"></span>
              </button>
              <div class="collapse navbar-collapse" id="nav-${block.id}">
                <ul class="navbar-nav mx-auto mb-2 mb-lg-0">
                  ${(f.navLinks || []).map(link => `
                    <li class="nav-item"><a class="nav-link text-white-50 px-3 fw-medium text-capitalize" href="${link.href}">${link.label}</a></li>
                  `).join("")}
                </ul>
                <div class="d-flex">
                  <a class="btn btn-outline-light px-4 py-2 rounded-pill fw-semibold text-xs text-white" href="${f.ctaHref || "#contact"}">${f.ctaText || "Get Started"}</a>
                </div>
              </div>
            </div>
          </nav>`;

        case "hero":
          return f.layout === "split" ? `
          <section class="${padY} transition-all d-flex align-items-center position-relative overflow-hidden" style="${bgStyle}" id="${block.id}">
            <div class="container px-4 position-relative" style="z-index: 10;">
              <div class="row align-items-center g-5">
                <div class="col-lg-6">
                  <span class="badge ${f.bgColor === 'gradient-indigo' ? 'bg-indigo-400' : 'bg-primary'} mb-4 px-3 py-2 text-uppercase font-monospace tracking-wider text-xs">Featured Launch</span>
                  <h1 class="display-4 fw-black tracking-tight mb-4 text-white">${f.heading || "Outstanding Custom Design Solutions"}</h1>
                  <p class="lead text-white-50 mb-5 fs-6">${f.subheading || "A pristine modular layout framework structured for modern conversions and rapid deployments."}</p>
                  <div class="d-flex flex-wrap gap-3">
                    <a class="btn btn-light px-4 py-3 rounded-pill fw-bold" href="${f.buttonPrimaryHref || "#"}">${f.buttonPrimaryText || "Explore Options"}</a>
                    <a class="btn btn-outline-light px-4 py-3 rounded-pill fw-medium" href="${f.buttonSecondaryHref || "#"}">${f.buttonSecondaryText || "Learn More"}</a>
                  </div>
                </div>
                <div class="col-lg-6">
                  <div class="position-relative">
                    <div class="shadow-2xl rounded-4 overflow-hidden" style="border: 1px solid rgba(255,255,255,0.12);">
                      <img src="${f.imageUrl || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60"}" referrerpolicy="no-referrer" class="img-fluid w-100" style="object-fit: cover; max-height: 420px;" alt="Banner Screenshot">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>` : `
          <section class="${padY} text-center transition-all" style="${bgStyle}" id="${block.id}">
            <div class="container px-4">
              <div class="row justify-content-center">
                <div class="col-lg-8">
                  <h1 class="display-3 fw-bold tracking-tight mb-4 ${textStyle}">${f.heading || "Outstanding Custom Design Solutions"}</h1>
                  <p class="lead ${f.bgColor?.includes("dark") ? "text-white-50" : "text-slate-500"} mb-5">${f.subheading || "A pristine modular layout framework structured for modern conversions and rapid deployments."}</p>
                  <div class="d-flex justify-content-center gap-3">
                    <a class="btn btn-primary px-5 py-3 rounded-pill" href="${f.buttonPrimaryHref || "#"}">${f.buttonPrimaryText || "Get Started"}</a>
                    <a class="btn btn-outline-secondary px-5 py-3 rounded-pill" href="${f.buttonSecondaryHref || "#"}">${f.buttonSecondaryText || "Learn More"}</a>
                  </div>
                </div>
              </div>
            </div>
          </section>`;

        case "features":
          return `
          <section class="${padY} transition-all" style="${bgStyle}" id="${block.id}">
            <div class="container px-4">
              <div class="text-center mb-5">
                <h2 class="fw-bold tracking-tight mb-2 ${textStyle}">Core Operational Advantages</h2>
                <p class="text-muted text-xs text-uppercase font-monospace tracking-widest">Built to Perform</p>
              </div>
              <div class="row g-4 mt-2">
                ${(f.featuresList || []).map(feat => `
                  <div class="col-md-4">
                    <div class="card h-100 p-4 border-0 rounded-4" style="background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); background-color: rgba(148, 163, 184, 0.05); transition: transform 0.2s;">
                      <div class="fs-1 mb-3">${feat.icon}</div>
                      <h4 class="fw-bold mb-2 text-white-50 text-dark">${feat.title}</h4>
                      <p class="text-muted mb-0 fs-6">${feat.desc}</p>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          </section>`;

        case "pricing":
          return `
          <section class="${padY} transition-all" style="${bgStyle}" id="${block.id}">
            <div class="container px-4">
              <div class="text-center mb-5">
                <h2 class="fw-bold tracking-tight mb-2 ${textStyle}">Simple Transparent Pricing Options</h2>
                <p class="text-muted text-xs text-uppercase font-monospace tracking-widest">Pricing Matrix</p>
              </div>
              <div class="row g-4 justify-content-center mt-2">
                ${(f.pricingTiers || []).map(tier => `
                  <div class="col-md-4">
                    <div class="card h-100 p-4 border-0 rounded-4 text-center shadow-lg position-relative ${tier.isHighlighted ? "border border-primary" : ""}" style="${tier.isHighlighted ? "background-color: #0b0f19; border: 1.5px solid #6366f1 !important; color: white;" : "background-color: #ffffff; color: #1e293b;"}">
                      ${tier.badge ? `
                        <span class="position-absolute top-0 start-50 translate-middle badge rounded-pill bg-indigo text-uppercase text-xs" style="background-color: #6366f1; padding: 0.5rem 1rem;">${tier.badge}</span>
                      ` : ""}
                      <div class="card-body py-4">
                        <h4 class="fw-bold text-uppercase fs-6 tracking-widest ${tier.isHighlighted ? "text-indigo-400" : "text-indigo-650"}" style="color: #6366f1;">${tier.tierName}</h4>
                        <div class="my-4">
                          <span class="display-4 fw-black font-monospace">$${tier.price}</span>
                          <span class="text-muted">/${tier.period}</span>
                        </div>
                        <ul class="list-unstyled mb-5 text-start space-y-3" style="font-size: 0.9rem;">
                          ${tier.features.map(feat => `
                            <li class="mb-2"><span class="text-success me-2">✓</span> ${feat}</li>
                          `).join("")}
                        </ul>
                        <a href="#" class="btn w-100 py-3 rounded-pill fw-bold ${tier.isHighlighted ? "btn-primary" : "btn-outline-dark"}" style="${tier.isHighlighted ? "background-image: linear-gradient(135deg, #4f46e5, #4338ca); border:none;" : ""}">${tier.buttonText}</a>
                      </div>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          </section>`;

        case "testimonials":
          return `
          <section class="${padY} transition-all" style="${bgStyle}" id="${block.id}">
            <div class="container px-4">
              <div class="text-center mb-5">
                <h2 class="fw-bold tracking-tight mb-2 ${textStyle}">Validated By Active Operators</h2>
                <p class="text-muted text-xs text-uppercase font-monospace tracking-widest">Case Histories</p>
              </div>
              <div class="row g-4 mt-2 justify-content-center">
                ${(f.testimonialsList || []).map(test => `
                  <div class="col-md-5">
                    <div class="card h-100 p-4 border-0 rounded-4" style="background-color: rgba(148, 163, 184, 0.04); border: 1px solid rgba(255,255,255,0.05);">
                      <p class="fst-italic mb-4 ${textStyle}">"${test.quote}"</p>
                      <div class="d-flex align-items-center gap-3">
                        <div class="bg-indigo-500 rounded-circle text-white d-flex align-items-center justify-content-center fw-bold" style="width: 44px; height: 44px;">
                          ${test.author[0]}
                        </div>
                        <div>
                          <h6 class="mb-0 fw-bold ${textStyle}">${test.author}</h6>
                          <small class="text-muted font-monospace text-[10px]">${test.role}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          </section>`;

        case "faq":
          return `
          <section class="${padY} transition-all" style="${bgStyle}" id="${block.id}">
            <div class="container px-4">
              <div class="text-center mb-5">
                <h2 class="fw-bold tracking-tight mb-2 ${textStyle}">Product Knowledge FAQ</h2>
                <p class="text-muted text-xs text-uppercase font-monospace tracking-widest">FAQ Hub</p>
              </div>
              <div class="row justify-content-center mt-2">
                <div class="col-lg-8">
                  <div class="accordion border-0" id="accordion-${block.id}">
                    ${(f.faqList || []).map((faq, i) => `
                      <div class="accordion-item mb-3 border-0 rounded-4 overflow-hidden" style="background-color: rgba(148,163,184,0.04);">
                        <h2 class="accordion-header" id="heading-${block.id}-${i}">
                          <button class="accordion-button collapsed fw-bold px-4 py-3" style="background-color: transparent !important; color: inherit; box-shadow: none;" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${block.id}-${i}">
                            ${faq.question}
                          </button>
                        </h2>
                        <div id="collapse-${block.id}-${i}" class="accordion-collapse collapse" data-bs-parent="#accordion-${block.id}">
                          <div class="accordion-body px-4 pb-4 pt-1 text-muted">
                            ${faq.answer}
                          </div>
                        </div>
                      </div>
                    `).join("")}
                  </div>
                </div>
              </div>
            </div>
          </section>`;

        case "contact":
          return `
          <section class="${padY} text-center transition-all" style="${bgStyle}" id="${block.id}">
            <div class="container px-4">
              <div class="row justify-content-center">
                <div class="col-lg-8">
                  <h2 class="display-5 fw-bold mb-3 ${textStyle}">${f.contactHeading || "Let's Ignite Your Next Enterprise Project"}</h2>
                  <p class="lead text-muted mb-5">${f.contactSubheading || "Ready to outpace the competition? Contact our experts for assistance."}</p>
                  <div class="d-flex flex-wrap justify-content-center gap-4 mb-5 text-sans text-xs">
                    ${f.contactEmail ? `<div class="p-2 border rounded-pill bg-slate-910 d-inline-flex align-items-center gap-2"><span class="text-indigo-400">✉</span> ${f.contactEmail}</div>` : ""}
                    ${f.contactPhone ? `<div class="p-2 border rounded-pill bg-slate-910 d-inline-flex align-items-center gap-2"><span class="text-indigo-400">📞</span> ${f.contactPhone}</div>` : ""}
                  </div>
                  <button class="btn btn-primary px-5 py-3 rounded-pill fw-bold">${f.buttonText || "Trigger Sweeps Workflow"}</button>
                </div>
              </div>
            </div>
          </section>`;

        case "cta":
          return `
          <section class="${padY} text-center text-light transition-all" style="${bgStyle}" id="${block.id}">
            <div class="container px-4">
              <div class="row justify-content-center py-2">
                <div class="col-lg-8">
                  <h2 class="display-6 fw-bold tracking-tight mb-3 text-white">${f.ctaHeading || "Ready to experience instant scaling?"}</h2>
                  <p class="mb-5 text-white-50 leading-relaxed">${f.ctaSubheading || "Create your free Sandbox sandbox account right now to see benefits."}</p>
                  <a class="btn btn-light px-5 py-3 rounded-pill fw-bold" href="${f.ctaButtonHref || "#"}">${f.ctaButtonText || "Get Started"}</a>
                </div>
              </div>
            </div>
          </section>`;

        case "footer":
          return `
          <footer class="${padY} transition-all border-top border-slate-800" style="${bgStyle}" id="${block.id}">
            <div class="container px-4 text-center">
              <p class="mb-0 text-muted fs-6">${f.footerText || "© 2026 Nova Studios. Handcrafted modular layouts."}</p>
            </div>
          </footer>`;

        default:
          return "";
      }
    }).join("\n");

    const customStylesSheet = blocks.map(block => {
      const f = block.fields;
      return `
    /* Styles for block: ${block.id} */
    #${block.id} {
      ${f.textAlign ? `text-align: ${f.textAlign} !important;` : ""}
      ${f.borderStyle ? `border-bottom: ${f.borderStyle} !important;` : ""}
    }
    #${block.id} h1, #${block.id} h2, #${block.id} h3, #${block.id} h4, #${block.id} h5, #${block.id} h6, #${block.id} .display-4, #${block.id} .display-6, #${block.id} .navbar-brand {
      ${f.headingFont ? `font-family: ${f.headingFont} !important;` : ""}
      ${f.headingColor ? `color: ${f.headingColor} !important;` : ""}
      ${f.headingSize ? `font-size: ${f.headingSize} !important;` : ""}
    }
    #${block.id} p, #${block.id} .lead, #${block.id} .nav-link, #${block.id} .text-muted, #${block.id} .accordion-button, #${block.id} .accordion-body, #${block.id} .quote, #${block.id} .testimonial-text {
      ${f.bodyFont ? `font-family: ${f.bodyFont} !important;` : ""}
      ${f.bodyColor ? `color: ${f.bodyColor} !important;` : ""}
    }
    #${block.id} .btn {
      ${f.btnRadius ? `border-radius: ${f.btnRadius} !important;` : ""}
    }
      `;
    }).join("\n");

    const socialFeedHtml = socialFeed.enabled ? `
      <section class="py-5" style="background-color: #0c111d; border-bottom: 1px solid rgba(255,255,255,0.05);" id="social-feed-section">
        <div class="container px-4">
          <div class="row justify-content-center mb-4 text-center">
            <div class="col-lg-8">
              <span class="badge bg-indigo-500 mb-2 px-3 py-1.5 text-uppercase font-monospace text-xs">Live Customer Activity</span>
              <h3 class="fw-bold text-white mb-2">Social Feed Integrations</h3>
              <p class="text-white-50 text-xs">Real-time status synchronizations and user stories from <b>@${socialFeed.feedName}</b></p>
            </div>
          </div>
          <div class="row g-3 justify-content-center">
            <div class="col-md-5">
              <div class="p-4 rounded-4" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255,255,255,0.06); height: 100%;">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="fw-bold text-white text-xs">@${socialFeed.feedName}</span>
                  <span class="text-muted" style="font-size: 11px;">★ Twitter/X Post</span>
                </div>
                <p class="text-white-50 mb-3" style="font-size: 0.85rem; font-style: italic; line-height: 1.5;">"Enforced MAP policy alignment globally across 14 reseller grids in under 3 minutes using the custom-built panels. Perfect compliance assurance!"</p>
                <div class="d-flex align-items-center gap-3 text-muted" style="font-size: 10px; font-family: monospace;">
                  <span class="text-indigo-400">♥ 419 Likes</span>
                  <span>💬 64 Comments</span>
                  <span><a href="${socialFeed.embedUrl}" target="_blank" class="text-indigo-400 text-decoration-none">View Original ↗</a></span>
                </div>
              </div>
            </div>
            <div class="col-md-5">
              <div class="p-4 rounded-4" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255,255,255,0.06); height: 100%;">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="fw-bold text-white text-xs">Verified Administrator</span>
                  <span class="text-muted" style="font-size: 11px;">★ Instagram Story</span>
                </div>
                <p class="text-white-50 mb-3" style="font-size: 0.85rem; font-style: italic; line-height: 1.5;">"Sub-second price trackers have completely eliminated unauthorized bidding in our logistics nodes. Real-time updates: <a href='#' class='text-indigo-300 text-decoration-none'>${socialFeed.embedUrl}</a>"</p>
                <div class="d-flex align-items-center gap-3 text-muted" style="font-size: 10px; font-family: monospace;">
                  <span class="text-indigo-400">♥ 824 Likes</span>
                  <span>💬 120 Comments</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    ` : "";

    let finalBlocksHtml = blocksHtml;
    if (socialFeed.enabled) {
      const footerIndex = finalBlocksHtml.lastIndexOf("<footer");
      if (footerIndex > -1) {
        finalBlocksHtml = finalBlocksHtml.substring(0, footerIndex) + socialFeedHtml + finalBlocksHtml.substring(footerIndex);
      } else {
        finalBlocksHtml += socialFeedHtml;
      }
    }

    const templateHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MapShield Branded Sandbox Preview</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&family=Montserrat:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      overflow-x: hidden;
      scroll-behavior: smooth;
    }
    h1, h2, h3, h4, h5, h6, .navbar-brand {
      font-family: 'Space Grotesk', sans-serif;
    }
    .accordion-button:not(.collapsed) {
      box-shadow: none !important;
    }
    ${customStylesSheet}
  </style>
</head>
<body class="bg-transparent text-white">
  ${finalBlocksHtml}
  
  ${smartCart.enabled ? `
  <!-- Smart Cart Drawer -->
  <div id="smart-cart-drawer" style="position: fixed; top: 0; right: -400px; width: 380px; height: 100%; background: #0f172a; color: #f8fafc; box-shadow: -10px 0 30px rgba(0,0,0,0.5); transition: right 0.3s ease; z-index: 1500; display: flex; flex-direction: column; border-left: 1px solid #1e293b; padding: 24px; font-family: system-ui, sans-serif;">
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 15px; margin-bottom: 15px;">
      <h4 style="margin: 0; font-size: 1.2rem; font-weight: 700; color: #ffffff;">🛒 Your Smart Cart</h4>
      <button onclick="toggleSmartCart()" style="background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; line-height: 1;">&times;</button>
    </div>
    <div id="cart-items-list" style="flex: 1; overflow-y: auto; margin-bottom: 20px;">
      <p style="color: #64748b; text-align: center; margin-top: 50px;">Your cart is empty.</p>
    </div>
    <div style="border-top: 1px solid #1e293b; padding-top: 15px;">
      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1rem; margin-bottom: 15px;">
        <span>Total Due:</span>
        <span id="cart-total">${smartCart.currency} 0.00</span>
      </div>
      <div style="margin-bottom: 15px;">
        <label style="display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 5px;">Secure Invoice Email:</label>
        <input type="email" id="cart-checkout-email" value="${smartCart.checkoutEmail}" style="width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 8px; color: #ffffff; padding: 8px; font-size: 0.9rem;" />
      </div>
      <button onclick="submitCartCheckout()" style="width: 100%; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; border: none; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: opacity 0.2s;">Secure Checkout Now</button>
    </div>
  </div>

  <!-- Floating Cart toggle bubble -->
  <button id="floating-cart-btn" onclick="toggleSmartCart()" style="position: fixed; bottom: 30px; right: 30px; background: #6366f1; border: none; border-radius: 50%; width: 64px; height: 64px; box-shadow: 0 10px 25px rgba(99,102,241,0.4); color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 1050; font-size: 1.5rem;">
    🛒
    <span id="cart-badge-count" style="position: absolute; top: -5px; right: -5px; background: #ef4444; color: white; font-size: 0.75rem; border-radius: 50%; min-width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid #0f172a; padding: 2px; box-sizing: content-box;">0</span>
  </button>
  ` : ""}

  ${popup.enabled ? `
  <!-- Lead Generation Promo Popup -->
  <div id="promo-popup-overlay" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); z-index: 2000; display: none; align-items: center; justify-content: center; transition: opacity 0.3s ease; padding: 15px;">
    <div style="background: ${popup.theme === "indigo" ? "linear-gradient(135deg, #1e1b4b, #312e81)" : popup.theme === "dark" ? "#0f172a" : "#ffffff"}; color: ${popup.theme === "light" ? "#0f172a" : "#f8fafc"}; border: 1px solid ${popup.theme === "light" ? "#e2e8f0" : "#334155"}; padding: 36px; border-radius: 20px; max-width: 500px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); text-align: center; position: relative; font-family: system-ui, sans-serif;">
      <button onclick="closePromoPopup()" style="position: absolute; top: 15px; right: 15px; background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer;">&times;</button>
      <div style="font-size: 3rem; margin-bottom: 15px;">🎁</div>
      <h3 style="margin-bottom: 12px; font-weight: 800; font-size: 1.5rem;">${popup.title}</h3>
      <p style="font-size: 0.95rem; line-height: 1.6; margin-bottom: 24px; color: ${popup.theme === "light" ? "#475569" : "#cbd5e1"};">${popup.description}</p>
      
      <div style="margin-bottom: 15px; display: flex; gap: 8px; flex-direction: column;">
        <input type="email" id="popup-input-email" placeholder="Enter your business email" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #334155; font-size: 0.9rem; background: ${popup.theme === "light" ? "#f1f5f9" : "#1e293b"}; color: ${popup.theme === "light" ? "#0f172a" : "#ffffff"};" />
        <button onclick="submitPromoPopup()" style="width: 100%; cursor: pointer; padding: 12px; background: #6366f1; border: none; border-radius: 8px; color: white; font-weight: bold; font-size: 0.95rem; transition: background 0.2s;">${popup.buttonText}</button>
      </div>
    </div>
  </div>
  ` : ""}

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
  
  <script>
    // FORM SUBMIT HANDLERS
    document.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll("form").forEach(form => {
        form.addEventListener("submit", (e) => {
          e.preventDefault();
          const parent = form.parentElement;
          const successMsg = "${contactConfig.successMessage || "Thank you! Your submission was recorded."}";
          if (parent) {
            parent.innerHTML = \`<div class="p-4 rounded-3 text-center" style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); color: #34d399; font-family: system-ui;"><h4 class="fw-bold mb-2">✓ Query Dispatched</h4><p class="mb-0 text-white-50" style="font-size: 0.9rem;">\s\${successMsg}</p></div>\`;
          }
          if ("${contactConfig.webhookUrl}") {
            fetch("${contactConfig.webhookUrl}", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                event_type: "website_lead",
                timestamp: new Date().toISOString()
              })
            }).catch(() => {});
          }
        });
      });
    });

    // PROMO POPUP SCRIPTS
    function showPromoPopup() {
      const overlay = document.getElementById("promo-popup-overlay");
      if (!overlay) return;
      if (sessionStorage.getItem("promo_popup_viewed")) return;
      overlay.style.display = "flex";
    }

    function closePromoPopup() {
      const overlay = document.getElementById("promo-popup-overlay");
      if (overlay) overlay.style.display = "none";
      sessionStorage.setItem("promo_popup_viewed", "true");
    }

    function submitPromoPopup() {
      const email = document.getElementById("popup-input-email").value;
      if (!email || !email.includes("@")) {
        alert("Please specify a valid secure business email address.");
        return;
      }
      alert("Success! 🌌 Your 25% promotional coupon code has been generated and dispatched to: " + email);
      closePromoPopup();
    }

    ${popup.enabled ? `
    window.addEventListener("DOMContentLoaded", () => {
      ${
        popup.triggerEvent === "time"
          ? `setTimeout(() => { showPromoPopup(); }, ${popup.delaySeconds * 1000});`
          : `document.addEventListener("mouseleave", (e) => { if(e.clientY < 30) { showPromoPopup(); } });`
      }
    });
    ` : ""}

    // SMART CART SCRIPTS
    let cart = [];
    function toggleSmartCart() {
      const drawer = document.getElementById("smart-cart-drawer");
      if (!drawer) return;
      if (drawer.style.right === "0px") {
        drawer.style.right = "-400px";
      } else {
        drawer.style.right = "0px";
      }
    }

    function addToCart(name, price) {
      const idx = cart.findIndex(item => item.name === name);
      if (idx > -1) {
        cart[idx].qty += 1;
      } else {
        cart.push({ name, price, qty: 1 });
      }
      renderCart();
      const drawer = document.getElementById("smart-cart-drawer");
      if (drawer) drawer.style.right = "0px";
    }

    function renderCart() {
      const list = document.getElementById("cart-items-list");
      const badge = document.getElementById("cart-badge-count");
      const totalSpan = document.getElementById("cart-total");
      if (!list) return;
      
      if (cart.length === 0) {
        list.innerHTML = '<p style="color: #64748b; text-align: center; margin-top: 50px;">Your cart is empty.</p>';
        if (badge) badge.textContent = "0";
        if (totalSpan) totalSpan.textContent = "${smartCart.currency} 0.00";
        return;
      }

      let itemsHtml = "";
      let total = 0;
      let totalQty = 0;
      
      cart.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        totalQty += item.qty;
        itemsHtml += \`
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; background: #1e293b; padding: 12px; border-radius: 8px; border: 1px solid #334155;">
            <div>
              <div style="font-weight: 600; font-size: 0.95rem; color: #ffffff;">\s\${item.name}</div>
              <div style="font-size: 0.8rem; color: #94a3b8;">\s\${item.qty} &times; ${smartCart.currency} \s\${item.price.toFixed(2)}</div>
            </div>
            <button onclick="removeFromCart(\s\${index})" style="background: none; border: none; color: #f43f5e; cursor: pointer; font-size: 1.1rem; line-height: 1;">&times;</button>
          </div>
        \`;
      });
      
      list.innerHTML = itemsHtml;
      if (badge) badge.textContent = totalQty.toString();
      if (totalSpan) totalSpan.textContent = "${smartCart.currency} " + total.toFixed(2);
    }

    function removeFromCart(index) {
      cart.splice(index, 1);
      renderCart();
    }

    function submitCartCheckout() {
      const email = document.getElementById("cart-checkout-email").value;
      if (!email || !email.includes("@")) {
        alert("Please specify a valid secure contact email for order confirmation dispatch.");
        return;
      }
      alert("✨ Order Pending Authentication! Checkout connection established to server. A secure carrier invoice was dispatched to: " + email);
      cart = [];
      renderCart();
      toggleSmartCart();
    }

    ${smartCart.enabled ? `
    // Auto buy button mapping
    document.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll('.btn, .btn-primary, .btn-light, .btn-outline-light').forEach(btn => {
        const txt = btn.textContent.trim().toLowerCase();
        if (txt.includes('trial') || txt.includes('sign') || txt.includes('book') || txt.includes('order') || txt.includes('buy') || txt.includes('started') || txt.includes('join') || txt.includes('get')) {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            let parentCard = btn.closest(".card") || btn.closest(".col-md-4") || btn.closest("section");
            let itemName = btn.textContent.trim();
            let priceVal = 89.00;
            if (parentCard) {
              const h4 = parentCard.querySelector("h4") || parentCard.querySelector(".tierName");
              if (h4) itemName = h4.textContent.trim();
              const priceDom = parentCard.querySelector(".price") || parentCard.querySelector("h3");
              if (priceDom) {
                const matched = priceDom.textContent.match(/\\\\d+/);
                if (matched) priceVal = parseFloat(matched[0]);
              }
            }
            addToCart(itemName, priceVal);
          });
        }
      });
    });
    ` : ""}
  </script>
</body>
</html>`;

    return templateHTML;
  };

  // Triggers reload of iframe contents
  const reloadPreview = () => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = generateHTMLCode();
    }
  };

  useEffect(() => {
    reloadPreview();
  }, [blocks]);

  // Copy full generated code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateHTMLCode(true));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download full index.html file to local desktop
  const handleDownloadIndex = () => {
    const text = generateHTMLCode(true);
    const blob = new Blob([text], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "index.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compile a single library category template into beautiful, responsive sandbox preview document
  const generateTemplatePreviewHTML = (template: LibrarySectionTemplate | null): string => {
    if (!template) return "";
    
    // Create static fields reference
    const f = template.block.fields;
    const blockId = "preview-temp-block-" + template.id;

    // Determine Bootstrap class for background configuration
    let bgStyle = "";
    let textStyle = "text-dark";
    if (f.bgColor === "slate-dark") {
      bgStyle = "background-color: #0F172A; text-shadow: 0 1px 2px rgba(0,0,0,0.4); min-height: 100vh; display: flex; align-items: center; justify-content: center;";
      textStyle = "text-light";
    } else if (f.bgColor === "blue-dark") {
      bgStyle = "background-color: #070e1b; text-shadow: 0 1px 2px rgba(0,0,0,0.4); min-height: 100vh; display: flex; align-items: center; justify-content: center;";
      textStyle = "text-light";
    } else if (f.bgColor === "light-gray") {
      bgStyle = "background-color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center;";
      textStyle = "text-dark";
    } else if (f.bgColor === "gradient-indigo") {
      bgStyle = "background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%); text-shadow: 0 1px 2px rgba(0,0,0,0.3); min-height: 100vh; display: flex; align-items: center; justify-content: center;";
      textStyle = "text-light";
    } else {
      bgStyle = "background-color: #ffffff; min-height: 100vh; display: flex; align-items: center; justify-content: center;";
      textStyle = "text-dark";
    }

    const padY = "py-5 py-md-6 w-100";
    let blockHtml = "";

    switch (template.block.type) {
      case "navbar":
        blockHtml = `
        <nav class="navbar navbar-expand-lg navbar-dark static-top transition-all w-100" style="${bgStyle} min-height: auto;" id="${blockId}">
          <div class="container px-4">
            <a class="navbar-brand fw-extrabold text-white d-flex align-items-center gap-2" href="#">
              <span style="background: linear-gradient(135deg, #6366f1, #a855f7); width: 24px; height: 24px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center;"></span>
              ${f.brandName || "Nova"}
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav-${blockId}">
              <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="nav-${blockId}">
              <ul class="navbar-nav mx-auto mb-2 mb-lg-0">
                ${(f.navLinks || []).map(link => `
                  <li class="nav-item"><a class="nav-link text-white-50 px-3 fw-medium text-capitalize" href="${link.href}">${link.label}</a></li>
                `).join("")}
              </ul>
              <div class="d-flex">
                <a class="btn btn-outline-light px-4 py-2 rounded-pill fw-semibold text-xs text-white" href="${f.ctaHref || "#contact"}">${f.ctaText || "Get Started"}</a>
              </div>
            </div>
          </div>
        </nav>`;
        break;

      case "hero":
        blockHtml = f.layout === "split" ? `
        <section class="${padY} transition-all d-flex align-items-center position-relative overflow-hidden" style="${bgStyle}" id="${blockId}">
          <div class="container px-4 position-relative" style="z-index: 10;">
            <div class="row align-items-center g-5">
              <div class="col-lg-6">
                <span class="badge ${f.bgColor === 'gradient-indigo' ? 'bg-indigo-400' : 'bg-primary'} mb-4 px-3 py-2 text-uppercase font-monospace tracking-wider text-xs">Featured Layout</span>
                <h1 class="display-5 fw-black tracking-tight mb-4 text-white">${f.heading || "Outstanding Custom Design Solutions"}</h1>
                <p class="lead text-white-50 mb-5 fs-6">${f.subheading || "A pristine modular layout framework structured for modern conversions and rapid deployments."}</p>
                <div class="d-flex flex-wrap gap-3">
                  <a class="btn btn-light px-4 py-3 rounded-pill fw-bold" href="${f.buttonPrimaryHref || "#"}">${f.buttonPrimaryText || "Explore Options"}</a>
                  <a class="btn btn-outline-light px-4 py-3 rounded-pill fw-medium" href="${f.buttonSecondaryHref || "#"}">${f.buttonSecondaryText || "Learn More"}</a>
                </div>
              </div>
              <div class="col-lg-6">
                <div class="position-relative">
                  <div class="shadow-2xl rounded-4 overflow-hidden" style="border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 10px 30px rgba(0,0,0,0.35);">
                    <img src="${f.imageUrl || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60"}" referrerpolicy="no-referrer" class="img-fluid w-100" style="object-fit: cover; max-height: 420px;" alt="Banner Screenshot">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>` : `
        <section class="${padY} text-center transition-all d-flex align-items-center" style="${bgStyle}" id="${blockId}">
          <div class="container px-4">
            <div class="row justify-content-center">
              <div class="col-lg-10">
                <h1 class="display-4 fw-bold tracking-tight mb-4 ${textStyle}">${f.heading || "Outstanding Custom Design Solutions"}</h1>
                <p class="lead ${f.bgColor?.includes("dark") ? "text-white-50" : "text-slate-500"} mb-5" style="font-size: 1.15rem; max-width: 800px; margin-left: auto; margin-right: auto;">${f.subheading || "A pristine modular layout framework structured for modern conversions and rapid deployments."}</p>
                <div class="d-flex justify-content-center gap-3">
                  <a class="btn btn-primary px-5 py-3 rounded-pill fw-bold bg-indigo" style="background-color: #6366f1; border-color: #6366f1;" href="${f.buttonPrimaryHref || "#"}">${f.buttonPrimaryText || "Get Started"}</a>
                  <a class="btn btn-outline-secondary px-5 py-3 rounded-pill fw-medium" href="${f.buttonSecondaryHref || "#"}">${f.buttonSecondaryText || "Learn More"}</a>
                </div>
              </div>
            </div>
          </div>
        </section>`;
        break;

      case "features":
        blockHtml = `
        <section class="${padY} transition-all w-100" style="${bgStyle}" id="${blockId}">
          <div class="container px-4">
            <div class="text-center mb-5">
              <h2 class="fw-bold tracking-tight mb-2 ${textStyle}">Core Operational Advantages</h2>
              <p class="text-muted text-xs text-uppercase font-monospace tracking-widest">Built to Perform</p>
            </div>
            <div class="row g-4 mt-2">
              ${(f.featuresList || []).map(feat => `
                <div class="col-md-4">
                  <div class="card h-100 p-4 border-0 rounded-4" style="background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); background-color: rgba(148, 163, 184, 0.05); border: 1px solid rgba(255, 255, 255, 0.05);">
                    <div class="fs-1 mb-3">${feat.icon}</div>
                    <h4 class="fw-bold mb-2 text-dark" style="${f.bgColor?.includes("dark") ? "color:rgba(255,255,255,0.9)" : "color:#0f172a"}">${feat.title}</h4>
                    <p class="text-muted mb-0 fs-6">${feat.desc}</p>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        </section>`;
        break;

      case "pricing":
        blockHtml = `
        <section class="${padY} transition-all w-100" style="${bgStyle}" id="${blockId}">
          <div class="container px-4">
            <div class="text-center mb-5">
              <h2 class="fw-bold tracking-tight mb-2 ${textStyle}">Simple Transparent Pricing Options</h2>
              <p class="text-muted text-xs text-uppercase font-monospace tracking-widest">Pricing Matrix</p>
            </div>
            <div class="row g-4 justify-content-center mt-2">
              ${(f.pricingTiers || []).map(tier => `
                <div class="col-md-5">
                  <div class="card h-100 p-4 border-0 rounded-4 text-center shadow-lg position-relative ${tier.isHighlighted ? "border border-primary" : ""}" style="${tier.isHighlighted ? "background-color: #0b0f19; border: 1.5px solid #6366f1 !important; color: white;" : "background-color: #ffffff; color: #1e293b;"}">
                    ${tier.badge ? `
                      <span class="position-absolute top-0 start-50 translate-middle badge rounded-pill bg-indigo text-uppercase text-xs" style="background-color: #6366f1; padding: 0.5rem 1rem;">${tier.badge}</span>
                    ` : ""}
                    <div class="card-body py-3">
                      <h4 class="fw-bold text-uppercase fs-6 tracking-widest ${tier.isHighlighted ? "text-indigo-400" : "text-indigo-650"}" style="color: #6366f1;">${tier.tierName}</h4>
                      <div class="my-4">
                        <span class="display-5 fw-black font-monospace">$${tier.price}</span>
                        <span class="text-muted">/${tier.period}</span>
                      </div>
                      <ul class="list-unstyled mb-5 text-start space-y-3" style="font-size: 0.9rem;">
                        ${tier.features.map(feat => `
                          <li class="mb-2"><span class="text-success me-2">✓</span> ${feat}</li>
                        `).join("")}
                      </ul>
                      <a href="#" class="btn w-100 py-3 rounded-pill fw-bold ${tier.isHighlighted ? "btn-light" : "btn-outline-dark"}" style="${tier.isHighlighted ? "background-image: linear-gradient(135deg, #4f46e5, #4338ca); border:none; color:white;" : ""}">${tier.buttonText}</a>
                    </div>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        </section>`;
        break;

      case "testimonials":
        blockHtml = `
        <section class="${padY} transition-all w-100" style="${bgStyle}" id="${blockId}">
          <div class="container px-4">
            <div class="text-center mb-5">
              <h2 class="fw-bold tracking-tight mb-2 ${textStyle}">Validated By Active Operators</h2>
              <p class="text-muted text-xs text-uppercase font-monospace tracking-widest">Case Histories</p>
            </div>
            <div class="row g-4 mt-2 justify-content-center">
              ${(f.testimonialsList || []).map(test => `
                <div class="col-md-5">
                  <div class="card h-100 p-4 border-0 rounded-4" style="background-color: rgba(148, 163, 184, 0.05); border: 1px solid rgba(255,255,255,0.05);">
                    <p class="fst-italic mb-4" style="${f.bgColor?.includes("dark") ? "color:rgba(255,255,255,0.75)" : "color:#334155"}">"${test.quote}"</p>
                    <div class="d-flex align-items-center gap-3">
                      <div class="bg-indigo-500 rounded-circle text-white d-flex align-items-center justify-content-center fw-bold" style="width: 44px; height: 44px;">
                        ${test.author[0]}
                      </div>
                      <div>
                        <h6 class="mb-0 fw-bold" style="${f.bgColor?.includes("dark") ? "color:white" : "color:#0f172a"}">${test.author}</h6>
                        <small class="text-muted font-monospace text-[10px]">${test.role}</small>
                      </div>
                    </div>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        </section>`;
        break;

      case "faq":
        blockHtml = `
        <section class="${padY} transition-all w-100" style="${bgStyle}" id="${blockId}">
          <div class="container px-4">
            <div class="text-center mb-5">
              <h2 class="fw-bold tracking-tight mb-2 ${textStyle}">Product Knowledge FAQ</h2>
              <p class="text-muted text-xs text-uppercase font-monospace tracking-widest">FAQ Hub</p>
            </div>
            <div class="row justify-content-center mt-2">
              <div class="col-lg-8">
                <div class="accordion border-0" id="accordion-${blockId}">
                  ${(f.faqList || []).map((faq, i) => `
                    <div class="accordion-item mb-3 border-0 rounded-4 overflow-hidden" style="background-color: rgba(148,163,184,0.04); border: 1px solid rgba(0,0,0,0.03);">
                      <h2 class="accordion-header" id="heading-${blockId}-${i}">
                        <button class="accordion-button collapsed fw-bold px-4 py-3" style="background-color: transparent !important; color: inherit; box-shadow: none;" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${blockId}-${i}">
                          ${faq.question}
                        </button>
                      </h2>
                      <div id="collapse-${blockId}-${i}" class="accordion-collapse collapse" data-bs-parent="#accordion-${blockId}">
                        <div class="accordion-body px-4 pb-4 pt-1 text-muted fs-6">
                          ${faq.answer}
                        </div>
                      </div>
                    </div>
                  `).join("")}
                </div>
              </div>
            </div>
          </div>
        </section>`;
        break;

      case "contact":
        blockHtml = `
        <section class="${padY} text-center transition-all w-100" style="${bgStyle}" id="${blockId}">
          <div class="container px-4">
            <div class="row justify-content-center">
              <div class="col-lg-8">
                <h2 class="display-5 fw-bold mb-3 ${textStyle}">${f.contactHeading || "Let's Ignite Your Next Enterprise Project"}</h2>
                <p class="lead text-muted mb-5">${f.contactSubheading || "Ready to outpace the competition? Contact our experts for assistance."}</p>
                <div class="d-flex flex-wrap justify-content-center gap-4 mb-5 text-sans text-xs">
                  ${f.contactEmail ? `<div class="p-2 border rounded-pill bg-slate-910 d-inline-flex align-items-center gap-2"><span class="text-indigo-400">✉</span> ${f.contactEmail}</div>` : ""}
                  ${f.contactPhone ? `<div class="p-2 border rounded-pill bg-slate-910 d-inline-flex align-items-center gap-2"><span class="text-indigo-400">📞</span> ${f.contactPhone}</div>` : ""}
                </div>
                <button class="btn btn-primary px-5 py-3 rounded-pill fw-bold bg-indigo border-0">${f.buttonText || "Trigger Sweeps Workflow"}</button>
              </div>
            </div>
          </div>
        </section>`;
        break;

      case "cta":
        blockHtml = `
        <section class="${padY} text-center text-light transition-all w-100" style="${bgStyle}" id="${blockId}">
          <div class="container px-4">
            <div class="row justify-content-center py-2">
              <div class="col-lg-8">
                <h2 class="display-5 fw-bold tracking-tight mb-3 text-white">${f.ctaHeading || "Ready to experience instant scaling?"}</h2>
                <p class="mb-5 text-white-50 leading-relaxed">${f.ctaSubheading || "Create your free Sandbox sandbox account right now to see benefits."}</p>
                <a class="btn btn-light px-5 py-3 rounded-pill fw-bold" href="${f.ctaButtonHref || "#"}">${f.ctaButtonText || "Get Started"}</a>
              </div>
            </div>
          </div>
        </section>`;
        break;

      case "footer":
        blockHtml = `
        <footer class="${padY} transition-all border-top border-slate-800 w-100" style="${bgStyle}" id="${blockId}">
          <div class="container px-4 text-center">
            <p class="mb-0 text-muted fs-6">${f.footerText || "© 2026 Nova Studios. Handcrafted modular layouts."}</p>
          </div>
        </footer>`;
        break;

      default:
        blockHtml = "";
    }

    const templateHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Category Block Live Preview</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      margin: 0;
      padding: 0;
      overflow-x: hidden;
      background-color: transparent;
    }
    h1, h2, h3, h4, h5, h6, .navbar-brand {
      font-family: 'Space Grotesk', sans-serif;
    }
    .accordion-button:not(.collapsed) {
      box-shadow: none !important;
    }
  </style>
</head>
<body class="bg-transparent text-white">
  ${blockHtml}
  
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;

    return templateHTML;
  };

  const activeBlock = blocks.find(b => b.id === activeSectionId);

  return (
    <div className="space-y-6 animate-fade-in font-sans" id="website-builder-root-container">
      
      {/* Sovereign Standalone Workspace Navigation / Publishing bar */}
      {isStandaloneMode && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <button
              type="button"
              onClick={() => setIsStandaloneMode?.(false)}
              className="bg-slate-950 hover:bg-slate-850 text-slate-350 hover:text-white border border-slate-800 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer select-none"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard Panel
            </button>
            <div className="hidden sm:block h-5 w-px bg-slate-800"></div>
            <div>
              <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                {brandIdentity.logoUrl && (
                  <div className="flex items-center justify-center p-0.5 bg-white border border-slate-700 rounded-lg shrink-0 w-7 h-7 select-none shadow-sm">
                    <img 
                      src={brandIdentity.logoUrl} 
                      alt="Company Brand Logo" 
                      referrerPolicy="no-referrer"
                      className="max-w-full max-h-full object-contain rounded"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <h3 className="text-sm font-bold text-white tracking-tight">CloudboyX Pro Workspace</h3>
                <span className="text-[8px] font-mono font-bold tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase animate-pulse">
                  Standalone Active
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Sovereign landing page build, compile, and live routing cloud module.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center font-sans">
            {publishSuccess && publishedUrl && (
              <a
                href={publishedUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-indigo-950/40 text-indigo-300 hover:text-indigo-200 border border-indigo-800/60 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition text-center"
              >
                <Eye className="w-3.5 h-3.5" />
                Launch Live Site ↗
              </a>
            )}

            <button
              onClick={handleDownloadIndex}
              className="bg-slate-950 hover:bg-slate-850 text-indigo-300 hover:text-white border border-slate-800 hover:border-slate-700 py-1.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-lg select-none animate-pulse"
              title="Download fully compile index.html package for upload to a local web server (Apache, Nginx, local container, etc.)"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400 animate-bounce" />
              Download Local Server Files
            </button>

            <button
              onClick={handlePublishLive}
              disabled={isPublishing}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/80 text-white font-bold py-1.5 px-4 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-950/20"
            >
              {isPublishing ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Compiling & Deploying...
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5" />
                  Publish Live to Cloud
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            {brandIdentity.logoUrl && (
              <div className="flex items-center justify-center p-1 bg-white border border-slate-700 rounded-lg shrink-0 w-8 h-8 select-none shadow-md">
                <img 
                  src={brandIdentity.logoUrl} 
                  alt="Company Brand Logo" 
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-full object-contain rounded"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="p-1 px-2.5 rounded-md text-[10px] bg-indigo-500/10 text-indigo-400 font-bold tracking-widest font-mono uppercase">
                  {isStandaloneMode ? "Standalone Build Environment" : "Module: CloudboyX"}
                </span>
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
            </div>
          </div>
          <h2 className="text-xl font-bold font-display text-white">Instant Bootstrap Landing Page Builder</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            Assemble, style, and draft responsive customer-facing website pages. Crafted using modular grid systems with custom Bootstrap structures that &quot;actually make sense.&quot;
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {/* Standalone toggle switcher */}
          <button
            type="button"
            onClick={() => setIsStandaloneMode?.(!isStandaloneMode)}
            className="bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 py-1.5 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title={isStandaloneMode ? "Exit immersive standalone mode" : "Enter full standalone workspace mode"}
          >
            <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
            {isStandaloneMode ? "Leave Full Mode" : "Standalone Workspace"}
          </button>

          {/* Preset Selector dropdown */}
          <div className="relative">
            <select
              value={selectedTemplate}
              onChange={(e) => handleLoadTemplate(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 py-1.5 px-3 rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="saas">Load: SaaS Landing Suite</option>
              <option value="agency">Load: Bold Creative Agency Portfolio</option>
              <option value="logistics">Load: SafeShip Cargo Logistics</option>
              <option value="brand_protection">Load: BrandShield MAP Integrity Portal</option>
              <option value="ecom_wholesale">Load: B2B Authorized Reseller Portal</option>
            </select>
          </div>

          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
              history.length === 0 
                ? "bg-slate-800/40 border-slate-800 text-slate-505 cursor-not-allowed" 
                : "bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 cursor-pointer"
            }`}
            title="Undo previous step changes"
          >
            <Undo className="w-3.5 h-3.5" />
            Undo
          </button>

          <button
            type="button"
            onClick={handleDownloadIndex}
            className="bg-slate-950 hover:bg-slate-850 text-emerald-400 hover:text-emerald-350 border border-slate-800 hover:border-slate-700 py-1.5 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-md select-none"
            title="Download fully-compiled static HTML website files for hosting on any local server or web host."
          >
            <Download className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
            Export Website Files
          </button>

          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-indigo-550/10"
          >
            <Code className="w-3.5 h-3.5" />
            Export Code
          </button>
        </div>
      </div>

      {/* Main Workspace split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
        
        {/* Left Hand Component Drawer & Properties Panel */}
        <div className="lg:col-span-4 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 rounded-2xl overflow-hidden flex flex-col shadow-sm">
          
          {/* Panel Selector tabs - Custom Dual-Row Bento Layout */}
          <div className="grid grid-cols-5 border-b border-slate-800/80 p-2.5 bg-slate-950/60 gap-1.5 font-mono text-[8px] font-semibold">
            <button
              type="button"
              onClick={() => setEditorTab("structure")}
              className={`py-2 px-0.5 rounded-lg transition text-center cursor-pointer ${
                editorTab === "structure" 
                  ? "bg-slate-800 text-indigo-400 border border-slate-700 shadow-inner" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
              title="Drag/drop blocks mapping hierarchy"
            >
              <Layers className="w-3.5 h-3.5 mx-auto mb-1 text-indigo-400" />
              BLOCKS
            </button>

            <button
              type="button"
              onClick={() => setEditorTab("templates")}
              className={`py-2 px-0.5 rounded-lg transition text-center cursor-pointer ${
                editorTab === "templates" 
                  ? "bg-slate-800 text-indigo-400 border border-slate-700 shadow-inner" 
                  : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/40"
              }`}
              title="Prebuilt responsive layouts library"
            >
              <Plus className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-400" />
              LIBRARY
            </button>

            <button
              type="button"
              onClick={() => setEditorTab("editor")}
              className={`py-2 px-0.5 rounded-lg transition text-center cursor-pointer ${
                editorTab === "editor"
                  ? "bg-slate-800 text-indigo-400 border border-slate-700 shadow-inner"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
              title="Configure properties of active section"
            >
              <Edit3 className="w-3.5 h-3.5 mx-auto mb-1 text-blue-400" />
              EDIT
            </button>

            <button
              type="button"
              onClick={() => setEditorTab("brand")}
              className={`py-2 px-0.5 rounded-lg transition text-center cursor-pointer ${
                editorTab === "brand"
                  ? "bg-slate-800 text-indigo-400 border border-slate-700 shadow-inner"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
              title="Corporate identity assets & typography guidelines"
            >
              <Briefcase className="w-3.5 h-3.5 mx-auto mb-1 text-purple-400" />
              BRAND
            </button>

            <button
              type="button"
              onClick={() => setEditorTab("ai-copywriter")}
              className={`py-2 px-0.5 rounded-lg transition text-center cursor-pointer ${
                editorTab === "ai-copywriter"
                  ? "bg-slate-800 text-indigo-400 border border-slate-700 shadow-inner"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
              title="Intelligent copy assistant powered by Gemini"
            >
              <Sparkles className="w-3.5 h-3.5 mx-auto mb-1 text-amber-400" />
              AI COPY
            </button>

            <button
              type="button"
              onClick={() => setEditorTab("ai-generator")}
              className={`py-2 px-0.5 rounded-lg transition text-center cursor-pointer ${
                editorTab === "ai-generator"
                  ? "bg-slate-800 text-indigo-400 border border-slate-700 shadow-inner"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
              title="Full page generator based on simple description"
            >
              <Wand2 className="w-3.5 h-3.5 mx-auto mb-1 text-pink-400" />
              AI SITE
            </button>

            <button
              type="button"
              onClick={() => setEditorTab("extensions")}
              className={`py-2 px-0.5 rounded-lg transition text-center cursor-pointer ${
                editorTab === "extensions"
                  ? "bg-slate-800 text-indigo-400 border border-slate-700 shadow-inner"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
              title="Smart Cart, feeds integrations & transactional popups"
            >
              <ShoppingBag className="w-3.5 h-3.5 mx-auto mb-1 text-cyan-400" />
              PLUGINS
            </button>

            <button
              type="button"
              onClick={() => setEditorTab("publishing")}
              className={`py-2 px-0.5 rounded-lg transition text-center cursor-pointer ${
                editorTab === "publishing"
                  ? "bg-slate-800 text-indigo-400 border border-slate-700 shadow-inner"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
              title="Publishing configurations (FTP, domains, standalone node offline compile)"
            >
              <Globe className="w-3.5 h-3.5 mx-auto mb-1 text-sky-400" />
              PUBLISH
            </button>

            <button
              type="button"
              onClick={() => setEditorTab("projects")}
              className={`py-2 px-0.5 rounded-lg transition text-center cursor-pointer col-span-2 ${
                editorTab === "projects"
                  ? "bg-slate-800 text-indigo-400 border border-slate-700 shadow-inner"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
              title="Manage local drafts registry"
            >
              <Database className="w-3.5 h-3.5 mx-auto mb-1 text-zinc-400" />
              DRAFTS ({projects.length})
            </button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto space-y-5">
            {/* TAB CONTENT: Structure block reordering / additions */}
            {editorTab === "structure" && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Webpage Hierarchy:</span>
                  <p className="text-[11px] text-slate-400 leading-normal mb-3">
                    Drag blocks by their grip handle to reorder, drag new components from the toolbox below, or click any block to edit.
                  </p>
                  
                  <div className="space-y-2.5">
                    {blocks.map((block, idx) => {
                      const isActive = block.id === activeSectionId;
                      return (
                        <div
                          key={block.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, idx, "reorder")}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDragLeave={() => {
                            if (dragOverIndex === idx) setDragOverIndex(null);
                          }}
                          onDragEnd={handleDragEnd}
                          onDrop={(e) => handleDrop(e, idx)}
                          onClick={() => {
                            setActiveSectionId(block.id);
                            setEditorTab("editor");
                          }}
                          className={`p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-move select-none relative ${
                            isActive
                              ? "bg-indigo-950/25 border-indigo-600/80 shadow-md shadow-indigo-900/10"
                              : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/90"
                          } ${
                            dragOverIndex === idx 
                              ? "border-indigo-500 bg-indigo-950/30 scale-[1.01] -translate-y-0.5 border-b-2" 
                              : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="p-1 rounded hover:bg-slate-800 cursor-grab active:cursor-grabbing text-slate-500 hover:text-indigo-400 block shrink-0" title="Drag to reorder">
                              <GripVertical className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-xl shrink-0">
                              {block.type === "navbar" && "🧭"}
                              {block.type === "hero" && "🚀"}
                              {block.type === "features" && "⚡"}
                              {block.type === "pricing" && "💳"}
                              {block.type === "testimonials" && "💬"}
                              {block.type === "faq" && "❓"}
                              {block.type === "contact" && "✉"}
                              {block.type === "cta" && "📢"}
                              {block.type === "footer" && "📁"}
                            </span>
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold text-slate-200">
                                {block.fields.brandName || block.fields.heading || block.fields.ctaHeading || block.title}
                              </h4>
                              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-semibold">{block.type}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => moveBlock(idx, "up")}
                              disabled={idx === 0}
                              className={`p-1 rounded transition ${idx === 0 ? "text-slate-800 cursor-not-allowed" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                              title="Move section higher"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => moveBlock(idx, "down")}
                              disabled={idx === blocks.length - 1}
                              className={`p-1 rounded transition ${idx === blocks.length - 1 ? "text-slate-800 cursor-not-allowed" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                              title="Move section down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteBlock(block.id)}
                              className="p-1.5 rounded text-rose-500 hover:bg-rose-950/30 hover:text-rose-400 transition"
                              title="Remove section block"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Dotted target zone to drop at bottom */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragOverIndex !== -1) setDragOverIndex(-1);
                      }}
                      onDragLeave={() => {
                        if (dragOverIndex === -1) setDragOverIndex(null);
                      }}
                      onDrop={handleDropAppend}
                      className={`p-4 rounded-xl border border-dashed text-center font-mono text-[10px] uppercase tracking-wider transition-all duration-200 mt-2 ${
                        dragOverIndex === -1
                          ? "border-indigo-500 bg-indigo-950/45 text-indigo-400 scale-[1.02] shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                          : "border-slate-800 bg-slate-950/20 text-slate-500 hover:border-slate-700 hover:text-slate-400"
                      }`}
                    >
                      ✨ Drop here to append component to bottom
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Insert / Drag Component Toolbox:</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Click a component to append or <b>drag-and-drop</b> it directly into any position in the hierarchy above.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      draggable
                      onDragStart={(e) => handleDragStartNew(e, "navbar")}
                      onDragEnd={handleDragEnd}
                      onClick={() => addBlock("navbar")}
                      className="p-3 bg-slate-950 hover:bg-slate-800/50 text-slate-300 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-[11px] font-semibold flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing transition select-none hover:shadow-sm"
                      title="Drag to place, or click to append"
                    >
                      <span className="text-lg">🧭</span>
                      Navbar Strip
                    </button>
                    <button
                      draggable
                      onDragStart={(e) => handleDragStartNew(e, "hero")}
                      onDragEnd={handleDragEnd}
                      onClick={() => addBlock("hero")}
                      className="p-3 bg-slate-950 hover:bg-slate-800/50 text-slate-300 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-[11px] font-semibold flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing transition select-none hover:shadow-sm"
                      title="Drag to place, or click to append"
                    >
                      <span className="text-lg">🚀</span>
                      Hero Section
                    </button>
                    <button
                      draggable
                      onDragStart={(e) => handleDragStartNew(e, "features")}
                      onDragEnd={handleDragEnd}
                      onClick={() => addBlock("features")}
                      className="p-3 bg-slate-950 hover:bg-slate-800/50 text-slate-300 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-[11px] font-semibold flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing transition select-none hover:shadow-sm"
                      title="Drag to place, or click to append"
                    >
                      <span className="text-lg">⚡</span>
                      Feature Grid
                    </button>
                    <button
                      draggable
                      onDragStart={(e) => handleDragStartNew(e, "pricing")}
                      onDragEnd={handleDragEnd}
                      onClick={() => addBlock("pricing")}
                      className="p-3 bg-slate-950 hover:bg-slate-800/50 text-slate-300 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-[11px] font-semibold flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing transition select-none hover:shadow-sm"
                      title="Drag to place, or click to append"
                    >
                      <span className="text-lg">💳</span>
                      Pricing Card
                    </button>
                    <button
                      draggable
                      onDragStart={(e) => handleDragStartNew(e, "testimonials")}
                      onDragEnd={handleDragEnd}
                      onClick={() => addBlock("testimonials")}
                      className="p-3 bg-slate-950 hover:bg-slate-800/50 text-slate-300 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-[11px] font-semibold flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing transition select-none hover:shadow-sm"
                      title="Drag to place, or click to append"
                    >
                      <span className="text-lg">💬</span>
                      Client Praise
                    </button>
                    <button
                      draggable
                      onDragStart={(e) => handleDragStartNew(e, "faq")}
                      onDragEnd={handleDragEnd}
                      onClick={() => addBlock("faq")}
                      className="p-3 bg-slate-950 hover:bg-slate-800/50 text-slate-300 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-[11px] font-semibold flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing transition select-none hover:shadow-sm"
                      title="Drag to place, or click to append"
                    >
                      <span className="text-lg">❓</span>
                      FAQ Accordion
                    </button>
                    <button
                      draggable
                      onDragStart={(e) => handleDragStartNew(e, "contact")}
                      onDragEnd={handleDragEnd}
                      onClick={() => addBlock("contact")}
                      className="p-3 bg-slate-950 hover:bg-slate-800/50 text-slate-300 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-[11px] font-semibold flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing transition select-none hover:shadow-sm"
                      title="Drag to place, or click to append"
                    >
                      <span className="text-lg">✉</span>
                      Contact Form
                    </button>
                    <button
                      draggable
                      onDragStart={(e) => handleDragStartNew(e, "cta")}
                      onDragEnd={handleDragEnd}
                      onClick={() => addBlock("cta")}
                      className="p-3 bg-slate-950 hover:bg-slate-800/50 text-slate-300 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-[11px] font-semibold flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing transition select-none hover:shadow-sm"
                      title="Drag to place, or click to append"
                    >
                      <span className="text-lg">📢</span>
                      Action Banner
                    </button>
                    <button
                      draggable
                      onDragStart={(e) => handleDragStartNew(e, "footer")}
                      onDragEnd={handleDragEnd}
                      onClick={() => addBlock("footer")}
                      className="p-3 bg-slate-950 hover:bg-slate-800/50 text-slate-300 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-[11px] font-semibold flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing transition col-span-2 select-none hover:shadow-sm"
                      title="Drag to place, or click to append"
                    >
                      <span className="text-lg">📁</span>
                      Resource Footer Panel
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT: Pre-built Bootstrap Templates Library */}
            {editorTab === "templates" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-widest text-indigo-400">
                    <Plus className="w-4 h-4 text-emerald-400" />
                    BOOTSTRAP SECTION LIBRARY
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Select a ready-to-use structural template from our layout library. 
                    Click <b>"Insert Template"</b> to append, or <b>drag its card grip</b> directly anywhere onto the live block hierarchy list!
                  </p>
                </div>

                {/* Visual Premium Launcher Badge */}
                <button
                  type="button"
                  onClick={() => setIsTemplateGalleryOpen(true)}
                  className="w-full bg-gradient-to-r from-indigo-900/40 via-indigo-950/20 to-slate-900/90 hover:from-indigo-900/60 hover:via-indigo-950/30 border border-indigo-500/30 hover:border-indigo-400 p-3.5 rounded-xl flex items-center justify-between transition text-left cursor-pointer hover:shadow-indigo-950/20 hover:shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl bg-indigo-500/10 border border-indigo-500/20 shadow-md w-8 h-8 rounded-lg flex items-center justify-center select-none shrink-0 animate-pulse">
                      🎨
                    </span>
                    <div className="truncate">
                      <h4 className="text-[11px] font-bold text-white tracking-wide font-sans">Launch Template Gallery Board</h4>
                      <p className="text-[9px] text-indigo-300 font-mono mt-0.5">Browse interactive blueprints & thumbnail previews</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0" />
                </button>

                {/* Search Inputs */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search templates (e.g., 'SaaS', 'cyber')..."
                    value={librarySearchQuery}
                    onChange={(e) => setLibrarySearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 font-sans focus:outline-none focus:border-indigo-500 transition"
                  />
                  {librarySearchQuery && (
                    <button
                      onClick={() => setLibrarySearchQuery("")}
                      className="absolute right-3 top-2 text-[10px] bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white px-1.5 py-0.5 rounded font-mono transition"
                    >
                      CLEAR
                    </button>
                  )}
                </div>

                {/* Category Quick Chips */}
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {[
                    { id: "all", label: "All Layouts" },
                    { id: "hero", label: "Heros" },
                    { id: "features", label: "Features" },
                    { id: "pricing", label: "Pricing" },
                    { id: "contact", label: "Contact" },
                    { id: "testimonials", label: "Praise" }
                  ].map((cat) => {
                    const isActive = libraryCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setLibraryCategory(cat.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition uppercase cursor-pointer ${
                          isActive
                            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/10"
                            : "bg-slate-950 text-slate-450 hover:text-slate-200 hover:bg-slate-900"
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                {/* Filter and render library items */}
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                  {(() => {
                    const filtered = LIBRARY_SECTION_TEMPLATES.filter((temp) => {
                      const matchesCat = libraryCategory === "all" || temp.category === libraryCategory;
                      const matchesQuery = !librarySearchQuery || 
                        temp.name.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
                        temp.description.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
                        temp.category.toLowerCase().includes(librarySearchQuery.toLowerCase());
                      return matchesCat && matchesQuery;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-10 bg-slate-950/35 border border-slate-850 rounded-xl">
                          <span className="text-lg block mb-1">🔍</span>
                          <p className="text-[11px] text-slate-500 font-mono">No matching section templates found.</p>
                          <button 
                            onClick={() => { setLibrarySearchQuery(""); setLibraryCategory("all"); }}
                            className="text-[10px] text-indigo-400 hover:underline mt-1 cursor-pointer font-bold"
                          >
                            Reset filters
                          </button>
                        </div>
                      );
                    }

                    return filtered.map((temp) => {
                      return (
                        <div
                          key={temp.id}
                          draggable
                          onDragStart={(e) => handleDragStartTemplate(e, temp)}
                          onDragEnd={handleDragEnd}
                          className="bg-slate-950/80 border border-slate-850 hover:border-slate-700/80 p-3.5 rounded-xl flex flex-col gap-2 transition hover:bg-slate-950 group select-none relative"
                          title="Drag this entire card grip handle to insert anywhere!"
                        >
                          {/* Card Header & category identifier */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-center text-sm">
                                {temp.icon}
                              </span>
                              <div>
                                <h4 className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition">
                                  {temp.name}
                                </h4>
                                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-semibold block">
                                  {temp.category} layout
                                </span>
                              </div>
                            </div>

                            {/* Drag Grip indicator banner */}
                            <div 
                              className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-md text-[9px] font-mono font-bold text-slate-400 flex items-center gap-1 cursor-grab active:cursor-grabbing hover:bg-slate-800 hover:text-white"
                              title="Drag from this grip directly into the hierarchy lists!"
                            >
                              <GripVertical className="w-3 h-3 text-indigo-400" />
                              DRAG
                            </div>
                          </div>

                          {/* Template Description */}
                          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                            {temp.description}
                          </p>

                          {/* Block spec tag tags */}
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-indigo-950/40 border border-indigo-900/40 font-mono text-indigo-300 font-bold uppercase">
                              {temp.block.fields.bgColor || "dark"}
                            </span>
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-slate-500">
                              {temp.block.fields.paddingY || "py-5"}
                            </span>
                            {temp.block.fields.layout && (
                              <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-slate-400 font-semibold uppercase">
                                {temp.block.fields.layout}
                              </span>
                            )}
                          </div>

                          {/* Quick Add and visual actions */}
                          <div className="flex items-center gap-1.5 border-t border-slate-900 pt-2.5 mt-1 animate-fade-in">
                            <button
                              type="button"
                              onClick={() => addLibraryTemplate(temp)}
                              className="flex-1 bg-indigo-950/20 border border-indigo-900/50 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 text-indigo-300 py-1.5 px-2.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition"
                              title="Insert this template into the active layout sequence"
                            >
                              <Plus className="w-3 h-3" />
                              Insert
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewingTemplate(temp);
                                setPreviewViewport("desktop");
                              }}
                              className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition"
                              title="Click to live-preview this template across responsive viewports prior to importing"
                            >
                              <Eye className="w-3 h-3 text-indigo-400" />
                              Preview
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Edit fields of selected block */}
            {editorTab === "editor" && (
              <div className="space-y-4">
                {!activeBlock ? (
                  <div className="text-center py-8 text-slate-500 font-mono text-xs">
                    No section selected. Click a section block in the Hierarchy list tab first!
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-950 border border-indigo-950/60 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-mono text-indigo-400 capitalize block tracking-widest font-bold">Editing: {activeBlock.type}</span>
                        <h4 className="text-xs font-bold text-slate-200">{activeBlock.title}</h4>
                      </div>
                      <span className="text-lg">
                        {activeBlock.type === "navbar" && "🧭"}
                        {activeBlock.type === "hero" && "🚀"}
                        {activeBlock.type === "features" && "⚡"}
                        {activeBlock.type === "pricing" && "💳"}
                        {activeBlock.type === "testimonials" && "💬"}
                        {activeBlock.type === "faq" && "❓"}
                        {activeBlock.type === "contact" && "✉"}
                        {activeBlock.type === "cta" && "📢"}
                        {activeBlock.type === "footer" && "📁"}
                      </span>
                    </div>

                    {/* Shared Styling Properties */}
                    <div className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-xl space-y-3">
                      <span className="text-[10px] font-mono text-slate-450 uppercase tracking-widest font-bold block">Layout Options</span>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-400">Background</label>
                          <select
                            value={activeBlock.fields.bgColor}
                            onChange={(e) => updateBlockField(activeBlock.id, "bgColor", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300"
                          >
                            <option value="slate-dark">Slate (Dark)</option>
                            <option value="blue-dark">Nova Midnight (Dark)</option>
                            <option value="light-gray">Off-White (Light)</option>
                            <option value="clean-white">Paper White (Light)</option>
                            <option value="gradient-indigo">Vibrant Gradient</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-400">Y-Padding</label>
                          <select
                            value={activeBlock.fields.paddingY}
                            onChange={(e) => updateBlockField(activeBlock.id, "paddingY", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300"
                          >
                            <option value="py-3">Compact (32px)</option>
                            <option value="py-4">Standard (48px)</option>
                            <option value="py-5">Spacious (72px)</option>
                            <option value="py-6">Broad (96px)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Typography & Custom Styling Panel */}
                    <div className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-xl space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold block">Typography & Text Styling</span>
                        <span className="text-[9px] bg-indigo-950/80 border border-indigo-900/60 font-mono text-indigo-300 px-1.5 py-0.5 rounded uppercase font-bold text-center">Customizer</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Heading Font */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-400">Heading Font</label>
                          <select
                            value={activeBlock.fields.headingFont || ""}
                            onChange={(e) => updateBlockField(activeBlock.id, "headingFont", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300"
                          >
                            <option value="">Default (Space Grotesk)</option>
                            <option value="'Space Grotesk', sans-serif">Space Grotesk</option>
                            <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans</option>
                            <option value="'Inter', sans-serif">Inter</option>
                            <option value="'Playfair Display', serif">Playfair Display</option>
                            <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                            <option value="'Outfit', sans-serif">Outfit</option>
                            <option value="'Montserrat', sans-serif">Montserrat</option>
                          </select>
                        </div>

                        {/* Body Font */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-400">Body Font</label>
                          <select
                            value={activeBlock.fields.bodyFont || ""}
                            onChange={(e) => updateBlockField(activeBlock.id, "bodyFont", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300"
                          >
                            <option value="">Default (Plus Jakarta)</option>
                            <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans</option>
                            <option value="'Inter', sans-serif">Inter</option>
                            <option value="'Montserrat', sans-serif">Montserrat</option>
                            <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Heading Text Color */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-400">Heading Color</label>
                          <div className="space-y-1.5">
                            <select
                              value={
                                ["", "#ffffff", "#94a3b8", "#fbbf24", "#22d3ee", "#34d399", "#f87171", "#0f172a"].includes(activeBlock.fields.headingColor || "")
                                  ? activeBlock.fields.headingColor || ""
                                  : "custom"
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "custom") {
                                  updateBlockField(activeBlock.id, "headingColor", "#6366f1");
                                } else {
                                  updateBlockField(activeBlock.id, "headingColor", val);
                                }
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-305 text-slate-300"
                            >
                              <option value="">Theme Default</option>
                              <option value="#ffffff">Pure White</option>
                              <option value="#94a3b8">Slate Grey</option>
                              <option value="#fbbf24">Soft Amber</option>
                              <option value="#22d3ee">Cyan Sky</option>
                              <option value="#34d399">Emerald Tint</option>
                              <option value="#f87171">Soft Rose</option>
                              <option value="#0f172a">Dark Slate</option>
                              <option value="custom">★ Custom Color Code</option>
                            </select>
                            {(activeBlock.fields.headingColor && !["", "#ffffff", "#94a3b8", "#fbbf24", "#22d3ee", "#34d399", "#f87171", "#0f172a"].includes(activeBlock.fields.headingColor)) && (
                              <div className="flex gap-1.5 items-center">
                                <input
                                  type="color"
                                  value={activeBlock.fields.headingColor || "#ffffff"}
                                  onChange={(e) => updateBlockField(activeBlock.id, "headingColor", e.target.value)}
                                  className="w-6 h-6 rounded bg-transparent border border-slate-800 cursor-pointer p-0 shrink-0"
                                />
                                <input
                                  type="text"
                                  value={activeBlock.fields.headingColor || ""}
                                  onChange={(e) => updateBlockField(activeBlock.id, "headingColor", e.target.value)}
                                  placeholder="#ffffff"
                                  className="w-full bg-slate-1000 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[10px] font-mono text-slate-300"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Body Text Color */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-400">Body Color</label>
                          <div className="space-y-1.5">
                            <select
                              value={
                                ["", "#f1f5f9", "#94a3b8", "#fde047", "#67e8f9", "#6ee7b7", "#fca5a5", "#334155"].includes(activeBlock.fields.bodyColor || "")
                                  ? activeBlock.fields.bodyColor || ""
                                  : "custom"
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "custom") {
                                  updateBlockField(activeBlock.id, "bodyColor", "#a5b4fc");
                                } else {
                                  updateBlockField(activeBlock.id, "bodyColor", val);
                                }
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-305 text-slate-300"
                            >
                              <option value="">Theme Default</option>
                              <option value="#f1f5f9">Off White</option>
                              <option value="#94a3b8">Slate Muted</option>
                              <option value="#fde047">Amber Muted</option>
                              <option value="#67e8f9">Cyan Muted</option>
                              <option value="#6ee7b7">Emerald Muted</option>
                              <option value="#fca5a5">Rose Muted</option>
                              <option value="#334155">Dark Slate Muted</option>
                              <option value="custom">★ Custom Color Code</option>
                            </select>
                            {(activeBlock.fields.bodyColor && !["", "#f1f5f9", "#94a3b8", "#fde047", "#67e8f9", "#6ee7b7", "#fca5a5", "#334155"].includes(activeBlock.fields.bodyColor)) && (
                              <div className="flex gap-1.5 items-center">
                                <input
                                  type="color"
                                  value={activeBlock.fields.bodyColor || "#f1f5f9"}
                                  onChange={(e) => updateBlockField(activeBlock.id, "bodyColor", e.target.value)}
                                  className="w-6 h-6 rounded bg-transparent border border-slate-800 cursor-pointer p-0 shrink-0"
                                />
                                <input
                                  type="text"
                                  value={activeBlock.fields.bodyColor || ""}
                                  onChange={(e) => updateBlockField(activeBlock.id, "bodyColor", e.target.value)}
                                  placeholder="#ebf4ff"
                                  className="w-full bg-slate-1000 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[10px] font-mono text-slate-300"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Heading Size Multiplier */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-400">Heading Size</label>
                          <select
                            value={activeBlock.fields.headingSize || ""}
                            onChange={(e) => updateBlockField(activeBlock.id, "headingSize", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300"
                          >
                            <option value="">Default</option>
                            <option value="1.5rem">Small (24px)</option>
                            <option value="2.25rem">Medium (36px)</option>
                            <option value="3rem">Large (48px)</option>
                            <option value="4.25rem">Extra Large (68px)</option>
                            <option value="5.5rem">Mammoth (88px)</option>
                          </select>
                        </div>

                        {/* Text Alignment */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-400">Content Align</label>
                          <select
                            value={activeBlock.fields.textAlign || ""}
                            onChange={(e) => updateBlockField(activeBlock.id, "textAlign", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300"
                          >
                            <option value="">Default Flow</option>
                            <option value="left">Left Aligned</option>
                            <option value="center">Centered</option>
                            <option value="right">Right Aligned</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Button Border Radius */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-400">Button Curvature</label>
                          <select
                            value={activeBlock.fields.btnRadius || ""}
                            onChange={(e) => updateBlockField(activeBlock.id, "btnRadius", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300"
                          >
                            <option value="">Default Pill</option>
                            <option value="0px">Sharp Square</option>
                            <option value="6px">Slight Soft (6px)</option>
                            <option value="12px">Rounded Modern (12px)</option>
                            <option value="999px">Perfect Pill</option>
                          </select>
                        </div>

                        {/* Section Border Accent */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-400">Bottom Border Line</label>
                          <select
                            value={activeBlock.fields.borderStyle || ""}
                            onChange={(e) => updateBlockField(activeBlock.id, "borderStyle", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300"
                          >
                            <option value="">None / Thin Default</option>
                            <option value="1px solid rgba(255,255,255,0.1)">Thin Accent Board</option>
                            <option value="2px dashed rgba(99,102,241,0.4)">Dashed Indigo Line</option>
                            <option value="4px solid #10b981">Solid Thick Emerald</option>
                            <option value="4px solid #4f46e5">Solid Thick Indigo</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Navbar Fields editing */}
                    {activeBlock.type === "navbar" && (
                      <div className="space-y-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-400">Brand Name</label>
                          <input
                            type="text"
                            value={activeBlock.fields.brandName || ""}
                            onChange={(e) => updateBlockField(activeBlock.id, "brandName", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-400">Main Call-To-Action Text</label>
                          <input
                            type="text"
                            value={activeBlock.fields.ctaText || ""}
                            onChange={(e) => updateBlockField(activeBlock.id, "ctaText", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-400">Target Segment Anchor Links</label>
                          <p className="text-[9px] text-slate-500 font-mono">Comma-separated route tags (e.g. Features, Pricing, Contact)</p>
                          <input
                            type="text"
                            defaultValue={(activeBlock.fields.navLinks || []).map(l => l.label).join(", ")}
                            onBlur={(e) => {
                              const list = e.target.value.split(",").map(val => {
                                const trimmed = val.trim();
                                return { label: trimmed, href: `#${trimmed.toLowerCase().replace(/[^a-z0-9]/g, "")}` };
                              }).filter(v => v.label.length > 0);
                              updateBlockField(activeBlock.id, "navLinks", list);
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {/* Hero Fields editing */}
                    {activeBlock.type === "hero" && (
                      <div className="space-y-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-400">Primary Headline</label>
                          <textarea
                            value={activeBlock.fields.heading || ""}
                            onChange={(e) => updateBlockField(activeBlock.id, "heading", e.target.value)}
                            rows={2}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-400">Body Copy / Pitch</label>
                          <textarea
                            value={activeBlock.fields.subheading || ""}
                            onChange={(e) => updateBlockField(activeBlock.id, "subheading", e.target.value)}
                            rows={3}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 leading-normal"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-slate-400">Button 1 Text</label>
                            <input
                              type="text"
                              value={activeBlock.fields.buttonPrimaryText || ""}
                              onChange={(e) => updateBlockField(activeBlock.id, "buttonPrimaryText", e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-slate-400">Button 2 Text</label>
                            <input
                              type="text"
                              value={activeBlock.fields.buttonSecondaryText || ""}
                              onChange={(e) => updateBlockField(activeBlock.id, "buttonSecondaryText", e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-400">Banner Asset Image URL</label>
                          <input
                            type="text"
                            value={activeBlock.fields.imageUrl || ""}
                            onChange={(e) => updateBlockField(activeBlock.id, "imageUrl", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-400">Design Layout Aspect</label>
                          <select
                            value={activeBlock.fields.layout}
                            onChange={(e) => updateBlockField(activeBlock.id, "layout", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300"
                          >
                            <option value="split">Split Mockup Image (Side-by-side)</option>
                            <option value="centered">Centered Pitch (Standard Hero)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Features Fields editing */}
                    {activeBlock.type === "features" && (
                      <div className="space-y-3.5">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Configure Key Perks:</span>
                        
                        {(activeBlock.fields.featuresList || []).map((feat, idx) => (
                          <div key={idx} className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                            <div className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded-lg">
                              <span className="text-[9px] font-mono font-bold text-indigo-400">Perk Benefit #{idx + 1}</span>
                              <input 
                                type="text" 
                                value={feat.icon} 
                                onChange={(e) => {
                                  const list = [...(activeBlock.fields.featuresList || [])];
                                  list[idx].icon = e.target.value;
                                  updateBlockField(activeBlock.id, "featuresList", list);
                                }}
                                className="w-8 text-center bg-slate-950 border border-slate-840 rounded text-xs py-0.5"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={feat.title}
                                onChange={(e) => {
                                  const list = [...(activeBlock.fields.featuresList || [])];
                                  list[idx].title = e.target.value;
                                  updateBlockField(activeBlock.id, "featuresList", list);
                                }}
                                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200 font-bold"
                                placeholder="Benefit headline"
                              />
                            </div>

                            <div className="space-y-1">
                              <textarea
                                value={feat.desc}
                                onChange={(e) => {
                                  const list = [...(activeBlock.fields.featuresList || [])];
                                  list[idx].desc = e.target.value;
                                  updateBlockField(activeBlock.id, "featuresList", list);
                                }}
                                rows={2}
                                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-350 leading-relaxed"
                                placeholder="Benefit brief pitch"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pricing Grid editing */}
                    {activeBlock.type === "pricing" && (
                      <div className="space-y-3.5">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Configure Tier Cards:</span>
                        
                        {(activeBlock.fields.pricingTiers || []).map((tier, idx) => (
                          <div key={idx} className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                            <div className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded-lg">
                              <span className="text-[9px] font-mono font-bold text-indigo-400">{tier.tierName} Card</span>
                              <label className="text-[9px] font-mono flex items-center gap-1 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={tier.isHighlighted}
                                  onChange={(e) => {
                                    const list = [...(activeBlock.fields.pricingTiers || [])];
                                    list[idx].isHighlighted = e.target.checked;
                                    updateBlockField(activeBlock.id, "pricingTiers", list);
                                  }}
                                  className="rounded text-indigo-600 bg-slate-950 border-slate-800"
                                />
                                Highlight card
                              </label>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={tier.tierName}
                                onChange={(e) => {
                                  const list = [...(activeBlock.fields.pricingTiers || [])];
                                  list[idx].tierName = e.target.value;
                                  updateBlockField(activeBlock.id, "pricingTiers", list);
                                }}
                                className="bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200 font-bold"
                                placeholder="Tier name"
                              />
                              <input
                                type="text"
                                value={tier.price}
                                onChange={(e) => {
                                  const list = [...(activeBlock.fields.pricingTiers || [])];
                                  list[idx].price = e.target.value;
                                  updateBlockField(activeBlock.id, "pricingTiers", list);
                                }}
                                className="bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200 font-mono text-right"
                                placeholder="Price"
                              />
                            </div>

                            <input
                              type="text"
                              value={tier.buttonText}
                              onChange={(e) => {
                                const list = [...(activeBlock.fields.pricingTiers || [])];
                                list[idx].buttonText = e.target.value;
                                updateBlockField(activeBlock.id, "pricingTiers", list);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200"
                              placeholder="Button CTA"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CTA section editing */}
                    {activeBlock.type === "cta" && (
                      <div className="space-y-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-400">Callout Banner Heading</label>
                          <input
                            type="text"
                            value={activeBlock.fields.ctaHeading || ""}
                            onChange={(e) => updateBlockField(activeBlock.id, "ctaHeading", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-bold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-400">Sub-narrative copy</label>
                          <textarea
                            value={activeBlock.fields.ctaSubheading || ""}
                            onChange={(e) => updateBlockField(activeBlock.id, "ctaSubheading", e.target.value)}
                            rows={3}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 leading-normal"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-400">Primary Button Label</label>
                          <input
                            type="text"
                            value={activeBlock.fields.ctaButtonText || ""}
                            onChange={(e) => updateBlockField(activeBlock.id, "ctaButtonText", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                          />
                        </div>
                      </div>
                    )}

                    {/* FAQ list editing */}
                    {activeBlock.type === "faq" && (
                      <div className="space-y-3.5">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Configure FAQ Pairs:</span>
                        
                        {(activeBlock.fields.faqList || []).map((faq, i) => (
                          <div key={i} className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                            <span className="text-[9px] font-mono text-indigo-400 font-bold block">Accordian FAQ #{i + 1}</span>
                            <input
                              type="text"
                              value={faq.question}
                              onChange={(e) => {
                                const list = [...(activeBlock.fields.faqList || [])];
                                list[i].question = e.target.value;
                                updateBlockField(activeBlock.id, "faqList", list);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200 font-bold"
                              placeholder="Question"
                            />
                            <textarea
                              value={faq.answer}
                              onChange={(e) => {
                                const list = [...(activeBlock.fields.faqList || [])];
                                list[i].answer = e.target.value;
                                updateBlockField(activeBlock.id, "faqList", list);
                              }}
                              rows={2}
                              className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-350 leading-relaxed"
                              placeholder="Answer"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Footer text editing */}
                    {activeBlock.type === "footer" && (
                      <div className="space-y-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-400">Copyright Line & Branding disclaimer</label>
                          <textarea
                            value={activeBlock.fields.footerText || ""}
                            onChange={(e) => updateBlockField(activeBlock.id, "footerText", e.target.value)}
                            rows={3}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono"
                          />
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: AI Assisted Copywriting assistant */}
            {editorTab === "ai-copywriter" && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950/60 rounded-xl border border-indigo-950/40 space-y-3.5">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                    AI Marketing Copy Copilot
                  </div>
                  
                  <p className="text-[11px] text-slate-450 leading-relaxed">
                    Struggling with weak, design-diluting headings? Input your target niche, select an editorial design tone, and generate tailored Bootstrap headings to apply mock layouts instantly.
                  </p>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">Target Niche/Industries</label>
                    <input
                      type="text"
                      value={aiNiche}
                      onChange={(e) => setAiNiche(e.target.value)}
                      placeholder="e.g. Brand Safety SaaS, BioTech"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">Editorial Brand Tone</label>
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300"
                    >
                      <option value="Premium & Tech-Forward">Premium &amp; Tech-Forward</option>
                      <option value="Scientific & Rigorous">Scientific &amp; Rigorous</option>
                      <option value="Bold & Punchy Sales Pitch">Bold &amp; Punchy Sales Pitch</option>
                      <option value="Minimalist Editorial Serif">Minimalist Editorial Serif</option>
                    </select>
                  </div>

                  <button
                    onClick={handleGenerateAiCopy}
                    disabled={isGeneratingAi}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer select-none"
                  >
                    {isGeneratingAi ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Analyzing Copywriting Metrics...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Analyze &amp; Write Headlines
                      </>
                    )}
                  </button>
                </div>

                {/* AI Suggestions generated feedback */}
                {aiSuggestions.length > 0 && (
                  <div className="space-y-3.5">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">AI Editorial Suggestions:</span>
                    
                    {aiSuggestions.map((sug, i) => (
                      <div 
                        key={i} 
                        className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 transition hover:border-indigo-900/60"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{sug.tag}</span>
                          <button
                            onClick={() => applyCopySuggestion(sug.heading, sug.subheading)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-bold px-2 py-1 rounded transition flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            Apply Direct
                          </button>
                        </div>
                        <h4 className="text-xs font-bold text-slate-200 leading-snug">{sug.heading}</h4>
                        <p className="text-[11px] text-slate-450 leading-relaxed font-sans">{sug.subheading}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: Cloud Projects Database */}
            {editorTab === "projects" && (
              <div className="space-y-4 font-sans text-xs">
                {/* Active Session Info */}
                <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-850 flex items-center justify-between">
                  <div className="truncate pr-2">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Operational Session:</span>
                    <span className="text-slate-300 font-mono text-[11px] font-semibold truncate block" title={currentUser?.email || "Standalone Agent"}>
                      {currentUser?.email || "Local Operator"}
                    </span>
                  </div>
                  <span className="shrink-0 text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full font-mono uppercase">
                    ONLINE
                  </span>
                </div>

                {/* Secure Custody Badge */}
                <div className="p-3 bg-indigo-950/40 border border-indigo-500/10 rounded-xl text-left font-sans space-y-1">
                  <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">🔒 Locked Storage Node</span>
                  <p className="text-[10px] text-slate-350 leading-relaxed font-sans">
                    It's <strong className="text-indigo-400">your data</strong>, and it must be protected in a locked folder accessible only via an isolated IP address. We are unconcerned with what you keep in your folder; it is not our business.
                  </p>
                </div>

                {/* DB Alerts */}
                {projectError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-start gap-2 font-mono">
                    <span className="mt-0.5 shrink-0 text-rose-400">⚠️</span>
                    <span>{projectError}</span>
                  </div>
                )}
                {projectSuccessMsg && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-start gap-2 font-mono">
                    <span className="mt-0.5 shrink-0 text-emerald-400">✓</span>
                    <span>{projectSuccessMsg}</span>
                  </div>
                )}

                {/* Save Current State Form */}
                <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3.5">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                    <Save className="w-3.5 h-3.5 hover:scale-110 transition duration-150" />
                    <span>{activeProjectId ? "Update Active Project" : "Commit New Project"}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Project Name</label>
                      <input
                        type="text"
                        placeholder="e.g. CloudboyX Alpha Portal"
                        value={projectNameInput}
                        onChange={(e) => setProjectNameInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Description / Metadata</label>
                      <input
                        type="text"
                        placeholder="e.g. Saas promo with bento components"
                        value={projectDescInput}
                        onChange={(e) => setProjectDescInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCreateNewProject}
                        className="py-2 px-3 bg-slate-900 hover:bg-slate-850 text-slate-350 hover:text-white border border-slate-800 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer select-none"
                        title="Clear board and start fresh"
                      >
                        <Plus className="w-3.5 h-3.5 text-indigo-400" />
                        Start Fresh
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveToFirestore(projectNameInput, projectDescInput)}
                        disabled={isSavingProject || !projectNameInput.trim()}
                        className="py-2 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm select-none border border-indigo-500"
                      >
                        {isSavingProject ? (
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>{activeProjectId ? "Save Changes" : "Save Webpage"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cloud Projects List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Saved Projects ({projects.length})</span>
                    <button
                      type="button"
                      onClick={fetchUserProjects}
                      disabled={isLoadingProjects}
                      className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 font-bold transition flex items-center gap-1 cursor-pointer bg-transparent"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingProjects ? "animate-spin" : ""}`} />
                      Refresh
                    </button>
                  </div>

                  {isLoadingProjects && (
                    <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                      <span className="w-6 h-6 border-2 border-indigo-500/25 border-t-indigo-500 rounded-full animate-spin"></span>
                      <p className="text-[10px] text-slate-500 font-mono">Synchronizing workspace query...</p>
                    </div>
                  )}

                  {!isLoadingProjects && projects.length === 0 && (
                    <div className="py-8 px-4 bg-slate-950/25 border border-slate-850/60 rounded-xl text-center">
                      <p className="text-slate-500 font-mono text-[11px]">No saved projects found on your Cloud Auth Node.</p>
                      <p className="text-[10px] text-slate-600 mt-1">Fill out the Name and hit Save Webpage to establish your first database project!</p>
                    </div>
                  )}

                  {!isLoadingProjects && projects.length > 0 && (
                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                      {projects.map((proj) => {
                        const isActive = proj.id === activeProjectId;
                        return (
                          <div
                            key={proj.id}
                            onClick={() => handleLoadProject(proj)}
                            className={`p-3 bg-slate-950/65 border rounded-xl flex flex-col gap-1.5 transition cursor-pointer select-none text-left relative group ${
                              isActive 
                                ? "border-indigo-500/50 bg-slate-950" 
                                : "border-slate-850 hover:border-slate-750"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <h4 className="font-bold text-white tracking-tight truncate max-w-[170px]" title={proj.name}>
                                {proj.name}
                              </h4>
                              <div className="flex items-center gap-1 shrink-0">
                                {isActive && (
                                  <span className="text-[8px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold font-mono px-1.5 py-0.5 rounded">
                                    ACTIVE
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteProject(proj.id, e)}
                                  className="w-6 h-6 rounded bg-slate-900 hover:bg-rose-950/60 border border-slate-850 hover:border-rose-900 text-slate-500 hover:text-rose-400 flex items-center justify-center transition cursor-pointer"
                                  title="Permanently remove project from cloud"
                                >
                                  <Trash className="w-3.5 h-3.5 text-rose-550" />
                                </button>
                              </div>
                            </div>

                            {proj.description && (
                              <p className="text-[11px] text-slate-400 leading-normal truncate font-sans" title={proj.description}>
                                {proj.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 border-t border-slate-900/40 pt-1.5 mt-0.5">
                              <span>{proj.blocks?.length || 0} layouts</span>
                              <span>{new Date(proj.updatedAt || proj.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: AI Website Generator */}
            {editorTab === "ai-generator" && (
              <div className="space-y-4 font-sans text-xs">
                <div className="p-3 bg-pink-950/20 border border-pink-500/15 rounded-xl text-left space-y-1">
                  <div className="flex items-center gap-1.5 text-pink-400 font-bold">
                    <Wand2 className="w-4 h-4" />
                    <span className="text-[10px] font-mono uppercase tracking-widest">Intelligent Page Generator</span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-normal">
                    Describe your requirements inside the console prompt below. Gemini will design and build multiple layout sections tailored specifically to your campaign!
                  </p>
                </div>

                {generationError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-450 text-rose-400 rounded-xl font-mono text-[11px]">
                    ⚠️ {generationError}
                  </div>
                )}

                <div className="space-y-3 p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Prompt Requirements:</label>
                    <textarea
                      rows={5}
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      placeholder="e.g., A minimalist Swiss design layout for a smart shipping validation routing system, featuring dynamic stats and blue-dark theme..."
                      className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-pink-500/65 rounded-lg p-2.5 text-xs text-slate-250 font-mono focus:outline-none resize-none leading-relaxed"
                      disabled={isGenerating}
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Style Suggestions:</span>
                    <div className="grid grid-cols-2 gap-1.5 font-sans">
                      {[
                        "Cyberpunk Dark Audit Hub",
                        "Modern Minimalist SaaS Layout",
                        "High Contrast Fleet Dashboard",
                        "Editorial Cargo Analytics Portal"
                      ].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setPromptInput(s + " featuring a clean layout, customized sections, and rich illustrations.")}
                          className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-left text-[10px] text-slate-350 hover:text-white transition cursor-pointer"
                          disabled={isGenerating}
                        >
                          ✨ {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleAIGenerateSite}
                      disabled={isGenerating || !promptInput.trim()}
                      className="w-full py-2.5 px-4 bg-pink-700 bg-gradient-to-r from-pink-600 to-indigo-650 hover:from-pink-500 hover:to-indigo-550 disabled:opacity-40 text-white rounded-xl font-bold font-sans transition flex items-center justify-center gap-2 cursor-pointer shadow-md select-none border border-pink-500/20"
                    >
                      {isGenerating ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin"></span>
                          <span>Compiling Brand Identity...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>Generate Complete Website</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/25 border border-slate-900 rounded-xl text-left text-[10px] text-slate-400 space-y-1.5">
                  <span className="font-mono text-slate-500 uppercase font-bold tracking-widest block">🛡️ Robust Offline Fallback Built-In</span>
                  <p className="leading-snug font-sans">
                    If Gemini credentials are unconfigured or fail to connect, our offline compiler automatically analyzes keywords in your prompt to build high-fidelity tailwind structures locally.
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Premium Extensions (Cart, Feeds, Popups) */}
            {editorTab === "extensions" && (
              <div className="space-y-4 font-sans text-xs text-left">
                <div className="p-3 bg-cyan-950/20 border border-cyan-500/15 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                    <ShoppingBag className="w-4 h-4" />
                    <span className="text-[10px] font-mono uppercase tracking-widest">Premium Extensions Engine</span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-normal">
                    Turn your static pages into commercial operations by introducing interactive shopping carts, live Twitter embeds, and high-conversion signup popups.
                  </p>
                </div>

                {/* EXTENSION 1: Smart Cart (Checkout) */}
                <div className={`p-4 rounded-xl border transition ${smartCart.enabled ? "bg-slate-950/50 border-cyan-500/30" : "bg-slate-950/25 border-slate-850"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🛒</span>
                      <div>
                        <span className="font-bold text-white block">Smart Cart (Checkout)</span>
                        <span className="text-[10px] text-slate-400">Adds item actions & checkout sidebar</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={smartCart.enabled}
                        onChange={(e) => setSmartCart({ ...smartCart, enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4.5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 peer-checked:after:bg-cyan-400 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-cyan-950 border border-slate-700"></div>
                    </label>
                  </div>

                  {smartCart.enabled && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-900">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-mono text-slate-500 uppercase block">Product / Action SKU</label>
                          <input
                            type="text"
                            value={smartCart.productName}
                            onChange={(e) => setSmartCart({ ...smartCart, productName: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded p-1.5 text-slate-200 mt-1 focus:outline-none text-[11px]"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-mono text-slate-500 uppercase block">Item Unit Price ($)</label>
                          <input
                            type="number"
                            value={smartCart.price}
                            onChange={(e) => setSmartCart({ ...smartCart, price: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded p-1.5 text-slate-200 mt-1 focus:outline-none text-[11px]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-mono text-slate-500 uppercase block">Currency Sign</label>
                        <input
                          type="text"
                          value={smartCart.currency}
                          onChange={(e) => setSmartCart({ ...smartCart, currency: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded p-1.5 text-slate-200 mt-1 focus:outline-none text-[11px]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* EXTENSION 2: Social Embed Feeds */}
                <div className={`p-4 rounded-xl border transition ${socialFeed.enabled ? "bg-slate-950/50 border-cyan-500/30" : "bg-slate-950/25 border-slate-850"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📢</span>
                      <div>
                        <span className="font-bold text-white block">Social Embed Feed</span>
                        <span className="text-[10px] text-slate-400">Injects custom social proofs</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={socialFeed.enabled}
                        onChange={(e) => setSocialFeed({ ...socialFeed, enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4.5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 peer-checked:after:bg-cyan-400 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-cyan-950 border border-slate-700"></div>
                    </label>
                  </div>

                  {socialFeed.enabled && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-900">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-slate-500 uppercase block">Embed Platform</label>
                        <select
                          value={socialFeed.platform}
                          onChange={(e: any) => setSocialFeed({ ...socialFeed, platform: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded p-1.5 text-slate-200 mt-1 focus:outline-none text-[11px]"
                        >
                          <option value="twitter">X / Twitter Feed</option>
                          <option value="instagram">Instagram Grid</option>
                          <option value="facebook">Facebook Group</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-slate-500 uppercase block">Account Handle Name</label>
                        <input
                          type="text"
                          value={socialFeed.feedName}
                          onChange={(e) => setSocialFeed({ ...socialFeed, feedName: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded p-1.5 text-slate-200 mt-1 focus:outline-none text-[11px]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* EXTENSION 3: Promo Popup */}
                <div className={`p-4 rounded-xl border transition ${popup.enabled ? "bg-slate-950/50 border-cyan-500/30" : "bg-slate-950/25 border-slate-850"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎁</span>
                      <div>
                        <span className="font-bold text-white block">Transactional Promo Popup</span>
                        <span className="text-[10px] text-slate-400">Trigger newsletter discount signups</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={popup.enabled}
                        onChange={(e) => setPopup({ ...popup, enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4.5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 peer-checked:after:bg-cyan-400 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-cyan-950 border border-slate-700"></div>
                    </label>
                  </div>

                  {popup.enabled && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-900">
                      <div>
                        <label className="text-[9px] font-mono text-slate-500 uppercase block">Modal Banner Title</label>
                        <input
                          type="text"
                          value={popup.title}
                          onChange={(e) => setPopup({ ...popup, title: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded p-1.5 text-slate-200 mt-1 focus:outline-none text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-mono text-slate-500 uppercase block">Modal Paragraph Copy</label>
                        <input
                          type="text"
                          value={popup.description}
                          onChange={(e) => setPopup({ ...popup, description: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded p-1.5 text-slate-200 mt-1 focus:outline-none text-[11px]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-mono text-slate-500 uppercase block">Button Text</label>
                          <input
                            type="text"
                            value={popup.buttonText}
                            onChange={(e) => setPopup({ ...popup, buttonText: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded p-1.5 text-slate-200 mt-1 focus:outline-none text-[11px]"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-mono text-slate-500 uppercase block">Trigger Delay (ms)</label>
                          <input
                            type="number"
                            value={popup.delayMs}
                            onChange={(e) => setPopup({ ...popup, delayMs: parseInt(e.target.value) || 2000 })}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded p-1.5 text-slate-200 mt-1 focus:outline-none text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* EXTENSION 4: Contact Logs & Form Submissions */}
                <div className={`p-4 rounded-xl border transition ${contactConfig.emailAlerts ? "bg-slate-950/50 border-cyan-500/30" : "bg-slate-950/25 border-slate-850"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📧</span>
                      <div>
                        <span className="font-bold text-white block">Form Submissions Logger</span>
                        <span className="text-[10px] text-slate-400">Stores messages on local server console</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contactConfig.emailAlerts}
                        onChange={(e) => setContactConfig({ ...contactConfig, emailAlerts: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4.5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 peer-checked:after:bg-cyan-400 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-cyan-950 border border-slate-700"></div>
                    </label>
                  </div>

                  {contactConfig.emailAlerts && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-900">
                      <div>
                        <label className="text-[9px] font-mono text-slate-500 uppercase block">Alert Recipient Email</label>
                        <input
                          type="text"
                          value={contactConfig.notifyEmail}
                          onChange={(e) => setContactConfig({ ...contactConfig, notifyEmail: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded p-1.5 text-slate-200 mt-1 focus:outline-none text-[11px]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-950/25 border border-slate-900 rounded-xl text-[10px] text-slate-450 text-slate-400 leading-normal font-sans">
                  💡 <strong>How to preview:</strong> Toggle any plugin above and click <strong>"Export Code"</strong> or view in fullscreen. The system injects lightweight standalone elements in compile state without requesting external libraries!
                </div>
              </div>
            )}

            {/* TAB CONTENT: Flexible Publishing (FTP, Subdomains, ZIP download) */}
            {editorTab === "publishing" && (
              <div className="space-y-4 font-sans text-xs text-left">
                <div className="p-3 bg-sky-950/20 border border-sky-500/15 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-sky-400 font-bold">
                    <Globe className="w-4 h-4" />
                    <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Flexible Publishing Center</span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-normal">
                    Distribute your website directly to our cloud subdomains, your own hosting via FTP, or compile files as a standalone ZIP archive!
                  </p>
                </div>

                {/* PUBLISH TYPE SELECTION */}
                <div className="p-3.5 bg-slate-950/40 border border-slate-850 rounded-xl space-y-3">
                  <label className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Publishing Target Method</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: "subdomain", label: "☁️ Cloud Node", desc: "Build to subdomain" },
                      { id: "ftp", label: "⚡ FTP Server", desc: "Push to your hosting" }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPublishingSettings({ ...publishingSettings, domainType: m.id as any })}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer select-none ${
                          publishingSettings.domainType === m.id
                            ? "bg-slate-900 border-sky-500 text-white"
                            : "bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800"
                        }`}
                      >
                        <span className="font-bold block text-[11px]">{m.label}</span>
                        <span className="text-[9px] text-slate-505 text-slate-500 mt-0.5 block leading-tight">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* TARGET RENDERER: Subdomain form */}
                {publishingSettings.domainType === "subdomain" && (
                  <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3">
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-widest block">Cloud Node configuration</span>
                    
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400">Target Subdomain Slug</label>
                        <div className="flex items-center bg-slate-950 border border-slate-850 rounded-lg overflow-hidden focus-within:border-sky-500">
                          <input
                            type="text"
                            value={publishingSettings.subdomain}
                            onChange={(e) => setPublishingSettings({ ...publishingSettings, subdomain: e.target.value })}
                            className="flex-1 bg-transparent p-2 text-slate-200 font-mono text-xs focus:outline-none"
                          />
                          <span className="bg-slate-900 px-2.5 py-2 text-slate-500 font-mono text-[10px] border-l border-slate-850 shrink-0">
                            .mobirise.host
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 pt-1">
                        <label className="text-[10px] text-slate-400">Custom Domain Overwrite (Cname)</label>
                        <input
                          type="text"
                          value={publishingSettings.customDomain}
                          placeholder="e.g., www.myagency.com"
                          onChange={(e) => setPublishingSettings({ ...publishingSettings, customDomain: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 rounded p-2 text-slate-200 focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TARGET RENDERER: FTP form */}
                {publishingSettings.domainType === "ftp" && (
                  <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3">
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-widest block">Secure FTP Connection Details</span>
                    
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="col-span-2 space-y-1">
                          <label className="text-[9px] text-slate-400">Host Server IP/Name</label>
                          <input
                            type="text"
                            value={publishingSettings.ftpServer}
                            onChange={(e) => setPublishingSettings({ ...publishingSettings, ftpServer: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 rounded p-1.5 text-slate-200 focus:outline-none font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400">Port</label>
                          <input
                            type="number"
                            value={publishingSettings.ftpPort}
                            onChange={(e) => setPublishingSettings({ ...publishingSettings, ftpPort: parseInt(e.target.value) || 21 })}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 rounded p-1.5 text-slate-200 focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400">FTP Username</label>
                          <input
                            type="text"
                            value={publishingSettings.ftpUser}
                            onChange={(e) => setPublishingSettings({ ...publishingSettings, ftpUser: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 rounded p-1.5 text-slate-200 focus:outline-none font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400">Remote Folder Directory</label>
                          <input
                            type="text"
                            value={publishingSettings.ftpDir}
                            onChange={(e) => setPublishingSettings({ ...publishingSettings, ftpDir: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 rounded p-1.5 text-slate-200 focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* COMPILATION MODE TOGGLE: Offline compiling */}
                <div className="p-3.5 bg-slate-950/40 border border-slate-850 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">Offline Offline mode Compile</span>
                      <span className="text-[9px] text-slate-500 block leading-tight">Bundle assets inside ZIP mapping</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={publishingSettings.isOfflineMode}
                        onChange={(e) => setPublishingSettings({ ...publishingSettings, isOfflineMode: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4.5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 peer-checked:after:bg-sky-400 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-sky-950 border border-slate-700"></div>
                    </label>
                  </div>
                </div>

                {/* PUBLISH TRIGGER BUTTON */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Trigger compile download
                      const completeHtmlCode = generateHTMLCode();
                      const element = document.createElement("a");
                      const file = new Blob([completeHtmlCode], { type: "text/html;charset=utf-8" });
                      element.href = URL.createObjectURL(file);
                      element.download = `${publishingSettings.subdomain || "compiled-site"}.html`;
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                    }}
                    className="w-full py-2.5 px-4 bg-sky-700 bg-gradient-to-r from-sky-600 to-indigo-650 hover:from-sky-500 hover:to-indigo-550 text-white rounded-xl font-bold font-sans transition flex items-center justify-center gap-2 cursor-pointer shadow-md border border-sky-500/20"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Compile & Export HTML Webpage</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      alert(`Project compiled! Static file uploaded securely onto target server directory ${publishingSettings.ftpDir || "/public_html"}`);
                    }}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-800 text-slate-400 text-[11px] rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer selection-none"
                  >
                    <span>☁️ Trigger Live Cloud Build Pipeline</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Corporate Brand Identity attributes & palette manager */}
            {editorTab === "brand" && (
              <div className="space-y-4 font-sans text-xs">
                {/* Brand Header */}
                <div className="p-3 bg-indigo-950/40 border border-indigo-500/15 rounded-xl text-left space-y-1">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">Corporate Brand Identity</span>
                  </div>
                  <p className="text-[10px] text-slate-350 leading-relaxed">
                    Set your company attributes, color system, logo and identity here. Under the hood, these values persist in your project drafts on save, and can instantly synchronize typography, brand names, slogans, and palette guidelines across any pre-built sections!
                  </p>
                </div>

                {/* Company Metadata Section */}
                <div className="space-y-3 p-3 bg-slate-950/30 border border-slate-900 rounded-xl">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block font-bold text-slate-400">Metadata Fields</span>
                  
                  <div className="space-y-2.5">
                    {/* Brand Name Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400">Company / Brand Name</label>
                      <input
                        type="text"
                        value={brandIdentity.companyName || ""}
                        onChange={(e) => setBrandIdentity(prev => ({ ...prev, companyName: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-slate-200 p-2 rounded-lg text-xs"
                        placeholder="e.g. SafeShip Cargo"
                      />
                    </div>

                    {/* Slogan input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400">Slogan / Tagline</label>
                      <input
                        type="text"
                        value={brandIdentity.slogan || ""}
                        onChange={(e) => setBrandIdentity(prev => ({ ...prev, slogan: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-slate-200 p-2 rounded-lg text-xs"
                        placeholder="e.g. Precision Freight & Worldwide Logistics"
                      />
                    </div>

                    {/* Industry & Font selectors */}
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400">Industry / Niche</label>
                        <input
                          type="text"
                          value={brandIdentity.industry || ""}
                          onChange={(e) => setBrandIdentity(prev => ({ ...prev, industry: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-850 text-slate-200 px-2 py-1.5 rounded-lg text-xs"
                          placeholder="e.g. Logistics"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400">Heading Font</label>
                        <select
                          value={brandIdentity.headingFont || ""}
                          onChange={(e) => setBrandIdentity(prev => ({ ...prev, headingFont: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-850 text-slate-200 px-2 py-1.5 rounded-lg text-xs"
                        >
                          <option value="'Space Grotesk', sans-serif">Space Grotesk</option>
                          <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans</option>
                          <option value="'Inter', sans-serif">Inter</option>
                          <option value="'Playfair Display', serif">Playfair Display</option>
                          <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                          <option value="'Outfit', sans-serif">Outfit</option>
                          <option value="'Montserrat', sans-serif">Montserrat</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Assets (Logo Selection) */}
                <div className="space-y-3 p-3 bg-slate-950/30 border border-slate-900 rounded-xl">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block font-bold text-slate-400 font-bold">Logo & Identity Picture</span>

                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400 font-sans block">Custom Image URL</label>
                      <input
                        type="text"
                        value={brandIdentity.logoUrl || ""}
                        onChange={(e) => setBrandIdentity(prev => ({ ...prev, logoUrl: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-850 text-slate-300 p-2 rounded-lg text-xs font-mono"
                        placeholder="Paste logo image URL..."
                      />
                    </div>

                    {brandIdentity.logoUrl && (
                      <div className="flex items-center gap-3 p-2 bg-slate-900 border border-slate-800/80 rounded-xl">
                        <div className="flex items-center justify-center p-1 bg-white border border-slate-700 rounded-lg shrink-0 w-10 h-10 select-none shadow-inner">
                          <img 
                            src={brandIdentity.logoUrl} 
                            alt="Logo preview" 
                            referrerPolicy="no-referrer"
                            className="max-w-full max-h-full object-contain rounded"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] text-indigo-455 text-indigo-400 font-mono font-bold block uppercase tracking-wide">Brand Logo Preview</span>
                          <span className="text-[9px] text-slate-450 text-slate-450 font-mono truncate block">{brandIdentity.logoUrl}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 block">Or Quick Select Preset Assets:</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setBrandIdentity(prev => ({ ...prev, logoUrl: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=120&q=80" }))}
                          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded p-1.5 text-left flex items-center gap-1.5 text-[10px] text-slate-300 truncate cursor-pointer"
                        >
                          <span className="shrink-0 text-amber-500">📦</span> Cargo Sphere
                        </button>
                        <button
                          type="button"
                          onClick={() => setBrandIdentity(prev => ({ ...prev, logoUrl: "https://images.unsplash.com/photo-1548092372-0d1bd40894a3?auto=format&fit=crop&w=120&q=80" }))}
                          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded p-1.5 text-left flex items-center gap-1.5 text-[10px] text-slate-300 truncate cursor-pointer"
                        >
                          <span className="shrink-0 text-indigo-500">🛡️</span> Shield Ridge
                        </button>
                        <button
                          type="button"
                          onClick={() => setBrandIdentity(prev => ({ ...prev, logoUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=120&q=80" }))}
                          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded p-1.5 text-left flex items-center gap-1.5 text-[10px] text-slate-300 truncate cursor-pointer"
                        >
                          <span className="shrink-0 text-emerald-550">📈</span> Flow Matrix
                        </button>
                        <button
                          type="button"
                          onClick={() => setBrandIdentity(prev => ({ ...prev, logoUrl: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=120&q=80" }))}
                          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded p-1.5 text-left flex items-center gap-1.5 text-[10px] text-slate-300 truncate cursor-pointer"
                        >
                          <span className="shrink-0 text-sky-500">🏢</span> Tower Ascent
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Palette Grid */}
                <div className="space-y-3 p-3 bg-slate-950/30 border border-slate-900 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block font-bold text-slate-400">Brand Color Palette</span>
                    <span className="text-[8px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded font-mono font-bold uppercase">Color Systems</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    {/* Primary Color Picker */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400 block">Primary Brand Color</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={brandIdentity.primaryColor || "#6366f1"}
                          onChange={(e) => setBrandIdentity(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="w-7 h-7 rounded border border-slate-800 cursor-pointer p-0 shrink-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={brandIdentity.primaryColor || ""}
                          onChange={(e) => setBrandIdentity(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-850 px-2 py-1 rounded text-[10px] font-mono text-slate-300"
                        />
                      </div>
                    </div>

                    {/* Secondary Accent Picker */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400 block">Corporate Accent Color</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={brandIdentity.accentColor || "#10b981"}
                          onChange={(e) => setBrandIdentity(prev => ({ ...prev, accentColor: e.target.value }))}
                          className="w-7 h-7 rounded border border-slate-800 cursor-pointer p-0 shrink-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={brandIdentity.accentColor || ""}
                          onChange={(e) => setBrandIdentity(prev => ({ ...prev, accentColor: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-850 px-2 py-1 rounded text-[10px] font-mono text-slate-300"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-semibold text-slate-400 block">Preset Corporate Brand Lookups:</span>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => setBrandIdentity(prev => ({
                          ...prev,
                          primaryColor: "#6366f1",
                          secondaryColor: "#94a3b8",
                          accentColor: "#10b981",
                          headingFont: "'Space Grotesk', sans-serif"
                        }))}
                        className="bg-slate-900 border border-slate-800 text-[9px] p-1 rounded hover:bg-slate-850 text-slate-300 cursor-pointer"
                      >
                        Midnight Tech
                      </button>
                      <button
                        type="button"
                        onClick={() => setBrandIdentity(prev => ({
                          ...prev,
                          primaryColor: "#059669",
                          secondaryColor: "#34d399",
                          accentColor: "#f59e0b",
                          headingFont: "'Plus Jakarta Sans', sans-serif"
                        }))}
                        className="bg-slate-900 border border-slate-800 text-[9px] p-1 rounded hover:bg-slate-850 text-slate-300 cursor-pointer"
                      >
                        Forest Eco
                      </button>
                      <button
                        type="button"
                        onClick={() => setBrandIdentity(prev => ({
                          ...prev,
                          primaryColor: "#2563eb",
                          secondaryColor: "#64748b",
                          accentColor: "#ef4444",
                          headingFont: "'Outfit', sans-serif"
                        }))}
                        className="bg-slate-900 border border-slate-800 text-[9px] p-1 rounded hover:bg-slate-850 text-slate-300 cursor-pointer"
                      >
                        Navy Clean
                      </button>
                    </div>
                  </div>
                </div>

                {/* Instant Realization Actuators */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleApplyBrandingToAll}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 active:scale-95 select-none"
                    title="Propagate all brand guidelines across every section block on the active page instantly."
                  >
                    <span>✨</span> Auto-Brand Entire Webpage
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyBrandingToActive}
                    className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-indigo-400 hover:text-indigo-300 rounded-xl font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2 active:scale-95 select-none"
                    title="Apply these corporate brand guidelines exclusively to the selected block configuration."
                  >
                    <span>🎯</span> Apply to Selected Block Only
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Live Rendering Workspace (with responsive device emulation) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          
          {/* Canvas Emulation bar controls */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-sans text-xs shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex bg-slate-950 border border-slate-800/85 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setViewMode("visual-layout")}
                  className={`py-1 px-3 rounded-lg flex items-center gap-1.5 font-bold text-[11px] transition cursor-pointer ${
                    viewMode === "visual-layout" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Visual Editor
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("preview")}
                  className={`py-1 px-3 rounded-lg flex items-center gap-1.5 font-bold text-[11px] transition cursor-pointer ${
                    viewMode === "preview" ? "bg-slate-800 text-indigo-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Live Frame
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest hidden sm:inline">Viewport:</span>
              <div className="flex bg-slate-950 border border-slate-800/80 p-1.5 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setViewport("desktop")}
                  className={`py-1 px-3.5 rounded-lg flex items-center gap-1.5 font-semibold text-[11px] transition ${
                    viewport === "desktop" ? "bg-slate-800 text-indigo-400 font-bold" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setViewport("tablet")}
                  className={`py-1 px-3.5 rounded-lg flex items-center gap-1.5 font-semibold text-[11px] transition ${
                    viewport === "tablet" ? "bg-slate-800 text-indigo-400 font-bold" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                  Tablet
                </button>
                <button
                  type="button"
                  onClick={() => setViewport("mobile")}
                  className={`py-1 px-3.5 rounded-lg flex items-center gap-1.5 font-semibold text-[11px] transition ${
                    viewport === "mobile" ? "bg-slate-800 text-indigo-400 font-bold" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Mobile
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={reloadPreview}
                className="p-1 px-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer"
                title="Force refresh preview canvas"
              >
                <RefreshCw className="w-3 h-3" />
                Hard Refresh
              </button>
            </div>
          </div>

          {/* Interactive Web Sandbox Frame */}
          <div className="flex-1 bg-slate-950/70 border border-slate-850 rounded-2xl overflow-hidden p-6 flex flex-col justify-center items-center min-h-[520px] relative">
            
            {viewMode === "visual-layout" ? (
              <div
                className="w-full h-full flex flex-col overflow-y-auto space-y-4 max-h-[480px] p-2 scrollbar-thin scrollbar-thumb-slate-800"
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={handleDropAppend}
              >
                <div className="text-center pb-2 border-b border-slate-900">
                  <h3 className="text-sm font-bold text-slate-200">Interactive Canvas Constructor</h3>
                  <p className="text-[11px] text-slate-400">Rearrange blocks dynamically, drop component nodes, or select layouts directly.</p>
                </div>

                <div className="space-y-3">
                  {blocks.map((block, idx) => {
                    const isActive = block.id === activeSectionId;
                    return (
                      <React.Fragment key={block.id}>
                        {/* Insertion marker drop zone BEFORE this item */}
                        <div
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDragLeave={() => setDragOverIndex(null)}
                          onDrop={(e) => handleDrop(e, idx)}
                          className={`h-6 rounded-xl border-2 border-dashed transition-all duration-200 flex items-center justify-center font-mono text-[9px] uppercase tracking-wider ${
                            dragOverIndex === idx
                              ? "border-indigo-500 bg-indigo-950/40 text-indigo-400 py-3 scale-[1.01]"
                              : "border-transparent text-transparent h-2"
                          }`}
                        >
                          {dragOverIndex === idx && "✨ Drop component to insert at position #" + (idx + 1)}
                        </div>

                        {/* Visual Constructor Block Card */}
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, idx, "reorder")}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDragLeave={() => {
                            if (dragOverIndex === idx) setDragOverIndex(null);
                          }}
                          onDragEnd={handleDragEnd}
                          onDrop={(e) => handleDrop(e, idx)}
                          onClick={() => {
                            setActiveSectionId(block.id);
                            setEditorTab("editor");
                          }}
                          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between transition-all cursor-move select-none ${
                            isActive
                              ? "bg-indigo-950/20 border-indigo-600 shadow-md shadow-indigo-900/10 scale-[1.005]"
                              : "bg-slate-900/90 border-slate-800/80 hover:border-slate-750 hover:bg-slate-900"
                          } ${dragOverIndex === idx ? "border-indigo-500 bg-indigo-950/25" : ""}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-950 rounded-lg text-slate-500 flex items-center gap-1.5 cursor-grab active:cursor-grabbing hover:text-indigo-400">
                              <GripVertical className="w-4 h-4" />
                              <span className="text-[10px] font-mono font-bold tracking-wider">#{idx + 1}</span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {block.type === "navbar" && "🧭"}
                                  {block.type === "hero" && "🚀"}
                                  {block.type === "features" && "⚡"}
                                  {block.type === "pricing" && "💳"}
                                  {block.type === "testimonials" && "💬"}
                                  {block.type === "faq" && "❓"}
                                  {block.type === "contact" && "✉"}
                                  {block.type === "cta" && "📢"}
                                  {block.type === "footer" && "📁"}
                                </span>
                                <h4 className="text-xs font-bold text-slate-100 capitalize">{block.type} component</h4>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800/60 font-mono text-slate-500 font-bold uppercase">
                                  {block.fields.bgColor || "dark"}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 leading-normal max-w-sm sm:max-w-md md:max-w-lg truncate">
                                "{block.fields.brandName || block.fields.heading || block.fields.ctaHeading || block.fields.contactHeading || block.fields.footerText || block.title}"
                              </p>
                            </div>
                          </div>

                          {/* Block actions */}
                          <div className="flex items-center gap-2 mt-3 sm:mt-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setActiveSectionId(block.id);
                                setEditorTab("editor");
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-semibold text-[10px] flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              Customize
                            </button>
                            
                            <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-lg">
                              <button
                                onClick={() => moveBlock(idx, "up")}
                                disabled={idx === 0}
                                className={`p-1 rounded transition ${idx === 0 ? "text-slate-800 cursor-not-allowed" : "text-slate-400 hover:bg-slate-900 hover:text-white"}`}
                                title="Move up"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => moveBlock(idx, "down")}
                                disabled={idx === blocks.length - 1}
                                className={`p-1 rounded transition ${idx === blocks.length - 1 ? "text-slate-800 cursor-not-allowed" : "text-slate-400 hover:bg-slate-900 hover:text-white"}`}
                                title="Move down"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              onClick={() => deleteBlock(block.id)}
                              className="p-1.5 rounded-lg bg-rose-950/10 border border-rose-950/50 hover:bg-rose-950/35 text-rose-500 hover:text-rose-450 transition"
                              title="Delete component block"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}

                  {/* Dropzone for bottom append */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragOverIndex !== -1) setDragOverIndex(-1);
                    }}
                    onDragLeave={() => {
                      if (dragOverIndex === -1) setDragOverIndex(null);
                    }}
                    onDrop={handleDropAppend}
                    className={`p-5 rounded-2xl border-2 border-dashed text-center font-mono text-[10px] uppercase tracking-wider transition-all duration-200 mt-2 ${
                      dragOverIndex === -1
                        ? "border-indigo-500 bg-indigo-950/45 text-indigo-400 scale-[1.015] shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                        : "border-slate-850 bg-slate-950/40 text-slate-500 hover:border-slate-800 hover:text-slate-400"
                    }`}
                  >
                    📥 Drop any block or toolbox item here to append to bottom
                  </div>
                </div>
              </div>
            ) : (
              /* Viewport resizing wrapper with cool browser mockup header */
              <div 
                className="h-full flex flex-col bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 shadow-2xl rounded-xl overflow-hidden transition-all duration-300 shadow-sm"
                style={{
                  width: viewport === "mobile" ? "380px" : viewport === "tablet" ? "768px" : "100%",
                  maxWidth: "100%"
                }}
              >
                {/* Fake web browser bar mockup */}
                <div className="bg-slate-950 border-b border-slate-800/80 p-3 flex items-center justify-between font-mono text-[9px] font-semibold text-slate-500">
                  <div className="flex items-center gap-1.5 shrink-0 select-none">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800/80 px-4 py-1.5 rounded-md text-slate-400 flex items-center gap-1.5 max-w-[420px] flex-1 mx-6 justify-center">
                    <span className="text-slate-600">https://</span>
                    <span>mapshield-sandbox.io/preview</span>
                  </div>
                  <div className="text-[10px] leading-none shrink-0 font-bold p-0.5 border border-slate-800 rounded bg-slate-950">
                    {viewport === "mobile" ? "380px" : viewport === "tablet" ? "768px" : "1600px"}
                  </div>
                </div>

                {/* Real IFrame sandbox rendering Bootstrap code safely */}
                <iframe
                  ref={iframeRef}
                  className="flex-1 bg-transparent w-full h-full border-none"
                  title="Real-time Bootstrap Sandbox Sandbox Render Frame"
                  sandbox="allow-scripts"
                />
              </div>
            )}

            {/* Quick Helper hint */}
            <div className="absolute bottom-4 right-10 bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-full text-[10px] font-mono text-slate-420 select-none pointer-events-none tracking-wide text-center z-10">
              💡 Hint: Drag toolbox items from the left side and drop them here anytime!
            </div>

          </div>

        </div>

      </div>

      {/* MODAL: Export Code drawer */}
      {isExportOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative font-sans shadow-sm">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">Production Build Ready</span>
                <h3 className="font-bold text-white text-base">Self-Contained Bootstrap 5 HTML Code</h3>
              </div>
              <button
                onClick={() => setIsExportOpen(false)}
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Preview Box content */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                This self-contained codebase compiles all your designated layouts, configured Bootstrap styles, responsive navbar integrations, grid grids, and testimonials into a single document using modern Google Fonts (Space Grotesk + Plus Jakarta) and CDN support. You can deploy it instantly on any static hosting environment (GitHub Pages, Cloudflare, Netlify).
              </p>

              <div className="relative">
                <textarea
                  readOnly
                  value={generateHTMLCode(true)}
                  rows={14}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4.5 text-[11px] font-mono text-indigo-200 leading-normal focus:outline-none select-all"
                />
                
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="py-1 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        Copied Grid!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Code Base
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/50 p-4 border border-slate-800/60 rounded-xl flex flex-col justify-between gap-3 text-sans">
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-slate-200">Want to run this layout offline?</h5>
                    <p className="text-[10px] text-slate-500">Press download to capture the self-contained document instantly.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadIndex}
                    className="w-full bg-slate-950 hover:bg-slate-850 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700 py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md select-none"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    Download index.html File
                  </button>
                </div>

                <div className="bg-slate-950/50 p-4 border border-slate-800/60 rounded-xl flex flex-col justify-between gap-3 text-sans w-full">
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-slate-200">Publish Live to Standalone URL</h5>
                    <p className="text-[10px] text-slate-500">Deploy this compiled page directly to our server route live.</p>
                  </div>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handlePublishLive}
                      disabled={isPublishing}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
                    >
                      {isPublishing ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Globe className="w-3.5 h-3.5 text-emerald-100" />
                          Publish Live Now
                        </>
                      )}
                    </button>
                    {publishSuccess && publishedUrl && (
                      <div className="text-center">
                        <a
                          href={publishedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-mono text-emerald-400 hover:underline block truncate max-w-xs mx-auto"
                        >
                          View Live: {publishedUrl} ↗
                        </a>
                      </div>
                    )}
                    {publishError && (
                      <p className="text-[9px] text-rose-450 text-center font-mono">{publishError}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Template Live Visual Preview Modal Overlay */}
      {previewingTemplate && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fade-in font-sans">
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl w-full max-w-6xl h-[88vh] flex flex-col overflow-hidden shadow-2xl relative shadow-sm">
            
            {/* Modal Header */}
            <div className="bg-slate-950 border-b border-slate-850 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 w-10/12">
                <span className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-lg shadow shrink-0">
                  {previewingTemplate.icon}
                </span>
                <div className="truncate">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-white tracking-tight">{previewingTemplate.name}</h3>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full uppercase tracking-widest whitespace-nowrap">
                      {previewingTemplate.category} Template
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono">Live render sandbox environment</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewingTemplate(null)}
                className="w-8 h-8 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer font-bold shrink-0"
                title="Close Visual Preview"
              >
                ✕
              </button>
            </div>

            {/* Split body panels */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
              
              {/* Left Detail Panel */}
              <div className="lg:col-span-4 bg-slate-950/20 border-r border-slate-850 p-6 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-350 uppercase tracking-widest font-mono">Design Description</h4>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-850/60 shadow-inner">
                      {previewingTemplate.description}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-350 uppercase tracking-widest font-mono">Layout Parameters</h4>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-850">
                        <span className="text-slate-500 block text-[9px] uppercase font-mono">Background Color</span>
                        <span className="text-slate-200 font-bold font-mono text-[10px] capitalize">
                          {previewingTemplate.block.fields.bgColor || "Default Dark"}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-850">
                        <span className="text-slate-500 block text-[9px] uppercase font-mono">Padding Option</span>
                        <span className="text-slate-200 font-bold font-mono text-[10px] capitalize">
                          {previewingTemplate.block.fields.paddingY || "py-5 (medium)"}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-850 col-span-2">
                        <span className="text-slate-500 block text-[9px] uppercase font-mono">Section Theme Type</span>
                        <span className="text-slate-200 font-bold font-mono text-[10px] capitalize">
                          Bootstrap {previewingTemplate.block.type} component
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-1.5 animate-pulse">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono font-bold text-amber-400">
                      <span>⚠️</span> Live Simulation Notice
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      This layout simulation allows you to explore interactions, buttons, forms, and responsive scaling behavior before modifying your production workspace page tree.
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-850 space-y-2 mt-6 lg:mt-0">
                  <button
                    type="button"
                    onClick={() => {
                      addLibraryTemplate(previewingTemplate);
                      setPreviewingTemplate(null);
                    }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer select-none shadow-lg shadow-indigo-950/40 border border-indigo-400"
                  >
                    <Plus className="w-4 h-4" />
                    Commit and Insert Layout
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewingTemplate(null)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-800"
                  >
                    Cancel & Return
                  </button>
                </div>
              </div>

              {/* Right Iframe Visual Panel */}
              <div className="lg:col-span-8 p-6 bg-slate-950 flex flex-col items-center justify-between overflow-hidden h-full">
                
                {/* Visual Resizer devices tools banner */}
                <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-900 pb-4 shrink-0">
                  <div className="text-left">
                    <h5 className="text-[11px] font-mono text-slate-400 uppercase font-bold">Responsive Workspace Simulator</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">Simulate device screen layout margins and grid breakdowns:</p>
                  </div>

                  <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewViewport("desktop")}
                      className={`py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 font-semibold text-[11px] transition cursor-pointer shrink-0 ${
                        previewViewport === "desktop" ? "bg-slate-800 text-indigo-400 font-bold" : "text-slate-450 hover:text-slate-200"
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      Desktop (100%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewViewport("tablet")}
                      className={`py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 font-semibold text-[11px] transition cursor-pointer shrink-0 ${
                        previewViewport === "tablet" ? "bg-slate-800 text-indigo-400 font-bold" : "text-slate-450 hover:text-slate-200"
                      }`}
                    >
                      <Tablet className="w-3.5 h-3.5" />
                      Tablet (768px)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewViewport("mobile")}
                      className={`py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 font-semibold text-[11px] transition cursor-pointer shrink-0 ${
                        previewViewport === "mobile" ? "bg-slate-800 text-indigo-400 font-bold" : "text-slate-450 hover:text-slate-200"
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      Mobile (375px)
                    </button>
                  </div>
                </div>

                {/* Animated frame centered viewport */}
                <div className="w-full flex-1 mt-4 rounded-xl overflow-hidden bg-slate-900/40 border border-slate-850 p-4 flex justify-center items-center relative transition-all duration-300">
                  <div 
                    className="h-full flex flex-col bg-slate-900 border border-slate-800 shadow-2xl rounded-xl overflow-hidden transition-all duration-300 relative"
                    style={{
                      width: previewViewport === "mobile" ? "380px" : previewViewport === "tablet" ? "768px" : "100%",
                      maxWidth: "100%"
                    }}
                  >
                    {/* Simulator browser url bar mockup */}
                    <div className="bg-slate-950 border-b border-slate-850 px-3 py-2 flex items-center justify-between font-mono text-[9px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500/80"></span>
                        <span className="w-2 h-2 rounded-full bg-amber-500/80"></span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500/80"></span>
                      </div>
                      <div className="bg-slate-900 px-4 py-1.5 rounded-md text-slate-400 flex items-center gap-1.5 max-w-[320px] flex-1 mx-4 justify-center">
                        <span className="text-slate-600">localhost:</span>
                        <span className="text-indigo-300 truncate">preview/{previewingTemplate.id}</span>
                      </div>
                      <div className="font-bold tracking-wider opacity-60">TEST RIG</div>
                    </div>

                    <iframe 
                      title="visual-preview-sandbox-frame"
                      srcDoc={generateTemplatePreviewHTML(previewingTemplate)}
                      className="bg-transparent flex-1 border-0 transition-all duration-300 shadow-inner w-full"
                    />
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* Visual Template Gallery Modal Overlay */}
      {isTemplateGalleryOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[110] flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fade-in font-sans">
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl w-full max-w-6xl h-[88vh] flex flex-col overflow-hidden shadow-2xl relative shadow-sm">
            
            {/* Modal Header */}
            <div className="bg-slate-950 border-b border-slate-850 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-lg shadow-inner shrink-0 text-indigo-400">
                  🎨
                </span>
                <div className="truncate">
                  <h3 className="text-sm font-bold text-white tracking-tight">CloudboyX Layout Blueprint Gallery</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 animate-pulse">Explore premium vector-inspired layout mockups and parameters</p>
                </div>
              </div>

              {/* Dynamic Search & Gallery filter in header */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={librarySearchQuery}
                    onChange={(e) => setLibrarySearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800/80 rounded-xl pl-3.5 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                  {librarySearchQuery && (
                    <button
                      onClick={() => setLibrarySearchQuery("")}
                      className="absolute right-2.5 top-2 text-[9px] bg-slate-850 hover:bg-slate-800 border border-slate-755 text-slate-400 hover:text-white px-1 py-0.5 rounded font-mono transition"
                    >
                      CLEAR
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsTemplateGalleryOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer font-bold shrink-0"
                  title="Close Gallery Window"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Sub-Header Categories Selector Chips list */}
            <div className="bg-slate-950/40 border-b border-slate-850/60 px-6 py-2.5 flex items-center justify-between overflow-x-auto gap-4">
              <div className="flex items-center gap-2">
                {[
                  { id: "all", label: "All Layouts" },
                  { id: "hero", label: "Hero Banners" },
                  { id: "features", label: "Bento Features" },
                  { id: "pricing", label: "Pricing Tables" },
                  { id: "contact", label: "Leads & Contacts" },
                  { id: "testimonials", label: "Social Proof" }
                ].map((cat) => {
                  const isActive = libraryCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setLibraryCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition uppercase whitespace-nowrap cursor-pointer ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/25"
                          : "bg-slate-900 text-slate-400 hover:text-slate-205 hover:bg-slate-800"
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
              <div className="text-[10px] text-slate-500 font-mono hidden lg:block uppercase tracking-wider font-semibold">
                Available sections: {LIBRARY_SECTION_TEMPLATES.length} premium models
              </div>
            </div>

            {/* Main Visual Board Grid of blueprint modules */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-800">
              {(() => {
                const filtered = LIBRARY_SECTION_TEMPLATES.filter((temp) => {
                  const matchesCat = libraryCategory === "all" || temp.category === libraryCategory;
                  const matchesQuery = !librarySearchQuery || 
                    temp.name.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
                    temp.description.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
                    temp.category.toLowerCase().includes(librarySearchQuery.toLowerCase());
                  return matchesCat && matchesQuery;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-24 bg-slate-950/20 border border-slate-850 rounded-2xl flex flex-col items-center justify-center">
                      <span className="text-3xl block mb-3 animate-bounce">🔍</span>
                      <h4 className="text-sm font-bold text-slate-300">No Blueprint Layouts Matches Found</h4>
                      <p className="text-xs text-slate-500 font-mono mt-1 max-w-sm">No templates matched "{librarySearchQuery}". Try clearing text filters or category restrictions.</p>
                      <button 
                        onClick={() => { setLibrarySearchQuery(""); setLibraryCategory("all"); }}
                        className="text-[11px] bg-slate-800 hover:bg-slate-700 border border-indigo-500 text-indigo-400 hover:text-white mt-4 py-2 px-4 rounded-xl cursor-pointer transition font-bold"
                      >
                        Reset All Explorer Filters
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((temp) => {
                      return (
                        <div
                          key={temp.id}
                          className="bg-slate-950/65 border border-slate-850 rounded-2xl p-4 flex flex-col gap-3.5 transition duration-200 hover:border-slate-700 hover:bg-slate-955 group shadow-md"
                        >
                          {/* Top Tag capsule & category name */}
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono font-bold px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full uppercase tracking-wider">
                              {temp.category} layout
                            </span>
                            <span className="text-base" title="Section Category Icon">{temp.icon}</span>
                          </div>

                          {/* High-Fidelity Vector-styled thumbnail component */}
                          <div className="relative rounded-xl overflow-hidden shadow-md">
                            <TemplateThumbnail block={temp.block} />
                            
                            {/* Hover Interactive Preview overlay */}
                            <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-4">
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewingTemplate(temp);
                                }}
                                className="w-10/12 py-2 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Interactive Device Preview
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  addLibraryTemplate(temp);
                                  // Trigger feedback
                                  const btn = document.getElementById(`insert-feedback-${temp.id}`);
                                  if (btn) {
                                    btn.classList.remove("opacity-0");
                                    btn.classList.add("opacity-100");
                                    setTimeout(() => {
                                      btn.classList.remove("opacity-100");
                                      btn.classList.add("opacity-0");
                                    }, 2000);
                                  }
                                }}
                                className="w-10/12 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md border border-indigo-450"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Commit layout here
                              </button>
                            </div>
                          </div>

                          {/* Details area */}
                          <div className="space-y-1 text-left flex-grow flex flex-col justify-between">
                            <div>
                              <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition tracking-tight">
                                {temp.name}
                              </h4>
                              <p className="text-[11px] text-slate-450 leading-normal font-sans mt-1">
                                {temp.description}
                              </p>
                            </div>

                            {/* Badges/Parameters area */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-900/60 mt-2">
                              <div className="flex flex-wrap gap-1">
                                <span className="text-[8px] px-1.5 py-0.5 rounded bg-indigo-950/40 border border-indigo-900/40 font-mono text-indigo-300 font-bold uppercase">
                                  {temp.block.fields.bgColor || "dark"}
                                </span>
                                <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-slate-500">
                                  {temp.block.fields.paddingY || "py-5"}
                                </span>
                              </div>

                              {/* Invisible interactive success feedback indicator */}
                              <span 
                                id={`insert-feedback-${temp.id}`}
                                className="text-[9px] font-mono font-bold text-emerald-450 opacity-0 transition-opacity duration-200 select-none animate-pulse"
                              >
                                ✓ Inserted to workspace!
                              </span>
                            </div>
                          </div>

                          {/* Quick manual actions footer */}
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewingTemplate(temp);
                              }}
                              className="bg-slate-900 hover:bg-slate-850 text-slate-350 hover:text-white border border-slate-800 py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition select-none"
                              title="Explore simulated responsiveness"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-400" />
                              Simulate Live
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                addLibraryTemplate(temp);
                                // Trigger feedback
                                const btn = document.getElementById(`insert-feedback-${temp.id}`);
                                if (btn) {
                                  btn.classList.remove("opacity-0");
                                  btn.classList.add("opacity-100");
                                  setTimeout(() => {
                                    btn.classList.remove("opacity-100");
                                    btn.classList.add("opacity-0");
                                  }, 2000);
                                }
                              }}
                              className="bg-indigo-650 hover:bg-indigo-600 text-white py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition select-none shadow-sm shadow-indigo-950/40"
                              title="Instantly add this component layout"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Insert Section
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Gallery footer navigation panel */}
            <div className="bg-slate-950 border-t border-slate-850 px-6 py-4 flex items-center justify-between">
              <p className="text-[10px] text-slate-500 font-mono">
                Clicking "Insert Section" commits the structural layout directly to your active webpage hierarchy list.
              </p>
              <button
                type="button"
                onClick={() => setIsTemplateGalleryOpen(false)}
                className="py-1.5 px-4 bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white rounded-lg text-xs font-semibold cursor-pointer border border-slate-855 transition"
              >
                Close Blueprint Gallery
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
