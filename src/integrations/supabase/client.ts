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

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Test connection
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ DEBUG: Supabase initial session error:', error);
  } else {
    console.log('✅ DEBUG: Supabase initial session check:', {
      hasSession: !!data.session,
      userId: data.session?.user?.id,
      userEmail: data.session?.user?.email,
      accessToken: data.session?.access_token?.substring(0, 20) + '...'
    });
  }
}).catch(err => {
  console.error('❌ DEBUG: Supabase initialization failed:', err);
});