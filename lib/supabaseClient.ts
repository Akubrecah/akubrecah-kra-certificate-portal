import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only create the real client if both URL and Key are present and not placeholders
const isConfigured = supabaseUrl && 
                   supabaseAnonKey && 
                   supabaseUrl !== 'https://placeholder.supabase.co' && 
                   supabaseAnonKey !== 'placeholder';

export const supabase: any = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      channel: () => ({ on: () => ({ subscribe: () => ({}) }), subscribe: () => ({}) }),
      removeChannel: () => ({}),
      from: () => {
        const chain: any = {
          select: () => chain,
          eq: () => chain,
          order: () => chain,
          limit: () => chain,
          single: () => chain,
          maybeSingle: () => chain,
          insert: () => chain,
          update: () => chain,
          upsert: () => chain,
          delete: () => chain,
          then: (onfulfilled: any) => Promise.resolve({ data: [], error: null }).then(onfulfilled),
          catch: (onrejected: any) => Promise.resolve({ data: [], error: null }).catch(onrejected),
        };
        return chain;
      },
    };
