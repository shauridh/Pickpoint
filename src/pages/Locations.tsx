import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin,
  DollarSign,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { 
  getLocations, 
  deleteLocation,
} from '@/services/storage.service';
import { Location } from '@/types';
import LocationModal from '@/components/LocationModal';

const Locations: React.FC = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | undefined>();

  const locations = getLocations();

  const handleDelete = (id: string) => {
    if (confirm(t('common.confirm') + '?')) {
      deleteLocation(id);
      window.location.reload();
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingLocation(undefined);
  };

  const getPricingSchemeLabel = (scheme: string) => {
    switch (scheme) {
      case 'flat':
        return 'Flat (Per Hari)';
      case 'progressive':
        return 'Progressive';
      case 'flat_size':
        return 'Flat Size';
      case 'progressive_item':
        return 'Progressive Item';
      default:
        return scheme;
    }
  };

  const getPricingSchemeIcon = (scheme: string) => {
    switch (scheme) {
      case 'flat':
        return <DollarSign className="h-5 w-5" />;
      case 'progressive':
        return <TrendingUp className="h-5 w-5" />;
      case 'flat_size':
        return <Layers className="h-5 w-5" />;
      case 'progressive_item':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <DollarSign className="h-5 w-5" />;
    }
  };

  const getPricingDetails = (location: Location) => {
    switch (location.pricingScheme) {
      case 'flat':
        return `Rp ${location.flatDailyPrice?.toLocaleString('id-ID') || 0}/hari`;
      case 'progressive':
        return `Masuk: Rp ${location.progressiveEntryPrice?.toLocaleString('id-ID') || 0} + Rp ${location.progressiveNextDayPrice?.toLocaleString('id-ID') || 0}/hari`;
      case 'flat_size':
        return 'Berdasarkan ukuran paket';
      case 'progressive_item':
        return `Pertama: Rp ${location.progressiveItemFirstPrice?.toLocaleString('id-ID') || 0} + Rp ${location.progressiveItemNextPrice?.toLocaleString('id-ID') || 0}`;
      default:
        return '-';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {t('nav.locations')}
          </h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Location
        </button>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">{t('common.noData')}</p>
          </div>
        ) : (
          locations.map((location) => (
            <div
              key={location.id}
              className="card backdrop-blur-sm bg-white/90 border border-indigo-100/50 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{location.name}</h3>
                    {location.isActive ? (
                      <span className="badge badge-success text-xs">Active</span>
                    ) : (
                      <span className="badge badge-secondary text-xs">Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{location.address}</p>
                  {location.phone && (
                    <p className="text-sm text-gray-500 mt-1">{location.phone}</p>
                  )}
                </div>
              </div>

              {/* Pricing Info */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-indigo-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-white rounded-lg shadow-sm">
                    {getPricingSchemeIcon(location.pricingScheme)}
                  </div>
                  <span className="text-sm font-semibold text-indigo-900">
                    {getPricingSchemeLabel(location.pricingScheme)}
                  </span>
                </div>
                <p className="text-sm font-bold text-indigo-600 mb-2">
                  {getPricingDetails(location)}
                </p>
                {location.gracePeriod && location.gracePeriod > 0 && (
                  <p className="text-xs text-emerald-600 font-medium">
                    Grace Period: {location.gracePeriod} jam gratis
                  </p>
                )}
              </div>

              {/* Size Based Preview */}
              {location.pricingScheme === 'flat_size' && location.sizeBasedPrices && (
                <div className="mb-4 grid grid-cols-2 gap-2">
                  <div className="text-xs bg-gray-50 px-2 py-1 rounded">
                    <span className="text-gray-500">Small:</span>
                    <span className="font-semibold ml-1">Rp {location.sizeBasedPrices.small.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="text-xs bg-gray-50 px-2 py-1 rounded">
                    <span className="text-gray-500">Medium:</span>
                    <span className="font-semibold ml-1">Rp {location.sizeBasedPrices.medium.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="text-xs bg-gray-50 px-2 py-1 rounded">
                    <span className="text-gray-500">Large:</span>
                    <span className="font-semibold ml-1">Rp {location.sizeBasedPrices.large.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="text-xs bg-gray-50 px-2 py-1 rounded">
                    <span className="text-gray-500">X-Large:</span>
                    <span className="font-semibold ml-1">Rp {location.sizeBasedPrices.extra_large.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}

              {/* Add-ons */}
              {(location.deliveryEnabled || location.membershipEnabled) && (
                <div className="mb-4 space-y-1">
                  {location.deliveryEnabled && (
                    <div className="flex justify-between items-center text-xs bg-green-50 px-2 py-1.5 rounded border border-green-200">
                      <span className="text-green-700 font-medium">Pengantaran</span>
                      <span className="font-semibold text-green-900">Rp {location.deliveryPrice?.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {location.membershipEnabled && (
                    <div className="flex justify-between items-center text-xs bg-amber-50 px-2 py-1.5 rounded border border-amber-200">
                      <span className="text-amber-700 font-medium">Membership</span>
                      <span className="font-semibold text-amber-900">Rp {location.membershipPrice?.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(location)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  {t('common.edit')}
                </button>
                <button
                  onClick={() => handleDelete(location.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <LocationModal
          location={editingLocation}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default Locations;
