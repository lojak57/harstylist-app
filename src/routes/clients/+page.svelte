<div class="bg-gray-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
        <!-- Header with search and filters -->
        <div class="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div class="flex-1 min-w-0">
                <SearchBar bind:value={searchQuery} placeholder="Search clients..." />
            </div>
            <div class="flex space-x-3">
                <SortSelect bind:value={sortBy} />
                <a
                    href="/clients/new"
                    class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    Add Client
                </a>
            </div>
        </div>

        {#if loading}
            <div class="flex justify-center items-center h-64">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        {:else if error}
            <div class="rounded-md bg-red-50 p-4 mb-4">
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
            <div class="text-center py-12 bg-white rounded-lg shadow">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
                <p class="mt-1 text-sm text-gray-500">Get started by adding your first client.</p>
                <div class="mt-6">
                    <a href="/clients/new" class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                        Add Client
                    </a>
                </div>
            </div>
        {:else}
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {#each filteredClients as client}
                    <div class="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
                        <div class="px-4 py-5 sm:px-6">
                            <div class="flex items-center">
                                <div class="flex-shrink-0 h-12 w-12">
                                    {#if client.avatar_url}
                                        <img class="h-12 w-12 rounded-full" src={client.avatar_url} alt="{client.name}" />
                                    {:else}
                                        <div class="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                                            <span class="text-xl font-medium text-indigo-600">{client.name[0]}</span>
                                        </div>
                                    {/if}
                                </div>
                                <div class="ml-4">
                                    <h3 class="text-lg font-medium text-gray-900 truncate">{client.name}</h3>
                                    <p class="text-sm text-gray-500">
                                        Last visit: {client.last_visit ? new Date(client.last_visit).toLocaleDateString() : 'Never'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="px-4 py-4 sm:px-6">
                            <div class="space-y-2">
                                {#if client.email}
                                    <p class="text-sm text-gray-600 flex items-center">
                                        <svg class="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                        </svg>
                                        {client.email}
                                    </p>
                                {/if}
                                {#if client.phone}
                                    <p class="text-sm text-gray-600 flex items-center">
                                        <svg class="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                        </svg>
                                        {client.phone}
                                    </p>
                                {/if}
                                {#if client.upcoming_appointment}
                                    <div class="text-sm text-gray-600 flex items-center">
                                        <svg class="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                                        </svg>
                                        Next appointment: {new Date(client.upcoming_appointment).toLocaleDateString()}
                                    </div>
                                {/if}
                                {#if client.style_guides && client.style_guides.length > 0}
                                    <div class="mt-2 flex flex-wrap gap-2">
                                        {#each client.style_guides as guide}
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                {guide.name}
                                            </span>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        </div>
                        <div class="px-4 py-4 sm:px-6 bg-gray-50">
                            <div class="flex justify-between space-x-3">
                                <div class="flex space-x-3">
                                    <a
                                        href="/clients/{client.id}"
                                        class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        View Profile
                                    </a>
                                    <button
                                        on:click={() => deleteClient(client.id)}
                                        class="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        Delete
                                    </button>
                                </div>
                                <a
                                    href="/appointments?client={client.id}"
                                    class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
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
    };

    let clients: Client[] = [];
    let filteredClients: Client[] = [];
    let loading = false;
    let error: string | null = null;
    let searchQuery = '';
    let sortBy = 'name';

    $: {
        filteredClients = clients.filter(client =>
            client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.phone?.includes(searchQuery)
        );

        filteredClients.sort((a, b) => {
            switch (sortBy) {
                case 'recent':
                    return (b.last_visit || '0') > (a.last_visit || '0') ? 1 : -1;
                case 'upcoming':
                    return (b.upcoming_appointment || '0') > (a.upcoming_appointment || '0') ? 1 : -1;
                default:
                    return a.name.localeCompare(b.name);
            }
        });
    }

    onMount(async () => {
        await loadClients();
    });

    async function loadClients() {
        try {
            loading = true;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data: clientsData, error: fetchError } = await supabase
                .from('clients')
                .select(`
                    *,
                    appointments!appointments_client_id_fkey (
                        start_time,
                        status
                    ),
                    style_guides:client_style_guides(style_guide:style_guides(id, name))
                `)
                .eq('stylist_id', user.id);

            if (fetchError) throw fetchError;

            clients = (clientsData || []).map(client => {
                const appointments = client.appointments || [];
                const futureAppointments = appointments
                    .filter(apt => new Date(apt.start_time) > new Date())
                    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
                
                const pastAppointments = appointments
                    .filter(apt => new Date(apt.start_time) <= new Date())
                    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

                return {
                    ...client,
                    upcoming_appointment: futureAppointments[0]?.start_time,
                    last_visit: pastAppointments[0]?.start_time
                };
            });
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }
    async function deleteClient(id: string) {
        try {
            loading = true;
            error = null;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error: deleteError } = await supabase
                .from('clients')
                .delete()
                .eq('id', id)
                .eq('stylist_id', user.id);

            if (deleteError) throw deleteError;
            await loadClients();
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }
</script>