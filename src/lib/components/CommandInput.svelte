<script lang="ts">
    import { parseSchedulingCommand, formatParsedCommand } from '$lib/utils/nlp';
    import { supabase } from '$lib/supabase';
    import { invalidate } from '$app/navigation';
    import { onMount } from 'svelte';
    import type { Database } from '$lib/supabase';
    import { goto } from '$app/navigation';

    let command = '';
    let result = '';
    let loading = false;
    let error: string | null = null;
    let success = false;
    
    // Get current user ID from session
    let userId: string | null = null;
    
    onMount(async () => {
        const { data } = await supabase.auth.getSession();
        userId = data.session?.user?.id ?? null;
    });

    async function handleCommand() {
        try {
            loading = true;
            error = null;
            success = false;
            
            console.log('Processing command:', command);

            const parsed = parseSchedulingCommand(command);
            if (parsed.error) {
                error = parsed.error;
                return;
            }

            // Format the command to show what was understood
            result = formatParsedCommand(parsed);

            // Get the current user
            if (!userId) {
                const { data } = await supabase.auth.getSession();
                // Use null coalescing to ensure we get null instead of undefined
                userId = data.session?.user?.id ?? null;
                if (!userId) throw new Error('Not authenticated. Please sign in again.');
            }

            // Ensure userId is not null before proceeding
            if (userId === null) {
                throw new Error('User ID is null');
            }

            // Find the client by name (using case-insensitive partial match)
            const { data: clients, error: clientError } = await supabase
                .from('clients')
                .select('id, name')
                .eq('stylist_id', userId)
                .ilike('name', `%${parsed.clientName}%`);

            if (clientError) throw clientError;
            if (!clients || clients.length === 0) {
                throw new Error(`Could not find client: ${parsed.clientName}`);
            }
            
            // If multiple clients match, try to find an exact match or closest match
            let clientId: string;
            if (clients.length > 1) {
                console.log('Multiple clients found:', clients);
                // Try to find exact match (case insensitive)
                const exactMatch = clients.find(c => 
                    c.name.toLowerCase() === parsed.clientName?.toLowerCase()
                );
                
                if (exactMatch) {
                    clientId = exactMatch.id;
                    console.log('Using exact match client:', exactMatch.name);
                } else {
                    // Use the first match but warn the user
                    clientId = clients[0].id;
                    console.log('Using first match client:', clients[0].name);
                    result += `\n(Note: Multiple clients matched "${parsed.clientName}". Using ${clients[0].name})`;
                }
            } else {
                clientId = clients[0].id;
            }

            // Find the service by name (directly from services table)
            const serviceTypeClean = parsed.serviceType?.replace(/^(a|an)\s+/i, '').trim() || '';
            console.log('Searching for service with cleaned name:', serviceTypeClean);
            
            const { data: services, error: serviceError } = await supabase
                .from('services')
                .select('id, name, duration')
                .eq('stylist_id', userId)
                .ilike('name', `%${serviceTypeClean}%`);

            if (serviceError) throw serviceError;
            if (!services || services.length === 0) {
                throw new Error(`Could not find service: ${serviceTypeClean}`);
            }
            
            console.log('Found services:', services);
            
            // If multiple services match, try to find an exact match or closest match
            let serviceId, serviceDuration;
            if (services.length > 1) {
                console.log('Multiple services found:', services);
                // Try to find exact match (case insensitive)
                const exactMatch = services.find(s => 
                    s.name.toLowerCase() === serviceTypeClean.toLowerCase()
                );
                
                if (exactMatch) {
                    serviceId = exactMatch.id;
                    serviceDuration = exactMatch.duration || 60;
                    console.log('Using exact match service:', exactMatch.name, 'with duration:', serviceDuration);
                } else {
                    serviceId = services[0].id;
                    serviceDuration = services[0].duration || 60;
                    console.log('Using first match service:', services[0].name, 'with duration:', serviceDuration);
                    result += `\n(Note: Multiple services matched "${serviceTypeClean}". Using ${services[0].name})`;
                }
            } else {
                serviceId = services[0].id;
                serviceDuration = services[0].duration || 60;
                console.log('Using service:', services[0].name, 'with duration:', serviceDuration);
            }
            
            // Ensure service duration is a valid number
            if (!serviceDuration || isNaN(Number(serviceDuration)) || Number(serviceDuration) <= 0) {
                console.log('Invalid or missing service duration, defaulting to 60 minutes');
                serviceDuration = 60;
            } else {
                // Convert to number to ensure it's not a string
                serviceDuration = Number(serviceDuration);
            }
            
            console.log('Selected service:', services.find(s => s.id === serviceId)?.name, 'with duration:', serviceDuration, 'minutes');

            // Validate the appointment time and create the appointment
            if (!parsed.appointmentTime || !(parsed.appointmentTime instanceof Date) || isNaN(parsed.appointmentTime.getTime())) {
                throw new Error('Invalid appointment time');
            }

            console.log('Appointment time before ISO conversion:', parsed.appointmentTime);
            
            // Ensure we have a valid date object with proper time
            const startTime = new Date(parsed.appointmentTime);
            console.log('Start time object:', startTime);
            
            // Make sure the time is valid (not in a DST transition etc)
            if (isNaN(startTime.getTime())) {
                throw new Error('Invalid start time - cannot create a valid date object');
            }
            
            const startTimeISO = startTime.toISOString();
            console.log('Start time ISO:', startTimeISO);
            
            // Calculate end time based on service duration
            // Create a new date object to avoid reference issues
            const endTime = new Date(startTime.getTime());
            // Add minutes using a more reliable method
            console.log('Service duration before calculation:', serviceDuration, 'minutes');
            endTime.setTime(endTime.getTime() + (serviceDuration * 60 * 1000));
            console.log('End time object:', endTime);
            
            // Make sure the end time is valid
            if (isNaN(endTime.getTime())) {
                console.error('Invalid end time calculation. Start time:', startTime, 'Service duration:', serviceDuration);
                throw new Error('Invalid end time calculation');
            }
            
            const endTimeISO = endTime.toISOString();
            console.log('End time ISO:', endTimeISO);
            
            // Create the appointment
            const { data: appointment, error: appointmentError } = await supabase
                .from('appointments')
                .insert({
                    client_id: clientId,
                    service_id: serviceId,
                    stylist_id: userId,
                    start_time: startTimeISO,
                    end_time: endTimeISO,
                    notes: `Created via command: ${command}`
                })
                .select();

            if (appointmentError) throw appointmentError;
            
            // Invalidate data to refresh the page
            await invalidate('appointments');

            // Clear the command input and show success message
            command = '';
            result = 'Appointment scheduled successfully!';
            success = true;
            
            // Refresh the appointments page
            setTimeout(() => {
                goto('/appointments');
            }, 1500);

        } catch (e: any) {
            console.error('Error handling command:', e);
            error = e.message;
        } finally {
            loading = false;
        }
    }
</script>

<div class="max-w-2xl mx-auto p-4">
    <div class="flex flex-col gap-4">
        <div class="flex gap-4">
            <input
                type="text"
                bind:value={command}
                placeholder="e.g., Schedule 'John Doe' for haircut on 3/25 and 2pm"
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
        
        {#if result && !error}
            <div class="p-4 bg-green-50 border border-green-200 rounded-md text-green-800 {success ? 'animate-pulse' : ''}">
                {result}
            </div>
        {/if}
        
        {#if error}
            <div class="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
                {error}
            </div>
        {/if}
        
        <div class="text-sm text-gray-500 mt-2">
            <p>Try commands like:</p>
            <ul class="list-disc pl-5 mt-1 space-y-1">
                <li>Schedule "John Smith" for haircut on tomorrow and 3pm</li>
                <li>Schedule "Jane Doe" for color on friday and 2:30pm</li>
                <li>Schedule "Mike Johnson" for men's cut on 4/15 and 10am</li>
            </ul>
        </div>
    </div>
</div>