<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import type { Database } from '$lib/supabase';

    type Service = {
        id: string;
        name: string;
        category: string;
        description: string;
        duration: string;
    };

    let allServices: Service[] = [];
    let selectedServices: string[] = [];
    let loading = false;
    let error: string | null = null;

    type Client = Database['public']['Tables']['clients']['Row'];
    type Appointment = Database['public']['Tables']['appointments']['Row'];

    let client: Client | null = null;
    let appointments: Appointment[] = [];

    onMount(async () => {
        await Promise.all([
            loadClient(),
            loadAppointments(),
            loadAllServices(),
            loadClientServices()
        ]);
    });

    async function loadClient() {
        try {
            loading = true;
            const { data, error: fetchError } = await supabase
                .from('clients')
                .select('*')
                .eq('id', $page.params.id)
                .single();

            if (fetchError) throw fetchError;
            client = data;
        } catch (e) {
            error = e.message;
            client = null;
        } finally {
            loading = false;
        }
    }

    async function loadAppointments() {
        if (!$page.params.id) return;

        try {
            const { data, error: fetchError } = await supabase
                .from('appointments')
                .select('*')
                .eq('client_id', $page.params.id)
                .order('start_time', { ascending: false });

            if (fetchError) throw fetchError;
            appointments = data || [];
        } catch (e) {
            error = e.message;
        }
    }

    async function loadAllServices() {
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

    async function loadClientServices() {
        if (!$page.params.id) return;

        try {
            const { data, error: fetchError } = await supabase
                .from('client_services')
                .select('service_id')
                .eq('client_id', $page.params.id);

            if (fetchError) throw fetchError;
            selectedServices = (data || []).map(cs => cs.service_id);
        } catch (e) {
            error = e.message;
        }
    }

    async function updateClientServices() {
        if (!client) return;

        try {
            loading = true;
            error = null;

            // Delete existing client services
            const { error: deleteError } = await supabase
                .from('client_services')
                .delete()
                .eq('client_id', client.id);

            if (deleteError) throw deleteError;

            // Insert new client services
            const clientServices = selectedServices.map(serviceId => ({
                client_id: client.id,
                service_id: serviceId
            }));

            const { error: insertError } = await supabase
                .from('client_services')
                .insert(clientServices);

            if (insertError) throw insertError;
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    function scheduleAppointment() {
        goto('/appointments?client=' + client?.id);
    }

    $: if (client) {
        updateClientServices();
    }
</script>

<div class="py-6">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {#if error}
            <div class="mt-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>
        {/if}

        {#if loading}
            <div class="text-center py-12">
                <p class="text-sm text-gray-500">Loading...</p>
            </div>
        {:else if client}
            <div class="md:flex md:items-center md:justify-between md:space-x-5">
                <div class="flex items-start space-x-5">
                    <div class="pt-1.5">
                        <h1 class="text-2xl font-bold text-gray-900">{client.name}</h1>
                        <p class="text-sm font-medium text-gray-500">
                            Last visit: {client.last_visit ? new Date(client.last_visit).toLocaleDateString() : 'Never'}
                        </p>
                    </div>
                </div>
                <div class="mt-6 flex flex-col-reverse justify-stretch space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-end sm:space-x-3 sm:space-y-0 sm:space-x-reverse md:mt-0 md:flex-row md:space-x-3">
                    <button
                        type="button"
                        on:click={scheduleAppointment}
                        class="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                        Schedule Appointment
                    </button>
                </div>
            </div>

            <div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <!-- Client Information -->
                <div class="bg-white shadow sm:rounded-lg">
                    <div class="px-4 py-5 sm:px-6">
                        <h2 class="text-lg font-medium leading-6 text-gray-900">Client Information</h2>
                    </div>
                    <div class="border-t border-gray-200 px-4 py-5 sm:px-6">
                        <dl class="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                            <div class="sm:col-span-1">
                                <dt class="text-sm font-medium text-gray-500">Email</dt>
                                <dd class="mt-1 text-sm text-gray-900">{client.email || 'Not provided'}</dd>
                            </div>
                            <div class="sm:col-span-1">
                                <dt class="text-sm font-medium text-gray-500">Phone</dt>
                                <dd class="mt-1 text-sm text-gray-900">{client.phone || 'Not provided'}</dd>
                            </div>
                            <div class="sm:col-span-2">
                                <dt class="text-sm font-medium text-gray-500">Notes</dt>
                                <dd class="mt-1 text-sm text-gray-900 whitespace-pre-line">{client.notes || 'No notes'}</dd>
                            </div>
                            <div class="sm:col-span-1">
                                <dt class="text-sm font-medium text-gray-500">Hair Type</dt>
                                <dd class="mt-1 text-sm text-gray-900">{client.hair_type || 'Not specified'}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                <!-- Recent Appointments -->
                <div class="lg:col-span-2">
                    <div class="bg-white shadow sm:rounded-lg">
                        <div class="px-4 py-5 sm:px-6">
                            <h2 class="text-lg font-medium leading-6 text-gray-900">Recent Appointments</h2>
                        </div>
                        <div class="border-t border-gray-200">
                            <ul role="list" class="divide-y divide-gray-200">
                                {#if appointments.length > 0}
                                    {#each appointments as appointment}
                                        <li class="px-4 py-4 sm:px-6">
                                            <div class="flex items-center justify-between">
                                                <p class="text-sm font-medium text-indigo-600 truncate">
                                                    {new Date(appointment.start_time).toLocaleDateString()}
                                                </p>
                                                <div class="ml-2 flex-shrink-0 flex">
                                                    <p class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        {appointment.status || 'Scheduled'}
                                                    </p>
                                                </div>
                                            </div>
                                        </li>
                                    {/each}
                                {:else}
                                    <li class="px-4 py-4 sm:px-6">
                                        <p class="text-sm text-gray-500 italic">No appointments found</p>
                                    </li>
                                {/if}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        {:else if !loading}
            <div class="text-center py-12">
                <p class="text-sm text-gray-500">Client not found</p>
            </div>
        {/if}
    </div>
</div>
<div class="mt-6">
    <h3 class="text-lg font-medium text-gray-900">Available Services</h3>
    <p class="mt-1 text-sm text-gray-500">Select which services are available for this client</p>
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