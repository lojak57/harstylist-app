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
    
    // Variables for handling mouse interactions
    let clickTimer: ReturnType<typeof setTimeout> | null = null;
    let isMouseDown = false;
    let dragThreshold = 300; // Wait 300ms before initiating drag
    
    onMount(() => {
        console.log('AppointmentCard mounted with appointment:', appointment);
        updateClientData();
        
        return () => {
            // Clear any pending timers on component destruction
            if (clickTimer) clearTimeout(clickTimer);
        };
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
    $: startTime = DateTime.fromISO(appointment.start_time ?? '', { zone: 'America/Denver' }).toFormat('h:mm a');
    $: endTime = DateTime.fromISO(appointment.end_time ?? '', { zone: 'America/Denver' }).toFormat('h:mm a');
    
    function handleMouseDown(event: MouseEvent) {
        // Only start dragging on primary mouse button
        if (event.button !== 0) return;
        
        // Determine if the click was on a resize handle or the main card
        const target = event.target as HTMLElement;
        if (target.classList.contains('resize-handle-top')) {
            // For resize handles, immediately dispatch resize event
            event.preventDefault();
            dispatch('resizeStart', { 
                appointment, 
                event, 
                handle: 'top' 
            });
        } else if (target.classList.contains('resize-handle-bottom')) {
            // For resize handles, immediately dispatch resize event
            event.preventDefault();
            dispatch('resizeStart', { 
                appointment, 
                event, 
                handle: 'bottom' 
            });
        } else {
            // For the main card body, set mouse down state
            isMouseDown = true;
            
            // Set a timer to initiate drag if mouse remains down
            clickTimer = setTimeout(() => {
                if (isMouseDown) {
                    // Prevent default behaviors after we're sure it's a drag
                    event.preventDefault();
                    // Regular drag start for the main card
                    dispatch('dragStart', { appointment, event });
                }
                clickTimer = null;
            }, dragThreshold);
            
            // Add window-level mouseup event to catch if user releases outside component
            window.addEventListener('mouseup', handleGlobalMouseUp, { once: true });
        }
    }
    
    function handleGlobalMouseUp() {
        isMouseDown = false;
        if (clickTimer) {
            clearTimeout(clickTimer);
            clickTimer = null;
        }
    }
    
    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter' || event.key === ' ') {
            dispatch('view', { appointment });
        }
    }
    
    function handleClick(event: MouseEvent) {
        // Clear any pending drag timers
        if (clickTimer) {
            clearTimeout(clickTimer);
            clickTimer = null;
        }
        
        // Reset mouse state
        isMouseDown = false;
        
        // Prevent handling clicks on resize handles
        const target = event.target as HTMLElement;
        if (target.classList.contains('resize-handle-top') || 
            target.classList.contains('resize-handle-bottom')) {
            return;
        }
        
        // If we're currently dragging, don't navigate
        if (isDragging) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        
        // Navigate to appointment detail page
        goto(`/appointments/${appointment.id}`);
        dispatch('click', { event });
    }
    
    // Handle drag start
    function handleDragStart(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        
        // Dispatch event with the appointment and the original mouse event
        dispatch('dragStart', { appointment, event });
    }
</script>

<!-- Month view is more compact -->
{#if view === 'month'}
    <div 
        class="month-appointment cursor-pointer {isDragging ? 'hidden' : ''}" 
        style="{style}"
        on:mousedown={handleMouseDown}
        on:click={handleClick}
        on:keypress={(e) => e.key === 'Enter' && handleClick(e as unknown as MouseEvent)}
        tabindex="0"
        role="button"
        aria-label="Appointment with {clientName} at {startTime}"
    >
        <!-- Top resize handle -->
        <div class="resize-handle resize-handle-top" title="Resize appointment"></div>
        
        <div class="appointment-client-initial">{clientInitial}</div>
        <div class="appointment-client-name">{clientName}</div>
        <div class="appointment-service-name">{serviceName}</div>
        
        <!-- Bottom resize handle -->
        <div class="resize-handle resize-handle-bottom" title="Resize appointment"></div>
    </div>
{:else}
    <!-- Week/day view with more details -->
    <div 
        class="appointment {isDragging ? 'hidden' : ''}" 
        style="{style}"
        on:mousedown={handleMouseDown}
        on:click={handleClick}
        on:keypress={(e) => e.key === 'Enter' && handleClick(e as unknown as MouseEvent)}
        tabindex="0"
        role="button"
        aria-label="Appointment with {clientName} at {startTime}"
    >
        <!-- Top resize handle -->
        <div class="resize-handle resize-handle-top" title="Resize appointment"></div>
        
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
        
        <!-- Bottom resize handle -->
        <div class="resize-handle resize-handle-bottom" title="Resize appointment"></div>
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
        cursor: grab;
        transition: box-shadow 0.2s ease, transform 0.1s ease;
    }
    
    .appointment:hover {
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
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
        font-size: 10px;
        font-weight: bold;
        background-color: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        width: 16px;
        height: 16px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-right: 4px;
    }
    
    .appointment-service-name {
        font-size: 9px;
        color: rgba(255, 255, 255, 0.8);
        margin-top: 2px;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    
    /* Resize handles */
    .resize-handle {
        height: 5px;
        width: 20px;
        border-radius: 3px;
        background: #3b82f6;
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        cursor: ns-resize;
        z-index: 5;
    }
    
    .resize-handle-top {
        top: 0;
    }
    
    .resize-handle-bottom {
        bottom: 0;
    }
    
    .resize-handle:hover {
        background: #2563eb;
        height: 7px;
    }
</style>
