<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import { storageToLocalDate, localToStorageFormat } from '$lib/utils/timeUtils';
    import { format } from 'date-fns';

    let appointments = [];
    let rawData = [];
    let now = new Date();
    let nowISO = now.toISOString();
    let nowLocale = now.toLocaleString();
    let nowTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let nowOffset = now.getTimezoneOffset();
    
    let newAppointment = {
        startTime: '',
        endTime: '',
        client: '',
        service: 'Debug Test',
        rawStart: '',
        rawEnd: ''
    };
    
    let loading = false;
    let error = null;
    
    onMount(fetchAppointments);
    
    async function fetchAppointments() {
        try {
            loading = true;
            error = null;
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            const { data, error: fetchError } = await supabase
                .from('appointments')
                .select(`
                    id,
                    stylist_id,
                    client_id,
                    start_time,
                    end_time,
                    service_type,
                    notes,
                    created_at,
                    clients(name)
                `)
                .eq('stylist_id', user.id)
                .order('start_time', { ascending: true });
                
            if (fetchError) throw fetchError;
            
            rawData = data || [];
            
            // Process appointments for display
            appointments = rawData.map(appt => {
                const startDate = storageToLocalDate(appt.start_time);
                const endDate = storageToLocalDate(appt.end_time);
                
                return {
                    ...appt,
                    startLocal: startDate.toLocaleString(),
                    endLocal: endDate.toLocaleString(),
                    startFormatted: format(startDate, 'MMM d, yyyy h:mm a'),
                    endFormatted: format(endDate, 'MMM d, yyyy h:mm a'),
                    duration: Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)),
                    clientName: appt.clients?.name || 'No client'
                };
            });
        } catch (e) {
            error = e.message;
            console.error('Error fetching appointments:', e);
        } finally {
            loading = false;
        }
    }
    
    async function createTestAppointment() {
        try {
            loading = true;
            error = null;
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');
            
            // Check for client
            const { data: clients, error: clientError } = await supabase
                .from('clients')
                .select('id')
                .limit(1);
                
            if (clientError || !clients.length) throw new Error('No clients found');
            
            // Create local date objects
            const startDate = new Date(newAppointment.startTime);
            const endDate = new Date(newAppointment.endTime);
            
            // Format for storage
            const formattedStartTime = localToStorageFormat(startDate);
            const formattedEndTime = localToStorageFormat(endDate);
            
            // Store raw values for comparison
            newAppointment.rawStart = formattedStartTime;
            newAppointment.rawEnd = formattedEndTime;
            
            // Insert appointment
            const { data, error: insertError } = await supabase
                .from('appointments')
                .insert({
                    stylist_id: user.id,
                    client_id: clients[0].id,
                    start_time: formattedStartTime,
                    end_time: formattedEndTime,
                    service_type: newAppointment.service,
                    notes: 'Debug appointment'
                })
                .select()
                .single();
                
            if (insertError) throw insertError;
            
            await fetchAppointments();
            alert('Test appointment created');
        } catch (e) {
            error = e.message;
            alert(`Error: ${e.message}`);
        } finally {
            loading = false;
        }
    }
    
    async function deleteAppointment(id) {
        if (!confirm('Delete this appointment?')) return;
        
        try {
            loading = true;
            error = null;
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');
            
            const { error: deleteError } = await supabase
                .from('appointments')
                .delete()
                .eq('id', id);
                
            if (deleteError) throw deleteError;
            
            await fetchAppointments();
            alert('Appointment deleted');
        } catch (e) {
            error = e.message;
            alert(`Error: ${e.message}`);
        } finally {
            loading = false;
        }
    }
    
    async function clearAllAppointments() {
        if (!confirm('Are you sure you want to delete ALL appointments? This cannot be undone!')) return;
        
        try {
            loading = true;
            error = null;
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');
            
            const { error: deleteError } = await supabase
                .from('appointments')
                .delete()
                .eq('stylist_id', user.id);
                
            if (deleteError) throw deleteError;
            
            await fetchAppointments();
            alert('All appointments deleted successfully');
        } catch (e) {
            error = e.message;
            alert(`Error: ${error}`);
        } finally {
            loading = false;
        }
    }
    
    function generateLocalTimes() {
        // Generate start and end times for today at 10:00 AM and 11:00 AM
        const today = new Date();
        today.setHours(10, 0, 0, 0);
        const endTime = new Date(today);
        endTime.setHours(11, 0, 0, 0);
        
        newAppointment.startTime = today.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM format for input
        newAppointment.endTime = endTime.toISOString().slice(0, 16);
    }
</script>

