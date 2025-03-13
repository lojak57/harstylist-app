<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import StyleGuideCard from '$lib/components/StyleGuideCard.svelte';

    type StyleGuide = {
        id: string;
        name: string;
        description: string;
        steps: string;
        recommended_products: string[];
        stylist_id: string;
        created_at: string;
        image_url?: string;
    };

    let styleGuides: StyleGuide[] = [];
    let error: string | null = null;
    let loading = true;

    onMount(async () => {
        await loadStyleGuides();
    });

    async function loadStyleGuides() {
        try {
            const { data, error: err } = await supabase
                .from('style_guides')
                .select('*')
                .order('created_at', { ascending: false });

            if (err) throw err;
            styleGuides = data || [];
            loading = false;
        } catch (err: any) {
            error = err.message;
            loading = false;
        }
    }

    async function deleteStyleGuide(id: string) {
        if (!confirm('Are you sure you want to delete this style guide?')) return;

        try {
            const { error: err } = await supabase
                .from('style_guides')
                .delete()
                .eq('id', id);

            if (err) throw err;
            await loadStyleGuides();
        } catch (err: any) {
            error = err.message;
        }
    }
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="md:flex md:items-center md:justify-between">
        <div class="flex-1 min-w-0">
            <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Style Guides</h2>
            <p class="mt-1 text-sm text-gray-500">Create and manage your styling instructions and techniques</p>
        </div>
        <div class="mt-4 flex md:mt-0 md:ml-4">
            <button
                on:click={() => goto('/style-guides/new')}
                class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Add Style Guide
            </button>
        </div>
    </div>

    {#if error}
        <div class="mt-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg" transition:fade>{error}</div>
    {/if}

    {#if loading}
        <div class="mt-6 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p class="mt-2 text-sm text-gray-500">Loading style guides...</p>
        </div>
    {:else if styleGuides.length === 0}
        <div class="mt-6 text-center py-12 bg-white rounded-lg shadow">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No style guides</h3>
            <p class="mt-1 text-sm text-gray-500">Get started by creating a new style guide.</p>
            <div class="mt-6">
                <button
                    type="button"
                    on:click={() => goto('/style-guides/new')}
                    class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                    </svg>
                    New Style Guide
                </button>
            </div>
        </div>
    {:else}
        <div class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {#each styleGuides as guide (guide.id)}
                <StyleGuideCard {guide} onDelete={() => deleteStyleGuide(guide.id)} />
            {/each}
        </div>
    {/if}
</div>