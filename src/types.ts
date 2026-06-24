export interface Link {
  id: number;
  short_code: string;
  original_url: string;
  title?: string;
  created_at: string;
  clicks_count: number;
  expires_at?: string | null;
  password?: string | null;
  enable_preview?: number; // 0 = disabled, 1 = enabled
  is_active?: number;       // 0 = disabled, 1 = enabled
  one_time_use?: number;     // 0 = no, 1 = yes
  category?: string | null;
  tags?: string | null;      // comma-separated tags
  clicks_limit?: number | null;
  custom_description?: string | null;
  custom_image_url?: string | null;
  custom_preview_json?: string | null;
  custom_theme_json?: string | null;
}

export interface Visit {
  id: number;
  link_id: number;
  timestamp: string;
  country: string;
  region: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
  browser: string;
  device: string;
  referrer: string;
  ip_hash?: string;
}

export interface ActivityLog {
  id: number;
  timestamp: string;
  action: string;
  details: string;
  ip: string;
}

export interface AdminUser {
  id: number;
  username: string;
  created_at: string;
  role: string;
}

export interface AnalyticsSummary {
  totalClicks: number;
  totalLinks: number;
  uniqueVisits: number;
  clicksOverTime: { date: string; clicks: number }[];
  topCountries: { country: string; clicks: number }[];
  topRegions: { region: string; clicks: number }[];
  topCities: { city: string; clicks: number }[];
  topBrowsers: { browser: string; clicks: number }[];
  topDevices: { device: string; clicks: number }[];
  topReferrers: { referrer: string; clicks: number }[];
  categoryDistribution: { category: string; count: number }[];
  tagDistribution: { tag: string; count: number }[];
  rawVisits?: Visit[];
}

export interface CustomPreview {
  title?: string;
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  thumbnailUrl?: string;
  siteName?: string;
  platformBadge?: string;
  logoUrl?: string;
  watermark?: string;
  bgImageUrl?: string;
  themeColor?: string;
  templateId?: 'modern' | 'hud' | 'cyberpunk' | 'glassmorphism' | 'minimal';
}

export interface CustomTheme {
  backgroundStyle: 'jarvis' | 'stark' | 'cyberpunk' | 'glassmorphism' | 'minimal' | 'matrix' | 'dark' | 'light';
  hudColor: string;
  accentColor: string;
  borderGlowColor: string;
  cardColor: string;
  gridColor: string;
  particleColor: string;
  fontColor: string;
  buttonColor: string;
  progressBarColor: string;
  glowIntensity: number;
  blur: number;
  transparency: number;
  animationSpeed: number;
  gridOpacity: number;
}

