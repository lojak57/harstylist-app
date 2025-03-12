<script lang="ts">
    import { supabase } from '$lib/supabase';
    import CommandInput from '$lib/components/CommandInput.svelte';
    import { onMount } from 'svelte';
    import { format } from 'date-fns';
    import type { Database } from '$lib/supabase';
    import Calendar from '$lib/components/Calendar.svelte';

    type Appointment = Database['public']['Tables']['appointments']['Row'];
    type Client = Database['public']['Tables']['clients']['Row'];
    type Service = {
        id: string;
        name: string;
        category: string;
        description: string;
        duration: string;
    };

    let appointments: (Appointment & { client: Client })[] = [];
    let clients: Client[] = [];
    let availableServices: Service[] = [];
    let selectedServices: string[] = [];
    let loading = false;
    let error: string | null = null;

    // Form data
    let selectedClientId = '';
    let startTime = '';
    let endTime = '';
    let notes = '';
    let showForm = false;
    let showList = true;

    onMount(async () => {
        await Promise.all([loadAppointments(), loadClients()]);
        
        // Sort appointments by start time
        appointments = appointments.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        
        // Check for client parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        const clientId = urlParams.get('client');
        if (clientId) {
            selectedClientId = clientId;
            showForm = true;
            await loadClientServices(clientId);
        }
    });

    async function loadClientServices(clientId: string) {
        try {
            const { data, error: fetchError } = await supabase
                .from('services')
                .select('*, client_services!inner(*)')
                .eq('client_services.client_id', clientId);

            if (fetchError) throw fetchError;
            availableServices = data || [];
            selectedServices = [];
        } catch (e) {
            error = e.message;
        }
    }

    async function loadClients() {
        try {
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
        }
    }

    async function loadAppointments() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error: fetchError } = await supabase
                .from('appointments')
                .select(`
                    *,
                    client:clients(*)
                `)
                .eq('stylist_id', user.id)
                .order('start_time');

            if (fetchError) throw fetchError;
            appointments = data;
        } catch (e) {
            error = e.message;
        }
    }

    async function handleSubmit(event: Event) {
        event.preventDefault();
        try {
            loading = true;
            error = null;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Create an appointment for each selected service
            for (const serviceId of selectedServices) {
                const service = availableServices.find(s => s.id === serviceId);
                const { error: insertError } = await supabase
                    .from('appointments')
                    .insert({
                        stylist_id: user.id,
                        client_id: selectedClientId,
                        start_time: startTime,
                        end_time: endTime,
                        service_type: service?.name || '',
                        notes: notes
                    });

                if (insertError) throw insertError;
            }

            // Reset form
            selectedClientId = '';
            startTime = '';
            endTime = '';
            selectedServices = [];
            notes = '';
            showForm = false;

            await loadAppointments();
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    async function deleteAppointment(id: string) {
        try {
            loading = true;
            error = null;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error: deleteError } = await supabase
                .from('appointments')
                .delete()
                .eq('id', id)
                .eq('stylist_id', user.id);

            if (deleteError) throw deleteError;

            await loadAppointments();
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    function formatDateTime(dateStr: string) {
        return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
    }
    $: if (selectedClientId) {
        loadClientServices(selectedClientId);
    }
    function parseDuration(durationStr: string): number {
        let totalMinutes = 0;
        const hourMatch = durationStr.match(/(\d+)\s*hour/i);
        const minuteMatch = durationStr.match(/(\d+)\s*minute/i);
        
        if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
        if (minuteMatch) totalMinutes += parseInt(minuteMatch[1]);
        
        return totalMinutes;
    }
    
    function calculateEndTime() {
        if (!startTime || selectedServices.length === 0) {
            endTime = '';
            return;
        }
    
        let totalMinutes = 0;
        selectedServices.forEach(serviceId => {
            const service = availableServices.find(s => s.id === serviceId);
            if (service) {
                totalMinutes += parseDuration(service.duration);
            }
        });
    
        const startDate = new Date(startTime);
        const endDate = new Date(startDate.getTime() + totalMinutes * 60000);
        endTime = endDate.toISOString().slice(0, 16);
    }
    
    $: if (startTime || selectedServices) {
        calculateEndTime();
    }
</script>

<div class="py-6">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <CommandInput />
        <div class="flex justify-between mt-6">
            <h1 class="text-2xl font-semibold text-gray-900">Appointments</h1>
            <div class="space-x-4">
                <button
                    on:click={() => showList = !showList}
                    class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    {showList ? 'Show Calendar' : 'Show List'}
                </button>
                <button
                    on:click={() => showForm = !showForm}
                    class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    {showForm ? 'Cancel' : 'Add Appointment'}
                </button>
            </div>
        </div>

        {#if error}
            <div class="mt-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>
        {/if}

        {#if showForm}
            <div class="mt-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                <form on:submit|preventDefault={handleSubmit} class="space-y-6">
                    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label for="client" class="block text-sm font-medium text-gray-700">Client</label>
                            <select id="client" name="client" required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                bind:value={selectedClientId}>
                                <option value="">Select a client</option>
                                {#each clients as client}
                                    <option value={client.id} selected={client.id === selectedClientId}>{client.name}</option>
                                {/each}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Services</label>
                            <div class="mt-1 space-y-2">
                                {#each availableServices as service}
                                    <label class="inline-flex items-center">
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
                        <div>
                            <label for="start" class="block text-sm font-medium text-gray-700">Start Time</label>
                            <input type="datetime-local" id="start" name="start" required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                bind:value={startTime}>
                        </div>
                        <div>
                            <label for="end" class="block text-sm font-medium text-gray-700">End Time</label>
                            <input type="datetime-local" id="end" name="end" required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                bind:value={endTime}>
                        </div>
                        <div class="sm:col-span-2">
                            <label for="notes" class="block text-sm font-medium text-gray-700">Notes</label>
                            <textarea id="notes" name="notes" rows="3"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                bind:value={notes}></textarea>
                        </div>
                    </div>
                    <div class="flex justify-end">
                        <button type="submit"
                            class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            disabled={loading}>
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        {/if}

        {#if showList}
            <div class="mt-6">
                <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <table class="min-w-full divide-y divide-gray-300">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Client</th>
                                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Service</th>
                                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Start Time</th>
                                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">End Time</th>
                                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Notes</th>
                                    <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                        <span class="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200 bg-white">
                                {#each appointments as appointment}
                                    <div class="bg-white shadow overflow-hidden sm:rounded-lg mb-4">
                                        <div class="px-4 py-5 sm:px-6 flex justify-between items-center">
                                            <div>
                                                <h3 class="text-lg leading-6 font-medium text-gray-900">
                                                    {appointment.client.name}
                                                </h3>
                                                <p class="mt-1 max-w-2xl text-sm text-gray-500">
                                                    {formatDateTime(appointment.start_time)}
                                                </p>
                                            </div>
                                            <div class="flex space-x-3">
                                                <a
                                                    href="/appointments/{appointment.id}"
                                                    class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                >
                                                    View Details
                                                </a>
                                                <button
                                                    on:click={() => deleteAppointment(appointment.id)}
                                                    class="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        {:else}
            <div class="mt-6">
                <Calendar {appointments} />
            </div>
        {/if}
    </div>
</div>