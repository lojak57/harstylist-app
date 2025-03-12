<script lang="ts">
    import { fade } from 'svelte/transition';
    
    export let service = {
        name: '',
        price: 0,
        duration: '',
        description: ''
    };
    export let showDelete = false;
    export let onDelete = () => {};
</script>

<div class="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300" transition:fade>
    <div class="px-4 py-4 sm:px-6 bg-gradient-to-r from-indigo-50 to-white">
        <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900 hover:text-indigo-600 transition-colors duration-200">{service.name}</h3>
            {#if showDelete}
                <button
                    on:click={() => onDelete(service.name)}
                    class="text-gray-400 hover:text-red-500 transition-colors duration-200">
                    <span class="sr-only">Delete</span>
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            {/if}
        </div>
        {#if service.description}
            <p class="mt-1 text-sm text-gray-500">{service.description}</p>
        {/if}
    </div>
    <div class="px-4 py-3 sm:px-6 flex justify-between items-center bg-white">
        <div class="flex items-center space-x-2">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {service.duration}
            </span>
        </div>
        <div class="text-lg font-semibold text-gray-900">${service.price}</div>
    </div>
</div>