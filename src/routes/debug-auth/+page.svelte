<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let loading = false;
    let email = 'test@example.com';
    let password = 'password123';
    let customPassword = '';
    let error: string | null = null;
    let successMessage: string | null = null;
    let supabaseUrl = '';
    let supabaseKey = '';
    let debugInfo = '';
    let authResponse: any = null;

    onMount(async () => {
        // Check environment variables
        supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'Not set';
        supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ? 'Set (hidden for security)' : 'Not set';
        
        // Test Supabase connection
        try {
            const { data, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) {
                debugInfo += `Session error: ${JSON.stringify(sessionError)}\n`;
            } else {
                debugInfo += `Session data: ${JSON.stringify(data)}\n`;
            }
        } catch (e) {
            debugInfo += `Exception getting session: ${e.message}\n`;
        }
    });

    async function testSignInWithEmail() {
        try {
            loading = true;
            error = null;
            successMessage = null;
            debugInfo = '';
            authResponse = null;
            
            debugInfo += `Attempting to sign in with: ${email} and standard password\n`;
            
            // Try to sign in with the provided credentials
            const result = await supabase.auth.signInWithPassword({
                email,
                password
            });

            authResponse = result;
            debugInfo += `Auth response: ${JSON.stringify(result, null, 2)}\n`;
            
            if (result.error) {
                error = `Sign in error: ${result.error.message}`;
                debugInfo += `Error details: ${JSON.stringify(result.error)}\n`;
            } else if (result.data?.user) {
                successMessage = 'Successfully signed in!';
                debugInfo += `User: ${JSON.stringify(result.data.user)}\n`;
            } else {
                error = 'No error returned, but no user data either';
            }
        } catch (e) {
            error = `Exception: ${e.message}`;
            debugInfo += `Exception during sign in: ${e}\n`;
        } finally {
            loading = false;
        }
    }

    async function testSignInWithCustomPassword() {
        try {
            loading = true;
            error = null;
            successMessage = null;
            debugInfo = '';
            authResponse = null;
            
            if (!customPassword) {
                error = 'Please enter a custom password';
                return;
            }
            
            debugInfo += `Attempting to sign in with: ${email} and custom password\n`;
            
            // Try to sign in with custom password
            const result = await supabase.auth.signInWithPassword({
                email,
                password: customPassword
            });

            authResponse = result;
            debugInfo += `Auth response: ${JSON.stringify(result, null, 2)}\n`;
            
            if (result.error) {
                error = `Sign in error: ${result.error.message}`;
                debugInfo += `Error details: ${JSON.stringify(result.error)}\n`;
            } else if (result.data?.user) {
                successMessage = 'Successfully signed in with custom password!';
                debugInfo += `User: ${JSON.stringify(result.data.user)}\n`;
            } else {
                error = 'No error returned, but no user data either';
            }
        } catch (e) {
            error = `Exception: ${e.message}`;
            debugInfo += `Exception during sign in: ${e}\n`;
        } finally {
            loading = false;
        }
    }

    async function testSignUp() {
        try {
            loading = true;
            error = null;
            successMessage = null;
            debugInfo = '';
            authResponse = null;
            
            const testEmail = `test${Date.now()}@example.com`;
            debugInfo += `Attempting to sign up with: ${testEmail}\n`;
            
            // Try to sign up a new user
            const result = await supabase.auth.signUp({
                email: testEmail,
                password: 'password123'
            });

            authResponse = result;
            debugInfo += `Auth response: ${JSON.stringify(result, null, 2)}\n`;
            
            if (result.error) {
                error = `Sign up error: ${result.error.message}`;
                debugInfo += `Error details: ${JSON.stringify(result.error)}\n`;
            } else {
                successMessage = `Attempted to sign up with ${testEmail}. Check response for details.`;
            }
        } catch (e) {
            error = `Exception: ${e.message}`;
            debugInfo += `Exception during sign up: ${e}\n`;
        } finally {
            loading = false;
        }
    }

    async function signOut() {
        try {
            loading = true;
            error = null;
            successMessage = null;
            debugInfo = '';
            
            const { error: signOutError } = await supabase.auth.signOut();
            
            if (signOutError) {
                error = `Sign out error: ${signOutError.message}`;
                debugInfo += `Error details: ${JSON.stringify(signOutError)}\n`;
            } else {
                successMessage = 'Successfully signed out';
            }
        } catch (e) {
            error = `Exception: ${e.message}`;
            debugInfo += `Exception during sign out: ${e}\n`;
        } finally {
            loading = false;
        }
    }
