// src/lib/supabase.ts
// Supabase client initialization for DAISY ecommerce

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client (uses anon key)
// Note: We use manual type casting (e.g. `data as Category[]`) instead of
// the Database generic, because our custom type schema uses a simplified
// format that isn't fully compatible with Supabase's generic constraints.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client (uses service role key - only use in API routes)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey)
  : createClient(supabaseUrl, supabaseAnonKey); // Fallback to anon key if service role key not set
