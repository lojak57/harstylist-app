<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import CommandInput from '$lib/components/CommandInput.svelte';
    import { getCategoryColor } from '$lib/utils/categoryColors';

    type Service = {
        id: string;
        name: string;
        price: number;
        duration: string;
        category: string;
        description?: string;
        stylist_id: string;
        created_at: string;
    };

    let services: Service[] = [];
    let error: string | null = null;
    let loading = true;

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
        if (!confirm('Are you sure you want to delete this service?')) return;

        try {
            const { error: err } = await supabase
                .from('services')
                .delete()
                .eq('id', id);

            if (err) throw err;
            await loadServices();
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
                <h1 class="text-2xl font-bold text-indigo-800">Your Services</h1>
                <a
                    href="/services/new"
                    class="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add Service
                </a>
            </div>
            <p class="mt-2 text-sm text-indigo-600">Create and manage your service offerings</p>
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
        {:else if services.length === 0}
            <div in:fade={{ duration: 250 }} class="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">No services</h3>
                <p class="mt-1 text-sm text-gray-500">Get started by creating a new service.</p>
                <div class="mt-6">
                    <a href="/services/new" class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                        <svg class="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                        </svg>
                        Add Service
                    </a>
                </div>
            </div>
        {:else}
            <div in:fade={{ duration: 250 }} class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {#each services as service (service.id)}
                    <div class="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200">
                        <div class="px-4 py-5 sm:p-6">
                            <div class="flex justify-between items-center">
                                <div>
                                    <span class="px-2.5 py-0.5 rounded-full text-xs font-medium" style="background-color: {getCategoryColor(service.category).bgColor}; color: {getCategoryColor(service.category).textColor}">
                                        {service.category}
                                    </span>
                                </div>
                                <div class="text-lg font-medium text-gray-900">
                                    ${service.price.toFixed(2)}
                                </div>
                            </div>
                            <div class="mt-2">
                                <h3 class="text-xl font-semibold text-gray-900">{service.name}</h3>
                                {#if service.description}
                                    <p class="mt-1 text-sm text-gray-500 line-clamp-2">{service.description}</p>
                                {/if}
                            </div>
                            <div class="mt-4 flex items-center text-sm text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{service.duration}</span>
                            </div>
                            <div class="mt-6 pt-3 border-t border-gray-200 flex justify-end space-x-3">
                                <button
                                    on:click={() => goto(`/services/edit/${service.id}`)}
                                    class="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                    </svg>
                                    Edit
                                </button>
                                <button
                                    on:click={() => deleteService(service.id)}
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
                {/each}
            </div>
        {/if}
    </div>
</div>