</script>

<div class="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
    <h1 class="text-2xl font-bold mb-6">Authentication Debug Page</h1>
    
    <div class="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 class="text-lg font-semibold mb-2">Environment Check</h2>
        <p><strong>Supabase URL:</strong> {supabaseUrl}</p>
        <p><strong>Supabase Key:</strong> {supabaseKey}</p>
    </div>
    
    {#if error}
        <div class="mb-6 p-4 bg-red-100 rounded-lg text-red-700">
            <h2 class="text-lg font-semibold mb-2">Error</h2>
            <p>{error}</p>
        </div>
    {/if}
    
    {#if successMessage}
        <div class="mb-6 p-4 bg-green-100 rounded-lg text-green-700">
            <h2 class="text-lg font-semibold mb-2">Success</h2>
            <p>{successMessage}</p>
        </div>
    {/if}
    
    <div class="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 bg-gray-100 rounded-lg">
            <h2 class="text-lg font-semibold mb-4">Test Default Credentials</h2>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                    type="email" 
                    bind:value={email} 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
            
            <div class="mb-4">
                <p class="text-sm text-gray-600">Using default password: password123</p>
            </div>
            
            <button 
                on:click={testSignInWithEmail}
                disabled={loading}
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Testing...' : 'Test Sign In'}
            </button>
        </div>
        
        <div class="p-4 bg-gray-100 rounded-lg">
            <h2 class="text-lg font-semibold mb-4">Test Custom Password</h2>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                    type="email" 
                    bind:value={email} 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
            
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Custom Password</label>
                <input 
                    type="password" 
                    bind:value={customPassword} 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter a different password"
                />
            </div>
            
            <button 
                on:click={testSignInWithCustomPassword}
                disabled={loading}
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Testing...' : 'Test Custom Password'}
            </button>
        </div>
    </div>
    
    <div class="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 bg-gray-100 rounded-lg">
            <h2 class="text-lg font-semibold mb-4">Test Sign Up (New User)</h2>
            <p class="text-sm text-gray-600 mb-4">This will attempt to create a new user with a random email address.</p>
            
            <button 
                on:click={testSignUp}
                disabled={loading}
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Testing...' : 'Test Sign Up'}
            </button>
        </div>
        
        <div class="p-4 bg-gray-100 rounded-lg">
            <h2 class="text-lg font-semibold mb-4">Sign Out</h2>
            <p class="text-sm text-gray-600 mb-4">Sign out the current user (if any).</p>
            
            <button 
                on:click={signOut}
                disabled={loading}
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Signing out...' : 'Sign Out'}
            </button>
        </div>
    </div>
    
    {#if debugInfo}
        <div class="mb-6 p-4 bg-gray-100 rounded-lg">
            <h2 class="text-lg font-semibold mb-2">Debug Information</h2>
            <pre class="whitespace-pre-wrap text-xs bg-gray-800 text-white p-4 rounded-md overflow-x-auto">{debugInfo}</pre>
        </div>
    {/if}
    
    {#if authResponse}
        <div class="mb-6 p-4 bg-gray-100 rounded-lg">
            <h2 class="text-lg font-semibold mb-2">Auth Response</h2>
            <pre class="whitespace-pre-wrap text-xs bg-gray-800 text-white p-4 rounded-md overflow-x-auto">{JSON.stringify(authResponse, null, 2)}</pre>
        </div>
    {/if}
</div>
