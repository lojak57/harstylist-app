<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { DateTime } from 'luxon';
    import type { Appointment } from '$lib/types';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    
    const dispatch = createEventDispatcher();
    
    export let appointment: Appointment;
    export let view: 'month' | 'week' | 'day' = 'month';
    export let style: string = '';
    export let isDragging: boolean = false;

    // Extract client data from the appointment
    let clientData: any = null;
    let clientName = 'Unknown';
    let clientInitial = 'U';
    let serviceName = appointment.service_type || 'No service specified';
    
    onMount(() => {
        console.log('AppointmentCard mounted with appointment:', appointment);
        updateClientData();
    });
    
    // Function to extract client data - only use the client property, not clients
    function updateClientData() {
        if (appointment && appointment.client) {
            clientData = appointment.client;
            console.log('Client data found:', clientData);
            
            // Update client name and initial based on the extracted data
            if (clientData && clientData.name) {
                clientName = clientData.name;
                clientInitial = clientName.charAt(0).toUpperCase();
                console.log('Set client name to:', clientName);
            } else {
                clientName = 'Unknown';
                clientInitial = 'U';
                console.log('Using default Unknown client name');
            }
        } else {
            console.log('No client data found in appointment:', appointment);
            clientName = 'Unknown';
            clientInitial = 'U';
        }
    }
    
    // React when appointment changes
    $: if (appointment) {
        console.log('Appointment changed in AppointmentCard:', appointment);
        updateClientData();
        serviceName = appointment.service_type || 'No service specified';
    }

    // Format start and end times
    $: startTime = DateTime.fromISO(appointment.start_time, { zone: 'America/Denver' }).toFormat('h:mm a');
    $: endTime = DateTime.fromISO(appointment.end_time, { zone: 'America/Denver' }).toFormat('h:mm a');
    
    function handleClick(event: MouseEvent) {
        // Navigate to appointment detail page
        goto(`/appointments/${appointment.id}`);
        dispatch('click', { event });
    }
    
    // Simplified drag start handler without dataTransfer
    function handleDragStart() {
        dispatch('dragStart', { appointmentId: appointment.id });
    }
</script>

<!-- Month view is more compact -->
{#if view === 'month'}
    <div 
        class="month-appointment cursor-pointer" 
        style="{style}"
        on:mousedown={handleDragStart}
        on:click={handleClick}
        on:keypress={(e) => e.key === 'Enter' && handleClick(e as unknown as MouseEvent)}
        tabindex="0"
        role="button"
        aria-label="Appointment with {clientName} at {startTime}"
    >
        <div class="appointment-client-initial">{clientInitial}</div>
        <div class="appointment-client-name">{clientName}</div>
        <div class="appointment-service-name">{serviceName}</div>
    </div>
{:else}
    <!-- Week/day view with more details -->
    <div 
        class="appointment {isDragging ? 'dragging' : ''}" 
        style="{style}"
        on:mousedown={handleDragStart}
        on:click={handleClick}
        on:keypress={(e) => e.key === 'Enter' && handleClick(e as unknown as MouseEvent)}
        tabindex="0"
        role="button"
        aria-label="Appointment with {clientName} at {startTime}"
    >
        <div class="appointment-content">
            <div class="appointment-header">
                <div class="client-badge">
                    <span>{clientInitial}</span>
                </div>
                <div class="appointment-time">{startTime}</div>
            </div>
            <div class="appointment-details">
                <div class="appointment-client-name">{clientName}</div>
                <div class="appointment-service-name">{serviceName}</div>
            </div>
        </div>
    </div>
{/if}

<style>
    /* Month view appointment */
    .month-appointment {
        background-color: #1a73e8;
        color: white;
        border-radius: 4px;
        font-size: 11px;
        padding: 2px 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        cursor: pointer;
        position: absolute;
        z-index: 1;
    }

    /* Week/day view appointment */
    .appointment {
        background-color: #1a73e8;
        color: white;
        border-radius: 4px;
        overflow: hidden;
        position: absolute;
        font-size: 12px;
        width: calc(100% - 8px);  /* Fill the entire width of the day column with small margin */
        z-index: 10;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
        cursor: pointer;
        transition: box-shadow 0.2s ease, transform 0.1s ease;
    }
    
    .appointment:hover {
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
    }
    
    .appointment.dragging {
        opacity: 0.8;
        transform: scale(1.02);
        z-index: 100;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23);
    }
    
    .appointment-content {
        display: flex;
        flex-direction: column;
        padding: 6px;
        height: 100%;
        box-sizing: border-box;
    }
    
    .appointment-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
    }
    
    .appointment-time {
        font-weight: 500;
        font-size: 11px;
    }
    
    .appointment-details {
        display: flex;
        flex-direction: column;
    }
    
    .client-badge {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .appointment-client-name {
        font-size: 10px;
        text-align: center;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    
    .appointment-client-initial {
        font-weight: bold;
        font-size: 10px;
        margin-right: 2px;
    }
    
    .appointment-service-name {
        font-size: 10px;
        text-align: center;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>
