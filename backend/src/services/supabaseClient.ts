import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente con service_role para operaciones del backend
// NUNCA exponer esta key en el frontend
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

// Cliente anon para validar tokens de usuarios
export const supabaseClient = createClient(
    supabaseUrl,
    process.env.SUPABASE_ANON_KEY!
);