import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
  return {
    supabaseInfo: {
      url: PUBLIC_SUPABASE_URL,
      keyAvailable: !!PUBLIC_SUPABASE_ANON_KEY
    }
  };
}
