import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ngutoyvtsgpxyqmkbpih.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ndXRveXZ0c2dweHlxbWticGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2Nzc2MTQsImV4cCI6MjA3MjI1MzYxNH0.6WS0Y2J5LSzqy0vRY8BXs0WEz1zUVGu2OVFzUCH2U6M';

console.log('🔧 DEBUG: Environment check');
console.log('🔧 VITE_SUPABASE_URL from env:', import.meta.env.VITE_SUPABASE_URL);
console.log('🔧 VITE_SUPABASE_ANON_KEY from env (first 20 chars):', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20));
console.log('🔧 Final SUPABASE_URL being used:', SUPABASE_URL);
console.log('🔧 Final SUPABASE_KEY present:', !!SUPABASE_PUBLISHABLE_KEY);
console.log('🔧 Final SUPABASE_KEY first 20 chars:', SUPABASE_PUBLISHABLE_KEY?.substring(0, 20));
console.log('🔧 Current window location:', window.location.href);
console.log('🔧 Current origin:', window.location.origin);
console.log('🔧 User agent:', navigator.userAgent);
console.log('🔧 Is deployed environment:', window.location.hostname !== 'localhost');

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    debug: true,
  }
});

// Test connection
console.log('🔧 DEBUG: Testing initial Supabase connection...');
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ DEBUG: Supabase initial session error:', error);
    console.error('❌ DEBUG: Error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      name: error.name
    });
  } else {
    console.log('✅ DEBUG: Supabase initial session check:', {
      hasSession: !!data.session,
      userId: data.session?.user?.id,
      userEmail: data.session?.user?.email,
      accessToken: data.session?.access_token?.substring(0, 20) + '...',
      expiresAt: data.session?.expires_at,
      refreshToken: data.session?.refresh_token?.substring(0, 20) + '...'
    });
  }
}).catch(err => {
  console.error('❌ DEBUG: Supabase initialization failed:', err);
  console.error('❌ DEBUG: Full error object:', err);
});

// Test basic connectivity to Supabase
console.log('🔧 DEBUG: Testing basic fetch to Supabase...');
fetch(`${SUPABASE_URL}/rest/v1/`, {
  headers: {
    'apikey': SUPABASE_PUBLISHABLE_KEY,
    'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
  }
}).then(response => {
  console.log('✅ DEBUG: Basic Supabase fetch test:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    headers: Object.fromEntries(response.headers.entries())
  });
}).catch(err => {
  console.error('❌ DEBUG: Basic Supabase fetch failed:', err);
  console.error('❌ DEBUG: This indicates a CORS or network connectivity issue');
});