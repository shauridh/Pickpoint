import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { DollarSign, Package, PackageCheck, PlusCircle, QrCode, Inbox, CreditCard, Users, ArrowDownUp, ArrowUp, ArrowDown, Send, Star } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, Package as PackageType, PackageStatus, Recipient, Expedition, Location, PaymentStatus } from '../types';
import AddPackageModal from '../components/modals/AddPackageModal';
import PackageDetailModal from '../components/modals/PackageDetailModal';
import ScanAndPickupModal from '../components/modals/ScanAndPickupModal';
import { calculatePrice } from '../utils/priceCalculator';

interface KpiData {
    paketMasuk: number;
    paketDiambil: number;
    totalPaket: number;
    totalSubscribe: number;
    packageRevenue: number;
    deliveryRevenue: number;
    monthlySubscriptionRevenue: number;
    totalRevenue: number;
}

const KpiCard = ({ title, value, icon: Icon, color, isDragging }: { title: string, value: string | number, icon: React.ElementType, color: string, isDragging: boolean }) => (
    <div className={`shadow-md rounded-lg p-4 text-white relative overflow-hidden min-h-[120px] flex flex-col justify-between transition-all duration-300 ${color} ${isDragging ? 'opacity-50 scale-105' : 'opacity-100'}`}>
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

const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    switch (status) {
        case PaymentStatus.UNPAID:
            return <span className={`${baseClasses} bg-red-100 text-red-800`}>{status}</span>;
        case PaymentStatus.PAID:
            return <span className={`${baseClasses} bg-green-100 text-green-800`}>{status}</span>;
        default:
            return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
};


type KpiPeriod = 'today' | 'this_week' | 'this_month';
type SortKey = keyof PackageType | 'recipientName' | 'totalBiaya';
type SortDirection = 'asc' | 'desc';

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

    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'created_at', direction: 'desc' });

    const { user } = useAuth();
    
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);
    const [isScanModalOpen, setScanModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
    
    // --- Draggable KPI Cards Logic ---
    const defaultCardOrder = ['paketMasuk', 'paketDiambil', 'totalPaket', 'totalSubscribe', 'pendapatanPaket', 'pendapatanAntar', 'pendapatanSubscribe', 'totalPendapatan'];
    const [cardOrder, setCardOrder] = useState<string[]>(() => {
        const savedOrderJson = localStorage.getItem('pickpointDashboardCardOrder');
        if (savedOrderJson) {
            try {
                const savedOrder = JSON.parse(savedOrderJson);
                // Filter out any old card keys that no longer exist
                const validSavedOrder = savedOrder.filter((key: string) => defaultCardOrder.includes(key));
                // Add any new card keys that are not in the saved order
                const missingKeys = defaultCardOrder.filter(key => !validSavedOrder.includes(key));
                const finalOrder = [...validSavedOrder, ...missingKeys];
                return finalOrder;
            } catch (e) {
                // If parsing fails, return default
                return defaultCardOrder;
            }
        }
        return defaultCardOrder;
    });
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragItem.current = position;
        setIsDragging(true);
         // To make the dragged element semi-transparent
        setTimeout(() => e.currentTarget.classList.add('dragging'), 0);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragOverItem.current = position;
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('dragging');
        if (dragItem.current === null || dragOverItem.current === null) return;

        const newCardOrder = [...cardOrder];
        const dragItemContent = newCardOrder[dragItem.current];
        newCardOrder.splice(dragItem.current, 1);
        newCardOrder.splice(dragOverItem.current, 0, dragItemContent);
        
        dragItem.current = null;
        dragOverItem.current = null;
        
        setCardOrder(newCardOrder);
        localStorage.setItem('pickpointDashboardCardOrder', JSON.stringify(newCardOrder));
        setIsDragging(false);
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('dragging');
        setIsDragging(false);
        dragItem.current = null;
        dragOverItem.current = null;
    };
    // --- End Draggable ---

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

            setKpiData(kpiResult as KpiData);
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
    const getLocationForPackage = (pkg: PackageType) => locations.find(l => l.id === pkg.location_id);
    
    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredPackages = useMemo(() => {
        let sortableItems = [...allPackages]
            .filter(pkg => !filterStatus || pkg.status === filterStatus)
            .filter(pkg => {
                if (!searchTerm.trim()) return true;
                const lowercasedTerm = searchTerm.toLowerCase();
                const recipientName = getRecipientInfo(pkg.recipient_id)?.name.toLowerCase() || '';
                return pkg.awb.toLowerCase().includes(lowercasedTerm) || 
                       recipientName.includes(lowercasedTerm) ||
                       pkg.pickup_code.toLowerCase().includes(lowercasedTerm);
            })
            .filter(pkg => {
                 if (!filterDateFrom) return true;
                 const startDate = new Date(filterDateFrom);
                 startDate.setHours(0, 0, 0, 0);
                 const createdAt = new Date(pkg.created_at);
                 return createdAt >= startDate;
            });

        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                if (sortConfig.key === 'recipientName') {
                    aValue = getRecipientInfo(a.recipient_id)?.name || '';
                    bValue = getRecipientInfo(b.recipient_id)?.name || '';
                } else if (sortConfig.key === 'totalBiaya') {
                     const locationA = getLocationForPackage(a);
                     const recipientA = getRecipientInfo(a.recipient_id);
                     aValue = (a.status === PackageStatus.WAITING_PICKUP && locationA && recipientA ? calculatePrice(a, allPackages, locationA, recipientA) : a.price) + a.delivery_fee;
                     
                     const locationB = getLocationForPackage(b);
                     const recipientB = getRecipientInfo(b.recipient_id);
                     bValue = (b.status === PackageStatus.WAITING_PICKUP && locationB && recipientB ? calculatePrice(b, allPackages, locationB, recipientB) : b.price) + b.delivery_fee;
                } else {
                    aValue = a[sortConfig.key as keyof PackageType];
                    bValue = b[sortConfig.key as keyof PackageType];
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return sortableItems;
    }, [allPackages, filterStatus, searchTerm, filterDateFrom, recipients, sortConfig, locations]);


    const handleRowClick = (pkg: PackageType) => {
        setSelectedPackage(pkg);
        setDetailModalOpen(true);
    };

    const handlePackageScanned = (pkg: PackageType) => {
        setScanModalOpen(false);
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
    
    const kpiCardsData: {[key: string]: any} = {
        paketMasuk: { title: 'Paket Masuk', value: kpiData?.paketMasuk ?? 0, icon: Package, color: 'bg-blue-500' },
        paketDiambil: { title: 'Paket Diambil', value: kpiData?.paketDiambil ?? 0, icon: PackageCheck, color: 'bg-green-500' },
        totalPaket: { title: 'Total Paket', value: kpiData?.totalPaket ?? 0, icon: Inbox, color: 'bg-purple-500' },
        totalSubscribe: { title: 'Total Subscribe', value: kpiData?.totalSubscribe ?? 0, icon: Users, color: 'bg-teal-500' },
        pendapatanPaket: { title: 'Pendapatan Paket (Regular)', value: `Rp ${kpiData?.packageRevenue.toLocaleString('id-ID') ?? 0}`, icon: DollarSign, color: 'bg-orange-500' },
        pendapatanAntar: { title: 'Pendapatan Pengantaran', value: `Rp ${kpiData?.deliveryRevenue.toLocaleString('id-ID') ?? 0}`, icon: Send, color: 'bg-pink-500' },
        pendapatanSubscribe: { title: 'Pendapatan Subscribe', value: `Rp ${kpiData?.monthlySubscriptionRevenue.toLocaleString('id-ID') ?? 0}`, icon: Star, color: 'bg-cyan-500' },
        totalPendapatan: { title: 'Total Pendapatan', value: `Rp ${kpiData?.totalRevenue.toLocaleString('id-ID') ?? 0}`, icon: CreditCard, color: 'bg-gray-700' },
    };
    
    const SortableHeader = ({ label, sortKey }: { label: string, sortKey: SortKey }) => {
        const isActive = sortConfig.key === sortKey;
        const Icon = isActive ? (sortConfig.direction === 'asc' ? ArrowUp : ArrowDown) : ArrowDownUp;
        return (
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => requestSort(sortKey)}>
                <div className="flex items-center">
                    {label}
                    <Icon className={`w-4 h-4 ml-1.5 ${isActive ? 'text-gray-800' : 'text-gray-400'}`} />
                </div>
            </th>
        );
    };


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
                {cardOrder.map((key, index) => {
                    const card = kpiCardsData[key];
                    if (!card) return null;
                    return (
                         <div
                            key={key}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragEnd={handleDragEnd}
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            className="cursor-grab active:cursor-grabbing"
                         >
                            <KpiCard {...card} isDragging={isDragging && dragItem.current === index} />
                        </div>
                    );
                })}
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
                            placeholder="Cari AWB, Kode Unik, Penerima..."
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
                           Scan & Ambil
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
                                    <SortableHeader label="AWB / Kode Unik" sortKey="awb" />
                                    <SortableHeader label="Penerima" sortKey="recipientName" />
                                    <SortableHeader label="Masuk" sortKey="created_at" />
                                    <SortableHeader label="Diambil" sortKey="picked_at" />
                                    <SortableHeader label="Biaya" sortKey="totalBiaya" />
                                    <SortableHeader label="Status Bayar" sortKey="payment_status" />
                                    <SortableHeader label="Status Paket" sortKey="status" />
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sortedAndFilteredPackages.length > 0 ? sortedAndFilteredPackages.map((pkg) => {
                                    const recipient = getRecipientInfo(pkg.recipient_id);
                                    const location = getLocationForPackage(pkg);
                                    let currentPrice = pkg.price;
                                    
                                    if (pkg.status === PackageStatus.WAITING_PICKUP && location && recipient) {
                                        currentPrice = calculatePrice(pkg, allPackages, location, recipient);
                                    }
                                    const totalBiaya = currentPrice + pkg.delivery_fee;
                                    
                                    return (
                                    <tr key={pkg.id} onClick={() => handleRowClick(pkg)} className="hover:bg-gray-50 cursor-pointer">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="font-medium text-gray-900">{pkg.awb}</div>
                                            <div className="text-gray-500 font-mono text-xs">{pkg.pickup_code}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="font-medium text-gray-900">{recipient?.name || 'N/A'}</div>
                                            <div className="text-gray-500">{recipient ? `${recipient.tower}/${recipient.unit}` : ''}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(pkg.created_at)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(pkg.picked_at)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                                            Rp {totalBiaya.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <PaymentStatusBadge status={pkg.payment_status} />
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
            {isDetailModalOpen && selectedPackage && <PackageDetailModal pkg={selectedPackage} isOpen={isDetailModalOpen} onClose={() => setDetailModalOpen(false)} onSuccess={fetchData} allPackages={allPackages} recipients={recipients} />}
            {isScanModalOpen && <ScanAndPickupModal isOpen={isScanModalOpen} onClose={() => setScanModalOpen(false)} onPackageFound={handlePackageScanned} />}
        </div>
    );
};

export default DashboardPage;