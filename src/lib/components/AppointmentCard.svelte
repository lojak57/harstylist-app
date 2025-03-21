<script lang="ts">
    import { formatSalonTime, parseDateToLuxon } from '$lib/utils/timeUtils';
    import { createEventDispatcher } from 'svelte';
    import type { Appointment } from '$lib/types';
    import { DateTime } from 'luxon';

    const dispatch = createEventDispatcher<{
        click: { event: MouseEvent };
        dragStart: { appointment: Appointment; event: MouseEvent };
    }>();

    export let appointment: Appointment;
    export let view: 'day' | 'week' | 'month' = 'week';
    export let style: string = '';
    export let isDragging: boolean = false;

    // Safely get client name
    $: clientName = appointment.client?.name || 'Unknown';
    $: clientInitial = clientName !== 'Unknown' ? clientName[0].toUpperCase() : 'U';
    
    // Log client information for debugging
    $: {
        console.log('Appointment client data:', appointment.client);
        console.log('Client name being used:', clientName);
    }

    // Format start and end times
    $: startTime = parseDateToLuxon(appointment.start_time);
    $: endTime = parseDateToLuxon(appointment.end_time);
    $: formattedStartTime = formatSalonTime(startTime.toJSDate(), 'h:mm a');
    $: formattedEndTime = formatSalonTime(endTime.toJSDate(), 'h:mm a');

    // Calculate duration in minutes
    $: durationMinutes = endTime.diff(startTime, 'minutes').minutes;
    $: formattedDuration = `Duration: ${Math.round(durationMinutes)} min`;

    // For dragging
    function handleDragStart(event: MouseEvent) {
        event.stopPropagation();
        dispatch('dragStart', { appointment, event });
    }

    // Handle appointment click
    function handleClick(event: MouseEvent) {
        event.stopPropagation();
        dispatch('click', { event });
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
        aria-label="Appointment with {clientName} at {formattedStartTime}"
    >
        <div class="appointment-client-initial">{clientInitial}</div>
        <div class="appointment-client-name">{clientName}</div>
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
        aria-label="Appointment with {clientName} at {formattedStartTime}"
    >
        <div class="appointment-content">
            <div class="appointment-time">{formattedStartTime}</div>
            <div class="client-badge">
                <span>{clientInitial}</span>
            </div>
            <div class="appointment-client-name">{clientName}</div>
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
        width: 60px;  /* Skinny vertical cards */
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
        align-items: center;
        padding: 4px;
        height: 100%;
        box-sizing: border-box;
    }
    
    .appointment-time {
        font-weight: 500;
        font-size: 11px;
        margin-bottom: 2px;
        text-align: center;
    }
    
    .client-badge {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 2px 0;
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
</style>
