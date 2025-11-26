# PickPoint - Panduan Deploy ke Netlify + Supabase

## Arsitektur
- **Frontend**: React + Vite (Netlify)
- **Backend**: Netlify Functions (Serverless TypeScript)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **WhatsApp**: Gateway via Netlify Function

---

## 1. Setup Supabase

### A. Buat Project Supabase
1. Buka [supabase.com](https://supabase.com)
2. Sign up / Login
3. Klik "New Project"
   - Organization: pilih atau buat baru
   - Name: `pickpoint`
   - Database Password: buat password kuat (simpan!)
   - Region: Singapore (terdekat)
4. Tunggu ~2 menit project siap

### B. Jalankan SQL Schema
1. Di dashboard Supabase → klik "SQL Editor" (ikon </> di sidebar kiri)
2. Klik "New Query"
3. Copy-paste seluruh isi file `supabase-schema.sql` (ada di root project)
4. Klik "Run" atau tekan `Ctrl+Enter`
5. Pastikan sukses (hijau ✓) - ini akan membuat:
   - Tables: `user_profiles`, `customers`, `locations`, `packages`, `settings`
   - Indexes & Policies (Row Level Security)
   - Data default: settings dan location pertama

### C. Buat User Admin
1. Di Supabase dashboard → "Authentication" (ikon kunci di sidebar)
2. Klik "Add user" → "Create new user"
   - Email: `admin@pickpoint.com`
   - Password: `admin123` (atau ganti sesuai keinginan)
   - Auto Confirm User: ☑ (centang)
3. Klik "Create user"
4. Copy `User UID` yang muncul (contoh: `a1b2c3d4-...`)
5. Kembali ke SQL Editor, jalankan query ini (ganti `USER_UID_DISINI` dengan UID tadi):
   ```sql
   INSERT INTO public.user_profiles (id, name, role)
   VALUES ('USER_UID_DISINI', 'Admin User', 'admin');
   ```

### D. Ambil API Keys
1. Di Supabase dashboard → "Settings" (ikon gear) → "API"
2. Catat 2 nilai ini (untuk env Netlify nanti):
   - **Project URL**: `https://xxxxxxx.supabase.co`
   - **anon public**: `eyJhbGc...` (key panjang)

---

## 2. Setup Netlify

### A. Push ke Git
1. Pastikan project sudah di-commit:
   ```powershell
   git add .
   git commit -m "Add Netlify + Supabase integration"
   git push
   ```

### B. Deploy ke Netlify
1. Buka [app.netlify.com](https://app.netlify.com)
2. Login / Sign up
3. Klik "Add new site" → "Import an existing project"
4. Pilih provider Git (GitHub/GitLab/Bitbucket)
5. Pilih repository `Pickpoint`
6. Build settings (sudah otomatis terdeteksi dari `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
7. **Jangan deploy dulu!** Klik "Show advanced" → "New variable"

### C. Set Environment Variables
Tambahkan 5 variabel berikut (klik "New variable" untuk setiap baris):

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://xxxxxxx.supabase.co` (dari Supabase API settings) |
| `SUPABASE_ANON_KEY` | `eyJhbGc...` (anon key dari Supabase) |
| `WHATSAPP_API_URL` | `https://seen.getsender.id/send-message` |
| `WHATSAPP_API_KEY` | `yBMXcDk5iWz9MdEmyu8eBH2uhcytui` |
| `WHATSAPP_SENDER` | `6285777875132` |

8. Klik "Deploy site"

### D. Setup Custom Domain
1. Setelah deploy selesai → "Site settings" → "Domain management"
2. Klik "Add custom domain"
3. Masukkan: `admin.pickpoint.my.id`
4. Netlify akan kasih instruksi DNS:
   - Buka panel domain Anda (tempat beli domain)
   - Tambah CNAME record:
     - Name/Host: `admin`
     - Value/Points to: `xxxxxx.netlify.app`
     - TTL: Auto / 3600
5. Tunggu propagasi (~10 menit - 1 jam)
6. Netlify otomatis aktifkan HTTPS via Let's Encrypt

---

## 3. Update Frontend (Opsional - Nanti)

Saat ini frontend masih pakai `localStorage`. Untuk migrasi ke API:

### A. Buat file `.env.production`
```
VITE_API_URL=/.netlify/functions/api
VITE_SUPABASE_URL=https://xxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### B. Update `AuthContext.tsx`
Ganti localStorage auth dengan Supabase:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### C. Update `storage.service.ts`
Ganti method dengan fetch ke `/api/packages`, `/api/customers`, dll.

---

## 4. Testing

### A. Test API Langsung
Buka browser DevTools → Console, jalankan:
```javascript
// Test login
fetch('https://admin.pickpoint.my.id/.netlify/functions/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@pickpoint.com', password: 'admin123' })
})
.then(r => r.json())
.then(console.log);
```

Harus return:
```json
{
  "user": { "id": "...", "email": "admin@pickpoint.com", "name": "Admin User", "role": "admin" },
  "token": "eyJhbGc..."
}
```

### B. Test Dashboard
1. Buka `https://admin.pickpoint.my.id`
2. Login dengan `admin@pickpoint.com` / `admin123`
3. Dashboard harus tampil (data masih dari localStorage untuk sementara)

---

## 5. Migrasi Data (Nanti)

Jika sudah ada data di localStorage, buat function untuk export→import:
```javascript
// Di browser console
const data = {
  packages: JSON.parse(localStorage.getItem('packages')),
  customers: JSON.parse(localStorage.getItem('customers')),
};
console.log(JSON.stringify(data));
```

Copy JSON → POST ke endpoint import (bisa buat function khusus).

---

## 6. Landing Page (pickpoint.my.id)

Buat project terpisah untuk landing/tracking:
1. Buat folder baru `pickpoint-landing`
2. Simple HTML/React dengan halaman tracking
3. Deploy ke Netlify (atau host di Supabase Storage sebagai static site)
4. Arahkan domain `pickpoint.my.id` ke site tersebut

---

## Troubleshooting

**Q: API return 500/error**
- Cek Netlify Functions logs: Site → Functions → api → Logs
- Pastikan env vars sudah set (SUPABASE_URL, SUPABASE_ANON_KEY)

**Q: Login gagal "Unauthorized"**
- Cek user sudah dibuat di Supabase Auth
- Cek `user_profiles` table ada row dengan id user tersebut
- Password benar

**Q: Domain belum aktif**
- Tunggu DNS propagasi (bisa 1-24 jam tergantung provider)
- Cek dengan `nslookup admin.pickpoint.my.id`

**Q: CORS error**
- Pastikan `corsHeaders` ada di semua response function
- Cek Supabase RLS policies sudah enable

---

## Next Steps
1. ✅ Setup Supabase + user admin
2. ✅ Deploy Netlify + env vars
3. ✅ Custom domain
4. 🔄 Migrasi frontend ke API (bertahap)
5. 🔄 Buat landing page tracking
6. 🔄 Add more endpoints (PUT/DELETE packages, reports, dll)

---

**Support**: Jika ada kendala, cek Netlify deploy log atau Supabase logs.
