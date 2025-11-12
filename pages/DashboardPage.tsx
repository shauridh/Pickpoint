import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DollarSign, Package, PackageCheck, PlusCircle, QrCode, Inbox } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, Package as PackageType, PackageStatus, Recipient, Expedition, Location } from '../types';
import AddPackageModal from '../components/modals/AddPackageModal';
import PackageDetailModal from '../components/modals/PackageDetailModal';
import ScanAndPickupModal from '../components/modals/ScanAndPickupModal';
import { calculatePrice } from '../utils/priceCalculator';

interface KpiData {
    paketMasuk: number;
    paketDiambil: number;
    paketMenunggu: number;
    revenue: number;
}

const KpiCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: React.ElementType, color: string }) => (
    <div className={`shadow-md rounded-lg p-4 text-white relative overflow-hidden min-h-[120px] flex flex-col justify-between ${color}`}>
        <div className="z-10 relative">
            <h3 className="text-3xl font-bold">{value}</h3>
            <p className="mt-1">{title}</p>
        </div>
        <Icon className="absolute -right-4 -bottom-4 w-24 h-24 opacity-20 z-0" />
    </div>
);


const StatusBadge = ({ status }: { status: PackageStatus }) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    switch (status) {
        case PackageStatus.WAITING_PICKUP:
            return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>{status}</span>;
        case PackageStatus.PICKED_UP:
            return <span className={`${baseClasses} bg-green-100 text-green-800`}>{status}</span>;
        default:
            return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
};

type KpiPeriod = 'today' | 'this_week' | 'this_month';

