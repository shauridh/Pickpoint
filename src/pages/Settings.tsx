import React, { useState, useEffect } from 'react';
import { Bell, Send, Check, AlertCircle, Loader } from 'lucide-react';
import { getSettings, saveSettings } from '@/services/storage.service';
import { AppSettings } from '@/types';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [testPhone, setTestPhone] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const loadedSettings = getSettings();
    setSettings(loadedSettings);
  }, []);

  const handleSave = () => {
    if (settings) {
      saveSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleTestNotification = async (useProxy: boolean = false) => {
    if (!testPhone || !settings?.whatsapp.enabled) {
      alert('Masukkan nomor telepon dan pastikan WhatsApp aktif');
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    try {
      const provider = settings.whatsapp.provider || 'generic';
      const messageData = {
        api_key: settings.whatsapp.apiKey,
        sender: settings.whatsapp.sender || '',
        number: testPhone,
        message: settings.notificationTemplates?.test || 'Test notifikasi dari PickPoint. Sistem berjalan dengan baik! ✅',
        provider
      };

      let response;
      const apiUrl = settings.whatsapp.apiUrl;
      const isLocalProxy = apiUrl.startsWith('api/wa') || apiUrl.startsWith('/api/wa');

      if (useProxy || isLocalProxy) {
        // Use local api/wa endpoint (Netlify Function)
        // Prefer redirect path /api/wa/send so netlify.toml redirects work in production and netlify dev
        const endpoint = isLocalProxy ? '/api/wa/send' : '/.netlify/functions/whatsapp-proxy';
        
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            method: settings.whatsapp.method || 'POST',
            provider,
            data: messageData
          })
        });

        // Safe parse: handle empty or non-JSON responses
        const rawText = await response.text();
        let result: any = {};
        if (rawText.trim().length > 0) {
          try {
            result = JSON.parse(rawText);
          } catch {
            result = { raw: rawText, success: false, message: 'Invalid JSON response' };
          }
        } else {
          result = { success: response.ok, message: response.ok ? 'Sent (empty response)' : 'Failed (empty response)' };
        }
        
        if (!response.ok || !result.success) {
          setTestResult({ 
            success: false, 
            message: `Error: ${result.message || result.error || response.statusText}` 
          });
          setTestLoading(false);
          return;
        }
        
        const successMsg = isLocalProxy 
          ? '✅ Notifikasi berhasil dikirim via api/wa! Periksa WhatsApp Anda.' 
          : '✅ Notifikasi berhasil dikirim melalui proxy! Periksa WhatsApp Anda.';
        setTestResult({ success: true, message: successMsg });
      } else {
        // Direct call (may fail due to CORS)
        if (settings.whatsapp.method === 'GET') {
          const params = new URLSearchParams(messageData);
          response = await fetch(`${settings.whatsapp.apiUrl}?${params}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
        } else {
          response = await fetch(settings.whatsapp.apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(messageData),
          });
        }

        if (!response.ok) {
          const errorText = await response.text();
          setTestResult({ success: false, message: `Gagal (${response.status}): ${errorText || response.statusText}` });
          setTestLoading(false);
          return;
        }

        // Safe parse response (some gateways return empty or plain text)
        const rawText = await response.text();
        let parsed: any = null;
        if (rawText.trim().length > 0) {
          try { parsed = JSON.parse(rawText); } catch { parsed = { raw: rawText }; }
        } else {
          parsed = { raw: '', empty: true };
        }

        setTestResult({ success: true, message: '✅ Notifikasi berhasil dikirim! ' + (parsed?.message ? parsed.message : 'Periksa WhatsApp Anda.') });
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        setTestResult({ 
          success: false, 
          message: '❌ Gagal terhubung. Coba gunakan "Kirim via Proxy" atau gunakan api/wa sebagai URL. Periksa console (F12) untuk detail.' 
        });
      } else {
        setTestResult({ success: false, message: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
      }
    } finally {
      setTestLoading(false);
    }
  };

  if (!settings) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
          <p className="text-sm text-gray-500 mt-1">Konfigurasi sistem dan template notifikasi</p>
        </div>
        <button
          onClick={handleSave}
          className={`inline-flex items-center px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg ${
            saveSuccess
              ? 'bg-green-600 text-white'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
          }`}
        >
          {saveSuccess ? (
            <>
              <Check className="h-5 w-5 mr-2" />
              Tersimpan
            </>
          ) : (
            <>
              <Bell className="h-5 w-5 mr-2" />
              Simpan Pengaturan
            </>
          )}
        </button>
      </div>

      {/* WhatsApp Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Konfigurasi WhatsApp</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between bg-blue-50 rounded-lg p-4">
            <div>
              <p className="font-medium text-gray-900">Status WhatsApp</p>
              <p className="text-sm text-gray-600">Aktifkan/nonaktifkan notifikasi WhatsApp</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.whatsapp.enabled}
                onChange={(e) => setSettings({
                  ...settings,
                  whatsapp: { ...settings.whatsapp, enabled: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
              <select
                value={settings.whatsapp.provider || 'generic'}
                onChange={(e) => setSettings({
                  ...settings,
                  whatsapp: { ...settings.whatsapp, provider: e.target.value as any }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="generic">Generic</option>
                <option value="fonnte">Fonnte</option>
                <option value="watzap">Watzap</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Sesuaikan format payload otomatis berdasarkan provider.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API URL</label>
              <input
                type="text"
                value={settings.whatsapp.apiUrl}
                onChange={(e) => setSettings({
                  ...settings,
                  whatsapp: { ...settings.whatsapp, apiUrl: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://api.example.com/send"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
              <input
                type="text"
                value={settings.whatsapp.apiKey}
                onChange={(e) => setSettings({
                  ...settings,
                  whatsapp: { ...settings.whatsapp, apiKey: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="your-api-key"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sender Number</label>
              <input
                type="text"
                value={settings.whatsapp.sender}
                onChange={(e) => setSettings({
                  ...settings,
                  whatsapp: { ...settings.whatsapp, sender: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="628123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
              <select
                value={settings.whatsapp.method}
                onChange={(e) => setSettings({
                  ...settings,
                  whatsapp: { ...settings.whatsapp, method: e.target.value as 'POST' | 'GET' }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Templates */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Send className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Template Notifikasi</h2>
        </div>

        <div className="space-y-6">
          {/* Package Arrival Template */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Template Paket Diterima
            </label>
            <textarea
              value={settings.notificationTemplates?.packageArrival || ''}
              onChange={(e) => setSettings({
                ...settings,
                notificationTemplates: {
                  ...settings.notificationTemplates,
                  packageArrival: e.target.value
                }
              })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="Contoh: Halo {name}, paket Anda dengan nomor resi {tracking} telah tiba. Kode pengambilan: {pickup_code}"
            />
            <p className="text-xs text-gray-500 mt-2">
              Variable: <code className="bg-gray-100 px-1 rounded">{'{name}'}</code>, 
              <code className="bg-gray-100 px-1 rounded mx-1">{'{tracking}'}</code>, 
              <code className="bg-gray-100 px-1 rounded">{'{pickup_code}'}</code>, 
              <code className="bg-gray-100 px-1 rounded mx-1">{'{location}'}</code>,
              <code className="bg-gray-100 px-1 rounded mx-1">{'{link}'}</code> (detail paket)
            </p>
          </div>

          {/* Membership Template */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Template Berlangganan Membership
            </label>
            <textarea
              value={settings.notificationTemplates?.membership || ''}
              onChange={(e) => setSettings({
                ...settings,
                notificationTemplates: {
                  ...settings.notificationTemplates,
                  membership: e.target.value
                }
              })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="Contoh: Selamat {name}! Membership Anda telah aktif hingga {end_date}. Nikmati gratis biaya simpan paket!"
            />
            <p className="text-xs text-gray-500 mt-2">
              Variable: <code className="bg-gray-100 px-1 rounded">{'{name}'}</code>, 
              <code className="bg-gray-100 px-1 rounded mx-1">{'{start_date}'}</code>, 
              <code className="bg-gray-100 px-1 rounded mx-1">{'{end_date}'}</code>, 
              <code className="bg-gray-100 px-1 rounded mx-1">{'{duration}'}</code>
            </p>
          </div>

          {/* Reminder Template */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Template Pengingat Membership (H-7)
            </label>
            <textarea
              value={settings.notificationTemplates?.membershipReminder || ''}
              onChange={(e) => setSettings({
                ...settings,
                notificationTemplates: {
                  ...settings.notificationTemplates,
                  membershipReminder: e.target.value
                }
              })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="Contoh: Halo {name}, membership Anda akan berakhir pada {end_date}. Segera perpanjang untuk terus menikmati benefit!"
            />
            <p className="text-xs text-gray-500 mt-2">
              Variable: <code className="bg-gray-100 px-1 rounded">{'{name}'}</code>, 
              <code className="bg-gray-100 px-1 rounded mx-1">{'{end_date}'}</code>, 
              <code className="bg-gray-100 px-1 rounded mx-1">{'{days_left}'}</code>
            </p>
          </div>

          {/* Test Template */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Template Test Notifikasi
            </label>
            <textarea
              value={settings.notificationTemplates?.test || ''}
              onChange={(e) => setSettings({
                ...settings,
                notificationTemplates: {
                  ...settings.notificationTemplates,
                  test: e.target.value
                }
              })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="Contoh: Test notifikasi dari PickPoint. Sistem berjalan dengan baik! ✅"
            />
          </div>
        </div>
      </div>

      {/* Test Notification */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-gray-900">Test Notifikasi</h2>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Kirim notifikasi test untuk memastikan konfigurasi WhatsApp berfungsi dengan baik.
          </p>

          <div className="flex gap-3">
            <input
              type="text"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="Nomor WhatsApp (628xxxxxxxxxx)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => handleTestNotification(false)}
              disabled={testLoading || !settings.whatsapp.enabled}
              className={`inline-flex items-center px-6 py-2 rounded-lg font-medium transition-all ${
                testLoading || !settings.whatsapp.enabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg'
              }`}
            >
              {testLoading ? (
                <>
                  <Loader className="h-5 w-5 mr-2 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Kirim Test
                </>
              )}
            </button>
            <button
              onClick={() => handleTestNotification(true)}
              disabled={testLoading || !settings.whatsapp.enabled}
              className={`inline-flex items-center px-6 py-2 rounded-lg font-medium transition-all ${
                testLoading || !settings.whatsapp.enabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
              }`}
              title="Gunakan Netlify Function sebagai proxy untuk bypass CORS"
            >
              {testLoading ? (
                <>
                  <Loader className="h-5 w-5 mr-2 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Kirim via Proxy
                </>
              )}
            </button>
          </div>

          {testResult && (
            <div className={`p-4 rounded-lg ${
              testResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm font-medium ${
                testResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResult.message}
              </p>
            </div>
          )}

          {!settings.whatsapp.enabled && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                ⚠️ WhatsApp notifikasi belum diaktifkan. Aktifkan terlebih dahulu untuk mengirim test notifikasi.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Troubleshooting Guide */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 Panduan Konfigurasi WhatsApp Gateway</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">🔧 Troubleshooting "Gagal terhubung ke server":</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
              <li><strong>URL API:</strong> Pastikan URL lengkap dengan protocol (https://)</li>
              <li><strong>CORS:</strong> Server WhatsApp Gateway harus mengizinkan request dari domain Anda</li>
              <li><strong>Method:</strong> Periksa dokumentasi API - gunakan GET atau POST sesuai spesifikasi</li>
              <li><strong>API Key:</strong> Pastikan API key valid dan belum expired</li>
              <li><strong>Network:</strong> Cek koneksi internet dan firewall</li>
            </ul>
          </div>

          <div className="border-t border-blue-200 pt-4">
            <h3 className="font-medium text-gray-900 mb-2">💡 Contoh Konfigurasi:</h3>
            
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-green-700 mb-1">⚡ RECOMMENDED: Gunakan Local API Endpoint</p>
                <div className="text-xs text-green-700 space-y-1 font-mono">
                  <p>• URL: <code className="bg-white px-1 rounded">api/wa/send</code></p>
                  <p>• Method: POST</p>
                  <p>• Benefit: Tidak ada CORS error, setup paling simpel</p>
                  <p>• Note: Nantinya hubungkan external API di Netlify Function</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-sm font-semibold text-indigo-600 mb-1">1. Fonnte.com (Direct)</p>
                <div className="text-xs text-gray-600 space-y-1 font-mono">
                  <p>• URL: https://api.fonnte.com/send</p>
                  <p>• Method: POST</p>
                  <p>• API Key: Token dari dashboard fonnte</p>
                  <p>• Body: {`{target, message, token}`}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-sm font-semibold text-green-600 mb-1">2. Watzap.id (Direct)</p>
                <div className="text-xs text-gray-600 space-y-1 font-mono">
                  <p>• URL: https://api.watzap.id/v1/send_message</p>
                  <p>• Method: POST</p>
                  <p>• API Key: Token dari panel watzap</p>
                  <p>• Body: {`{api_key, number, message}`}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-sm font-semibold text-purple-600 mb-1">3. WhatsApp Business API</p>
                <div className="text-xs text-gray-600 space-y-1 font-mono">
                  <p>• URL: Sesuai provider (360dialog, Twilio, dll)</p>
                  <p>• Method: POST</p>
                  <p>• Headers: Authorization Bearer token</p>
                  <p>• Body: Format JSON sesuai spesifikasi</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-blue-200 pt-4">
            <h3 className="font-medium text-gray-900 mb-2">🚀 Tips Testing:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
              <li>Gunakan format nomor internasional: <code className="bg-white px-1 rounded">628123456789</code> (tanpa +)</li>
              <li>Test dengan nomor sendiri terlebih dahulu</li>
              <li>Cek console browser (F12) untuk detail error</li>
              <li>Verifikasi saldo/quota API di dashboard provider</li>
              <li>Untuk development lokal, gunakan tools seperti <code className="bg-white px-1 rounded">ngrok</code> jika perlu CORS bypass</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
            <p className="text-xs text-amber-800">
              <strong>💡 Tip Terbaik:</strong> Gunakan <code className="bg-white px-1 rounded">api/wa/send</code> sebagai URL. 
              Ini adalah Netlify Function lokal yang tidak punya CORS issue dan lebih fleksibel untuk setup berbagai WhatsApp Gateway.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
            <p className="text-xs text-blue-800">
              <strong>⚙️ Setup api/wa/ Endpoint:</strong> Edit file <code className="bg-white px-1 rounded">netlify/functions/api-wa.ts</code> 
              untuk menghubungkan ke WhatsApp Gateway pilihan Anda, kemudian mapping parameter sesuai kebutuhan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
