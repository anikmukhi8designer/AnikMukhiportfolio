import { createClient } from '@supabase/supabase-js';

// Helper to access env safely without crashing if import.meta.env is undefined
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

// Use provided credentials as default fallback
const supabaseUrl = getEnv('VITE_SUPABASE_URL') || "https://ppaaanrjvptohtuduebu.supabase.co";
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY') || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYWFhbnJqdnB0b2h0dWR1ZWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5Mjc1NzEsImV4cCI6MjA4MDUwMzU3MX0.8EZPuO5G35OjhH21VdYpeQl3d78h4jW11kBzGcUs8wE";

export const supabase = createClient(supabaseUrl, supabaseKey);