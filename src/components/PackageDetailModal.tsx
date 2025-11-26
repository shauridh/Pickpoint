import React from 'react';
import { X, Package, User, MapPin, Calendar, Clock, DollarSign, CheckCircle, XCircle, Send } from 'lucide-react';
import { Package as PackageType, Customer, Location } from '../types';
import { format } from 'date-fns';
import { calculatePackagePrice } from '../services/pricing.service';

interface PackageDetailModalProps {
  pkg: PackageType;
  customer?: Customer;
  location?: Location;
  onClose: () => void;
  onUpdatePaymentStatus: (packageId: string, status: 'paid' | 'unpaid') => void;
  onResendNotification: (packageId: string) => void;
  onUpdateTakenStatus: (packageId: string) => void;
}

const PackageDetailModal: React.FC<PackageDetailModalProps> = ({
  pkg,
  customer,
  location,
  onClose,
  onUpdatePaymentStatus,
  onResendNotification,
  onUpdateTakenStatus,
}) => {
  const pricing = location && customer ? calculatePackagePrice(pkg, location, customer) : null;
  const isPaid = pkg.paymentStatus === 'paid';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Detail Paket</h2>
                <p className="text-xs text-white/80 font-mono">{pkg.trackingNumber}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content - Side by Side */}
        <div className="p-5">
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Left Column */}
            <div className="space-y-3">
              {/* Customer Info */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Pelanggan</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nama</span>
                    <span className="font-medium text-gray-900">{customer?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit</span>
                    <span className="font-medium text-gray-900">{customer?.unitNumber || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Telepon</span>
                    <span className="font-medium text-gray-900">{customer?.phone || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status</span>
                    {customer?.isPremiumMember ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        Premium
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Regular
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Package Info */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-purple-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Paket</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">No. Resi</span>
                    <span className="font-mono font-bold text-gray-900">{pkg.trackingNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kode Ambil</span>
                    <span className="font-mono font-bold text-indigo-600 text-base">{pkg.pickupCode}</span>
                  </div>
                  {pkg.size && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ukuran</span>
                      <span className="font-medium text-gray-900">
                        {pkg.size === 'small' ? 'Kecil' : pkg.size === 'medium' ? 'Sedang' : pkg.size === 'large' ? 'Besar' : 'Extra Besar'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Lokasi</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-purple-600" />
                      <span className="font-medium text-gray-900">{location?.name || '-'}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kurir</span>
                    <span className="font-medium text-gray-900">{pkg.courierName || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              {/* Timeline */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-3 border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Timeline</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="p-1.5 bg-white rounded">
                      <Calendar className="h-3 w-3 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-900">Paket Tiba</p>
                      <p className="text-xs text-gray-600">{format(new Date(pkg.arrivedAt), 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                  </div>
                  {pkg.pickedUpAt && (
                    <div className="flex items-start gap-2">
                      <div className="p-1.5 bg-white rounded">
                        <CheckCircle className="h-3 w-3 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-900">Diambil</p>
                        <p className="text-xs text-gray-600">{format(new Date(pkg.pickedUpAt), 'dd/MM/yyyy HH:mm')}</p>
                      </div>
                    </div>
                  )}
                  {pkg.destroyedAt && (
                    <div className="flex items-start gap-2">
                      <div className="p-1.5 bg-white rounded">
                        <XCircle className="h-3 w-3 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-900">Dimusnahkan</p>
                        <p className="text-xs text-gray-600">{format(new Date(pkg.destroyedAt), 'dd/MM/yyyy HH:mm')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              {pricing && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-amber-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Pembayaran</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Biaya ({pricing.days} hari)</span>
                      <span className="font-bold text-gray-900">
                        Rp {pricing.finalPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-amber-200">
                      <span className="text-gray-600">Status</span>
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3" />
                          Lunas
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3" />
                          Belum Lunas
                        </span>
                      )}
                    </div>
                    {isPaid && pkg.paidAt && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Dibayar</span>
                        <span className="text-gray-900">{format(new Date(pkg.paidAt), 'dd/MM HH:mm')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 border-t">
            <button
              onClick={() => onResendNotification(pkg.id)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Send className="h-4 w-4" />
              Kirim Ulang Notif
            </button>
            {pkg.status === 'arrived' && (
              <>
                <button
                  onClick={() => onUpdatePaymentStatus(pkg.id, isPaid ? 'unpaid' : 'paid')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors font-medium ${
                    isPaid 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isPaid ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  {isPaid ? 'Batalkan' : 'Tandai Lunas'}
                </button>
                <button
                  onClick={() => onUpdateTakenStatus(pkg.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  <CheckCircle className="h-4 w-4" />
                  Tandai Diambil
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageDetailModal;
