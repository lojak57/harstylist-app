<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { format, addDays, startOfWeek, isSameDay, isSameMonth, differenceInMinutes, addMinutes, parseISO, isToday, getDay, getHours, getMinutes } from 'date-fns';
    import type { Database } from '$lib/supabase';
    
    type Appointment = Database['public']['Tables']['appointments']['Row'] & {
        client?: Database['public']['Tables']['clients']['Row']
    };
    
    const dispatch = createEventDispatcher();
    
    export let appointments: Appointment[] = [];
    export let currentDate = new Date();
    export let view: 'month' | 'week' | 'day' = 'week';
    export let businessHours = { start: 9, end: 17 }; // Default 9 AM to 5 PM
    
    // Canvas overlay for drag and drop
    let calendarContainer: HTMLElement;
    let dragOverlay: HTMLDivElement | null = null;
    let overlayAppointment: HTMLDivElement | null = null;
    let isDragging = false;
    let draggedAppointment: Appointment | null = null;
    let startY = 0;
    let currentY = 0;
    let heightPerMinute = 1; // Will be calculated based on business hours
    let originalTop = 0;
    
    $: dayStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    $: daysToShow = view === 'month' ? 35 : view === 'week' ? 7 : 1;
    $: timeSlots = Array.from({ length: (businessHours.end - businessHours.start) * 4 }, (_, i) => {
        const hour = Math.floor(i / 4) + businessHours.start;
        const minute = (i % 4) * 15;
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    });
    
    // Create the overlay element for dragging
    function createDragOverlay() {
        if (dragOverlay) return;
        
        // Create the semi-transparent overlay for the entire calendar
        dragOverlay = document.createElement('div');
        dragOverlay.className = 'drag-overlay';
        dragOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 50;
            cursor: grabbing;
            display: none;
        `;
        
        // Create the visual element that represents the appointment being dragged
        overlayAppointment = document.createElement('div');
        overlayAppointment.className = 'overlay-appointment';
        overlayAppointment.style.cssText = `
            position: absolute;
            background-color: rgba(99, 102, 241, 0.6);
            border-radius: 0.375rem;
            padding: 0.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            pointer-events: none;
        `;
        
        dragOverlay.appendChild(overlayAppointment);
        
        // Add the overlay to the calendar container
        if (calendarContainer) {
            calendarContainer.appendChild(dragOverlay);
            
            // Set up event listeners for the overlay
            dragOverlay.addEventListener('mousemove', handleDragMove);
            dragOverlay.addEventListener('touchmove', handleDragMove, { passive: false });
            dragOverlay.addEventListener('mouseup', handleDragEnd);
            dragOverlay.addEventListener('touchend', handleDragEnd);
        }
    }
    
    // Computed to only show appointments for the current view
    $: visibleAppointments = appointments.filter(appointment => {
        const appointmentStart = parseISO(appointment.start_time);
        if (view === 'month') {
            // TODO: Implement month view filtering
            return true;
        } else if (view === 'week') {
            const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
            const endOfCurrentWeek = addDays(startOfCurrentWeek, 6);
            return appointmentStart >= startOfCurrentWeek && appointmentStart <= endOfCurrentWeek;
        } else { // day view
            return isSameDay(appointmentStart, currentDate);
        }
    });
    
    function getDayColumn(day: Date) {
        return (getDay(day) + 6) % 7; // Convert to Monday = 0, Sunday = 6
    }
    
    // Calculate the position and size of an appointment based on its time
    function getAppointmentStyle(appointment: Appointment) {
        const start = new Date(appointment.start_time);
        const end = new Date(appointment.end_time);
        
        const startHour = getHours(start);
        const startMinute = getMinutes(start);
        const durationMinutes = differenceInMinutes(end, start);
        
        const minutesFromBusinessStart = (startHour - businessHours.start) * 60 + startMinute;
        const top = minutesFromBusinessStart * heightPerMinute;
        const height = durationMinutes * heightPerMinute;
        
        return `top: ${top}px; height: ${height}px;`;
    }
    
    function getColumnForDate(date: Date) {
        if (view === 'day') return 0;
        const dayColumn = getDayColumn(date);
        return view === 'week' ? dayColumn : (Math.floor(dayColumn / 7) * 7) + (dayColumn % 7);
    }
    
    // Start dragging an appointment
    function handleDragStart(appointment: Appointment, event: MouseEvent | TouchEvent) {
        event.preventDefault();
        
        if (!appointment) return;
        
        // Create the overlay if it doesn't exist
        createDragOverlay();
        
        // Check if overlay was created successfully
        if (!dragOverlay || !overlayAppointment) {
            console.error('Failed to create drag overlay');
            return;
        }
        
        // Store the appointment we're dragging
        draggedAppointment = appointment;
        
        // Set the initial mouse position
        if (event instanceof MouseEvent) {
            startY = event.clientY;
            currentY = event.clientY;
        } else {
            startY = event.touches[0].clientY;
            currentY = event.touches[0].clientY;
        }
        
        // Calculate height per minute based on time grid
        const timeGrid = document.querySelector('.time-grid');
        if (timeGrid) {
            const gridHeight = timeGrid.clientHeight;
            const totalMinutes = (businessHours.end - businessHours.start) * 60;
            heightPerMinute = gridHeight / totalMinutes;
        }
        
        // Get the original appointment element
        const appointmentElement = document.querySelector(`[data-appointment-id="${appointment.id}"]`) as HTMLElement;
        if (appointmentElement) {
            // Get the appointment's dimensions and position
            const rect = appointmentElement.getBoundingClientRect();
            const calendarRect = calendarContainer.getBoundingClientRect();
            
            // Set the overlay appointment position and size
            overlayAppointment.style.width = `${rect.width}px`;
            overlayAppointment.style.height = `${rect.height}px`;
            overlayAppointment.style.left = `${rect.left - calendarRect.left}px`;
            overlayAppointment.style.top = `${rect.top - calendarRect.top}px`;
            
            // Store the original top position for calculations
            originalTop = rect.top - calendarRect.top;
            
            // Show the appointment title in the overlay
            overlayAppointment.textContent = appointment.client?.name || 'Appointment';
            
            // Hide the original appointment during drag
            appointmentElement.style.opacity = '0.4';
            
            // Show the drag overlay
            dragOverlay.style.display = 'block';
            
            // Set the dragging state
            isDragging = true;
        }
    }
    
    // Handle the appointment being dragged
    function handleDragMove(event: MouseEvent | TouchEvent) {
        if (!isDragging || !draggedAppointment || !overlayAppointment) return;
        
        event.preventDefault();
        
        // Get the current cursor position
        let newY: number;
        if (event instanceof MouseEvent) {
            newY = event.clientY;
        } else {
            newY = event.touches[0].clientY;
        }
        
        // Calculate how far we've moved
        const deltaY = newY - currentY;
        
        // Update the overlay appointment position
        if (overlayAppointment) {
            const currentTop = parseInt(overlayAppointment.style.top || '0');
            overlayAppointment.style.top = `${currentTop + deltaY}px`;
        }
        
        // Update the current mouse position for the next move
        currentY = newY;
    }
    
    // Handle the end of a drag operation
    function handleDragEnd() {
        if (!isDragging || !draggedAppointment || !overlayAppointment) return;
        
        if (!dragOverlay) {
            console.error('dragOverlay is null');
            return;
        }
        
        // Calculate the new position in minutes
        const newTop = parseInt(overlayAppointment.style.top || '0');
        const deltaY = newTop - originalTop;
        const minutesMoved = Math.round(deltaY / heightPerMinute);
        
        // Round to the nearest 15-minute slot
        const roundedMinutes = Math.round(minutesMoved / 15) * 15;
        
        // Calculate the updated times
        const originalStart = new Date(draggedAppointment.start_time);
        const originalEnd = new Date(draggedAppointment.end_time);
        const durationMinutes = differenceInMinutes(originalEnd, originalStart);
        
        // Create new dates with the same day but moved time
        const newStart = new Date(originalStart);
        newStart.setMinutes(newStart.getMinutes() + roundedMinutes);
        
        const newEnd = new Date(newStart);
        newEnd.setMinutes(newEnd.getMinutes() + durationMinutes);
        
        // Format for database
        const formattedStartTime = format(newStart, "yyyy-MM-dd'T'HH:mm");
        const formattedEndTime = format(newEnd, "yyyy-MM-dd'T'HH:mm");
        
        // Hide the overlay
        dragOverlay.style.display = 'none';
        
        // Reset the original appointment opacity
        const appointmentElement = document.querySelector(`[data-appointment-id="${draggedAppointment.id}"]`) as HTMLElement;
        if (appointmentElement) {
            appointmentElement.style.opacity = '1';
        }
        
        // Reset dragging state
        isDragging = false;
        
        // Update the local data immediately (optimistic update)
        appointments = appointments.map(a => {
            if (a.id === draggedAppointment?.id) {
                return {
                    ...a,
                    start_time: formattedStartTime,
                    end_time: formattedEndTime
                };
            }
            return a;
        });
        
        // Notify the parent component
        dispatch('appointmentMoved', {
            appointment: draggedAppointment,
            newStartTime: formattedStartTime,
            newEndTime: formattedEndTime
        });
        
        // Reset the dragged appointment
        draggedAppointment = null;
    }
    
    onMount(() => {
        // Set the height per minute based on actual element sizes
        const hourElement = document.querySelector('.time-slot');
        if (hourElement) {
            heightPerMinute = hourElement.clientHeight / 60; // 60 minutes per hour
        }
    });
</script>

<div class="calendar" bind:this={calendarContainer}>
    <div class="p-4 bg-white border-b flex justify-between">
        <div class="flex items-center space-x-2">
            <button 
                class="p-2 rounded-md hover:bg-gray-100 text-gray-600"
                on:click={() => view = 'day'}
                class:bg-indigo-50={view === 'day'}
                class:text-indigo-600={view === 'day'}
                aria-label="Switch to day view"
            >
                Day
            </button>
            <button 
                class="p-2 rounded-md hover:bg-gray-100 text-gray-600"
                on:click={() => view = 'week'}
                class:bg-indigo-50={view === 'week'}
                class:text-indigo-600={view === 'week'}
                aria-label="Switch to week view"
            >
                Week
            </button>
            <button 
                class="p-2 rounded-md hover:bg-gray-100 text-gray-600"
                on:click={() => view = 'month'}
                class:bg-indigo-50={view === 'month'}
                class:text-indigo-600={view === 'month'}
                aria-label="Switch to month view"
            >
                Month
            </button>
        </div>
        <div class="flex items-center">
            <button 
                class="p-2 rounded-md hover:bg-gray-100 text-gray-600 flex items-center"
                on:click={view === 'month' ? () => currentDate = addDays(currentDate, -7) : view === 'week' ? () => currentDate = addDays(currentDate, -7) : () => currentDate = addDays(currentDate, -1)}
                aria-label="Previous {view}"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
            </button>
            <span class="font-medium text-gray-900 mx-2">
                {#if view === 'month'}
                    {format(currentDate, 'MMMM yyyy')}
                {:else if view === 'week'}
                    {format(addDays(currentDate, -3), 'MMM d')} - {format(addDays(currentDate, 3), 'MMM d, yyyy')}
                {:else}
                    {format(currentDate, 'EEEE, MMMM d, yyyy')}
                {/if}
            </span>
            <button 
                class="p-2 rounded-md hover:bg-gray-100 text-gray-600 flex items-center"
                on:click={view === 'month' ? () => currentDate = addDays(currentDate, 7) : view === 'week' ? () => currentDate = addDays(currentDate, 7) : () => currentDate = addDays(currentDate, 1)}
                aria-label="Next {view}"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
            </button>
        </div>
    </div>

    <div class="calendar-body p-4">
        {#if view === 'month'}
            <div class="grid grid-cols-7 gap-2">
                <!-- Weekday headers -->
                <div class="text-center font-medium text-gray-500 pb-2">Sun</div>
                <div class="text-center font-medium text-gray-500 pb-2">Mon</div>
                <div class="text-center font-medium text-gray-500 pb-2">Tue</div>
                <div class="text-center font-medium text-gray-500 pb-2">Wed</div>
                <div class="text-center font-medium text-gray-500 pb-2">Thu</div>
                <div class="text-center font-medium text-gray-500 pb-2">Fri</div>
                <div class="text-center font-medium text-gray-500 pb-2">Sat</div>

                <!-- Day cells -->
                {#each Array(daysToShow).fill(0).map((_, i) => addDays(dayStart, i)) as day}
                    <div 
                        class="calendar-day min-h-[100px] border rounded-md p-1 overflow-hidden
                            {!isSameMonth(day, currentDate) ? 'bg-gray-50 text-gray-400' : ''} 
                            {isToday(day) ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'}"
                        role="gridcell"
                    >
                        <div class="day-header flex justify-between items-center mb-1">
                            <span class="text-sm font-medium {isToday(day) ? 'text-indigo-600' : 'text-gray-700'}">
                                {format(day, 'd')}
                            </span>
                            {#if isSameMonth(day, currentDate)}
                                <button 
                                    class="text-gray-400 hover:text-indigo-600 text-xs" 
                                    aria-label="Add appointment on {format(day, 'MMMM d')}"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 01-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                            {/if}
                        </div>
                        <div class="appointments text-xs space-y-1 overflow-y-auto max-h-[80px]">
                            {#each visibleAppointments.filter(appointment => isSameDay(parseISO(appointment.start_time), day)) as appointment}
                                <div 
                                    class="appointment bg-indigo-100 text-indigo-800 p-1 rounded overflow-hidden flex flex-col cursor-pointer hover:bg-indigo-200 transition-colors"
                                    on:click={() => dispatch('appointmentClick', { id: appointment.id })}
                                    on:keydown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            dispatch('appointmentClick', { id: appointment.id });
                                        }
                                    }}
                                    role="button"
                                    tabindex="0"
                                    data-appointment-id={appointment.id}
                                >
                                    <span class="time font-medium">{format(new Date(appointment.start_time), 'h:mm a')}</span>
                                    <span class="client truncate">{appointment.client?.name}</span>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>

        {:else if view === 'week'}
            <div class="week-view grid" style="grid-template-columns: 50px repeat({daysToShow}, 1fr);" role="grid">
                <!-- Time labels column -->
                <div class="time-labels" role="row">
                    <div class="h-12"></div> <!-- Empty cell for the header row -->
                    {#each timeSlots as time}
                        <div class="time-label h-16 text-xs text-gray-500 text-right pr-2" role="gridcell">
                            {time}
                        </div>
                    {/each}
                </div>
                
                <!-- Day columns -->
                {#each Array(daysToShow).fill(0).map((_, i) => addDays(dayStart, i)) as day, dayIndex}
                    <div class="day-column" role="row">
                        <!-- Day header -->
                        <div class="day-header p-2 text-center border-b border-gray-200 h-12 flex flex-col justify-center {isToday(day) ? 'bg-indigo-50' : ''}" role="rowheader">
                            <div class="text-sm font-medium {isToday(day) ? 'text-indigo-600' : 'text-gray-700'}">{format(day, 'EEE')}</div>
                            <div class="text-xs text-gray-500">{format(day, 'MMM d')}</div>
                        </div>
                        
                        <!-- Time grid for this day -->
                        <div class="time-grid relative" role="grid">
                            {#each timeSlots as time}
                                <div class="hour-slot h-16 border-b border-gray-100 relative time-slot" role="row">
                                    <!-- Quarter-hour grid lines -->
                                    <div class="quarter-hour absolute w-full h-px bg-gray-100" style="top: 25%;"></div>
                                    <div class="quarter-hour absolute w-full h-px bg-gray-100" style="top: 50%;"></div>
                                    <div class="quarter-hour absolute w-full h-px bg-gray-100" style="top: 75%;"></div>
                                </div>
                            {/each}
                            
                            <!-- Appointments for this day -->
                            {#each visibleAppointments.filter(appointment => isSameDay(parseISO(appointment.start_time), day)) as appointment}
                                <div 
                                    class="appointment absolute w-full bg-indigo-100 text-indigo-800 rounded-md p-2 overflow-hidden cursor-grab border border-indigo-200 transition-shadow hover:shadow-md"
                                    style={getAppointmentStyle(appointment)}
                                    data-appointment-id={appointment.id}
                                    on:mousedown={(e) => handleDragStart(appointment, e)}
                                    on:touchstart={(e) => handleDragStart(appointment, e)}
                                    on:click={(e) => {
                                        if (!isDragging) dispatch('appointmentClick', { id: appointment.id });
                                        e.stopPropagation();
                                    }}
                                    on:keydown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            dispatch('appointmentClick', { id: appointment.id });
                                        }
                                    }}
                                    role="button"
                                    tabindex="0"
                                >
                                    <div class="text-xs text-indigo-900">{format(new Date(appointment.start_time), 'h:mm a')}</div>
                                    <div class="text-sm font-semibold truncate">{appointment.client?.name}</div>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>
        {:else}
            <!-- Day view -->
            <div class="day-view grid" style="grid-template-columns: 50px 1fr;" role="grid">
                <!-- Time labels column -->
                <div class="time-labels" role="row">
                    {#each timeSlots as time}
                        <div class="time-label h-16 text-xs text-gray-500 text-right pr-2" role="gridcell">
                            {time}
                        </div>
                    {/each}
                </div>
                
                <!-- Day column -->
                <div class="day-column">
                    <!-- Day header -->
                    <div class="day-header p-2 text-center border-b border-gray-200 bg-indigo-50">
                        <div class="text-indigo-600 font-medium">{format(currentDate, 'EEEE')}</div>
                    </div>
                    
                    {#each timeSlots as time}
                        <div class="hour-slot h-16 border-b border-gray-100 relative" role="row">
                            <!-- Quarter-hour grid lines -->
                            <div class="quarter-hour absolute w-full h-px bg-gray-100" style="top: 25%;"></div>
                            <div class="quarter-hour absolute w-full h-px bg-gray-100" style="top: 50%;"></div>
                            <div class="quarter-hour absolute w-full h-px bg-gray-100" style="top: 75%;"></div>
                        </div>
                    {/each}
                    
                    <!-- Appointments for this day -->
                    {#each visibleAppointments as appointment}
                        <div 
                            class="appointment absolute w-full bg-indigo-100 text-indigo-800 rounded-md p-2 overflow-hidden cursor-grab border border-indigo-200 transition-shadow hover:shadow-md"
                            style={getAppointmentStyle(appointment)}
                            data-appointment-id={appointment.id}
                            on:mousedown={(e) => handleDragStart(appointment, e)}
                            on:touchstart={(e) => handleDragStart(appointment, e)}
                            on:click={(e) => {
                                if (!isDragging) dispatch('appointmentClick', { id: appointment.id });
                                e.stopPropagation();
                            }}
                            on:keydown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    dispatch('appointmentClick', { id: appointment.id });
                                }
                            }}
                            role="button"
                            tabindex="0"
                        >
                            <div class="text-xs text-indigo-900">{format(new Date(appointment.start_time), 'h:mm a')}</div>
                            <div class="text-sm font-semibold truncate">{appointment.client?.name}</div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    .calendar {
        width: 100%;
        height: auto;
        min-height: 600px;
        overflow: hidden;
        position: relative;
    }
    
    .time-grid {
        min-height: calc((var(--business-hours) * 4rem));
        height: 100%;
    }
    
    .appointment {
        left: 0.5rem;
        right: 0.5rem;
        width: auto;
    }
    
    /* This class is applied dynamically during drag operations */
    :global(.appointment.dragging) {
        opacity: 0.7;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        z-index: 50;
    }
    
    .day-column {
        border-right: 1px solid #f3f4f6;
        border-left: 1px solid #f3f4f6;
    }
</style>