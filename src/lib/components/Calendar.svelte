<script lang="ts">
    import { onMount, createEventDispatcher, tick } from 'svelte';
    import { DateTime } from 'luxon';
    import { browser } from '$app/environment';
    import { parseDbDate, getHour, getMinutes, getCalendarDayIndex, getMinutesFromBusinessStart, getDurationMinutes, debugDate, parseDateToLuxon, formatSalonTime, formatHour } from '$lib/utils/timeUtils';
    import type { Appointment } from '$lib/types';
    import AppointmentCard from './AppointmentCard.svelte';

    const dispatch = createEventDispatcher<{
        appointmentMoved: { appointment: Appointment; newStartTime: string; newEndTime: string };
        editAppointment: { id: string };
        createAppointment: { startDate: DateTime };
        appointmentClick: { appointment: Appointment };
    }>();

    export let initialDate = new Date();
    export let view: 'month' | 'week' | 'day' = 'week';
    export let appointments: Appointment[] = [];
    export let businessHours = { 
        start: 8, // Start at 8:00 AM 
        end: 18   // End at 6:00 PM
    };

    let currentDate = DateTime.fromJSDate(initialDate);
    let selectedDate = DateTime.fromJSDate(initialDate);
    let visibleDays: DateTime[] = [];
    let dayColumns: Array<{ date: DateTime, appointments: Appointment[] }> = [];
    let eventDetails: { x: number, y: number, appointment: Appointment } | null = null;
    let weekView: HTMLElement;
    let calendarContainer: HTMLElement;

    // Salon timezone from our timeUtils
    const SALON_TIMEZONE = 'America/Denver'; // This should match what's in timeUtils.ts

    // State for expanded appointment (modal for showing details)
    let expandedAppointment: Appointment | null = null;
    let expandedAppointmentId: string | null = null;

    // Update visible days when view or selected date changes
    $: if (selectedDate && view) {
        updateVisibleDays();
    }

    // Update dayColumns whenever visibleDays or appointments change
    $: if (visibleDays.length > 0 && appointments) {
        updateDayColumns();
    }

    function updateVisibleDays() {
        console.log('Updating visible days for view:', view);
        visibleDays = getVisibleDays(selectedDate, view);
    }

    // Get days that should be visible based on current view and selected date
    function getVisibleDays(date: DateTime, viewType: 'month' | 'week' | 'day'): DateTime[] {
        const days: DateTime[] = [];
        
        if (viewType === 'day') {
            // Day view - just the selected date
            days.push(date);
        } 
        else if (viewType === 'week') {
            // Week view - get all days in the week
            // Start from Monday (Luxon weekday=1) of the current week
            let weekStart = date.startOf('week');
            
            // Add each day of the week
            for (let i = 0; i < 7; i++) {
                days.push(weekStart.plus({ days: i }));
            }
        } 
        else { // month view
            // Month view - Grid of dates for the month
            // First get the start of the month
            const monthStart = date.startOf('month');
            
            // Then find the Monday before or on the start of the month
            // Luxon: 1=Monday, 7=Sunday
            let weekStart = monthStart;
            while (weekStart.weekday !== 1) {
                weekStart = weekStart.minus({ days: 1 });
            }
            
            // Add 42 days (6 weeks) to ensure we cover the full month plus surrounding dates
            for (let i = 0; i < 42; i++) {
                days.push(weekStart.plus({ days: i }));
            }
        }
        
        return days;
    }

    // Function to navigate dates in the calendar
    function navigateDate(direction: 'prev' | 'next' | 'today') {
        if (direction === 'today') {
            selectedDate = DateTime.now();
        } else if (direction === 'prev') {
            if (view === 'day') {
                selectedDate = selectedDate.minus({ days: 1 });
            } else if (view === 'week') {
                selectedDate = selectedDate.minus({ weeks: 1 });
            } else { // month
                selectedDate = selectedDate.minus({ months: 1 });
            }
        } else if (direction === 'next') {
            if (view === 'day') {
                selectedDate = selectedDate.plus({ days: 1 });
            } else if (view === 'week') {
                selectedDate = selectedDate.plus({ weeks: 1 });
            } else { // month
                selectedDate = selectedDate.plus({ months: 1 });
            }
        }
        updateVisibleDays();
    }

    function updateDayColumns() {
        // Reset day columns
        dayColumns = [];

        // Create a column for each visible day
        visibleDays.forEach(day => {
            // Find appointments for this day
            const dayAppointments = appointments.filter(appointment => {
                try {
                    const appointmentDate = parseDateToLuxon(appointment.start_time);
                    // Check if the appointment date matches the current day (comparing in same timezone)
                    return appointmentDate.hasSame(day, 'day');
                } catch (error) {
                    console.error('Error parsing appointment date:', error);
                    return false;
                }
            });

            dayColumns.push({
                date: day,
                appointments: dayAppointments
            });
        });
    }

    // Function to calculate the style for an appointment based on its start and end time
    function getAppointmentStyle(appointment: Appointment, dayIndex?: number): string {
        try {
            const startDate = parseDateToLuxon(appointment.start_time);
            const endDate = parseDateToLuxon(appointment.end_time);
            
            if (view === 'week' || view === 'day') {
                // Calculate time position (vertical positioning)
                const dayStart = businessHours.start;
                const startHour = startDate.hour;
                const startMinute = startDate.minute;
                
                // Minutes since start of business day
                const minutesSinceStart = (startHour - dayStart) * 60 + startMinute;
                
                // Each hour is 60px tall
                const pixelsPerMinute = 60 / 60; // 1px per minute
                const topPosition = minutesSinceStart * pixelsPerMinute;
                
                // Duration in minutes for height calculation
                const durationMinutes = endDate.diff(startDate, 'minutes').minutes;
                const height = Math.max(30, durationMinutes * pixelsPerMinute); // Minimum 30px
                
                if (view === 'week') {
                    // Align with the left margin of the day column
                    // No need for complex calculation, the parent element already has the correct position
                    return `position: absolute; top: ${topPosition}px; height: ${height}px; left: 0;`;
                } else { // day view
                    return `position: absolute; top: ${topPosition}px; height: ${height}px; left: 0;`;
                }
            } else {
                // Month view doesn't use this positioning
                return '';
            }
        } catch (error) {
            console.error('Error calculating appointment style:', error);
            return 'display: none;';
        }
    }

    // Check if appointment is visible in the current week view
    function isVisibleInWeekView(appointment: Appointment): boolean {
        try {
            const appointmentDate = parseDateToLuxon(appointment.start_time);
            return visibleDays.some(day => day.hasSame(appointmentDate, 'day'));
        } catch (error) {
            console.error('Error checking if appointment is visible in week view:', error);
            return false;
        }
    }

    // Check if appointment is visible in the current day view
    function isVisibleInDayView(appointment: Appointment): boolean {
        try {
            if (!visibleDays.length) return false;
            const appointmentDate = parseDateToLuxon(appointment.start_time);
            return appointmentDate.hasSame(visibleDays[0], 'day');
        } catch (error) {
            console.error('Error checking if appointment is visible in day view:', error);
            return false;
        }
    }

    // Handle clicking on a time slot to potentially create a new appointment
    function handleTimeClick(event: MouseEvent | KeyboardEvent, day: DateTime, hour: number) {
        // Different handling for mouse vs keyboard events
        let startTime: DateTime;
        
        if (event instanceof MouseEvent) {
            // For mouse clicks, calculate the precise minute based on click position
            const rect = (event.target as HTMLElement).getBoundingClientRect();
            const y = event.clientY - rect.top;
            
            // Convert position to minutes (assuming 60px = 60 minutes)
            const minuteRatio = y / 60;
            const minutes = Math.floor(minuteRatio * 60);
            
            // Create DateTime for the clicked time
            startTime = day.set({ hour, minute: minutes });
        } else {
            // For keyboard events (Enter key), use the start of the hour
            startTime = day.set({ hour, minute: 0 });
        }
        
        // End time is 1 hour after start by default
        const endTime = startTime.plus({ hours: 1 });
        
        console.log(`Time clicked: ${startTime.toFormat('yyyy-MM-dd HH:mm')} - ${endTime.toFormat('HH:mm')}`);
        
        // Dispatch the create appointment event
        dispatch('createAppointment', { startDate: startTime });
    }

    // Calculate percentage for positioning based on minutes
    function getMinutePercentage(minutes: number): number {
        return (minutes / 60) * 100;
    }

    // Handle appointment clicked
    async function handleAppointmentClick(appointment: Appointment, event: MouseEvent | null = null) {
        // Prevent bubbling to avoid triggering time slot click
        if (event) event.stopPropagation();
        
        // Dispatch event for parent component to handle
        dispatch('appointmentClick', { appointment });
    }

    // Drag and drop functionality
    let isDragging = false;
    let draggedAppointment: Appointment | null = null;
    let overlayAppointment: Appointment | null = null;
    let dragOverlay: HTMLElement | null = null;
    let currentX = 0;
    let heightPerMinute = 1; // Will be calculated based on business hours
    let originalTop = 0;
    let originalLeft = 0;
    let dayColumnWidth = 0;

    // For drag and drop
    function handleDragStart(appointment: Appointment, event: MouseEvent | TouchEvent) {
        if (!browser) return;
        
        event.preventDefault();

        // Set up dragging state
        isDragging = true;
        draggedAppointment = appointment;
        
        // Create a clone of the appointment for the overlay
        overlayAppointment = {...appointment};
        
        // Set up the drag overlay
        const target = event.target as HTMLElement;
        const rect = target.getBoundingClientRect();
        
        originalTop = rect.top;
        originalLeft = rect.left;
        dayColumnWidth = rect.width;
        
        // Create the drag overlay
        dragOverlay = document.createElement('div');
        dragOverlay.className = 'drag-overlay';
        dragOverlay.style.position = 'fixed';
        dragOverlay.style.top = rect.top + 'px';
        dragOverlay.style.left = rect.left + 'px';
        dragOverlay.style.width = rect.width + 'px';
        dragOverlay.style.height = rect.height + 'px';
        dragOverlay.style.backgroundColor = 'rgba(66, 153, 225, 0.8)';
        dragOverlay.style.borderRadius = '4px';
        dragOverlay.style.zIndex = '1000';
        dragOverlay.style.pointerEvents = 'none';
        dragOverlay.style.transition = 'none';
        dragOverlay.style.opacity = '0.7';
        
        // Add text to the overlay
        const titleElement = document.createElement('div');
        titleElement.textContent = appointment.client?.name || 'Appointment';
        titleElement.style.padding = '4px';
        titleElement.style.fontSize = '12px';
        titleElement.style.fontWeight = 'bold';
        titleElement.style.color = 'white';
        titleElement.style.overflow = 'hidden';
        titleElement.style.whiteSpace = 'nowrap';
        titleElement.style.textOverflow = 'ellipsis';
        
        dragOverlay.appendChild(titleElement);
        document.body.appendChild(dragOverlay);
        
        // Set up event handlers
        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!isDragging || !dragOverlay) return;
            
            const dy = moveEvent.clientY - (event instanceof MouseEvent ? event.clientY : 0);
            
            // Update position
            dragOverlay.style.top = (originalTop + dy) + 'px';
            
            // Prevent dragging outside of week view
            if (weekView) {
                const weekViewRect = weekView.getBoundingClientRect();
                if (moveEvent.clientY < weekViewRect.top) {
                    dragOverlay.style.top = weekViewRect.top + 'px';
                } else if (moveEvent.clientY > weekViewRect.bottom) {
                    dragOverlay.style.top = (weekViewRect.bottom - parseInt(dragOverlay.style.height)) + 'px';
                }
            }
        };
        
        const handleMouseUp = () => {
            handleDragEnd();
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    function handleDragEnd() {
        if (!isDragging || !draggedAppointment || !overlayAppointment) return;

        if (!dragOverlay) {
            console.error('dragOverlay is null');
            return;
        }

        // Clean up
        document.body.removeChild(dragOverlay);
        dragOverlay = null;
        isDragging = false;
        draggedAppointment = null;
        overlayAppointment = null;
    }

    let dragStartY = 0;
    let dragStartHour = 0;
    let dragStartMinute = 0;
    let dragStartDay: DateTime | null = null;

    function handleAppointmentDragStart(event: CustomEvent<{appointment: Appointment, event: MouseEvent}>) {
        const { appointment, event: mouseEvent } = event.detail;
        
        isDragging = true;
        draggedAppointment = {...appointment};
        dragStartY = mouseEvent.clientY;
        
        // Get the time values
        const startDate = parseDateToLuxon(appointment.start_time);
        dragStartHour = startDate.hour;
        dragStartMinute = startDate.minute;
        dragStartDay = startDate.startOf('day');
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
    
    // Handle mouse movement during drag
    function handleMouseMove(event: MouseEvent) {
        if (!isDragging || !draggedAppointment || !dragStartDay) return;
        
        const cellHeight = 60; // Height of each hour cell in pixels
        const deltaY = event.clientY - dragStartY;
        
        // Calculate hour offset based on pixel movement (60px = 1 hour)
        const hourOffset = Math.floor(deltaY / cellHeight);
        
        // Update preview
        // Implementation would depend on your specific requirements
        console.log(`Dragging appointment by ${hourOffset} hours`);
    }
    
    // Handle mouse up to complete drag
    function handleMouseUp(event: MouseEvent) {
        if (isDragging && draggedAppointment) {
            // Finalize the appointment move
            // Implementation would depend on your specific requirements
            console.log('Drag ended, appointment would be updated here');
        }
        
        // Reset drag state
        isDragging = false;
        draggedAppointment = null;
        
        // Remove event listeners
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }

    onMount(() => {
        updateVisibleDays();
    });
</script>

<div class="calendar-container">
    <!-- Calendar header with navigation and view controls -->
    <div class="calendar-header">
        <!-- Left side with navigation -->
        <div class="calendar-nav">
            <button class="arrow-button" on:click={() => navigateDate('prev')} aria-label="Previous period">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
            </button>
            
            <button class="arrow-button" on:click={() => navigateDate('next')} aria-label="Next period">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </button>
            
            <button class="today-button" on:click={() => navigateDate('today')} aria-label="Go to today">
                Today
            </button>
            
            <div class="text-lg font-bold ml-3 text-gray-800" aria-live="polite">
                {#if view === 'day'}
                    <!-- Day view title -->
                    {selectedDate.toFormat('EEEE, MMMM d, yyyy')}
                {:else if view === 'week'}
                    <!-- Week view title - Square style -->
                    {visibleDays[0]?.toFormat('MMM d')} - {visibleDays[visibleDays.length - 1]?.toFormat('MMM d, yyyy')}
                {:else}
                    <!-- Month view title -->
                    {selectedDate.toFormat('MMMM yyyy')}
                {/if}
            </div>
        </div>
        
        <!-- Right side with view controls -->
        <div class="view-toggle">
            <button class={`view-button ${view === 'day' ? 'active' : ''}`} on:click={() => { view = 'day'; updateVisibleDays(); }} aria-pressed={view === 'day'} aria-label="Day view">
                Day
            </button>
            <button class={`view-button ${view === 'week' ? 'active' : ''}`} on:click={() => { view = 'week'; updateVisibleDays(); }} aria-pressed={view === 'week'} aria-label="Week view">
                Week
            </button>
            <button class={`view-button ${view === 'month' ? 'active' : ''}`} on:click={() => { view = 'month'; updateVisibleDays(); }} aria-pressed={view === 'month'} aria-label="Month view">
                Month
            </button>
        </div>
    </div>

    <!-- Calendar body -->
    <div class="calendar-body overflow-auto flex-grow relative">
        {#if view === 'week'}
            <!-- Square-style week view -->
            <div class="grid grid-cols-8 w-full h-full relative week-view" bind:this={weekView}>
                <!-- Time column -->
                <div class="border-r border-b">
                    <div class="sticky top-0 z-10 bg-white border-b time-header-cell"></div>
                    
                    {#each Array(businessHours.end - businessHours.start + 1) as _, i}
                        <div class="time-label border-b">
                            <span>{formatHour(businessHours.start + i)}</span>
                        </div>
                        <!-- Add half-hour marker -->
                        {#if i < businessHours.end - businessHours.start}
                            <div class="time-label border-b relative" style="height: 0;">
                                <div class="half-hour-marker"></div>
                            </div>
                        {/if}
                    {/each}
                </div>
                
                <!-- Day columns -->
                {#each visibleDays as day, dayIndex}
                    <div class="relative h-full" style="min-width: 0;">
                        <div class={`day-header border-r border-b p-2 text-center bg-white sticky top-0 z-10 ${day.hasSame(DateTime.now(), 'day') ? 'today-cell' : ''}`}>
                            <div class="date-day">{day.toFormat('EEE')}</div>
                            <div class={`date-number ${day.hasSame(DateTime.now(), 'day') ? 'today-date' : ''}`}>{day.toFormat('d')}</div>
                        </div>
                        
                        <!-- Hour cells for this day -->
                        {#each Array(businessHours.end - businessHours.start + 1) as _, hourIndex}
                            <button 
                                class={`time-cell border-r border-b relative ${day.hasSame(DateTime.now(), 'day') ? 'bg-blue-50/30' : ''}`}
                                style="height: 60px; text-align: left; width: 100%;"
                                data-hour={businessHours.start + hourIndex}
                                data-day={day.toFormat('yyyy-MM-dd')}
                                on:click={(e) => handleTimeClick(e, day, businessHours.start + hourIndex)}
                                on:keydown={(e) => e.key === 'Enter' && handleTimeClick(e, day, businessHours.start + hourIndex)}
                                aria-label="Create appointment on {day.toFormat('EEEE, MMMM d')} at {formatHour(businessHours.start + hourIndex)}"
                            >
                                <!-- Show current time indicator if this cell contains the current time -->
                                {#if day.hasSame(DateTime.now(), 'day') && DateTime.now().hour === (businessHours.start + hourIndex)}
                                    <div 
                                        class="current-time-indicator" 
                                        style="top: {Math.floor(DateTime.now().minute / 60 * 100)}%;"
                                    ></div>
                                {/if}
                                
                                <!-- Add half-hour marker -->
                                <div class="half-hour-marker"></div>
                            </button>
                        {/each}
                        
                        <!-- Appointment cards for this day column -->
                        {#each appointments.filter(a => {
                            const startDate = parseDateToLuxon(a.start_time);
                            return startDate.hasSame(day, 'day');
                        }) as appointment}
                            <svelte:component 
                                this={AppointmentCard} 
                                {appointment} 
                                view="week" 
                                style={getAppointmentStyle(appointment, dayIndex)}
                                isDragging={isDragging && draggedAppointment?.id === appointment.id}
                                on:click={(e) => handleAppointmentClick(appointment, e.detail.event)}
                                on:dragStart
                            />
                        {/each}
                    </div>
                {/each}
            </div>
        {:else if view === 'day'}
            <!-- Day view -->
            <div class="day-view grid border-t border-l" style="grid-template-columns: 60px 1fr;">
                <!-- Time labels column -->
                <div>
                    <div class="time-header-cell sticky top-0 z-10 bg-white border-b border-r h-16"></div>
                    
                    {#each Array(businessHours.end - businessHours.start + 1) as _, i}
                        <div class="time-label border-r border-b bg-gray-50">
                            {(businessHours.start + i) % 12 || 12} {(businessHours.start + i) >= 12 ? 'PM' : 'AM'}
                        </div>
                    {/each}
                </div>
                
                <!-- Day column -->
                <div>
                    <!-- Day header -->
                    <div class={`day-header border-r border-b p-2 text-center sticky top-0 z-10 bg-white ${visibleDays[0]?.hasSame(DateTime.now(), 'day') ? 'today-cell' : ''}`}>
                        <div class="date-day">{visibleDays[0]?.toFormat('EEE')}</div>
                        <div class={`date-number ${visibleDays[0]?.hasSame(DateTime.now(), 'day') ? 'today-date' : ''}`}>{visibleDays[0]?.toFormat('d')}</div>
                        <div class="text-sm">{visibleDays[0]?.toFormat('MMMM yyyy')}</div>
                    </div>
                    
                    <!-- Hour cells -->
                    {#each Array(businessHours.end - businessHours.start + 1) as _, i}
                        <button 
                            class={`time-cell border-r border-b relative ${visibleDays[0]?.hasSame(DateTime.now(), 'day') ? 'bg-blue-50/30' : ''}`}
                            style="height: 60px; text-align: left; width: 100%;"
                            data-hour={businessHours.start + i}
                            data-day={visibleDays[0]?.toFormat('yyyy-MM-dd')}
                            on:click={(e) => handleTimeClick(e, visibleDays[0], businessHours.start + i)}
                            on:keydown={(e) => e.key === 'Enter' && handleTimeClick(e, visibleDays[0], businessHours.start + i)}
                            aria-label="Create appointment at {visibleDays[0]?.toFormat('EEEE, MMMM d')} at {(businessHours.start + i) % 12 || 12} {(businessHours.start + i) >= 12 ? 'PM' : 'AM'}"
                        >
                            <!-- Half-hour marker -->
                            <div class="half-hour-marker"></div>
                            
                            <!-- Current time indicator (only show for today) -->
                            {#if visibleDays[0]?.hasSame(DateTime.now(), 'day') && DateTime.now().hour === (businessHours.start + i)}
                                <div class="current-time-indicator" style="top: {getMinutePercentage(DateTime.now().minute)}%;"></div>
                            {/if}
                        </button>
                    {/each}
                    
                    <!-- Render appointments for this day -->
                    {#each appointments.filter(apt => isVisibleInDayView(apt)) as appointment}
                        <svelte:component 
                            this={AppointmentCard} 
                            {appointment} 
                            view="day" 
                            style={getAppointmentStyle(appointment)} 
                            isDragging={isDragging && draggedAppointment?.id === appointment.id}
                            on:click={(e) => handleAppointmentClick(appointment, e.detail.event)}
                            on:dragStart
                        />
                    {/each}
                </div>
            </div>
        {:else}
            <!-- Month view - Square-style -->
            <div class="month-view">
                <div class="grid grid-cols-7 text-center">
                    <div class="py-2 font-medium text-gray-500">Sun</div>
                    <div class="py-2 font-medium text-gray-500">Mon</div>
                    <div class="py-2 font-medium text-gray-500">Tue</div>
                    <div class="py-2 font-medium text-gray-500">Wed</div>
                    <div class="py-2 font-medium text-gray-500">Thu</div>
                    <div class="py-2 font-medium text-gray-500">Fri</div>
                    <div class="py-2 font-medium text-gray-500">Sat</div>
                </div>
                
                <div class="grid grid-cols-7 border-t border-l">
                    {#each dayColumns as day}
                        <div class={`day-cell ${day.date.hasSame(DateTime.now(), 'day') ? 'today-cell' : ''} ${day.date.month !== selectedDate.month ? 'bg-gray-50 text-gray-400' : ''}`}>
                            <div class="text-right p-1">
                                <span class="inline-block w-6 h-6 rounded-full text-center ${day.date.hasSame(DateTime.now(), 'day') ? 'bg-blue-600 text-white' : ''} ">
                                    {day.date.day}
                                </span>
                            </div>
                            
                            <!-- Day's appointments -->
                            <div class="appointments-container flex flex-col gap-1 mt-1">
                                {#each day.appointments.slice(0, 3) as appointment}
                                    <svelte:component this={AppointmentCard} {appointment} view="month" />
                                {/each}
                                
                                {#if day.appointments.length > 3}
                                    <div class="text-xs text-gray-600 font-medium px-1">+{day.appointments.length - 3} more</div>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
</div>

<!-- Appointment Details Dialog -->
{#if expandedAppointment}
<dialog 
  class="appointment-details-modal p-0 rounded-lg shadow-xl w-[350px] bg-white overflow-hidden"
  open
  aria-labelledby="appointment-title"
>
  <div class="modal-header bg-blue-600 text-white p-4">
    <h3 id="appointment-title" class="text-lg font-bold">{expandedAppointment.client?.name || 'Unknown'}</h3>
    <div class="text-sm">{formatSalonTime(parseDateToLuxon(expandedAppointment.start_time).toJSDate(), 'EEEE, MMMM d')}</div>
  </div>
  
  <div class="modal-body p-4">
    <div class="flex items-center justify-between mb-4">
      <div>
        <div class="text-gray-600 text-sm">Time</div>
        <div class="font-medium">
          {formatSalonTime(parseDateToLuxon(expandedAppointment.start_time).toJSDate(), 'h:mm a')} - 
          {formatSalonTime(parseDateToLuxon(expandedAppointment.end_time).toJSDate(), 'h:mm a')}
        </div>
      </div>
      
      <div>
        <div class="text-gray-600 text-sm">Duration</div>
        <div class="font-medium">
          {Math.round(parseDateToLuxon(expandedAppointment.end_time).diff(parseDateToLuxon(expandedAppointment.start_time), 'minutes').minutes)} min
        </div>
      </div>
    </div>
    
    <div class="mb-4">
      <div class="text-gray-600 text-sm">Services</div>
      <div class="font-medium">{expandedAppointment.service_type || 'No services specified'}</div>
    </div>
    
    {#if expandedAppointment.notes}
      <div class="mb-4">
        <div class="text-gray-600 text-sm">Notes</div>
        <div class="font-medium">{expandedAppointment.notes}</div>
      </div>
    {/if}
  </div>
  
  <div class="modal-footer border-t p-3 flex justify-end space-x-2">
    <button 
      class="px-3 py-1.5 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
      on:click={() => expandedAppointment = null}
    >
      Close
    </button>
    <button 
      class="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
      on:click={() => {
        if (expandedAppointment && expandedAppointmentId) {
          dispatch('editAppointment', { id: expandedAppointmentId });
        }
        expandedAppointment = null;
      }}
    >
      Edit
    </button>
  </div>
</dialog>
{/if}

<style>
    /* Calendar container */
    .calendar-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: white;
        border-radius: 0.5rem;
        overflow: hidden;
    }

    /* Calendar header */
    .calendar-header {
        padding: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #e5e7eb;
    }

    /* Calendar navigation */
    .calendar-nav {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .today-button {
        padding: 0.25rem 0.75rem;
        border-radius: 0.375rem;
        background-color: #ebf5ff;
        color: #2563eb;
        font-size: 0.875rem;
        font-weight: 500;
    }

    .arrow-button {
        padding: 0.375rem;
        border-radius: 9999px;
        color: #374151;
    }
    
    .arrow-button:hover {
        background-color: #f3f4f6;
    }

    /* View toggle buttons */
    .view-toggle {
        display: flex;
        gap: 0.25rem;
        background-color: #f3f4f6;
        padding: 0.25rem;
        border-radius: 0.375rem;
    }

    .view-button {
        padding: 0.375rem 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        border-radius: 0.375rem;
    }

    .view-button.active {
        background-color: white;
        color: #2563eb;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }

    .view-button:not(.active) {
        color: #374151;
    }
    
    .view-button:not(.active):hover {
        background-color: #e5e7eb;
    }

    /* Week view */
    .week-view {
        grid-template-rows: auto repeat(var(--business-hours, 14), 60px);
    }

    /* Day headers */
    .day-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 4rem;
    }

    /* Time cells */
    .time-cell {
        position: relative;
        transition: background-color 0.2s;
        height: 60px;
    }

    .time-cell:hover {
        background-color: rgba(219, 234, 254, 0.4);
    }

    /* Time labels */
    .time-label {
        position: sticky;
        left: 0;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding-right: 0.5rem;
        font-size: 0.75rem;
        color: #4b5563;
        font-weight: 500;
        height: 60px;
        width: 60px;
    }

    /* Half-hour marker */
    .half-hour-marker {
        position: absolute;
        width: 100%;
        height: 1px;
        background-color: #e5e7eb;
        top: 50%;
    }

    /* Current time indicator */
    .current-time-indicator {
        position: absolute;
        width: 100%;
        height: 2px;
        background-color: #ef4444;
        z-index: 10;
    }

    /* Day cells for month view */
    .day-cell {
        min-height: 100px;
        padding: 0.25rem;
        position: relative;
        border: 1px solid #e5e7eb;
    }

    /* Making dates look more like Square */
    .date-number {
        font-size: 1.5rem;
        font-weight: 700;
    }

    .date-day {
        text-transform: uppercase;
        font-size: 0.75rem;
        font-weight: 500;
    }

    /* Current date highlight */
    .today-cell {
        background-color: #ebf5ff;
    }
    
    .today-date {
        color: #2563eb;
    }

    /* Calendar body */
    .calendar-body {
        overflow: auto;
        flex-grow: 1;
        position: relative;
    }

    /* Month view */
    .month-view {
        width: 100%;
    }
</style>