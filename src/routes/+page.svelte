<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let loading = false;
    let email = '';
    let password = '';
    let error: string | null = null;
    let successMessage: string | null = null;
    let isSignIn = true; // Toggle between sign in and register views
    let isResettingPassword = false;
    // Removed strict email pattern validation

    onMount(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            goto('/clients');
        }
    });

    async function handleSignIn() {
        try {
            loading = true;
            error = null;
            
            console.log('Attempting to sign in with:', { email });
            
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (signInError) {
                console.error('Sign in error:', signInError);
                error = signInError.message;
                
                // Add more specific error handling for common cases
                if (signInError.message.includes('Invalid login credentials')) {
                    error = 'Invalid email or password. Please check your credentials and try again.';
                }
            } else if (data && data.user) {
                console.log('Successfully signed in:', data.user.email);
                goto('/clients');
            } else {
                error = 'An unexpected error occurred. Please try again.';
            }
        } catch (e: any) {
            console.error('Exception during sign in:', e);
            error = e.message;
        } finally {
            loading = false;
        }
    }

    async function handleSignUp() {
        try {
            loading = true;
            error = null;
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password
            });

            if (signUpError) throw signUpError;

            // Create stylist and client records after successful signup
            if (data && data.user) {
                // Create client record if email exists
                if (data.user.email) {
                    await supabase.from('clients').insert([{
                        stylist_id: data.user.id,
                        email: data.user.email,
                        name: data.user.email.split('@')[0]
                    }]);
                }

                // Create stylist record
                if (data.user) {
                    const { error: stylistError } = await supabase
                        .from('stylists')
                        .insert([{
                            id: data.user.id,
                            email: data.user.email || '',
                            name: data.user.email ? data.user.email.split('@')[0] : 'New Stylist'
                        }]);

                    if (stylistError) {
                        console.error('Error creating stylist:', stylistError);
                    }
                }

                error = 'Check your email for the confirmation link';
                // In a real app, you might want to redirect to a "check your email" page
            }
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    async function handlePasswordReset() {
        try {
            loading = true;
            error = null;
            successMessage = null;
            
            if (!email) {
                error = 'Please enter your email address';
                return;
            }
            
            console.log('Attempting to reset password for:', email);
            
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password',
            });

            if (resetError) {
                console.error('Password reset error:', resetError);
                error = resetError.message;
            } else {
                successMessage = 'Password reset instructions have been sent to your email';
                isResettingPassword = false;
            }
        } catch (e: any) {
            console.error('Exception during password reset:', e);
            error = e.message;
        } finally {
            loading = false;
        }
    }

    function goToRegister() {
        goto('/register');
    }

    function toggleView() {
        isSignIn = !isSignIn;
        error = null;
    }
    
    function goToClientPortal() {
        goto('/client-portal/login');
    }
</script>

<div class="min-h-screen relative flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <!-- Background Image with Overlay -->
    <div class="absolute inset-0 bg-cover bg-center z-0" style="background-image: url('https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'); background-position: center;">
        <div class="absolute inset-0 bg-gradient-to-r from-indigo-900/90 to-purple-900/80 backdrop-blur-sm"></div>
    </div>

    <!-- Content -->
    <div class="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="text-center">
            <div class="flex justify-center">
                <div class="h-16 w-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.5 4h-5L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3l-2.5-3z" />
                    </svg>
                </div>
            </div>

            <h2 class="mt-6 text-center text-3xl font-extrabold text-white">HairStyle Pro</h2>
            <p class="mt-2 text-center text-sm text-indigo-100">
                {isSignIn ? 'Sign in to manage your salon' : 'Create your stylist account'}
            </p>
        </div>
    </div>

    <div class="mt-8 relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white/90 backdrop-blur-md py-8 px-4 shadow-2xl sm:rounded-lg sm:px-10 border border-white/20">
            {#if error}
                <div class="rounded-md bg-red-50 p-4 mb-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            {/if}
            {#if successMessage}
                <div class="rounded-md bg-green-50 p-4 mb-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-green-700">{successMessage}</p>
                        </div>
                    </div>
                </div>
            {/if}

            <form class="space-y-6" on:submit|preventDefault={isSignIn ? handleSignIn : handleSignUp}>
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700">Email address</label>
                    <div class="mt-1">
                        <input id="email" name="email" type="email" autocomplete="email" required bind:value={email} class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                </div>

                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                    <div class="mt-1">
                        <input id="password" name="password" type="password" autocomplete="current-password" required bind:value={password} class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                </div>

                {#if isSignIn}
                    <div class="flex items-center justify-between">
                        <div class="text-sm">
                            <button type="button" on:click={() => isResettingPassword = true} class="font-medium text-indigo-600 hover:text-indigo-500">
                                Forgot your password?
                            </button>
                        </div>
                        <div class="text-sm">
                            <button type="button" on:click={goToRegister} class="font-medium text-indigo-600 hover:text-indigo-500">
                                Create account
                            </button>
                        </div>
                    </div>
                {/if}

                <div>
                    <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" disabled={loading}>
                        {#if loading}
                            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        {/if}
                        {loading ? 'Processing...' : (isSignIn ? 'Sign in' : 'Sign up')}
                    </button>
                </div>
            </form>

            <div class="mt-6">
                <div class="relative">
                    <div class="absolute inset-0 flex items-center">
                        <div class="w-full border-t border-gray-300"></div>
                    </div>
                    <div class="relative flex justify-center text-sm">
                        <span class="px-2 bg-white text-gray-500">{isResettingPassword ? 'Or sign in' : (isSignIn ? 'Or register' : 'Or sign in')}</span>
                    </div>
                </div>

                {#if isResettingPassword}
                    <!-- Password Reset Form -->
                    <div class="mt-6">
                        <div>
                            <button type="button" on:click={() => { isResettingPassword = false; }} class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Return to sign in
                            </button>
                        </div>
                        <div class="mt-4">
                            <button type="button" on:click={handlePasswordReset} class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" disabled={loading}>
                                {loading ? 'Sending...' : 'Reset password'}
                            </button>
                        </div>
                    </div>
                {:else if isSignIn}
                    <!-- Register Button -->
                    <div class="mt-6">
                        <button type="button" on:click={toggleView} class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Create a new account
                        </button>
                    </div>
                {:else}
                    <!-- Sign In Button -->
                    <div class="mt-6">
                        <button type="button" on:click={toggleView} class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Sign in instead
                        </button>
                    </div>
                {/if}
            </div>
            
            <!-- Client Portal Section -->
            <div class="mt-8 pt-6 border-t border-gray-200">
                <div class="text-center">
                    <h3 class="text-md font-medium text-gray-900">Are you a client?</h3>
                    <p class="mt-1 text-sm text-gray-500">
                        Access your appointments and profile through the client portal
                    </p>
                    <div class="mt-4">
                        <button
                            on:click={goToClientPortal}
                            class="inline-flex items-center px-4 py-2 border border-indigo-300 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <svg class="-ml-1 mr-2 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Go to Client Login
                        </button>
                    </div>
                </div>
            </div>

            <div class="mt-8">
                <div class="bg-indigo-50 rounded-md p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-indigo-800">Need help?</h3>
                            <div class="mt-2 text-sm text-indigo-700">
                                <p>If you're having trouble accessing your account, please contact support at <a href="mailto:support@hairstylepro.com" class="font-bold underline">support@hairstylepro.com</a></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="mt-8 text-center text-xs text-white/70 relative z-10">
        <p> 2025 HairStyle Pro. All rights reserved.</p>
    </div>
</div>
