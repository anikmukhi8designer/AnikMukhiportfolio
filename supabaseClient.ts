// This file is deprecated as the project has switched to a GitHub-only CMS.
// It is kept as a placeholder to prevent import errors during the transition.

export const supabase = {
  auth: {
    signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Supabase is disabled.' } }),
    signOut: async () => {},
  },
  from: () => ({
    select: () => ({ order: () => ({ data: [], error: null }) }),
    insert: () => ({ data: [], error: null }),
    update: () => ({ eq: () => ({ data: [], error: null }) }),
    delete: () => ({ eq: () => ({ data: [], error: null }) }),
    upsert: () => ({ data: [], error: null }),
  }),
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: { message: 'Supabase storage is disabled.' } }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
  channel: () => ({
    on: () => ({ subscribe: () => {} }),
  }),
  removeChannel: () => {},
};