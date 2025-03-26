<script lang="ts">
    import "../app.css";
    import RouteGuard from "$lib/components/RouteGuard.svelte";
    import NavBar from "$lib/components/NavBar.svelte";
    import { fade } from 'svelte/transition';
    import { page } from '$app/stores';
    
    // Check if the current page is a debug page or authentication-related page that should bypass authentication
    $: isPublicPage = $page.url.pathname.includes('/debug-auth') || 
                      $page.url.pathname.includes('/test-auth') || 
                      $page.url.pathname.includes('/confirm-email') || 
                      $page.url.pathname.includes('/login') || 
                      $page.url.pathname.includes('/register') ||
                      $page.url.pathname.includes('/client-portal/login') ||
                      $page.url.pathname.includes('/client-portal/register') ||
                      $page.url.pathname.includes('/client-portal/create-account') ||
                      $page.url.pathname.includes('/client-portal/reset-password');
</script>

{#if isPublicPage}
    <!-- Bypass RouteGuard for public pages -->
    <div class="min-h-screen bg-gray-100">
        <main class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            {#key $page.url.pathname}
                <div in:fade={{ duration: 250, delay: 50 }}>
                    <slot />
                </div>
            {/key}
        </main>
    </div>
{:else}
    <!-- Use RouteGuard for all other pages -->
    <RouteGuard>
        <div class="min-h-screen bg-gray-100">
            <NavBar />

            <main class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                {#key $page.url.pathname}
                    <div in:fade={{ duration: 250, delay: 50 }}>
                        <slot />
                    </div>
                {/key}
            </main>
        </div>
    </RouteGuard>
{/if}
