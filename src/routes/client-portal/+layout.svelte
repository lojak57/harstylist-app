<script lang="ts">
    import ClientPortalNav from '$lib/components/ClientPortalNav.svelte';
</script>

<!-- Client Portal Layout -->
<ClientPortalNav />

<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
    <slot />
</main>

<style>
    /* Client portal specific styles */
    :global(body) {
        background-color: #fafafa;
    }
</style>
