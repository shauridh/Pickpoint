import React, { useState, useEffect, useMemo } from 'react';
import { Bar, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart, PieChart } from 'recharts';
import { api } from '../../services/api';
import { Recipient, Location as LocationType } from '../../types';
import { Users, TrendingUp, TrendingDown, Clock } from 'lucide-react';

const SubscriptionReport = () => {
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [locations, setLocations] = useState<LocationType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [recData, locData] = await Promise.all([
                    api.getRecipients(),
                    api.getLocations()
                ]);
                setRecipients(recData);
                setLocations(locData);
            } catch (error) {
                console.error("Failed to fetch subscription report data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const subscribedRecipients = useMemo(() => {
        return recipients.filter(r => r.subscription_start_date && r.subscription_end_date);
    }, [recipients]);

    const reportData = useMemo(() => {
        const now = new Date();
        const activeSubscriptions = subscribedRecipients.filter(r => new Date(r.subscription_end_date!) >= now);
        
        // Trend Data (Last 6 Months)
        const trendData: { month: string, Aktivasi: number, Berakhir: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = date.toLocaleString('id-ID', { month: 'long' });
            
            const activations = subscribedRecipients.filter(r => {
                const startDate = new Date(r.subscription_start_date!);
                return startDate.getFullYear() === date.getFullYear() && startDate.getMonth() === date.getMonth();
            }).length;

            const expirations = subscribedRecipients.filter(r => {
                const endDate = new Date(r.subscription_end_date!);
                return endDate.getFullYear() === date.getFullYear() && endDate.getMonth() === date.getMonth();
            }).length;

            trendData.push({ month: monthName, Aktivasi: activations, Berakhir: expirations });
        }

        // Duration Distribution
        const durationDistribution: { name: string, value: number }[] = [
            { name: '1 Bulan', value: 0 },
            { name: '3 Bulan', value: 0 },
            { name: '6 Bulan', value: 0 },
            { name: '12 Bulan', value: 0 },
        ];
        
        activeSubscriptions.forEach(r => {
            const start = new Date(r.subscription_start_date!);
            const end = new Date(r.subscription_end_date!);
            const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

            if (months <= 1) durationDistribution[0].value++;
            else if (months <= 3) durationDistribution[1].value++;
            else if (months <= 6) durationDistribution[2].value++;
            else durationDistribution[3].value++;
        });

        // Churn Risk
        const fourteenDaysFromNow = new Date();
        fourteenDaysFromNow.setDate(now.getDate() + 14);
        const churnRiskRecipients = activeSubscriptions.filter(r => {
            const endDate = new Date(r.subscription_end_date!);
            return endDate <= fourteenDaysFromNow && endDate >= now;
        }).sort((a,b) => new Date(a.subscription_end_date!).getTime() - new Date(b.subscription_end_date!).getTime());

        return {
            activeCount: activeSubscriptions.length,
            trendData,
            durationDistribution,
            churnRiskRecipients,
        };

    }, [subscribedRecipients]);

    const calculateDaysRemaining = (endDateStr?: string) => {
        if (!endDateStr) return 0;
        const endDate = new Date(endDateStr);
        const now = new Date();
        if (endDate < now) return 0;
        const diffTime = endDate.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };
    
    const PIE_COLORS = ['#3b82f6', '#16a34a', '#f97316', '#a855f7'];
    
    if (loading) {
        return <div className="flex justify-center items-center h-64">
             <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
        </div>;
    }

    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-full"><Users className="w-6 h-6 text-blue-600" /></div>
                    <div>
                        <p className="text-gray-500">Pelanggan Aktif</p>
                        <p className="text-3xl font-bold text-gray-800">{reportData.activeCount}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
                    <div className="p-3 bg-green-100 rounded-full"><TrendingUp className="w-6 h-6 text-green-600" /></div>
                    <div>
                        <p className="text-gray-500">Aktivasi Baru (Bulan Ini)</p>
                        <p className="text-3xl font-bold text-gray-800">{reportData.trendData[5].Aktivasi}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
                    <div className="p-3 bg-red-100 rounded-full"><TrendingDown className="w-6 h-6 text-red-600" /></div>
                    <div>
                        <p className="text-gray-500">Akan Berakhir (14 Hari)</p>
                        <p className="text-3xl font-bold text-gray-800">{reportData.churnRiskRecipients.length}</p>
                    </div>
                </div>
             </div>

            <div className="bg-white rounded-lg shadow-md">
                <div className="p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-800">Tren Aktivasi vs Berakhir (6 Bulan Terakhir)</h3>
                </div>
                <div className="p-4">
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={reportData.trendData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Berakhir" fill="#ef4444" barSize={20} />
                            <Line type="monotone" dataKey="Aktivasi" stroke="#22c55e" strokeWidth={2} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 bg-white rounded-lg shadow-md">
                    <div className="p-4 border-b">
                        <h3 className="text-xl font-semibold text-gray-800">Distribusi Durasi Langganan</h3>
                    </div>
                    <div className="p-4">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={reportData.durationDistribution}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    fill="#8884d8"
                                    label
                                >
                                    {reportData.durationDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="lg:col-span-3 bg-white rounded-lg shadow-md">
                    <div className="p-4 border-b">
                        <h3 className="text-xl font-semibold text-gray-800">Tabel Pelanggan Berisiko (Akan Berakhir 14 Hari)</h3>
                    </div>
                    <div className="p-4 overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tgl Berakhir</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sisa Hari</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kontak WA</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reportData.churnRiskRecipients.length > 0 ? (
                                    reportData.churnRiskRecipients.map(r => (
                                        <tr key={r.id}>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{r.name}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{new Date(r.subscription_end_date!).toLocaleDateString('id-ID')}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-red-600">{calculateDaysRemaining(r.subscription_end_date)}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{r.whatsapp}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-gray-500">Tidak ada langganan yang akan berakhir dalam 14 hari.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionReport;
