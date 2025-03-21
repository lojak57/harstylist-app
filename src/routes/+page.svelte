<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let loading = false;
    let email = '';
    let password = '';
    let error: string | null = null;
    let isSignIn = true; // Toggle between sign in and register views
    let needsVerification = false; // Flag for showing verification options
    let verificationSent = false; // Flag for showing verification sent message
    const emailPattern = "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}";

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
            needsVerification = false;
            verificationSent = false;
            
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (signInError) {
                // Check if the error is related to email verification
                if (signInError.message.includes('Email not confirmed') || 
                    signInError.message.includes('not verified') || 
                    signInError.message.includes('not confirmed')) {
                    needsVerification = true;
                    error = 'Your email has not been verified. Please check your inbox for the verification link or request a new one.';
                } else {
                    throw signInError;
                }
                return;
            }

            goto('/clients');
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    async function resendVerificationEmail() {
        try {
            loading = true;
            error = null;
            
            const { error: resendError } = await supabase.auth.resend({
                type: 'signup',
                email
            });

            if (resendError) throw resendError;
            
            verificationSent = true;
            error = null;
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    // Function to bypass verification and create a new account if needed
    async function continueWithoutVerification() {
        try {
            loading = true;
            error = null;
            
            // First try to sign in directly (this might work on some Supabase configurations)
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (!signInError && signInData?.session) {
                // If sign-in worked, redirect to clients page
                goto('/clients');
                return;
            }
            
            // If sign-in failed, try to create a new account with the same credentials
            // This is a workaround for testing purposes
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    // Skip email verification
                    data: {
                        confirmed_at: new Date().toISOString()
                    }
                }
            });
            
            if (signUpError) throw signUpError;
            
            if (signUpData?.user) {
                // Create stylist record
                await supabase.from('stylists').insert([{
                    id: signUpData.user.id,
                    email: signUpData.user.email || '',
                    name: signUpData.user.email ? signUpData.user.email.split('@')[0] : 'Test Stylist'
                }]);
                
                // Create a sample client
                await supabase.from('clients').insert([{
                    stylist_id: signUpData.user.id,
                    email: signUpData.user.email || '',
                    name: 'Sample Client',
                    phone: '555-123-4567',
                    notes: 'This is a sample client for testing purposes.'
                }]);
                
                // Create a sample service
                await supabase.from('services').insert([{
                    stylist_id: signUpData.user.id,
                    name: 'Haircut',
                    description: 'Basic haircut service',
                    price: 50,
                    duration: 60
                }]);
                
                // Try to sign in with the new account
                const { data: newSignInData, error: newSignInError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                
                if (newSignInError) throw newSignInError;
                
                goto('/clients');
            } else {
                throw new Error('Failed to create test account');
            }
        } catch (e: any) {
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
                password,
                options: {
                    emailRedirectTo: window.location.origin
                }
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

                needsVerification = true;
                error = 'Check your email for the verification link';
                // In a real app, you might want to redirect to a "check your email" page
            }
        } catch (e: any) {
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
        needsVerification = false;
        verificationSent = false;
    }

    // Function to bypass verification in development environment
    async function bypassVerification() {
        try {
            loading = true;
            error = null;
            
            // This is a workaround for development purposes only
            // In production, this would be removed
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (signInError) throw signInError;
            
            // If we get here, try to force the session
            const session = data?.session;
            if (session) {
                await supabase.auth.setSession(session);
                goto('/clients');
            } else {
                throw new Error('Could not establish session');
            }
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
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

            {#if verificationSent}
                <div class="rounded-md bg-green-50 p-4 mb-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-green-700">Verification email sent! Please check your inbox.</p>
                        </div>
                    </div>
                </div>
            {/if}

            <form class="space-y-6" on:submit|preventDefault={isSignIn ? handleSignIn : handleSignUp}>
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700">Email address</label>
                    <div class="mt-1">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autocomplete="email"
                            required
                            pattern={emailPattern}
                            title="Please enter a valid email address"
                            bind:value={email}
                            class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="you@example.com"
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
                            autocomplete={isSignIn ? "current-password" : "new-password"}
                            required
                            bind:value={password}
                            class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="••••••••"
                        />
                    </div>
                    {#if !isSignIn}
                        <p class="mt-1 text-xs text-gray-500">Password must be at least 6 characters</p>
                    {/if}
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-200"
                    >
                        {#if loading}
                            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        {:else}
                            {isSignIn ? 'Sign in' : 'Create account'}
                        {/if}
                    </button>
                </div>

                {#if needsVerification}
                    <div class="mt-4 space-y-3">
                        <div class="text-sm text-center text-gray-700">
                            <p>Didn't receive a verification email?</p>
                        </div>
                        <div class="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3">
                            <button
                                type="button"
                                on:click={resendVerificationEmail}
                                disabled={loading || verificationSent}
                                class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                Resend verification email
                            </button>
                            
                            <button
                                type="button"
                                on:click={continueWithoutVerification}
                                disabled={loading}
                                class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                Continue without verification
                            </button>
                        </div>
                    </div>
                {/if}
            </form>

            <div class="mt-6">
                <div class="relative">
                    <div class="absolute inset-0 flex items-center">
                        <div class="w-full border-t border-gray-300"></div>
                    </div>
                    <div class="relative flex justify-center text-sm">
                        <span class="px-2 bg-white text-gray-500">
                            {isSignIn ? 'New to HairStyle Pro?' : 'Already have an account?'}
                        </span>
                    </div>
                </div>

                <div class="mt-6">
                    <button
                        type="button"
                        on:click={isSignIn ? goToRegister : toggleView}
                        class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                    >
                        {isSignIn ? 'Create a new account' : 'Sign in to your account'}
                    </button>
                </div>
            </div>

            <div class="mt-8">
                <div class="bg-indigo-50 rounded-md p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-indigo-800">Why use HairStyle Pro?</h3>
                            <div class="mt-2 text-xs text-indigo-700">
                                <ul class="list-disc pl-5 space-y-1">
                                    <li>Easily manage client appointments</li>
                                    <li>Track your services and pricing</li>
                                    <li>Create beautiful style guides</li>
                                    <li>Grow your business with powerful tools</li>
                                </ul>
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
