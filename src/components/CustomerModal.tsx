import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Crown, Info } from 'lucide-react';
import { Customer } from '@/types';
import { addCustomer, updateCustomer, getLocations } from '@/services/storage.service';
import { sendMembershipActivationNotification } from '@/services/whatsapp.service';
import { generateId, validatePhone } from '@/utils/helpers';
import { addMonths } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface CustomerModalProps {
  customer?: Customer;
  onClose: () => void;
}

const CustomerModal: React.FC<CustomerModalProps> = ({ customer: editCustomer, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const locations = getLocations();
  const isAdmin = user?.role === 'admin';

  const [formData, setFormData] = useState({
    name: editCustomer?.name || '',
    phone: editCustomer?.phone || '',
    unitNumber: editCustomer?.unitNumber || '',
    locationId: editCustomer?.locationId || (isAdmin ? '' : user?.locationId || ''),
    isPremiumMember: editCustomer?.isPremiumMember || false,
    membershipStartDate: editCustomer?.membershipStartDate || '',
    membershipEndDate: editCustomer?.membershipEndDate || '',
    membershipDuration: 1, // Default 1 month
    notificationEnabled: true, // Always enabled for WhatsApp notifications
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showMembershipFields, setShowMembershipFields] = useState(editCustomer?.isPremiumMember || false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Required';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }
    if (!formData.unitNumber.trim()) newErrors.unitNumber = 'Required';
    if (!formData.locationId) newErrors.locationId = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);

    try {
      const wasNotPremium = editCustomer && !editCustomer.isPremiumMember;
      const isNowPremium = formData.isPremiumMember;

      if (editCustomer) {
        updateCustomer(editCustomer.id, formData);
      } else {
        const newCustomer: Customer = {
          id: generateId(),
          ...formData,
          createdAt: new Date().toISOString(),
        };
        addCustomer(newCustomer);
      }

      // Send membership activation notification
      if (wasNotPremium && isNowPremium && formData.notificationEnabled) {
        await sendMembershipActivationNotification(
          formData.name,
          formData.phone,
          formData.membershipStartDate,
          formData.membershipEndDate
        );
      }

      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Error saving customer');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const type = (e.target as HTMLInputElement).type;
    const checked = (e.target as HTMLInputElement).checked;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ ...prev, [name]: fieldValue }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Show/hide membership fields
    if (name === 'isPremiumMember') {
      setShowMembershipFields(checked);
      if (checked && !formData.membershipStartDate) {
        const start = new Date().toISOString().split('T')[0];
        const end = addMonths(new Date(), formData.membershipDuration).toISOString().split('T')[0];
        setFormData(prev => ({
          ...prev,
          membershipStartDate: start,
          membershipEndDate: end,
        }));
      }
    }
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const duration = parseInt(e.target.value);
    const start = formData.membershipStartDate || new Date().toISOString().split('T')[0];
    const end = addMonths(new Date(start), duration).toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      membershipDuration: duration,
      membershipStartDate: start,
      membershipEndDate: end,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-lg my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {editCustomer ? t('common.edit') : t('customers.addNew')}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('customers.name')} *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input-field ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('customers.phone')} *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
                  placeholder="081234567890"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('customers.unitNumber')} *
                </label>
                <input
                  type="text"
                  name="unitNumber"
                  value={formData.unitNumber}
                  onChange={handleChange}
                  className={`input-field ${errors.unitNumber ? 'border-red-500' : ''}`}
                  placeholder="A-101"
                />
                {errors.unitNumber && <p className="text-red-500 text-xs mt-1">{errors.unitNumber}</p>}
              </div>
            </div>

            {/* Location - Only for Admin */}
            {isAdmin ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lokasi *
                </label>
                <select
                  name="locationId"
                  value={formData.locationId}
                  onChange={handleChange}
                  className={`input-field ${errors.locationId ? 'border-red-500' : ''}`}
                >
                  <option value="">Pilih Lokasi</option>
                  {locations.filter(l => l.isActive).map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
                {errors.locationId && <p className="text-red-500 text-xs mt-1">{errors.locationId}</p>}
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Lokasi:</strong> {locations.find(l => l.id === formData.locationId)?.name || 'Tidak ditemukan'}
                </p>
                <p className="text-xs text-blue-600 mt-1">Lokasi disesuaikan dengan penempatan Anda</p>
              </div>
            )}

            <div className="flex items-center justify-between py-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isPremiumMember"
                  checked={formData.isPremiumMember}
                  onChange={handleChange}
                  className="rounded"
                />
                <Crown className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">
                  {t('customers.premiumMember')}
                </span>
              </label>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="text-xs">Notifikasi WhatsApp aktif otomatis</span>
              </div>
            </div>

            {showMembershipFields && (
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  {t('customers.membershipPeriod')}
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durasi Membership *
                  </label>
                  <select
                    value={formData.membershipDuration}
                    onChange={handleDurationChange}
                    className="input-field"
                  >
                    <option value={1}>1 Bulan</option>
                    <option value={3}>3 Bulan</option>
                    <option value={6}>6 Bulan</option>
                    <option value={12}>12 Bulan</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Membership akan aktif mulai hari ini untuk {formData.membershipDuration} bulan
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <button type="button" onClick={onClose} className="btn-secondary">
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50"
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

export default CustomerModal;
