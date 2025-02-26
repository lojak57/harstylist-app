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
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    async function deleteAppointment() {
        if (!confirm('Are you sure you want to delete this appointment?')) return;

        try {
            loading = true;
            const { error: deleteError } = await supabase
                .from('appointments')
                .delete()
                .eq('id', $page.params.id);

            if (deleteError) throw deleteError;
            goto('/appointments');
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    function viewClient(clientId: string) {
        goto(`/clients/${clientId}`);
    }

    function formatDateTime(dateStr: string) {
        return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
    }
</script>

<div class="py-6">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {#if error}
            <div class="mt-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>
        {/if}

        {#if appointment}
            <div class="bg-white shadow sm:rounded-lg">
                <div class="px-4 py-5 sm:px-6">
                    <div class="flex justify-between items-center">
                        <h2 class="text-lg font-medium text-gray-900">Appointment Details</h2>
                        <button
                            on:click={deleteAppointment}
                            class="text-red-600 hover:text-red-900 font-medium"
                        >
                            Delete Appointment
                        </button>
                    </div>
                </div>
                <div class="border-t border-gray-200 px-4 py-5 sm:px-6">
                    <dl class="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Client</dt>
                            <dd 
                                class="mt-1 text-sm text-indigo-600 hover:text-indigo-900 cursor-pointer"
                                on:click={() => viewClient(appointment.client.id)}
                                on:keydown={(e) => e.key === 'Enter' && viewClient(appointment.client.id)}
                                role="button"
                                tabindex="0"
                            >
                                {appointment.client.name}
                            </dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Service Type</dt>
                            <dd class="mt-1 text-sm text-gray-900">{appointment.service_type}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Start Time</dt>
                            <dd class="mt-1 text-sm text-gray-900">{formatDateTime(appointment.start_time)}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">End Time</dt>
                            <dd class="mt-1 text-sm text-gray-900">{formatDateTime(appointment.end_time)}</dd>
                        </div>
                        <div class="sm:col-span-2">
                            <dt class="text-sm font-medium text-gray-500">Notes</dt>
                            <dd class="mt-1 text-sm text-gray-900 whitespace-pre-line">{appointment.notes || 'No notes'}</dd>
                        </div>
                    </dl>
                </div>
            </div>
        {/if}
    </div>
</div>