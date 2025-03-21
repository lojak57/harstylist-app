/**
 * Type definitions for the application
 */
import type { Database } from '$lib/supabase';

// Base appointment type that matches the database schema
export type Appointment = Database['public']['Tables']['appointments']['Row'] & {
    client?: {
        id?: string;
        name?: string;
        email?: string;
        phone?: string;
    };
};

// Extended appointment type that includes client information
export interface AppointmentWithClient extends Appointment {
    // Additional client fields if needed
}

// Client type
export type Client = Database['public']['Tables']['clients']['Row'];

// Service type
export interface Service {
    id: string;
    stylist_id: string;
    name: string;
    description?: string;
    duration?: string;
    price?: number;
    category?: string;
    created_at?: string;
}
