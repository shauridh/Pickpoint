import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Edit, Trash2, Crown } from 'lucide-react';
import { getCustomers, deleteCustomer } from '@/services/storage.service';
import { Customer } from '@/types';
import CustomerModal from '@/components/CustomerModal';
import { format, isAfter } from 'date-fns';

const Customers: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();

  const customers = getCustomers();

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.unitNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const handleDelete = (id: string) => {
    if (confirm(t('common.confirm') + '?')) {
      deleteCustomer(id);
      window.location.reload();
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCustomer(undefined);
  };

  const isActiveMember = (customer: Customer) => {
    return customer.isPremiumMember && 
           customer.membershipEndDate && 
           isAfter(new Date(customer.membershipEndDate), new Date());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('customers.title')}</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          {t('customers.addNew')}
        </button>
      </div>

      {/* Search */}
      <div className="card">
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

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>{t('customers.name')}</th>
              <th>{t('customers.phone')}</th>
              <th>{t('customers.unitNumber')}</th>
              <th>{t('customers.email')}</th>
              <th>{t('customers.premiumMember')}</th>
              <th>{t('customers.notifications')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  {t('common.noData')}
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="font-medium">
                    <div className="flex items-center">
                      {customer.name}
                      {isActiveMember(customer) && (
                        <Crown className="h-4 w-4 ml-2 text-yellow-500" />
                      )}
                    </div>
                  </td>
                  <td>{customer.phone}</td>
                  <td>{customer.unitNumber}</td>
                  <td>{customer.email || '-'}</td>
                  <td>
                    {customer.isPremiumMember ? (
                      <div>
                        <span className={`badge ${isActiveMember(customer) ? 'badge-success' : 'badge-warning'}`}>
                          {isActiveMember(customer) ? 'Active' : 'Expired'}
                        </span>
                        {customer.membershipEndDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            Until: {format(new Date(customer.membershipEndDate), 'dd/MM/yyyy')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td>
                    {customer.notificationEnabled ? (
                      <span className="badge badge-success">Yes</span>
                    ) : (
                      <span className="badge badge-danger">No</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(customer)}
                        className="text-blue-600 hover:text-blue-700"
                        title={t('common.edit')}
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="text-red-600 hover:text-red-700"
                        title={t('common.delete')}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <CustomerModal
          customer={editingCustomer}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default Customers;