<div class="container mx-auto p-4 max-w-4xl">
    <h1 class="text-2xl font-bold mb-6">Appointment Debugging Tool</h1>
    
    <div class="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 class="text-xl font-semibold mb-2">System Time Information</h2>
        <div class="grid grid-cols-2 gap-2">
            <div class="font-medium">Current Time (ISO):</div>
            <div>{nowISO}</div>
            
            <div class="font-medium">Current Time (Locale):</div>
            <div>{nowLocale}</div>
            
            <div class="font-medium">Timezone:</div>
            <div>{nowTimezone}</div>
            
            <div class="font-medium">Timezone Offset (minutes):</div>
            <div>{nowOffset}</div>
        </div>
    </div>
    
    <div class="mb-8 p-4 bg-blue-50 rounded-lg">
        <h2 class="text-xl font-semibold mb-4">Create Test Appointment</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
                <label class="block text-sm font-medium mb-1">Start Time</label>
                <input 
                    type="datetime-local" 
                    bind:value={newAppointment.startTime} 
                    class="w-full p-2 border rounded"
                />
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">End Time</label>
                <input 
                    type="datetime-local" 
                    bind:value={newAppointment.endTime} 
                    class="w-full p-2 border rounded"
                />
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Service</label>
                <input 
                    type="text" 
                    bind:value={newAppointment.service} 
                    class="w-full p-2 border rounded"
                />
            </div>
        </div>
        
        <div class="flex gap-2">
            <button 
                on:click={createTestAppointment}
                class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                disabled={loading}
            >
                {loading ? 'Creating...' : 'Create Test Appointment'}
            </button>
            
            <button 
                on:click={generateLocalTimes}
                class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                disabled={loading}
            >
                Set Default Times
            </button>
        </div>
        
        {#if newAppointment.rawStart}
            <div class="mt-4 p-3 bg-green-100 rounded text-sm">
                <div><strong>Raw start_time stored:</strong> {newAppointment.rawStart}</div>
                <div><strong>Raw end_time stored:</strong> {newAppointment.rawEnd}</div>
            </div>
        {/if}
    </div>
    
    <div class="mb-4">
        <h2 class="text-xl font-semibold mb-4">Appointment Data Analysis</h2>
        <button 
            on:click={fetchAppointments}
            class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 mb-4"
            disabled={loading}
        >
            {loading ? 'Loading...' : 'Refresh Appointments'}
        </button>
        
        <button 
            on:click={clearAllAppointments}
            class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 mb-4"
            disabled={loading}
        >
            {loading ? 'Deleting...' : 'Clear All Appointments'}
        </button>
        
        {#if error}
            <div class="p-3 bg-red-100 text-red-800 rounded mb-4">{error}</div>
        {/if}
        
        <div class="overflow-x-auto">
            <table class="min-w-full bg-white border rounded-lg overflow-hidden">
                <thead class="bg-gray-100">
                    <tr>
                        <th class="p-3 text-left">Client</th>
                        <th class="p-3 text-left">Service</th>
                        <th class="p-3 text-left">Start Time</th>
                        <th class="p-3 text-left">End Time</th>
                        <th class="p-3 text-left">Duration</th>
                        <th class="p-3 text-left">Raw Start</th>
                        <th class="p-3 text-left">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#if appointments.length === 0}
                        <tr>
                            <td colspan="7" class="p-4 text-center text-gray-500">No appointments found</td>
                        </tr>
                    {:else}
                        {#each appointments as appointment}
                            <tr class="border-t hover:bg-gray-50">
                                <td class="p-3">{appointment.clientName}</td>
                                <td class="p-3">{appointment.service_type}</td>
                                <td class="p-3">
                                    <div>{appointment.startFormatted}</div>
                                    <div class="text-xs text-gray-500">{appointment.startLocal}</div>
                                </td>
                                <td class="p-3">
                                    <div>{appointment.endFormatted}</div>
                                    <div class="text-xs text-gray-500">{appointment.endLocal}</div>
                                </td>
                                <td class="p-3">{appointment.duration} min</td>
                                <td class="p-3">
                                    <div class="text-xs overflow-x-auto max-w-[200px]">{appointment.start_time}</div>
                                </td>
                                <td class="p-3">
                                    <button 
                                        on:click={() => deleteAppointment(appointment.id)}
                                        class="bg-red-600 text-white px-2 py-1 text-sm rounded hover:bg-red-700"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        {/each}
                    {/if}
                </tbody>
            </table>
        </div>
    </div>
    
    <div class="mt-8 p-4 bg-gray-100 rounded-lg">
        <h2 class="text-xl font-semibold mb-2">Raw Database Data</h2>
        <pre class="text-xs bg-gray-800 text-white p-4 rounded overflow-x-auto">{JSON.stringify(rawData, null, 2)}</pre>
    </div>
</div>