const DashboardPage: React.FC = () => {
    const [kpiData, setKpiData] = useState<KpiData | null>(null);
    const [allPackages, setAllPackages] = useState<PackageType[]>([]);
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [expeditions, setExpeditions] = useState<Expedition[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [kpiPeriod, setKpiPeriod] = useState<KpiPeriod>('today');
    const [filterDateFrom, setFilterDateFrom] = useState('');

    const { user } = useAuth();
    
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);
    const [isScanModalOpen, setScanModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const locationId = user?.role === UserRole.PETUGAS ? user.location_id : undefined;
            
            const [kpiResult, pkgData, recData, expData, locData] = await Promise.all([
                api.getDashboardData(kpiPeriod, locationId),
                api.getPackages({ location_id: locationId }),
                api.getRecipients(),
                api.getExpeditions(),
                api.getLocations()
            ]);

            setKpiData(kpiResult);
            setAllPackages(pkgData);
            setRecipients(recData);
            setExpeditions(expData);
            setLocations(locData);

        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }
    }, [user, kpiPeriod]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getRecipientInfo = (id: number) => recipients.find(r => r.id === id);
    const getExpeditionName = (id: number) => expeditions.find(e => e.id === id)?.name || 'N/A';
    const getLocationForPackage = (pkg: PackageType) => locations.find(l => l.id === pkg.location_id);

    const filteredPackages = useMemo(() => {
        return allPackages
            .filter(pkg => !filterStatus || pkg.status === filterStatus)
            .filter(pkg => {
                if (!searchTerm.trim()) return true;
                const lowercasedTerm = searchTerm.toLowerCase();
                const recipientName = getRecipientInfo(pkg.recipient_id)?.name.toLowerCase() || '';
                return pkg.awb.toLowerCase().includes(lowercasedTerm) || recipientName.includes(lowercasedTerm);
            })
            .filter(pkg => {
                 if (!filterDateFrom) return true;
                 const startDate = new Date(filterDateFrom);
                 startDate.setHours(0, 0, 0, 0);
                 const createdAt = new Date(pkg.created_at);
                 return createdAt >= startDate;
            });
    }, [allPackages, filterStatus, searchTerm, recipients, filterDateFrom]);

    const handleRowClick = (pkg: PackageType) => {
        setSelectedPackage(pkg);
        setDetailModalOpen(true);
    };

    if (loading && !kpiData) {
        return <div className="text-center p-10">Loading dashboard...</div>;
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    const PeriodButton = ({ period, label }: { period: KpiPeriod, label: string }) => (
        <button
            onClick={() => setKpiPeriod(period)}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                kpiPeriod === period ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Ringkasan</h2>
                 <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                    <PeriodButton period="today" label="Hari Ini" />
                    <PeriodButton period="this_week" label="Minggu Ini" />
                    <PeriodButton period="this_month" label="Bulan Ini" />
                </div>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Paket Masuk" value={kpiData?.paketMasuk ?? 0} icon={Package} color="bg-blue-500" />
                <KpiCard title="Paket Diambil" value={kpiData?.paketDiambil ?? 0} icon={PackageCheck} color="bg-green-500" />
                <KpiCard title="Paket Menunggu" value={kpiData?.paketMenunggu ?? 0} icon={Inbox} color="bg-purple-500" />
                <KpiCard title="Revenue" value={`Rp ${kpiData?.revenue.toLocaleString('id-ID') ?? 0}`} icon={DollarSign} color="bg-yellow-500" />
            </div>

            <div className="bg-white rounded-lg shadow-md">
                 <div className="p-4 border-b flex flex-col md:flex-row justify-between items-center gap-4 flex-wrap">
                     <h2 className="text-xl font-bold text-gray-800">Daftar Paket</h2>
                     <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto flex-wrap justify-end">
                         <div className="flex items-center gap-2">
                             <label htmlFor="filterDateFrom" className="text-sm font-medium text-gray-700">Dari Tanggal:</label>
                             <input id="filterDateFrom" type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="p-2 bg-white border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"/>
                         </div>
                        <input 
                            type="text"
                            placeholder="Cari AWB atau Penerima..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="p-2 border bg-white border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 w-full md:w-48 text-gray-900 placeholder-gray-500"
                        />
                        <select 
                            value={filterStatus} 
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="p-2 border bg-white border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 w-full md:w-auto text-gray-900"
                        >
                            <option value="">Semua Status</option>
                            <option value={PackageStatus.WAITING_PICKUP}>{PackageStatus.WAITING_PICKUP}</option>
                            <option value={PackageStatus.PICKED_UP}>{PackageStatus.PICKED_UP}</option>
                        </select>
                        <button
                           onClick={() => setScanModalOpen(true)}
                           className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full md:w-auto"
                       >
                           <QrCode className="w-5 h-5 mr-2" />
                           Scan Paket
                       </button>
                        <button
                            onClick={() => setAddModalOpen(true)}
                            className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 w-full md:w-auto"
                        >
                            <PlusCircle className="w-5 h-5 mr-2" />
                            Tambah Paket
                        </button>
                    </div>
                </div>
                <div className="p-4">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AWB</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penerima</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ekspedisi</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Masuk</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diambil</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Biaya</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredPackages.length > 0 ? filteredPackages.map((pkg) => {
                                    const recipient = getRecipientInfo(pkg.recipient_id);
                                    const location = getLocationForPackage(pkg);
                                    let currentPrice = pkg.price;
                                    if (pkg.status === PackageStatus.WAITING_PICKUP && location) {
                                        currentPrice = calculatePrice(pkg.created_at, location);
                                    }
                                    const totalBiaya = currentPrice + pkg.delivery_fee;
                                    
                                    return (
                                    <tr key={pkg.id} onClick={() => handleRowClick(pkg)} className="hover:bg-gray-50 cursor-pointer">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pkg.awb}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="font-medium text-gray-900">{recipient?.name || 'N/A'}</div>
                                            <div className="text-gray-500">{recipient ? `${recipient.tower}/${recipient.unit}` : ''}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getExpeditionName(pkg.expedition_id)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(pkg.created_at)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(pkg.picked_at)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                                            Rp {totalBiaya.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <StatusBadge status={pkg.status} />
                                        </td>
                                    </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={7} className="text-center py-10 text-gray-500">Tidak ada paket ditemukan.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {isAddModalOpen && <AddPackageModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} onSuccess={fetchData} />}
            {isDetailModalOpen && selectedPackage && <PackageDetailModal pkg={selectedPackage} isOpen={isDetailModalOpen} onClose={() => setDetailModalOpen(false)} onSuccess={fetchData} />}
            {isScanModalOpen && <ScanAndPickupModal isOpen={isScanModalOpen} onClose={() => setScanModalOpen(false)} onSuccess={fetchData} />}
        </div>
    );
};

export default DashboardPage;