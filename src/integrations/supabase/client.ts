import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ngutoyvtsgpxyqmkbpih.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ndXRveXZ0c2dweHlxbWticGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2Nzc2MTQsImV4cCI6MjA3MjI1MzYxNH0.6WS0Y2J5LSzqy0vRY8BXs0WEz1zUVGu2OVFzUCH2U6M';

console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase Key present:', !!SUPABASE_PUBLISHABLE_KEY);

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});