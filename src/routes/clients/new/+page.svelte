<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import type { Database } from '$lib/supabase';

    let availableServices = [];
    let loading = false;
    let error: string | null = null;

    // Form data
    let clientName = '';
    let clientEmail = '';
    let phone = '';
    let notes = '';
    let hair_type = '';
    let preferred_products = '';
    let selectedServices: string[] = [];
    let selectedStyleGuide = '';

    // Style guides data
    const styleGuides = [
        {
            id: 'blowout',
            name: 'Perfect Blowout',
            description: 'Step-by-step guide for achieving a salon-quality blowout at home'
        },
        {
            id: 'curl-care',
            name: 'Curl Care Routine',
            description: 'Comprehensive guide for maintaining and styling curly hair'
        },
        {
            id: 'color-care',
            name: 'Color Protection',
            description: 'Guide for maintaining color-treated hair'
        }
    ];

    async function loadServices() {
        const { data, error } = await supabase.from('services').select('id, name');
        if (error) {
            console.error('Error fetching services:', error);
        } else {
            availableServices = data;
        }
    }

    async function handleSubmit() {
        loading = true;
        error = null;

        try {
            // Step 1: Create the client
            const clientData = {
                name: clientName,
                email: clientEmail,
                phone,
                notes,
                hair_type,
                preferred_products,
                style_guide: selectedStyleGuide
            };

            const { data: client, error: clientError } = await supabase
                .from('clients')
                .insert([clientData])
                .select()
                .single();

            if (clientError) throw clientError;

            // Step 2: Link selected services to the client
            if (selectedServices.length > 0) {
                const clientServices = selectedServices.map(serviceId => ({
                    client_id: client.id,
                    service_id: serviceId
                }));

                const { error: servicesError } = await supabase
                    .from('client_services')
                    .insert(clientServices);

                if (servicesError) throw servicesError;
            }

            // Redirect to the client's page
            goto(`/clients/${client.id}`);
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    onMount(loadServices);
</script>

<div class="py-6">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 class="text-2xl font-semibold text-gray-900">New Client</h1>

        {#if error}
            <div class="mt-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>
        {/if}

        <form on:submit|preventDefault={handleSubmit} class="mt-6 space-y-6">
            <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div class="sm:col-span-3">
                    <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
                    <div class="mt-1">
                        <input
                            type="text"
                            name="name"
                            id="name"
                            bind:value={clientName}
                            required
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div class="sm:col-span-3">
                    <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                    <div class="mt-1">
                        <input
                            type="email"
                            name="email"
                            id="email"
                            bind:value={clientEmail}
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div class="sm:col-span-3">
                    <label for="phone" class="block text-sm font-medium text-gray-700">Phone</label>
                    <div class="mt-1">
                        <input
                            type="tel"
                            name="phone"
                            id="phone"
                            bind:value={phone}
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div class="sm:col-span-3">
                    <label for="hair_type" class="block text-sm font-medium text-gray-700">Hair Type</label>
                    <div class="mt-1">
                        <input
                            type="text"
                            name="hair_type"
                            id="hair_type"
                            bind:value={hair_type}
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div class="sm:col-span-6">
                    <label for="services" class="block text-sm font-medium text-gray-700">Services</label>
                    <div class="mt-4 space-y-2">
                        {#each availableServices as service}
                            <label class="inline-flex items-center mr-4">
                                <input
                                    type="checkbox"
                                    value={service.id}
                                    bind:group={selectedServices}
                                    class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span class="ml-2 text-sm text-gray-700">{service.name}</span>
                            </label>
                        {/each}
                    </div>
                </div>

                <div class="sm:col-span-6">
                    <label for="style_guide" class="block text-sm font-medium text-gray-700">Style Guide</label>
                    <div class="mt-1">
                        <select
                            id="style_guide"
                            name="style_guide"
                            bind:value={selectedStyleGuide}
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                            <option value="">Select a style guide</option>
                            {#each styleGuides as guide}
                                <option value={guide.id}>{guide.name}</option>
                            {/each}
                        </select>
                    </div>
                </div>

                <div class="sm:col-span-6">
                    <label for="preferred_products" class="block text-sm font-medium text-gray-700">Preferred Products</label>
                    <div class="mt-1">
                        <textarea
                            id="preferred_products"
                            name="preferred_products"
                            rows="3"
                            bind:value={preferred_products}
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        ></textarea>
                    </div>
                </div>

                <div class="sm:col-span-6">
                    <label for="notes" class="block text-sm font-medium text-gray-700">Notes</label>
                    <div class="mt-1">
                        <textarea
                            id="notes"
                            name="notes"
                            rows="3"
                            bind:value={notes}
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        ></textarea>
                    </div>
                </div>
            </div>

            <div class="flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    class="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save Client'}
                </button>
            </div>
        </form>
    </div>
</div>