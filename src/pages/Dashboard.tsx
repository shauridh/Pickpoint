import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Package, 
  PackageCheck, 
  PackageX, 
  Users, 
  TrendingUp,
  Calendar,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Filter,
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  getPackages, 
  getCustomers, 
  getLocations,
  deletePackage,
  updatePackage,
  bulkUpdatePackages,
} from '@/services/storage.service';
import { calculatePackagePrice } from '@/services/pricing.service';
import { format, startOfDay, subDays, isAfter, startOfWeek, startOfMonth } from 'date-fns';
import { DashboardMetrics, PackageStatus } from '@/types';
import PackageModal from '@/components/PackageModal';

type TimeFilter = 'today' | 'week' | 'month' | 'all';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PackageStatus | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>();
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);

  const getFilterDate = () => {
    const today = startOfDay(new Date());
    switch (timeFilter) {
      case 'today':
        return today;
      case 'week':
        return startOfWeek(today, { weekStartsOn: 1 });
      case 'month':
        return startOfMonth(today);
      default:
        return null;
    }
  };

  const metrics = useMemo<DashboardMetrics>(() => {
    const packages = getPackages();
    const customers = getCustomers();
    const locations = getLocations();
    
    const today = startOfDay(new Date());
    const last7Days = subDays(today, 7);
    const last30Days = subDays(today, 30);
    const filterDate = getFilterDate();

    // Filter packages by time range
    const filteredPackages = filterDate 
      ? packages.filter(p => isAfter(new Date(p.arrivedAt), filterDate))
      : packages;

    // Package stats
    const totalArrived = filteredPackages.filter(p => p.status === 'arrived' || p.status === 'picked_up').length;
    const totalPickedUp = filteredPackages.filter(p => p.status === 'picked_up').length;
    const totalDestroyed = filteredPackages.filter(p => p.status === 'destroyed').length;
    const currentInventory = filteredPackages.filter(p => p.status === 'arrived').length;
    
    const todayArrived = packages.filter(p => 
      p.status !== 'destroyed' && isAfter(new Date(p.arrivedAt), today)
    ).length;
    
    const todayPickedUp = packages.filter(p => 
      p.pickedUpAt && isAfter(new Date(p.pickedUpAt), today)
    ).length;

    // Revenue calculation
    const calculateRevenue = (pkgs: typeof packages) => {
      return pkgs.reduce((sum, pkg) => {
        if (pkg.status !== 'picked_up') return sum;
        
        const customer = customers.find(c => c.id === pkg.customerId);
        const location = locations.find(l => l.id === pkg.locationId);
        
        if (!customer || !location) return sum;
        
        const pricing = calculatePackagePrice(pkg, location, customer);
        return sum + pricing.finalPrice;
      }, 0);
    };

    const todayRevenue = calculateRevenue(
      packages.filter(p => p.pickedUpAt && isAfter(new Date(p.pickedUpAt), today))
    );
    
    const weekRevenue = calculateRevenue(
      packages.filter(p => p.pickedUpAt && isAfter(new Date(p.pickedUpAt), last7Days))
    );
    
    const monthRevenue = calculateRevenue(
      packages.filter(p => p.pickedUpAt && isAfter(new Date(p.pickedUpAt), last30Days))
    );
    
    const totalRevenue = calculateRevenue(filteredPackages.filter(p => p.status === 'picked_up'));

    // Active members
    const activeMembers = customers.filter(c => 
      c.isPremiumMember && 
      c.membershipEndDate && 
      isAfter(new Date(c.membershipEndDate), new Date())
    ).length;

    return {
      packages: {
        totalArrived,
        totalPickedUp,
        totalDestroyed,
        currentInventory,
        todayArrived,
        todayPickedUp,
      },
      revenue: {
        today: todayRevenue,
        thisWeek: weekRevenue,
        thisMonth: monthRevenue,
        total: totalRevenue,
      },
      activeMembers,
      totalCustomers: customers.length,
    };
  }, [timeFilter]);

  // Package management functions
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
  }, [packages, customers, searchTerm, statusFilter]);

  const handleDelete = (id: string) => {
    if (confirm(t('common.confirm') + '?')) {
      deletePackage(id);
      window.location.reload();
    }
  };

  const handleEdit = (pkg: any) => {
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

  // Chart data
  const chartData = useMemo(() => {
    const packages = getPackages();
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'MM/dd');
      
      const arrived = packages.filter(p => 
        format(new Date(p.arrivedAt), 'MM/dd') === dateStr
      ).length;
      
      const pickedUp = packages.filter(p => 
        p.pickedUpAt && format(new Date(p.pickedUpAt), 'MM/dd') === dateStr
      ).length;
      
      data.push({
        date: dateStr,
        arrived,
        pickedUp,
      });
    }
    
    return data;
  }, []);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    gradient: string;
  }> = ({ title, value, icon, gradient }) => (
    <div className={`stat-card ${gradient}`}>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
            {icon}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-white/80 uppercase tracking-wide">{title}</p>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-4xl font-bold text-white drop-shadow-lg">{value}</p>
        </div>
      </div>
      <div className="absolute bottom-0 right-0 opacity-10">
        <div className="w-32 h-32">
          {icon}
        </div>
      </div>
    </div>
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {t('dashboard.title')}
          </h1>
          <p className="text-sm text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Filter */}
          <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-1 shadow-lg">
            <button
              onClick={() => setTimeFilter('today')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                timeFilter === 'today'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('dashboard.today')}
            </button>
            <button
              onClick={() => setTimeFilter('week')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                timeFilter === 'week'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('dashboard.thisWeek')}
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                timeFilter === 'month'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('dashboard.thisMonth')}
            </button>
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                timeFilter === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All Time
            </button>
          </div>
          
          <div className="flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-lg">
            <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
            <span className="text-sm font-medium text-gray-700">{format(new Date(), 'dd MMM yyyy')}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('dashboard.todayArrived')}
          value={metrics.packages.todayArrived}
          icon={<Package className="h-8 w-8" />}
          gradient="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600"
        />
        <StatCard
          title={t('dashboard.todayPickedUp')}
          value={metrics.packages.todayPickedUp}
          icon={<PackageCheck className="h-8 w-8" />}
          gradient="bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600"
        />
        <StatCard
          title={t('dashboard.currentInventory')}
          value={metrics.packages.currentInventory}
          icon={<PackageX className="h-8 w-8" />}
          gradient="bg-gradient-to-br from-amber-500 via-orange-600 to-red-600"
        />
        <StatCard
          title={t('dashboard.activeMembers')}
          value={metrics.activeMembers}
          icon={<Users className="h-8 w-8" />}
          gradient="bg-gradient-to-br from-purple-500 via-pink-600 to-rose-600"
        />
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 text-white shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold opacity-90 uppercase tracking-wide">{t('dashboard.revenue')} - {t('dashboard.today')}</p>
              <TrendingUp className="h-6 w-6 animate-pulse" />
            </div>
            <p className="text-3xl font-bold drop-shadow-lg">{formatCurrency(metrics.revenue.today)}</p>
          </div>
          <div className="absolute -bottom-4 -right-4 opacity-10">
            <TrendingUp className="h-32 w-32" />
          </div>
        </div>
        
        <div className="card hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              {t('dashboard.revenue')} - {t('dashboard.thisWeek')}
            </p>
            <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {formatCurrency(metrics.revenue.thisWeek)}
          </p>
        </div>
        
        <div className="card hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              {t('dashboard.revenue')} - {t('dashboard.thisMonth')}
            </p>
            <div className="p-2 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-teal-600" />
            </div>
          </div>
          <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {formatCurrency(metrics.revenue.thisMonth)}
          </p>
        </div>
        
        <div className="card hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              {t('dashboard.revenue')} - {t('dashboard.total')}
            </p>
            <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {formatCurrency(metrics.revenue.total)}
          </p>
        </div>
      </div>

      {/* Charts removed as requested; will be placed in Reports */}

      {/* Package Management Section */}
      <div className="space-y-4 mt-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t('packages.title')}
            </h2>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            {t('packages.addNew')}
          </button>
        </div>

        {/* Package Filters (collapsible) */}
        <div className="card backdrop-blur-sm bg-white/90 border border-indigo-100/50 shadow-xl">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer select-none list-none">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-indigo-900">{t('common.filters')}</span>
              </div>
              <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg group-open:hidden">{t('common.show')}</span>
              <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg hidden group-open:inline">{t('common.hide')}</span>
            </summary>
            <div className="mt-4 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-indigo-400" />
                <input
                  type="text"
                  placeholder={t('common.search') + '...'}
                  className="input-field pl-10 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500"
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
          </details>
        </div>

        {/* Package Table */}
        <div className="card backdrop-blur-sm bg-white/90 border border-indigo-100/50 shadow-xl overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedPackages.length === filteredPackages.filter(p => p.status === 'arrived').length && filteredPackages.filter(p => p.status === 'arrived').length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="text-indigo-900 font-semibold">{t('packages.trackingNumber')}</th>
                  <th className="text-indigo-900 font-semibold">{t('packages.pickupCode')}</th>
                  <th className="text-indigo-900 font-semibold">{t('packages.customer')}</th>
                  <th className="text-indigo-900 font-semibold">{t('packages.location')}</th>
                  <th className="text-indigo-900 font-semibold">{t('packages.size')}</th>
                  <th className="text-indigo-900 font-semibold">{t('packages.status')}</th>
                  <th className="text-indigo-900 font-semibold">{t('packages.arrivedAt')}</th>
                  <th className="w-32 text-indigo-900 font-semibold">{t('common.actions')}</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-indigo-100">
              {filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full mb-4">
                        <Package className="h-12 w-12 text-indigo-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-600">{t('common.noData')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPackages.map((pkg) => {
                  const customer = customers.find(c => c.id === pkg.customerId);
                  const location = locations.find(l => l.id === pkg.locationId);
                  
                  return (
                    <tr key={pkg.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200">
                      <td>
                        {pkg.status === 'arrived' && (
                          <input
                            type="checkbox"
                            checked={selectedPackages.includes(pkg.id)}
                            onChange={() => toggleSelectPackage(pkg.id)}
                            className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        )}
                      </td>
                      <td className="font-semibold text-gray-900">{pkg.trackingNumber}</td>
                      <td>
                        <span className="font-mono bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold">
                          {pkg.pickupCode}
                        </span>
                      </td>
                      <td className="text-gray-700">{customer?.name || '-'}</td>
                      <td className="text-gray-700">{location?.name || '-'}</td>
                      <td className="text-gray-700">{t(`size.${pkg.size}`)}</td>
                      <td>{getStatusBadge(pkg.status)}</td>
                      <td className="text-gray-600">{format(new Date(pkg.arrivedAt), 'dd/MM/yyyy HH:mm')}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          {pkg.status === 'arrived' && (
                            <>
                              <button
                                onClick={() => handleMarkAsPickedUp(pkg.id)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200 hover:scale-110"
                                title={t('packages.markAsPickedUp')}
                              >
                                <CheckCircle className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleEdit(pkg)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                                title={t('common.edit')}
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleMarkAsDestroyed(pkg.id)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-all duration-200 hover:scale-110"
                                title={t('packages.markAsDestroyed')}
                              >
                                <XCircle className="h-5 w-5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(pkg.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
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
        </div>
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

export default Dashboard;
