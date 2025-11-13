import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import { Recipient, Location as LocationType } from '../types';
import { PlusCircle, Edit2, X, Bell, BellOff, Trash2, StopCircle, Info } from 'lucide-react';

const SubscriptionPage = () => {
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [locations, setLocations] = useState<LocationType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(null);

    const defaultFormState = {
        recipientId: '',
        duration: '', // '1', '3', '6', '12'
        endDate: '',
        notifEnabled: true,
    };

    const [formState, setFormState] = useState(defaultFormState);
    const [subscriptionPrice, setSubscriptionPrice] = useState<number | null>(null);

    const [formStatus, setFormStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [recData, locData] = await Promise.all([
                api.getRecipients(),
                api.getLocations(),
            ]);
            setRecipients(recData);
            setLocations(locData);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const subscribedRecipients = useMemo(() => {
        return recipients.filter(r => r.subscription_start_date && r.subscription_end_date).sort((a,b) => new Date(b.subscription_end_date!).getTime() - new Date(a.subscription_end_date!).getTime());
    }, [recipients]);

    const openAddModal = () => {
        setEditingRecipient(null);
        setFormState(defaultFormState);
        setSubscriptionPrice(null);
        setFormStatus(null);
        setIsModalOpen(true);
    };

    const openEditModal = (recipient: Recipient) => {
        setEditingRecipient(recipient);
        setFormState({
            recipientId: String(recipient.id),
            duration: '',
            endDate: recipient.subscription_end_date ? new Date(recipient.subscription_end_date).toISOString().split('T')[0] : '',
            notifEnabled: recipient.subscription_notif_enabled,
        });
        setSubscriptionPrice(null);
        setFormStatus(null);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    const handleFormChange = (field: keyof typeof formState, value: any) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    useEffect(() => {
        if (isModalOpen && !editingRecipient && formState.recipientId && formState.duration) {
            const recipient = recipients.find(r => r.id === Number(formState.recipientId));
            const location = locations.find(l => l.id === recipient?.location_id);
            if (location?.subscription_pricing) {
                const price = location.subscription_pricing[formState.duration as keyof typeof location.subscription_pricing];
                setSubscriptionPrice(price ?? 0);
            } else {
                setSubscriptionPrice(0); // Default to 0 if not configured
            }
        } else {
            setSubscriptionPrice(null);
        }
    }, [formState.recipientId, formState.duration, recipients, locations, isModalOpen, editingRecipient]);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormStatus(null);

        let details: { startDate?: string; endDate?: string; notifEnabled: boolean; };

        if (editingRecipient) {
             if (!formState.endDate) {
                setFormStatus({ message: 'Harap isi tanggal berakhir.', type: 'error' });
                return;
            }
            details = {
                endDate: new Date(formState.endDate).toISOString(),
                notifEnabled: formState.notifEnabled,
            };
        } else {
             if (!formState.recipientId || !formState.duration) {
                setFormStatus({ message: 'Harap pilih penerima dan durasi.', type: 'error' });
                return;
            }
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setMonth(startDate.getMonth() + Number(formState.duration));
            details = {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                notifEnabled: formState.notifEnabled,
            };
        }

        try {
            await api.updateSubscription(Number(formState.recipientId), details);
            setFormStatus({ message: 'Langganan berhasil diperbarui!', type: 'success' });
            fetchData();
            setTimeout(handleModalClose, 1500);
        } catch (err: any) {
            setFormStatus({ message: err.message, type: 'error' });
        }
    };

    const handleTerminate = async (recipientId: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghentikan langganan ini? Masa aktif akan berakhir hari ini.')) {
            try {
                await api.terminateSubscription(recipientId);
                fetchData();
            } catch (err: any) {
                alert(`Gagal terminasi: ${err.message}`);
            }
        }
    };

    const handleDelete = async (recipientId: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus data langganan ini? Penerima akan kembali ke status tidak berlangganan.')) {
            try {
                await api.deleteSubscription(recipientId);
                fetchData();
            } catch (err: any) {
                 alert(`Gagal menghapus: ${err.message}`);
            }
        }
    };
    
    const renderStatus = (recipient: Recipient) => {
        const now = new Date();
        const endDate = new Date(recipient.subscription_end_date!);
        if (endDate >= now) {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Aktif</span>;
        }
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Berakhir</span>;
    };
    
     const calculateDaysRemaining = (endDateStr?: string) => {
        if (!endDateStr) return '-';
        const endDate = new Date(endDateStr);
        const now = new Date();
        now.setHours(0,0,0,0);
        
        if (endDate < now) return '0';
        
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    };
    
    const inputClasses = "block w-full px-3 py-2 mt-1 bg-white placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm";
    const durationOptions = [
        { value: '1', label: '1 Bulan' },
        { value: '3', label: '3 Bulan' },
        { value: '6', label: '6 Bulan' },
        { value: '12', label: '12 Bulan' },
    ];


    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-800">Manajemen Langganan</h2>
                 <button onClick={openAddModal} className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Tambah Langganan
                </button>
            </div>

             <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-700 p-4 rounded-md flex items-start">
                <Info className="w-6 h-6 mr-3 flex-shrink-0" />
                <div>
                    <h3 className="font-bold">Pengaturan Notifikasi</h3>
                    <p className="text-sm">Untuk mengaktifkan notifikasi pengingat, pastikan Anda telah melakukan konfigurasi WhatsApp Gateway di menu <strong className="font-semibold">Pengaturan &gt; Integrasi</strong>.</p>
                </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md">
                <div className="p-4 overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Penerima</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lokasi</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mulai</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Berakhir</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sisa Hari</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Notifikasi</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={8} className="text-center py-10">Loading...</td></tr>
                            ) : subscribedRecipients.length > 0 ? (
                                subscribedRecipients.map(r => {
                                    const isActive = new Date(r.subscription_end_date!) >= new Date();
                                    return (
                                        <tr key={r.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{locations.find(l => l.id === r.location_id)?.name || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(r.subscription_start_date)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(r.subscription_end_date)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">{calculateDaysRemaining(r.subscription_end_date)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{renderStatus(r)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">{r.subscription_notif_enabled ? <Bell className="w-5 h-5 text-green-500 mx-auto" /> : <BellOff className="w-5 h-5 text-gray-400 mx-auto" />}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end items-center space-x-2">
                                                    <button onClick={() => openEditModal(r)} className="text-primary-600 hover:text-primary-800" title="Edit"><Edit2 className="w-4 h-4"/></button>
                                                    {isActive && <button onClick={() => handleTerminate(r.id)} className="text-yellow-600 hover:text-yellow-800" title="Terminasi"><StopCircle className="w-4 h-4"/></button>}
                                                    <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:text-red-800" title="Hapus"><Trash2 className="w-4 h-4"/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan={8} className="text-center py-10 text-gray-500">Belum ada pelanggan yang berlangganan.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-10 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full m-4 relative animate-fade-in-down">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-xl font-bold text-gray-800">{editingRecipient ? 'Edit Langganan' : 'Tambah Langganan Baru'}</h2>
                            <button onClick={handleModalClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleFormSubmit}>
                            <div className="p-6 space-y-4">
                                {formStatus && <div className={`p-3 text-sm rounded-lg ${formStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{formStatus.message}</div>}
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Penerima</label>
                                    <select value={formState.recipientId} onChange={(e) => handleFormChange('recipientId', e.target.value)} required className={inputClasses} disabled={!!editingRecipient}>
                                        <option value="" disabled>Pilih Penerima</option>
                                        {recipients.filter(r => !r.subscription_end_date || new Date(r.subscription_end_date) < new Date()).map(r => <option key={r.id} value={r.id}>{r.name} - {r.tower}/{r.unit}</option>)}
                                    </select>
                                </div>
                                
                                {editingRecipient ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Tanggal Berakhir</label>
                                        <input type="date" value={formState.endDate} onChange={e => handleFormChange('endDate', e.target.value)} required className={inputClasses}/>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Durasi</label>
                                        <select value={formState.duration} onChange={(e) => handleFormChange('duration', e.target.value)} required className={inputClasses}>
                                            <option value="" disabled>Pilih Durasi</option>
                                            {durationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </div>
                                )}
                                
                                {subscriptionPrice !== null && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mt-2">
                                        <p className="text-center font-semibold text-blue-800 text-lg">
                                            Harga: Rp {subscriptionPrice.toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                )}
                                
                                <div className="flex items-center pt-2">
                                    <input id="notifEnabled" type="checkbox" checked={formState.notifEnabled} onChange={e => handleFormChange('notifEnabled', e.target.checked)} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"/>
                                    <label htmlFor="notifEnabled" className="ml-2 block text-sm text-gray-900">Kirim notifikasi pengingat H-3 sebelum berakhir</label>
                                </div>
                            </div>
                            <div className="flex items-center justify-end p-4 border-t bg-gray-50 rounded-b-lg">
                                <button type="button" onClick={handleModalClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Batal</button>
                                <button type="submit" className="ml-3 w-full sm:w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionPage;