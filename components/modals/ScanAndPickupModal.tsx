import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../../services/api';
import { Package, Recipient, Location, PackageStatus } from '../../types';
import { X, CheckCircle } from 'lucide-react';

interface ScanAndPickupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ScanAndPickupModal: React.FC<ScanAndPickupModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [scannedPackage, setScannedPackage] = useState<Package | null>(null);
    const [recipient, setRecipient] = useState<Recipient | null>(null);
    const [location, setLocation] = useState<Location | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);
    const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);

    useEffect(() => {
        if (!isOpen) {
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().catch(err => console.error("Failed to stop scanner on close.", err));
            }
            resetState();
            return;
        }

        if (!scannedPackage && !html5QrCode) {
            const scanner = new Html5Qrcode('qr-reader-pickup');
            setHtml5QrCode(scanner);
            const config = { fps: 10, qrbox: { width: 250, height: 250 } };
            
            scanner.start({ facingMode: "environment" }, config, handleScanSuccess, (errorMessage) => {})
            .catch(err => {
                setError("Kamera tidak ditemukan atau izin ditolak. Pastikan Anda memberikan izin kamera pada browser.");
            });
        }

        return () => {
             if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().catch(err => console.error("Failed to stop scanner on cleanup.", err));
             }
        };
    }, [isOpen, scannedPackage, html5QrCode]);

    const handleScanSuccess = (decodedText: string) => {
        if (html5QrCode) {
            html5QrCode.stop().catch(err => console.log("Failed to stop scanner after scan.", err));
            setHtml5QrCode(null);
        }
        handleScanResult(decodedText);
    };

    const handleScanResult = async (awb: string) => {
        setProcessing(true);
        setError('');
        setMessage('');
        try {
            const pkg = await api.getPackageByAwb(awb);
            const [rec, loc] = await Promise.all([
                api.getRecipients().then(data => data.find(d => d.id === pkg.recipient_id)),
                api.getLocations().then(data => data.find(d => d.id === pkg.location_id)),
            ]);
            setScannedPackage(pkg);
            setRecipient(rec || null);
            setLocation(loc || null);
        } catch (err: any) {
            setError(err.message || 'Gagal mengambil detail paket.');
            setScannedPackage(null);
        } finally {
            setProcessing(false);
        }
    };
    
    const handlePickup = async () => {
        if (!scannedPackage) return;
        setProcessing(true);
        setError('');
        try {
            await api.pickupPackage(scannedPackage.awb);
            setMessage(`Paket ${scannedPackage.awb} berhasil diserahkan!`);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Gagal menyerahkan paket.');
            setProcessing(false);
        } 
    };

    const resetState = () => {
        setScannedPackage(null);
        setRecipient(null);
        setLocation(null);
        setMessage('');
        setError('');
        setProcessing(false);
        setHtml5QrCode(null);
    };

    if (!isOpen) return null;

    const renderContent = () => {
        if (message) {
            return (
                <div className="text-center p-8 flex flex-col items-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                    <p className="text-lg font-semibold text-green-700">{message}</p>
                </div>
            );
        }

        if (scannedPackage) {
            return (
                 <div className="space-y-4 p-6">
                    <h3 className="text-xl font-semibold text-center text-gray-800">Detail Paket</h3>
                    <div className="text-sm space-y-2">
                        <p><span className="font-medium text-gray-500">AWB:</span> <span className="font-bold text-gray-900">{scannedPackage.awb}</span></p>
                        <p><span className="font-medium text-gray-500">Penerima:</span> {recipient?.name}</p>
                        <p><span className="font-medium text-gray-500">Status:</span> 
                            <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${scannedPackage.status === PackageStatus.PICKED_UP ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {scannedPackage.status}
                            </span>
                        </p>
                    </div>
                    
                    {scannedPackage.status === PackageStatus.WAITING_PICKUP ? (
                        <button onClick={handlePickup} disabled={processing} className="w-full mt-4 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300">
                            {processing ? 'Memproses...' : 'Konfirmasi Pengambilan'}
                        </button>
                    ) : (
                        <p className="text-center text-blue-600 bg-blue-100 p-3 rounded-md">Paket ini sudah diambil sebelumnya.</p>
                    )}

                    <button onClick={resetState} className="w-full mt-2 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                        Scan Lagi
                    </button>
                </div>
            );
        }

        return (
            <div className="p-6">
                <div id="qr-reader-pickup" className="w-full"></div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full relative animate-fade-in-down">
                <div className="flex justify-between items-center p-4 border-b">
                     <h2 className="text-xl font-bold text-gray-800">Scan & Serah Paket</h2>
                     <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                {error && <div className="p-3 m-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}
                {processing && !message && <div className="text-center p-4">Mencari paket...</div>}
                {renderContent()}
            </div>
        </div>
    );
};

export default ScanAndPickupModal;
