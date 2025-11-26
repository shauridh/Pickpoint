import { AppSettings } from '@/types';
import { getSettings } from './storage.service';

// WhatsAppMessage interface removed - not used

export const sendWhatsAppMessage = async (
  to: string,
  message: string
): Promise<boolean> => {
  const settings: AppSettings = getSettings();
  
  if (!settings.whatsapp.enabled) {
    console.log('WhatsApp notifications are disabled');
    return false;
  }

  if (!settings.whatsapp.apiUrl || !settings.whatsapp.apiKey) {
    console.error('WhatsApp API configuration is incomplete');
    return false;
  }

  try {
    const number = to.replace(/^0/, '62');
    const payload: Record<string, string> = {
      number,
      message,
      sender: settings.whatsapp.sender || '',
      api: settings.whatsapp.apiKey,
      api_key: settings.whatsapp.apiKey,
    };

    const method = settings.whatsapp.method || 'POST';
    let response: Response;

    if (method === 'GET') {
      const url = new URL(settings.whatsapp.apiUrl);
      Object.entries(payload).forEach(([k, v]) => {
        if (v) url.searchParams.set(k, v);
      });
      response = await fetch(url.toString(), { method: 'GET' });
    } else {
      // Default to JSON body; many gateways accept JSON
      response = await fetch(settings.whatsapp.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    }

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
};

export const sendPackageArrivalNotification = async (
  customerName: string,
  customerPhone: string,
  trackingNumber: string,
  pickupCode: string,
  locationName: string
): Promise<boolean> => {
  const settings: AppSettings = getSettings();
  
  if (!settings.whatsapp.sendArrivalNotification) {
    return false;
  }

  const message = settings.language === 'id'
    ? `Halo ${customerName},\n\nPaket Anda dengan nomor resi ${trackingNumber} telah tiba di ${locationName}.\n\nKode Pengambilan: *${pickupCode}*\n\nSilakan ambil paket Anda sesegera mungkin.\n\nTerima kasih,\n${settings.companyName}`
    : `Hello ${customerName},\n\nYour package with tracking number ${trackingNumber} has arrived at ${locationName}.\n\nPickup Code: *${pickupCode}*\n\nPlease collect your package as soon as possible.\n\nThank you,\n${settings.companyName}`;

  return sendWhatsAppMessage(customerPhone, message);
};

export const sendMembershipActivationNotification = async (
  customerName: string,
  customerPhone: string,
  startDate: string,
  endDate: string
): Promise<boolean> => {
  const settings: AppSettings = getSettings();
  
  if (!settings.whatsapp.sendMembershipNotification) {
    return false;
  }

  const message = settings.language === 'id'
    ? `Halo ${customerName},\n\nSelamat! Keanggotaan Premium Anda telah diaktifkan.\n\nPeriode: ${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}\n\nNikmati diskon khusus untuk setiap paket!\n\nTerima kasih,\n${settings.companyName}`
    : `Hello ${customerName},\n\nCongratulations! Your Premium Membership has been activated.\n\nPeriod: ${new Date(startDate).toLocaleDateString('en-US')} - ${new Date(endDate).toLocaleDateString('en-US')}\n\nEnjoy special discounts on all packages!\n\nThank you,\n${settings.companyName}`;

  return sendWhatsAppMessage(customerPhone, message);
};

export const sendPickupReminderNotification = async (
  customerName: string,
  customerPhone: string,
  trackingNumber: string,
  pickupCode: string,
  daysWaiting: number
): Promise<boolean> => {
  const settings: AppSettings = getSettings();
  
  if (!settings.whatsapp.sendReminderNotification) {
    return false;
  }

  const message = settings.language === 'id'
    ? `Halo ${customerName},\n\nIni adalah pengingat bahwa paket Anda (${trackingNumber}) telah menunggu selama ${daysWaiting} hari.\n\nKode Pengambilan: *${pickupCode}*\n\nMohon segera ambil paket Anda.\n\nTerima kasih,\n${settings.companyName}`
    : `Hello ${customerName},\n\nThis is a reminder that your package (${trackingNumber}) has been waiting for ${daysWaiting} days.\n\nPickup Code: *${pickupCode}*\n\nPlease collect your package soon.\n\nThank you,\n${settings.companyName}`;

  return sendWhatsAppMessage(customerPhone, message);
};

export const sendCustomMessage = async (
  phone: string,
  message: string
): Promise<boolean> => {
  return sendWhatsAppMessage(phone, message);
};
