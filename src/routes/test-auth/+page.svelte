<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import type { AuthError, User } from '@supabase/supabase-js';

    let status = 'Checking authentication...';
    let supabaseUrl = '';
    let supabaseKey = '';
    let error: string | null = null;
    let email = 'test@example.com';
    let password = 'password123';
    let user: User | null = null;
    let loading = false;

    onMount(async () => {
        try {
            // Check environment variables
            supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'Not set';
            supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ? 'Set (hidden for security)' : 'Not set';
            
            // Test Supabase connection
            const { data, error: authError } = await supabase.auth.getSession();
            
            if (authError) {
                status = 'Authentication error';
                error = authError.message;
            } else if (data.session) {
                status = 'Authenticated';
                user = data.session.user;
            } else {
                status = 'Not authenticated';
            }
        } catch (e: unknown) {
            status = 'Error checking authentication';
            error = e instanceof Error ? e.message : 'Unknown error';
        }
    });

    async function handleSignIn() {
        try {
            loading = true;
            error = null;
            
            console.log('Attempting to sign in with:', { email, password: '***' });
            console.log('Supabase URL:', supabaseUrl);
            console.log('Supabase Key set:', !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY);
            
            // First, check if the Supabase client is properly initialized
            if (!supabase) {
                error = 'Supabase client is not initialized';
                return;
            }
            
            // Try to sign in with the provided credentials
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (signInError) {
                error = `Sign in error: ${signInError.message} (Code: ${signInError.status || 'unknown'})`;
                console.error('Sign in error details:', signInError);
                
                // Add more specific error handling for common cases
                if (signInError.message.includes('Invalid login credentials')) {
                    error += '\n\nPossible causes:\n- Password is incorrect\n- Email does not exist\n- Account is locked';
                }
            } else if (data && data.user) {
                status = 'Authenticated';
                user = data.user;
                console.log('Successfully signed in:', data.user);
            } else {
                error = 'No error returned, but no user data either';
                console.warn('Unexpected response:', data);
            }
        } catch (e: unknown) {
            error = `Exception during sign in: ${e instanceof Error ? e.message : 'Unknown error'}`;
            console.error('Exception during sign in:', e);
        } finally {
            loading = false;
        }
    }

    async function handleSignOut() {
        try {
            loading = true;
            error = null;
            
            const { error: signOutError } = await supabase.auth.signOut();

            if (signOutError) {
                error = signOutError.message;
            } else {
                status = 'Not authenticated';
                user = null;
            }
        } catch (e: unknown) {
            error = e instanceof Error ? e.message : 'Unknown error';
        } finally {
            loading = false;
        }
    }

    // Function to test if we can get user without password
    async function checkUserExists() {
        try {
            loading = true;
            error = null;
            
            // This just checks if the email exists without trying to authenticate
            const { data, error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password'
            });

            if (resetError) {
                error = `Error checking user: ${resetError.message}`;
            } else {
                error = 'Password reset email sent if the account exists. This confirms the email is valid in the system.';
            }
        } catch (e: unknown) {
            error = e instanceof Error ? e.message : 'Unknown error';
        } finally {
            loading = false;
        }
    }
</script>

<div class="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
    <h1 class="text-2xl font-bold mb-6">Authentication Test Page</h1>
    
    <div class="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 class="text-lg font-semibold mb-2">Environment Check</h2>
        <p><strong>Supabase URL:</strong> {supabaseUrl}</p>
        <p><strong>Supabase Key:</strong> {supabaseKey}</p>
    </div>
    
    <div class="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 class="text-lg font-semibold mb-2">Authentication Status</h2>
        <p><strong>Status:</strong> <span class="{status === 'Authenticated' ? 'text-green-600' : status === 'Not authenticated' ? 'text-yellow-600' : 'text-red-600'}">{status}</span></p>
        
        {#if error}
            <div class="mt-2 p-3 bg-red-100 text-red-700 rounded-lg">
                <p><strong>Error:</strong> {error}</p>
            </div>
        {/if}
        
        {#if user}
            <div class="mt-4">
                <h3 class="font-medium">User Details:</h3>
                <pre class="mt-2 p-3 bg-gray-200 rounded-lg overflow-x-auto text-sm">{JSON.stringify(user, null, 2)}</pre>
            </div>
        {/if}
    </div>
    
    <div class="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 class="text-lg font-semibold mb-4">Test Authentication</h2>
        
        {#if !user}
            <div class="mb-4">
                <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                    id="email" 
                    type="email" 
                    bind:value={email} 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
            
            <div class="mb-4">
                <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                    id="password" 
                    type="password" 
                    bind:value={password} 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
            
            <div class="flex space-x-2">
                <button 
                    on:click={handleSignIn}
                    disabled={loading}
                    class="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
                
                <button 
                    on:click={checkUserExists}
                    disabled={loading}
                    class="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Check Email Exists
                </button>
            </div>
        {:else}
            <button 
                on:click={handleSignOut}
                disabled={loading}
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Signing out...' : 'Sign Out'}
            </button>
        {/if}
    </div>
</div>
