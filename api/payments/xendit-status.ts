import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const apiKey = process.env.XENDIT_API_KEY;
  const external_id = (req.query.external_id as string) || '';
  if (!external_id) {
    return res.status(400).json({ error: 'external_id is required' });
  }
  if (!apiKey) {
    // Dummy: assume paid when called without api key
    return res.status(200).json({ status: 'PAID', dummy: true });
  }
  try {
    const url = `https://api.xendit.co/v2/invoices?external_id=${encodeURIComponent(external_id)}`;
    const resp = await fetch(url, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(apiKey + ':').toString('base64'),
      },
    });
    const text = await resp.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    if (!resp.ok) {
      return res.status(resp.status).json({ error: data });
    }
    const invoice = Array.isArray(data) ? data[0] : data;
    return res.status(200).json({ status: invoice?.status || 'UNKNOWN', invoice });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Unknown error' });
  }
}
