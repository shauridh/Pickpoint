// Fix: Remove non-existent 'PricingMode' from imports.
import { User, Recipient, Expedition, Location, SizePricing, Package, UserRole, PackageStatus, PickupMode, PricingScheme, PaymentStatus } from '../types';
import { calculatePrice } from '../utils/priceCalculator';

// Fix: Define the WaSettings interface to resolve type errors on waSettings object.
interface WaSettings {
    apiUrl: string;
    apiKey: string;
    senderNumber: string;
    regularTemplate: string;
    subscriptionActivationTemplate: string;
    subscriptionReminderTemplate: string;
}

const generatePickupCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'PKP-';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// --- MOCK DATA ---
export const mockUsers: User[] = [
  { id: 1, name: 'Ridho Admin', email: 'admin@pickpoint.com', role: UserRole.ADMIN, location_id: 1 },
  { id: 2, name: 'Budi Petugas', email: 'petugas@pickpoint.com', role: UserRole.PETUGAS, location_id: 1 },
  { id: 3, name: 'Siti Petugas', email: 'siti@pickpoint.com', role: UserRole.PETUGAS, location_id: 2 },
];

const mockRecipients: Recipient[] = [
  { id: 1, name: 'Andi Wijaya', tower: 'A', unit: '101', whatsapp: '081234567890', location_id: 1, subscription_start_date: new Date(Date.now() - 15 * 24*60*60*1000).toISOString(), subscription_end_date: new Date(Date.now() + 15 * 24*60*60*1000).toISOString(), subscription_notif_enabled: true },
  { id: 2, name: 'Citra Lestari', tower: 'B', unit: '202', whatsapp: '081234567891', location_id: 2, subscription_start_date: undefined, subscription_end_date: undefined, subscription_notif_enabled: false },
  { id: 3, name: 'Dewi Sartika', tower: 'C', unit: '303', whatsapp: '081234567892', location_id: 1, subscription_start_date: new Date(Date.now() - 45 * 24*60*60*1000).toISOString(), subscription_end_date: new Date(Date.now() - 15 * 24*60*60*1000).toISOString(), subscription_notif_enabled: false },
];

const mockExpeditions: Expedition[] = [
  { id: 1, name: 'JNE' },
  { id: 2, name: 'J&T' },
  { id: 3, name: 'SiCepat' },
  { id: 4, name: 'Anteraja' },
];

const mockLocations: Location[] = [
  { 
    id: 1, 
    name: 'Apartemen Jakarta Pusat', 
    delivery_enabled: true, 
    delivery_fee: 5000,
    pickup_mode: PickupMode.AUTO,
    pricing_scheme: PricingScheme.FLAT_PER_COLLECT,
    pricing_config: {
        flat_rate: 2000,
        free_days: 1
    },
    subscription_pricing: {
        '1': 50000,
        '3': 135000,
        '6': 250000,
        '12': 450000,
    }
  },
  { 
    id: 2, 
    name: 'Gudang Bandung', 
    delivery_enabled: false, 
    pickup_mode: PickupMode.MANUAL,
    pricing_scheme: PricingScheme.PROGRESSIVE_DAILY,
    pricing_config: {
        first_day_fee: 3000,
        subsequent_day_fee: 1500
    },
     subscription_pricing: {
        '1': 40000,
        '3': 110000,
        '6': 200000,
        '12': 380000,
    }
  },
  { 
    id: 3, 
    name: 'Toko Surabaya', 
    delivery_enabled: false, 
    pickup_mode: PickupMode.AUTO,
    pricing_scheme: PricingScheme.MULTI_PACKAGE_DISCOUNT,
    pricing_config: {
        multi_package_first_fee: 1000,
        multi_package_subsequent_fee: 500
    }
  },
];

const mockSizePricing: SizePricing[] = [
    { id: 1, location_id: 2, size_label: 'Small', price: 3000 },
    { id: 2, location_id: 2, size_label: 'Medium', price: 5000 },
    { id: 3, location_id: 2, size_label: 'Large', price: 8000 },
];

