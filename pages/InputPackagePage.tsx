

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Recipient, Expedition, Location, SizePricing } from '../types';

interface InputPackagePageProps {
  setPage: (page: string) => void;
}

const InputPackagePage: React.FC<InputPackagePageProps> = ({ setPage }) => {
    const { user } = useAuth();
    const [awb, setAwb] = useState('');
    const [recipientId, setRecipientId] = useState<number | ''>('');
    const [expeditionId, setExpeditionId] = useState<number | ''>('');
    const [size, setSize] = useState('');
    const [delivery, setDelivery] = useState(false);
    const [deliveryFee, setDeliveryFee] = useState<number | ''>('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [expeditions, setExpeditions] = useState<Expedition[]>([]);
    const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
    const [sizePricing, setSizePricing] = useState<SizePricing[]>([]);

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            const [recData, expData, locData] = await Promise.all([
                api.getRecipients(),
                api.getExpeditions(),
                api.getLocations()
            ]);
            setRecipients(recData);
            setExpeditions(expData);
            const userLocation = locData.find(l => l.id === user.location_id);
            if (userLocation) {
                setCurrentLocation(userLocation);
                // Fix: Fetch size pricing data and check its length to determine if sizing is enabled,
                // instead of relying on a non-existent 'sizing_enabled' property.
                const pricingData = await api.getSizePricing(userLocation.id);
                setSizePricing(pricingData);
            }
        };
        loadData();
    }, [user]);

    const handleDeliveryChange = (checked: boolean) => {
        setDelivery(checked);
        if (!checked) {
            setDeliveryFee('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!awb || !recipientId || !expeditionId || !user || !currentLocation) {
            setError("Harap isi semua kolom yang wajib diisi.");
            return;
        }

        if (sizePricing.length > 0 && !size) {
            setError("Harap pilih ukuran paket.");
            return;
        }

        if (delivery && (deliveryFee === '' || Number(deliveryFee) < 0)) {
            setError("Harap isi biaya pengantaran yang valid.");
            return;
        }

        setError('');
        setMessage('');
        setSubmitting(true);

        try {
            // Fix: Add missing 'delivery_fee' property to fix type error.
            await api.addPackage({
                awb,
                recipient_id: Number(recipientId),
                expedition_id: Number(expeditionId),
                size: size || undefined,
                location_id: user.location_id,
                delivery_fee: delivery ? Number(deliveryFee) : 0,
            });
            setMessage(`Paket dengan AWB ${awb} berhasil ditambahkan!`);
            // Reset form
            setAwb('');
            setRecipientId('');
            setExpeditionId('');
            setSize('');
            setDelivery(false);
            setDeliveryFee('');
            setPhoto(null);
            setTimeout(() => setPage('packages'), 2000);
        // Fix: Refactor catch block to be more type-safe, resolving cascading scope errors.
        } catch (err) {
            setError((err as Error).message || 'Gagal menambahkan paket.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Input Paket Baru</h2>

            {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}
            {message && <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">{message}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">AWB (Air Waybill)</label>
                    <input type="text" value={awb} onChange={(e) => setAwb(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Penerima</label>
                    <select value={recipientId} onChange={(e) => setRecipientId(Number(e.target.value))} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                        <option value="" disabled>Pilih Penerima</option>
                        {recipients.map(r => <option key={r.id} value={r.id}>{r.name} - {r.tower} {r.unit}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Ekspedisi</label>
                     <select value={expeditionId} onChange={(e) => setExpeditionId(Number(e.target.value))} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                        <option value="" disabled>Pilih Ekspedisi</option>
                        {expeditions.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                </div>
                {/* Fix: Use sizePricing.length to conditionally render the size selection UI. */}
                {sizePricing.length > 0 && (
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Ukuran</label>
                        <select value={size} onChange={(e) => setSize(e.target.value)} required={sizePricing.length > 0} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                             <option value="" disabled>Pilih Ukuran</option>
                             {sizePricing.map(p => <option key={p.id} value={p.size_label}>{p.size_label} - Rp {p.price.toLocaleString('id-ID')}</option>)}
                        </select>
                    </div>
                )}
                 {currentLocation?.delivery_enabled && (
                    <div>
                         <div className="flex items-center">
                             <input id="delivery" type="checkbox" checked={delivery} onChange={(e) => handleDeliveryChange(e.target.checked)} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"/>
                            <label htmlFor="delivery" className="ml-2 block text-sm text-gray-900">Addon Pengantaran</label>
                        </div>
                        {delivery && (
                           <div className="mt-2">
                               <label className="block text-sm font-medium text-gray-700">Biaya Pengantaran (Rp)</label>
                               <input 
                                   type="number" 
                                   value={deliveryFee} 
                                   onChange={(e) => setDeliveryFee(e.target.value === '' ? '' : Number(e.target.value))} 
                                   required 
                                   placeholder="Masukkan biaya antar"
                                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                               />
                           </div>
                       )}
                    </div>
                 )}
                <div>
                     <label className="block text-sm font-medium text-gray-700">Foto Paket</label>
                     <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                         <div className="space-y-1 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="flex text-sm text-gray-600">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                                    <span>Upload a file</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={e => setPhoto(e.target.files ? e.target.files[0] : null)} />
                                </label>
                                <p className="pl-1">atau drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">{photo ? photo.name : 'PNG, JPG, GIF up to 10MB'}</p>
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <button type="submit" disabled={submitting} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300">
                        {submitting ? 'Menyimpan...' : 'Simpan Paket'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default InputPackagePage;