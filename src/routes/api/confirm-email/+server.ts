import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    console.log('Attempting to confirm email for:', email);

    // For development purposes, we'll use the admin API to directly confirm the email
    try {
      // Create an admin client with service role key (for server-side only)
      // In production, you would use a more secure method with proper authentication
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!serviceRoleKey) {
        console.error('Service role key not found');
        // Fallback to sending an OTP
        const { error: signInError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false
          }
        });

        if (signInError) {
          console.error('Error sending OTP:', signInError);
          return json({ 
            success: false, 
            error: `Could not send OTP: ${signInError.message}`,
            debug: { signInError }
          }, { status: 500 });
        }
        
        return json({ 
          success: true, 
          message: 'Confirmation email sent. Please check your inbox.',
          note: 'For development, configure SUPABASE_SERVICE_ROLE_KEY for direct confirmation.'
        });
      }
      
      // Use admin client to directly confirm the user's email
      const adminClient = createClient(PUBLIC_SUPABASE_URL, serviceRoleKey);
      
      // First get the user by email
      const { data: userData, error: userError } = await adminClient
        .from('auth.users')
        .select('id')
        .eq('email', email)
        .single();
      
      if (userError || !userData) {
        console.error('Error finding user:', userError);
        return json({ 
          success: false, 
          error: 'User not found with this email',
          debug: { userError }
        }, { status: 404 });
      }
      
      // Execute SQL to directly update email_confirmed_at
      const now = new Date().toISOString();
      const { error: updateError } = await adminClient.rpc('confirm_user_email', { 
        user_email: email
      });
      
      if (updateError) {
        console.error('Error confirming email:', updateError);
        return json({ 
          success: false, 
          error: `Could not confirm email: ${updateError.message}`,
          debug: { updateError }
        }, { status: 500 });
      }
      
      return json({ 
        success: true, 
        message: 'Email confirmed successfully.'
      });
      
    } catch (error: any) {
      console.error('Inner error:', error);
      return json({ 
        success: false, 
        error: `Inner error: ${error.message || 'Unknown error'}`,
        debug: { innerError: error }
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in confirm-email endpoint:', error);
    return json({ 
      success: false, 
      error: 'Server error',
      debug: { error }
    }, { status: 500 });
  }
}
