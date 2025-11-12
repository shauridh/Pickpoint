import React, { useState, useEffect } from 'react';
import { Package, Recipient, Expedition, PackageStatus, Location } from '../../types';
import { api } from '../../services/api';
import { X } from 'lucide-react';
import { calculatePrice } from '../../utils/priceCalculator';

interface PackageDetailModalProps {
  pkg: Package | null;
  isOpen: boolean;
  onClose: () => void;
}

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


const PackageDetailModal: React.FC<PackageDetailModalProps> = ({ pkg, isOpen, onClose }) => {
    const [recipient, setRecipient] = useState<Recipient | null>(null);
    const [expedition, setExpedition] = useState<Expedition | null>(null);
    const [location, setLocation] = useState<Location | null>(null);
    const [currentPrice, setCurrentPrice] = useState(0);

    useEffect(() => {
        if (!pkg) return;
        const fetchDetails = async () => {
            const [recipients, expeditions, locations] = await Promise.all([
                api.getRecipients(),
                api.getExpeditions(),
                api.getLocations()
            ]);
            const pkgLocation = locations.find(l => l.id === pkg.location_id) || null;
            setRecipient(recipients.find(r => r.id === pkg.recipient_id) || null);
            setExpedition(expeditions.find(e => e.id === pkg.expedition_id) || null);
            setLocation(pkgLocation);
            
            if (pkg.status === PackageStatus.WAITING_PICKUP && pkgLocation) {
                setCurrentPrice(calculatePrice(pkg.created_at, pkgLocation));
            } else {
                setCurrentPrice(pkg.price);
            }
        };
        fetchDetails();
    }, [pkg]);

    if (!isOpen || !pkg) return null;
    
    const daysStored = pkg.picked_at 
        ? Math.ceil((new Date(pkg.picked_at).getTime() - new Date(pkg.created_at).getTime()) / (1000 * 3600 * 24))
        : Math.ceil((new Date().getTime() - new Date(pkg.created_at).getTime()) / (1000 * 3600 * 24));


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full relative animate-fade-in-down">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Detail Paket: <span className="text-primary-600">{pkg.awb}</span></h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
                    <div className="md:col-span-2 flex justify-center items-start bg-gray-100 p-2 rounded-lg">
                        <img src={pkg.photo_url} alt={`Foto paket ${pkg.awb}`} className="rounded-lg max-h-80 shadow-md object-contain" />
                    </div>
                    <div className="md:col-span-3">
                        <dl>
                            <DetailRow label="Status" value={<StatusBadge status={pkg.status} />} />
                            <DetailRow label="Penerima" value={`${recipient?.name} (${recipient?.tower} / ${recipient?.unit})`} />
                            <DetailRow label="Ekspedisi" value={expedition?.name} />
                            <DetailRow label="Tgl Masuk" value={new Date(pkg.created_at).toLocaleString('id-ID')} />
                            <DetailRow label="Tgl Diambil" value={pkg.picked_at ? new Date(pkg.picked_at).toLocaleString('id-ID') : '-'} />
                             <DetailRow label="Durasi Simpan" value={`${daysStored} hari`} />
                             <DetailRow label="Skema Harga" value={location?.pricing_scheme} />
                            <DetailRow label="Biaya Simpan" value={`Rp ${currentPrice.toLocaleString('id-ID')}`} />
                            <DetailRow label="Biaya Antar" value={`Rp ${pkg.delivery_fee.toLocaleString('id-ID')}`} />
                             <DetailRow label="Total Biaya" value={<span className="font-bold text-lg text-primary-700">Rp {(currentPrice + pkg.delivery_fee).toLocaleString('id-ID')}</span>} />
                        </dl>
                    </div>
                </div>
                 <div className="flex items-center justify-end p-4 border-t bg-gray-50 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700">
                            Tutup
                        </button>
                 </div>
            </div>
        </div>
    );
};

export default PackageDetailModal;