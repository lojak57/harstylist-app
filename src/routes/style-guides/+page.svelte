<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import StyleGuideCard from '$lib/components/StyleGuideCard.svelte';

    let styleGuides = [];
    let showForm = false;
    let error = '';
    let loading = true;

    // Form data
    let name = '';
    let description = '';
    let steps: string[] = [''];
    let recommendedProducts = [];
    let newProduct = '';
    let showDoneButton = false;

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
            styleGuides = data;
            loading = false;
        } catch (err) {
            error = err.message;
            loading = false;
        }
    }

    function handleStepInput(index: number, value: string) {
        steps[index] = value;
        steps = steps; // Trigger reactivity

        // If this is the last step and it's not empty, add a new step
        if (index === steps.length - 1 && value.trim() !== '') {
            steps = [...steps, ''];
        }

        // Show done button if we have at least one non-empty step
        showDoneButton = steps.some(step => step.trim() !== '');
    }

    function finalizeSteps() {
        // Remove empty steps and format them
        steps = steps.filter(step => step.trim() !== '');
    }

    async function handleSubmit() {
        try {
            finalizeSteps();
            if (steps.length === 0) {
                error = 'Please add at least one step';
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const formattedSteps = steps.map((step, index) => 
                `Step ${index + 1}: ${step}`
            ).join('\n');

            const { error: err } = await supabase
                .from('style_guides')
                .insert([{ 
                    stylist_id: user.id,
                    name, 
                    description, 
                    steps: formattedSteps, 
                    recommended_products: recommendedProducts 
                }]);

            if (err) throw err;

            name = '';
            description = '';
            steps = [''];
            recommendedProducts = [];
            showForm = false;
            await loadStyleGuides();
        } catch (err) {
            error = err.message;
        }
    }

    async function deleteStyleGuide(id) {
        if (!confirm('Are you sure you want to delete this style guide?')) return;

        try {
            const { error: err } = await supabase
                .from('style_guides')
                .delete()
                .eq('id', id);

            if (err) throw err;
            await loadStyleGuides();
        } catch (err) {
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
                on:click={() => showForm = !showForm}
                class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                {showForm ? 'Cancel' : 'Add Style Guide'}
            </button>
        </div>
    </div>

    {#if error}
        <div class="mt-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg" transition:fade>{error}</div>
    {/if}

    {#if showForm}
        <div class="mt-6 bg-white shadow sm:rounded-lg sm:p-6">
            <form on:submit|preventDefault={handleSubmit} class="space-y-6">
                <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div class="sm:col-span-4">
                        <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
                        <div class="mt-1">
                            <input
                                type="text"
                                name="name"
                                id="name"
                                bind:value={name}
                                required
                                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                        </div>
                    </div>

                    <div class="sm:col-span-6">
                        <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
                        <div class="mt-1">
                            <textarea
                                id="description"
                                name="description"
                                rows="3"
                                bind:value={description}
                                required
                                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                        </div>
                    </div>

                    <div class="sm:col-span-6">
                        <label for="steps" class="block text-sm font-medium text-gray-700">Steps</label>
                        <div class="mt-1 space-y-3">
                            {#each steps as step, i}
                                <div class="flex gap-2 items-start" transition:fade>
                                    <div class="flex-grow">
                                        <label for="step-{i}" class="block text-sm font-medium text-gray-700 mb-1">Step {i + 1}</label>
                                        <input
                                            type="text"
                                            id="step-{i}"
                                            bind:value={steps[i]}
                                            on:input={(e) => handleStepInput(i, e.target.value)}
                                            placeholder="Enter step instructions..."
                                            class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        />
                                    </div>
                                    {#if i > 0}
                                        <button
                                            type="button"
                                            class="mt-7 text-gray-400 hover:text-gray-500"
                                            on:click={() => {
                                                steps = steps.filter((_, index) => index !== i);
                                                showDoneButton = steps.some(step => step.trim() !== '');
                                            }}
                                        >
                                            <span class="sr-only">Remove step</span>
                                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    {/if}
                                </div>
                            {/each}
                            {#if showDoneButton}
                                <button
                                    type="button"
                                    on:click={finalizeSteps}
                                    class="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    Done Adding Steps
                                </button>
                            {/if}
                        </div>
                    </div>
                </div>

                <div class="sm:col-span-6">
                    <label class="block text-sm font-medium text-gray-700">Recommended Products</label>
                    <div class="mt-2">
                        <div class="flex gap-2 mb-2">
                            <input
                                type="text"
                                bind:value={newProduct}
                                placeholder="Enter product name"
                                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                            <button
                                type="button"
                                on:click={() => {
                                    if (newProduct.trim()) {
                                        recommendedProducts = [...recommendedProducts, newProduct.trim()];
                                        newProduct = '';
                                    }
                                }}
                                class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Add Product
                            </button>
                        </div>
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {#each recommendedProducts as product, i}
                                <div class="relative bg-gray-50 p-2 rounded-md border border-gray-200">
                                    <button
                                        type="button"
                                        class="absolute top-1 right-1 text-gray-400 hover:text-gray-500"
                                        on:click={() => {
                                            recommendedProducts = recommendedProducts.filter((_, index) => index !== i);
                                        }}
                                    >
                                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                    <p class="text-sm text-gray-900 pr-6">{product}</p>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>

                <div class="flex justify-end">
                    <button
                        type="submit"
                        class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Save Style Guide
                    </button>
                </div>
            </form>
        </div>
    {/if}

    {#if loading}
        <div class="mt-6 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
    {:else}
        <div class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {#each styleGuides as guide (guide.id)}
                <StyleGuideCard {guide} showDelete={true} onDelete={deleteStyleGuide} />
            {/each}
        </div>
    {/if}
</div>