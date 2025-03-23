// Simple script to test Supabase connection
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get values from environment
const supabaseUrl = 'https://hwyewqcvagyikxfxzii.supabase.co';
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY || '';

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log(`URL: ${supabaseUrl}`);
  console.log(`Key available: ${supabaseKey ? 'Yes' : 'No'}`);
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test a simple query
    console.log('Testing auth.getSession()...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
    } else {
      console.log('Session data:', data);
    }
    
    // Try to sign in with test user
    console.log('\nTesting sign in with newtest@example.com...');
    const signInResult = await supabase.auth.signInWithPassword({
      email: 'newtest@example.com',
      password: 'newpassword123'
    });
    console.log('Sign in result:', JSON.stringify(signInResult, null, 2));
    
  } catch (e) {
    console.error('Exception during test:', e);
  }
}

testConnection();
