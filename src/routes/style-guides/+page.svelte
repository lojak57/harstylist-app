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

<div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CommandInput />
        
        <!-- Header with Gradient Background -->
        <div class="bg-gradient-to-r from-indigo-100 to-purple-100 backdrop-blur-sm rounded-xl mb-8 p-6 shadow-lg border border-indigo-200 mt-6">
            <div class="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <h1 class="text-2xl font-bold text-indigo-800">Your Style Guides</h1>
                <a
                    href="/style-guides/new"
                    class="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add Style Guide
                </a>
            </div>
            <p class="mt-2 text-sm text-indigo-600">Create and manage your styling instructions and techniques</p>
        </div>

        {#if error}
            <div in:fade={{ duration: 250 }} class="rounded-md bg-red-50 p-4 mb-6 shadow-sm">
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

        {#if loading}
            <div class="flex justify-center items-center h-64">
                <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-500"></div>
            </div>
        {:else if styleGuides.length === 0}
            <div in:fade={{ duration: 250 }} class="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                <svg class="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v5.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-5.25z" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">No style guides</h3>
                <p class="mt-1 text-sm text-gray-500">Get started by creating a new style guide.</p>
                <div class="mt-6">
                    <a href="/style-guides/new" class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                        <svg class="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                        </svg>
                        Add Style Guide
                    </a>
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