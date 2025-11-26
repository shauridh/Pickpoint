import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Camera } from 'lucide-react';
import { Package, PackageSize } from '@/types';
import { 
  addPackage, 
  updatePackage, 
  getCustomers, 
  getLocations,
  getSettings,
} from '@/services/storage.service';
import { sendPackageArrivalNotification } from '@/services/whatsapp.service';
import { generateId, generatePickupCode } from '@/utils/helpers';
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
    pickupCode: editPackage?.pickupCode || '',
    customerId: editPackage?.customerId || '',
    locationId: editPackage?.locationId || settings.defaultLocationId || '',
    courierName: editPackage?.courierName || '',
    size: editPackage?.size || ('medium' as PackageSize),
    photoUrl: editPackage?.photoUrl || '',
    notes: editPackage?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!editPackage && settings.autoGeneratePickupCode && !formData.pickupCode) {
      setFormData(prev => ({
        ...prev,
        pickupCode: generatePickupCode(settings.pickupCodeLength),
      }));
    }
  }, [editPackage, settings]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.trackingNumber.trim()) {
      newErrors.trackingNumber = 'Required';
    }
    if (!formData.pickupCode.trim()) {
      newErrors.pickupCode = 'Required';
    }
    if (!formData.customerId) {
      newErrors.customerId = 'Required';
    }
    if (!formData.locationId) {
      newErrors.locationId = 'Required';
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
          status: 'arrived',
          arrivedAt: new Date().toISOString(),
          createdBy: user?.id || '',
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
            formData.pickupCode,
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleGeneratePickupCode = () => {
    setFormData(prev => ({
      ...prev,
      pickupCode: generatePickupCode(settings.pickupCodeLength),
    }));
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
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="relative inline-block w-full max-w-3xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              {editPackage ? t('common.edit') : t('packages.addNew')}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
            <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('packages.trackingNumber')} *
                </label>
                <input
                  type="text"
                  name="trackingNumber"
                  value={formData.trackingNumber}
                  onChange={handleChange}
                  className={`input-field py-1.5 text-sm ${errors.trackingNumber ? 'border-red-500' : ''}`}
                  placeholder="ABC123456789"
                />
                {errors.trackingNumber && (
                  <p className="text-red-500 text-xs mt-0.5">{errors.trackingNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('packages.pickupCode')} *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="pickupCode"
                    value={formData.pickupCode}
                    onChange={handleChange}
                    className={`input-field py-1.5 text-sm ${errors.pickupCode ? 'border-red-500' : ''}`}
                    placeholder="ABC123"
                  />
                  <button
                    type="button"
                    onClick={handleGeneratePickupCode}
                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
                {errors.pickupCode && (
                  <p className="text-red-500 text-xs mt-0.5">{errors.pickupCode}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('packages.customer')} *
                </label>
                <select
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleChange}
                  className={`input-field py-1.5 text-sm ${errors.customerId ? 'border-red-500' : ''}`}
                >
                  <option value="">Select customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.unitNumber}
                    </option>
                  ))}
                </select>
                {errors.customerId && (
                  <p className="text-red-500 text-xs mt-0.5">{errors.customerId}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('packages.location')} *
                </label>
                <select
                  name="locationId"
                  value={formData.locationId}
                  onChange={handleChange}
                  className={`input-field py-1.5 text-sm ${errors.locationId ? 'border-red-500' : ''}`}
                >
                  <option value="">Select location</option>
                  {locations.filter(l => l.isActive).map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
                {errors.locationId && (
                  <p className="text-red-500 text-xs mt-0.5">{errors.locationId}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('packages.courier')}
                </label>
                <input
                  type="text"
                  name="courierName"
                  value={formData.courierName}
                  onChange={handleChange}
                  className="input-field py-1.5 text-sm"
                  placeholder="JNE, SiCepat, etc."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('packages.size')}
                </label>
                <select
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  className="input-field py-1.5 text-sm"
                >
                  <option value="small">{t('size.small')}</option>
                  <option value="medium">{t('size.medium')}</option>
                  <option value="large">{t('size.large')}</option>
                  <option value="extra_large">{t('size.extra_large')}</option>
                </select>
              </div>
            </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('packages.photo')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center"
                  >
                    <Camera className="h-4 w-4 mr-1.5" />
                    {t('packages.uploadPhoto')}
                  </label>
                  {formData.photoUrl && (
                    <img
                      src={formData.photoUrl}
                      alt="Package"
                      className="h-12 w-12 object-cover rounded border border-gray-300"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('packages.notes')}
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={2}
                  className="input-field py-1.5 text-sm"
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-3 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
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
