import { createClient } from '@supabase/supabase-js'

// Ambil URL dan Anon Key dari environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Buat dan ekspor Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)