import React, { useState, useEffect } from 'react';
import { 
  Download, 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign, 
  Calendar,
  MapPin,
  BarChart3,
  PieChart,
  Filter
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns';
import { getPackages, getCustomers, getLocations } from '@/services/storage.service';
import { Package as PackageType, Customer, Location } from '@/types';
import { calculatePackagePrice } from '@/services/pricing.service';

const Reports: React.FC = () => {
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setPackages(getPackages());
    setCustomers(getCustomers());
    setLocations(getLocations());
  };

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return { start: new Date(now.setHours(0, 0, 0, 0)), end: new Date(now.setHours(23, 59, 59, 999)) };
      case 'week':
        return { start: subDays(now, 7), end: now };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'custom':
        return { start: startDate ? new Date(startDate) : startOfMonth(now), end: endDate ? new Date(endDate) : endOfMonth(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const filteredPackages = packages.filter(pkg => {
    const { start, end } = getDateRange();
    const pkgDate = new Date(pkg.arrivedAt);
    return pkgDate >= start && pkgDate <= end;
  });

  // Analytics calculations
  const analytics = {
    totalPackages: filteredPackages.length,
    arrivedPackages: filteredPackages.filter(p => p.status === 'arrived').length,
    pickedUpPackages: filteredPackages.filter(p => p.status === 'picked_up').length,
    destroyedPackages: filteredPackages.filter(p => p.status === 'destroyed').length,
    
    totalRevenue: filteredPackages.reduce((sum, pkg) => {
      const customer = customers.find(c => c.id === pkg.customerId);
      const location = locations.find(l => l.id === pkg.locationId);
      if (!customer || !location) return sum;
      const pricing = calculatePackagePrice(pkg, location, customer);
      return sum + (pkg.paymentStatus === 'paid' ? pricing.finalPrice : 0);
    }, 0),
    
    pendingRevenue: filteredPackages.reduce((sum, pkg) => {
      const customer = customers.find(c => c.id === pkg.customerId);
      const location = locations.find(l => l.id === pkg.locationId);
      if (!customer || !location) return sum;
      const pricing = calculatePackagePrice(pkg, location, customer);
      return sum + (pkg.paymentStatus === 'unpaid' ? pricing.finalPrice : 0);
    }, 0),
    
    paidPackages: filteredPackages.filter(p => p.paymentStatus === 'paid').length,
    unpaidPackages: filteredPackages.filter(p => p.paymentStatus === 'unpaid').length,
    
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => {
      return filteredPackages.some(p => p.customerId === c.id);
    }).length,
    premiumMembers: customers.filter(c => c.isPremiumMember).length,
    regularMembers: customers.filter(c => !c.isPremiumMember).length,
    
    totalLocations: locations.length,
    activeLocations: locations.filter(l => l.isActive).length,
    
    averagePackagePrice: filteredPackages.length > 0 
      ? filteredPackages.reduce((sum, pkg) => {
          const customer = customers.find(c => c.id === pkg.customerId);
          const location = locations.find(l => l.id === pkg.locationId);
          if (!customer || !location) return sum;
          const pricing = calculatePackagePrice(pkg, location, customer);
          return sum + pricing.finalPrice;
        }, 0) / filteredPackages.length
      : 0,
    
    pickupRate: filteredPackages.length > 0 
      ? (filteredPackages.filter(p => p.status === 'picked_up').length / filteredPackages.length) * 100
      : 0,
    
    paymentRate: filteredPackages.length > 0
      ? (filteredPackages.filter(p => p.paymentStatus === 'paid').length / filteredPackages.length) * 100
      : 0,
    
    // Per location breakdown
    locationBreakdown: locations.map(location => {
      const locationPackages = filteredPackages.filter(p => p.locationId === location.id);
      return {
        locationName: location.name,
        totalPackages: locationPackages.length,
        revenue: locationPackages.reduce((sum, pkg) => {
          const customer = customers.find(c => c.id === pkg.customerId);
          if (!customer) return sum;
          const pricing = calculatePackagePrice(pkg, location, customer);
          return sum + (pkg.paymentStatus === 'paid' ? pricing.finalPrice : 0);
        }, 0)
      };
    }),
    
    // Courier breakdown
    courierBreakdown: [...new Set(filteredPackages.map(p => p.courierName).filter(Boolean))].map(courier => ({
      courierName: courier || 'Unknown',
      totalPackages: filteredPackages.filter(p => p.courierName === courier).length
    }))
  };

  const exportReport = () => {
    const { start, end } = getDateRange();
    const reportData = {
      reportDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      dateRange: `${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')}`,
      ...analytics
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan & Analitik</h1>
          <p className="text-sm text-gray-500 mt-1">Ringkasan data untuk analisis bisnis</p>
        </div>
        <button
          onClick={exportReport}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
        >
          <Download className="h-5 w-5 mr-2" />
          Export Report
        </button>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filter Periode</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <button
            onClick={() => setDateRange('today')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateRange === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => setDateRange('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateRange === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            7 Hari
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateRange === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Bulan Ini
          </button>
          <button
            onClick={() => setDateRange('year')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateRange === 'year'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tahun Ini
          </button>
          <button
            onClick={() => setDateRange('custom')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateRange === 'custom'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Custom
          </button>
        </div>
        
        {dateRange === 'custom' && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Package className="h-8 w-8 opacity-80" />
            <BarChart3 className="h-5 w-5 opacity-60" />
          </div>
          <p className="text-sm opacity-90">Total Paket</p>
          <p className="text-3xl font-bold mt-1">{analytics.totalPackages}</p>
          <div className="flex gap-2 mt-3 text-xs">
            <span className="bg-white/20 px-2 py-1 rounded">Masuk: {analytics.arrivedPackages}</span>
            <span className="bg-white/20 px-2 py-1 rounded">Ambil: {analytics.pickedUpPackages}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="h-8 w-8 opacity-80" />
            <TrendingUp className="h-5 w-5 opacity-60" />
          </div>
          <p className="text-sm opacity-90">Total Revenue</p>
          <p className="text-3xl font-bold mt-1">Rp {analytics.totalRevenue.toLocaleString('id-ID')}</p>
          <p className="text-xs mt-2 opacity-75">Pending: Rp {analytics.pendingRevenue.toLocaleString('id-ID')}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Users className="h-8 w-8 opacity-80" />
            <PieChart className="h-5 w-5 opacity-60" />
          </div>
          <p className="text-sm opacity-90">Total Pelanggan</p>
          <p className="text-3xl font-bold mt-1">{analytics.totalCustomers}</p>
          <div className="flex gap-2 mt-3 text-xs">
            <span className="bg-white/20 px-2 py-1 rounded">Premium: {analytics.premiumMembers}</span>
            <span className="bg-white/20 px-2 py-1 rounded">Regular: {analytics.regularMembers}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <MapPin className="h-8 w-8 opacity-80" />
            <Calendar className="h-5 w-5 opacity-60" />
          </div>
          <p className="text-sm opacity-90">Lokasi Aktif</p>
          <p className="text-3xl font-bold mt-1">{analytics.activeLocations}</p>
          <p className="text-xs mt-2 opacity-75">Total: {analytics.totalLocations} lokasi</p>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Metrik Performa</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Tingkat Pengambilan</span>
                <span className="font-semibold text-gray-900">{analytics.pickupRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${analytics.pickupRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Tingkat Pembayaran</span>
                <span className="font-semibold text-gray-900">{analytics.paymentRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${analytics.paymentRate}%` }}
                />
              </div>
            </div>

            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Rata-rata Harga Paket</span>
                <span className="text-lg font-bold text-gray-900">
                  Rp {analytics.averagePackagePrice.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t">
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-green-600 font-medium">Lunas</p>
                <p className="text-xl font-bold text-green-700">{analytics.paidPackages}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-red-600 font-medium">Belum Lunas</p>
                <p className="text-xl font-bold text-red-700">{analytics.unpaidPackages}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Location Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Per Lokasi</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {analytics.locationBreakdown.map((loc, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">{loc.locationName}</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{loc.totalPackages} paket</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Revenue</span>
                  <span className="font-semibold text-green-600">
                    Rp {loc.revenue.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Courier Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Per Kurir</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {analytics.courierBreakdown.map((courier, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <span className="font-medium text-gray-900">{courier.courierName}</span>
                <span className="text-sm font-bold text-indigo-600">{courier.totalPackages} paket</span>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktivitas Pelanggan</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-blue-50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-gray-700">Pelanggan Aktif</span>
              </div>
              <span className="text-lg font-bold text-blue-600">{analytics.activeCustomers}</span>
            </div>
            
            <div className="flex justify-between items-center bg-amber-50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-600" />
                <span className="text-sm text-gray-700">Premium Members</span>
              </div>
              <span className="text-lg font-bold text-amber-600">{analytics.premiumMembers}</span>
            </div>
            
            <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-700">Regular Members</span>
              </div>
              <span className="text-lg font-bold text-gray-600">{analytics.regularMembers}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
