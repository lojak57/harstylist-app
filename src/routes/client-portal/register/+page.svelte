<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let email = '';
    let password = '';
    let confirmPassword = '';
    let clientCode = '';
    let loading = false;
    let error: string | null = null;
    let successMessage = '';

    onMount(async () => {
        // Check if user is already logged in
        const { data } = await supabase.auth.getSession();
        if (data.session) {
            goto('/client-portal');
        }

        // Check if we have a client code in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (code) {
            clientCode = code;
        }
    });

    async function handleRegister() {
        try {
            loading = true;
            error = null;
            
            if (!email) {
                error = 'Please enter your email';
                return;
            }
            
            if (!password) {
                error = 'Please enter a password';
                return;
            }

            if (password.length < 8) {
                error = 'Password must be at least 8 characters';
                return;
            }
            
            if (password !== confirmPassword) {
                error = 'Passwords do not match';
                return;
            }

            if (!clientCode) {
                error = 'Please enter your client code';
                return;
            }
            
            // First check if the client code is valid
            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('id, email, user_id, name')
                .eq('client_code', clientCode)
                .single();
                
            if (clientError) {
                error = 'Invalid client code. Please check with your stylist.';
                return;
            }
            
            if (clientData.user_id) {
                error = 'This client profile is already linked to an account.';
                return;
            }
            
            // Check if the email matches the client's email
            if (clientData.email && clientData.email.toLowerCase() !== email.toLowerCase()) {
                error = 'The email address does not match the one on file. Please use the email your stylist has on record.';
                return;
            }
            
            // Create the user account
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/client-portal/login`,
                    data: {
                        full_name: clientData.name || '',
                        client_id: clientData.id
                    }
                }
            });
            
            if (signUpError) throw signUpError;
            
            // Link the client profile to the user account
            const { error: updateError } = await supabase
                .from('clients')
                .update({ user_id: data.user?.id })
                .eq('id', clientData.id);
                
            if (updateError) throw updateError;
            
            successMessage = 'Registration successful! Please check your email to confirm your account.';
            
        } catch (e: any) {
            console.error('Registration error:', e);
            error = e.message || 'An error occurred during registration';
        } finally {
            loading = false;
        }
    }
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="text-center">
            <h2 class="text-3xl font-extrabold text-gray-900">Client Registration</h2>
            <p class="mt-2 text-sm text-gray-600">
                Create an account to access your appointments and profile
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
            
            {#if !successMessage}
                <form class="space-y-6" on:submit|preventDefault={handleRegister}>
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
                                autocomplete="new-password"
                                required
                                bind:value={password}
                                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <p class="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
                    </div>

                    <div>
                        <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirm Password</label>
                        <div class="mt-1">
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autocomplete="new-password"
                                required
                                bind:value={confirmPassword}
                                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label for="clientCode" class="block text-sm font-medium text-gray-700">Client Code</label>
                        <div class="mt-1">
                            <input
                                id="clientCode"
                                name="clientCode"
                                type="text"
                                required
                                bind:value={clientCode}
                                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <p class="mt-1 text-xs text-gray-500">Provided by your stylist</p>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating account...' : 'Create account'}
                        </button>
                    </div>
                </form>
            {/if}

            <div class="mt-6 text-center">
                <p class="text-sm text-gray-600">
                    Already have an account?
                    <a href="/client-portal/login" class="font-medium text-indigo-600 hover:text-indigo-500">
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    </div>
</div>
