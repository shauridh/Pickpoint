import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const body = req.body;
    
    const requestId = Date.now().toString(36);
    console.log('[WA][REQ]', requestId, body);

    // Extract data from request body
    const d = body.data || body;
    const apiKey = d.api_key || process.env.WA_API_KEY || '';
    const sender = d.sender || process.env.WA_SENDER || '';
    let number = d.number || '';
    const message = d.message || '';

    // Normalize number format (remove leading 0, ensure starts with 62)
    number = number.replace(/^0/, '62');
    if (!number.startsWith('62')) {
      number = '62' + number;
    }

    // Validate required fields
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: '❌ API Key tidak ditemukan'
      });
    }

    if (!number || !message) {
      return res.status(400).json({
        success: false,
        message: '❌ Nomor dan pesan wajib diisi'
      });
    }

    // GetSender API uses GET method with query parameters
    const gatewayBaseUrl = process.env.WHATSAPP_GATEWAY_URL || 'https://seen.getsender.id/send-message';
    
    // Build query parameters as per GetSender documentation
    const params = new URLSearchParams({
      api_key: apiKey,
      number: number,
      message: message
    });

    // Add sender if provided (optional footer parameter)
    if (sender) {
      params.append('sender', sender);
    }

    const gatewayUrl = `${gatewayBaseUrl}?${params.toString()}`;

    console.log('[WA][URL]', requestId, {
      url: gatewayBaseUrl,
      number,
      messageLength: message.length
    });

    // Call GetSender API using GET method (as per documentation)
    const response = await fetch(gatewayUrl, {
      method: 'GET',
    });

    // Safe parse upstream response (may be empty or plain text)
    const rawText = await response.text();
    let data: any;
    if (rawText.trim().length === 0) {
      data = { raw: '', empty: true };
    } else {
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { raw: rawText };
      }
    }
    
    console.log('[WA][RES]', requestId, {
      status: response.status,
      data
    });

    // Check success based on GetSender response format
    const isSuccess = response.ok && (
      data?.status === true || 
      data?.data?.status === 'SENT' ||
      data?.message?.toLowerCase()?.includes('success')
    );

    const normalized = {
      success: isSuccess,
      status: response.status,
      requestId,
      data,
      message: isSuccess
        ? '✅ Pesan WhatsApp berhasil dikirim!'
        : `❌ Gagal mengirim (${response.status})${data?.message ? ': ' + data.message : (data?.raw ? ': ' + String(data.raw).slice(0, 150) : ': Server tidak memberikan response')}`
    };

    return res.status(response.ok ? 200 : response.status).json(normalized);

  } catch (error) {
    console.error('[WA][ERR]', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: '❌ Proxy error: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
}
