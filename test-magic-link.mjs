// Test magic link authentication
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get values from environment
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY || '';

async function testMagicLink() {
  console.log('Testing Supabase magic link authentication...');
  console.log(`URL: ${supabaseUrl}`);
  console.log(`Key available: ${supabaseKey ? 'Yes' : 'No'}`);
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test a simple query to check connection
    console.log('\nTesting auth.getSession()...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
    } else {
      console.log('Session data:', data);
    }
    
    // Try to send a magic link
    console.log('\nTesting magic link for newtest@example.com...');
    const magicLinkResult = await supabase.auth.signInWithOtp({
      email: 'newtest@example.com',
      options: {
        emailRedirectTo: 'http://localhost:5176/debug-auth-direct'
      }
    });
    console.log('Magic link result:', JSON.stringify(magicLinkResult, null, 2));
    
  } catch (e) {
    console.error('Exception during test:', e);
  }
}

testMagicLink();
