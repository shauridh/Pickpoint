

export enum UserRole {
  ADMIN = 'Admin',
  PETUGAS = 'Petugas',
}

export enum PackageStatus {
  WAITING_PICKUP = 'Menunggu Pengambilan',
  PICKED_UP = 'Sudah Diambil',
  DELIVERED = 'Terkirim',
}

export enum PaymentStatus {
    UNPAID = 'Belum Lunas',
    PAID = 'Lunas',
}

export enum PickupMode {
  AUTO = 'auto',
  MANUAL = 'manual',
}

export enum PricingScheme {
    FLAT_PER_COLLECT = 'Bayar per Ambil (Flat)',
    PROGRESSIVE_DAILY = 'Harian Progresif',
    MULTI_PACKAGE_DISCOUNT = 'Diskon Multi-Paket',
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  location_id: number;
}

export interface Recipient {
  id: number;
  name: string;
  tower: string;
  unit: string;
  whatsapp: string;
  location_id: number;
  subscription_start_date?: string;
  subscription_end_date?: string;
  subscription_notif_enabled: boolean;
}

export interface Expedition {
  id: number;
  name: string;
}

export interface Location {
  id: number;
  name: string;
  delivery_enabled: boolean;
  delivery_fee?: number;
  pickup_mode: PickupMode;
  pricing_scheme: PricingScheme;
  pricing_config: {
    flat_rate?: number;
    free_days?: number;
    first_day_fee?: number;
    subsequent_day_fee?: number;
    multi_package_first_fee?: number;
    multi_package_subsequent_fee?: number;
  };
  subscription_pricing?: {
    '1': number;
    '3': number;
    '6': number;
    '12': number;
  };
}

export interface SizePricing {
  id: number;
  location_id: number;
  size_label: string;
  price: number;
}

export interface Package {
  id: number;
  awb: string;
  recipient_id: number;
  expedition_id: number;
  size?: string;
  photo_url: string;
  status: PackageStatus;
  created_at: string;
  picked_at?: string;
  location_id: number;
  price: number;
  delivery_fee: number;
  pickup_code: string;
  payment_status: PaymentStatus;
  payment_link: string;
}

export interface Log {
  id: number;
  package_id: number;
  action: string;
  user_id: number;
  timestamp: string;
}