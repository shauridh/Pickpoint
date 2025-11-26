# PickPoint - Deployment ke Vercel

## 🚀 Migrasi dari Netlify ke Vercel

Vercel memberikan pengalaman yang lebih baik untuk serverless functions dengan setup yang lebih sederhana.

---

## 1. Setup Vercel CLI

### A. Install Vercel CLI
```bash
npm install -g vercel
```

### B. Login ke Vercel
```bash
vercel login
```
Atau saat pertama kali run `vercel dev`, akan otomatis prompt login.

---

## 2. Development Lokal

### A. Jalankan Development Server
```bash
vercel dev
```

Vercel akan:
- ✅ Otomatis detect Vite project
- ✅ Menjalankan serverless functions di `/api/*`
- ✅ Handle CORS otomatis
- ✅ Hot reload untuk function changes

Server akan berjalan di `http://localhost:3000`

### B. Test WhatsApp Notification
1. Buka browser: `http://localhost:3000`
2. Login ke dashboard
3. Pergi ke **Settings** → **Test Notifikasi**
4. Pastikan API URL = `api/wa/send`
5. Klik **Kirim Test**

Endpoint akan otomatis tersedia di:
- Local: `http://localhost:3000/api/wa/send`
- Production: `https://yourdomain.com/api/wa/send`

---

## 3. Environment Variables

### A. Setup via CLI
```bash
# Production environment
vercel env add WHATSAPP_GATEWAY_URL production
# Masukkan: https://seen.getsender.id/send-message

vercel env add WA_API_KEY production
# Masukkan: your-api-key

vercel env add WA_SENDER production
# Masukkan: 628123456789

vercel env add WHATSAPP_PROVIDER production
# Masukkan: generic (atau fonnte/watzap)
```

