# PickPoint - Package Management System

Sistem manajemen paket untuk pickup point dengan fitur komprehensif untuk mengelola seluruh siklus hidup paket.

## Fitur Utama

- 📊 **Dashboard**: Metrik operasional real-time
- 📦 **Manajemen Paket**: Penerimaan, pelacakan, dan pembaruan status
- 👥 **Manajemen Pelanggan**: Database pelanggan dengan sistem keanggotaan
- 📍 **Manajemen Lokasi**: Multi-lokasi dengan skema harga kustom
- 👨‍💼 **Manajemen Pengguna**: Role-based access (Admin & Staff)
- 📈 **Pelaporan**: Laporan traffic paket
- 🌐 **Halaman Publik**: Self-registration dan pelacakan paket
- 💬 **WhatsApp Integration**: Notifikasi otomatis
- 🌍 **Multi-bahasa**: Indonesia & English

## Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Backend**: Netlify Functions (Serverless)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: Zustand
- **Charts**: Recharts
- **i18n**: i18next
- **Icons**: Lucide React
- **Build Tool**: Vite

## Deployment

Lihat [DEPLOY.md](./DEPLOY.md) untuk panduan lengkap deploy ke Netlify + Supabase.

## Default Login

- **Admin**: admin@pickpoint.com / admin123
- **Staff**: staff@pickpoint.com / staff123
>>>>>>> 5e8ea07 (main)
