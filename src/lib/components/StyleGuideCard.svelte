<script lang="ts">
    import { fade } from 'svelte/transition';
    
    type StyleGuide = {
        id: string;
        name: string;
        description: string;
        steps: string;
        recommended_products: string[];
        stylist_id?: string;
        created_at?: string;
        image_url?: string;
    };
    
    export let guide: StyleGuide;
    export let onDelete: (id: string) => void;
    export let compact = false;
</script>

<div class="bg-white overflow-hidden shadow-lg rounded-lg divide-y divide-gray-200 hover:shadow-xl transition-shadow duration-300" transition:fade>
    <div class="px-4 py-5 sm:px-6 bg-gradient-to-r from-indigo-50 to-white">
        <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900 hover:text-indigo-600 transition-colors duration-200">{guide.name}</h3>
            <button
                on:click={() => onDelete(guide.id)}
                class="text-gray-400 hover:text-red-500 transition-colors duration-200"
                aria-label="Delete style guide"
            >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>
        <p class="mt-2 text-sm text-gray-500">{guide.description}</p>
    </div>
    <div class="px-4 py-4 sm:px-6">
        {#if !compact}
            <div class="text-sm text-gray-700 space-y-3 whitespace-pre-line">
                {#each guide.steps.split('\n') as step}
                    <div class="flex items-start space-x-2 p-2 rounded-md hover:bg-gray-50 transition-colors duration-200">
                        <span class="font-bold text-indigo-600">{step.split(':')[0]}:</span>
                        <span class="text-gray-700">{step.split(':')[1]}</span>
                    </div>
                {/each}
            </div>
        {:else}
            <div class="text-sm text-gray-700 whitespace-pre-line">{guide.steps}</div>
        {/if}
        
        {#if guide.recommended_products && guide.recommended_products.length > 0}
            <div class="mt-4 border-t pt-4">
                <h4 class="text-sm font-medium text-gray-900 mb-2">Recommended Products</h4>
                <div class="grid grid-cols-2 gap-2">
                    {#each guide.recommended_products as product}
                        <div class="bg-indigo-50 p-2 rounded-md border border-indigo-100 hover:bg-indigo-100 transition-colors duration-200">
                            <p class="text-sm text-gray-900">{product}</p>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
</div>