### B. Setup via Dashboard
1. Buka [vercel.com/dashboard](https://vercel.com/dashboard)
2. Pilih project Anda
3. Settings → Environment Variables
4. Tambahkan variable:
   - `WHATSAPP_GATEWAY_URL` = `https://seen.getsender.id/send-message`
   - `WA_API_KEY` = `your-whatsapp-api-key`
   - `WA_SENDER` = `628123456789`
   - `WHATSAPP_PROVIDER` = `generic` (atau `fonnte` / `watzap`)

---

## 4. Deploy ke Production

### A. Deploy Pertama Kali
```bash
vercel
```

Ikuti prompt:
1. **Set up and deploy?** → Yes
2. **Which scope?** → Pilih account/team Anda
3. **Link to existing project?** → No (jika baru)
4. **Project name?** → pickpoint (atau custom)
5. **In which directory?** → ./ (root)
6. **Override settings?** → No

Vercel akan:
- Build project
- Deploy serverless functions
- Generate preview URL

### B. Deploy Production
```bash
vercel --prod
```

Anda akan dapat:
- **Production URL**: `https://pickpoint.vercel.app`
- **API Endpoint**: `https://pickpoint.vercel.app/api/wa/send`

---

## 5. Custom Domain

### A. Tambah Domain di Vercel
1. Dashboard → Project → Settings → Domains
2. Klik **Add Domain**
3. Masukkan domain:
   - Admin Dashboard: `admin.pickpoint.my.id`
   - Public Landing: `pickpoint.my.id`

### B. Setup DNS
Di provider domain Anda (Cloudflare, Niagahoster, dll):

#### Untuk `pickpoint.my.id` (landing page)
```
Type: A
Name: @
Value: 76.76.21.21
```

#### Untuk `admin.pickpoint.my.id` (dashboard)
```
Type: CNAME
Name: admin
Value: cname.vercel-dns.com
```

**Atau bisa pakai A record untuk kedua-duanya:**
```
Type: A
Name: admin
Value: 76.76.21.21
```

### C. Verifikasi
Tunggu propagasi DNS (~5-30 menit), kemudian Vercel otomatis:
- ✅ Issue SSL certificate (HTTPS gratis)
- ✅ Setup routing
- ✅ Enable CDN

---

## 6. Struktur Project untuk Vercel

```
Pickpoint/
├── api/                    # Serverless Functions (Vercel)
│   └── wa/
│       └── send.ts         # WhatsApp notification endpoint
├── src/                    # React App
│   ├── components/
│   ├── pages/
│   └── services/
├── dist/                   # Build output (auto-generated)
├── vercel.json            # Vercel configuration
├── vite.config.ts         # Vite config with proxy
└── package.json
```

### Perbedaan dengan Netlify:
| Netlify | Vercel |
|---------|--------|
| `netlify/functions/api-wa.ts` | `api/wa/send.ts` |
| `/.netlify/functions/api-wa` | `/api/wa/send` |
| `netlify.toml` | `vercel.json` |
| `netlify dev` | `vercel dev` |

---

## 7. Monitoring & Logs

### A. Real-time Logs (Development)
Terminal tempat `vercel dev` berjalan akan show:
```
[WA][REQ] abc123 { provider: 'generic', ... }
[WA][RES] abc123 { status: 200, ... }
```

### B. Production Logs
1. Dashboard → Project → Deployments
2. Klik deployment terakhir
3. Tab **Logs** atau **Functions**
4. Lihat invocation details untuk `/api/wa/send`

### C. Debugging
```bash
# Tail production logs
vercel logs --follow

# Logs untuk function tertentu
vercel logs api/wa/send.ts
```

---

## 8. Troubleshooting

### Error: "Failed to fetch"
**Solusi:**
- Pastikan `api/wa/send` (relatif path) digunakan di Settings
- Cek browser console untuk detail error
- Verifikasi CORS headers di `vercel.json`

### Error: "Function timeout"
**Solusi:**
- Vercel free tier: 10 detik timeout
- Pro plan: 60 detik
- Pastikan WhatsApp gateway response cepat

### Error: "Module not found"
**Solusi:**
```bash
# Reinstall dependencies
npm install

# Rebuild
npm run build
```

### Environment Variables tidak terdeteksi
**Solusi:**
```bash
# Pull environment dari Vercel
vercel env pull

# Atau set manual untuk development
vercel env add WHATSAPP_GATEWAY_URL development
```

---

## 9. Best Practices

### ✅ DO
- Gunakan environment variables untuk sensitive data
- Test di local dengan `vercel dev` sebelum deploy
- Monitor function invocations di dashboard
- Set up custom domain dengan SSL
- Enable Web Analytics (Vercel dashboard)

### ❌ DON'T
- Jangan hardcode API keys di code
- Jangan commit `.vercel` folder ke git
- Jangan skip environment variables setup
- Jangan lupa update `api/wa/send` di Settings page

---

## 10. Deployment Checklist

- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Login: `vercel login`
- [ ] Test local: `vercel dev`
- [ ] Set environment variables via dashboard atau CLI
- [ ] Deploy preview: `vercel`
- [ ] Test API endpoint di preview URL
- [ ] Deploy production: `vercel --prod`
- [ ] Setup custom domain (admin.pickpoint.my.id & pickpoint.my.id)
- [ ] Verify DNS propagation
- [ ] Test WhatsApp notification di production
- [ ] Enable monitoring & alerts

---

## 11. Upgrade dari Free ke Pro (Optional)

Jika butuh:
- ⚡ Lebih banyak bandwidth (100 GB/month → 1 TB)
- ⏱️ Function timeout lebih lama (10s → 60s)
- 👥 Team collaboration
- 📊 Advanced analytics

Kunjungi: [vercel.com/pricing](https://vercel.com/pricing)

---

## 12. Support & Resources

- 📚 [Vercel Documentation](https://vercel.com/docs)
- 💬 [Vercel Community Discord](https://vercel.com/discord)
- 🎓 [Serverless Functions Guide](https://vercel.com/docs/functions)
- 🔧 [Vite on Vercel](https://vercel.com/docs/frameworks/vite)

---

**Happy Deploying! 🚀**

Jika ada masalah, cek [Vercel Status](https://www.vercel-status.com/) atau hubungi support.
