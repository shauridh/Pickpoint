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

    const provider: 'generic' | 'fonnte' | 'watzap' = (
      body.provider || 
      body.data?.provider || 
      process.env.WHATSAPP_PROVIDER || 
      'generic'
    ) as 'generic' | 'fonnte' | 'watzap';

    // Build provider-specific payload
    interface BaseData { 
      number?: string; 
      message?: string; 
      api_key?: string; 
      sender?: string; 
      token?: string;
      target?: string;
    }
    
    const d: BaseData = body.data || body;
    const apiKey = d.api_key || process.env.WA_API_KEY || d.token || '';
    const sender = d.sender || process.env.WA_SENDER || '';
    const number = (d.number || d.target || '').replace(/^0/, '62');
    const message = d.message || '';

    let gatewayPayload: Record<string, string>;
    switch (provider) {
      case 'fonnte':
        // Fonnte expects: target, message, token
        gatewayPayload = { target: number, message, token: apiKey };
        break;
      case 'watzap':
        // Watzap expects: api_key, number, message
        gatewayPayload = { api_key: apiKey, number, message };
        break;
      default:
        // Generic fallback
        gatewayPayload = { number, message, api_key: apiKey, sender };
        break;
    }

    // Get WhatsApp Gateway URL from environment or use default
    const gatewayUrl = process.env.WHATSAPP_GATEWAY_URL || 'https://seen.getsender.id/send-message';
    
    // Forward request to WhatsApp Gateway
    const response = await fetch(gatewayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gatewayPayload),
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
      provider,
      payloadSent: gatewayPayload,
      raw: data
    });

    const normalized = {
      success: response.ok,
      status: response.status,
      provider,
      requestId,
      gatewayPayload,
      data,
      message: response.ok ? (data?.message || 'Sent') : (data?.error || 'Failed')
    };

    return res.status(response.status).json(normalized);

  } catch (error) {
    console.error('[WA][ERR]', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Proxy error'
    });
  }
}
