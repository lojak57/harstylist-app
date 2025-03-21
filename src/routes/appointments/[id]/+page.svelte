<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { format } from 'date-fns';
    import type { Database } from '$lib/supabase';

    type Appointment = Database['public']['Tables']['appointments']['Row'];
    type Client = Database['public']['Tables']['clients']['Row'];

    let appointment: (Appointment & { client: Client }) | null = null;
    let loading = false;
    let error: string | null = null;
    let confirmDelete = false;

    onMount(async () => {
        await loadAppointment();
    });

    async function loadAppointment() {
        try {
            loading = true;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error: fetchError } = await supabase
                .from('appointments')
                .select(`
                    *,
                    client:clients(*)
                `)
                .eq('id', $page.params.id)
                .single();

            if (fetchError) throw fetchError;
            appointment = data;
        } catch (e: any) {
            error = e.message || 'An error occurred while loading the appointment';
        } finally {
            loading = false;
        }
    }

    async function deleteAppointment() {
        if (!confirmDelete) {
            confirmDelete = true;
            return;
        }
        try {
            loading = true;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');
            
            const { error: deleteError } = await supabase
                .from('appointments')
                .delete()
                .eq('id', $page.params.id);
                
            if (deleteError) throw deleteError;
            goto('/appointments');
        } catch (e: any) {
            error = e.message || 'An error occurred while deleting the appointment';
        } finally {
            loading = false;
        }
    }

    function formatDateTime(dateStr: string) {
        return format(new Date(dateStr), 'PPPP p');
    }

    function formatDate(dateStr: string) {
        return format(new Date(dateStr), 'PPPP');
    }
    
    function formatTime(dateStr: string) {
        return format(new Date(dateStr), 'p');
    }

    function viewClient(clientId: string) {
        goto(`/clients/${clientId}`);
    }
</script>

<div class="min-h-full bg-gray-50">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {#if error}
            <div class="mb-6 p-4 text-sm text-red-700 bg-red-100 rounded-lg shadow-sm">{error}</div>
        {/if}

        {#if loading}
            <div class="flex justify-center items-center h-64">
                <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-500"></div>
            </div>
        {:else if appointment}
            <div class="bg-white shadow-lg rounded-2xl overflow-hidden">
                <!-- Header with back button -->
                <div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                    <div class="flex justify-between items-center">
                        <button
                            on:click={() => goto('/appointments')}
                            class="flex items-center px-4 py-2 bg-white text-indigo-600 hover:bg-gray-100 font-medium rounded-md transition duration-200 ease-in-out shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                            </svg>
                            Back to Calendar
                        </button>
                        <button
                            on:click={deleteAppointment}
                            class={`text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-md font-medium transition duration-200 ease-in-out shadow-sm ${confirmDelete ? 'bg-red-700' : ''}`}
                        >
                            <span class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                                </svg>
                                {confirmDelete ? 'Confirm Delete' : 'Delete'}
                            </span>
                        </button>
                    </div>
                    <h1 class="text-2xl font-bold text-white mt-4 mb-2">Appointment Details</h1>
                </div>
                
                <!-- Main content -->
                <div class="p-6">
                    <!-- Time and date card -->
                    <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 mb-6 shadow-sm">
                        <div class="flex items-center justify-between">
                            <div>
                                <h2 class="text-lg font-semibold text-gray-900">
                                    {appointment?.start_time ? formatDate(appointment.start_time) : 'N/A'}
                                </h2>
                                <div class="flex items-center mt-2 text-indigo-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                                    </svg>
                                    <span class="font-medium">
                                        {appointment?.start_time ? formatTime(appointment.start_time) : ''} - 
                                        {appointment?.end_time ? formatTime(appointment.end_time) : ''}
                                    </span>
                                </div>
                            </div>
                            <div class="bg-white p-3 rounded-full shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Client and service info -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {#if appointment?.client}
                            <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                                <div class="flex items-center">
                                    <div class="flex-shrink-0 h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <span class="text-indigo-700 text-lg font-bold">
                                            {appointment?.client?.name ? appointment.client.name.charAt(0) : '?'}
                                        </span>
                                    </div>
                                    <div class="ml-4">
                                        <h3 class="text-lg font-medium text-gray-900">Client</h3>
                                        <button 
                                            class="text-indigo-600 hover:text-indigo-900 font-medium"
                                            on:click={() => appointment?.client && viewClient(appointment.client.id)}
                                        >
                                            {appointment?.client?.name || 'Unknown'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        {/if}
                        
                        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                            <div class="flex items-center">
                                <div class="flex-shrink-0 h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                </div>
                                <div class="ml-4">
                                    <h3 class="text-lg font-medium text-gray-900">Service</h3>
                                    <p class="text-gray-700 font-medium">{appointment?.service_type || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Notes section -->
                    <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h3 class="text-lg font-medium text-gray-900 mb-3 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Notes
                        </h3>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-gray-700 whitespace-pre-line">{appointment?.notes || 'No notes for this appointment.'}</p>
                        </div>
                    </div>
                </div>
            </div>
        {:else}
            <div class="bg-white p-6 rounded-lg shadow-sm text-center">
                <p class="text-gray-700">No appointment found with the specified ID.</p>
                <button
                    on:click={() => goto('/appointments')}
                    class="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition duration-200 ease-in-out shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                    </svg>
                    Return to Calendar
                </button>
            </div>
        {/if}
    </div>
</div>