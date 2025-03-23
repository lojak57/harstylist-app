<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  let email = '';
  let loading = false;
  let error: string | null = null;
  let success = false;
  let token = '';
  let debugInfo = '';
  
  onMount(() => {
    // Check if we have a token in the URL
    token = $page.url.searchParams.get('token') || '';
    email = $page.url.searchParams.get('email') || '';
    
    debugInfo += `Email from URL: ${email}\n`;
    debugInfo += `Token from URL: ${token}\n`;
    
    // If we have a token, try to confirm the email automatically
    if (token) {
      confirmWithToken();
    }
  });
  
  async function confirmWithToken() {
    try {
      loading = true;
      error = null;
      
      debugInfo += `Attempting to confirm with token...\n`;
      
      // Use the Supabase API to verify the token
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      });
      
      if (verifyError) {
        error = `Verification failed: ${verifyError.message}`;
        debugInfo += `Verification error: ${JSON.stringify(verifyError)}\n`;
      } else {
        success = true;
        debugInfo += `Token verification successful\n`;
        // Removed automatic redirection
      }
    } catch (e) {
      error = `Error: ${e.message}`;
      debugInfo += `Exception during token verification: ${e.message}\n`;
    } finally {
      loading = false;
    }
  }
  
  async function manualConfirm() {
    try {
      loading = true;
      error = null;
      
      if (!email) {
        error = 'Please enter your email';
        return;
      }
      
      debugInfo += `Attempting manual confirmation for: ${email}\n`;
      
      // Call our API endpoint to manually confirm the email
      const response = await fetch('/api/confirm-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      const result = await response.json();
      debugInfo += `API response: ${JSON.stringify(result)}\n`;
      
      if (!result.success) {
        error = result.error || 'Failed to confirm email';
      } else {
        success = true;
        // Removed automatic redirection
      }
    } catch (e) {
      error = `Error: ${e.message}`;
      debugInfo += `Exception during manual confirmation: ${e.message}\n`;
    } finally {
      loading = false;
    }
  }
  
  async function resendConfirmation() {
    try {
      loading = true;
      error = null;
      
      if (!email) {
        error = 'Please enter your email';
        return;
      }
      
      debugInfo += `Attempting to resend confirmation for: ${email}\n`;
      
      // Use Supabase to resend the confirmation email
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email
      });
      
      if (resendError) {
        error = `Failed to resend: ${resendError.message}`;
        debugInfo += `Resend error: ${JSON.stringify(resendError)}\n`;
      } else {
        success = true;
        debugInfo += `Confirmation email resent successfully\n`;
      }
    } catch (e) {
      error = `Error: ${e.message}`;
      debugInfo += `Exception during resend: ${e.message}\n`;
    } finally {
      loading = false;
    }
  }
  
  function goToLogin() {
    goto('/login');
  }
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
      Email Confirmation
    </h2>
    <p class="mt-2 text-center text-sm text-gray-600">
      Confirm your email address to complete registration
    </p>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      {#if loading}
        <div class="flex justify-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      {:else if success}
        <div class="rounded-md bg-green-50 p-4 mb-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-green-800">Email confirmed successfully!</h3>
              <div class="mt-2 text-sm text-green-700">
                <p>Your email has been confirmed. You can now log in.</p>
              </div>
            </div>
          </div>
          <div class="mt-4">
            <button
              on:click={goToLogin}
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Go to Login
            </button>
          </div>
        </div>
      {:else}
        {#if error}
          <div class="rounded-md bg-red-50 p-4 mb-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">Error</h3>
                <div class="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        {/if}

        <div class="space-y-6">
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

          <div class="flex flex-col space-y-4">
            <button
              on:click={manualConfirm}
              disabled={loading}
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Confirm Email Manually
            </button>
            
            <button
              on:click={resendConfirmation}
              disabled={loading}
              class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Resend Confirmation Email
            </button>
          </div>
        </div>
      {/if}
      
      <!-- Debug information section -->
      {#if debugInfo}
        <div class="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 class="text-sm font-medium text-gray-700 mb-2">Debug Information</h3>
          <pre class="text-xs text-gray-600 overflow-auto max-h-40">{debugInfo}</pre>
        </div>
      {/if}
    </div>
  </div>
</div>
