import type { Handler, HandlerEvent } from '@netlify/functions';
import { supabase, getAuthUser, getUserProfile, corsHeaders } from './_utils';

export const handler: Handler = async (event: HandlerEvent) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    const path = event.path.replace('/.netlify/functions/api/', '');
    const method = event.httpMethod;
    const authHeader = event.headers.authorization;

    // Auth endpoints
    if (path === 'auth/login' && method === 'POST') {
      const { email, password } = JSON.parse(event.body || '{}');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: error.message }),
        };
      }

      const profile = await getUserProfile(data.user.id);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          user: {
            id: data.user.id,
            email: data.user.email,
            name: profile?.name || '',
            role: profile?.role || 'staff',
          },
          token: data.session.access_token,
        }),
      };
    }

    if (path === 'auth/logout' && method === 'POST') {
      await supabase.auth.signOut();
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Logged out' }),
      };
    }

    if (path === 'auth/me' && method === 'GET') {
      const user = await getAuthUser(authHeader);
      if (!user) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Unauthorized' }),
        };
      }

      const profile = await getUserProfile(user.id);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          name: profile?.name || '',
          role: profile?.role || 'staff',
        }),
      };
    }

    // Packages endpoints
    if (path === 'packages' && method === 'GET') {
      const user = await getAuthUser(authHeader);
      if (!user) {
        return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Unauthorized' }) };
      }

      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('arrived_at', { ascending: false });

      if (error) {
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: error.message }) };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(data),
      };
    }

    if (path === 'packages' && method === 'POST') {
      const user = await getAuthUser(authHeader);
      if (!user) {
        return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Unauthorized' }) };
      }

      const packageData = JSON.parse(event.body || '{}');
      
      const { data, error } = await supabase
        .from('packages')
        .insert([packageData])
        .select()
        .single();

      if (error) {
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: error.message }) };
      }

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(data),
      };
    }

    // Customers endpoints
    if (path === 'customers' && method === 'GET') {
      const user = await getAuthUser(authHeader);
      if (!user) {
        return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Unauthorized' }) };
      }

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: error.message }) };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(data),
      };
    }

    if (path === 'customers' && method === 'POST') {
      const user = await getAuthUser(authHeader);
      if (!user) {
        return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Unauthorized' }) };
      }

      const customerData = JSON.parse(event.body || '{}');
      
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (error) {
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: error.message }) };
      }

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(data),
      };
    }

    // Locations endpoints
    if (path === 'locations' && method === 'GET') {
      const user = await getAuthUser(authHeader);
      if (!user) {
        return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Unauthorized' }) };
      }

      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: error.message }) };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(data),
      };
    }

    // Settings endpoints
    if (path === 'settings' && method === 'GET') {
      const user = await getAuthUser(authHeader);
      if (!user) {
        return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Unauthorized' }) };
      }

      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) {
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: error.message }) };
      }

      // Convert to object format
      const settings: any = {};
      data?.forEach((item: any) => {
        settings[item.key] = item.value;
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(settings),
      };
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
