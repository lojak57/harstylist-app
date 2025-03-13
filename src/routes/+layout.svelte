<script lang="ts">
    import "../app.css";
    import RouteGuard from "$lib/components/RouteGuard.svelte";
    import NavBar from "$lib/components/NavBar.svelte";
    import { fade } from 'svelte/transition';
    import { page } from '$app/stores';
</script>

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
