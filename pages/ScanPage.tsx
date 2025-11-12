
import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../services/api';
import { Package, Recipient, Expedition, Location } from '../types';

interface ScanPageProps {
  setPage: (page: string) => void;
}

const ScanPage: React.FC<ScanPageProps> = ({ setPage }) => {
    const [scannedAwb, setScannedAwb] = useState<string | null>(null);
    const [scannedPackage, setScannedPackage] = useState<Package | null>(null);
    const [recipient, setRecipient] = useState<Recipient | null>(null);
    const [expedition, setExpedition] = useState<Expedition | null>(null);
    const [location, setLocation] = useState<Location | null>(null);

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const qrScanner = new Html5Qrcode('qr-reader');
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        const startScanner = async () => {
            try {
                await qrScanner.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure);
            } catch (err) {
                console.error("Failed to start QR scanner:", err);
                setError("Kamera tidak ditemukan atau izin ditolak. Coba input AWB manual.");
            }
        };

        if (!scannedAwb) {
            startScanner();
        }

        return () => {
            qrScanner.stop().catch(err => console.log("Failed to stop scanner", err));
        };
    }, [scannedAwb]);

    const onScanSuccess = (decodedText: string) => {
        setScannedAwb(decodedText);
        handleScanResult(decodedText);
    };

    const onScanFailure = (errorMessage: string) => {
        // console.log(errorMessage);
    };

    const handleScanResult = async (awb: string) => {
        setProcessing(true);
        setError('');
        setMessage('');
        try {
            const pkg = await api.getPackageByAwb(awb);
            const [rec, exp, loc] = await Promise.all([
                api.getRecipients().then(data => data.find(d => d.id === pkg.recipient_id)),
                api.getExpeditions().then(data => data.find(d => d.id === pkg.expedition_id)),
                api.getLocations().then(data => data.find(d => d.id === pkg.location_id)),
            ]);

            setScannedPackage(pkg);
            setRecipient(rec || null);
            setExpedition(exp || null);
            setLocation(loc || null);
            
            if (loc?.pickup_mode === 'auto' && pkg.status === 'Menunggu Pengambilan') {
                await handlePickup();
            }

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
        try {
            await api.pickupPackage(scannedPackage.awb);
            setMessage(`Paket ${scannedPackage.awb} berhasil diserahkan.`);
            setTimeout(() => {
                resetState();
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Gagal menyerahkan paket.');
        } finally {
            setProcessing(false);
        }
    };

    const resetState = () => {
        setScannedAwb(null);
        setScannedPackage(null);
        setRecipient(null);
        setExpedition(null);
        setLocation(null);
        setMessage('');
        setError('');
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-md max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Scan QR Code Paket</h2>
            
            {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}
            {message && <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">{message}</div>}

            {!scannedPackage ? (
                <div id="qr-reader" className="w-full"></div>
            ) : (
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Detail Paket</h3>
                    <p><strong>AWB:</strong> {scannedPackage.awb}</p>
                    <p><strong>Penerima:</strong> {recipient?.name}</p>
                    <p><strong>Ekspedisi:</strong> {expedition?.name}</p>
                    <p><strong>Status:</strong> {scannedPackage.status}</p>
                    <img src={scannedPackage.photo_url} alt="package" className="rounded-lg"/>
                    
                    {location?.pickup_mode === 'manual' && scannedPackage.status === 'Menunggu Pengambilan' && (
                        <button onClick={handlePickup} disabled={processing} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300">
                            {processing ? 'Processing...' : 'Konfirmasi Pengambilan'}
                        </button>
                    )}

                    <button onClick={resetState} className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                        Scan Lagi
                    </button>
                </div>
            )}
        </div>
    );
};

export default ScanPage;

