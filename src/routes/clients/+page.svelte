<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    import type { Database } from '$lib/supabase';

    type Client = Database['public']['Tables']['clients']['Row'];
    type Service = {
        id: string;
        name: string;
        category: string;
        description: string;
        duration: string;
    };

    let clients: Client[] = [];
    let loading = false;
    let error: string | null = null;
    let allServices: Service[] = [];
    let selectedServices: string[] = [];

    // Form data
    let firstName = '';
    let lastName = '';
    let email = '';
    let phone = '';
    let notes = '';
    let selectedStyleGuide = '';
    let hair_type = '';
    let preferred_products = '';
    let showForm = false;

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

    // Products data
    const availableProducts = [
        {
            id: 'heat-protectant',
            name: 'Heat Protectant Spray',
            description: 'Shields hair from heat damage up to 450°F',
            link: 'https://example.com/heat-protectant'
        },
        {
            id: 'volumizing-mousse',
            name: 'Volumizing Mousse',
            description: 'Adds body and lift to fine hair',
            link: 'https://example.com/volumizing-mousse'
        },
        {
            id: 'curl-cream',
            name: 'Curl Defining Cream',
            description: 'Enhances natural curl pattern while reducing frizz',
            link: 'https://example.com/curl-cream'
        }
    ];

    let selectedProducts: string[] = [];

    onMount(async () => {
        await Promise.all([loadClients(), loadServices()]);
    });

    async function loadServices() {
        try {
            const { data, error: fetchError } = await supabase
                .from('services')
                .select('*')
                .order('name');

            if (fetchError) throw fetchError;
            allServices = data || [];
        } catch (e) {
            error = e.message;
        }
    }

    async function loadClients() {
        try {
            loading = true;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error: fetchError } = await supabase
                .from('clients')
                .select('*')
                .eq('stylist_id', user.id)
                .order('name');

            if (fetchError) throw fetchError;
            clients = data;
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

            const { data: clientData, error: insertError } = await supabase
                .from('clients')
                .insert([
                    {
                        stylist_id: user.id,
                        name: `${firstName} ${lastName}`.trim(),
                        email,
                        phone,
                        notes,
                        style_guide: selectedStyleGuide,
                        hair_type,
                        preferred_products: selectedProducts,
                        last_visit: new Date().toISOString()
                    }
                ])
                .select();

            if (insertError) throw insertError;

            if (clientData && clientData[0]) {
                // Insert client services
                const clientServices = selectedServices.map(serviceId => ({
                    client_id: clientData[0].id,
                    service_id: serviceId
                }));

                const { error: servicesError } = await supabase
                    .from('client_services')
                    .insert(clientServices);

                if (servicesError) throw servicesError;
            }

            // Reset form
            firstName = '';
            lastName = '';
            email = '';
            phone = '';
            notes = '';
            selectedStyleGuide = '';
            hair_type = '';
            selectedProducts = [];
            selectedServices = [];
            showForm = false;

            await loadClients();
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    async function deleteClient(id: string) {
        if (!confirm('Are you sure you want to delete this client?')) return;

        try {
            loading = true;
            error = null;

            const { error: deleteError } = await supabase
                .from('clients')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            await loadClients();
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }
</script>

<div class="py-6">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between">
            <h1 class="text-2xl font-semibold text-gray-900">Clients</h1>
            <button
                on:click={() => showForm = !showForm}
                class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                {showForm ? 'Cancel' : 'Add Client'}
            </button>
        </div>

        {#if error}
            <div class="mt-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>
        {/if}

        {#if showForm}
            <div class="mt-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                <form on:submit|preventDefault={handleSubmit} class="space-y-6">
                    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label for="firstName" class="block text-sm font-medium text-gray-700">First Name</label>
                            <input type="text" name="firstName" id="firstName" required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                bind:value={firstName} />
                        </div>

                        <div>
                            <label for="lastName" class="block text-sm font-medium text-gray-700">Last Name</label>
                            <input type="text" name="lastName" id="lastName" required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                bind:value={lastName} />
                        </div>

                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" name="email" id="email"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                bind:value={email} />
                        </div>

                        <div>
                            <label for="phone" class="block text-sm font-medium text-gray-700">Phone</label>
                            <input type="tel" name="phone" id="phone"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                bind:value={phone} />
                        </div>

                        <div class="sm:col-span-2">
                            <label for="notes" class="block text-sm font-medium text-gray-700">Notes</label>
                            <textarea name="notes" id="notes" rows="3"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                bind:value={notes}></textarea>
                        </div>

                        <div>
                            <label for="style-guide" class="block text-sm font-medium text-gray-700">Style Guide</label>
                            <select name="style-guide" id="style-guide"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                bind:value={selectedStyleGuide}>
                                <option value="">Select a style guide</option>
                                {#each styleGuides as guide}
                                    <option value={guide.id}>{guide.name}</option>
                                {/each}
                            </select>
                        </div>

                        <div>
                            <label for="hair-type" class="block text-sm font-medium text-gray-700">Hair Type</label>
                            <input type="text" name="hair-type" id="hair-type"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                bind:value={hair_type} />
                        </div>

                        <div class="sm:col-span-2">
                            <label class="block text-sm font-medium text-gray-700">Preferred Products</label>
                            <div class="mt-4 space-y-2">
                                {#each availableProducts as product}
                                    <label class="inline-flex items-center mr-4">
                                        <input
                                            type="checkbox"
                                            value={product.id}
                                            bind:group={selectedProducts}
                                            class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span class="ml-2 text-sm text-gray-700">{product.name}</span>
                                    </label>
                                {/each}
                            </div>
                        </div>

                        <div class="sm:col-span-2">
                            <label class="block text-sm font-medium text-gray-700">Available Services</label>
                            <div class="mt-4 space-y-2">
                                {#each allServices as service}
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
                    </div>

                    <div class="flex justify-end">
                        <button type="submit" disabled={loading}
                            class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50">
                            {loading ? 'Saving...' : 'Save Client'}
                        </button>
                    </div>
                </form>
            </div>
        {/if}

        <div class="mt-8">
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {#each clients as client}
                    <div class="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
                        <div class="px-6 py-5">
                            <div class="flex flex-col space-y-3">
                                <div class="flex justify-between items-start">
                                    <a href="/clients/{client.id}" class="text-xl font-semibold text-indigo-600 hover:text-indigo-900 truncate">
                                        {client.name}
                                    </a>
                                </div>
                                <div class="space-y-2">
                                    {#if client.email}
                                        <div class="flex items-center text-sm text-gray-600">
                                            <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            {client.email}
                                        </div>
                                    {/if}
                                    {#if client.phone}
                                        <div class="flex items-center text-sm text-gray-600">
                                            <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            {client.phone}
                                        </div>
                                    {/if}
                                    <div class="flex items-center text-sm text-gray-600">
                                        <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Last visit: {client.last_visit ? new Date(client.last_visit).toLocaleDateString() : 'Never'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>