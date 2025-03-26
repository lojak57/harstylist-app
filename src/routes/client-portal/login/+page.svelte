<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let email = '';
    let password = '';
    let loading = false;
    let error: string | null = null;
    let successMessage = '';

    onMount(async () => {
        // Check if user is already logged in
        const { data } = await supabase.auth.getSession();
        if (data.session) {
            goto('/client-portal');
        }
    });

    async function handleLogin() {
        try {
            loading = true;
            error = null;
            
            if (!email) {
                error = 'Please enter your email';
                return;
            }
            
            if (!password) {
                error = 'Please enter your password';
                return;
            }
            
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (signInError) throw signInError;
            
            // Check if this user has a client profile
            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('id')
                .eq('user_id', data.user.id)
                .single();
                
            if (clientError && clientError.code !== 'PGRST116') {
                throw clientError;
            }
            
            if (!clientData) {
                // User exists but doesn't have a client profile
                error = 'No client profile found for this account. Please contact your stylist.';
                await supabase.auth.signOut();
                return;
            }
            
            // Redirect to client portal
            goto('/client-portal');
            
        } catch (e: any) {
            console.error('Login error:', e);
            error = e.message || 'An error occurred during login';
        } finally {
            loading = false;
        }
    }

    async function handleForgotPassword() {
        try {
            loading = true;
            error = null;
            
            if (!email) {
                error = 'Please enter your email';
                return;
            }
            
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/client-portal/reset-password`,
            });
            
            if (resetError) throw resetError;
            
            successMessage = 'Password reset instructions sent to your email';
            
        } catch (e: any) {
            console.error('Password reset error:', e);
            error = e.message || 'An error occurred while requesting a password reset';
        } finally {
            loading = false;
        }
    }

    function goToStylistLogin() {
        goto('/login');
    }
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="text-center">
            <h2 class="text-3xl font-extrabold text-gray-900">Client Portal</h2>
            <p class="mt-2 text-sm text-gray-600">
                Sign in to access your appointments and profile
            </p>
        </div>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200">
            {#if error}
                <div class="rounded-md bg-red-50 p-4 mb-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm font-medium text-red-800">{error}</p>
                        </div>
                    </div>
                </div>
            {/if}
            
            {#if successMessage}
                <div class="rounded-md bg-green-50 p-4 mb-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm font-medium text-green-800">{successMessage}</p>
                        </div>
                    </div>
                </div>
            {/if}
            
            <form class="space-y-6" on:submit|preventDefault={handleLogin}>
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700">Email address</label>
                    <div class="mt-1">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autocomplete="email"
                            required
                            bind:value={email}
                            class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                    <div class="mt-1">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autocomplete="current-password"
                            required
                            bind:value={password}
                            class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div class="flex items-center justify-between">
                    <div class="text-sm">
                        <button 
                            type="button" 
                            on:click={handleForgotPassword}
                            class="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
                        >
                            Forgot your password?
                        </button>
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </div>
            </form>

            <div class="mt-6">
                <div class="relative">
                    <div class="absolute inset-0 flex items-center">
                        <div class="w-full border-t border-gray-300"></div>
                    </div>
                    <div class="relative flex justify-center text-sm">
                        <span class="px-2 bg-white text-gray-500">New client?</span>
                    </div>
                </div>
                <div class="mt-6 text-center">
                    <a href="/client-portal/create-account" class="font-medium text-indigo-600 hover:text-indigo-500">
                        Create a new account
                    </a>
                </div>
            </div>

            <!-- Stylist Login Section -->
            <div class="mt-8 pt-6 border-t border-gray-200">
                <div class="text-center">
                    <h3 class="text-md font-medium text-gray-900">Are you a stylist?</h3>
                    <p class="mt-1 text-sm text-gray-500">
                        Access your dashboard and appointments through the stylist portal
                    </p>
                    <div class="mt-4">
                        <button
                            on:click={goToStylistLogin}
                            class="inline-flex items-center px-4 py-2 border border-indigo-300 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <svg class="-ml-1 mr-2 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                            </svg>
                            Go to Stylist Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
