import { createClient } from '@supabase/supabase-js';

// Safe environment variable access that never throws
const getEnvVar = (key: string, fallback: string = '') => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || fallback;
    }
  } catch (e) {
    // Silently fail
  }
  return fallback;
};

// Configuration derived from your provided data
const DEDUCED_URL = 'https://sgkzhuwmgblrwnqzvxhw.supabase.co';
const DEDUCED_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNna3podXdtZ2JscnducXp2eGh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1Njg1MjQsImV4cCI6MjA4MDE0NDUyNH0.Ent3kbxv1dhh4k-ExlEtBt6IMuk2S8s-7iLZZDhNWDQ';

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', DEDUCED_URL);
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', DEDUCED_ANON_KEY);

if (!supabaseAnonKey) {
  console.warn("Supabase Anon Key missing. Check your .env file.");
}

// Export a robust client that doesn't crash if keys are missing
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      // Mock Supabase client for offline/demo mode to prevent app crash
      from: () => ({ 
        select: async () => ({ data: [], error: null }),
        insert: async () => ({ data: [], error: null }),
        update: async () => ({ data: [], error: null }),
        delete: async () => ({ data: [], error: null }),
        upload: async () => ({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        eq: function() { return this; },
        order: function() { return this; },
        neq: function() { return this; }
      }),
      storage: {
          from: () => ({
              upload: async () => ({ data: null, error: null }),
              getPublicUrl: () => ({ data: { publicUrl: '' } })
          })
      },
      channel: () => ({
          on: function() { return this; },
          subscribe: () => {}
      }),
      removeChannel: () => {},
      auth: {
          signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Supabase not configured' } }),
          signOut: async () => {}
      }
    } as any;