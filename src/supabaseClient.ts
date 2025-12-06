import { createClient } from '@supabase/supabase-js';

// Helper to access env safely
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || '';
    }
  } catch (e) {
    // ignore errors
  }
  return '';
};

// 1. Try Local Storage (User Configured via UI)
const localUrl = typeof window !== 'undefined' ? localStorage.getItem('sb_url') : '';
const localKey = typeof window !== 'undefined' ? localStorage.getItem('sb_key') : '';

// 2. Try Environment Variables (Developer Configured)
const envUrl = getEnv('VITE_SUPABASE_URL');
const envKey = getEnv('VITE_SUPABASE_ANON_KEY');

// 3. Fallback (Demo/Read-Only or Placeholder)
// NOTE: Use your own credentials in .env or via the Admin UI to enable writing.
const fallbackUrl = "https://ppaaanrjvptohtuduebu.supabase.co"; 
const fallbackKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYWFhbnJqdnB0b2h0dWR1ZWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5Mjc1NzEsImV4cCI6MjA4MDUwMzU3MX0.8EZPuO5G35OjhH21VdYpeQl3d78h4jW11kBzGcUs8wE";

const supabaseUrl = localUrl || envUrl || fallbackUrl;
const supabaseKey = localKey || envKey || fallbackKey;

export const supabase = createClient(supabaseUrl, supabaseKey);