import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getSettings } from '@/services/storage.service';

const resources = {
  en: {
    translation: {
      // Common
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.add': 'Add',
      'common.search': 'Search',
      'common.filter': 'Filter',
      'common.export': 'Export',
      'common.actions': 'Actions',
      'common.loading': 'Loading...',
      'common.noData': 'No data available',
      'common.confirm': 'Confirm',
      'common.yes': 'Yes',
      'common.no': 'No',
      
      // Auth
      'auth.login': 'Login',
      'auth.logout': 'Logout',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.invalidCredentials': 'Invalid credentials',
      'auth.welcome': 'Welcome to PickPoint',
      
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.packages': 'Packages',
      'nav.customers': 'Customers',
      'nav.locations': 'Locations',
      'nav.users': 'Users',
      'nav.reports': 'Reports',
      'nav.settings': 'Settings',
      
      // Dashboard
      'dashboard.title': 'Dashboard',
      'dashboard.todayArrived': 'Today Arrived',
      'dashboard.todayPickedUp': 'Today Picked Up',
      'dashboard.currentInventory': 'Current Inventory',
      'dashboard.activeMembers': 'Active Members',
      'dashboard.revenue': 'Revenue',
      'dashboard.today': 'Today',
      'dashboard.thisWeek': 'This Week',
      'dashboard.thisMonth': 'This Month',
      'dashboard.total': 'Total',
      
      // Packages
      'packages.title': 'Package Management',
      'packages.addNew': 'Add New Package',
      'packages.trackingNumber': 'Tracking Number',
      'packages.pickupCode': 'Pickup Code',
      'packages.customer': 'Customer',
      'packages.location': 'Location',
      'packages.courier': 'Courier',
      'packages.size': 'Size',
      'packages.status': 'Status',
      'packages.arrivedAt': 'Arrived At',
      'packages.pickedUpAt': 'Picked Up At',
      'packages.photo': 'Photo',
      'packages.notes': 'Notes',
      'packages.scanBarcode': 'Scan Barcode',
      'packages.uploadPhoto': 'Upload Photo',
      'packages.markAsPickedUp': 'Mark as Picked Up',
      'packages.markAsDestroyed': 'Mark as Destroyed',
      'packages.bulkPickup': 'Bulk Pickup',
      
      // Package Status
      'status.arrived': 'Arrived',
      'status.picked_up': 'Picked Up',
      'status.destroyed': 'Destroyed',
      
      // Package Size
      'size.small': 'Small',
      'size.medium': 'Medium',
      'size.large': 'Large',
      'size.extra_large': 'Extra Large',
      
      // Customers
      'customers.title': 'Customer Management',
      'customers.addNew': 'Add New Customer',
      'customers.name': 'Name',
      'customers.phone': 'Phone',
      'customers.unitNumber': 'Unit Number',
      'customers.email': 'Email',
      'customers.premiumMember': 'Premium Member',
      'customers.membershipPeriod': 'Membership Period',
      'customers.activateMembership': 'Activate Membership',
      'customers.notifications': 'Notifications Enabled',
      
      // Locations
      'locations.title': 'Location Management',
      'locations.addNew': 'Add New Location',
      'locations.name': 'Name',
      'locations.address': 'Address',
      'locations.phone': 'Phone',
      'locations.pricingScheme': 'Pricing Scheme',
      'locations.fixedPrice': 'Fixed Price',
      'locations.progressivePricing': 'Progressive Pricing',
      'locations.sizeBasedPricing': 'Size-Based Pricing',
      'locations.memberDiscount': 'Member Discount (%)',
      'locations.active': 'Active',
      
      // Users
      'users.title': 'User Management',
      'users.addNew': 'Add New User',
      'users.name': 'Name',
      'users.email': 'Email',
      'users.role': 'Role',
      'users.assignedLocation': 'Assigned Location',
      'users.active': 'Active',
      'users.admin': 'Admin',
      'users.staff': 'Staff',
      
      // Reports
      'reports.title': 'Reports',
      'reports.dateRange': 'Date Range',
      'reports.startDate': 'Start Date',
      'reports.endDate': 'End Date',
      'reports.packageTraffic': 'Package Traffic',
      'reports.revenueReport': 'Revenue Report',
      
      // Settings
      'settings.title': 'Settings',
      'settings.general': 'General Settings',
      'settings.whatsapp': 'WhatsApp Integration',
      'settings.language': 'Language',
      'settings.companyName': 'Company Name',
      'settings.defaultLocation': 'Default Location',
      'settings.pickupCodeLength': 'Pickup Code Length',
      'settings.autoGenerateCode': 'Auto-generate Pickup Code',
      'settings.whatsappEnabled': 'Enable WhatsApp',
      'settings.apiUrl': 'API URL',
      'settings.apiKey': 'API Key',
      'settings.sendArrival': 'Send Arrival Notification',
      'settings.sendMembership': 'Send Membership Notification',
      'settings.sendReminder': 'Send Reminder',
      'settings.reminderDays': 'Reminder After (days)',
      
      // Public
      'public.tracking': 'Track Package',
      'public.register': 'Self Registration',
      'public.enterCode': 'Enter tracking number or pickup code',
      'public.track': 'Track',
      'public.registerForNotification': 'Register for package notifications',
      'public.registerButton': 'Register',
    },
  },
  id: {
    translation: {
      // Common
      'common.save': 'Simpan',
      'common.cancel': 'Batal',
      'common.delete': 'Hapus',
      'common.edit': 'Edit',
      'common.add': 'Tambah',
      'common.search': 'Cari',
      'common.filter': 'Filter',
      'common.export': 'Ekspor',
      'common.actions': 'Aksi',
      'common.loading': 'Memuat...',
      'common.noData': 'Tidak ada data',
      'common.confirm': 'Konfirmasi',
      'common.yes': 'Ya',
      'common.no': 'Tidak',
      
      // Auth
      'auth.login': 'Masuk',
      'auth.logout': 'Keluar',
      'auth.email': 'Email',
      'auth.password': 'Kata Sandi',
      'auth.invalidCredentials': 'Email atau kata sandi salah',
      'auth.welcome': 'Selamat datang di PickPoint',
      
      // Navigation
      'nav.dashboard': 'Dasbor',
      'nav.packages': 'Paket',
      'nav.customers': 'Pelanggan',
      'nav.locations': 'Lokasi',
      'nav.users': 'Pengguna',
      'nav.reports': 'Laporan',
      'nav.settings': 'Pengaturan',
      
      // Dashboard
      'dashboard.title': 'Dasbor',
      'dashboard.todayArrived': 'Tiba Hari Ini',
      'dashboard.todayPickedUp': 'Diambil Hari Ini',
      'dashboard.currentInventory': 'Inventaris Saat Ini',
      'dashboard.activeMembers': 'Anggota Aktif',
      'dashboard.revenue': 'Pendapatan',
      'dashboard.today': 'Hari Ini',
      'dashboard.thisWeek': 'Minggu Ini',
      'dashboard.thisMonth': 'Bulan Ini',
      'dashboard.total': 'Total',
      
      // Packages
      'packages.title': 'Manajemen Paket',
      'packages.addNew': 'Tambah Paket Baru',
      'packages.trackingNumber': 'Nomor Resi',
      'packages.pickupCode': 'Kode Pengambilan',
      'packages.customer': 'Pelanggan',
      'packages.location': 'Lokasi',
      'packages.courier': 'Kurir',
      'packages.size': 'Ukuran',
      'packages.status': 'Status',
      'packages.arrivedAt': 'Tiba Pada',
      'packages.pickedUpAt': 'Diambil Pada',
      'packages.photo': 'Foto',
      'packages.notes': 'Catatan',
      'packages.scanBarcode': 'Pindai Barcode',
      'packages.uploadPhoto': 'Unggah Foto',
      'packages.markAsPickedUp': 'Tandai Sudah Diambil',
      'packages.markAsDestroyed': 'Tandai Dihancurkan',
      'packages.bulkPickup': 'Pengambilan Massal',
      
      // Package Status
      'status.arrived': 'Tiba',
      'status.picked_up': 'Sudah Diambil',
      'status.destroyed': 'Dihancurkan',
      
      // Package Size
      'size.small': 'Kecil',
      'size.medium': 'Sedang',
      'size.large': 'Besar',
      'size.extra_large': 'Sangat Besar',
      
      // Customers
      'customers.title': 'Manajemen Pelanggan',
      'customers.addNew': 'Tambah Pelanggan Baru',
      'customers.name': 'Nama',
      'customers.phone': 'Telepon',
      'customers.unitNumber': 'Nomor Unit',
      'customers.email': 'Email',
      'customers.premiumMember': 'Anggota Premium',
      'customers.membershipPeriod': 'Periode Keanggotaan',
      'customers.activateMembership': 'Aktifkan Keanggotaan',
      'customers.notifications': 'Notifikasi Aktif',
      
      // Locations
      'locations.title': 'Manajemen Lokasi',
      'locations.addNew': 'Tambah Lokasi Baru',
      'locations.name': 'Nama',
      'locations.address': 'Alamat',
      'locations.phone': 'Telepon',
      'locations.pricingScheme': 'Skema Harga',
      'locations.fixedPrice': 'Harga Tetap',
      'locations.progressivePricing': 'Harga Progresif',
      'locations.sizeBasedPricing': 'Harga Berdasarkan Ukuran',
      'locations.memberDiscount': 'Diskon Anggota (%)',
      'locations.active': 'Aktif',
      
      // Users
      'users.title': 'Manajemen Pengguna',
      'users.addNew': 'Tambah Pengguna Baru',
      'users.name': 'Nama',
      'users.email': 'Email',
      'users.role': 'Peran',
      'users.assignedLocation': 'Lokasi Ditugaskan',
      'users.active': 'Aktif',
      'users.admin': 'Admin',
      'users.staff': 'Staf',
      
      // Reports
      'reports.title': 'Laporan',
      'reports.dateRange': 'Rentang Tanggal',
      'reports.startDate': 'Tanggal Mulai',
      'reports.endDate': 'Tanggal Akhir',
      'reports.packageTraffic': 'Lalu Lintas Paket',
      'reports.revenueReport': 'Laporan Pendapatan',
      
      // Settings
      'settings.title': 'Pengaturan',
      'settings.general': 'Pengaturan Umum',
      'settings.whatsapp': 'Integrasi WhatsApp',
      'settings.language': 'Bahasa',
      'settings.companyName': 'Nama Perusahaan',
      'settings.defaultLocation': 'Lokasi Default',
      'settings.pickupCodeLength': 'Panjang Kode Pengambilan',
      'settings.autoGenerateCode': 'Otomatis Buat Kode Pengambilan',
      'settings.whatsappEnabled': 'Aktifkan WhatsApp',
      'settings.apiUrl': 'URL API',
      'settings.apiKey': 'API Key',
      'settings.sendArrival': 'Kirim Notifikasi Kedatangan',
      'settings.sendMembership': 'Kirim Notifikasi Keanggotaan',
      'settings.sendReminder': 'Kirim Pengingat',
      'settings.reminderDays': 'Pengingat Setelah (hari)',
      
      // Public
      'public.tracking': 'Lacak Paket',
      'public.register': 'Pendaftaran Mandiri',
      'public.enterCode': 'Masukkan nomor resi atau kode pengambilan',
      'public.track': 'Lacak',
      'public.registerForNotification': 'Daftar untuk notifikasi paket',
      'public.registerButton': 'Daftar',
    },
  },
};

const settings = getSettings();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: settings.language || 'id',
    fallbackLng: 'id',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
