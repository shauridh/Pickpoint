import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { User, Recipient, Location as LocationType, UserRole, PricingScheme, PickupMode } from '../types';
import { PlusCircle, Edit2, Trash2, Send } from 'lucide-react';

interface WaSettings {
    apiUrl: string;
    apiKey: string;
    proxyUrl?: string;
    senderNumber: string;
    regularTemplate: string;
    subscriptionActivationTemplate: string;
    subscriptionReminderTemplate: string;
    paymentLinkBaseUrl: string;
    renewalLinkBaseUrl: string;
}

const defaultWaSettings: WaSettings = {
    apiUrl: 'https://zapin.my.id/send-message',
    apiKey: '',
    proxyUrl: '',
    senderNumber: '',
    regularTemplate: 'HI {namaPenerima}, paket Anda dengan AWB {awb} dari {ekspedisi} sudah dapat diambil di pickpoint {lokasi}. Link pembayaran: {paymentLink}',
    subscriptionActivationTemplate: 'Halo {namaPenerima}, langganan Pickpoint Anda telah berhasil diaktifkan! Masa aktif Anda berlaku dari {tanggalMulai} hingga {tanggalBerakhir}. Nikmati kemudahan penitipan paket tanpa biaya harian.',
    subscriptionReminderTemplate: 'Langganan Pickpoint Anda akan berakhir pada {tanggalBerakhir} ({sisaHari} hari lagi). Segera perpanjang untuk tetap menikmati keuntungan sebagai pelanggan setia. Klik di sini: {linkPerpanjang}',
    paymentLinkBaseUrl: 'https://pick.point/pay',
    renewalLinkBaseUrl: 'https://pick.point/subscribe'
};


const SettingsPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('recipients');

    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [locations, setLocations] = useState<LocationType[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    
    const [loading, setLoading] = useState(true);
    
    const defaultLocationForm = {
        name: '',
        delivery_enabled: false,
        delivery_fee: 5000,
        pickup_mode: PickupMode.AUTO,
        pricing_scheme: PricingScheme.FLAT_PER_COLLECT,
        pricing_config: {
            flat_rate: 2000,
            free_days: 1,
            first_day_fee: 3000,
            subsequent_day_fee: 1500,
            multi_package_first_fee: 1000,
            multi_package_subsequent_fee: 500,
        },
        subscription_pricing: {
            '1': 50000,
            '3': 135000,
            '6': 250000,
            '12': 450000,
        }
    };

    const defaultUserForm = { name: '', email: '', password: '', location_id: '', role: UserRole.PETUGAS };
    const defaultRecipientForm = { name: '', towerUnit: '', whatsapp: '', location_id: '' };

    // State for forms
    const [recipientForm, setRecipientForm] = useState(defaultRecipientForm);
    const [locationForm, setLocationForm] = useState<Omit<LocationType, 'id'>>(defaultLocationForm);
    const [userForm, setUserForm] = useState(defaultUserForm);
    const [waSettings, setWaSettings] = useState<WaSettings>(defaultWaSettings);
    
    // State for WA Test
    const [testPhoneNumber, setTestPhoneNumber] = useState('');
    const [isSendingTest, setIsSendingTest] = useState(false);
    const [waConfigError, setWaConfigError] = useState('');


    // State for editing items
    const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(null);
    const [editingLocation, setEditingLocation] = useState<LocationType | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    
    const [formStatus, setFormStatus] = useState<{ [key: string]: { message: string, type: 'success' | 'error' } }>({});

    const fetchData = useCallback(async () => {
        setLoading(true);
        setFormStatus({});
        try {
            const [recData, locData, userData] = await Promise.all([
                api.getRecipients(),
                api.getLocations(),
                api.getUsers()
            ]);
            setRecipients(recData.sort((a,b) => a.name.localeCompare(b.name)));
            setLocations(locData.sort((a,b) => a.name.localeCompare(b.name)));
            setUsers(userData.sort((a,b) => a.name.localeCompare(b.name)));
        } catch (error) {
            console.error("Failed to fetch settings data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const storedWaSettings = localStorage.getItem('waSettings');
        let currentSettings = defaultWaSettings;
        if (storedWaSettings) {
             currentSettings = { ...defaultWaSettings, ...JSON.parse(storedWaSettings) };
             setWaSettings(currentSettings);
        } else {
            setWaSettings(defaultWaSettings);
        }

        if (!currentSettings.apiUrl || !currentSettings.apiKey || !currentSettings.senderNumber) {
            setWaConfigError("Konfigurasi WhatsApp Gateway belum lengkap. Harap isi API Endpoint, API Key, dan Nomor Pengirim.");
        } else {
            setWaConfigError('');
        }
    }, [fetchData]);

    // --- Form Change Handlers ---
    const handleFormChange = (form: string, field: string, value: any) => {
        if (form === 'recipient') setRecipientForm(prev => ({...prev, [field]: value}));
        if (form === 'user') setUserForm(prev => ({...prev, [field]: value}));
        if (form === 'location') {
             setLocationForm(prev => ({ ...prev, [field]: value }));
        }
    };
    
    const handleWaSettingsChange = (field: keyof WaSettings, value: string) => {
        setWaSettings(prev => ({ ...prev, [field]: value }));
    };
    
    const handleLocationConfigChange = (field: string, value: any) => {
        setLocationForm(prev => ({
            ...prev,
            pricing_config: {
                ...prev.pricing_config,
                [field]: value
            }
        }));
    }

    const handleSubscriptionPriceChange = (duration: '1' | '3' | '6' | '12', value: number) => {
        setLocationForm(prev => ({
            ...prev,
            subscription_pricing: {
                ...prev.subscription_pricing,
                [duration]: value
            }
        }));
    };

    // --- Cancel Edit Handlers ---
    const handleCancelEdit = (form: 'recipient' | 'location' | 'user') => {
        if (form === 'recipient') {
            setEditingRecipient(null);
            setRecipientForm(defaultRecipientForm);
        }
        if (form === 'location') {
            setEditingLocation(null);
            setLocationForm(defaultLocationForm);
        }
        if (form === 'user') {
            setEditingUser(null);
            setUserForm(defaultUserForm);
        }
    };
    
    // --- Recipient CRUD ---
    const handleRecipientSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormStatus({});
        try {
            const [tower, unit] = recipientForm.towerUnit.split('/').map(s => s.trim());
            const payload = { 
                name: recipientForm.name, 
                tower: tower || recipientForm.towerUnit, 
                unit: unit || '', 
                whatsapp: recipientForm.whatsapp,
                location_id: Number(recipientForm.location_id),
            };

            if (editingRecipient) {
                await api.updateRecipient(editingRecipient.id, payload);
                setFormStatus({ recipient: { message: 'Penerima berhasil diperbarui!', type: 'success' } });
            } else {
                await api.addRecipient(payload);
                setFormStatus({ recipient: { message: 'Penerima berhasil ditambahkan!', type: 'success' } });
            }
            handleCancelEdit('recipient');
            fetchData();
        } catch (err: any) {
            setFormStatus({ recipient: { message: err.message, type: 'error' } });
        }
    };

    const handleEditRecipient = (recipient: Recipient) => {
        setEditingRecipient(recipient);
        setRecipientForm({ name: recipient.name, towerUnit: `${recipient.tower}/${recipient.unit}`, whatsapp: recipient.whatsapp, location_id: String(recipient.location_id) });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteRecipient = async (id: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus penerima ini?')) {
            try {
                await api.deleteRecipient(id);
                setFormStatus({ recipient: { message: 'Penerima berhasil dihapus.', type: 'success' } });
                fetchData();
            } catch (err: any) {
                setFormStatus({ recipient: { message: err.message, type: 'error' } });
            }
        }
    };

    // --- Location CRUD ---
    const handleLocationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormStatus({});
        try {
            const payload = { ...locationForm };
            if (editingLocation) {
                await api.updateLocation(editingLocation.id, payload);
                setFormStatus({ location: { message: 'Lokasi berhasil diperbarui!', type: 'success' } });
            } else {
                await api.addLocation(payload);
                setFormStatus({ location: { message: 'Lokasi berhasil ditambahkan!', type: 'success' } });
            }
            handleCancelEdit('location');
            fetchData();
        } catch (err: any) {
             setFormStatus({ location: { message: err.message, type: 'error' } });
        }
    };

    const handleEditLocation = (location: LocationType) => {
        setEditingLocation(location);
        // Ensure default values for new config fields if they don't exist on the location object
        const locationDataWithDefaults = {
            ...defaultLocationForm,
            ...location,
            pricing_config: {
                ...defaultLocationForm.pricing_config,
                ...location.pricing_config
            },
            subscription_pricing: {
                ...defaultLocationForm.subscription_pricing,
                ...location.subscription_pricing
            }
        };
        setLocationForm(locationDataWithDefaults);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteLocation = async (id: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus lokasi ini?')) {
            try {
                await api.deleteLocation(id);
                setFormStatus({ location: { message: 'Lokasi berhasil dihapus.', type: 'success' } });
                fetchData();
            } catch (err: any) {
                setFormStatus({ location: { message: err.message, type: 'error' } });
            }
        }
    };
    
    // --- User CRUD ---
    const handleUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormStatus({});
        try {
            if (editingUser) {
                const payload: Partial<Omit<User, 'id'>> = {
                    name: userForm.name,
                    email: userForm.email,
                    location_id: Number(userForm.location_id),
                    role: userForm.role as UserRole,
                };
                await api.updateUser(editingUser.id, payload);
                setFormStatus({ user: { message: 'User berhasil diperbarui!', type: 'success' } });
            } else {
                 await api.addUser({ 
                    name: userForm.name, 
                    email: userForm.email, 
                    password: userForm.password, 
                    location_id: Number(userForm.location_id),
                    role: userForm.role as UserRole,
                 });
                setFormStatus({ user: { message: 'User berhasil ditambahkan!', type: 'success' } });
            }
            handleCancelEdit('user');
            fetchData();
        } catch (err: any) {
            setFormStatus({ user: { message: err.message, type: 'error' } });
        }
    };

    const handleEditUser = (userToEdit: User) => {
        setEditingUser(userToEdit);
        setUserForm({
            name: userToEdit.name,
            email: userToEdit.email,
            password: '', // Password field is cleared for security
            location_id: String(userToEdit.location_id),
            role: userToEdit.role,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteUser = async (id: number) => {
        if (user?.id === id) {
             setFormStatus({ user: { message: 'Anda tidak dapat menghapus akun Anda sendiri.', type: 'error' } });
            return;
        }
        if (window.confirm('Apakah Anda yakin ingin menghapus user ini?')) {
            try {
                await api.deleteUser(id);
                setFormStatus({ user: { message: 'User berhasil dihapus.', type: 'success' } });
                fetchData();
            } catch (err: any) {
                setFormStatus({ user: { message: err.message, type: 'error' } });
            }
        }
    };

    // --- WA Gateway ---
    const handleWaSettingsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('waSettings', JSON.stringify(waSettings));
        setFormStatus({ wa: { message: 'Pengaturan WhatsApp berhasil disimpan!', type: 'success' } });
        if (waSettings.apiUrl && waSettings.apiKey && waSettings.senderNumber) {
            setWaConfigError('');
        } else {
            setWaConfigError("Konfigurasi WhatsApp Gateway belum lengkap. Harap isi API Endpoint, API Key, dan Nomor Pengirim.");
        }
    };

    const handleSendTestNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testPhoneNumber) {
            setFormStatus({ waTest: { message: 'Harap masukkan nomor telepon tujuan.', type: 'error' } });
            return;
        }
        setIsSendingTest(true);
        setFormStatus({});
        try {
            const result = await api.sendTestNotification(testPhoneNumber);
            setFormStatus({ waTest: { message: result.message, type: 'success' } });
        } catch (err: any) {
            setFormStatus({ waTest: { message: err.message, type: 'error' } });
        } finally {
            setIsSendingTest(false);
        }
    };
    
    const formatPricingScheme = (location: LocationType) => {
        const { pricing_scheme, pricing_config } = location;
        switch(pricing_scheme) {
            case PricingScheme.FLAT_PER_COLLECT:
                return `Flat Rp ${pricing_config.flat_rate?.toLocaleString('id-ID')}, ${pricing_config.free_days} hari gratis`;
            case PricingScheme.PROGRESSIVE_DAILY:
                return `Progresif Rp ${pricing_config.first_day_fee?.toLocaleString('id-ID')} / hari, lalu Rp ${pricing_config.subsequent_day_fee?.toLocaleString('id-ID')}`;
            case PricingScheme.MULTI_PACKAGE_DISCOUNT:
                 return `Multi-Paket Rp ${pricing_config.multi_package_first_fee?.toLocaleString('id-ID')} (pertama), Rp ${pricing_config.multi_package_subsequent_fee?.toLocaleString('id-ID')} (selanjutnya)`;
            default:
                return 'Tidak ada skema';
        }
    };

    const renderFormStatus = (formName: string) => {
        const status = formStatus[formName];
        if (!status) return null;
        const color = status.type === 'success' ? 'green' : 'red';
        return <div className={`p-3 my-2 text-sm text-${color}-700 bg-${color}-100 rounded-lg`}>{status.message}</div>;
    };

    const TabButton = ({ id, label }: { id: string, label: string }) => (
        <button onClick={() => setActiveTab(id)} className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors duration-200 ${ activeTab === id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300' }`} >
            {label}
        </button>
    );
    
    const inputClasses = "block w-full px-3 py-2 mt-1 bg-white placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm";
    const btnPrimaryClasses = "flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500";
    const btnSecondaryClasses = "flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500";
    const CodePlaceholder = ({ text }: { text: string }) => <code className="bg-gray-200 text-gray-700 text-xs px-1 rounded">{`{${text}}`}</code>;


    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Pengaturan</h2>
            
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <TabButton id="recipients" label="Penerima" />
                    {user?.role === UserRole.ADMIN && <TabButton id="locations" label="Lokasi & Harga" />}
                    {user?.role === UserRole.ADMIN && <TabButton id="users" label="Users" />}
                    {user?.role === UserRole.ADMIN && <TabButton id="integrations" label="Integrasi" />}
                </nav>
            </div>

            {activeTab === 'recipients' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md">
                            <div className="p-4 border-b"><h3 className="text-lg font-bold">{editingRecipient ? 'Edit Penerima' : 'Tambah Penerima'}</h3></div>
                            <form onSubmit={handleRecipientSubmit} className="p-4 space-y-4">
                                {renderFormStatus('recipient')}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nama</label>
                                    <input type="text" value={recipientForm.name} onChange={(e) => handleFormChange('recipient', 'name', e.target.value)} required className={inputClasses} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tower/Unit</label>
                                    <input type="text" value={recipientForm.towerUnit} onChange={(e) => handleFormChange('recipient', 'towerUnit', e.target.value)} required className={inputClasses} placeholder="e.g. A/101" />
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700">Lokasi</label>
                                    <select value={recipientForm.location_id} onChange={(e) => handleFormChange('recipient', 'location_id', e.target.value)} required className={inputClasses}>
                                        <option value="" disabled>Pilih Lokasi</option>
                                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nomor WA</label>
                                    <input type="text" value={recipientForm.whatsapp} onChange={(e) => handleFormChange('recipient', 'whatsapp', e.target.value)} required className={inputClasses} />
                                </div>
                                <div className="flex flex-col space-y-2 pt-2">
                                    <button type="submit" className={btnPrimaryClasses}>
                                        {editingRecipient ? <><Edit2 className="w-4 h-4 mr-2" /> Simpan Perubahan</> : <><PlusCircle className="w-4 h-4 mr-2" /> Tambah</>}
                                    </button>
                                    {editingRecipient && (
                                        <button type="button" onClick={() => handleCancelEdit('recipient')} className={btnSecondaryClasses}>Batal</button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                         <div className="bg-white rounded-lg shadow-md">
                            <div className="p-4 border-b"><h3 className="text-lg font-bold">Daftar Penerima</h3></div>
                            <div className="p-4 overflow-x-auto"><table className="min-w-full">
                                <thead className="bg-gray-50"><tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                                    {user?.role === UserRole.ADMIN && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lokasi</th>}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tower/Unit</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Whatsapp</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                </tr></thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recipients.map(r => <tr key={r.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.name}</td>
                                        {user?.role === UserRole.ADMIN && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{locations.find(l=>l.id===r.location_id)?.name || 'N/A'}</td>}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.tower}/{r.unit}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.whatsapp}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                           <div className="flex items-center justify-end space-x-2">
                                                <button onClick={() => handleEditRecipient(r)} className="text-primary-600 hover:text-primary-800" title="Edit"><Edit2 className="w-4 h-4"/></button>
                                                <button onClick={() => handleDeleteRecipient(r.id)} className="text-red-600 hover:text-red-800" title="Hapus"><Trash2 className="w-4 h-4"/></button>
                                            </div>
                                        </td>
                                    </tr>)}
                                </tbody>
                            </table></div>
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'locations' && user?.role === UserRole.ADMIN && (
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md">
                             <div className="p-4 border-b"><h3 className="text-lg font-bold">{editingLocation ? 'Edit Lokasi' : 'Tambah Lokasi'}</h3></div>
                            <form onSubmit={handleLocationSubmit} className="p-4 space-y-4">
                                {renderFormStatus('location')}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nama Lokasi</label>
                                    <input type="text" value={locationForm.name} onChange={(e) => handleFormChange('location', 'name', e.target.value)} required className={inputClasses} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <input id="delivery" type="checkbox" checked={locationForm.delivery_enabled} onChange={(e) => handleFormChange('location', 'delivery_enabled', e.target.checked)} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"/>
                                        <label htmlFor="delivery" className="ml-2 block text-sm text-gray-900">Aktifkan Addon Pengantaran</label>
                                    </div>
                                    {locationForm.delivery_enabled && (
                                        <div className="pl-6">
                                            <label className="block text-sm font-medium text-gray-700">Biaya Pengantaran (Rp)</label>
                                            <input type="number" value={locationForm.delivery_fee} onChange={(e) => handleFormChange('location', 'delivery_fee', Number(e.target.value))} required className={inputClasses} />
                                        </div>
                                    )}
                                </div>
                                <hr className="my-2"/>
                                <div>
                                     <label className="block text-sm font-medium text-gray-700">Skema Harga Paket</label>
                                      <select value={locationForm.pricing_scheme} onChange={(e) => handleFormChange('location', 'pricing_scheme', e.target.value)} className={inputClasses}>
                                        <option value={PricingScheme.FLAT_PER_COLLECT}>{PricingScheme.FLAT_PER_COLLECT}</option>
                                        <option value={PricingScheme.PROGRESSIVE_DAILY}>{PricingScheme.PROGRESSIVE_DAILY}</option>
                                        <option value={PricingScheme.MULTI_PACKAGE_DISCOUNT}>{PricingScheme.MULTI_PACKAGE_DISCOUNT}</option>
                                    </select>
                                </div>
                                
                                {locationForm.pricing_scheme === PricingScheme.FLAT_PER_COLLECT && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Harga Flat (Rp)</label>
                                            <input type="number" value={locationForm.pricing_config.flat_rate} onChange={(e) => handleLocationConfigChange('flat_rate', Number(e.target.value))} required className={inputClasses} />
                                        </div>
                                         <div>
                                            <label className="block text-sm font-medium text-gray-700">Hari Gratis</label>
                                            <input type="number" value={locationForm.pricing_config.free_days} onChange={(e) => handleLocationConfigChange('free_days', Number(e.target.value))} required className={inputClasses} />
                                        </div>
                                    </>
                                )}

                                {locationForm.pricing_scheme === PricingScheme.PROGRESSIVE_DAILY && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Harga Hari Pertama (Rp)</label>
                                            <input type="number" value={locationForm.pricing_config.first_day_fee} onChange={(e) => handleLocationConfigChange('first_day_fee', Number(e.target.value))} required className={inputClasses} />
                                        </div>
                                         <div>
                                            <label className="block text-sm font-medium text-gray-700">Harga Hari Berikutnya (Rp)</label>
                                            <input type="number" value={locationForm.pricing_config.subsequent_day_fee} onChange={(e) => handleLocationConfigChange('subsequent_day_fee', Number(e.target.value))} required className={inputClasses} />
                                        </div>
                                    </>
                                )}
                                
                                {locationForm.pricing_scheme === PricingScheme.MULTI_PACKAGE_DISCOUNT && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Harga Paket Pertama (Rp)</label>
                                            <input type="number" value={locationForm.pricing_config.multi_package_first_fee} onChange={(e) => handleLocationConfigChange('multi_package_first_fee', Number(e.target.value))} required className={inputClasses} />
                                        </div>
                                         <div>
                                            <label className="block text-sm font-medium text-gray-700">Harga Paket Selanjutnya (Rp)</label>
                                            <input type="number" value={locationForm.pricing_config.multi_package_subsequent_fee} onChange={(e) => handleLocationConfigChange('multi_package_subsequent_fee', Number(e.target.value))} required className={inputClasses} />
                                        </div>
                                    </>
                                )}

                                <hr className="my-4"/>
                                <h4 className="text-md font-semibold text-gray-800">Harga Langganan</h4>
                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-x-4 items-center">
                                        <label className="text-sm font-medium text-gray-700">1 Bulan (Rp)</label>
                                        <input type="number" value={locationForm.subscription_pricing?.[1]} onChange={(e) => handleSubscriptionPriceChange('1', Number(e.target.value))} className={inputClasses} />
                                    </div>
                                     <div className="grid grid-cols-2 gap-x-4 items-center">
                                        <label className="text-sm font-medium text-gray-700">3 Bulan (Rp)</label>
                                        <input type="number" value={locationForm.subscription_pricing?.[3]} onChange={(e) => handleSubscriptionPriceChange('3', Number(e.target.value))} className={inputClasses} />
                                    </div>
                                     <div className="grid grid-cols-2 gap-x-4 items-center">
                                        <label className="text-sm font-medium text-gray-700">6 Bulan (Rp)</label>
                                        <input type="number" value={locationForm.subscription_pricing?.[6]} onChange={(e) => handleSubscriptionPriceChange('6', Number(e.target.value))} className={inputClasses} />
                                    </div>
                                     <div className="grid grid-cols-2 gap-x-4 items-center">
                                        <label className="text-sm font-medium text-gray-700">12 Bulan (Rp)</label>
                                        <input type="number" value={locationForm.subscription_pricing?.[12]} onChange={(e) => handleSubscriptionPriceChange('12', Number(e.target.value))} className={inputClasses} />
                                    </div>
                                </div>


                                <div className="flex flex-col space-y-2 pt-2">
                                    <button type="submit" className={btnPrimaryClasses}>
                                         {editingLocation ? <><Edit2 className="w-4 h-4 mr-2" /> Simpan Perubahan</> : <><PlusCircle className="w-4 h-4 mr-2" /> Tambah</>}
                                    </button>
                                    {editingLocation && (
                                        <button type="button" onClick={() => handleCancelEdit('location')} className={btnSecondaryClasses}>Batal</button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                     <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md">
                            <div className="p-4 border-b"><h3 className="text-lg font-bold">Daftar Lokasi</h3></div>
                            <div className="p-4 overflow-x-auto"><table className="min-w-full">
                                <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skema Harga</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pengantaran</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th></tr></thead>
                                <tbody className="bg-white divide-y divide-gray-200">{locations.map(l => <tr key={l.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{l.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPricingScheme(l)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {l.delivery_enabled 
                                            ? <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Aktif (Rp {l.delivery_fee?.toLocaleString('id-ID')})</span> 
                                            : <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Tidak Aktif</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => handleEditLocation(l)} className="text-primary-600 hover:text-primary-800" title="Edit"><Edit2 className="w-4 h-4"/></button>
                                            <button onClick={() => handleDeleteLocation(l.id)} className="text-red-600 hover:text-red-800" title="Hapus"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    </td>
                                </tr>)}</tbody>
                            </table></div>
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'users' && user?.role === UserRole.ADMIN && (
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md">
                             <div className="p-4 border-b"><h3 className="text-lg font-bold">{editingUser ? 'Edit User' : 'Tambah User'}</h3></div>
                            <form onSubmit={handleUserSubmit} className="p-4 space-y-4">
                                {renderFormStatus('user')}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nama</label>
                                    <input type="text" value={userForm.name} onChange={(e) => handleFormChange('user', 'name', e.target.value)} required className={inputClasses} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input type="email" value={userForm.email} onChange={(e) => handleFormChange('user', 'email', e.target.value)} required className={inputClasses} />
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <input type="password" value={userForm.password} onChange={(e) => handleFormChange('user', 'password', e.target.value)} required={!editingUser} className={inputClasses} placeholder={editingUser ? "Kosongkan jika tidak diubah" : ""} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Role</label>
                                    <select value={userForm.role} onChange={(e) => handleFormChange('user', 'role', e.target.value)} required className={inputClasses}>
                                        {Object.values(UserRole).map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Lokasi Penugasan</label>
                                    <select value={userForm.location_id} onChange={(e) => handleFormChange('user', 'location_id', e.target.value)} required className={inputClasses}>
                                        <option value="" disabled>Pilih Lokasi</option>
                                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col space-y-2 pt-2">
                                    <button type="submit" className={btnPrimaryClasses}>
                                        {editingUser ? <><Edit2 className="w-4 h-4 mr-2" /> Simpan Perubahan</> : <><PlusCircle className="w-4 h-4 mr-2" /> Tambah</>}
                                    </button>
                                     {editingUser && (
                                        <button type="button" onClick={() => handleCancelEdit('user')} className={btnSecondaryClasses}>Batal</button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                     <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md">
                             <div className="p-4 border-b"><h3 className="text-lg font-bold">Daftar User</h3></div>
                             <div className="p-4 overflow-x-auto"><table className="min-w-full">
                                <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lokasi</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th></tr></thead>
                                <tbody className="bg-white divide-y divide-gray-200">{users.map(u => <tr key={u.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{locations.find(l=>l.id===u.location_id)?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => handleEditUser(u)} className="text-primary-600 hover:text-primary-800" title="Edit"><Edit2 className="w-4 h-4"/></button>
                                            <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:text-red-800" title="Hapus" disabled={user?.id === u.id}><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    </td>
                                </tr>)}</tbody>
                            </table></div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'integrations' && user?.role === UserRole.ADMIN && (
                <div className="space-y-6">
                    {waConfigError && (
                        <div className="p-4 text-sm text-red-800 bg-red-100 rounded-lg" role="alert">
                            <span className="font-medium">Perhatian!</span> {waConfigError}
                        </div>
                    )}
                    <div className="bg-white rounded-lg shadow-md max-w-3xl">
                         <div className="p-4 border-b"><h3 className="text-lg font-bold">Konfigurasi WhatsApp Gateway</h3></div>
                         <form onSubmit={handleWaSettingsSubmit} className="p-4 space-y-6">
                             <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 rounded-md" role="alert">
                                <h3 className="font-bold">Solusi untuk Error "Failed to Fetch" (CORS)</h3>
                                <p className="text-sm mt-1">Jika Anda mengalami error saat mengirim notifikasi, kemungkinan besar disebabkan oleh pembatasan CORS dari server API WhatsApp.</p>
                                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                                    <li><strong>Cara Mengatasi:</strong> Gunakan "CORS Proxy URL". Proxy ini bertindak sebagai perantara yang aman antara aplikasi Anda dan API WhatsApp.</li>
                                    <li><strong>Keuntungan:</strong> Menghilangkan error CORS dan menyembunyikan API Key Anda dari browser, sehingga lebih aman.</li>
                                    <li><strong>Tanpa Proxy:</strong> Panggilan akan dilakukan langsung dari browser, yang dapat menyebabkan error CORS dan mengekspos API Key Anda.</li>
                                </ul>
                                <p className="text-sm mt-2">Untuk production, penggunaan proxy sangat direkomendasikan.</p>
                            </div>
                            {renderFormStatus('wa')}
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="apiUrl" className="block text-sm font-medium text-gray-700">API Endpoint</label>
                                    <input id="apiUrl" type="url" value={waSettings.apiUrl} onChange={(e) => handleWaSettingsChange('apiUrl', e.target.value)} required className={inputClasses} placeholder="https://zapin.my.id/send-message" />
                                </div>
                                <div>
                                    <label htmlFor="proxyUrl" className="block text-sm font-medium text-gray-700">CORS Proxy URL <span className="text-gray-400 font-normal">(Opsional)</span></label>
                                    <input id="proxyUrl" type="url" value={waSettings.proxyUrl || ''} onChange={(e) => handleWaSettingsChange('proxyUrl', e.target.value)} className={inputClasses} placeholder="e.g. https://your-proxy-function.com" />
                                    <p className="mt-1 text-xs text-gray-500">Isi ini untuk mengatasi error CORS dan mengamankan API Key Anda.</p>
                                </div>
                                 <div>
                                    <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">API Key</label>
                                    <input id="apiKey" type="text" value={waSettings.apiKey} onChange={(e) => handleWaSettingsChange('apiKey', e.target.value)} required className={inputClasses} />
                                </div>
                                 <div>
                                    <label htmlFor="senderNumber" className="block text-sm font-medium text-gray-700">Nomor Pengirim</label>
                                    <input id="senderNumber" type="text" value={waSettings.senderNumber} onChange={(e) => handleWaSettingsChange('senderNumber', e.target.value)} required className={inputClasses} placeholder="628xxxxxxxxxx" />
                                </div>
                            </div>
                            
                            <hr/>

                            <div>
                                <h4 className="font-semibold text-gray-800">Konfigurasi Link Publik</h4>
                                <p className="text-xs text-gray-500 mb-2">URL ini akan menjadi dasar untuk link yang dikirim ke pelanggan.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">URL Dasar Link Pembayaran</label>
                                        <input type="url" value={waSettings.paymentLinkBaseUrl} onChange={(e) => handleWaSettingsChange('paymentLinkBaseUrl', e.target.value)} required className={inputClasses} placeholder="https://domain-anda.com/bayar" />
                                        <p className="mt-1 text-xs text-gray-500">Hasil: {waSettings.paymentLinkBaseUrl}/<span className="font-mono">PKP-ABC123</span></p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">URL Dasar Link Perpanjangan</label>
                                        <input type="url" value={waSettings.renewalLinkBaseUrl} onChange={(e) => handleWaSettingsChange('renewalLinkBaseUrl', e.target.value)} required className={inputClasses} placeholder="https://domain-anda.com/perpanjang" />
                                         <p className="mt-1 text-xs text-gray-500">Hasil: {waSettings.renewalLinkBaseUrl}/<span className="font-mono">123</span></p>
                                    </div>
                                </div>
                            </div>

                            <hr/>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-gray-800">Template: Notifikasi Paket Reguler</h4>
                                    <p className="text-xs text-gray-500 mb-1">Pesan ini dikirim saat paket baru diterima.</p>
                                    <textarea value={waSettings.regularTemplate} onChange={(e) => handleWaSettingsChange('regularTemplate', e.target.value)} required rows={4} className={inputClasses}></textarea>
                                    <p className="mt-1 text-xs text-gray-500">Gunakan: <CodePlaceholder text="namaPenerima"/>, <CodePlaceholder text="awb"/>, <CodePlaceholder text="ekspedisi"/>, <CodePlaceholder text="lokasi"/>, <CodePlaceholder text="paymentLink"/></p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-800">Template: Aktivasi / Perpanjangan Langganan</h4>
                                    <p className="text-xs text-gray-500 mb-1">Pesan ini dikirim saat langganan berhasil dibuat atau diperpanjang.</p>
                                    <textarea value={waSettings.subscriptionActivationTemplate} onChange={(e) => handleWaSettingsChange('subscriptionActivationTemplate', e.target.value)} required rows={4} className={inputClasses}></textarea>
                                    <p className="mt-1 text-xs text-gray-500">Gunakan: <CodePlaceholder text="namaPenerima"/>, <CodePlaceholder text="tanggalMulai"/>, <CodePlaceholder text="tanggalBerakhir"/></p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-800">Template: Pengingat Berakhir Langganan</h4>
                                    <p className="text-xs text-gray-500 mb-1">Pesan ini dikirim H-3 sebelum langganan berakhir.</p>
                                    <textarea value={waSettings.subscriptionReminderTemplate} onChange={(e) => handleWaSettingsChange('subscriptionReminderTemplate', e.target.value)} required rows={4} className={inputClasses}></textarea>
                                    <p className="mt-1 text-xs text-gray-500">Gunakan: <CodePlaceholder text="namaPenerima"/>, <CodePlaceholder text="tanggalBerakhir"/>, <CodePlaceholder text="sisaHari"/>, <CodePlaceholder text="linkPerpanjang"/></p>
                                </div>
                            </div>
                            
                            <div className="pt-2 flex justify-end">
                                <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                                    Simpan Pengaturan
                                </button>
                            </div>
                         </form>
                    </div>

                    <div className="bg-white rounded-lg shadow-md max-w-3xl">
                         <div className="p-4 border-b"><h3 className="text-lg font-bold">Uji Coba Notifikasi</h3></div>
                         <form onSubmit={handleSendTestNotification} className="p-4 space-y-4">
                            {renderFormStatus('waTest')}
                            <p className="text-sm text-gray-600">Gunakan fitur ini untuk memastikan konfigurasi WhatsApp Gateway Anda berfungsi dengan benar. Pesan tes akan dikirim ke nomor tujuan.</p>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Nomor Telepon Tujuan (dengan kode negara)</label>
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <input 
                                        type="text" 
                                        value={testPhoneNumber}
                                        onChange={(e) => setTestPhoneNumber(e.target.value)}
                                        required 
                                        className="focus:ring-primary-500 focus:border-primary-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300" 
                                        placeholder="6281234567890" 
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={isSendingTest}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                                    >
                                        <Send className="w-4 h-4 mr-2"/>
                                        {isSendingTest ? 'Mengirim...' : 'Kirim Tes'}
                                    </button>
                                </div>
                            </div>
                         </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;