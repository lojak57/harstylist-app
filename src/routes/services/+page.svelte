<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    import type { Database } from '$lib/supabase';

    type Service = {
        id: string;
        name: string;
        category: string;
        description: string;
        duration: string;
        price: number;
    };

    let services: Service[] = [];
    let loading = false;
    let error: string | null = null;
    let showForm = false;

    // Form data for new service
    let newService = {
        name: '',
        category: 'both',
        description: '',
        duration: '',
        price: 0
    };

    onMount(async () => {
        await loadServices();
    });

    async function loadServices() {
        try {
            loading = true;
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                throw new Error('Authentication failed');
            }

            const { data, error: fetchError } = await supabase
                .from('services')
                .select('*')
                .eq('stylist_id', user.id)
                .order('name');

            if (fetchError) throw fetchError;
            services = data || [];
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    async function handleSubmit() {
        try {
            loading = true;
            error = null;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error: insertError } = await supabase
                .from('services')
                .insert([
                    {
                        name: newService.name,
                        category: newService.category,
                        description: newService.description,
                        duration: newService.duration,
                        price: newService.price,
                        stylist_id: user.id
                    }
                ]);

            if (insertError) throw insertError;

            // Reset form and reload services
            newService = {
                name: '',
                category: 'both',
                description: '',
                duration: '',
                price: 0
            };
            showForm = false;
            await loadServices();
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    async function deleteService(id: string) {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                throw new Error('Authentication failed');
            }

            const { error: deleteError } = await supabase
                .from('services')
                .delete()
                .eq('id', id)
                .eq('stylist_id', user.id);

            if (deleteError) throw deleteError;
            await loadServices();
        } catch (e) {
            error = e.message;
        }
    }
</script>

<div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
        <div class="flex justify-between items-center">
            <h1 class="text-2xl font-semibold text-gray-900">Services</h1>
            <button
                on:click={() => showForm = true}
                class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                Add Service
            </button>
        </div>

        {#if error}
            <div class="mt-4 bg-red-50 p-4 rounded-md">
                <p class="text-sm text-red-700">{error}</p>
            </div>
        {/if}

        {#if showForm}
            <div class="mt-6 bg-white shadow sm:rounded-lg">
                <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg font-medium leading-6 text-gray-900">New Service</h3>
                    <form class="mt-5 space-y-4" on:submit|preventDefault={handleSubmit}>
                        <div>
                            <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                id="name"
                                bind:value={newService.name}
                                required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label for="category" class="block text-sm font-medium text-gray-700">Category</label>
                            <select
                                id="category"
                                bind:value={newService.category}
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                                <option value="both">All Clients</option>
                                <option value="men">Men Only</option>
                                <option value="women">Women Only</option>
                            </select>
                        </div>

                        <div>
                            <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                id="description"
                                bind:value={newService.description}
                                rows="3"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            ></textarea>
                        </div>

                        <div>
                            <label for="duration" class="block text-sm font-medium text-gray-700">Duration</label>
                            <select
                                id="duration"
                                bind:value={newService.duration}
                                required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                                <option value="">Select duration</option>
                                {#each Array.from({length: 24}, (_, i) => (i + 2) * 15) as minutes}
                                    <option value={`${Math.floor(minutes / 60)} hour${Math.floor(minutes / 60) !== 1 ? 's' : ''} ${minutes % 60 ? `${minutes % 60} minutes` : ''}`?.trim()}>
                                        {Math.floor(minutes / 60) > 0 ? `${Math.floor(minutes / 60)} hour${Math.floor(minutes / 60) !== 1 ? 's' : ''}` : ''} 
                                        {minutes % 60 ? `${minutes % 60} minutes` : ''}
                                    </option>
                                {/each}
                            </select>
                        </div>

                        <div>
                            <label for="price" class="block text-sm font-medium text-gray-700">Price</label>
                            <div class="mt-1 flex items-center space-x-2">
                                <div class="relative rounded-md shadow-sm w-32">
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span class="text-gray-500 sm:text-sm">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        id="price"
                                        bind:value={newService.price}
                                        min="0"
                                        step="0.01"
                                        required
                                        class="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div class="flex items-center space-x-1">
                                    <button
                                        type="button"
                                        on:click={() => newService.price = Math.max(0, newService.price - 1)}
                                        class="inline-flex items-center p-1 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        on:click={() => newService.price = newService.price + 1}
                                        class="inline-flex items-center p-1 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>
                                <select
                                    on:change={(e) => newService.price = parseInt(e.target.value)}
                                    class="w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                >
                                    <option value="">Preset</option>
                                    {#each Array.from({length: 10}, (_, i) => 20 + i * 10) as price}
                                        <option value={price}>${price}</option>
                                    {/each}
                                </select>
                            </div>
                        </div>

                        <div class="flex justify-end space-x-3">
                            <button
                                type="button"
                                on:click={() => showForm = false}
                                class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        {/if}

        {#if loading}
            <div class="mt-6 text-center">
                <p class="text-sm text-gray-500">Loading services...</p>
            </div>
        {:else}
            <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {#each services as service}
                    <div class="bg-white overflow-hidden shadow rounded-lg max-w-sm">
                        <div class="px-3 py-4">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <h3 class="text-xl font-semibold text-gray-900 truncate">{service.name}</h3>
                                    <p class="mt-1 text-sm text-gray-500 line-clamp-2">{service.description}</p>
                                </div>
                                <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                    {service.category === 'both' ? 'bg-green-100 text-green-800' :
                                    service.category === 'men' ? 'bg-blue-100 text-blue-800' :
                                    'bg-purple-100 text-purple-800'}"
                                >
                                    {service.category === 'both' ? 'All' :
                                    service.category === 'men' ? 'Men' : 'Women'}
                                </span>
                            </div>
                            <div class="mt-3 flex justify-between items-center text-sm">
                                <div class="text-gray-500 truncate">
                                    <span class="font-medium">Duration:</span> {service.duration}
                                </div>
                                <div class="text-lg font-bold text-gray-900 ml-2">
                                    ${service.price}
                                </div>
                            </div>
                            <div class="mt-3 flex justify-end">
                                <button
                                    on:click={() => deleteService(service.id)}
                                    class="text-sm text-red-600 hover:text-red-900"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>