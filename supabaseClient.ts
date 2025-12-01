import { createClient } from '@supabase/supabase-js';

// Access environment variables safely with optional chaining
// Added hardcoded fallbacks for immediate preview stability using the provided credentials
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || "https://sgkzhuwmgblrwnqzvxhw.supabase.co";
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNna3podXdtZ2JscnducXp2eGh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1Njg1MjQsImV4cCI6MjA4MDE0NDUyNH0.Ent3kbxv1dhh4k-ExlEtBt6IMuk2S8s-7iLZZDhNWDQ";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase Keys missing! Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
}

// Export client or a mock fallback if keys are missing
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      // Mock Supabase client to prevent app crash if keys are missing
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
          signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Supabase keys not configured in .env' } }),
          signOut: async () => {}
      }
    } as any;