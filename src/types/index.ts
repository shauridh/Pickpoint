// User Types
export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  locationId?: string; // For staff assignment
  createdAt: string;
  isActive: boolean;
}

// Package Types
export type PackageStatus = 'arrived' | 'picked_up' | 'destroyed';
export type PackageSize = 'small' | 'medium' | 'large' | 'extra_large';

export interface Package {
  id: string;
  trackingNumber: string;
  pickupCode: string;
  customerId: string;
  locationId: string;
  courierName?: string;
  size: PackageSize;
  photoUrl?: string;
  status: PackageStatus;
  arrivedAt: string;
  pickedUpAt?: string;
  destroyedAt?: string;
  notes?: string;
  createdBy: string;
  price?: number;
}

// Customer Types
export interface Customer {
  id: string;
  name: string;
  phone: string;
  unitNumber: string;
  email?: string;
  isPremiumMember: boolean;
  membershipStartDate?: string;
  membershipEndDate?: string;
  createdAt: string;
  notificationEnabled: boolean;
}

// Location Types
export type PricingScheme = 'fixed' | 'progressive' | 'size_based';

export interface PricingTier {
  days: number;
  price: number;
}

export interface SizeBasedPrice {
  small: number;
  medium: number;
  large: number;
  extra_large: number;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  phone?: string;
  pricingScheme: PricingScheme;
  fixedPrice?: number;
  progressiveTiers?: PricingTier[];
  sizeBasedPrices?: SizeBasedPrice;
  memberDiscount?: number; // Percentage
  isActive: boolean;
  createdAt: string;
}

// Settings Types
export interface WhatsAppSettings {
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
  sender?: string;
  method?: 'POST' | 'GET';
  sendArrivalNotification: boolean;
  sendMembershipNotification: boolean;
  sendReminderNotification: boolean;
  reminderDays: number;
}

export interface AppSettings {
  language: 'en' | 'id';
  defaultLocationId?: string;
  whatsapp: WhatsAppSettings;
  autoGeneratePickupCode: boolean;
  pickupCodeLength: number;
  companyName: string;
  companyLogo?: string;
}

// Report Types
export interface PackageStats {
  totalArrived: number;
  totalPickedUp: number;
  totalDestroyed: number;
  currentInventory: number;
  todayArrived: number;
  todayPickedUp: number;
}

export interface RevenueStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
}

export interface DashboardMetrics {
  packages: PackageStats;
  revenue: RevenueStats;
  activeMembers: number;
  totalCustomers: number;
}

// Report Filters
export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  locationId?: string;
  status?: PackageStatus;
}

export interface PackageReport {
  date: string;
  arrived: number;
  pickedUp: number;
  destroyed: number;
  revenue: number;
}
