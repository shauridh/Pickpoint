import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Crown } from 'lucide-react';
import { Customer } from '@/types';
import { addCustomer, updateCustomer } from '@/services/storage.service';
import { sendMembershipActivationNotification } from '@/services/whatsapp.service';
import { generateId, validateEmail, validatePhone } from '@/utils/helpers';
import { addMonths, addYears } from 'date-fns';

interface CustomerModalProps {
  customer?: Customer;
  onClose: () => void;
}

const CustomerModal: React.FC<CustomerModalProps> = ({ customer: editCustomer, onClose }) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    name: editCustomer?.name || '',
    phone: editCustomer?.phone || '',
    unitNumber: editCustomer?.unitNumber || '',
    email: editCustomer?.email || '',
    isPremiumMember: editCustomer?.isPremiumMember || false,
    membershipStartDate: editCustomer?.membershipStartDate || '',
    membershipEndDate: editCustomer?.membershipEndDate || '',
    notificationEnabled: editCustomer?.notificationEnabled ?? true,
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
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Invalid email';
    }

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
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
        const end = addYears(new Date(), 1).toISOString().split('T')[0];
        setFormData(prev => ({
          ...prev,
          membershipStartDate: start,
          membershipEndDate: end,
        }));
      }
    }
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('customers.email')}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                placeholder="customer@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div className="flex items-center space-x-4 py-2">
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

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="notificationEnabled"
                  checked={formData.notificationEnabled}
                  onChange={handleChange}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  {t('customers.notifications')}
                </span>
              </label>
            </div>

            {showMembershipFields && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  {t('customers.membershipPeriod')}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="membershipStartDate"
                      value={formData.membershipStartDate}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="membershipEndDate"
                      value={formData.membershipEndDate}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
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
