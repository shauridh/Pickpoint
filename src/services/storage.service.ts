import {
  User,
  Package,
  Customer,
  Location,
  AppSettings,
} from '@/types';

const STORAGE_KEYS = {
  USERS: 'pickpoint_users',
  PACKAGES: 'pickpoint_packages',
  CUSTOMERS: 'pickpoint_customers',
  LOCATIONS: 'pickpoint_locations',
  SETTINGS: 'pickpoint_settings',
  CURRENT_USER: 'pickpoint_current_user',
} as const;

// Generic storage functions
function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from storage:`, error);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
  }
}

// Users
export const getUsers = (): User[] => {
  return getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
};

export const saveUsers = (users: User[]): void => {
  saveToStorage(STORAGE_KEYS.USERS, users);
};

export const addUser = (userData: Omit<User, 'id' | 'createdAt'>): void => {
  const users = getUsers();
  const newUser: User = {
    ...userData,
    id: Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
};

export const updateUser = (updatedUser: User): void => {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === updatedUser.id);
  if (index !== -1) {
    users[index] = updatedUser;
    saveUsers(users);
  }
};

export const deleteUser = (id: string): void => {
  const users = getUsers().filter((u) => u.id !== id);
  saveUsers(users);
};

// Packages
export const getPackages = (): Package[] => {
  return getFromStorage<Package[]>(STORAGE_KEYS.PACKAGES, []);
};

export const savePackages = (packages: Package[]): void => {
  saveToStorage(STORAGE_KEYS.PACKAGES, packages);
};

export const addPackage = (pkg: Package): void => {
  const packages = getPackages();
  packages.push(pkg);
  savePackages(packages);
};

export const updatePackage = (id: string, updates: Partial<Package>): void => {
  const packages = getPackages();
  const index = packages.findIndex((p) => p.id === id);
  if (index !== -1) {
    packages[index] = { ...packages[index], ...updates };
    savePackages(packages);
  }
};

export const deletePackage = (id: string): void => {
  const packages = getPackages().filter((p) => p.id !== id);
  savePackages(packages);
};

export const bulkUpdatePackages = (ids: string[], updates: Partial<Package>): void => {
  const packages = getPackages();
  const updatedPackages = packages.map((pkg) =>
    ids.includes(pkg.id) ? { ...pkg, ...updates } : pkg
  );
  savePackages(updatedPackages);
};

// Customers
export const getCustomers = (): Customer[] => {
  return getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
};

export const saveCustomers = (customers: Customer[]): void => {
  saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
};

export const addCustomer = (customer: Customer): void => {
  const customers = getCustomers();
  customers.push(customer);
  saveCustomers(customers);
};

export const updateCustomer = (id: string, updates: Partial<Customer>): void => {
  const customers = getCustomers();
  const index = customers.findIndex((c) => c.id === id);
  if (index !== -1) {
    customers[index] = { ...customers[index], ...updates };
    saveCustomers(customers);
  }
};

export const deleteCustomer = (id: string): void => {
  const customers = getCustomers().filter((c) => c.id !== id);
  saveCustomers(customers);
};

// Locations
export const getLocations = (): Location[] => {
  return getFromStorage<Location[]>(STORAGE_KEYS.LOCATIONS, []);
};

export const saveLocations = (locations: Location[]): void => {
  saveToStorage(STORAGE_KEYS.LOCATIONS, locations);
};

export const addLocation = (location: Partial<Location>): void => {
  const locations = getLocations();
  const newLocation: Location = {
    id: Date.now().toString(),
    name: location.name || '',
    address: location.address || '',
    phone: location.phone,
    pricingScheme: location.pricingScheme || 'flat',
    gracePeriod: location.gracePeriod || 0,
    flatDailyPrice: location.flatDailyPrice,
    progressiveEntryPrice: location.progressiveEntryPrice,
    progressiveNextDayPrice: location.progressiveNextDayPrice,
    sizeBasedPrices: location.sizeBasedPrices,
    progressiveItemFirstPrice: location.progressiveItemFirstPrice,
    progressiveItemNextPrice: location.progressiveItemNextPrice,
    deliveryEnabled: location.deliveryEnabled || false,
    deliveryPrice: location.deliveryPrice,
    membershipEnabled: location.membershipEnabled || false,
    membershipPrice: location.membershipPrice,
    fixedPrice: location.fixedPrice,
    memberDiscount: location.memberDiscount || 0,
    isActive: location.isActive !== undefined ? location.isActive : true,
    createdAt: new Date().toISOString(),
  };
  locations.push(newLocation);
  saveLocations(locations);
};

export const updateLocation = (id: string, updates: Partial<Location>): void => {
  const locations = getLocations();
  const index = locations.findIndex((l) => l.id === id);
  if (index !== -1) {
    locations[index] = { ...locations[index], ...updates };
    saveLocations(locations);
  }
};

export const deleteLocation = (id: string): void => {
  const locations = getLocations().filter((l) => l.id !== id);
  saveLocations(locations);
};

// Settings
export const getSettings = (): AppSettings => {
  return getFromStorage<AppSettings>(STORAGE_KEYS.SETTINGS, {
    language: 'id',
    autoGeneratePickupCode: true,
    pickupCodeLength: 6,
    companyName: 'PickPoint',
    whatsapp: {
      enabled: true,
      apiUrl: 'api/wa/send',
      apiKey: 'yBMXcDk5iWz9MdEmyu8eBH2uhcytui',
      sender: '6285777875132',
      method: 'POST',
      provider: 'generic',
      sendArrivalNotification: true,
      sendMembershipNotification: true,
      sendReminderNotification: true,
      reminderDays: 7,
    },
    notificationTemplates: {
      packageArrival: 'Hi {name}, 👋\n\nPaket *{tracking}* sudah dapat diambil di PickPoint {location}!\n\n📦 Kode Pengambilan: *{pickup_code}*\n\nLihat detail lengkap paket Anda:\n{link}\n\n💳 Bayar sekarang untuk proses pengambilan lebih cepat!\n\nTerima kasih telah menggunakan PickPoint. 😊',
      membership: 'Terima kasih {name}! 🎉\n\nSelamat! Anda telah menjadi *Member Premium PickPoint*\n\n✨ Benefit yang Anda dapatkan:\n• Gratis biaya simpan paket\n• Prioritas pengambilan\n• Notifikasi instant\n• Penyimpanan lebih lama\n\n📅 Masa aktif: {start_date} - {end_date}\n⏰ Durasi: {duration} bulan\n\nNikmati kemudahan layanan PickPoint tanpa biaya tambahan!\n\nSalam,\nTim PickPoint 💙',
      membershipReminder: '⏰ Reminder Membership PickPoint\n\nHi {name},\n\nMembership premium Anda akan berakhir dalam *{days_left} hari* ({end_date}).\n\n🔄 Perpanjang sekarang untuk terus menikmati:\n• Gratis biaya simpan paket\n• Prioritas layanan\n• Benefit eksklusif lainnya\n\n📞 Hubungi admin kami untuk perpanjangan atau upgrade paket membership.\n\nJangan sampai ketinggalan benefit premium Anda!\n\nSalam,\nTim PickPoint 💙',
      test: '✅ Test Notifikasi PickPoint\n\nSistem notifikasi WhatsApp berjalan dengan baik!\n\nJika Anda menerima pesan ini, konfigurasi sudah benar dan siap digunakan.\n\n🚀 PickPoint - Solusi Penerimaan Paket Anda'
    }
  });
};

export const saveSettings = (settings: AppSettings): void => {
  saveToStorage(STORAGE_KEYS.SETTINGS, settings);
};

export const updateSettings = (updates: Partial<AppSettings>): void => {
  const settings = getSettings();
  saveSettings({ ...settings, ...updates });
};

// Current User (Auth)
export const getCurrentUser = (): User | null => {
  return getFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
};

export const setCurrentUser = (user: User | null): void => {
  saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
};

// Initialize default data
export const initializeDefaultData = (): void => {
  // Check if data already exists
  if (getUsers().length > 0) return;

  // Create default admin user
  const defaultAdmin: User = {
    id: '1',
    email: 'admin@pickpoint.com',
    password: 'admin123', // In production, this should be hashed
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date().toISOString(),
    isActive: true,
  };

  // Create default staff user
  const defaultStaff: User = {
    id: '2',
    email: 'staff@pickpoint.com',
    password: 'staff123',
    name: 'Staff User',
    role: 'staff',
    createdAt: new Date().toISOString(),
    isActive: true,
  };

  saveUsers([defaultAdmin, defaultStaff]);

  // Create default location
  const defaultLocation: Location = {
    id: '1',
    name: 'Main Office',
    address: 'Jl. Contoh No. 123, Jakarta',
    phone: '081234567890',
    pricingScheme: 'flat',
    gracePeriod: 0,
    flatDailyPrice: 5000,
    memberDiscount: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  saveLocations([defaultLocation]);

  // Initialize settings with default location
  const settings = getSettings();
  saveSettings({ ...settings, defaultLocationId: '1' });
};
