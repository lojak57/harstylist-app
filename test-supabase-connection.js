// Simple script to test Supabase connection
const { createClient } = require('@supabase/supabase-js');

// Replace these with your actual values from .env
const supabaseUrl = 'https://hwyewqcvagyikxfxzii.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

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
    
    // Try to get user
    console.log('\nTesting auth.getUser()...');
    const userResult = await supabase.auth.getUser();
    console.log('User result:', userResult);
    
  } catch (e) {
    console.error('Exception during test:', e);
  }
}

testConnection();
