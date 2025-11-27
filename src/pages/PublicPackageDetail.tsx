import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Package as PackageIcon, 
  MapPin, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  User,
  Truck,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { Package, Customer, Location } from '@/types';
import { calculatePackagePrice } from '@/services/pricing.service';
import { createXenditInvoice } from '@/services/payment.service';

const PublicPackageDetail: React.FC = () => {
  const { trackingNumber } = useParams<{ trackingNumber: string }>();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    loadPackageData();
  }, [trackingNumber]);

  const loadPackageData = () => {
    try {
      const packages = JSON.parse(localStorage.getItem('pickpoint_packages') || '[]');
      const customers = JSON.parse(localStorage.getItem('pickpoint_customers') || '[]');
      const locations = JSON.parse(localStorage.getItem('pickpoint_locations') || '[]');

      console.log('Searching for tracking number:', trackingNumber);
      console.log('Available packages:', packages.map((p: Package) => p.trackingNumber));

      const foundPackage = packages.find(
        (p: Package) => p.trackingNumber?.toLowerCase() === trackingNumber?.toLowerCase()
      );

      if (!foundPackage) {
        setError('Paket tidak ditemukan');
        setLoading(false);
        return;
      }

      const foundCustomer = customers.find((c: Customer) => c.id === foundPackage.customerId);
      const foundLocation = locations.find((l: Location) => l.id === foundPackage.locationId);

      // If dummy payment flow: ?paid=1 then mark as paid locally
      const params = new URLSearchParams(loc.search);
      const paidParam = params.get('paid');
      if (paidParam === '1') {
        foundPackage.paymentStatus = 'paid';
        foundPackage.paidAt = new Date().toISOString();
        // persist back to local storage
        const updatedPackages = packages.map((p: Package) => p.id === foundPackage.id ? foundPackage : p);
        localStorage.setItem('pickpoint_packages', JSON.stringify(updatedPackages));
      }

      setPkg(foundPackage);
      setCustomer(foundCustomer);
      setLocation(foundLocation);
      setLoading(false);
    } catch (err) {
      setError('Gagal memuat data paket');
      setLoading(false);
    }
  };

  // removed legacy dummy handler; real handler defined below

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data paket...</p>
        </div>
      </div>
    );
  }

  if (error || !pkg || !customer || !location) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PackageIcon className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Paket Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-6">{error || 'Periksa kembali nomor resi dan kode pengambilan Anda.'}</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const pricing = pkg && location && customer ? calculatePackagePrice(pkg, location, customer) : { finalPrice: 0, days: 0 } as any;
  const isPaid = pkg?.paymentStatus === 'paid';
  const canPickup = pkg?.status === 'arrived' && isPaid;

  const handlePayNow = async () => {
    if (!pkg || !customer || !location) return;
    try {
      setPaying(true);
      const invoice = await createXenditInvoice({ pkg, customer, location });
      if (invoice?.invoice_url) {
        window.location.href = invoice.invoice_url;
      } else {
        alert('Gagal membuat invoice.');
      }
    } catch (e: any) {
      alert('Gagal membuat invoice: ' + (e?.message || 'Unknown error'));
    } finally {
      setPaying(false);
    }
  };

  // Poll payment status when not paid
  useEffect(() => {
    let timer: any;
    const poll = async () => {
      if (!pkg || isPaid) return;
      try {
        const externalId = `PKG-${pkg.id}`;
        const resp = await fetch(`/api/payments/xendit-status?external_id=${encodeURIComponent(externalId)}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.status === 'PAID') {
            // mark paid locally
            const packages = JSON.parse(localStorage.getItem('pickpoint_packages') || '[]');
            const updated = packages.map((p: Package) => p.id === pkg.id ? { ...p, paymentStatus: 'paid', paidAt: new Date().toISOString() } : p);
            localStorage.setItem('pickpoint_packages', JSON.stringify(updated));
            // refresh view
            setPkg({ ...pkg, paymentStatus: 'paid', paidAt: new Date().toISOString() });
          }
        }
      } catch {}
      timer = setTimeout(poll, 5000);
    };
    poll();
    return () => { if (timer) clearTimeout(timer); };
  }, [pkg, isPaid]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-6 shadow-lg">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <PackageIcon className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-xl font-bold mb-1">Detail Paket</h1>
                <p className="text-lg font-mono font-bold">{trackingNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Status Banner */}
        {canPickup && (
          <div className="bg-green-500 text-white rounded-xl p-4 mb-6 shadow-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 flex-shrink-0" />
              <div>
                <p className="font-bold">Paket Siap Diambil!</p>
                <p className="text-sm text-green-100">Tunjukkan nomor resi kepada petugas untuk mengambil paket Anda.</p>
              </div>
            </div>
          </div>
        )}

        {!isPaid && pkg.status === 'arrived' && (
          <div className="bg-amber-500 text-white rounded-xl p-4 mb-6 shadow-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 flex-shrink-0" />
              <div>
                <p className="font-bold">Pembayaran Diperlukan</p>
                <p className="text-sm text-amber-100">Silakan bayar biaya penyimpanan untuk mengambil paket Anda.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Package Info Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Informasi Paket</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3 pb-4 border-b">
                  <Truck className="h-5 w-5 text-purple-600 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Kurir</p>
                    <p className="font-semibold text-gray-900">{pkg.courierName || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pb-4 border-b">
                  <MapPin className="h-5 w-5 text-green-600 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Lokasi PickPoint</p>
                    <p className="font-semibold text-gray-900">{location.name}</p>
                    <p className="text-sm text-gray-600 mt-1">{location.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-orange-600 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Tanggal Tiba</p>
                    <p className="font-semibold text-gray-900">
                      {format(new Date(pkg.arrivedAt), 'dd MMMM yyyy, HH:mm')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{pricing.days} hari di PickPoint</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Info Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Informasi Penerima</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Nama</p>
                    <p className="font-semibold text-gray-900">{customer.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Unit</p>
                    <p className="font-semibold text-gray-900">{customer.unitNumber}</p>
                  </div>
                </div>
                {customer.isPremiumMember && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                    <p className="text-sm font-medium text-amber-800">👑 Premium Member - Gratis Biaya Simpan</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Pembayaran</h2>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Biaya Penyimpanan</span>
                    <span className="text-sm text-gray-900">{pricing.days} hari</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-gray-900">
                      Rp {pricing.finalPrice.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 py-3">
                  {isPaid ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Sudah Dibayar</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-600">
                      <Clock className="h-5 w-5" />
                      <span className="font-semibold">Belum Dibayar</span>
                    </div>
                  )}
                </div>

                {!isPaid && pkg.status === 'arrived' && (
                  <>
                    <button
                      onClick={handlePayNow}
                      disabled={paying}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <CreditCard className="h-5 w-5" />
                      {paying ? 'Membuat Invoice...' : 'Bayar Sekarang'}
                    </button>

                    <p className="text-xs text-gray-500 text-center">
                      Pembayaran aman dengan berbagai metode (Xendit)
                    </p>

                    <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                      <div className="bg-gray-100 rounded p-2 text-center">
                        <p className="text-xs text-gray-600">Transfer Bank</p>
                      </div>
                      <div className="bg-gray-100 rounded p-2 text-center">
                        <p className="text-xs text-gray-600">E-Wallet</p>
                      </div>
                      <div className="bg-gray-100 rounded p-2 text-center">
                        <p className="text-xs text-gray-600">QRIS</p>
                      </div>
                    </div>
                  </>
                )}

                {canPickup && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-green-800">Paket Siap Diambil!</p>
                    <p className="text-xs text-green-600 mt-1">Datang ke lokasi dengan kode pengambilan</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Butuh bantuan? Hubungi kami di <span className="font-semibold">{location.phone || '-'}</span>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Powered by PickPoint - Solusi Penerimaan Paket Modern
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicPackageDetail;
