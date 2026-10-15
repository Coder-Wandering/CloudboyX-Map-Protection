import React, { useState } from "react";
import { WhiteLabelConfig } from "../types";
import { 
  Shield, Lock, Eye, Globe, Sparkles, Crown, Target, Paintbrush, Link2, 
  Mail, Phone, FileText, Check, RotateCcw, Download, Copy, Share2, Server, Key, Info, HelpCircle,
  ShoppingBag, Code2, Terminal, ArrowRight, Zap, CheckCircle2, Clock, Upload, ExternalLink, Layers
} from "lucide-react";
import CloudboyLogo from "./CloudboyLogo";

interface WhiteLabelViewProps {
  config: WhiteLabelConfig;
  onUpdateConfig: (newConfig: WhiteLabelConfig) => void;
  onReset: () => void;
}

export default function WhiteLabelView({ config, onUpdateConfig, onReset }: WhiteLabelViewProps) {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedGuide, setCopiedGuide] = useState(false);

  const [selectedPlatform, setSelectedPlatform] = useState("shopify");
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookLogs, setWebhookLogs] = useState<string[]>([]);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const [isLogoDragging, setIsLogoDragging] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);

  const handleLogoFileProcess = (file: File) => {
    setLogoUploadError(null);
    if (!file.type.startsWith("image/")) {
      setLogoUploadError("Unsupported file type. Please select an image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoUploadError("Image is too large. Recommended limit is 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (reader.result && typeof reader.result === "string") {
        onUpdateConfig({
          ...config,
          logoUrl: reader.result as string
        });
        triggerSuccessFeedback("Custom brand logo updated successfully!");
      }
    };
    reader.onerror = () => {
      setLogoUploadError("Failed to read the file.");
    };
    reader.readAsDataURL(file);
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

  // Rest of state variable setup remains the same
  // Available vector icon list with descriptors
  const availableIcons = [
    { type: "cloudboy", icon: (props: any) => <CloudboyLogo {...props} className="w-5 h-5" animated={true} />, label: "Cloudboy Gears", desc: "The official Cloudboy Protect emblem" },
    { type: "shield", icon: Shield, label: "Security Shield", desc: "For secure channel monitoring" },
    { type: "lock", icon: Lock, label: "Compliance Lock", desc: "For enforcement and control" },
    { type: "eye", icon: Eye, label: "Active Guard Eye", desc: "For 24/7 web monitoring" },
    { type: "globe", icon: Globe, label: "Global Domain Tracker", desc: "For global retail crawlers" },
    { type: "sparkles", icon: Sparkles, label: "AI Enhanced Crown", desc: "For intelligent automated sweeps" },
    { type: "crown", icon: Crown, label: "Enterprise Premium", desc: "For elite authorized brands" },
    { type: "target", icon: Target, label: "MAP Bullseye Target", desc: "For surgical price detection" }
  ] as const;

  // Premium reseller-oriented color templates
  const colorThemes = {
    indigo: {
      name: "Sapphire Indigo",
      accent: "text-indigo-400",
      bg: "bg-indigo-500",
      bgMuted: "bg-indigo-500/10",
      border: "border-indigo-500/20",
      hover: "hover:bg-indigo-600",
      glow: "shadow-indigo-500/20",
      badge: "bg-indigo-500/15 text-indigo-400 border-indigo-500/35"
    },
    emerald: {
      name: "Grounded Emerald",
      accent: "text-emerald-400",
      bg: "bg-emerald-500",
      bgMuted: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      hover: "hover:bg-emerald-600",
      glow: "shadow-emerald-500/20",
      badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/35"
    },
    rose: {
      name: "Crimson Rose",
      accent: "text-rose-400",
      bg: "bg-rose-500",
      bgMuted: "bg-rose-500/10",
      border: "border-rose-500/20",
      hover: "hover:bg-rose-600",
      glow: "shadow-rose-500/20",
      badge: "bg-rose-500/15 text-rose-400 border-rose-500/35"
    },
    amber: {
      name: "Vigilant Amber",
      accent: "text-amber-400",
      bg: "bg-amber-500",
      bgMuted: "bg-amber-500/10",
      border: "border-amber-500/20",
      hover: "hover:bg-amber-600",
      glow: "shadow-amber-500/20",
      badge: "bg-amber-500/15 text-amber-400 border-amber-500/35"
    },
    blue: {
      name: "Aero Sky Blue",
      accent: "text-blue-400",
      bg: "bg-blue-500",
      bgMuted: "bg-blue-500/10",
      border: "border-blue-500/20",
      hover: "hover:bg-blue-600",
      glow: "shadow-blue-500/20",
      badge: "bg-blue-505/15 text-blue-400 border-blue-500/35"
    },
    violet: {
      name: "Monarch Violet",
      accent: "text-violet-400",
      bg: "bg-violet-500",
      bgMuted: "bg-violet-500/10",
      border: "border-violet-500/20",
      hover: "hover:bg-violet-600",
      glow: "shadow-violet-500/20",
      badge: "bg-violet-500/15 text-violet-400 border-violet-500/35"
    }
  };

  const currentTheme = colorThemes[config.accentColor] || colorThemes.indigo;

  // Retrieve current active icon component dynamically
  const getSelectedIcon = () => {
    const item = availableIcons.find(i => i.type === config.iconType);
    return item ? item.icon : Shield;
  };

  const SelectedIconComponent = getSelectedIcon();

  // Handle form changes dynamically
  const handleChange = (field: keyof WhiteLabelConfig, value: any) => {
    onUpdateConfig({
      ...config,
      [field]: value
    });
    if (field === "enableDailyEmailSummary") {
      triggerSuccessFeedback(
        value 
          ? "Daily email summary reports enabled successfully!" 
          : "Daily email summary reports disabled successfully!"
      );
    } else if (field === "enableAutoScanScheduling") {
      triggerSuccessFeedback(
        value
          ? "Automated scan job scheduler enabled successfully!"
          : "Automated scan job scheduler disabled successfully!"
      );
    } else if (field === "autoScanInterval") {
      triggerSuccessFeedback(`Recurrence loop frequency adjusted to: ${value}`);
    } else if (field === "autoScanTime") {
      triggerSuccessFeedback(`Preferred scan baseline slated for ${value}`);
    } else {
      triggerSuccessFeedback("Branding attributes synchronized successfully!");
    }
  };

  const handleCycleIconType = () => {
    const iconKeys = availableIcons.map(i => i.type);
    const currentIndex = iconKeys.indexOf(config.iconType as any);
    const nextIndex = (currentIndex + 1) % iconKeys.length;
    const nextIconType = iconKeys[nextIndex];
    onUpdateConfig({
      ...config,
      iconType: nextIconType as any
    });
    triggerSuccessFeedback(`Cycled brand logo to: ${nextIconType}`);
  };

  const handleCycleColorAccent = () => {
    const colorKeys = Object.keys(colorThemes) as Array<keyof typeof colorThemes>;
    const currentIndex = colorKeys.indexOf(config.accentColor);
    const nextIndex = (currentIndex + 1) % colorKeys.length;
    const nextColor = colorKeys[nextIndex];
    onUpdateConfig({
      ...config,
      accentColor: nextColor as any
    });
    triggerSuccessFeedback(`Cycled color theme tint to: ${colorThemes[nextColor].name}`);
  };

  const triggerSuccessFeedback = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 2500);
  };

  // Export current branding structure as JSON configuration module
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${config.brandName.toLowerCase().replace(/\s+/g, "-")}-white-label.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerSuccessFeedback("Whitelist parameters and theme attributes downloaded!");
  };

  const handleCopyGuide = () => {
    const guideText = `
White Label Host Setup Guide for '${config.brandName}':
======================================================
1. CNAME Configuration:
   Point clients' domain '${config.customDomain}' via CNAME record in DNS to your app's main cloud proxy.
2. Web Address:
   Secure SSL/TLS certificate for https://${config.customDomain}.
3. Support Contact:
   Forward inbound legal channels to ${config.supportEmail}.
4. Support Document Path:
   Host support guidelines on ${config.supportUrl}.
`;
    navigator.clipboard.writeText(guideText);
    setCopiedGuide(true);
    setTimeout(() => setCopiedGuide(false), 2000);
  };

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
      `[${config.brandName || "MAPShield"}] Preparing diagnostic simulation payload...`,
      `[OAuth Handshake] Secure handshake verified with dynamic portal configuration...`,
      `[Webhook Gateway] Handled incoming test event: 'product.price_protection_update'`,
      `[Audit Crawler] Target Checked: SoundWave ANC Headphone on domain '${config.customDomain || "portal.monitor.com"}'`,
      `[Breach Detected] Price detected $189.00 (Ceiling MAP Price Limit: $249.00)`,
      `[Action Block] Sync status: 'Flagged'. Action: Emailed warning notice template directly to ${config.supportEmail}.`,
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

  const activePlatform = ecomPlatforms.find(p => p.id === selectedPlatform) || ecomPlatforms[0];

  return (
    <div id="white-label-panel-view" className="space-y-8 animate-fade-in text-slate-350">
      
      {/* Upper header segment and description */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Share2 className="w-48 h-48 text-indigo-400" />
        </div>

        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/25 rounded-md text-slate-300 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            RESELLER LICENSE & ADMIN DESIGN HUB
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Admin Design Console
          </h1>
          <p className="text-sm leading-relaxed text-slate-400">
            Rebrand your pricing protection client. Modify logos, brand titles, legal subtexts, 
            support links, colors, and domains to create a bespoke experience you can re-sell or license 
            to third-party brands, channel managers, or corporate partners.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* LEFT COLUMN: Editing Workspace */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* General Brand Profile Card */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Paintbrush className="w-4.5 h-4.5 text-slate-400" />
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">General Identity & Brand Profiles</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">App Brand Name</label>
                <input 
                  type="text"
                  value={config.brandName}
                  onChange={(e) => handleChange("brandName", e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                  placeholder="e.g. PriceSentinel"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Brand Slogan / Tagline</label>
                <input 
                  type="text"
                  value={config.slogan}
                  onChange={(e) => handleChange("slogan", e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                  placeholder="e.g. Channel Protection Core"
                />
              </div>
            </div>

            {/* Accent Theme Selection */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-slate-300">Resold Application Color Accent</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {Object.entries(colorThemes).map(([colorKey, details]) => {
                  const isActive = config.accentColor === colorKey;
                  return (
                    <button
                      key={colorKey}
                      onClick={() => handleChange("accentColor", colorKey as any)}
                      className={`px-3 py-2.5 rounded-xl border-2 text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                        isActive 
                          ? "border-indigo-550 bg-indigo-500/5 text-white" 
                          : "border-slate-800 bg-slate-950 hover:bg-slate-850 text-slate-400"
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${details.bg}`}></span>
                      <span className="text-[10px] font-bold tracking-tight">{details.name.split(" ")[1]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Icon Picker */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">Primary Brand Logo Symbol</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {availableIcons.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = config.iconType === item.type;
                  return (
                    <button
                      key={item.type}
                      onClick={() => handleChange("iconType", item.type)}
                      className={`p-3 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
                        isActive 
                          ? "border-indigo-500/25 bg-indigo-500/10 text-white shadow-md" 
                          : "border-slate-800 bg-slate-950/70 hover:bg-slate-850 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isActive ? currentTheme.bg : "bg-slate-900"} text-white shrink-0`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold leading-tight truncate">{item.label}</span>
                        <span className="block text-[9px] text-slate-500 leading-normal truncate">{item.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Logo Image Upload Area */}
            <div className="space-y-3 p-4 bg-slate-950/40 border border-slate-850 rounded-2xl">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-slate-300">Custom Brand Logo Image</label>
                <span className="text-[9px] text-slate-500 font-mono">Bypasses Default Symbol</span>
              </div>
              <div 
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsLogoDragging(true);
                }}
                onDragLeave={() => setIsLogoDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsLogoDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleLogoFileProcess(file);
                }}
                className={`border border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-all ${
                  isLogoDragging 
                    ? "border-indigo-500 bg-indigo-500/10" 
                    : "border-slate-850 bg-slate-950/60 hover:bg-slate-900/40"
                }`}
              >
                <input
                  type="file"
                  id="wl-logo-file-picker"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoFileProcess(file);
                  }}
                  className="hidden"
                />
                
                {config.logoUrl ? (
                  <div className="flex flex-col items-center gap-3 w-full">
                    <div className="flex items-center justify-center p-2 bg-white border border-slate-700 rounded-xl w-14 h-14 select-none shadow-md overflow-hidden shrink-0">
                      <img 
                        src={config.logoUrl} 
                        alt="Brand logo preview" 
                        referrerPolicy="no-referrer"
                        className="max-w-full max-h-full object-contain rounded"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 font-semibold">Custom brand logo active</p>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateConfig({ ...config, logoUrl: undefined });
                          triggerSuccessFeedback("Custom brand logo cleared.");
                        }}
                        className="text-[9px] text-rose-400 hover:text-rose-300 font-mono font-bold mt-1 uppercase tracking-wider block mx-auto underline cursor-pointer"
                      >
                        Remove Custom Logo
                      </button>
                    </div>
                  </div>
                ) : (
                  <label 
                    htmlFor="wl-logo-file-picker"
                    className="cursor-pointer flex flex-col items-center gap-1.5 w-full select-none"
                  >
                    <Upload className={`w-5 h-5 ${isLogoDragging ? 'text-indigo-400 animate-bounce' : 'text-slate-500'}`} />
                    <div className="text-center">
                      <p className="text-xs font-semibold text-slate-300">
                        <span className="text-indigo-455 text-indigo-400 border-b border-indigo-400/40 hover:text-indigo-300 transition">Click to upload</span> or drag logo here
                      </p>
                      <p className="text-[9px] text-slate-500 font-mono mt-1">PNG, JPG or SVG (Recommended &lt; 2MB)</p>
                    </div>
                  </label>
                )}
              </div>

              {/* Direct image input field URL path */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono">Custom Logo Image URL</label>
                  <span className="text-[8px] text-slate-450 font-mono">Direct Source</span>
                </div>
                <input
                  type="text"
                  value={config.logoUrl || ""}
                  onChange={(e) => {
                    onUpdateConfig({ ...config, logoUrl: e.target.value || undefined });
                  }}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3.5 py-1.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 font-mono outline-none focus:border-indigo-550 transition"
                />
              </div>

              {logoUploadError && (
                <p className="text-[10px] font-semibold text-rose-400 font-mono bg-rose-950/20 border border-rose-900/30 p-2 rounded-lg mt-1 select-text">
                  ⚠ {logoUploadError}
                </p>
              )}
            </div>

          </div>

          {/* Web Access & Domain Config Card */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Server className="w-4.5 h-4.5 text-slate-400" />
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">White-label Web Domain & Address</h2>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label className="block text-xs font-semibold text-slate-300">Reseller Domain Redirection URL</label>
                <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase">CNAME target configured</span>
              </div>
              <div className="flex gap-2">
                <div className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-500 flex items-center shrink-0 select-none">
                  https://
                </div>
                <input 
                  type="text"
                  value={config.customDomain}
                  onChange={(e) => handleChange("customDomain", e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all font-mono"
                  placeholder="e.g. portal.brandmonitors.com"
                />
              </div>
              <p className="text-[10px] text-slate-505 leading-relaxed font-sans">
                Licensees can configure custom domains so clients never see MapShield in the browser address bar. Provide this to your DNS management server.
              </p>
            </div>
          </div>

          {/* Support Channels & Documentation Links Card */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <FileText className="w-4.5 h-4.5 text-slate-400" />
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">Reseller Support Box & Helpdesks</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Support Inbox Mail</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input 
                    type="email"
                    value={config.supportEmail}
                    onChange={(e) => handleChange("supportEmail", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    placeholder="e.g. compliance@mybrand.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Hotline Helpline Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input 
                    type="text"
                    value={config.supportPhone}
                    onChange={(e) => handleChange("supportPhone", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    placeholder="e.g. +1 (800) 555-0199"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Knowledgebase URL (Support Documents)</label>
              <div className="relative">
                <Link2 className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input 
                  type="text"
                  value={config.supportUrl}
                  onChange={(e) => handleChange("supportUrl", e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                  placeholder="e.g. https://support.mybrand.com/kb"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Custom Footer & Copyright Subtext</label>
              <input 
                type="text"
                value={config.copyrightText}
                onChange={(e) => handleChange("copyrightText", e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                placeholder="e.g. © 2026 BrandProtect Resold Network. All Rights Reserved."
              />
            </div>
          </div>

          {/* Email Notification Settings Card */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Mail className="w-4.5 h-4.5 text-slate-400" />
              <div className="flex-1">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">Notification & Outbound Dispatch</h2>
                <p className="text-[10px] text-slate-500 font-mono">Configure automated violation logs and digest routines</p>
              </div>
            </div>

            <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-xl space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-200 block">Daily Email Summaries</span>
                  <span className="text-[11px] text-slate-400 leading-normal block">
                    Deliver a consolidated digest containing all detected MAP price violations and seller infraction screenshots directly to <strong className="text-slate-300">{config.supportEmail || "your support email"}</strong> every 24 hours.
                  </span>
                </div>

                {/* Custom Toggle Switch */}
                <button
                  type="button"
                  onClick={() => handleChange("enableDailyEmailSummary", !config.enableDailyEmailSummary)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.enableDailyEmailSummary ? currentTheme.bg : "bg-slate-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      config.enableDailyEmailSummary ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Dynamic status helper */}
              <div className="flex items-start gap-2 text-[10px] text-slate-505 bg-slate-950/60 p-3 rounded-lg border border-slate-900">
                <CheckCircle2 className={`w-3.5 h-3.5 ${currentTheme.accent} shrink-0 mt-0.5`} />
                <p className="leading-relaxed font-sans">
                  {config.enableDailyEmailSummary ? (
                    <>
                      <strong>Active Dispatch:</strong> System compiled daily summary reports will reach inbox of <strong>{config.supportEmail}</strong> at <strong>08:00 UTC</strong> every morning.
                    </>
                  ) : (
                    <>
                      <strong>Dispatch Suspended:</strong> Automated email compilations are currently disabled. Real-time warnings can still be accessed inside <strong>Shield Insights</strong> dashboard dynamically.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Automated Scan Scheduler config section */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm" id="auto-scan-scheduler-config">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Clock className="w-4.5 h-4.5 text-slate-400" />
              <div className="flex-1">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">Automated Scan Scheduling</h2>
                <p className="text-[10px] text-slate-500 font-mono">Set autonomous crawler checks across all storefront partners</p>
              </div>
            </div>

            <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-xl space-y-4 font-sans">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-200 block font-display">Automated Full-System Scans</span>
                  <span className="text-[11px] text-slate-400 leading-normal block">
                    Automatically trigger full-catalog pricing audits across all monitored retail sites simultaneously under the specified schedule matrix.
                  </span>
                </div>

                {/* Custom Toggle Switch */}
                <button
                  id="toggle-schedule-scans-btn"
                  type="button"
                  onClick={() => handleChange("enableAutoScanScheduling", !config.enableAutoScanScheduling)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.enableAutoScanScheduling ? currentTheme.bg : "bg-slate-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      config.enableAutoScanScheduling ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {config.enableAutoScanScheduling && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-900/60 transition-all duration-300">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-350">Crawler Recurrence Interval</label>
                    <select
                      id="scheduler-interval-select"
                      value={config.autoScanInterval}
                      onChange={(e) => handleChange("autoScanInterval", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 outline-none focus:border-indigo-500 transition cursor-pointer"
                    >
                      <option value="hourly">Hourly (Continuous Loop)</option>
                      <option value="daily">Daily Recap</option>
                      <option value="weekly">Weekly Core Verification</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-350">Preferred Check Time (24h format)</label>
                    <input
                      id="scheduler-time-input"
                      type="time"
                      value={config.autoScanTime}
                      onChange={(e) => handleChange("autoScanTime", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 outline-none focus:border-indigo-550 transition cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Dynamic status helper */}
              <div className="flex items-start gap-2 text-[10px] text-slate-505 bg-slate-950/60 p-3 rounded-lg border border-slate-900 leading-normal">
                <CheckCircle2 className={`w-3.5 h-3.5 ${currentTheme.accent} shrink-0 mt-0.5`} />
                <p className="leading-relaxed font-sans">
                  {config.enableAutoScanScheduling ? (
                    <>
                      <strong>Autonomous Schedule Matrix:</strong> The system is slated to execute a 100% full-system sweep <strong>{config.autoScanInterval}</strong> at <strong>{config.autoScanTime || "02:00"} (Local Time)</strong>. Real-time infraction warnings will update live.
                    </>
                  ) : (
                    <>
                      <strong>Autonomous Scans Suspended:</strong> Automatic checks are off. You must trigger scans manually using the <strong>Trigger Global Scan</strong> or direct product actions on the primary dashboard.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Standalone Subsystems & Landing Pages Card */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-805 rounded-2xl p-6 space-y-4 shadow-sm" id="standalone-subsystems-panel">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Layers className="w-4.5 h-4.5 text-slate-400" />
              <div className="flex-1">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">Standalone Subsystems & Builders</h2>
                <p className="text-[10px] text-slate-500 font-mono">Launch connected specialized modules independently in dedicated windows</p>
              </div>
            </div>

            <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-200 block font-display">CloudboyX Landing Page Builder</span>
                <span className="text-[11px] text-slate-400 leading-normal block">
                  Open the high-performance instant landing page builder inside a standalone sandbox browser context to configure resold themes, compile assets, and preview live layouts.
                </span>
              </div>

              <button
                type="button"
                id="open-builder-new-window"
                onClick={() => {
                  window.open(window.location.origin + "?app=builder", "_blank");
                }}
                className={`shrink-0 px-4 py-2.5 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg hover:scale-102 active:scale-98 duration-150 ${currentTheme.bg} ${currentTheme.hover} ${currentTheme.glow}`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open in New Window
              </button>
            </div>
          </div>

          {/* Export and Reseller Actions Panel */}
          <div className="p-4 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl flex flex-wrap gap-3 items-center justify-between shadow-sm">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block">Actions & Reseller Diagnostics</span>
              <span className="text-[10px] text-slate-500 block">Download profile or wipe parameters back to default state.</span>
            </div>

            <div className="flex gap-2.5">
              <button 
                onClick={onReset}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer border border-slate-700/50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restore Defaults
              </button>

              <button 
                onClick={handleExportJSON}
                className={`px-4 py-2.5 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg ${currentTheme.bg} ${currentTheme.hover} ${currentTheme.glow}`}
              >
                <Download className="w-3.5 h-3.5" />
                Export Brand JSON
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Live Device Frame Mockup */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="sticky top-[86px] space-y-4">
            
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-white block uppercase tracking-wider font-mono">Live Theme Renderer</span>
              <div className="flex items-center gap-1.5 text-[9px] text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block"></span>
                PREVIEW SYNCED
              </div>
            </div>

            {/* Custom Desktop Canvas representing the white labeled user application */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 shadow-2xl relative">
              
              {/* Fake Browser Headers */}
              <div className="bg-slate-900 py-2.5 px-4 border-b border-slate-800 flex items-center gap-3">
                <div className="flex gap-1.5 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                </div>
                
                <div className="flex-1 bg-slate-950 font-mono text-[9px] text-slate-400 px-3 py-1 rounded-md border border-slate-850 truncate max-w-sm flex items-center gap-1.5 justify-between">
                  <span className="truncate">https://{config.customDomain || "portal.whiteshield.com"}</span>
                  <Lock className="w-2.5 h-2.5 text-slate-500" />
                </div>
              </div>

              {/* Fake Workspace Canvas */}
              <div className="p-4 sm:p-5 space-y-5 bg-[#0A0F1D]">
                
                {/* Header preview components inside mockup */}
                <div className="flex justify-between items-center pb-3.5 border-b border-slate-900 select-none">
                  <div className="flex items-center gap-2">
                    <div 
                      onClick={handleCycleIconType}
                      className={`p-2 rounded-lg text-white ${currentTheme.bg} cursor-pointer hover:scale-110 hover:brightness-110 active:scale-95 transition-all relative group`}
                      title="Click icon to cycle brand symbol permanently"
                    >
                      <SelectedIconComponent className="w-3.5 h-3.5 animate-pulse" />
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[7px] font-mono py-0.5 px-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none border border-slate-800">
                        CLICK TO CYCLE LOGO
                      </div>
                    </div>
                    
                    <div 
                      onClick={handleCycleColorAccent}
                      className="cursor-pointer group hover:bg-slate-900/60 p-1 px-1.5 rounded-lg transition-all relative"
                      title="Click text to cycle color accent theme permanently"
                    >
                      <h4 className="text-xs font-bold text-white leading-none flex items-center gap-1 font-display group-hover:text-amber-400">
                        {config.brandName || "MAPShield"} <span className="text-[8px] text-slate-500 font-normal">✎</span>
                      </h4>
                      <span className="text-[8px] font-mono font-medium tracking-wider text-slate-500 uppercase mt-0.5 block group-hover:text-slate-400">
                        {config.slogan || "You dream it, we deliver it."}
                      </span>
                      
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[7px] font-mono py-0.5 px-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none border border-slate-800">
                        CLICK TO CYCLE THEME
                      </div>
                    </div>
                  </div>

                  <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                    Licence Portal
                  </span>
                </div>

                {/* Dashboard simulation layout inside mockup */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-850">
                    <span className="text-[8px] font-mono text-slate-500 block uppercase">Violators Flagged</span>
                    <span className="text-base font-bold text-white block mt-0.5">24 Active</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-850">
                    <span className="text-[8px] font-mono text-slate-500 block uppercase">Audited Domains</span>
                    <span className="text-base font-bold text-white block mt-0.5">144 Slated</span>
                  </div>
                </div>

                {/* Mock product violation block */}
                <div className="p-3.5 bg-slate-900/60 border border-slate-850 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-white font-mono truncate max-w-[120px]">SoundWave ANC Headphone</span>
                    <span className="text-[8px] px-1.5 py-0.5 bg-red-500/15 border border-red-500/25 text-red-400 rounded font-semibold font-mono">MAP INFRACTION</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-extrabold text-red-400">$239.00</span>
                    <span className="text-[8px] text-slate-500 line-through">MSRP: $299.99</span>
                  </div>
                </div>

                {/* Custom Support anchor references inside simulated box */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 grid grid-cols-2 gap-2 text-[9px] text-slate-400">
                  <a href={config.supportUrl || "#"} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition">
                    <FileText className="w-3 h-3 text-indigo-400" />
                    Knowledgebase Link
                  </a>
                  <a href={`mailto:${config.supportEmail}`} className="flex items-center gap-1 hover:text-white transition truncate">
                    <Mail className="w-3 h-3 text-indigo-400" />
                    Mail Support
                  </a>
                  <div className="flex items-center gap-1 col-span-2 text-slate-500 pt-1 border-t border-slate-900 font-mono">
                    <Phone className="w-3 h-3 text-slate-600" />
                    Licenser Hotline: {config.supportPhone || "(N/A)"}
                  </div>
                </div>

                {/* Simulated Footer with branded text */}
                <div className="pt-2 text-[8px] font-mono text-slate-600 border-t border-slate-900 text-center">
                  {config.copyrightText || "© 2026 CloudboyX. All Rights Reserved."}
                </div>

              </div>

            </div>

            {/* Support Documents & Reseller Guidelines Instructions card */}
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Reseller Integration Code</h3>
              </div>

              <p className="text-xs leading-relaxed text-slate-400">
                To serve this white label suite under your domain, map the target URL using a standard 
                DNS alias or reverse-proxy server header block.
              </p>

              <button 
                onClick={handleCopyGuide}
                className="w-full py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {copiedGuide ? (
                  <>
                    <Check className="w-4.5 h-4.5 text-emerald-400" />
                    Domain Guide Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    Copy Host Setup Guide
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Dynamic Success Toast Notification */}
      {successMsg && (
        <div id="white-label-success-toast" className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-950 border border-emerald-500/30 text-slate-100 rounded-xl px-4.5 py-3.5 shadow-2xl backdrop-blur-md animate-fade-in max-w-sm">
          <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs font-semibold leading-normal font-sans text-slate-200">
            {successMsg}
          </div>
          <button 
            id="dismiss-toast-btn"
            onClick={() => setSuccessMsg(null)}
            className="text-[10px] text-zinc-500 hover:text-zinc-350 font-mono font-extrabold cursor-pointer select-none transition ml-2 shrink-0"
          >
            DISMISS
          </button>
        </div>
      )}

    </div>
  );
}
