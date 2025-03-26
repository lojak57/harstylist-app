import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    // If the user is already authenticated, redirect to the client portal
    if (locals.user) {
        throw redirect(303, '/client-portal');
    }
    
    return {};
};
