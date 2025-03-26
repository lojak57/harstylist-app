<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let password = '';
    let confirmPassword = '';
    let loading = false;
    let error: string | null = null;
    let success = false;

    onMount(async () => {
        // Check if we have a hash in the URL (from password reset email)
        const hash = window.location.hash;
        if (!hash || !hash.includes('type=recovery')) {
            error = 'Invalid password reset link. Please request a new password reset email.';
        }
    });

    async function handleResetPassword() {
        try {
            loading = true;
            error = null;
            
            if (!password) {
                error = 'Please enter a new password';
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
            
            const { error: resetError } = await supabase.auth.updateUser({
                password: password
            });
            
            if (resetError) throw resetError;
            
            success = true;
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                goto('/client-portal/login');
            }, 3000);
            
        } catch (e: any) {
            console.error('Password reset error:', e);
            error = e.message || 'An error occurred while resetting your password';
        } finally {
            loading = false;
        }
    }
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="text-center">
            <h2 class="text-3xl font-extrabold text-gray-900">Reset Password</h2>
            <p class="mt-2 text-sm text-gray-600">
                Create a new password for your account
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
            
            {#if success}
                <div class="rounded-md bg-green-50 p-4 mb-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm font-medium text-green-800">Password reset successful! Redirecting to login...</p>
                        </div>
                    </div>
                </div>
            {/if}
            
            {#if !success}
                <form class="space-y-6" on:submit|preventDefault={handleResetPassword}>
                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-700">New Password</label>
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
                        <button
                            type="submit"
                            disabled={loading}
                            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </div>
                </form>
            {/if}

            <div class="mt-6 text-center">
                <a href="/client-portal/login" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    Return to login
                </a>
            </div>
        </div>
    </div>
</div>
