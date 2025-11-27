import type { VercelRequest, VercelResponse } from '@vercel/node';

// Webhook to update payment status
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const callbackToken = process.env.XENDIT_CALLBACK_TOKEN;
  const headerToken = req.headers['x-callback-token'] as string | undefined;
  if (callbackToken && headerToken !== callbackToken) {
    return res.status(401).json({ error: 'Invalid callback token' });
  }

  try {
    const event = req.body;
    // Expect invoice event: contains external_id and status
    const externalId: string | undefined = event?.data?.external_id || event?.external_id;
    const status: string | undefined = event?.data?.status || event?.status;

    if (!externalId || !status) {
      return res.status(400).json({ error: 'Missing external_id or status' });
    }

    // Update local storage via a lightweight KV approach (not ideal for serverless)
    // For demo: respond OK. In real app, update your database.
    // Optionally, you can call an internal endpoint to mark package paid.

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Unknown error' });
  }
}
