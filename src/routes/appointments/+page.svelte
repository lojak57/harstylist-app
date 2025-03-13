<script lang="ts">
    import { supabase } from '$lib/supabase';
    import CommandInput from '$lib/components/CommandInput.svelte';
    import { onMount } from 'svelte';
    import { format } from 'date-fns';
    import type { Database } from '$lib/supabase';
    import Calendar from '$lib/components/Calendar.svelte';
    import { goto } from '$app/navigation';

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
        } catch (e: any) {
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
        } catch (e: any) {
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
        } catch (e: any) {
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
        } catch (e: any) {
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
        } catch (e: any) {
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

    function toggleService(serviceId: string) {
        if (selectedServices.includes(serviceId)) {
            selectedServices = selectedServices.filter(id => id !== serviceId);
        } else {
            selectedServices = [...selectedServices, serviceId];
        }
        calculateEndTime();
    }

    function handleAppointmentClick(event: CustomEvent<{id: string}>) {
        const appointmentId = event.detail.id;
        if (appointmentId) {
            goto(`/appointments/${appointmentId}`);
        }
    }
</script>

<div class="py-6 bg-gray-50 min-h-screen">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <CommandInput />
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 gap-4">
            <div>
                <h1 class="text-3xl font-bold text-gray-900">Appointments</h1>
                <p class="mt-1 text-sm text-gray-500">Manage your client appointments</p>
            </div>
            <div class="flex space-x-3">
                <button
                    on:click={() => showList = !showList}
                    class="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 {showList ? 'text-indigo-600' : 'text-gray-400'}">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3.5v16.5m0 0h10.5a2.25 2.25 0 0 0 2.25-2.25v-12a2.25 2.25 0 0 0-2.25-2.25H6.75" />
                    </svg>
                    {showList ? 'Show Calendar' : 'Show List'}
                </button>
                <a
                    href="/appointments/new"
                    class="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    New Appointment
                </a>
            </div>
        </div>

        {#if error}
            <div class="mt-4 rounded-md bg-red-50 p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-red-800">Error</h3>
                        <div class="mt-2 text-sm text-red-700">
                            <p>{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        {/if}

        {#if showForm}
            <div class="mt-6 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                <div class="px-4 py-6 sm:p-8">
                    <form on:submit|preventDefault={handleSubmit} class="space-y-6">
                        <div class="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                            <div>
                                <label for="client" class="block text-sm font-medium leading-6 text-gray-900">Client</label>
                                <div class="mt-2">
                                    <select
                                        id="client"
                                        name="client"
                                        class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        bind:value={selectedClientId}
                                    >
                                        <option value="">Select a client</option>
                                        {#each clients as client}
                                            <option value={client.id}>{client.name}</option>
                                        {/each}
                                    </select>
                                </div>
                            </div>
                        
                            <div class="col-span-full">
                                <fieldset>
                                    <legend class="text-sm font-medium leading-6 text-gray-900">Services</legend>
                                    <div class="mt-3 space-y-1">
                                        {#each availableServices as service}
                                            <button 
                                                type="button"
                                                class="text-left w-full relative flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150 cursor-pointer {selectedServices.includes(service.id) ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-200 ring-opacity-50' : ''}"
                                                on:click={() => toggleService(service.id)}
                                                aria-pressed={selectedServices.includes(service.id)}
                                            >
                                                <div class="min-w-0 flex-1 text-sm">
                                                    <span class="font-medium text-gray-700 select-none">{service.name}</span>
                                                    {#if service.description}
                                                        <p class="text-xs text-gray-500 mt-1">{service.description}</p>
                                                    {/if}
                                                </div>
                                                <div class="ml-3 flex items-center h-5">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedServices.includes(service.id)}
                                                        class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                                                        tabindex="-1"
                                                        aria-hidden="true"
                                                    />
                                                </div>
                                            </button>
                                        {/each}
                                    </div>
                                </fieldset>
                            </div>

                            <div>
                                <label for="start" class="block text-sm font-medium leading-6 text-gray-900">Start Time</label>
                                <div class="mt-2">
                                    <input 
                                        type="datetime-local" 
                                        id="start" 
                                        name="start" 
                                        required
                                        class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        bind:value={startTime}
                                    >
                                </div>
                            </div>
                            <div>
                                <label for="end" class="block text-sm font-medium leading-6 text-gray-900">End Time</label>
                                <div class="mt-2">
                                    <input 
                                        type="datetime-local" 
                                        id="end" 
                                        name="end" 
                                        required
                                        class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        bind:value={endTime}
                                    >
                                </div>
                            </div>
                            <div class="col-span-full">
                                <div>
                                    <label for="notes" class="block text-sm font-medium leading-6 text-gray-900">Notes</label>
                                    <div class="mt-2">
                                        <textarea
                                            id="notes"
                                            name="notes"
                                            rows="3"
                                            bind:value={notes}
                                            placeholder="Any notes about the appointment"
                                            class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center justify-end gap-x-4">
                            <button 
                                type="button"
                                on:click={() => showForm = false}
                                class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                disabled={loading}>
                                {loading ? 'Saving...' : 'Create Appointment'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        {/if}

        {#if !showList}
            <div class="mt-6 overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                <div class="px-4 py-5 sm:p-6">
                    <Calendar {appointments} on:appointmentClick={handleAppointmentClick} />                    
                </div>
            </div>
        {/if}

        {#if showList}
            <div class="mt-6 overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                <div class="px-4 py-5 sm:p-6">
                    {#if appointments.length === 0}
                        <div class="text-center py-12">
                            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <h3 class="mt-2 text-sm font-semibold text-gray-900">No appointments</h3>
                            <p class="mt-1 text-sm text-gray-500">Get started by creating a new appointment.</p>
                            <div class="mt-6">
                                <a 
                                    href="/appointments/new"
                                    class="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                >
                                    <svg class="-ml-0.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                                    </svg>
                                    New Appointment
                                </a>
                            </div>
                        </div>
                    {:else}
                        <div class="flow-root">
                            <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                                <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                                    <table class="min-w-full divide-y divide-gray-300">
                                        <thead>
                                            <tr>
                                                <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Client</th>
                                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Service</th>
                                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Start Time</th>
                                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">End Time</th>
                                                <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-0">
                                                    <span class="sr-only">Actions</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-gray-200">
                                            {#each appointments as appointment}
                                                <tr class="hover:bg-gray-50">
                                                    <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-0">
                                                        <div class="flex items-center">
                                                            <div class="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center">
                                                                <span class="text-indigo-700 font-medium text-xs">
                                                                    {appointment.client?.name ? appointment.client.name.split(' ').map(n => n[0]).join('').toUpperCase() : '??'}
                                                                </span>
                                                            </div>
                                                            <div class="ml-4">
                                                                <div class="font-medium text-gray-900">{appointment.client?.name || 'Unknown'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                        <div class="rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
                                                            {appointment.service_type || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                        {formatDateTime(appointment.start_time)}
                                                    </td>
                                                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                        {appointment.end_time ? formatDateTime(appointment.end_time) : 'N/A'}
                                                    </td>
                                                    <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                                        <div class="flex justify-end space-x-4">
                                                            <a
                                                                href="/appointments/{appointment.id}"
                                                                class="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                                </svg>
                                                                View
                                                            </a>
                                                            <button
                                                                type="button"
                                                                on:click={() => deleteAppointment(appointment.id)}
                                                                class="text-red-600 hover:text-red-900 flex items-center gap-1"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                                                    <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                                </svg>
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
</div>