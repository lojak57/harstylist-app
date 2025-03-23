<script lang="ts">
    import { parseSchedulingCommand, formatParsedCommand } from '$lib/utils/nlp';
    import { supabase } from '$lib/supabase';
    import type { Database } from '$lib/supabase';
    import { goto } from '$app/navigation';

    let command = '';
    let result = '';
    let loading = false;
    let error: string | null = null;

    async function handleCommand() {
        try {
            loading = true;
            error = null;

            const parsed = parseSchedulingCommand(command);
            if (parsed.error) {
                error = parsed.error;
                return;
            }

            // Format the command to show what was understood
            result = formatParsedCommand(parsed);

            // Get the current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Find the client by name
            const { data: clients, error: clientError } = await supabase
                .from('clients')
                .select('id, name')
                .eq('stylist_id', user.id)
                .ilike('name', `%${parsed.clientName}%`);

            if (clientError) throw clientError;
            if (!clients || clients.length === 0) {
                throw new Error(`Could not find client: ${parsed.clientName}`);
            }
            if (clients.length > 1) {
                throw new Error(`Multiple clients found matching: ${parsed.clientName}`);
            }

            // Find the service by type from client's available services
            const { data: services, error: serviceError } = await supabase
                .from('client_services')
                .select(`
                    service:services (id, name)
                `)
                .eq('client_id', clients[0].id)
                .ilike('service.name', parsed.serviceType);

            if (serviceError) throw serviceError;
            if (!services || services.length === 0) {
                throw new Error(`Could not find service: ${parsed.serviceType}`);
            }

            // Create the appointment directly
            const { error: insertError } = await supabase
                .from('appointments')
                .insert({
                    stylist_id: user.id,
                    client_id: clients[0].id,
                    start_time: parsed.appointmentTime!.toISOString(),
                    end_time: new Date(parsed.appointmentTime!.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
                    service_type: parsed.serviceType || '',
                    notes: ''
                });

            if (insertError) throw insertError;
            
            // Clear the command input and show success message
            command = '';
            result = 'Appointment scheduled successfully!';
            // Use goto for navigation instead of window.location.href
            goto('/appointments');

        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }
</script>

<div class="max-w-2xl mx-auto p-4">
    <div class="flex gap-4">
        <input
            type="text"
            bind:value={command}
            placeholder="e.g., schedule John Doe for a haircut next wednesday at 2pm"
            class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            on:keydown={(e) => e.key === 'Enter' && handleCommand()}
        />
        <button
            on:click={handleCommand}
            disabled={loading}
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
            {loading ? 'Processing...' : 'Schedule'}
        </button>
    </div>

    {#if error}
        <div class="mt-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>
    {/if}

    {#if result}
        <div class="mt-4 p-4 text-sm text-green-700 bg-green-100 rounded-lg">{result}</div>
    {/if}
</div>