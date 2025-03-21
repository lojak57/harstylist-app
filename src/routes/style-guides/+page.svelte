<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import StyleGuideCard from '$lib/components/StyleGuideCard.svelte';
    import CommandInput from '$lib/components/CommandInput.svelte';

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

<div class="py-6 bg-gray-50 min-h-screen">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <CommandInput />
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 gap-4">
            <div>
                <h1 class="text-3xl font-bold text-gray-900">Your Style Guides</h1>
                <p class="mt-1 text-sm text-gray-500">Create and manage your styling instructions and techniques</p>
            </div>
            <div>
                <button
                    on:click={() => goto('/style-guides/new')}
                    class="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add Style Guide
                </button>
            </div>
        </div>

        {#if error}
            <div class="mt-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg" transition:fade>{error}</div>
        {/if}

        {#if loading}
            <div class="mt-8 flex justify-center">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        {:else if styleGuides.length === 0}
            <div class="mt-6 text-center py-12 bg-white rounded-lg shadow">
                <svg class="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">No style guides</h3>
                <p class="mt-1 text-sm text-gray-500">Get started by adding a new style guide.</p>
                <div class="mt-6">
                    <button
                        type="button"
                        on:click={() => goto('/style-guides/new')}
                        class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                        </svg>
                        Add Style Guide
                    </button>
                </div>
            </div>
        {:else}
            <div in:fade={{ duration: 250 }} class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {#each styleGuides as guide (guide.id)}
                    <StyleGuideCard {guide} onDelete={() => deleteStyleGuide(guide.id)} />
                {/each}
            </div>
        {/if}
    </div>
</div>