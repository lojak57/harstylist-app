<div class="min-h-full bg-gray-50">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Header with Gradient Background -->
        <div class="bg-gradient-to-r from-indigo-100 to-purple-100 backdrop-blur-sm rounded-xl mb-8 p-6 shadow-lg border border-indigo-200">
            <div class="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <h1 class="text-2xl font-bold text-indigo-800">Your Clients</h1>
                <a
                    href="/clients/new"
                    class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
                    </svg>
                    Add Client
                </a>
            </div>
            <div class="mt-6 sm:flex sm:items-center sm:justify-between gap-4">
                <div class="flex-1 min-w-0">
                    <SearchBar bind:value={searchQuery} placeholder="Search clients..." />
                </div>
                <div class="mt-4 sm:mt-0">
                    <SortSelect bind:value={sortBy} />
                </div>
            </div>
        </div>

        {#if loading}
            <div class="flex justify-center items-center h-64">
                <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-500"></div>
            </div>
        {:else if error}
            <div class="rounded-md bg-red-50 p-4 mb-4 shadow-sm">
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
        {:else if filteredClients.length === 0}
            <div class="text-center py-12 bg-white rounded-2xl shadow-md">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
                <p class="mt-1 text-sm text-gray-500">
                    {searchQuery ? 'Try a different search term or' : 'Get started by'} adding a new client.
                </p>
                <div class="mt-6">
                    <a
                        href="/clients/new"
                        class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
                        </svg>
                        Add Client
                    </a>
                </div>
            </div>
        {:else}
            <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {#each filteredClients as client}
                    <div class="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100 transform transition duration-200 hover:shadow-xl hover:-translate-y-1">
                        <!-- Client header with gradient background -->
                        <div class="bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-4">
                            <div class="flex items-center">
                                <div class="flex-shrink-0 h-14 w-14">
                                    {#if client.avatar_url}
                                        <img class="h-14 w-14 rounded-full border-2 border-white shadow" src={client.avatar_url} alt="{client.name}" />
                                    {:else}
                                        <div class="h-14 w-14 rounded-full bg-white flex items-center justify-center shadow">
                                            <span class="text-xl font-bold text-indigo-600">{client.name ? client.name[0].toUpperCase() : '?'}</span>
                                        </div>
                                    {/if}
                                </div>
                                <div class="ml-4">
                                    <h3 class="text-lg font-bold text-white truncate">{client.name}</h3>
                                    <p class="text-sm text-indigo-100">
                                        {client.last_visit ? `Last visit: ${new Date(client.last_visit).toLocaleDateString()}` : 'No previous visits'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Client contact info -->
                        <div class="p-5">
                            <div class="space-y-3">
                                {#if client.email}
                                    <p class="text-sm text-gray-600 flex items-center">
                                        <svg class="flex-shrink-0 mr-2 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                        </svg>
                                        <span class="truncate">{client.email}</span>
                                    </p>
                                {/if}
                                {#if client.phone}
                                    <p class="text-sm text-gray-600 flex items-center">
                                        <svg class="flex-shrink-0 mr-2 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                        </svg>
                                        {client.phone}
                                    </p>
                                {/if}
                                {#if client.upcoming_appointment}
                                    <div class="text-sm text-gray-600 flex items-center">
                                        <svg class="flex-shrink-0 mr-2 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                                        </svg>
                                        <span>Next appointment: {new Date(client.upcoming_appointment).toLocaleDateString()}</span>
                                    </div>
                                {/if}
                                {#if client.style_guides && client.style_guides.length > 0}
                                    <div class="mt-3 flex flex-wrap gap-2">
                                        {#each client.style_guides as guide}
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                {guide.name}
                                            </span>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        </div>
                        
                        <!-- Client actions -->
                        <div class="px-5 py-4 bg-gray-50 border-t border-gray-100">
                            <div class="flex flex-wrap items-center justify-between gap-3">
                                <div class="flex flex-wrap gap-2">
                                    <a
                                        href="/clients/{client.id}"
                                        class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 ease-in-out shadow-sm"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        View Profile
                                    </a>
                                    <button
                                        on:click={() => deleteClient(client.id)}
                                        class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-red-600 bg-white border border-red-200 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-200 ease-in-out shadow-sm"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete
                                    </button>
                                </div>
                                <a
                                    href="/appointments?client={client.id}"
                                    class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-200 ease-in-out shadow-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Schedule
                                </a>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>
<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    import type { Database } from '$lib/supabase';
    import SearchBar from '$lib/components/SearchBar.svelte';
    import SortSelect from '$lib/components/SortSelect.svelte';

    type Client = Database['public']['Tables']['clients']['Row'] & {
        upcoming_appointment?: string;
        last_visit?: string;
        avatar_url?: string;
        style_guides?: Array<{id: string, name: string}>;
    };

    let clients: Client[] = [];
    let loading = true;
    let error: string | null = null;
    let searchQuery = '';
    let sortBy = 'name';

    $: filteredClients = clients
        .filter(client => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return (
                client.name?.toLowerCase().includes(query) ||
                client.email?.toLowerCase().includes(query) ||
                client.phone?.toLowerCase().includes(query)
            );
        })
        .sort((a, b) => {
            if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            } else if (sortBy === 'recent') {
                const dateA = a.last_visit ? new Date(a.last_visit).getTime() : 0;
                const dateB = b.last_visit ? new Date(b.last_visit).getTime() : 0;
                return dateB - dateA; // Most recent first
            } else if (sortBy === 'upcoming') {
                const dateA = a.upcoming_appointment ? new Date(a.upcoming_appointment).getTime() : Infinity;
                const dateB = b.upcoming_appointment ? new Date(b.upcoming_appointment).getTime() : Infinity;
                return dateA - dateB; // Soonest first
            }
            return 0;
        });

    onMount(async () => {
        await loadClients();
    });

    async function loadClients() {
        try {
            loading = true;

            // Get the current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                error = "You must be logged in to view clients";
                return;
            }

            // First, get all clients for the current stylist
            const { data: clientsData, error: clientsError } = await supabase
                .from('clients')
                .select('*, style_guides(id, name)')
                .eq('stylist_id', user.id);

            if (clientsError) throw clientsError;

            // Then, get the most recent appointment for each client
            const { data: appointmentsData, error: appointmentsError } = await supabase
                .from('appointments')
                .select('id, client_id, start_time, status')
                .gt('start_time', new Date().toISOString())
                .order('start_time', { ascending: true });

            if (appointmentsError) throw appointmentsError;

            // Map of client_id to their next appointment
            const upcomingAppointments: {[key: string]: string} = {};
            appointmentsData?.forEach(appointment => {
                if (!upcomingAppointments[appointment.client_id]) {
                    upcomingAppointments[appointment.client_id] = appointment.start_time;
                }
            });

            // Get past appointments for last visit date
            const { data: pastAppointmentsData, error: pastAppointmentsError } = await supabase
                .from('appointments')
                .select('id, client_id, start_time, status')
                .lt('start_time', new Date().toISOString())
                .order('start_time', { ascending: false });

            if (pastAppointmentsError) throw pastAppointmentsError;

            // Map of client_id to their last appointment
            const lastVisits: {[key: string]: string} = {};
            pastAppointmentsData?.forEach(appointment => {
                if (!lastVisits[appointment.client_id]) {
                    lastVisits[appointment.client_id] = appointment.start_time;
                }
            });

            // Combine the data
            clients = clientsData?.map(client => ({
                ...client,
                upcoming_appointment: upcomingAppointments[client.id],
                last_visit: lastVisits[client.id]
            })) || [];

        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    async function deleteClient(id: string) {
        if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
            return;
        }

        try {
            loading = true;

            // Delete the client
            const { error: deleteError } = await supabase
                .from('clients')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            // Refresh the clients list
            clients = clients.filter(client => client.id !== id);

        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }
</script>