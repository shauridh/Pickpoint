import React from 'react';
import { X, Package, User, MapPin, Calendar, Clock, DollarSign, CheckCircle, XCircle, Send, Image, ExternalLink } from 'lucide-react';
import { Package as PackageType, Customer, Location } from '../types';
import { format } from 'date-fns';
import { calculatePackagePrice } from '../services/pricing.service';
import { generatePackageDetailUrl } from '../services/whatsapp.service';

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
  const [zoomedImage, setZoomedImage] = React.useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-t-xl sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold mb-1">Detail Paket</h2>
              <p className="text-base font-mono font-bold">{pkg.trackingNumber} / {pkg.pickupCode}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Left Column */}
            <div className="space-y-2">
              {/* Customer Info */}
              <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                <div className="flex items-center gap-1 mb-1">
                  <User className="h-3 w-3 text-blue-600" />
                  <h3 className="text-xs font-semibold text-gray-900">Pelanggan</h3>
                </div>
                <div className="space-y-1 text-xs">
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
                </div>
              </div>

              {/* Package Info */}
              <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
                <div className="flex items-center gap-1 mb-1">
                  <Package className="h-3 w-3 text-purple-600" />
                  <h3 className="text-xs font-semibold text-gray-900">Info Paket</h3>
                </div>
                <div className="space-y-1 text-xs">
                  {pkg.size && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ukuran</span>
                      <span className="font-medium text-gray-900">
                        {pkg.size === 'small' ? 'Kecil' : pkg.size === 'medium' ? 'Sedang' : pkg.size === 'large' ? 'Besar' : 'Extra Besar'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lokasi</span>
                    <span className="font-medium text-gray-900">{location?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kurir</span>
                    <span className="font-medium text-gray-900">{pkg.courierName || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-2">
              {/* Timeline */}
              <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-200">
                <div className="flex items-center gap-1 mb-1">
                  <Clock className="h-3 w-3 text-emerald-600" />
                  <h3 className="text-xs font-semibold text-gray-900">Timeline</h3>
                </div>
                <div className="space-y-1">
                  <div className="flex items-start gap-1">
                    <Calendar className="h-3 w-3 text-emerald-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-900">Tiba</p>
                      <p className="text-xs text-gray-600">{format(new Date(pkg.arrivedAt), 'dd/MM HH:mm')}</p>
                    </div>
                  </div>
                  {pkg.pickedUpAt && (
                    <div className="flex items-start gap-1">
                      <CheckCircle className="h-3 w-3 text-emerald-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-900">Diambil</p>
                        <p className="text-xs text-gray-600">{format(new Date(pkg.pickedUpAt), 'dd/MM HH:mm')}</p>
                      </div>
                    </div>
                  )}
                  {pkg.destroyedAt && (
                    <div className="flex items-start gap-1">
                      <XCircle className="h-3 w-3 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-900">Dimusnahkan</p>
                        <p className="text-xs text-gray-600">{format(new Date(pkg.destroyedAt), 'dd/MM HH:mm')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              {pricing && (
                <div className="bg-amber-50 rounded-lg p-2 border border-amber-200">
                  <div className="flex items-center gap-1 mb-1">
                    <DollarSign className="h-3 w-3 text-amber-600" />
                    <h3 className="text-xs font-semibold text-gray-900">Pembayaran</h3>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{pricing.days} hari</span>
                      <span className="font-bold text-gray-900">
                        Rp {pricing.finalPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status</span>
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Lunas
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Belum
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Photo Section */}
          {pkg.photoUrl && (
            <div className="mt-3">
              <div className="flex items-center gap-1 mb-1">
                <Image className="h-3 w-3 text-gray-600" />
                <h3 className="text-xs font-semibold text-gray-900">Foto Paket</h3>
              </div>
              <div className="relative">
                <img 
                  src={pkg.photoUrl} 
                  alt="Foto Paket" 
                  className="w-32 h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setZoomedImage(true)}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">Klik untuk perbesar</p>
              </div>
            </div>
          )}

          {/* Zoomed Image Modal */}
          {zoomedImage && pkg.photoUrl && (
            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setZoomedImage(false)}>
              <button onClick={() => setZoomedImage(false)} className="absolute top-4 right-4 text-white hover:text-gray-300">
                <X className="h-8 w-8" />
              </button>
              <img 
                src={pkg.photoUrl} 
                alt="Foto Paket" 
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Payment Link */}
          {!isPaid && pkg.status === 'arrived' && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-1">
                <ExternalLink className="h-3 w-3 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-900 mb-0.5">Link Pembayaran</p>
                  <a
                    href={generatePackageDetailUrl(pkg.trackingNumber, pkg.pickupCode)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700 hover:underline break-all"
                  >
                    {generatePackageDetailUrl(pkg.trackingNumber, pkg.pickupCode)}
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Notes Section */}
          {pkg.notes && (
            <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs font-semibold text-gray-900 mb-0.5">Catatan</p>
              <p className="text-xs text-gray-700">{pkg.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t mt-3">
            <button
              onClick={() => onResendNotification(pkg.id)}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Send className="h-3 w-3" />
              Kirim Notif
            </button>
            {pkg.status === 'arrived' && (
              <>
                <button
                  onClick={() => onUpdatePaymentStatus(pkg.id, isPaid ? 'unpaid' : 'paid')}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded-lg transition-colors font-medium ${
                    isPaid 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isPaid ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                  {isPaid ? 'Batalkan' : 'Lunas'}
                </button>
                <button
                  onClick={() => onUpdateTakenStatus(pkg.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  <CheckCircle className="h-3 w-3" />
                  Diambil
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
