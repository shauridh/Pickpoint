import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  MapPin, 
  Bell, 
  Users, 
  BarChart3, 
  Zap,
  Check,
  ArrowRight,
  Star,
  MessageCircle,
  Smartphone,
  Globe
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Package className="h-6 w-6" />,
      title: 'Manajemen Paket Modern',
      description: 'Kelola penerimaan paket dengan sistem digital yang efisien. Scan barcode, tracking otomatis, dan status real-time.'
    },
    {
      icon: <Bell className="h-6 w-6" />,
      title: 'Notifikasi WhatsApp Otomatis',
      description: 'Customer langsung dapat notifikasi saat paket tiba. Lengkap dengan kode pengambilan dan link tracking.'
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: 'Multi Lokasi',
      description: 'Kelola beberapa titik pickup sekaligus. Setiap lokasi punya pengaturan harga dan tim sendiri.'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Sistem Membership',
      description: 'Tingkatkan loyalitas customer dengan membership premium. Beri diskon otomatis untuk member setia.'
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: 'Dashboard & Laporan',
      description: 'Visualisasi pendapatan, analitik paket, dan kinerja bisnis dalam satu dashboard komprehensif.'
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: 'Public Tracking',
      description: 'Customer bisa cek status paket sendiri via link publik. Transparansi penuh, kepercayaan meningkat.'
    }
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: 'Gratis',
      period: 'trial 30 hari',
      features: [
        '1 Lokasi',
        '100 Paket/bulan',
        'Notifikasi WhatsApp',
        'Dashboard Basic',
        'Support Email'
      ],
      cta: 'Mulai Gratis',
      highlighted: false
    },
    {
      name: 'Professional',
      price: 'Rp 299.000',
      period: '/bulan',
      features: [
        'Unlimited Lokasi',
        'Unlimited Paket',
        'WhatsApp + SMS',
        'Dashboard Advanced',
        'Multi User/Staff',
        'Priority Support',
        'Custom Branding'
      ],
      cta: 'Pilih Professional',
      highlighted: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'hubungi sales',
      features: [
        'Semua Fitur Pro',
        'Custom Integration',
        'Dedicated Server',
        'Training & Onboarding',
        'SLA 99.9%',
        'Account Manager'
      ],
      cta: 'Hubungi Sales',
      highlighted: false
    }
  ];

  const testimonials = [
    {
      name: 'Budi Santoso',
      role: 'Owner, Toko Elektronik',
      content: 'PickPoint mengubah cara kami handle paket customer. Sekarang semua terorganisir dan customer puas!',
      rating: 5
    },
    {
      name: 'Siti Rahmawati',
      role: 'Manager, Co-Working Space',
      content: 'Notifikasi WhatsApp otomatis sangat membantu. Member kami jadi tahu langsung saat paket datang.',
      rating: 5
    },
    {
      name: 'Ahmad Hidayat',
      role: 'Pengelola Apartemen',
      content: 'Dashboard yang user-friendly dan laporan lengkap. Sangat cocok untuk mengelola ratusan paket per hari.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">PickPoint</span>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-semibold"
            >
              Login Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-semibold mb-6">
                <Zap className="h-4 w-4" />
                Solusi Terdepan 2025
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Kelola Paket Lebih <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Smart & Efisien</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Sistem manajemen penerimaan paket all-in-one untuk apartemen, co-working space, toko, dan bisnis lainnya. 
                Notifikasi otomatis, tracking real-time, dan dashboard analytics.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-bold text-lg group"
                >
                  Coba Gratis 30 Hari
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <a
                  href="https://wa.me/6281234567890?text=Halo,%20saya%20tertarik%20dengan%20PickPoint"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 rounded-xl hover:bg-gray-50 transition-all shadow-md hover:shadow-lg font-bold text-lg border-2 border-gray-200"
                >
                  <MessageCircle className="mr-2 h-5 w-5 text-green-600" />
                  Konsultasi via WhatsApp
                </a>
              </div>
              <div className="mt-8 flex items-center gap-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Tanpa Kartu Kredit</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Setup 5 Menit</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Support 24/7</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <Smartphone className="h-24 w-24 text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 font-semibold">Dashboard Preview</p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">1,234</p>
                    <p className="text-xs text-gray-600 mt-1">Paket/Bulan</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">98%</p>
                    <p className="text-xs text-gray-600 mt-1">Customer Puas</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-600">24/7</p>
                    <p className="text-xs text-gray-600 mt-1">Support</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20 blur-3xl"></div>
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Fitur Lengkap untuk Bisnis Anda</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Semua yang Anda butuhkan untuk mengelola penerimaan paket secara profesional
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all group"
              >
                <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl inline-block text-white mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Cara Kerja PickPoint</h2>
            <p className="text-xl text-gray-600">Simple, cepat, dan efektif</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Paket Tiba', desc: 'Staff scan barcode atau input manual nomor resi paket', icon: <Package className="h-8 w-8" /> },
              { step: '2', title: 'Notifikasi Otomatis', desc: 'Customer langsung dapat WhatsApp dengan kode pickup', icon: <Bell className="h-8 w-8" /> },
              { step: '3', title: 'Customer Tracking', desc: 'Customer cek status & biaya via link publik', icon: <Smartphone className="h-8 w-8" /> },
              { step: '4', title: 'Pickup & Payment', desc: 'Customer datang, bayar (jika ada), ambil paket', icon: <Check className="h-8 w-8" /> }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-4">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white mx-auto shadow-lg">
                    {item.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-sm font-bold text-gray-900 shadow-md">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Pilih Paket yang Tepat</h2>
            <p className="text-xl text-gray-600">Harga transparan, tanpa biaya tersembunyi</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index}
                className={`rounded-2xl p-8 ${
                  plan.highlighted 
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-2xl scale-105 border-4 border-yellow-400' 
                    : 'bg-white border-2 border-gray-200'
                }`}
              >
                {plan.highlighted && (
                  <div className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                    PALING POPULER
                  </div>
                )}
                <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlighted ? 'text-blue-100' : 'text-gray-600'}`}>
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-2">
                      <Check className={`h-5 w-5 flex-shrink-0 ${plan.highlighted ? 'text-yellow-300' : 'text-green-600'}`} />
                      <span className={`text-sm ${plan.highlighted ? 'text-blue-50' : 'text-gray-700'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/login')}
                  className={`w-full py-3 rounded-lg font-bold transition-all ${
                    plan.highlighted
                      ? 'bg-white text-blue-600 hover:bg-gray-100 shadow-lg'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Dipercaya Ratusan Bisnis</h2>
            <p className="text-xl text-gray-600">Dengar langsung dari pelanggan kami</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                <div className="border-t pt-4">
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Siap Tingkatkan Efisiensi Bisnis Anda?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Bergabung dengan ratusan bisnis yang sudah merasakan manfaat PickPoint
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl font-bold text-lg group"
            >
              Mulai Gratis Sekarang
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="https://wa.me/6281234567890?text=Halo,%20saya%20ingin%20demo%20PickPoint"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white rounded-xl hover:bg-white/10 transition-all border-2 border-white font-bold text-lg"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Jadwalkan Demo
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">PickPoint</span>
              </div>
              <p className="text-sm text-gray-400">
                Solusi manajemen paket modern untuk bisnis Indonesia
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Produk</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Fitur</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Harga</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Dokumentasi</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Perusahaan</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Tentang Kami</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Karir</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Kontak</h4>
              <ul className="space-y-2 text-sm">
                <li>Email: info@pickpoint.my.id</li>
                <li>WhatsApp: +62 812-3456-7890</li>
                <li>Support: 24/7 Available</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2025 PickPoint. All rights reserved. Made with ❤️ in Indonesia</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
