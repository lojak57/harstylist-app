<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let loading = false;
    let email = '';
    let password = '';
    let error: string | null = null;
    const emailPattern = "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}";


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
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (signInError) throw signInError;
            goto('/clients');
        } catch (e) {
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

            // Create stylist record
            if (data.user) {
                const { error: stylistError } = await supabase
                    .from('stylists')
                    .insert([{
                        id: data.user.id,
                        email: data.user.email,
                        name: data.user.email.split('@')[0]
                    }]);

                if (stylistError) {
                    console.error('Error creating stylist:', stylistError);
                }
            }

            error = 'Check your email for the confirmation link';
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
        <div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">HairStyle Pro</h2>
            <p class="mt-2 text-center text-sm text-gray-600">
                Sign in to manage your salon
            </p>
        </div>

        {#if error}
            <div class="bg-red-50 border-l-4 border-red-400 p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            </div>
        {/if}

        <form class="mt-8 space-y-6" on:submit|preventDefault={handleSignIn}>
            <div class="rounded-md shadow-sm -space-y-px">
                <div>
                    <label for="email-address" class="sr-only">Email address</label>
                    <input
                        id="email-address"
                        name="email"
                        type="email"
                        required
                        pattern={emailPattern}
                        title="Please enter a valid email address"
                        bind:value={email}
                        class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                        placeholder="Email address"
                    />
                </div>
                <div>
                    <label for="password" class="sr-only">Password</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        bind:value={password}
                        class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                        placeholder="Password"
                    />
                </div>
            </div>

            <div class="flex justify-between">
                <button
                    type="submit"
                    disabled={loading}
                    class="group relative w-1/2 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {loading ? 'Loading...' : 'Sign in'}
                </button>
                <button
                    type="button"
                    on:click={handleSignUp}
                    disabled={loading}
                    class="group relative w-1/2 ml-4 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                    {loading ? 'Loading...' : 'Sign up'}
                </button>
            </div>
        </form>
    </div>
</div>
