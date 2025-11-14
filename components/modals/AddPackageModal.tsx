import React, { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Recipient, Expedition, Location, SizePricing } from '../../types';
import { X, Camera } from 'lucide-react';

interface AddPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddPackageModal: React.FC<AddPackageModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [awb, setAwb] = useState('');
    const [recipientId, setRecipientId] = useState<number | ''>('');
    const [expeditionId, setExpeditionId] = useState<number | ''>('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [expeditions, setExpeditions] = useState<Expedition[]>([]);
    
    const [isScannerOpen, setScannerOpen] = useState(false);
    const [selectedRecipientWa, setSelectedRecipientWa] = useState('');
    
    const [isDelivery, setIsDelivery] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<Location | null>(null);


    useEffect(() => {
        if (!isOpen) return;
        const loadData = async () => {
            if (!user) return;
            const [recData, expData, locData] = await Promise.all([
                api.getRecipients(),
                api.getExpeditions(),
                api.getLocations(),
            ]);
            setRecipients(recData);
            setExpeditions(expData);
            const userLocation = locData.find(l => l.id === user.location_id);
            setCurrentLocation(userLocation || null);
        };
        loadData();
    }, [user, isOpen]);
    
    useEffect(() => {
        if (!isScannerOpen) return;

        const qrScanner = new Html5Qrcode('qr-reader-modal');
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        const startScanner = async () => {
            try {
                await qrScanner.start({ facingMode: "environment" }, config, 
                (decodedText) => {
                    setAwb(decodedText);
                    setScannerOpen(false);
                }, 
                (errorMessage) => {
                    // console.log(errorMessage);
                });
            } catch (err) {
                console.error("Failed to start QR scanner:", err);
                setError("Kamera tidak ditemukan atau izin ditolak.");
                setScannerOpen(false);
            }
        };

        startScanner();

        return () => {
            qrScanner.stop().catch(err => console.log("Failed to stop scanner", err));
        };
    }, [isScannerOpen]);

    const resetForm = () => {
        setAwb('');
        setRecipientId('');
        setExpeditionId('');
        setPhoto(null);
        setError('');
        setMessage('');
        setSelectedRecipientWa('');
        setIsDelivery(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleRecipientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = Number(e.target.value);
        setRecipientId(selectedId);
        const selectedRec = recipients.find(r => r.id === selectedId);
        setSelectedRecipientWa(selectedRec ? selectedRec.whatsapp : '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!awb || !recipientId || !expeditionId || !user) {
            setError("Harap isi semua kolom yang wajib diisi.");
            return;
        }

        setError('');
        setMessage('');
        setSubmitting(true);

        try {
            await api.addPackage({
                awb,
                recipient_id: Number(recipientId),
                expedition_id: Number(expeditionId),
                location_id: user.location_id,
                isDelivery: isDelivery,
            });
            setMessage(`Paket dengan AWB ${awb} berhasil ditambahkan!`);
            onSuccess(); // Refresh dashboard data
            setTimeout(() => {
                handleClose();
            }, 1500);
        } catch (err: any) {
            const errorMessage = err.message || 'Gagal menambahkan paket.';
            setError(errorMessage);
            // If the error message indicates the package was added despite a notification failure,
            // we must still call onSuccess() to refresh the package list on the dashboard.
            if (errorMessage.startsWith('Paket berhasil ditambahkan, TAPI GAGAL')) {
                onSuccess();
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-10 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full m-4 relative animate-fade-in-down">
                <div className="flex justify-between items-center p-4 border-b">
                     <h2 className="text-xl font-bold text-gray-800">Input Paket Baru</h2>
                     <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                
                 <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}
                        {message && <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">{message}</div>}

                        {isScannerOpen && (
                            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm z-50 flex flex-col justify-center items-center p-4">
                                <div id="qr-reader-modal" className="w-full max-w-sm bg-white rounded-lg p-4 shadow-xl"></div>
                                <button onClick={() => setScannerOpen(false)} className="mt-4 px-4 py-2 bg-white text-gray-800 rounded-md shadow-lg">Tutup</button>
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700">AWB (Air Waybill)</label>
                            <div className="relative mt-1">
                                <input type="text" value={awb} onChange={(e) => setAwb(e.target.value)} required className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 pr-10"/>
                                <button type="button" onClick={() => setScannerOpen(true)} title="Scan AWB" className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-primary-600">
                                    <Camera className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Penerima</label>
                            <select value={recipientId} onChange={handleRecipientChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                                <option value="" disabled>Pilih Penerima</option>
                                {recipients.map(r => <option key={r.id} value={r.id}>{r.name} - {r.tower} {r.unit}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nomor WA</label>
                            <input type="text" value={selectedRecipientWa} readOnly className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ekspedisi</label>
                             <select value={expeditionId} onChange={(e) => setExpeditionId(Number(e.target.value))} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                                <option value="" disabled>Pilih Ekspedisi</option>
                                {expeditions.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>
                        {currentLocation?.delivery_enabled && (
                            <div>
                                <div className="flex items-center">
                                    <input 
                                        id="delivery-modal" 
                                        type="checkbox" 
                                        checked={isDelivery} 
                                        onChange={(e) => setIsDelivery(e.target.checked)} 
                                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                    />
                                    <label htmlFor="delivery-modal" className="ml-2 block text-sm font-medium text-gray-900">Addon Pengantaran</label>
                                </div>
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
                                    <p className="text-xs text-gray-500">{photo ? photo.name : 'PNG, JPG, up to 10MB'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-end p-4 border-t bg-gray-50 rounded-b-lg">
                        <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                            Batal
                        </button>
                        <button type="submit" disabled={submitting} className="ml-3 w-full sm:w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400">
                            {submitting ? 'Menyimpan...' : 'Simpan Paket'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPackageModal;