export interface Product {
  id: string;
  name: string;
  sku: string;
  mapPrice: number;
  description: string;
  imageUrl?: string;
  mapThresholdPercent?: number; // Custom MAP threshold % (e.g. 85 overrides global default 80%)
  customMapThresholdPercent?: number; // Alias for custom MAP threshold %
}

export interface MapPolicy {
  id: string;
  name: string;
  description: string;
  allowedDiscountPercent: number;
}

export interface PartnerSnoozeRule {
  snoozedUntil: number; // Unix timestamp in ms
  reason?: string; // Reason or memo for snooze (e.g. Promotional campaign, grace period)
  createdAt?: number; // Unix timestamp in ms when snooze was configured
  autoDismissViolations?: boolean; // If true, auto-dismiss and suppress alert popups for this partner
  snoozeHours?: number; // Configured duration in hours
  createdByUser?: string; // User who configured the snooze rule
}

export interface Partner {
  id: string;
  name: string;
  domain: string;
  contactEmail: string;
  contactPerson?: string;
  contactPhone?: string;
  associatedPolicies?: string[]; // MapPolicy IDs
  associatedProducts?: string[]; // Product IDs
  complianceStatus?: 'compliant' | 'violating' | 'pending' | 'warning';
  onboardingDate?: string;
  notes?: string;
  mapThresholdPercent?: number;
  riskSensitivity?: 'critical' | 'high' | 'medium' | 'low';
  snoozeRule?: PartnerSnoozeRule | null;
}

export type ScanStatus = 'compliant' | 'violating' | 'not_found' | 'error';

export interface ScanResultItem {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerDomain: string;
  detectedPrice: number | null;
  detectedUrl: string | null;
  snippet: string | null;
  status: ScanStatus;
}

export interface ScanJob {
  id: string;
  productId: string;
  productName: string;
  mapPrice: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  finishedAt: string | null;
  items: ScanResultItem[];
}

export interface WhiteLabelConfig {
  brandName: string;
  slogan: string;
  iconType: 'cloudboy' | 'shield' | 'lock' | 'eye' | 'globe' | 'sparkles' | 'crown' | 'target';
  logoUrl?: string;
  supportEmail: string;
  supportUrl: string;
  supportPhone: string;
  customDomain: string;
  copyrightText: string;
  accentColor: 'indigo' | 'emerald' | 'rose' | 'amber' | 'blue' | 'violet';
  enableDailyEmailSummary: boolean;
  enableAutoScanScheduling: boolean;
  autoScanInterval: 'hourly' | 'daily' | 'weekly';
  autoScanTime: string;
}

export interface WebsiteProject {
  id: string;
  name: string;
  description: string;
  userId: string;
  blocks: any[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationAlert {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  partnerId: string;
  partnerName: string;
  partnerDomain: string;
  mapPrice: number;
  detectedPrice: number;
  sentAt: string;
  recipientEmail: string;
  recipientType: 'partner' | 'admin';
  subject: string;
  body: string;
  status: 'sent' | 'delivered' | 'failed';
}

export interface MonitoringConfig {
  enabled: boolean;
  intervalMinutes: number;
  lastSweepTime: string | null;
  nextSweepTime: string;
}

export interface AuditLog {
  id: string;
  productId?: string;
  sku?: string;
  type: string;
  message: string;
  timestamp: string;
  details?: string;
  user?: string;
  oldPrice?: number;
  newPrice?: number;
}



