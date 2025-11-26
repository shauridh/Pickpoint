import type { Handler, HandlerEvent } from '@netlify/functions';

interface WhatsAppRequest {
  apiUrl: string;
  method: 'GET' | 'POST';
  data: Record<string, string>;
}

export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { apiUrl, method, data }: WhatsAppRequest = JSON.parse(event.body || '{}');

    if (!apiUrl || !method || !data) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: apiUrl, method, data' })
      };
    }

    let response: Response;

    if (method === 'GET') {
      // For GET requests, append data as query parameters
      const url = new URL(apiUrl);
      Object.entries(data).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
      });
      
      response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } else {
      // For POST requests, send data in body
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
    }

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: response.ok,
        status: response.status,
        data: responseData,
        message: response.ok ? 'Request successful' : `Request failed with status ${response.status}`
      })
    };

  } catch (error) {
    console.error('WhatsApp proxy error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to send WhatsApp message through proxy'
      })
    };
  }
};
