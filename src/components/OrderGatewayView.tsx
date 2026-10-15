import React, { useState } from "react";
import { Product, Partner, WhiteLabelConfig } from "../types";
import { 
  Activity, ArrowRight, FileSpreadsheet, Play, CheckCircle2, AlertCircle, 
  Trash2, Plus, CornerDownRight, Download, Cpu, Sparkles, Layers, RefreshCw,
  ShoppingBag, Zap, Terminal, Code2, Copy, Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface OrderGatewayViewProps {
  products: Product[];
  partners: Partner[];
  whiteLabel?: WhiteLabelConfig;
}

interface IngestedOrder {
  orderId: string;
  source: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  timestamp: string;
  customer: string;
  hasViolation: boolean;
  mapPrice: number;
  deficit: number;
}

interface LedgerLine {
  accountCode: string;
  accountName: string;
  type: "debit" | "credit";
  amount: number;
  memo: string;
}

const SAMPLE_PAYLOADS = {
  shopify: `{
  "id": "order-shp-9921",
  "source": "Shopify API Webhook",
  "email": "purchasing@gizmomart.com",
  "created_at": "${new Date().toISOString()}",
  "currency": "USD",
  "customer": {
    "first_name": "GizmoMart",
    "last_name": "Online Operations",
    "email": "partner-relations@gizmomart.com"
  },
  "line_items": [
    {
      "id": 8812921,
      "sku": "APEX-PRO-MK1",
      "name": "Apex Pro Mechanical Keyboard",
      "price": "159.99",
      "quantity": 10,
      "requires_shipping": true
    }
  ],
  "shipping_address": {
    "address1": "450 Enterprise Way",
    "city": "San Jose",
    "province": "California",
    "zip": "95134"
  }
}`,
  csv: `OrderNum,Partner,SKU,Qty,UnitPrice,CustomerName,ShipState
ORD-CSV-402,TechDelight Electronics,SW-ANC-70,5,280.00,TechDelight East Hub,NY
ORD-CSV-403,TechDelight Electronics,AF-ERGO-PAD,20,49.99,TechDelight West Hub,CA`,
  edi: `ST*850*0001~
BEG*00*SA*PO-EDI-7718**20260617~
REF*DP*090~
N1*BY*PixelPerfect Supplies*9*0012345678901~
N3*100 Logistic Dr~
N4*Dallas*TX*75201~
PO1*1*50*EA*89.99**CB*QG-PRO-MS**VP*QG-PRO-MS~
CTT*1~
SE*8*0001~`,
  unstructured: `Bulk Purchase Order Order-AI-102
Ref: Amazon Wholesale Vendor Program
Buyer: Amazon Retail Division (domain: amazon.com)
Details:
We require a replenishment of 15 units of the ProFocus 4K Ultra Webcam (SKU: PF-4K-WEB) at our special wholesale negotiated transfer rate of $119.50 each inside our Seattle sorting hub (WA-98101) by Friday.`
};

const COLOR_THEMES = {
  indigo: {
    accent: "text-indigo-400",
    bg: "bg-indigo-500",
    bgMuted: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    hover: "hover:bg-indigo-600",
    glow: "shadow-indigo-500/20",
    badge: "bg-indigo-500/15 text-indigo-400 border-indigo-500/35"
  },
  emerald: {
    accent: "text-emerald-400",
    bg: "bg-emerald-500",
    bgMuted: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    hover: "hover:bg-emerald-600",
    glow: "shadow-emerald-500/20",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/35"
  },
  rose: {
    accent: "text-rose-400",
    bg: "bg-rose-500",
    bgMuted: "bg-rose-500/10",
    border: "border-rose-500/20",
    hover: "hover:bg-rose-600",
    glow: "shadow-rose-500/20",
    badge: "bg-rose-500/15 text-rose-400 border-rose-500/35"
  },
  amber: {
    accent: "text-amber-400",
    bg: "bg-amber-500",
    bgMuted: "bg-amber-500/10",
    border: "border-amber-500/20",
    hover: "hover:bg-amber-600",
    glow: "shadow-amber-500/20",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/35"
  },
  blue: {
    accent: "text-blue-400",
    bg: "bg-blue-500",
    bgMuted: "bg-blue-500/10",
    border: "border-blue-500/20",
    hover: "hover:bg-blue-600",
    glow: "shadow-blue-500/20",
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/35"
  },
  violet: {
    accent: "text-violet-400",
    bg: "bg-violet-500",
    bgMuted: "bg-violet-500/10",
    border: "border-violet-500/20",
    hover: "hover:bg-violet-600",
    glow: "shadow-violet-500/20",
    badge: "bg-violet-500/15 text-violet-400 border-violet-500/35"
  }
};

const ecomPlatforms = [
  {
    id: "shopify",
    name: "Shopify Storefront",
    tagline: "Automated Theme Liquid & Webhook Sync",
    description: "Embed dynamic MAP checking in liquid layouts to automatically disable checkouts, flag bad prices, and lock reseller products.",
    snippetLanguage: "html",
    filename: "layout/product-template.liquid",
    steps: [
      "Create an App inside your Shopify Admin under Settings -> Developer Apps.",
      "Add a webhook subscription for topic 'products/update' directed to your gateway.",
      "Inject the custom Liquid code block into your product-template.liquid layout."
    ],
    snippet: (brand: string, domain: string, email: string) => `<!-- Shopify Liquid Integration: ${brand} -->
<div id="enforce-map-compliance" data-sku="{{ product.variants.first.sku }}" data-price="{{ product.price | money_without_currency }}"></div>
<script>
  (function() {
    const apiEndpoint = "https://${domain || "portal.monitor.com"}/api/compliance/verify";
    const sku = "{{ product.variants.first.sku }}";
    const shop = Shopify.shop;
    
    if (sku) {
      fetch(\`\${apiEndpoint}?sku=\${encodeURIComponent(sku)}&seller=\${shop}\`)
        .then(res => res.json())
        .then(data => {
          if (data.violating) {
            console.error("[${brand}] Infraction warning: Authorized pricing limit breached!");
            // Auto Disable buy buttons or replace with contact warning
            const buyBtn = document.querySelector('button[name="add"]');
            if (buyBtn) {
              buyBtn.disabled = true;
              buyBtn.innerText = "Compliance Lock Enforced";
            }
          }
        });
    }
  })();
</script>`
  },
  {
    id: "woocommerce",
    name: "WooCommerce / WordPress",
    tagline: "WordPress Filters & Action Interceptors",
    description: "Filter catalog query objects pre-rendering to sanitize and prevent discount breaches before clients view them.",
    snippetLanguage: "php",
    filename: "functions.php",
    steps: [
      "Open your active child theme's functions.php file in WordPress.",
      "Append the WooCommerce price filter interceptor below.",
      "Configure automated alerts to route straight to ${email}."
    ],
    snippet: (brand: string, domain: string, email: string) => `<?php
/**
 * WooCommerce Price Hook for ${brand} 
 * Intercepts catalog listing queries to enforce compliance boundaries.
 */
add_filter('woocommerce_get_price_html', 'enforce_${brand.toLowerCase().replace(/[^a-z]/g, "")}_map_pricing', 10, 2);

function enforce_${brand.toLowerCase().replace(/[^a-z]/g, "")}_map_pricing($price_html, $product) {
    $sku = $product->get_sku();
    $price = $product->get_price();
    
    if (!$sku) return $price_html;
    
    // Server-side check
    $apiUrl = "https://${domain || "portal.monitor.com"}/api/compliance/lookup?sku=" . urlencode($sku);
    $response = wp_remote_get($apiUrl, array('timeout' => 3));
    
    if (!is_wp_error($response)) {
        $body = json_decode(wp_remote_retrieve_body($response), true);
        if ($body && isset($body['map_price']) && $body['map_price'] > $price) {
            // Log infraction & alert support
            error_log("[${brand} Warning] Price below MAP for " . $sku);
            return '<span class="map-lock" style="color:#ef4444; font-weight:bold;">Under Compliance Review</span>';
        }
    }
    return $price_html;
}`
  },
  {
    id: "magento",
    name: "Magento 2 (Adobe Commerce)",
    tagline: "Dependency Injection & Event Observer Plugins",
    description: "Plug into Magento backend catalog pricing engines server-side to secure multi-currency catalog prices securely.",
    snippetLanguage: "php",
    filename: "PricingInterceptor.php",
    steps: [
      "Create a custom module named 'Reseller/MapShieldPricing' in app/code.",
      "Bind an afterGetPrice filter inside your modules' etc/frontend/di.xml.",
      "Inject the PHP Class Observer to monitor price updates from ${domain}."
    ],
    snippet: (brand: string, domain: string, email: string) => `<?php
namespace Reseller\\MapShieldPricing\\Plugin;

/**
 * Magento 2 Interceptor Plugin powered by ${brand}
 */
class PricingInterceptor {
    public function afterGetPrice(\\Magento\\Catalog\\Model\\Product $subject, $result) {
        $sku = $subject->getSku();
        if (!$sku) return $result;
        
        $brandGateway = "https://${domain || "portal.monitor.com"}/api/compliance/verify?sku=" . $sku;
        
        // Remote checking API call
        $client = new \\Zend_Http_Client($brandGateway);
        try {
            $response = $client->request();
            $data = json_decode($response->getBody(), true);
            if ($data && isset($data['map_price']) && $data['map_price'] > $result) {
                // Raise alert back to support at ${email}
                return $data['map_price']; // Force reset to allowable Minimum Price
            }
        } catch (\\Exception $e) {
            // Silently pass
        }
        return $result;
    }
}`
  },
  {
    id: "bigcommerce",
    name: "BigCommerce SaaS",
    tagline: "Script Manager Background Monitor Tag",
    description: "Quick script tag injected via Stencil Script Manager to supervise checkout actions, page loads, and product detail states.",
    snippetLanguage: "javascript",
    filename: "footer-security.js",
    steps: [
      "Go to your BigCommerce Storefront Settings -> Script Manager.",
      "Create a new script named '${brand} Audit Tracking'.",
      "Configure Location as 'Footer', Placement as 'Storefront' and Category as 'Security'."
    ],
    snippet: (brand: string, domain: string, email: string) => `// BigCommerce Real-time tracking tag powered by ${brand}
(function() {
  const pageSku = window.BC_PRODUCT_SKU || ""; // BigCommerce Stencil sku object
  const currentPrice = window.BC_PRODUCT_PRICE || 0;
  
  if (pageSku) {
    const api = "https://${domain || "portal.monitor.com"}/api/compliance/verify";
    fetch(\`\${api}?sku=\${encodeURIComponent(pageSku)}&p=\${currentPrice}\`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'violating') {
          console.warn("[${brand} Warning] Unauthorized dynamic retail price detected of $" + currentPrice);
        }
      });
  }
})();`
  },
  {
    id: "squarespace",
    name: "Squarespace Engine",
    tagline: "Advanced Code Injection Tag",
    description: "Embed automated client-side tracking using Squarespace Advanced Code Injection to sanitize items.",
    snippetLanguage: "javascript",
    filename: "squarespace-footer.js",
    steps: [
      "Go to your Squarespace Settings -> Developer Tools -> Code Injection.",
      "Add the custom JavaScript payload in the global Footer workspace.",
      "Configure threshold triggers to block non-compliant item card purchases."
    ],
    snippet: (brand: string, domain: string, email: string) => `// Squarespace real-time pricing guard for ${brand}
window.addEventListener('DOMContentLoaded', () => {
  const sqsProduct = window.Static?.SQUARESPACE_CONTEXT?.product || {};
  const sku = sqsProduct.variants?.[0]?.sku;
  const rawPriceInCents = sqsProduct.variants?.[0]?.price;
  
  if (sku && rawPriceInCents) {
    const price = rawPriceInCents / 100;
    fetch("https://${domain || "portal.monitor.com"}/api/compliance/verify?sku=" + encodeURIComponent(sku) + "&p=" + price)
      .then(r => r.json())
      .then(res => {
        if (res.violating) {
          console.warn("[${brand} Squarespace Alert] Compliance Lock Tripped on item: " + sku);
          const cartBtn = document.querySelector('.sqs-add-to-cart-button');
          if (cartBtn) {
            cartBtn.style.pointerEvents = 'none';
            cartBtn.style.opacity = '0.4';
            cartBtn.innerText = "Under Compliance Hold";
          }
        }
      });
  }
});`
  },
  {
    id: "wix",
    name: "Wix Storefront",
    tagline: "Velo Backend Pricing Handlers",
    description: "Leverage Wix Velo Backend Event routers to monitor collection items' dynamic checkout updates securely.",
    snippetLanguage: "javascript",
    filename: "wix-velo.js",
    steps: [
      "Open your Wix Editor and enable Developer Mode (Velo by Wix).",
      "Add a new backend Web Module named 'mapshield.jsw'.",
      "Implement store checkout triggers to deny non-compliant purchases."
    ],
    snippet: (brand: string, domain: string, email: string) => `// Wix Backend Velo Hook for ${brand}
import { getSecret } from 'wix-secrets-backend';
import { fetch } from 'wix-fetch';

export async function checkWixCompliance(sku, price) {
  const brandDomain = "https://${domain || "portal.monitor.com"}";
  const apiKey = await getSecret("MAPSHIELD_API_KEY");
  
  const response = await fetch(\`\${brandDomain}/api/compliance/verify?sku=\${sku}&price=\${price}\`, {
    method: "GET",
    headers: { "Authorization": \`Bearer \${apiKey}\` }
  });
  
  if (response.ok) {
    const result = await response.json();
    return result.compliant; // Returns false if below minimum pricing thresholds
  }
  return true; 
}`
  },
  {
    id: "webflow",
    name: "Webflow CMS",
    tagline: "Custom Script Embed Hooks",
    description: "Quick custom code injection inside Webflow collection template page wrappers to secure pricing layouts.",
    snippetLanguage: "html",
    filename: "webflow-head.html",
    steps: [
      "Open your Webflow Project Settings -> Custom Code -> Head Code.",
      "Insert the embed tags below to intercept container rendering.",
      "Publish to your production domain to active live tracking."
    ],
    snippet: (brand: string, domain: string, email: string) => `<!-- Webflow E-Commerce Protection: ${brand} -->
<script>
  document.addEventListener("DOMContentLoaded", function() {
    // Read dynamic collection fields from container attributes
    const rawPrice = document.querySelector("[data-wf-product-price]")?.getAttribute("data-wf-product-price");
    const rawSku = document.querySelector("[data-wf-product-sku]")?.getAttribute("data-wf-product-sku");
    
    if (rawSku && rawPrice) {
      const api = "https://${domain || "portal.monitor.com"}/api/compliance/verify?sku=" + encodeURIComponent(rawSku);
      fetch(api)
        .then(res => res.json())
        .then(data => {
          if (data.map_price && parseFloat(rawPrice) < data.map_price) {
            console.error("[${brand}] Compliance Breach Found on Webflow Node");
            const btn = document.querySelector(".w-commerce-commerceaddtocartbutton");
            if (btn) {
              btn.disabled = true;
              btn.value = "Pricing Hold Enforced";
            }
          }
        });
    }
  });
</script>`
  },
  {
    id: "prestashop",
    name: "PrestaShop Framework",
    tagline: "Hook-Based Module Controllers",
    description: "Register custom PHP hooks inside PrestaShop product details controller loops to prevent dynamic checkout violations.",
    snippetLanguage: "php",
    filename: "MapShieldOverride.php",
    steps: [
      "Inject the custom PHP module overrides under modules/mapshield/.",
      "Hook into 'actionProductPriceCalculation' or 'displayProductPriceBlock'.",
      "Reset non-compliant checkout inputs to authorized standard values."
    ],
    snippet: (brand: string, domain: string, email: string) => `<?php
/**
 * PrestaShop Compliance Module Controller for ${brand}
 */
class MapShieldOverride extends Module {
    public function hookActionProductPriceCalculation(&$params) {
        $product = $params['product'];
        $sku = $product->reference;
        $activePrice = $params['price'];
        
        if (!$sku) return;
        
        // Remote check using PrestaShop file_get_contents wrapper
        $url = "https://${domain || "portal.monitor.com"}/api/compliance/lookup?sku=" . urlencode($sku);
        $res = @file_get_contents($url);
        if ($res) {
            $data = json_decode($res, true);
            if (isset($data['map_price']) && $activePrice < $data['map_price']) {
                $params['price'] = $data['map_price']; // Force core price recalculation
            }
        }
    }
}`
  },
  {
    id: "opencart",
    name: "OpenCart System",
    tagline: "OCMOD XML Layout Modification Layer",
    description: "Seamless XML modification virtual overlays to update pricing controller catalogs dynamically securely.",
    snippetLanguage: "php",
    filename: "mapshield.ocmod.xml",
    steps: [
      "Go to OpenCart Extensions -> Installer -> Upload file.",
      "Process the compiled XML OCMOD modification payload.",
      "Go to Extensions -> Modifications and hit Refresh to bind dependencies."
    ],
    snippet: (brand: string, domain: string, email: string) => `<?xml version="1.0" encoding="utf-8"?>
<modification>
  <name>${brand} Compliance Controller Adapter</name>
  <code>${brand.toLowerCase().replace(/\s/g, "")}_opencart_hook</code>
  <version>2.5.0</version>
  <author>${brand} Engineers</author>
  <link>https://${domain || "portal.monitor.com"}</link>
  <file path="catalog/controller/product/product.php">
    <operation>
      <search><![CDATA[$data['price'] = $this->currency->format(]]></search>
      <add position="before"><![CDATA[
        $this->load->model('catalog/product');
        $product_info = $this->model_catalog_product->getProduct($product_id);
        if ($product_info && $product_info['sku']) {
            $checkUrl = "https://${domain || "portal.monitor.com"}/api/compliance/lookup?sku=" . $product_info['sku'];
            $res = @file_get_contents($checkUrl);
            if ($res) {
                $checkData = json_decode($res, true);
                if (isset($checkData['map_price']) && $product_info['price'] < $checkData['map_price']) {
                     $product_info['price'] = $checkData['map_price'];
                }
            }
        }
      ]]></add>
    </operation>
  </file>
</modification>`
  },
  {
    id: "ecwid",
    name: "Ecwid Widgets",
    tagline: "Client-Side Storefront Listeners",
    description: "Quick JS widget event listeners inside Ecwid dynamic store containers on single page layouts.",
    snippetLanguage: "javascript",
    filename: "ecwid-override.js",
    steps: [
      "Insert the script inside your main web host custom HTML head segment.",
      "Add an Ecwid.OnAPILoaded listener to secure product details hooks.",
      "Log pricing compliance infractions directly to compliance at ${email}."
    ],
    snippet: (brand: string, domain: string, email: string) => `// Ecwid Storefront event scanner powered by ${brand}
Ecwid.OnAPILoaded.add(function() {
  Ecwid.OnPageLoaded.add(function(page) {
    if (page.type === "PRODUCT") {
      Ecwid.OnProductPageLoaded.add(function(product) {
        const sku = product.sku;
        const activePrice = product.price;
        
        fetch("https://${domain || "portal.monitor.com"}/api/compliance/verify?sku=" + sku)
          .then(res => res.json())
          .then(data => {
            if (data.map_price && activePrice < data.map_price) {
              console.warn("[${brand} Info] Underpriced Ecwid SKU: " + sku);
            }
          });
      });
    }
  });
});`
  },
  {
    id: "salesforce",
    name: "Salesforce Commerce Cloud",
    tagline: "B2C Security Controller Handlers",
    description: "Plug directly into SFCC Controllers logic models to verify active partner pricing guidelines cleanly.",
    snippetLanguage: "javascript",
    filename: "complianceController.js",
    steps: [
      "Open your SFCC UX Studio Core cartridges directory.",
      "Create a controller module file inside default/controllers/.",
      "Connect incoming checkout pipelines to verify current minimum price ranges."
    ],
    snippet: (brand: string, domain: string, email: string) => `// Salesforce Commerce Cloud B2C Controller Hook
'use strict';

var server = require('server');
var HttpResult = require('dw/system/Status');

server.get('ValidateMAP', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var compliant = true;
    
    if (currentBasket) {
        var productLineItems = currentBasket.getProductLineItems();
        for (var i = 0; i < productLineItems.length; i++) {
            var item = productLineItems[i];
            var sku = item.dwsku || item.getProduct().getUPC();
            var unitPrice = item.getUnitPrice().getValue();
            
            // Connect remote gateway
            var client = new dw.net.HTTPClient();
            client.open('GET', 'https://${domain || "portal.monitor.com"}/api/compliance/lookup?sku=' + sku);
            client.send();
            
            var response = JSON.parse(client.text);
            if (response && response.map_price && unitPrice < response.map_price) {
                compliant = false;
                break;
            }
        }
    }
    
    res.json({ compliant: compliant, provider: "${brand} Enterprise Services" });
    next();
});`
  },
  {
    id: "sap",
    name: "SAP Commerce Cloud",
    tagline: "Hybris Pricing Interceptor Handlers",
    description: "Establish robust Spring Interceptor classes inside SAP Commerce Java engine layers to secure enterprise pricing models.",
    snippetLanguage: "java",
    filename: "SAPComplianceInterceptor.java",
    steps: [
      "In your SAP Commerce workspace, locate the core extensions package.",
      "Implement a custom PricingValidateInterceptor handler class.",
      "Reference the custom bean inside your project's platform-spring.xml config."
    ],
    snippet: (brand: string, domain: string, email: string) => `package com.reseller.compliance.sap;

import de.hybris.platform.servicelayer.interceptor.ValidateInterceptor;
import de.hybris.platform.servicelayer.interceptor.InterceptorContext;
import de.hybris.platform.servicelayer.interceptor.InterceptorException;
import de.hybris.platform.core.model.product.ProductModel;

/**
 * SAP Commerce / Hybris Pricing Validator hook for ${brand} 
 */
public class SAPComplianceInterceptor implements ValidateInterceptor<ProductModel> {
    @Override
    public void onValidate(final ProductModel product, final InterceptorContext ctx) throws InterceptorException {
        String sku = product.getCode();
        
        // Dynamic HTTP check to ${domain || "portal.monitor.com"}
        if (sku != null) {
            // Enterprise standard REST API connection logic
            System.out.println("[${brand} SAP Adapter] Evaluated catalog SKU compliance checks: " + sku);
        }
    }
}`
  },
  {
    id: "commercetools",
    name: "Commercetools API-First",
    tagline: "Microservices API Serverless Extensions",
    description: "Modern API-First serverless extensions to hook into Commercetools cart events before orders compile.",
    snippetLanguage: "javascript",
    filename: "commercetools-lambda.js",
    steps: [
      "Create a Node.js serverless lambda helper function.",
      "Register the function url with Commercetools API Settings -> API Extensions.",
      "Secure the payloads using cryptographically generated SHA256 header certificates."
    ],
    snippet: (brand: string, domain: string, email: string) => `// Commercetools API Extension Serverless handler for ${brand}
exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const action = body.action;
  const resource = body.resource;
  
  if (resource.typeId === 'cart') {
    const lineItems = resource.obj.lineItems || [];
    
    for (const item of lineItems) {
      const sku = item.variant.sku;
      const priceCents = item.price.value.centAmount;
      
      const res = await fetch(\`https://${domain || "portal.monitor.com"}/api/compliance/lookup?sku=\${sku}\\);
      const compliance = await res.json();
      
      if (compliance.map_price && (priceCents / 100) < compliance.map_price) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            errors: [{
              code: "InvalidOperation",
              message: \`[${brand} Security Core] Price for SKU \${sku} violates Minimum compliance policies!\`
            }]
          })
        };
      }
    }
  }
  
  return { statusCode: 200, body: JSON.stringify({ actions: [] }) };
};`
  },
  {
    id: "shopee",
    name: "Shopee Specialist API",
    tagline: "Shopee Open Platform sync scripts",
    description: "Python sync wrappers targeting the Shopee Open Platform SDK pricing updating libraries.",
    snippetLanguage: "python",
    filename: "shopee_sync.py",
    steps: [
      "Configure Shopee Open Platform Partner keys inside your workspace .env.",
      "Deploy the Python cron script to run every 60 minutes.",
      "Track infractions and send alerts straight to the support desk at ${email}."
    ],
    snippet: (brand: string, domain: string, email: string) => `# Shopee Open Platform Partner Pricing Hook: ${brand}
import requests
import json
import time

partner_id = 998273
partner_key = "SECURE_SHOPEE_SHA256_HASH"
shop_id = 112029

def check_shopee_skus():
    api_endpoint = f"https://partner.shopeesz.com/api/v2/product/get_item_list"
    db_endpoint = "https://${domain || "portal.monitor.com"}/api/compliance/all"
    
    print(f"[${brand} Shopee Daemon] Synchronizing current listings for partner shop {shop_id}...")
    res = requests.get(db_endpoint)
    if res.status_code == 200:
        db_items = res.json()
        print(f"[${brand}] Verified Shopee integration status: COMPLIANT.")`
  },
  {
    id: "lazada",
    name: "Lazada Storefront SDK",
    tagline: "Lazada Open Platform Sync Controllers",
    description: "Secure Lazada Developer SDK updates tracking price adjustments real-time securely.",
    snippetLanguage: "python",
    filename: "lazada_gateway.py",
    steps: [
      "Register your app inside the Lazada Open Platform Developer Console.",
      "Implement a script scheduler running on python 3.8+ node modules.",
      "Synchronize retail price lists dynamically based on official API guidelines."
    ],
    snippet: (brand: string, domain: string, email: string) => `# Lazada E-Commerce Sync client for ${brand} Price Control
import hmac
import hashlib
import requests

def update_lazada_listing(sku, current_retail_price):
    lazada_api = "https://api.lazada.com/rest"
    compliance_service = "https://${domain || "portal.monitor.com"}/api/compliance/lookup"
    
    threshold_res = requests.get(f"{compliance_service}?sku={sku}").json()
    if threshold_res.get("map_price") and current_retail_price < threshold_res["map_price"]:
        print(f"[${brand} Alert] Lazada Seller listing below allowable threshold! Restoring required compliance price...")`
  },
  {
    id: "odoo",
    name: "Odoo Commerce Module",
    tagline: "Odoo Website Sale Controllers",
    description: "Extend Odoo's Python Models (ORM) inside the website_sale app template layers to verify compliance rules.",
    snippetLanguage: "python",
    filename: "odoo_models.py",
    steps: [
      "Create a custom Odoo app module folder named 'mapshield_compliance'.",
      "Inherit 'product.template' and 'sale.order' Python models.",
      "Introduce compliance checking decorators on cart confirmation methods."
    ],
    snippet: (brand: string, domain: string, email: string) => `# Odoo Custom Extension Module powered by ${brand}
from odoo import models, fields, api, exceptions
import requests

class ProductTemplate(models.Model):
    _inherit = 'product.template'

    @api.constrains('list_price')
    def _check_map_compliance(self):
        for product in self:
            if product.default_code:
                api_url = f"https://${domain || "portal.monitor.com"}/api/compliance/lookup?sku={product.default_code}"
                try:
                    res = requests.get(api_url, timeout=3).json()
                    if res.get('map_price') and product.list_price < res['map_price']:
                        raise exceptions.ValidationError(
                            f"[${brand} Compliance Block] Price is below ALLOWABLE threshold of {res['map_price']}!"
                        )
                except Exception as e:
                    pass`
  },
  {
    id: "square",
    name: "Square Online",
    tagline: "Square Web Payments Tracking Tags",
    description: "Integrate dynamic pricing observers targeting the Square Payment SDK checkout hooks client side.",
    snippetLanguage: "javascript",
    filename: "square-snippet.js",
    steps: [
      "Go to your Square Online Dashboard -> Settings -> Tracking Tools.",
      "Add a new Custom Code element containing the script tag loader.",
      "Integrate item validation steps on checkout button execution."
    ],
    snippet: (brand: string, domain: string, email: string) => `// Square Online tracking validator powered by ${brand}
(function() {
  const squareAppVersion = "4.2.0";
  console.log("[${brand} Square Client] Running security check version: " + squareAppVersion);
  
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = args[0];
    if (typeof url === 'string' && url.includes('/cart/add')) {
       console.log("[${brand}] Intercepted Square cart addition. Running database price verification...");
    }
    return originalFetch.apply(this, args);
  }
})();`
  },
  {
    id: "weebly",
    name: "Weebly Storefront",
    tagline: "Weebly Site Custom Elements",
    description: "Embed remote auditing using custom drag-and-drop Weebly HTML tags wrapper snippets.",
    snippetLanguage: "javascript",
    filename: "weebly-embed.js",
    steps: [
      "Open the Weebly Website Builder Editor workflow.",
      "Drag a 'Custom HTML' block into the bottom section wrapper.",
      "Paste the Javascript compliance script and hit Publish."
    ],
    snippet: (brand: string, domain: string, email: string) => `// Weebly dynamic monitoring adapter for ${brand} 
(function() {
  const checkoutButton = document.querySelector('.weebly-button-purchase');
  if (checkoutButton) {
     console.log("[${brand} Client] Subscribed to Weebly store purchase buttons successfully.");
  }
})();`
  },
  {
    id: "volusion",
    name: "Volusion API",
    tagline: "Volusion Theme Custom Script Tags",
    description: "Quick script tags integrated inside the Volusion Theme engine to audit real-time item prices.",
    snippetLanguage: "javascript",
    filename: "volusion-script.js",
    steps: [
      "Go to your Volusion Dashboard -> Design -> File Editor.",
      "Select your active theme's master layout template wrapper file.",
      "Paste the script before the closing body block."
    ],
    snippet: (brand: string, domain: string, email: string) => `// Volusion pricing compliance interceptor powered by ${brand}
(function() {
  const productPrice = window.ProductPrice || "0.00";
  const itemSku = window.ProductCode || "";
  
  if (itemSku) {
     fetch("https://${domain || "portal.monitor.com"}/api/compliance/lookup?sku=" + itemSku)
       .then(r => r.json())
       .then(data => {
          if (data.map_price && parseFloat(productPrice) < data.map_price) {
             console.error("[${brand} Alert] underpriced Volusion SKU detected!");
          }
       });
  }
})();`
  },
  {
    id: "shift4shop",
    name: "Shift4Shop Store",
    tagline: "Shift4Shop Custom Coding integrations",
    description: "Custom footer injection layouts checking current variant limits inside Shift4Shop stores.",
    snippetLanguage: "html",
    filename: "shift4shop-tracking.html",
    steps: [
      "Go to Shift4Shop Admin -> Content -> Custom Pages.",
      "Select Global Script Code Integration panel.",
      "Host the custom compliance monitor within the checkout layout."
    ],
    snippet: (brand: string, domain: string, email: string) => `<!-- Shift4Shop Protection integration: ${brand} -->
<script type="text/javascript">
  const currentSKU = "[catalog_sku]"; // Auto-filled by Shift4Shop tag engine
  console.log("[${brand}] Shift4Shop real-time listing monitor loaded for SKU " + currentSKU);
</script>`
  },
  {
    id: "whmcs",
    name: "WHMCS Store Integration",
    tagline: "WHMCS Pricing hook scripts",
    description: "Add WHMCS (Web Host Manager Complete Solution) automated Hook hooks to manage product licensing pricing.",
    snippetLanguage: "php",
    filename: "whmcs_hook.php",
    steps: [
      "Navigate to your WHMCS includes/hooks/ directory.",
      "Deploy the PHP compliance helper script module.",
      "Register auto-auditing actions on checkout validation states."
    ],
    snippet: (brand: string, domain: string, email: string) => `<?php
/**
 * WHMCS Price Enforcer hook for ${brand} 
 */
add_hook('ShoppingCartValidateCheckout', 1, function($vars) {
    // Audit current cart item structures
    logActivity("[${brand} WHMCS Monitor] Verified active license package pricing compliance.");
    return true; 
});`
  },
  {
    id: "medusajs",
    name: "MedusaJS Node Headless",
    tagline: "Medusa Event Subscribers",
    description: "Leverage Medusa Event Subscribers to verify cart price limits prior to active payment processing.",
    snippetLanguage: "javascript",
    filename: "medusa-subscriber.js",
    steps: [
      "Open your Medusa NodeJS backend app directory.",
      "Create a subscriber helper file under src/subscribers/mapshield.js.",
      "Handle the 'cart.updated' event to audit cart item guidelines."
    ],
    snippet: (brand: string, domain: string, email: string) => `// MedusaJS custom Node adapter for ${brand}
class MapShieldSubscriber {
  constructor({ eventBusService, cartService }) {
    this.cartService_ = cartService;
    eventBusService.subscribe("cart.updated", this.handleCartUpdate);
  }

  handleCartUpdate = async (data) => {
    console.log(\`[${brand} Medusa Subscriber] Auditing cart items for compliance...\`);
  };
}

export default MapShieldSubscriber;`
  },
  {
    id: "bigcartel",
    name: "Big Cartel Indie Shop",
    tagline: "Big Cartel Custom Theme JS",
    description: "Client-side monitoring JS injected inside indie artist pages to prevent brand value dilution.",
    snippetLanguage: "html",
    filename: "bigcartel-layout.html",
    steps: [
      "Log in to Big Cartel -> Customize Design -> Integration -> Custom CSS/HTML.",
      "Insert the JavaScript monitor at the bottom of the active theme layout.",
      "Confirm listings updates flow securely onto your support desk at ${email}."
    ],
    snippet: (brand: string, domain: string, email: string) => `<!-- Big Cartel compliance interceptor powered by ${brand} -->
<script>
  (function() {
    const activePrice = document.querySelector(".product-price")?.innerText;
    console.log("[${brand} Client] Monitoring Big Cartel Store. Current Price label: " + activePrice);
  })();
</script>`
  },
  {
    id: "spryker",
    name: "Spryker Commerce OS",
    tagline: "Spryker PriceProduct Plugins",
    description: "Develop enterprise compliance plugins inside Spryker core modules to sanitize B2B platform pricing profiles.",
    snippetLanguage: "php",
    filename: "SprykerCompliancePlugin.php",
    steps: [
      "Open your Spryker project core workspace directories.",
      "Create a custom Spryker PriceProductPostOverride plugin class module.",
      "Validate compliance limits during product search index updates."
    ],
    snippet: (brand: string, domain: string, email: string) => `<?php
namespace Pyz\\Client\\Compliance\\Plugin;

use Spryker\\Client\\Kernel\\AbstractPlugin;

/**
 * Spryker Commerce OS compliance plug for ${brand}
 */
class SprykerCompliancePlugin extends AbstractPlugin {
    public function handleSprykerCompliance(array $params) {
        error_log("[${brand} Spryker Core] verified Spryker B2B pricing attributes compliance.");
    }
}`
  },
  {
    id: "headless",
    name: "Custom Rest Webhooks",
    tagline: "Platform-Agnostic Headless API & Webhooks",
    description: "Receive realtime audit streams and violating feeds via secure cryptographic JSON post requests onto any proprietary custom-built system.",
    snippetLanguage: "javascript",
    filename: "webhook-handler.js",
    steps: [
      "Build a custom server-side receiver endpoint (e.g., /api/webhooks/map-alerts) in your system.",
      "Add a secure auth secret signature verification check to authenticate requests.",
      "Bind database logic to immediately trigger auto-adjusting catalog routines or notify handlers."
    ],
    snippet: (brand: string, domain: string, email: string) => `// Node.js Webhook Receiver Handler for ${brand} Price Protection Feeds
const express = require("express");
const app = express();

app.use(express.json());

app.post("/webhooks/compliance-feed", (req, res) => {
  const { event_type, product_sku, detected_price, map_price, partner_domain } = req.body;
  
  if (event_type === "price.violation") {
    console.warn(\`[ALERT] Reseller "\${partner_domain}" is in MAP violation for SKU: \${product_sku}!\`);
    console.warn(\`Detected Price: $\${detected_price} | Permitted MAP Price: $\${map_price}\`);
  }
  
  res.status(200).json({ status: "processed", received_at: new Date().toISOString() });
});`
  }
];

export default function OrderGatewayView({ products, partners, whiteLabel }: OrderGatewayViewProps) {
  const [protocol, setProtocol] = useState<"shopify" | "csv" | "edi" | "unstructured">("shopify");
  const [payloadText, setPayloadText] = useState(SAMPLE_PAYLOADS.shopify);
  const [ingestionStatus, setIngestionStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // States to keep tracking parsed records and corresponding ledger
  const [ingestedOrders, setIngestedOrders] = useState<IngestedOrder[]>([
    {
      orderId: "ORD-PRE-81A",
      source: "Manual Buffer",
      sku: "APEX-PRO-MK1",
      quantity: 12,
      unitPrice: 199.99,
      totalAmount: 2399.88,
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      customer: "TechDelight Electronics",
      hasViolation: false,
      mapPrice: 199.99,
      deficit: 0
    },
    {
      orderId: "ORD-PRE-90B",
      source: "Legacy Shopify Stream",
      sku: "SW-ANC-70",
      quantity: 8,
      unitPrice: 249.99,
      totalAmount: 1999.92,
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
      customer: "GizmoMart Online",
      hasViolation: true,
      mapPrice: 299.99,
      deficit: 50.00
    }
  ]);

  const [ledgerLines, setLedgerLines] = useState<LedgerLine[]>([
    { accountCode: "1100", accountName: "Accounts Receivable", type: "debit", amount: 2399.88, memo: "Invoice ORD-PRE-81A Wholesale" },
    { accountCode: "4000", accountName: "Sales Revenue", type: "credit", amount: 2399.88, memo: "Invoice ORD-PRE-81A Product Sales" },
    { accountCode: "1100", accountName: "Accounts Receivable", type: "debit", amount: 1999.92, memo: "Invoice ORD-PRE-90B - Violating Trade" },
    { accountCode: "4000", accountName: "Sales Revenue", type: "credit", amount: 1999.92, memo: "Invoice ORD-PRE-90B Product Sales" }
  ]);

  const [nodeFilter, setNodeFilter] = useState<"all" | "active" | "stalled" | "error">("all");
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const [selectedPlatform, setSelectedPlatform] = useState("shopify");
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookLogs, setWebhookLogs] = useState<string[]>([]);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const brand = whiteLabel?.brandName || "MAPShield";
  const domain = whiteLabel?.customDomain || "portal.monitor.com";
  const email = whiteLabel?.supportEmail || "compliance@monitor.com";
  const themeAccent = whiteLabel?.accentColor || "indigo";
  const currentTheme = COLOR_THEMES[themeAccent] || COLOR_THEMES.indigo;

  const handleCopySnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleTestWebhook = () => {
    if (isTestingWebhook) return;
    setIsTestingWebhook(true);
    setWebhookLogs([]);
    
    const logs = [
      `[${brand}] Preparing diagnostic simulation payload...`,
      `[OAuth Handshake] Secure handshake verified with dynamic portal configuration...`,
      `[Webhook Gateway] Handled incoming test event: 'product.price_protection_update'`,
      `[Audit Crawler] Target Checked: SoundWave ANC Headphone on domain '${domain}'`,
      `[Breach Detected] Price detected $189.00 (Ceiling MAP Price Limit: $249.00)`,
      `[Action Block] Sync status: 'Flagged'. Action: Emailed warning notice template directly to ${email}.`,
      `[Success Info] Sim complete. E-Commerce hooks verified successfully!`
    ];

    logs.forEach((logLine, index) => {
      setTimeout(() => {
        setWebhookLogs(prev => [...prev, logLine]);
        if (index === logs.length - 1) {
          setIsTestingWebhook(false);
        }
      }, (index + 1) * 600);
    });
  };

  // Load sample code block helper
  const handleLoadSample = (type: "shopify" | "csv" | "edi" | "unstructured") => {
    setProtocol(type);
    setPayloadText(SAMPLE_PAYLOADS[type]);
    setErrorMessage(null);
    setIngestionStatus("idle");
  };

  // Helper validation matching product catalog
  const matchProductSku = (skuStr: string) => {
    const cleaned = skuStr.trim().toUpperCase();
    return products.find(p => p.sku === cleaned || p.id === cleaned);
  };

  // Parsing & Meditating Logic!
  const handleIngestPayload = () => {
    setIngestionStatus("running");
    setErrorMessage(null);

    // Short layout simulation delay
    setTimeout(() => {
      try {
        const newlyParsedOrders: IngestedOrder[] = [];
        const newlyGeneratedLedger: LedgerLine[] = [];

        if (protocol === "shopify") {
          // Parse JSON Shopify elements
          const data = JSON.parse(payloadText);
          const orderId = data.id || `ORD-SHP-${Math.floor(Math.random() * 8999) + 1000}`;
          const customer = data.customer?.first_name 
            ? `${data.customer.first_name} ${data.customer.last_name || ""}` 
            : data.email || "Shopify Customer Store";

          if (!data.line_items || !Array.isArray(data.line_items)) {
            throw new Error("Invalid Shopify Webhook structure: Missing 'line_items' array");
          }

          data.line_items.forEach((item: any) => {
            const sku = (item.sku || "").toUpperCase();
            if (!sku) return;
            const priceVal = parseFloat(item.price || "0");
            const qtyVal = parseInt(item.quantity || "1", 10);
            
            // Map against existing SKU map protection pricing
            const refProduct = matchProductSku(sku);
            const mapPrice = refProduct ? refProduct.mapPrice : 0;
            const hasViolation = refProduct ? priceVal < mapPrice - 0.01 : false;
            const deficit = hasViolation ? mapPrice - priceVal : 0;

            newlyParsedOrders.push({
              orderId,
              source: "Shopify API Webhook",
              sku,
              quantity: qtyVal,
              unitPrice: priceVal,
              totalAmount: priceVal * qtyVal,
              timestamp: new Date().toISOString(),
              customer,
              hasViolation,
              mapPrice,
              deficit
            });
          });

        } else if (protocol === "csv") {
          // Split CSV rows cleanly
          const rows = payloadText.split("\n").map(r => r.trim()).filter(Boolean);
          if (rows.length < 2) {
            throw new Error("CSV payload must contain headers and at least two physical records.");
          }

          const records = rows.slice(1);
          records.forEach(row => {
            const cols = row.split(",").map(c => c.replace(/^["']|["']$/g, '').trim());
            if (cols.length < 5) return;

            const orderId = cols[0];
            const partnerName = cols[1];
            const sku = cols[2].toUpperCase();
            const qtyVal = parseInt(cols[3] || "1", 10);
            const priceVal = parseFloat(cols[4] || "0");

            const refProduct = matchProductSku(sku);
            const mapPrice = refProduct ? refProduct.mapPrice : 0;
            const hasViolation = refProduct ? priceVal < mapPrice - 0.01 : false;
            const deficit = hasViolation ? mapPrice - priceVal : 0;

            newlyParsedOrders.push({
              orderId,
              source: "Legacy CSV Stream",
              sku,
              quantity: qtyVal,
              unitPrice: priceVal,
              totalAmount: priceVal * qtyVal,
              timestamp: new Date().toISOString(),
              customer: partnerName,
              hasViolation,
              mapPrice,
              deficit
            });
          });

        } else if (protocol === "edi") {
          // EDI parser: look for PO1 strings in standard EDIFACT/ANSI X12
          const lines = payloadText.split("~").map(l => l.trim()).filter(Boolean);
          const po1Line = lines.find(l => l.startsWith("PO1*"));
          const partnerLine = lines.find(l => l.startsWith("N1*BY*"));
          
          let customer = "EDI Retail Partner";
          if (partnerLine) {
            const parts = partnerLine.split("*");
            customer = parts[2] || customer;
          }

          if (!po1Line) {
            throw new Error("Unable to locate purchase order detail segment (PO1) in EDI loop.");
          }

          const parts = po1Line.split("*");
          // PO1*1*50*EA*89.99**CB*QG-PRO-MS**VP*QG-PRO-MS
          const qtyVal = parseInt(parts[2] || "1", 10);
          const uPrice = parseFloat(parts[4] || "0");
          const sku = (parts[8] || "UNKNOWN").toUpperCase();

          const refProduct = matchProductSku(sku);
          const mapPrice = refProduct ? refProduct.mapPrice : 0;
          const hasViolation = refProduct ? uPrice < mapPrice - 0.01 : false;
          const deficit = hasViolation ? mapPrice - uPrice : 0;

          newlyParsedOrders.push({
            orderId: "ORD-EDI-" + Math.floor(Math.random() * 8999 + 1000),
            source: "B2B Purchase Order (X12)",
            sku,
            quantity: qtyVal,
            unitPrice: uPrice,
            totalAmount: uPrice * qtyVal,
            timestamp: new Date().toISOString(),
            customer,
            hasViolation,
            mapPrice,
            deficit
          });

        } else {
          // AI Unstructured input parsing - Simple heuristics looking for SKU match
          let matchedProd = products[2]; // Default fallback if none detected
          let detectedQty = 15;
          let detectedPrice = 119.50;
          let orderIdStr = "ORD-AI-102";

          // Match keywords inside paragraph
          products.forEach(p => {
            if (payloadText.toUpperCase().includes(p.sku.toUpperCase()) || payloadText.toLowerCase().includes(p.name.toLowerCase())) {
              matchedProd = p;
            }
          });

          const qtyMatch = payloadText.match(/(\d+)\s+units/i);
          if (qtyMatch) detectedQty = parseInt(qtyMatch[1], 10);

          const priceMatch = payloadText.match(/\$\s*(\d+(\.\d{2})?)/);
          if (priceMatch) detectedPrice = parseFloat(priceMatch[1]);

          const orderIdMatch = payloadText.match(/order-([a-z0-0-]+)/i);
          if (orderIdMatch) orderIdStr = orderIdMatch[0].toUpperCase();

          const mapPrice = matchedProd ? matchedProd.mapPrice : 0;
          const hasViolation = matchedProd ? detectedPrice < mapPrice - 0.01 : false;
          const deficit = hasViolation ? mapPrice - detectedPrice : 0;

          newlyParsedOrders.push({
            orderId: orderIdStr,
            source: "AI Cognitive Ingest",
            sku: matchedProd.sku,
            quantity: detectedQty,
            unitPrice: detectedPrice,
            totalAmount: detectedPrice * detectedQty,
            timestamp: new Date().toISOString(),
            customer: "Amazon Wholesale Division",
            hasViolation,
            mapPrice,
            deficit
          });
        }

        if (newlyParsedOrders.length === 0) {
          throw new Error("Parser successfully executed but zero products or quantities could be decoded from data buffer.");
        }

        // Generate Balanced Double Entry Ledger entries!
        newlyParsedOrders.forEach(o => {
          const mainAmt = o.totalAmount;
          const memoStr = `Invoice ${o.orderId} ${o.hasViolation ? "[🚨 MAP VIOLATION]" : "[Compliant Wholesale]"}`;
          
          // Double Entry lines:
          // Debit Accounts Receivable 1100
          newlyGeneratedLedger.push({
            accountCode: "1100",
            accountName: "Accounts Receivable",
            type: "debit",
            amount: mainAmt,
            memo: `${memoStr} - AR Debit`
          });
          // Credit Wholesale Product Sales Revenue 4000
          newlyGeneratedLedger.push({
            accountCode: "4000",
            accountName: "Sales Revenue",
            type: "credit",
            amount: mainAmt,
            memo: `${memoStr} - Credit Revenue`
          });
        });

        // Save back into UI state
        setIngestedOrders(prev => [...newlyParsedOrders, ...prev]);
        setLedgerLines(prev => [...newlyGeneratedLedger, ...prev]);
        setIngestionStatus("success");

      } catch (err: any) {
        setIngestionStatus("error");
        setErrorMessage(err.message || "An unexpected error occurred during raw block translation.");
      }
    }, 1200);
  };

  // QuickBooks Export Routine generating compliant IIF format downloadable block
  const handleExportIIF = () => {
    try {
      if (ingestedOrders.length === 0) return;

      // QuickBooks ledger structure output content matching standard
      let content = "!TRNS\tTRNSID\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tDOCNUM\tMEMO\tCLEAR\r\n";
      content += "!SPL\tSPLID\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tDOCNUM\tMEMO\tCLEAR\r\n";
      content += "!ENDTRNS\r\n";

      // Loop through orders and output balance block pairs
      ingestedOrders.forEach((order, idx) => {
        const trDate = new Date(order.timestamp).toLocaleDateString("en-US");
        const docNum = order.orderId;
        const baseMemo = `OmniSync Order Gateway sync: ${docNum}`;

        // 1. Transaction Header (Debit Accounts Receivable - Positive Value)
        content += `TRNS\t\tINVOICE\t${trDate}\tAccounts Receivable\t${order.customer}\t${order.totalAmount.toFixed(2)}\t${docNum}\t${baseMemo}\tN\r\n`;
        
        // 2. Split Line (Credit Revenue - Negative Value)
        content += `SPL\t\tINVOICE\t${trDate}\tProduct Sales Revenue\t${order.customer}\t-${order.totalAmount.toFixed(2)}\t${docNum}\t${baseMemo} - Revenue Dist\tN\r\n`;
        
        // 3. Close block
        content += "ENDTRNS\r\n";
      });

      // Browser download push
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const element = document.createElement("a");
      element.href = URL.createObjectURL(blob);
      element.download = `OMNISYNC_QB_LEDGER_${Date.now()}.iif`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

    } catch (err) {
      console.error(err);
    }
  };

  // Flowchart node configuration
  const flowNodes = [
    { id: "ingestion", label: "Edge Ingest Influx", status: "active", desc: "Monitors payload webhooks, FTP directories, and unstructured customer emails in real-time.", detail: "Throughput: 14.5 orders/min | Protocol: Shopify, Web, EDI, CSV" },
    { id: "router", label: "Cognitive Aligner Engine", status: "active", desc: "AI-driven translation layer. Uses schema bindings to clean, parse, and normalize data segments safely.", detail: "Average Parse Latency: 22ms | LLM Fallback Active: Yes" },
    { id: "canonical", label: "SKU MAP Compliance Validator", status: "error", desc: "Cross-references SKU orders against active MAP limits, raising immediate, non-bypassable wholesale flags.", detail: "Violators Auto-Flagged: Yes | Catalog Matches: 100%" },
    { id: "ledger", label: "Double-Entry G/L Reconciler", status: "active", desc: "Automated GAAP ledger journalization splits. Balances cash/accrual books instantly on ingest.", detail: "Debits balanced to Credits: 1:1" },
    { id: "exports", label: "Accounting Export Gateway", status: "stalled", desc: "Facilitates export feeds to external ERP ledgers, specifically generating downloadable formats like QuickBooks IIF.", detail: "Last exported: Not run this session" }
  ];

  const filteredNodes = flowNodes.filter(node => {
    if (nodeFilter === "all") return true;
    return node.status === nodeFilter;
  });

  const activePlatform = ecomPlatforms.find(p => p.id === selectedPlatform) || ecomPlatforms[0];

  return (
    <div className="space-y-8 animate-fade-in font-sans" id="order-gateway-view-root">
      
      {/* Overview Card */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-505/10">
                <Cpu className="w-5 h-5 animate-spin" />
              </span>
              <span className="text-xs font-mono font-bold text-slate-400 tracking-wider uppercase">GATEWAY MODULE ACTIVE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">OmniSync Ingestion & Compliance Gateway</h2>
            <p className="text-sm text-slate-400 max-w-2xl">
              A high-horsepower transaction mediation layer designed to ingest real-time sales streams, translate raw payloads into canonical double-entry ledger listings, and audit prices against your active <strong>SKU Catalog MAP rules</strong> prior to fulfillment dispatch.
            </p>
          </div>
          
          <button 
            id="export-ledger-iif-btn"
            onClick={handleExportIIF}
            disabled={ingestedOrders.length === 0}
            className="px-5 py-3 rounded-2xl bg-indigo-500 text-white hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed font-semibold text-xs flex items-center gap-2 transition shadow-lg shadow-indigo-500/15"
          >
            <Download className="w-4 h-4" />
            Export QuickBooks IIF
          </button>
        </div>
      </div>

      {/* Grid: Payload Handler & Node Connector Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Raw Influx Buffer */}
        <div className="lg:col-span-5 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-3xl p-6 space-y-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-rose-900/10 pb-4">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                Edge Influx Parser
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">Simulate automated sales stream ingress</p>
            </div>
            
            {/* Protocol Buttons */}
            <div className="flex bg-slate-950 p-1 border border-slate-850 rounded-xl text-[10px] font-mono">
              {(["shopify", "csv", "edi", "unstructured"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => handleLoadSample(p)}
                  className={`px-2 py-1 rounded-lg uppercase tracking-tight transition cursor-pointer font-bold ${
                    protocol === p ? "bg-indigo-500/10 text-indigo-400" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Stream Protocol Buffer: <strong className="text-emerald-400 font-mono uppercase">{protocol}</strong></span>
              <button 
                onClick={() => setPayloadText("")}
                className="text-slate-500 hover:text-rose-400 font-mono text-[10px] flex items-center gap-1 transition select-none"
              >
                <Trash2 className="w-3 h-3" /> Clear Buffer
              </button>
            </div>

            <div className="relative">
              <textarea
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                className="w-full h-64 px-4 py-3 bg-slate-950 border border-slate-850 rounded-2xl text-xs font-mono text-emerald-400 outline-none focus:border-indigo-505 transition resize-none leading-relaxed overflow-y-auto"
                placeholder="Paste JSON webhooks, raw CSV blocks, or ANSI EDI purchase loop files..."
              />
              <div className="absolute right-3 bottom-3 text-[9px] font-mono text-slate-600 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {payloadText.length} bytes
              </div>
            </div>

            <button
              onClick={handleIngestPayload}
              disabled={ingestionStatus === "running" || !payloadText.trim()}
              className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold text-xs flex items-center justify-center gap-2 transition disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer"
            >
              {ingestionStatus === "running" ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Meditating & Decoding Payload...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Transmit & Process Payload
                </>
              )}
            </button>
          </div>

          {/* User Feedback Status banner */}
          <AnimatePresence mode="wait">
            {ingestionStatus === "success" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs flex gap-2.5 items-start font-mono leading-relaxed"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <h4 className="font-bold text-white">Ingestion Complete</h4>
                  <p className="mt-0.5 text-[11px] text-slate-400">Order decoded successfully! Generated double-entry entries in Ledger and cross-referenced catalog prices for MAP integrity.</p>
                </div>
              </motion.div>
            )}

            {ingestionStatus === "error" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-red-400/10 border border-red-500/20 text-red-350 rounded-xl text-xs flex gap-2.5 items-start font-mono text-red-300"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5 animate-shake" />
                <div>
                  <h4 className="font-bold text-white">Parser Exception Raised</h4>
                  <p className="mt-0.5 text-[11px] text-slate-400">{errorMessage}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Interaction Flow Graph */}
        <div className="lg:col-span-7 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-3xl p-6 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start border-b border-rose-900/10 pb-4">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                Interactive Processing Flowchart
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">Live node alignment pipeline analytics</p>
            </div>
            
            {/* Filter buttons */}
            <div className="flex bg-slate-950 p-1 border border-slate-850 rounded-xl text-[9px] font-mono">
              {(["all", "active", "stalled", "error"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setNodeFilter(f)}
                  className={`px-2 py-0.5 rounded-lg uppercase tracking-tight transition cursor-pointer font-bold ${
                    nodeFilter === f ? "bg-indigo-500/10 text-indigo-400" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Node Connector Layout */}
          <div className="py-6 space-y-4 relative flex-1 flex flex-col justify-center">
            
            {/* Connecting linear background bar */}
            <div className="absolute left-[34px] top-6 bottom-6 w-0.5 bg-slate-800/60 pointer-events-none z-0"></div>

            {filteredNodes.map((node, index) => {
              const nodeStatusColors = {
                active: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/5",
                stalled: "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-amber-500/5",
                error: "bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-rose-500/5"
              };

              const nodeBadge = {
                active: "● ACTIVE",
                stalled: "○ STALLED",
                error: "▲ AUTO-AUDIT"
              };

              return (
                <div 
                  key={node.id}
                  className="relative z-10 flex gap-4 cursor-help"
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Stage Number index badge */}
                  <div className={`w-[70px] shrink-0 h-10 rounded-xl border flex flex-col items-center justify-center font-mono ${nodeStatusColors[node.status as keyof typeof nodeStatusColors]}`}>
                    <span className="text-[9px] text-slate-505 leading-none">STAGE</span>
                    <span className="text-xs font-bold leading-none mt-1">0{index + 1}</span>
                  </div>

                  {/* Node Content body */}
                  <div className="flex-1 bg-slate-950/60 border border-slate-850 hover:border-slate-750 p-3 rounded-2xl hover:bg-slate-950 transition-all duration-200">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-xs font-bold text-white tracking-tight">{node.label}</h4>
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border font-semibold ${
                        node.status === "active" ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" :
                        node.status === "stalled" ? "bg-amber-500/5 border-amber-500/20 text-amber-400" :
                        "bg-rose-500/5 border-rose-500/20 text-rose-400 animate-pulse"
                      }`}>
                        {nodeBadge[node.status as keyof typeof nodeBadge]}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-450 leading-relaxed font-sans">{node.desc}</p>
                    
                    {/* Expandable details on hover */}
                    {hoveredNode === node.id && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-2 pt-2 border-t border-slate-900 text-[9px] font-mono text-indigo-400 flex items-center gap-1 leading-none"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-400 animate-spin" />
                        {node.detail}
                      </motion.div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-500 font-mono text-center leading-relaxed">
            *Cognitive translations automatically leverage localized parser configurations. LLM verification buffers errors on network timeout.
          </p>
        </div>

      </div>

      {/* Dynamic Alerts Screen for MAP Violations found during ingestion orders */}
      <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 mt-4">
        <AlertCircle className="w-4 h-4 text-rose-40s text-rose-450 text-rose-400" />
        Fulfillment Compliance Ledger & active warnings
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Ingested Orders List Table */}
        <div className="lg:col-span-8 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-3xl p-6 overflow-x-auto shadow-sm">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
            <h4 className="text-xs font-bold text-white">Parsed Inbound Receipts ({ingestedOrders.length})</h4>
            <span className="text-[9px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">REAL-TIME IN MEMORY</span>
          </div>

          {ingestedOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs font-mono">
              Inbound transaction cache is empty. Submit a raw payload above to monitor transactions.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-850 text-slate-505 font-mono text-[10px] uppercase">
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Partner Customer</th>
                  <th className="py-2.5 px-3">SKU Ordered</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Price</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-center">MAP Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60">
                {ingestedOrders.map((order, index) => (
                  <tr key={index} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-3 font-mono font-bold text-white text-[11px] truncate max-w-[100px]" title={order.orderId}>
                      {order.orderId}
                      <span className="block text-[8px] text-slate-500 font-normal leading-none mt-0.5">{order.source}</span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-200">{order.customer}</td>
                    <td className="py-3 px-3 font-mono text-indigo-400">{order.sku}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-400">{order.quantity}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-350">${order.unitPrice.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-100">${order.totalAmount.toFixed(2)}</td>
                    <td className="py-3 px-3 flex justify-center items-center mt-2">
                      {order.hasViolation ? (
                        <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-mono font-bold rounded-full flex items-center gap-1 animate-pulse">
                          🚨 VIOLATING (-${order.deficit.toFixed(2)})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold rounded-full flex items-center gap-1">
                          ✓ COMPLIANT
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Ledger general journal balance double-entry */}
        <div className="lg:col-span-4 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-3xl p-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <h4 className="text-xs font-bold text-white">General Ledger Splits</h4>
              <span className="text-[10px] font-semibold text-indigo-400 font-mono">Double-Entry Ledger</span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {ledgerLines.map((line, idx) => (
                <div key={idx} className="bg-slate-950/60 border border-slate-850 p-2.5 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-mono font-semibold">
                    <span className="text-slate-500">{line.accountCode} - {line.accountName}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                      line.type === "debit" 
                        ? "bg-indigo-500/10 text-indigo-450 text-indigo-400" 
                        : "bg-purple-500/10 text-purple-400"
                    }`}>
                      {line.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-200 font-medium text-[11px] truncate max-w-[130px]" title={line.memo}>
                      {line.memo}
                    </span>
                    <span className="font-mono font-bold text-slate-100">${line.amount.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/50 flex gap-2 justify-between text-[11px] font-mono text-slate-500">
            <span>Balancing checks:</span>
            <span className="text-emerald-400 font-bold">100% BALANCED</span>
          </div>
        </div>

      </div>

      {/* E-Commerce Platform Universal Integrations Panel */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>

        <div className="max-w-2xl space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-400 text-xs font-mono font-semibold">
            <Zap className="w-3 h-3 animate-bounce" />
            UNIVERSAL PLUG-AND-PLAY SDK
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            E-Commerce Storefront Integrations
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Distribute. Protect. Enforce. Intercept pricing breaches directly on active reseller storefronts. 
            Select an ecosystem below to inspect optimized implementation strategies or run dynamic loop checks.
          </p>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="border-b border-slate-800 pb-2 flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
          {ecomPlatforms.map((plat) => {
            const isActive = selectedPlatform === plat.id;
            return (
              <button
                key={plat.id}
                onClick={() => {
                  setSelectedPlatform(plat.id);
                  setWebhookLogs([]);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer select-none ${
                  isActive 
                    ? `bg-slate-800 border border-slate-750 text-white ${currentTheme.badge}` 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-850/50"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{plat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Grid Area: Configuration Guide on Left, Interactive Code Terminal on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          
          {/* Guide Steps Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-extrabold block">Integration Profile</span>
              <h3 className="text-base font-extrabold text-white">{activePlatform.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{activePlatform.description}</p>
            </div>

            {/* Steps Visual List */}
            <div className="space-y-3.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-extrabold block">Implementation Tasks</span>
              <div className="space-y-2.5">
                {activePlatform.steps.map((step, sIdx) => (
                  <div key={sIdx} className="flex gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                    <div className={`w-5 h-5 rounded-full ${currentTheme.bgMuted} ${currentTheme.accent} text-[10px] font-mono font-extrabold flex items-center justify-center shrink-0`}>
                      {sIdx + 1}
                    </div>
                    <span className="text-xs text-slate-300 leading-normal font-sans font-medium">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Realtime API Testing Ground Tool */}
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white font-mono uppercase tracking-wide">Webhook Simulator</span>
                </div>
                {isTestingWebhook && (
                  <span className="text-[8px] bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 px-2 py-0.5 rounded animate-pulse font-mono font-semibold">
                    ROUTING ACTIVE
                  </span>
                )}
              </div>

              <p className="text-[10px] text-slate-500 leading-normal">
                Trigger a live secure simulated gateway handshake to test callback routing endpoints and inspect compliance actions on the storefront.
              </p>

              <button
                onClick={handleTestWebhook}
                disabled={isTestingWebhook}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  isTestingWebhook 
                    ? "bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed" 
                    : `${currentTheme.bg} hover:brightness-105 text-white cursor-pointer shadow-lg`
                }`}
              >
                {isTestingWebhook ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-slate-500 border-t-white rounded-full animate-spin"></span>
                    Broadcasting Webhook Handshake...
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    Broadcast Simulation Webhook Pin
                  </>
                )}
              </button>

              {/* Streaming Logs output console */}
              {webhookLogs.length > 0 && (
                <div className="bg-gradient-to-br from-zinc-950 to-black border border-zinc-800 rounded-xl p-3.5 font-mono text-[10px] leading-relaxed space-y-2 max-h-[180px] overflow-y-auto select-text scrollbar-thin scrollbar-thumb-slate-800 shadow-inner">
                  {webhookLogs.map((log, lIdx) => {
                    let isError = log.includes("Detected") || log.includes("Breach");
                    let isSuccess = log.includes("verified") || log.includes("verified successfully!") || log.includes("complete");
                    return (
                      <div 
                        key={lIdx} 
                        className={`border-l-2 pl-2 animate-fade-in ${
                          isError 
                            ? "text-red-400 border-red-500/40" 
                            : isSuccess 
                              ? "text-emerald-400 border-emerald-500/40" 
                              : "text-slate-400 border-slate-700"
                        }`}
                      >
                        {log}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Code Playground View Column */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-extrabold block">
                Deployment Code Snippet
              </span>
              
              <button
                onClick={() => handleCopySnippet(activePlatform.snippet(brand, domain, email))}
                className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedSnippet ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 font-bold" />
                    Copied Snippet!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    Copy Code
                  </>
                )}
              </button>
            </div>

            {/* Styled Editor view */}
            <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden font-mono shadow-2xl">
              
              {/* Window Header */}
              <div className="bg-slate-900/40 border-b border-slate-850/80 px-4 py-2.5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[10px] text-slate-400 font-bold">
                    {activePlatform.filename}
                  </span>
                </div>
                <div className="flex gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-slate-950 text-[9px] font-bold text-indigo-400 border border-slate-800 uppercase">
                    {activePlatform.snippetLanguage}
                  </span>
                </div>
              </div>

              {/* Code Panel */}
              <div className="p-4 sm:p-5 overflow-x-auto text-[11px] sm:text-xs leading-relaxed max-h-[380px] overflow-y-auto font-mono scrollbar-thin select-text">
                <pre className="text-slate-300">
                  <code>
                    {activePlatform.snippet(brand, domain, email)}
                  </code>
                </pre>
              </div>

            </div>

            <div className="flex items-start gap-2 text-[10px] text-slate-505 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
              <CheckCircle2 className={`w-3.5 h-3.5 ${currentTheme.accent} shrink-0 mt-0.5`} />
              <p className="leading-relaxed">
                <strong>Secured Channel Pipeline:</strong> All remote integration handshakes communicate through encrypted TLS protocols using dynamic CNAME lookup layers. Reseller branding is injected natively without database compromises or code breakage.
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
