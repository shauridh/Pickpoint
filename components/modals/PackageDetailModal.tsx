import React, { useState, useEffect } from 'react';
import { Package, Recipient, Expedition, PackageStatus, Location, PaymentStatus } from '../../types';
import { api } from '../../services/api';
import { X, CheckCircle, PackageCheck, CreditCard } from 'lucide-react';
import { calculatePrice } from '../../utils/priceCalculator';

interface PackageDetailModalProps {
  pkg: Package | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  allPackages: Package[];
  recipients: Recipient[];
}

const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => {
    const baseClasses = "px-3 py-1 text-sm font-semibold rounded-full inline-block";
    switch (status) {
        case PaymentStatus.UNPAID:
            return <span className={`${baseClasses} bg-red-100 text-red-800`}>{status}</span>;
        case PaymentStatus.PAID:
            return <span className={`${baseClasses} bg-green-100 text-green-800`}>{status}</span>;
        default:
            return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
};

const StatusBadge = ({ status }: { status: PackageStatus }) => {
    const baseClasses = "px-3 py-1 text-sm font-semibold rounded-full inline-block";
    switch (status) {
        case PackageStatus.WAITING_PICKUP:
            return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>{status}</span>;
        case PackageStatus.PICKED_UP:
            return <span className={`${baseClasses} bg-green-100 text-green-800`}>{status}</span>;
        default:
            return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
};

const DetailRow = ({ label, value }: { label: string, value: React.ReactNode | string | undefined | null }) => (
    <div className="py-2.5 grid grid-cols-3 gap-4 border-b border-gray-100 last:border-b-0">
        <dt className="text-sm font-medium text-gray-500 col-span-1">{label}</dt>
        <dd className="text-sm text-gray-900 col-span-2 font-medium">{value || '-'}</dd>
    </div>
);


const PackageDetailModal: React.FC<PackageDetailModalProps> = ({ pkg: initialPkg, isOpen, onClose, onSuccess, allPackages, recipients }) => {
    const [pkg, setPkg] = useState<Package | null>(initialPkg);
    const [recipient, setRecipient] = useState<Recipient | null>(null);
    const [expedition, setExpedition] = useState<Expedition | null>(null);
    const [location, setLocation] = useState<Location | null>(null);
    const [currentPrice, setCurrentPrice] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setProcessing(false);
                setError('');
                setSuccess('');
            }, 300);
            return;
        }
        
        setPkg(initialPkg); // Update internal state if initialPkg changes

        if (!initialPkg) return;
        
        const fetchDetails = async () => {
            const [expeditions, locations] = await Promise.all([
                api.getExpeditions(),
                api.getLocations()
            ]);
            const pkgLocation = locations.find(l => l.id === initialPkg.location_id) || null;
            const pkgRecipient = recipients.find(r => r.id === initialPkg.recipient_id) || null;
            
            setRecipient(pkgRecipient);
            setExpedition(expeditions.find(e => e.id === initialPkg.expedition_id) || null);
            setLocation(pkgLocation);
            
            if (initialPkg.status === PackageStatus.WAITING_PICKUP && pkgLocation && pkgRecipient) {
                setCurrentPrice(calculatePrice(initialPkg, allPackages, pkgLocation, pkgRecipient));
            } else {
                setCurrentPrice(initialPkg.price);
            }
        };
        fetchDetails();
    }, [initialPkg, isOpen, allPackages, recipients]);
    
    const handlePickup = async () => {
        if (!pkg) return;
        setProcessing(true);
        setError('');
        setSuccess('');
        try {
            await api.pickupPackage(pkg.pickup_code);
            setSuccess('Paket berhasil diserahkan!');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'Gagal menyerahkan paket.');
            setProcessing(false);
        }
    };

    const handleMarkAsPaid = async () => {
        if (!pkg) return;
        setProcessing(true);
        setError('');
        setSuccess('');
        try {
            const updatedPkg = await api.markAsPaid(pkg.pickup_code);
            setPkg(updatedPkg); // update local state to re-render UI
            setSuccess('Pembayaran berhasil dikonfirmasi!');
            onSuccess(); // Refresh dashboard
        } catch (err: any) {
            setError(err.message || 'Gagal mengonfirmasi pembayaran.');
        } finally {
            setProcessing(false);
        }
    };

    if (!isOpen || !pkg) return null;
    
    const daysStored = pkg.picked_at 
        ? Math.ceil((new Date(pkg.picked_at).getTime() - new Date(pkg.created_at).getTime()) / (1000 * 3600 * 24))
        : Math.ceil((new Date().getTime() - new Date(pkg.created_at).getTime()) / (1000 * 3600 * 24));

    const isSubscribed = recipient?.subscription_start_date &&
                         recipient?.subscription_end_date &&
                         new Date(recipient.subscription_start_date) <= new Date() &&
                         new Date(recipient.subscription_end_date) >= new Date();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full relative animate-fade-in-down">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Detail Paket: <span className="text-primary-600">{pkg.awb}</span></h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
                        <div className="md:col-span-2 flex justify-center items-start bg-gray-100 p-2 rounded-lg">
                            <img src={pkg.photo_url} alt={`Foto paket ${pkg.awb}`} className="rounded-lg max-h-80 shadow-md object-contain" />
                        </div>
                        <div className="md:col-span-3">
                            <dl>
                                <DetailRow label="Status Paket" value={<StatusBadge status={pkg.status} />} />
                                <DetailRow label="Status Bayar" value={<PaymentStatusBadge status={pkg.payment_status} />} />
                                <DetailRow label="Penerima" value={`${recipient?.name} (${recipient?.tower} / ${recipient?.unit})`} />
                                {isSubscribed && (
                                     <DetailRow label="Langganan" value={<span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Aktif</span>} />
                                )}
                                <DetailRow label="Tgl Masuk" value={new Date(pkg.created_at).toLocaleString('id-ID')} />
                                {pkg.payment_status === PaymentStatus.PAID && (
                                    <DetailRow label="Kode Unik" value={<span className="font-mono text-lg bg-gray-100 px-2 py-1 rounded">{pkg.pickup_code}</span>} />
                                )}
                                <DetailRow label="Biaya Simpan" value={`Rp ${currentPrice.toLocaleString('id-ID')}`} />
                                <DetailRow label="Biaya Antar" value={`Rp ${pkg.delivery_fee.toLocaleString('id-ID')}`} />
                                 <DetailRow label="Total Biaya" value={<span className="font-bold text-lg text-primary-700">Rp {(currentPrice + pkg.delivery_fee).toLocaleString('id-ID')}</span>} />
                                {pkg.payment_status === PaymentStatus.UNPAID && (
                                     <DetailRow label="Link Bayar" value={<a href={pkg.payment_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{pkg.payment_link}</a>} />
                                )}
                            </dl>
                        </div>
                    </div>
                    {error && <div className="mt-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}
                    {success && (
                        <div className="mt-4 p-3 text-sm text-green-700 bg-green-100 rounded-lg flex items-center">
                           <CheckCircle className="w-5 h-5 mr-2"/> {success}
                        </div>
                    )}
                </div>
                 <div className="flex items-center justify-end p-4 border-t bg-gray-50 rounded-b-lg space-x-3">
                        {pkg.status === PackageStatus.WAITING_PICKUP && pkg.payment_status === PaymentStatus.UNPAID && (
                            <button
                                type="button"
                                onClick={handleMarkAsPaid}
                                disabled={processing}
                                className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                            >
                                <CreditCard className="w-5 h-5 mr-2" />
                                {processing ? 'Memproses...' : 'Tandai Lunas'}
                            </button>
                        )}
                        {pkg.status === PackageStatus.WAITING_PICKUP && (
                             <button 
                                 type="button" 
                                 onClick={handlePickup} 
                                 disabled={processing || !!success || pkg.payment_status !== PaymentStatus.PAID}
                                 title={pkg.payment_status !== PaymentStatus.PAID ? 'Paket harus lunas terlebih dahulu' : 'Konfirmasi Pengambilan'}
                                 className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 disabled:cursor-not-allowed"
                             >
                                 <PackageCheck className="w-5 h-5 mr-2" />
                                 {processing ? 'Memproses...' : 'Konfirmasi Pengambilan'}
                             </button>
                        )}
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                            Tutup
                        </button>
                 </div>
            </div>
        </div>
    );
};

export default PackageDetailModal;