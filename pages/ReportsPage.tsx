import React, { useState, useEffect } from 'react';
import { Bar, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart, PieChart, BarChart } from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Location as LocationType, UserRole } from '../types';
import { Package, PackageCheck, Clock, TrendingUp, ArrowRightCircle } from 'lucide-react';

interface ReportData {
    totalRevenue: number;
    totalPackages: number;
    packagesPickedUp: number;
    averagePickupTime: number; // in hours
    expeditionDistribution: { name: string, value: number }[];
    locationDistribution: { name: string, value: number }[];
    dailyTrend: { date: string, Masuk: number, Diambil: number }[];
}

const KpiCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: React.ElementType, color: string }) => (
    <div className={`shadow-md rounded-lg p-4 text-white relative overflow-hidden ${color}`}>
        <div className="z-10 relative">
            <h3 className="text-3xl font-bold">{value}</h3>
            <p className="mt-1">{title}</p>
        </div>
        <Icon className="absolute -right-4 -top-2 w-24 h-24 opacity-20 z-0" />
        <div className="text-center mt-4 bg-black bg-opacity-10 py-1 rounded-b-lg absolute bottom-0 left-0 right-0">
            <a href="#" className="text-sm flex items-center justify-center">
                More info <ArrowRightCircle className="ml-2 w-4 h-4" />
            </a>
        </div>
    </div>
);


const ReportsPage = () => {
    const { user } = useAuth();
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [locations, setLocations] = useState<LocationType[]>([]);
    const [loading, setLoading] = useState(true);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [filters, setFilters] = useState({
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        locationId: user?.role === UserRole.PETUGAS ? user.location_id : 0,
    });
    
    useEffect(() => {
        const fetchLocations = async () => {
            if (user?.role === UserRole.ADMIN) {
                const locs = await api.getLocations();
                setLocations(locs);
            }
        };
        fetchLocations();
    }, [user]);

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const data = await api.getReportData({
                    ...filters,
                    locationId: filters.locationId || undefined // Pass undefined if 0
                });
                setReportData(data);
            } catch (error) {
                console.error("Failed to fetch report data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReportData();
    }, [filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const PIE_COLORS = ['#3b82f6', '#16a34a', '#f97316', '#a855f7', '#f59e0b'];

    const renderLoading = () => (
        <div className="flex justify-center items-center h-64">
             <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
        </div>
    );
    
    const renderCharts = () => (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 <KpiCard title="Total Omset" value={`Rp ${reportData?.totalRevenue.toLocaleString('id-ID') ?? 0}`} icon={TrendingUp} color="bg-green-500" />
                 <KpiCard title="Total Paket Masuk" value={reportData?.totalPackages ?? 0} icon={Package} color="bg-blue-500" />
                 <KpiCard title="Paket Sudah Diambil" value={reportData?.packagesPickedUp ?? 0} icon={PackageCheck} color="bg-purple-500" />
                 <KpiCard title="Rata-rata Waktu Ambil" value={`${reportData?.averagePickupTime.toFixed(1) ?? 0} jam`} icon={Clock} color="bg-yellow-500" />
            </div>
            
            <div className="bg-white rounded-lg shadow-md">
                <div className="p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-800">Tren Paket Harian</h3>
                </div>
                <div className="p-4">
                     <ResponsiveContainer width="100%" height={350}>
                        <ComposedChart data={reportData?.dailyTrend}>
                            <defs>
                                <linearGradient id="colorMasuk" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Masuk" fill="url(#colorMasuk)" barSize={20} />
                            <Line type="monotone" dataKey="Diambil" stroke="#16a34a" strokeWidth={2} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md">
                     <div className="p-4 border-b">
                        <h3 className="text-xl font-semibold text-gray-800">Distribusi Ekspedisi</h3>
                    </div>
                     <div className="p-4">
                         <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={reportData?.expeditionDistribution}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={110}
                                    fill="#8884d8"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {reportData?.expeditionDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                 <Tooltip />
                                 <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                 {user?.role === UserRole.ADMIN && !filters.locationId && (
                     <div className="bg-white rounded-lg shadow-md">
                        <div className="p-4 border-b">
                            <h3 className="text-xl font-semibold text-gray-800">Distribusi per Lokasi</h3>
                        </div>
                         <div className="p-4">
                             <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={reportData?.locationDistribution} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" name="Jumlah Paket" fill="#f97316" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                 )}
            </div>
        </>
    );

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Laporan & Analitik</h2>
             <div className="bg-white p-4 rounded-lg shadow-md flex flex-wrap items-center gap-4">
                 <div className="flex items-center gap-2">
                    <label htmlFor="startDate" className="text-sm font-medium">Dari:</label>
                    <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="p-2 bg-white border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"/>
                 </div>
                 <div className="flex items-center gap-2">
                    <label htmlFor="endDate" className="text-sm font-medium">Sampai:</label>
                    <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="p-2 bg-white border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"/>
                 </div>
                {user?.role === UserRole.ADMIN && (
                    <div className="flex items-center gap-2">
                         <label htmlFor="locationId" className="text-sm font-medium">Lokasi:</label>
                        <select name="locationId" value={filters.locationId} onChange={handleFilterChange} className="p-2 bg-white border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                            <option value={0}>Semua Lokasi</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
            
            {loading ? renderLoading() : renderCharts()}
        </div>
    );
};

export default ReportsPage;