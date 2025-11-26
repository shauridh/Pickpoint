import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Filter,
  Package as PackageIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  getPackages, 
  getCustomers, 
  getLocations, 
  deletePackage,
  updatePackage,
  bulkUpdatePackages,
} from '@/services/storage.service';
import { Package, PackageStatus } from '@/types';
import PackageModal from '@/components/PackageModal';

const Packages: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PackageStatus | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | undefined>();
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);

  const packages = getPackages();
  const customers = getCustomers();
  const locations = getLocations();

  const filteredPackages = useMemo(() => {
    return packages.filter(pkg => {
      const customer = customers.find(c => c.id === pkg.customerId);
      
      const matchesSearch = 
        pkg.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.pickupCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || pkg.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [packages, customers, locations, searchTerm, statusFilter]);

  const handleDelete = (id: string) => {
    if (confirm(t('common.confirm') + '?')) {
      deletePackage(id);
      window.location.reload();
    }
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingPackage(undefined);
  };

  const handleMarkAsPickedUp = (id: string) => {
    updatePackage(id, {
      status: 'picked_up',
      pickedUpAt: new Date().toISOString(),
    });
    window.location.reload();
  };

  const handleMarkAsDestroyed = (id: string) => {
    if (confirm(t('common.confirm') + '?')) {
      updatePackage(id, {
        status: 'destroyed',
        destroyedAt: new Date().toISOString(),
      });
      window.location.reload();
    }
  };

  const handleBulkPickup = () => {
    if (selectedPackages.length === 0) return;
    
    if (confirm(`${t('packages.bulkPickup')} ${selectedPackages.length} paket?`)) {
      bulkUpdatePackages(selectedPackages, {
        status: 'picked_up',
        pickedUpAt: new Date().toISOString(),
      });
      setSelectedPackages([]);
      window.location.reload();
    }
  };

  const toggleSelectPackage = (id: string) => {
    setSelectedPackages(prev =>
      prev.includes(id)
        ? prev.filter(pkgId => pkgId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPackages.length === filteredPackages.filter(p => p.status === 'arrived').length) {
      setSelectedPackages([]);
    } else {
      setSelectedPackages(filteredPackages.filter(p => p.status === 'arrived').map(p => p.id));
    }
  };

  const getStatusBadge = (status: PackageStatus) => {
    switch (status) {
      case 'arrived':
        return <span className="badge badge-info">{t('status.arrived')}</span>;
      case 'picked_up':
        return <span className="badge badge-success">{t('status.picked_up')}</span>;
      case 'destroyed':
        return <span className="badge badge-danger">{t('status.destroyed')}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('packages.title')}</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          {t('packages.addNew')}
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('common.search') + '...'}
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                className="input-field pl-10 pr-8"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PackageStatus | 'all')}
              >
                <option value="all">{t('common.filter')}: All</option>
                <option value="arrived">{t('status.arrived')}</option>
                <option value="picked_up">{t('status.picked_up')}</option>
                <option value="destroyed">{t('status.destroyed')}</option>
              </select>
            </div>
            
            {selectedPackages.length > 0 && (
              <button
                onClick={handleBulkPickup}
                className="btn-primary flex items-center whitespace-nowrap"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                {t('packages.bulkPickup')} ({selectedPackages.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedPackages.length === filteredPackages.filter(p => p.status === 'arrived').length && filteredPackages.filter(p => p.status === 'arrived').length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>
              <th>{t('packages.trackingNumber')}</th>
              <th>{t('packages.pickupCode')}</th>
              <th>{t('packages.customer')}</th>
              <th>{t('packages.location')}</th>
              <th>{t('packages.size')}</th>
              <th>{t('packages.status')}</th>
              <th>{t('packages.arrivedAt')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPackages.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-500">
                  <PackageIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  {t('common.noData')}
                </td>
              </tr>
            ) : (
              filteredPackages.map((pkg) => {
                const customer = customers.find(c => c.id === pkg.customerId);
                const location = locations.find(l => l.id === pkg.locationId);
                
                return (
                  <tr key={pkg.id} className="hover:bg-gray-50">
                    <td>
                      {pkg.status === 'arrived' && (
                        <input
                          type="checkbox"
                          checked={selectedPackages.includes(pkg.id)}
                          onChange={() => toggleSelectPackage(pkg.id)}
                          className="rounded"
                        />
                      )}
                    </td>
                    <td className="font-medium">{pkg.trackingNumber}</td>
                    <td>
                      <span className="font-mono text-primary-600 font-semibold">
                        {pkg.pickupCode}
                      </span>
                    </td>
                    <td>{customer?.name || '-'}</td>
                    <td>{location?.name || '-'}</td>
                    <td>{t(`size.${pkg.size}`)}</td>
                    <td>{getStatusBadge(pkg.status)}</td>
                    <td>{format(new Date(pkg.arrivedAt), 'dd/MM/yyyy HH:mm')}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {pkg.status === 'arrived' && (
                          <>
                            <button
                              onClick={() => handleMarkAsPickedUp(pkg.id)}
                              className="text-green-600 hover:text-green-700"
                              title={t('packages.markAsPickedUp')}
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleEdit(pkg)}
                              className="text-blue-600 hover:text-blue-700"
                              title={t('common.edit')}
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleMarkAsDestroyed(pkg.id)}
                              className="text-red-600 hover:text-red-700"
                              title={t('packages.markAsDestroyed')}
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(pkg.id)}
                          className="text-red-600 hover:text-red-700"
                          title={t('common.delete')}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <PackageModal
          package={editingPackage}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default Packages;
