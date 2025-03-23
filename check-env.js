// Simple script to check environment variables
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Print all environment variables (excluding sensitive values)
console.log('Environment Variables:');
Object.keys(process.env).forEach(key => {
  if (key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD')) {
    console.log(`${key}: [HIDDEN]`);
  } else {
    console.log(`${key}: ${process.env[key]}`);
  }
});

// Specifically check Supabase variables
console.log('\nSupabase Configuration:');
console.log(`PUBLIC_SUPABASE_URL: ${process.env.PUBLIC_SUPABASE_URL}`);
console.log(`PUBLIC_SUPABASE_ANON_KEY available: ${process.env.PUBLIC_SUPABASE_ANON_KEY ? 'Yes' : 'No'}`);

// Check if URL is valid
try {
  if (process.env.PUBLIC_SUPABASE_URL) {
    const url = new URL(process.env.PUBLIC_SUPABASE_URL);
    console.log(`\nURL validation:`);
    console.log(`Protocol: ${url.protocol}`);
    console.log(`Hostname: ${url.hostname}`);
    console.log(`Is valid URL: Yes`);
    
    // Try to resolve the hostname
    console.log('\nAttempting to resolve hostname...');
    const dns = await import('dns');
    dns.promises.lookup(url.hostname)
      .then(result => {
        console.log(`Resolved to IP: ${result.address}`);
      })
      .catch(err => {
        console.error(`Failed to resolve hostname: ${err.message}`);
      });
  }
} catch (e) {
  console.error(`Invalid URL: ${e.message}`);
}
