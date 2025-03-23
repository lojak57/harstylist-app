import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Create Supabase client with environment variables
export const supabase = createClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    }
);

export type Database = {
    public: {
        Tables: {
            stylists: {
                Row: {
                    id: string;
                    email: string;
                    name: string;
                    created_at: string;
                };
            };
            clients: {
                Row: {
                    id: string;
                    stylist_id: string;
                    name: string;
                    email: string;
                    phone: string;
                    notes: string;
                    style_guide: string;
                    hair_type: string;
                    preferred_products: string;
                    last_visit: string;
                    created_at: string;
                };
            };
            appointments: {
                Row: {
                    id: string;
                    stylist_id: string;
                    client_id: string;
                    start_time: string;
                    end_time: string;
                    service_type: string;
                    notes: string;
                    created_at: string;
                };
            };
            services: {
                Row: {
                    id: string;
                    stylist_id: string;
                    name: string;
                    category: string;
                    description: string;
                    duration: string;
                    price: number;
                    created_at: string;
                };
            };
        };
    };
};