const mockPackages: Package[] = [
  { id: 1, awb: 'PKT001', recipient_id: 1, expedition_id: 1, status: PackageStatus.WAITING_PICKUP, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), location_id: 1, photo_url: 'https://picsum.photos/seed/pkt001/300/200', price: 0, delivery_fee: 0, pickup_code: 'PKP-ABC123', payment_status: PaymentStatus.UNPAID, payment_link: 'https://pick.point/pay/PKP-ABC123' },
  { id: 2, awb: 'PKT002', recipient_id: 2, expedition_id: 2, size: 'Small', status: PackageStatus.WAITING_PICKUP, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), location_id: 2, photo_url: 'https://picsum.photos/seed/pkt002/300/200', price: 0, delivery_fee: 0, pickup_code: 'PKP-DEF456', payment_status: PaymentStatus.PAID, payment_link: 'https://pick.point/pay/PKP-DEF456' },
  { id: 3, awb: 'PKT003', recipient_id: 1, expedition_id: 3, status: PackageStatus.PICKED_UP, created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), picked_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), location_id: 1, photo_url: 'https://picsum.photos/seed/pkt003/300/200', price: 2000, delivery_fee: 5000, pickup_code: 'PKP-GHI789', payment_status: PaymentStatus.PAID, payment_link: 'https://pick.point/pay/PKP-GHI789' },
  { id: 4, awb: 'PKT004', recipient_id: 2, expedition_id: 1, status: PackageStatus.PICKED_UP, created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), picked_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), location_id: 2, photo_url: 'https://picsum.photos/seed/pkt004/300/200', price: 4500, delivery_fee: 0, pickup_code: 'PKP-JKL012', payment_status: PaymentStatus.PAID, payment_link: 'https://pick.point/pay/PKP-JKL012' },
  { id: 5, awb: 'PKT005', recipient_id: 1, expedition_id: 2, status: PackageStatus.WAITING_PICKUP, created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), location_id: 1, photo_url: 'https://picsum.photos/seed/pkt005/300/200', price: 0, delivery_fee: 0, pickup_code: 'PKP-MNO345', payment_status: PaymentStatus.UNPAID, payment_link: 'https://pick.point/pay/PKP-MNO345' },
  { id: 6, awb: 'PKT006', recipient_id: 2, expedition_id: 4, status: PackageStatus.WAITING_PICKUP, created_at: new Date().toISOString(), location_id: 1, photo_url: 'https://picsum.photos/seed/pkt006/300/200', price: 0, delivery_fee: 0, pickup_code: 'PKP-PQR678', payment_status: PaymentStatus.UNPAID, payment_link: 'https://pick.point/pay/PKP-PQR678' },
];

// --- API FUNCTIONS ---
const getFromStorage = <T,>(key: string, defaultValue: T): T => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
};

const saveToStorage = <T,>(key: string, value: T) => {
    localStorage.setItem(key, JSON.stringify(value));
};

// Initialize storage if empty
if (!localStorage.getItem('packages')) {
    saveToStorage('packages', mockPackages);
}
if (!localStorage.getItem('recipients')) {
    saveToStorage('recipients', mockRecipients);
}
if (!localStorage.getItem('users')) {
    saveToStorage('users', mockUsers);
}
if (!localStorage.getItem('locations')) {
    saveToStorage('locations', mockLocations);
}

type AddPackagePayload = Omit<Package, 'id' | 'created_at' | 'status' | 'photo_url' | 'price' | 'delivery_fee' | 'pickup_code' | 'payment_status' | 'payment_link'> & { isDelivery: boolean };

class MockApiService {
    packages = getFromStorage('packages', mockPackages);
    recipients = getFromStorage('recipients', mockRecipients);
    users = getFromStorage('users', mockUsers);
    locations = getFromStorage('locations', mockLocations);
    expeditions = mockExpeditions;
    sizePricing = mockSizePricing;
    
    private delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async getDashboardData(period: 'today' | 'this_week' | 'this_month' = 'today', location_id?: number) {
        await this.delay(500);

        const locationPackages = this.packages.filter(p => !location_id || p.location_id === location_id);

        const now = new Date();
        let startDate: Date;

        switch (period) {
            case 'this_week':
                const firstDayOfWeek = now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1); // Monday is 1, Sunday is 0
                startDate = new Date(now.setDate(firstDayOfWeek));
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'this_month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'today':
            default:
                startDate = new Date();
                startDate.setHours(0, 0, 0, 0);
                break;
        }

        const endDate = new Date(); // now
        endDate.setHours(23, 59, 59, 999);

