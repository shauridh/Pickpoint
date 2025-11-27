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
  paymentStatus?: 'paid' | 'unpaid';
  paidAt?: string;
}

// Customer Types
export interface Customer {
  id: string;
  name: string;
  phone: string;
  unitNumber: string;
  locationId: string;
  email?: string;
  isPremiumMember: boolean;
  membershipStartDate?: string;
  membershipEndDate?: string;
  createdAt: string;
  notificationEnabled: boolean;
}

// Location Types
export type PricingScheme = 'flat' | 'progressive' | 'flat_size' | 'progressive_item';

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
  gracePeriod?: number; // in hours
  // Flat - per day
  flatDailyPrice?: number;
  // Progressive - entry + next days
  progressiveEntryPrice?: number;
  progressiveNextDayPrice?: number;
  // Flat Size
  sizeBasedPrices?: SizeBasedPrice;
  // Progressive Item - first + next items (cut off 23:59)
  progressiveItemFirstPrice?: number;
  progressiveItemNextPrice?: number;
  // Add-ons
  deliveryEnabled?: boolean;
  deliveryPrice?: number;
  membershipEnabled?: boolean;
  membershipPrice?: number;
  // Legacy
  fixedPrice?: number;
  memberDiscount?: number;
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
  provider?: 'generic' | 'fonnte' | 'watzap';
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
  notificationTemplates?: {
    packageArrival?: string;
    membership?: string;
    membershipReminder?: string;
    test?: string;
  };
}

// Report Types
export interface PackageStats {
  totalArrived: number;
  totalPickedUp: number;
  totalDestroyed: number;
  currentInventory: number;
  todayArrived: number;
  todayPickedUp: number;
  total: number;
}

export interface RevenueStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  delivery: number;
  membership: number;
  package: number;
}

export interface MemberStats {
  total: number;
}

export interface DashboardMetrics {
  packages: PackageStats;
  revenue: RevenueStats;
  members: MemberStats;
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
