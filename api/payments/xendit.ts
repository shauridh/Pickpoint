import type { VercelRequest, VercelResponse } from '@vercel/node';

// Create Xendit Invoice via serverless function
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.XENDIT_API_KEY;

  try {
    const { external_id, payer_email, description, amount, customer, package: pkgData } = req.body || {};
    if (!external_id || !amount) {
      return res.status(400).json({ error: 'external_id and amount are required' });
    }

    const originProto = (req.headers['x-forwarded-proto'] as string) || 'https';
    const originHost = req.headers.host as string;

    // If API key is missing, return dummy invoice URL to simulate payment
    if (!apiKey) {
      const redirectUrl = `${originProto}://${originHost}/p/${pkgData?.trackingNumber}?paid=1`;
      return res.status(200).json({
        invoice: {
          id: `dummy_${external_id}`,
          status: 'PENDING',
          invoice_url: redirectUrl,
          external_id,
          amount,
          description: description || `Pembayaran PickPoint - ${external_id}`,
        }
      });
    }

    const payload: Record<string, any> = {
      external_id,
      amount,
      description: description || `Pembayaran PickPoint - ${external_id}`,
      payer_email,
      customer,
      success_redirect_url: `${originProto}://${originHost}/p/${pkgData?.trackingNumber}`,
      failure_redirect_url: `${originProto}://${originHost}/p/${pkgData?.trackingNumber}`,
    };

    const resp = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(apiKey + ':').toString('base64'),
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!resp.ok) {
      return res.status(resp.status).json({ error: data });
    }

    return res.status(200).json({ invoice: data });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Unknown error' });
  }
}
