import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../../services/api';
import { Package } from '../../types';
import { X } from 'lucide-react';

interface ScanAndPickupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPackageFound: (pkg: Package) => void;
}

const ScanAndPickupModal: React.FC<ScanAndPickupModalProps> = ({ isOpen, onClose, onPackageFound }) => {
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);
    const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);

    useEffect(() => {
        if (!isOpen) {
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().catch(err => console.error("Failed to stop scanner on close.", err));
            }
            return;
        }

        const scanner = new Html5Qrcode('qr-reader-pickup');
        setHtml5QrCode(scanner);
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        
        scanner.start({ facingMode: "environment" }, config, handleScanSuccess, (errorMessage) => {})
        .catch(err => {
            setError("Kamera tidak ditemukan atau izin ditolak. Pastikan Anda memberikan izin kamera pada browser.");
        });

        return () => {
             if (scanner && scanner.isScanning) {
                scanner.stop().catch(err => console.error("Failed to stop scanner on cleanup.", err));
             }
        };
    }, [isOpen]);

    const handleScanSuccess = (decodedText: string) => {
        if (html5QrCode) {
            html5QrCode.stop().catch(err => console.log("Failed to stop scanner after scan.", err));
        }
        handleScanResult(decodedText);
    };

    const handleScanResult = async (code: string) => {
        setProcessing(true);
        setError('');
        try {
            const pkg = await api.getPackageByCode(code);
            onPackageFound(pkg);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Gagal mengambil detail paket.');
            // Restart scanner after error
             setTimeout(() => {
                setError('');
                 if(html5QrCode && !html5QrCode.isScanning) {
                    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
                    html5QrCode.start({ facingMode: "environment" }, config, handleScanSuccess, (errorMessage) => {}).catch(e => console.error(e));
                 }
             }, 2000);
        } finally {
            setProcessing(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full relative animate-fade-in-down">
                <div className="flex justify-between items-center p-4 border-b">
                     <h2 className="text-xl font-bold text-gray-800">Scan Kode Pengambilan</h2>
                     <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                {processing && <div className="text-center p-4">Mencari paket...</div>}
                <div className="p-6">
                    <p className="text-center text-gray-600 mb-2">Arahkan kamera ke QR Code unik pengambilan.</p>
                    <div id="qr-reader-pickup" className="w-full"></div>
                    {error && <div className="p-3 mt-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}
                </div>
            </div>
        </div>
    );
};

export default ScanAndPickupModal;