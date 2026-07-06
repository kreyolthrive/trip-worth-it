export type LocalDiscoveryEventType = "scan" | "business_click" | "category_tap";
export type LocalDiscoveryLeadStatus = "new" | "contacted" | "closed";
export type LocalDiscoveryConversionStatus = "pending" | "approved" | "rejected";
export type LocalDiscoveryStorageMode = "supabase" | "json_file" | "demo";

export interface LocalDiscoveryEvent {
  id?: string;
  event_type: LocalDiscoveryEventType;
  driver_slug?: string;
  city: "miami";
  page_path: string;
  visitor_session_id: string;
  user_agent?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  category?: string;
  business_name?: string;
  click_target_href?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface LocalDiscoveryLead {
  id?: string;
  lead_status: LocalDiscoveryLeadStatus;
  conversion_status: LocalDiscoveryConversionStatus;
  driver_slug?: string;
  business_name: string;
  category: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  message?: string;
  city: "miami";
  visitor_session_id?: string;
  conversion_value?: number;
  estimated_payout?: number;
  approved_payout?: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

export interface DriverPerformanceSummary {
  driver_slug: string;
  scans: number;
  business_clicks: number;
  category_taps: number;
  leads: number;
  pending_conversions: number;
  approved_conversions: number;
  conversion_value: number;
  estimated_payout: number;
  approved_payout: number;
}

export interface LocalDiscoverySnapshot {
  events: LocalDiscoveryEvent[];
  leads: LocalDiscoveryLead[];
  storageMode: LocalDiscoveryStorageMode;
  storageMessage: string;
}
