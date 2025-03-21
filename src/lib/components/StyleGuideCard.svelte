<script lang="ts">
    import { fade } from 'svelte/transition';
    import { goto } from '$app/navigation';
    
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
    
    // Convert steps to array if it's a string
    let stepsArray: string[] = [];
    $: {
        try {
            if (typeof guide.steps === 'string') {
                stepsArray = guide.steps.split('\n').filter(step => step.trim().length > 0);
            }
        } catch (e) {
            stepsArray = [];
        }
    }
</script>

<div class="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200" in:fade={{ duration: 250 }}>
    <div class="px-4 py-5 sm:p-6">
        <div class="flex justify-between items-start">
            <div class="flex-1">
                <h3 class="text-xl font-semibold text-gray-900 truncate">{guide.name}</h3>
                <p class="mt-1 text-sm text-gray-500 line-clamp-2">{guide.description}</p>
            </div>
            
            {#if guide.image_url}
                <div class="ml-4 flex-shrink-0 h-16 w-16 rounded-md overflow-hidden bg-gray-100">
                    <img src={guide.image_url} alt={guide.name} class="h-full w-full object-cover" />
                </div>
            {/if}
        </div>
        
        {#if !compact && stepsArray.length > 0}
            <div class="mt-4 text-sm text-gray-700">
                <h4 class="font-medium text-gray-900 mb-2">Steps:</h4>
                <ul class="space-y-1">
                    {#each stepsArray.slice(0, 3) as step, i}
                        <li class="flex items-start space-x-2 rounded-md">
                            <span class="text-indigo-600 font-medium">{i + 1}.</span>
                            <span class="text-gray-700 line-clamp-1">{step}</span>
                        </li>
                    {/each}
                    {#if stepsArray.length > 3}
                        <li class="text-sm text-indigo-600 font-medium">+{stepsArray.length - 3} more steps</li>
                    {/if}
                </ul>
            </div>
        {/if}
        
        {#if guide.recommended_products && guide.recommended_products.length > 0}
            <div class="mt-4 text-sm">
                <h4 class="font-medium text-gray-900 mb-2">Recommended Products:</h4>
                <div class="flex flex-wrap gap-2">
                    {#each guide.recommended_products.slice(0, 3) as product}
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {product}
                        </span>
                    {/each}
                    {#if guide.recommended_products.length > 3}
                        <span class="text-xs text-indigo-600 font-medium">+{guide.recommended_products.length - 3} more</span>
                    {/if}
                </div>
            </div>
        {/if}
        
        <div class="mt-4 pt-3 border-t border-gray-200 flex justify-end space-x-3">
            <button
                on:click={() => goto(`/style-guides/${guide.id}`)}
                class="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                View
            </button>
            <button
                on:click={() => goto(`/style-guides/edit/${guide.id}`)}
                class="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Edit
            </button>
            <button
                on:click={() => onDelete(guide.id)}
                class="text-sm font-medium text-red-600 hover:text-red-500 flex items-center"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                Delete
            </button>
        </div>
    </div>
</div>