        const paketMasuk = locationPackages.filter(p => {
            const createdAt = new Date(p.created_at);
            return createdAt >= startDate && createdAt <= endDate;
        }).length;

        const pickedInPeriod = locationPackages.filter(p => {
            if (!p.picked_at) return false;
            const pickedAt = new Date(p.picked_at);
            return pickedAt >= startDate && pickedAt <= endDate;
        });

        const paketDiambil = pickedInPeriod.length;

        const revenue = pickedInPeriod.reduce((sum, p) => sum + p.price + p.delivery_fee, 0);

        const paketMenunggu = locationPackages.filter(p => p.status === PackageStatus.WAITING_PICKUP).length;

        return { paketMasuk, paketDiambil, paketMenunggu, revenue };
    }
    
    async getReportData(filters: { startDate: string, endDate: string, locationId?: number }) {
        await this.delay(800);
        
        const { startDate, endDate, locationId } = filters;
        const start = new Date(startDate);
        start.setHours(0,0,0,0);
        const end = new Date(endDate);
        end.setHours(23,59,59,999);


        const filteredPackages = this.packages.filter(p => {
            const createdAt = new Date(p.created_at);
            const isInDateRange = createdAt >= start && createdAt <= end;
            const isInLocation = !locationId || p.location_id === locationId;
            return isInDateRange && isInLocation;
        });

        const totalRevenue = filteredPackages.reduce((sum, p) => sum + p.price + p.delivery_fee, 0);
        const totalPackages = filteredPackages.length;
        const packagesPickedUp = filteredPackages.filter(p => p.status === PackageStatus.PICKED_UP).length;

        let totalPickupTime = 0;
        let pickedUpCount = 0;
        filteredPackages.forEach(p => {
            if (p.picked_at) {
                const created = new Date(p.created_at).getTime();
                const picked = new Date(p.picked_at).getTime();
                totalPickupTime += (picked - created);
                pickedUpCount++;
            }
        });
        const averagePickupTime = pickedUpCount > 0 ? (totalPickupTime / pickedUpCount) / (1000 * 60 * 60) : 0; // in hours

        const expeditionDistribution = this.expeditions.map(exp => ({
            name: exp.name,
            value: filteredPackages.filter(p => p.expedition_id === exp.id).length,
        })).filter(e => e.value > 0);

        const locationDistribution = this.locations.map(loc => ({
            name: loc.name,
            value: filteredPackages.filter(p => p.location_id === loc.id).length,
        })).filter(l => l.value > 0);
        
        const dailyTrend: { date: string, Masuk: number, Diambil: number }[] = [];
        const dateMap = new Map<string, { Masuk: number, Diambil: number }>();

        for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            dateMap.set(dateStr, { Masuk: 0, Diambil: 0 });
        }

        filteredPackages.forEach(p => {
            const createdDateStr = p.created_at.split('T')[0];
            if (dateMap.has(createdDateStr)) {
                dateMap.get(createdDateStr)!.Masuk++;
            }
            if (p.picked_at) {
                 const pickedDateStr = p.picked_at.split('T')[0];
                 if (dateMap.has(pickedDateStr)) {
                    dateMap.get(pickedDateStr)!.Diambil++;
                }
            }
        });

        dateMap.forEach((value, key) => {
            // Fix: Correct typo 'toLocaleDateDateString' to 'toLocaleDateString'.
            dailyTrend.push({ date: new Date(key).toLocaleDateString('id-ID', { month: 'short', day: 'numeric'}), ...value });
        });


        return {
            totalRevenue,
            totalPackages,
            packagesPickedUp,
            averagePickupTime, // in hours
            expeditionDistribution,
            locationDistribution,
            dailyTrend,
        };
    }

    async getPackages(filters: { status?: string, location_id?: number }) {
        await this.delay(500);
        return this.packages.filter(p => 
            (!filters.status || p.status === filters.status) &&
            (!filters.location_id || p.location_id === filters.location_id)
        ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    async getPackageByCode(code: string) {
        await this.delay(300);
        const lowercasedCode = code.toLowerCase();
        const pkg = this.packages.find(p => 
            p.awb.toLowerCase() === lowercasedCode || 
            p.pickup_code.toLowerCase() === lowercasedCode
        );
        if (!pkg) throw new Error("Paket tidak ditemukan");
        return pkg;
    }

    async sendPackageArrivalNotification(pkg: Package) {
        // Fix: Use Partial<WaSettings> to correctly type waSettings and avoid property access errors.
        const waSettings = getFromStorage<Partial<WaSettings>>('waSettings', {});
    
        if (!waSettings.apiUrl || !waSettings.apiKey || !waSettings.senderNumber || !waSettings.regularTemplate) {
            console.log("Konfigurasi WhatsApp Gateway (Regular) belum lengkap. Notifikasi tidak dikirim.");
            return;
        }
    
        const recipient = this.recipients.find(r => r.id === pkg.recipient_id);
        const expedition = this.expeditions.find(e => e.id === pkg.expedition_id);
        const location = this.locations.find(l => l.id === pkg.location_id);
    
        if (!recipient) {
            console.log(`Penerima dengan ID ${pkg.recipient_id} tidak ditemukan. Notifikasi WA dibatalkan.`);
            return;
        }

        let message = waSettings.regularTemplate;
        message = message.replace('{namaPenerima}', recipient.name)
                         .replace('{awb}', pkg.awb)
                         .replace('{ekspedisi}', expedition?.name || 'Pengirim')
                         .replace('{lokasi}', location?.name || 'lokasi Anda')
                         .replace('{paymentLink}', pkg.payment_link);
    
        const payload = {
            api_key: waSettings.apiKey,
            sender: waSettings.senderNumber,
            number: recipient.whatsapp,
            message: message,
        };
    
        console.log('--- SIMULASI NOTIFIKASI PAKET MASUK ---');
        console.log('Payload:', JSON.stringify(payload, null, 2));
        console.log('------------------------------------');
    }

     async sendSubscriptionActivationNotification(recipient: Recipient) {
        // Fix: Use Partial<WaSettings> to correctly type waSettings and avoid property access errors.
        const waSettings = getFromStorage<Partial<WaSettings>>('waSettings', {});
    
        if (!waSettings.apiUrl || !waSettings.apiKey || !waSettings.senderNumber || !waSettings.subscriptionActivationTemplate) {
            console.log("Konfigurasi WhatsApp Gateway (Aktivasi Langganan) belum lengkap. Notifikasi tidak dikirim.");
            return;
        }
    
        if (!recipient.subscription_start_date || !recipient.subscription_end_date) {
            console.log("Data langganan tidak lengkap untuk notifikasi.");
            return;
        }

        let message = waSettings.subscriptionActivationTemplate;
        message = message.replace('{namaPenerima}', recipient.name)
                         .replace('{tanggalMulai}', new Date(recipient.subscription_start_date).toLocaleDateString('id-ID'))
                         .replace('{tanggalBerakhir}', new Date(recipient.subscription_end_date).toLocaleDateString('id-ID'));
    
        const payload = {
            api_key: waSettings.apiKey,
            sender: waSettings.senderNumber,
            number: recipient.whatsapp,
            message: message,
        };
    
        console.log('--- SIMULASI NOTIFIKASI AKTIVASI LANGGANAN ---');
        console.log('Payload:', JSON.stringify(payload, null, 2));
        console.log('-------------------------------------------');
    }

    // In a real app, this would be triggered by a cron job
    async sendSubscriptionReminderNotification(recipient: Recipient) {
        // Fix: Use Partial<WaSettings> to correctly type waSettings and avoid property access errors.
        const waSettings = getFromStorage<Partial<WaSettings>>('waSettings', {});
    
        if (!waSettings.apiUrl || !waSettings.apiKey || !waSettings.senderNumber || !waSettings.subscriptionReminderTemplate) {
            console.log("Konfigurasi WhatsApp Gateway (Pengingat Langganan) belum lengkap. Notifikasi tidak dikirim.");
            return;
        }

        const endDate = new Date(recipient.subscription_end_date!);
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let message = waSettings.subscriptionReminderTemplate;
        message = message.replace('{namaPenerima}', recipient.name)
                         .replace('{tanggalBerakhir}', endDate.toLocaleDateString('id-ID'))
                         .replace('{sisaHari}', String(diffDays))
                         .replace('{linkPerpanjang}', `https://pick.point/subscribe/${recipient.id}`); // Simulated link
    
        const payload = {
            api_key: waSettings.apiKey,
            sender: waSettings.senderNumber,
            number: recipient.whatsapp,
            message: message,
        };
    
        console.log('--- SIMULASI NOTIFIKASI PENGINGAT LANGGANAN ---');
        console.log('Payload:', JSON.stringify(payload, null, 2));
        console.log('---------------------------------------------');
    }

    async addPackage(newPackageData: AddPackagePayload) {
        await this.delay(700);
        if (this.packages.some(p => p.awb.toLowerCase() === newPackageData.awb.toLowerCase())) {
            throw new Error("AWB already exists.");
        }

        const location = this.locations.find(l => l.id === newPackageData.location_id);
        let deliveryFee = 0;
        if (newPackageData.isDelivery && location?.delivery_enabled && location.delivery_fee) {
            deliveryFee = location.delivery_fee;
        }

        const { isDelivery, ...restOfData } = newPackageData;
        const pickupCode = generatePickupCode();

        const newPackage: Package = {
            ...restOfData,
            id: this.packages.length > 0 ? Math.max(...this.packages.map(p => p.id)) + 1 : 1,
            created_at: new Date().toISOString(),
            status: PackageStatus.WAITING_PICKUP,
            photo_url: `https://picsum.photos/seed/${newPackageData.awb}/300/200`,
            price: 0, // Price is calculated on pickup
            delivery_fee: deliveryFee,
            pickup_code: pickupCode,
            payment_status: PaymentStatus.UNPAID,
            payment_link: `https://pick.point/pay/${pickupCode}`, // Simulated payment link
        };
        this.packages.push(newPackage);
        saveToStorage('packages', this.packages);
        
        await this.sendPackageArrivalNotification(newPackage);

        return newPackage;
    }

    async markAsPaid(pickup_code: string) {
        await this.delay(400);
        const pkgIndex = this.packages.findIndex(p => p.pickup_code.toLowerCase() === pickup_code.toLowerCase());
        if (pkgIndex === -1) throw new Error("Package not found");

        this.packages[pkgIndex].payment_status = PaymentStatus.PAID;
        saveToStorage('packages', this.packages);
        return this.packages[pkgIndex];
    }


    async pickupPackage(pickup_code: string) {
        await this.delay(500);
        const pkgIndex = this.packages.findIndex(p => p.pickup_code.toLowerCase() === pickup_code.toLowerCase());
        if (pkgIndex === -1) throw new Error("Package not found with this pickup code");
        
        const pkg = this.packages[pkgIndex];
        if(pkg.status !== PackageStatus.WAITING_PICKUP) throw new Error("Paket sudah diambil sebelumnya.");
        if(pkg.payment_status !== PaymentStatus.PAID) throw new Error("Paket belum lunas. Harap selesaikan pembayaran terlebih dahulu.");

        const location = this.locations.find(l => l.id === pkg.location_id);
        if (!location) throw new Error("Location configuration for this package not found.");
        
        const recipient = this.recipients.find(r => r.id === pkg.recipient_id);
        if (!recipient) throw new Error("Recipient for this package not found.");

        const finalPrice = calculatePrice(pkg, this.packages, location, recipient);

        this.packages[pkgIndex] = {
            ...pkg,
            status: PackageStatus.PICKED_UP,
            picked_at: new Date().toISOString(),
            price: finalPrice,
        };
        saveToStorage('packages', this.packages);
        return this.packages[pkgIndex];
    }
    
    async getRecipients() {
        await this.delay(200);
        return this.recipients;
    }

    async addRecipient(data: Omit<Recipient, 'id' | 'subscription_start_date' | 'subscription_end_date' | 'subscription_notif_enabled'>) {
        await this.delay(400);
        const newRecipient: Recipient = {
            ...data,
            id: this.recipients.length > 0 ? Math.max(...this.recipients.map(r => r.id)) + 1 : 1,
            subscription_notif_enabled: false,
        };
        this.recipients.push(newRecipient);
        saveToStorage('recipients', this.recipients);
        return newRecipient;
    }

    async updateRecipient(id: number, data: Omit<Recipient, 'id' | 'subscription_start_date' | 'subscription_end_date' | 'subscription_notif_enabled'>) {
        await this.delay(400);
        const index = this.recipients.findIndex(r => r.id === id);
        if (index === -1) throw new Error("Recipient not found");
        this.recipients[index] = { ...this.recipients[index], ...data };
        saveToStorage('recipients', this.recipients);
        return this.recipients[index];
    }
    
    async updateSubscription(recipientId: number, details: { startDate?: string; endDate?: string; notifEnabled: boolean; }) {
        await this.delay(300);
        const index = this.recipients.findIndex(r => r.id === recipientId);
        if (index === -1) throw new Error("Recipient not found");
        this.recipients[index].subscription_start_date = details.startDate;
        this.recipients[index].subscription_end_date = details.endDate;
        this.recipients[index].subscription_notif_enabled = details.notifEnabled;
        saveToStorage('recipients', this.recipients);
        
        await this.sendSubscriptionActivationNotification(this.recipients[index]);
        return this.recipients[index];
    }

    async terminateSubscription(recipientId: number) {
        await this.delay(300);
        const index = this.recipients.findIndex(r => r.id === recipientId);
        if (index === -1) throw new Error("Recipient not found");
        
        this.recipients[index].subscription_end_date = new Date().toISOString();
        saveToStorage('recipients', this.recipients);
        return this.recipients[index];
    }

    async deleteSubscription(recipientId: number) {
        await this.delay(300);
        const index = this.recipients.findIndex(r => r.id === recipientId);
        if (index === -1) throw new Error("Recipient not found");

        this.recipients[index].subscription_start_date = undefined;
        this.recipients[index].subscription_end_date = undefined;
        this.recipients[index].subscription_notif_enabled = false;
        saveToStorage('recipients', this.recipients);
        return this.recipients[index];
    }


    async deleteRecipient(id: number) {
        await this.delay(300);
        this.recipients = this.recipients.filter(r => r.id !== id);
        saveToStorage('recipients', this.recipients);
        return { success: true };
    }
    
    async getExpeditions() {
        await this.delay(100);
        return this.expeditions;
    }

    async getLocations() {
        await this.delay(100);
        return this.locations;
    }

    async addLocation(data: Omit<Location, 'id'>) {
        await this.delay(400);
        const newLocation: Location = {
            ...data,
            id: this.locations.length > 0 ? Math.max(...this.locations.map(l => l.id)) + 1 : 1,
        };
        this.locations.push(newLocation);
        saveToStorage('locations', this.locations);
        return newLocation;
    }
    
    async updateLocation(id: number, data: Partial<Omit<Location, 'id'>>) {
        await this.delay(400);
        const index = this.locations.findIndex(l => l.id === id);
        if (index === -1) throw new Error("Location not found");
        this.locations[index] = { ...this.locations[index], ...data };
        saveToStorage('locations', this.locations);
        return this.locations[index];
    }

    async deleteLocation(id: number) {
        await this.delay(300);
        this.locations = this.locations.filter(l => l.id !== id);
        saveToStorage('locations', this.locations);
        return { success: true };
    }

    async getSizePricing(location_id: number) {
        await this.delay(100);
        return this.sizePricing.filter(sp => sp.location_id === location_id);
    }

    async getUsers() {
        await this.delay(100);
        return this.users;
    }
    
    async addUser(data: Omit<User, 'id'> & {password: string}) {
        await this.delay(400);
        if (this.users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
            throw new Error("Email sudah terdaftar.");
        }
        // In a real app, password would be hashed. Here we just ignore it.
        const { password, ...userData } = data;

        const newUser: User = {
            ...userData,
            id: this.users.length > 0 ? Math.max(...this.users.map(u => u.id)) + 1 : 1,
        };
        this.users.push(newUser);
        saveToStorage('users', this.users);
        return newUser;
    }

    async updateUser(id: number, data: Partial<Omit<User, 'id'>>) {
        await this.delay(400);
        const index = this.users.findIndex(u => u.id === id);
        if (index === -1) throw new Error("User not found");
        this.users[index] = { ...this.users[index], ...data };
        saveToStorage('users', this.users);
        return this.users[index];
    }

    async deleteUser(id: number) {
        await this.delay(300);
        const userToDelete = this.users.find(u => u.id === id);
        if (!userToDelete) throw new Error("User not found");
        if (userToDelete.email === 'admin@pickpoint.com') {
            throw new Error("Tidak dapat menghapus user admin utama.");
        }
        this.users = this.users.filter(u => u.id !== id);
        saveToStorage('users', this.users);
        return { success: true };
    }
}

export const api = new MockApiService();