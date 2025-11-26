import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Camera, Scan, Search } from 'lucide-react';
import { Package, PackageSize } from '@/types';
import { 
  addPackage, 
  updatePackage, 
  getCustomers, 
  getLocations,
  getSettings,
} from '@/services/storage.service';
import { sendPackageArrivalNotification } from '@/services/whatsapp.service';
import { generateId } from '@/utils/helpers';
import { useAuth } from '@/contexts/AuthContext';

interface PackageModalProps {
  package?: Package;
  onClose: () => void;
}

const PackageModal: React.FC<PackageModalProps> = ({ package: editPackage, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const customers = getCustomers();
  const locations = getLocations();
  const settings = getSettings();
  
  const [formData, setFormData] = useState({
    trackingNumber: editPackage?.trackingNumber || '',
    customerId: editPackage?.customerId || '',
    locationId: editPackage?.locationId || settings.defaultLocationId || '',
    courierName: editPackage?.courierName || '',
    size: editPackage?.size || ('medium' as PackageSize),
    photoUrl: editPackage?.photoUrl || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const trackingInputRef = useRef<HTMLInputElement>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Get selected customer for auto-fill
  const selectedCustomer = customers.find(c => c.id === formData.customerId);

  // Filter customers based on search
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.unitNumber.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  // Get selected location to check pricing scheme
  const selectedLocation = locations.find(l => l.id === formData.locationId);
  const shouldShowSize = selectedLocation?.pricingScheme === 'flat_size';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-fill phone and location when customer is selected
  useEffect(() => {
    if (selectedCustomer && !editPackage) {
      // Location is already set from customer, no need to override
    }
  }, [selectedCustomer, editPackage]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.trackingNumber.trim()) {
      newErrors.trackingNumber = 'Required';
    }
    if (!formData.customerId) {
      newErrors.customerId = 'Required';
    }
    if (!formData.locationId) {
      newErrors.locationId = 'Required';
    }
    if (!formData.courierName?.trim()) {
      newErrors.courierName = 'Required';
    }
    if (shouldShowSize && !formData.size) {
      newErrors.size = 'Required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);

    try {
      if (editPackage) {
        updatePackage(editPackage.id, formData);
      } else {
        const newPackage: Package = {
          id: generateId(),
          ...formData,
          pickupCode: '', // Will be generated after payment
          status: 'arrived',
          arrivedAt: new Date().toISOString(),
          createdBy: user?.id || '',
          paymentStatus: 'unpaid',
        };

        addPackage(newPackage);

        // Send WhatsApp notification
        const customer = customers.find(c => c.id === formData.customerId);
        const location = locations.find(l => l.id === formData.locationId);

        if (customer && location && customer.notificationEnabled) {
          await sendPackageArrivalNotification(
            customer.name,
            customer.phone,
            formData.trackingNumber,
            '', // No pickup code yet
            location.name
          );
        }
      }

      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Error saving package');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleScan = () => {
    setIsScanning(true);
    // Simulate scanner - in production this would use barcode scanner library
    setTimeout(() => {
      const mockScannedCode = 'SCAN' + Math.random().toString(36).substr(2, 9).toUpperCase();
      setFormData(prev => ({ ...prev, trackingNumber: mockScannedCode }));
      setIsScanning(false);
      alert('Kode berhasil di-scan! (Mode simulasi)');
    }, 1500);
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId: customer.id,
        // Keep current location or use customer's default if available
      }));
      setCustomerSearch(customer.name);
      setShowCustomerDropdown(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        <div className="fixed inset-0 transition-opacity bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <div className="relative inline-block w-full max-w-3xl my-6 overflow-hidden text-left align-middle transition-all transform bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {editPackage ? t('common.edit') : t('packages.addNew')}
              </h3>
              <button 
                onClick={onClose} 
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
            <div className="px-5 py-4 space-y-3">
              {/* Tracking Number with Scanner */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  {t('packages.trackingNumber')} *
                </label>
                <div className="flex gap-2">
                  <input
                    ref={trackingInputRef}
                    type="text"
                    name="trackingNumber"
                    value={formData.trackingNumber}
                    onChange={handleChange}
                    className={`input-field flex-1 py-2 text-sm ${errors.trackingNumber ? 'border-red-500' : ''}`}
                    placeholder="Masukkan atau scan nomor resi"
                  />
                  <button
                    type="button"
                    onClick={handleScan}
                    disabled={isScanning}
                    className={`px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 hover:shadow-lg ${
                      isScanning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                    }`}
                  >
                    <Scan className="h-5 w-5" />
                    {isScanning ? 'Scanning...' : 'Scan'}
                  </button>
                </div>
                {errors.trackingNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.trackingNumber}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Customer Search Dropdown */}
                <div className="relative" ref={customerDropdownRef}>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    {t('packages.customer')} *
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      placeholder="Cari nama, unit, atau telepon..."
                      className={`input-field pl-10 py-2 text-sm ${errors.customerId ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {showCustomerDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map(customer => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => handleCustomerSelect(customer.id)}
                            className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
                          >
                            <div className="font-medium text-gray-900">
                              {customer.name} {customer.unitNumber && <span className="text-indigo-600">• {customer.unitNumber}</span>}
                            </div>
                            <div className="text-sm text-gray-600">{customer.phone}</div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500 text-sm">
                          Tidak ada pelanggan ditemukan
                        </div>
                      )}
                    </div>
                  )}
                  {errors.customerId && (
                    <p className="text-red-500 text-sm mt-1">{errors.customerId}</p>
                  )}
                  {selectedCustomer && (
                    <div className="mt-1.5 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {selectedCustomer.name} {selectedCustomer.unitNumber && <span className="text-indigo-600">• Unit {selectedCustomer.unitNumber}</span>}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">📱 {selectedCustomer.phone}</p>
                        </div>
                        {selectedCustomer.isPremiumMember && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                            Premium
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Courier Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    {t('packages.courier')} *
                  </label>
                  <select
                    name="courierName"
                    value={formData.courierName}
                    onChange={handleChange}
                    className={`input-field py-2 text-sm ${errors.courierName ? 'border-red-500' : ''}`}
                  >
                    <option value="">Pilih Kurir</option>
                    <option value="JNE">JNE</option>
                    <option value="JNT">JNT (J&T Express)</option>
                    <option value="SiCepat">SiCepat</option>
                    <option value="Ninja Xpress">Ninja Xpress</option>
                    <option value="Anteraja">Anteraja</option>
                    <option value="Shopee Express">Shopee Express</option>
                    <option value="Grab Express">Grab Express</option>
                    <option value="GoSend">GoSend</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                  {errors.courierName && (
                    <p className="text-red-500 text-sm mt-1">{errors.courierName}</p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    {t('packages.location')} *
                  </label>
                  <select
                    name="locationId"
                    value={formData.locationId}
                    onChange={handleChange}
                    className={`input-field py-2 text-sm ${errors.locationId ? 'border-red-500' : ''}`}
                  >
                    <option value="">Pilih Lokasi</option>
                    {locations.filter(l => l.isActive).map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                  {errors.locationId && (
                    <p className="text-red-500 text-sm mt-1">{errors.locationId}</p>
                  )}
                </div>

                {/* Size - Conditional */}
                {shouldShowSize && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      {t('packages.size')} *
                    </label>
                    <select
                      name="size"
                      value={formData.size}
                      onChange={handleChange}
                      className={`input-field py-2 text-sm ${errors.size ? 'border-red-500' : ''}`}
                    >
                      <option value="small">{t('size.small')}</option>
                      <option value="medium">{t('size.medium')}</option>
                      <option value="large">{t('size.large')}</option>
                      <option value="extra_large">{t('size.extra_large')}</option>
                    </select>
                    {errors.size && (
                      <p className="text-red-500 text-sm mt-1">{errors.size}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      * Ukuran diperlukan karena lokasi menggunakan skema harga berdasarkan ukuran
                    </p>
                  </div>
                )}
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  {t('packages.photo')}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5 hover:shadow-lg"
                  >
                    <Camera className="h-5 w-5" />
                    {t('packages.uploadPhoto')}
                  </label>
                  {formData.photoUrl && (
                    <img
                      src={formData.photoUrl}
                      alt="Package"
                      className="h-16 w-16 object-cover rounded-lg border-2 border-gray-300 shadow-md"
                    />
                  )}
                </div>
              </div>

              {/* Info Note */}
              {!editPackage && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  <p className="text-xs text-amber-800">
                    <strong>ℹ️ Catatan:</strong> Kode pengambilan akan di-generate otomatis setelah pembayaran dikonfirmasi. 
                  </p>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PackageModal;
