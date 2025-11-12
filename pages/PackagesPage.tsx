
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Package, PackageStatus, Recipient, Expedition } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

const PackagesPage = () => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('');
    const { user } = useAuth();
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [expeditions, setExpeditions] = useState<Expedition[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const locationId = user?.role === UserRole.PETUGAS ? user.location_id : undefined;
                const [pkgData, recData, expData] = await Promise.all([
                    api.getPackages({ status: filter || undefined, location_id: locationId }),
                    api.getRecipients(),
                    api.getExpeditions()
                ]);
                setPackages(pkgData);
                setRecipients(recData);
                setExpeditions(expData);
            } catch (error) {
                console.error("Failed to fetch packages:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filter, user]);

    const getRecipientName = (id: number) => recipients.find(r => r.id === id)?.name || 'N/A';
    const getExpeditionName = (id: number) => expeditions.find(e => e.id === id)?.name || 'N/A';

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

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Daftar Paket</h2>
                <div>
                    <select 
                        value={filter} 
                        onChange={(e) => setFilter(e.target.value)}
                        className="p-2 border rounded-md"
                    >
                        <option value="">Semua Status</option>
                        <option value={PackageStatus.WAITING_PICKUP}>{PackageStatus.WAITING_PICKUP}</option>
                        <option value={PackageStatus.PICKED_UP}>{PackageStatus.PICKED_UP}</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AWB</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penerima</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ekspedisi</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Masuk</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {packages.map((pkg) => (
                                <tr key={pkg.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pkg.awb}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getRecipientName(pkg.recipient_id)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getExpeditionName(pkg.expedition_id)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(pkg.created_at).toLocaleDateString('id-ID')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <StatusBadge status={pkg.status} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PackagesPage;
