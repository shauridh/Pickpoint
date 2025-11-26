import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, TrendingUp, Package, Layers, Clock } from 'lucide-react';
import { addLocation, updateLocation } from '@/services/storage.service';
import { Location, PricingScheme } from '@/types';

interface LocationModalProps {
  location?: Location;
  onClose: () => void;
}

const LocationModal: React.FC<LocationModalProps> = ({ location, onClose }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    pricingScheme: 'flat' as PricingScheme,
    gracePeriod: 0,
    // Flat - per day
    flatDailyPrice: 5000,
    // Progressive - entry + next days
    progressiveEntryPrice: 10000,
    progressiveNextDayPrice: 5000,
    // Flat Size
    flatSizeSmall: 3000,
    flatSizeMedium: 5000,
    flatSizeLarge: 8000,
    flatSizeExtraLarge: 12000,
    // Progressive Item
    progressiveItemFirstPrice: 10000,
    progressiveItemNextPrice: 5000,
    // Add-ons
    deliveryEnabled: false,
    deliveryPrice: 10000,
    membershipEnabled: false,
    membershipPrice: 100000,
  });

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        pricingScheme: location.pricingScheme,
        gracePeriod: location.gracePeriod || 0,
        flatDailyPrice: location.flatDailyPrice || 5000,
        progressiveEntryPrice: location.progressiveEntryPrice || 10000,
        progressiveNextDayPrice: location.progressiveNextDayPrice || 5000,
        flatSizeSmall: location.sizeBasedPrices?.small || 3000,
        flatSizeMedium: location.sizeBasedPrices?.medium || 5000,
        flatSizeLarge: location.sizeBasedPrices?.large || 8000,
        flatSizeExtraLarge: location.sizeBasedPrices?.extra_large || 12000,
        progressiveItemFirstPrice: location.progressiveItemFirstPrice || 10000,
        progressiveItemNextPrice: location.progressiveItemNextPrice || 5000,
        deliveryEnabled: location.deliveryEnabled || false,
        deliveryPrice: location.deliveryPrice || 10000,
        membershipEnabled: location.membershipEnabled || false,
        membershipPrice: location.membershipPrice || 100000,
      });
    }
  }, [location]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const locationData: Partial<Location> = {
      name: formData.name,
      address: '', // Default empty
      pricingScheme: formData.pricingScheme,
      gracePeriod: formData.gracePeriod,
      isActive: true, // Default active
      memberDiscount: 0, // No member discount
      deliveryEnabled: formData.deliveryEnabled,
      deliveryPrice: formData.deliveryEnabled ? formData.deliveryPrice : undefined,
      membershipEnabled: formData.membershipEnabled,
      membershipPrice: formData.membershipEnabled ? formData.membershipPrice : undefined,
    };

    // Add pricing data based on scheme
    if (formData.pricingScheme === 'flat') {
      locationData.flatDailyPrice = formData.flatDailyPrice;
    } else if (formData.pricingScheme === 'progressive') {
      locationData.progressiveEntryPrice = formData.progressiveEntryPrice;
      locationData.progressiveNextDayPrice = formData.progressiveNextDayPrice;
    } else if (formData.pricingScheme === 'flat_size') {
      locationData.sizeBasedPrices = {
        small: formData.flatSizeSmall,
        medium: formData.flatSizeMedium,
        large: formData.flatSizeLarge,
        extra_large: formData.flatSizeExtraLarge,
      };
    } else if (formData.pricingScheme === 'progressive_item') {
      locationData.progressiveItemFirstPrice = formData.progressiveItemFirstPrice;
      locationData.progressiveItemNextPrice = formData.progressiveItemNextPrice;
    }

    if (location) {
      updateLocation(location.id, locationData);
    } else {
      addLocation(locationData);
    }

    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-900/75 backdrop-blur-sm" onClick={onClose} />

        <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {location ? 'Edit Location' : 'Add New Location'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-gradient-to-r from-blue-500 to-indigo-500">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-bold text-gray-900">Basic Information</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Main Branch, Tower A"
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            {/* Pricing Scheme */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-gradient-to-r from-emerald-500 to-teal-500">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-bold text-gray-900">Pricing Configuration</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grace Period (Jam) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="24"
                  placeholder="0"
                  className="input-field"
                  value={formData.gracePeriod}
                  onChange={(e) => setFormData({ ...formData, gracePeriod: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Waktu gratis sebelum dikenakan biaya (dalam jam)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pricing Scheme *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, pricingScheme: 'flat' })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.pricingScheme === 'flat'
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Clock className={`h-6 w-6 mx-auto mb-2 ${formData.pricingScheme === 'flat' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <p className={`text-sm font-semibold ${formData.pricingScheme === 'flat' ? 'text-blue-900' : 'text-gray-700'}`}>
                      Flat
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Harga per hari</p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, pricingScheme: 'progressive' })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.pricingScheme === 'progressive'
                        ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <TrendingUp className={`h-6 w-6 mx-auto mb-2 ${formData.pricingScheme === 'progressive' ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <p className={`text-sm font-semibold ${formData.pricingScheme === 'progressive' ? 'text-emerald-900' : 'text-gray-700'}`}>
                      Progressive
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Masuk + hari berikutnya</p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, pricingScheme: 'flat_size' })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.pricingScheme === 'flat_size'
                        ? 'border-purple-500 bg-purple-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Layers className={`h-6 w-6 mx-auto mb-2 ${formData.pricingScheme === 'flat_size' ? 'text-purple-600' : 'text-gray-400'}`} />
                    <p className={`text-sm font-semibold ${formData.pricingScheme === 'flat_size' ? 'text-purple-900' : 'text-gray-700'}`}>
                      Flat Size
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Berdasarkan ukuran</p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, pricingScheme: 'progressive_item' })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.pricingScheme === 'progressive_item'
                        ? 'border-amber-500 bg-amber-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Package className={`h-6 w-6 mx-auto mb-2 ${formData.pricingScheme === 'progressive_item' ? 'text-amber-600' : 'text-gray-400'}`} />
                    <p className={`text-sm font-semibold ${formData.pricingScheme === 'progressive_item' ? 'text-amber-900' : 'text-gray-700'}`}>
                      Progressive Item
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Pertama + berikutnya</p>
                  </button>
                </div>
              </div>

              {/* Flat - Per Day */}
              {formData.pricingScheme === 'flat' && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Harga Per Hari (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    placeholder="5000"
                    className="input-field"
                    value={formData.flatDailyPrice}
                    onChange={(e) => setFormData({ ...formData, flatDailyPrice: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-blue-600 mt-2">
                    Biaya tetap per hari untuk setiap paket
                  </p>
                </div>
              )}

              {/* Progressive - Entry + Next Days */}
              {formData.pricingScheme === 'progressive' && (
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-emerald-900 mb-2">
                      Harga Masuk (Rp) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      placeholder="10000"
                      className="input-field"
                      value={formData.progressiveEntryPrice}
                      onChange={(e) => setFormData({ ...formData, progressiveEntryPrice: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-emerald-900 mb-2">
                      Harga Hari Berikutnya (Rp) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      placeholder="5000"
                      className="input-field"
                      value={formData.progressiveNextDayPrice}
                      onChange={(e) => setFormData({ ...formData, progressiveNextDayPrice: parseInt(e.target.value) })}
                    />
                  </div>
                  <p className="text-xs text-emerald-600">
                    Biaya masuk + biaya per hari berikutnya
                  </p>
                </div>
              )}

              {/* Flat Size */}
              {formData.pricingScheme === 'flat_size' && (
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 space-y-3">
                  <label className="block text-sm font-medium text-purple-900 mb-2">
                    Harga Berdasarkan Ukuran *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-purple-700 mb-1">Small (Rp)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="1000"
                        placeholder="3000"
                        className="input-field text-sm"
                        value={formData.flatSizeSmall}
                        onChange={(e) => setFormData({ ...formData, flatSizeSmall: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-purple-700 mb-1">Medium (Rp)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="1000"
                        placeholder="5000"
                        className="input-field text-sm"
                        value={formData.flatSizeMedium}
                        onChange={(e) => setFormData({ ...formData, flatSizeMedium: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-purple-700 mb-1">Large (Rp)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="1000"
                        placeholder="8000"
                        className="input-field text-sm"
                        value={formData.flatSizeLarge}
                        onChange={(e) => setFormData({ ...formData, flatSizeLarge: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-purple-700 mb-1">Extra Large (Rp)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="1000"
                        placeholder="12000"
                        className="input-field text-sm"
                        value={formData.flatSizeExtraLarge}
                        onChange={(e) => setFormData({ ...formData, flatSizeExtraLarge: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-purple-600">
                    Field Size akan muncul saat input paket
                  </p>
                </div>
              )}

              {/* Progressive Item */}
              {formData.pricingScheme === 'progressive_item' && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-amber-900 mb-2">
                      Harga Paket Pertama (Rp) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      placeholder="10000"
                      className="input-field"
                      value={formData.progressiveItemFirstPrice}
                      onChange={(e) => setFormData({ ...formData, progressiveItemFirstPrice: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-900 mb-2">
                      Harga Paket Berikutnya (Rp) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      placeholder="5000"
                      className="input-field"
                      value={formData.progressiveItemNextPrice}
                      onChange={(e) => setFormData({ ...formData, progressiveItemNextPrice: parseInt(e.target.value) })}
                    />
                  </div>
                  <p className="text-xs text-amber-600">
                    Cut off jam 23:59 - paket masuk setelah cut off dihitung hari berikutnya
                  </p>
                </div>
              )}
            </div>

            {/* Add-ons */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-gradient-to-r from-pink-500 to-rose-500">
                <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg shadow-lg">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-bold text-gray-900">Add-ons</h4>
              </div>

              {/* Delivery */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="deliveryEnabled"
                    checked={formData.deliveryEnabled}
                    onChange={(e) => setFormData({ ...formData, deliveryEnabled: e.target.checked })}
                    className="rounded w-5 h-5"
                  />
                  <label htmlFor="deliveryEnabled" className="text-sm font-semibold text-gray-900 cursor-pointer">
                    Pengantaran
                  </label>
                </div>
                {formData.deliveryEnabled && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Harga Pengantaran (Rp) *</label>
                    <input
                      type="number"
                      required={formData.deliveryEnabled}
                      min="0"
                      step="1000"
                      placeholder="10000"
                      className="input-field text-sm"
                      value={formData.deliveryPrice}
                      onChange={(e) => setFormData({ ...formData, deliveryPrice: parseInt(e.target.value) })}
                    />
                  </div>
                )}
              </div>

              {/* Membership */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="membershipEnabled"
                    checked={formData.membershipEnabled}
                    onChange={(e) => setFormData({ ...formData, membershipEnabled: e.target.checked })}
                    className="rounded w-5 h-5"
                  />
                  <label htmlFor="membershipEnabled" className="text-sm font-semibold text-gray-900 cursor-pointer">
                    Membership
                  </label>
                </div>
                {formData.membershipEnabled && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Harga Membership (Rp) *</label>
                    <input
                      type="number"
                      required={formData.membershipEnabled}
                      min="0"
                      step="10000"
                      placeholder="100000"
                      className="input-field text-sm"
                      value={formData.membershipPrice}
                      onChange={(e) => setFormData({ ...formData, membershipPrice: parseInt(e.target.value) })}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {location ? t('common.save') : 'Create Location'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
