<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
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
        } catch (err: any) {
            error = err.message;
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
        } catch (err: any) {
            error = err.message;
        }
    }
</script>

<div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
        <div class="flex justify-between items-center">
            <h1 class="text-2xl font-semibold text-gray-900">Services</h1>
            <button
                on:click={() => goto('/services/new')}
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