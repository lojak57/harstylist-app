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
        appointmentClick: { appointment: Appointment; event: MouseEvent | null };
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
                    // Position with a small margin from the left edge
                    return `position: absolute; top: ${topPosition}px; height: ${height}px; left: 4px; right: 4px;`;
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

    // Function to handle appointment clicks in the calendar
    function handleAppointmentClick(appointment: Appointment, event: MouseEvent | null) {
        // Don't trigger click if we're dragging
        if (isDragging) return;
        
        // Emit event to parent component
        dispatch('appointmentClick', { appointment, event });
    }

    // Variables to track drag state
    let isDragging = false;
    let draggedAppointment: Appointment | null = null;
    let originalAppointment: Appointment | null; // Store the original appointment
    let dragStartY = 0;
    let mouseOffsetY = 0; // Track the offset where the mouse clicked within the appointment
    let dragStartHour = 0;
    let dragStartMinute = 0;
    let dragStartDay: DateTime | null = null;
    let dragOverlay: HTMLElement | null = null;
    let originalRect: DOMRect | null = null;
    let initialMinutesSinceDayStart = 0;
    
    // Add resize-related state variables
    let isResizing = false; 
    let resizeHandle: 'top' | 'bottom' | null = null;
    let resizeStartY = 0;
    let resizedAppointment: Appointment | null = null;

    // Handle appointment drag start
    function handleAppointmentDragStart(event: CustomEvent<{appointment: Appointment, event: MouseEvent}>) {
        const { appointment, event: mouseEvent } = event.detail;
        
        // Store the original appointment data
        originalAppointment = { ...appointment };
        
        // Mark the appointment as being dragged
        isDragging = true;
        draggedAppointment = { ...appointment };
        dragStartY = mouseEvent.clientY;
        
        // Get the time values from the appointment
        const startDate = parseDateToLuxon(appointment.start_time);
        dragStartHour = startDate.hour;
        dragStartMinute = startDate.minute;
        dragStartDay = startDate.startOf('day');
        
        console.log('Starting drag from time:', startDate.toFormat('h:mm a'));
        
        // Get the original appointment element
        if (mouseEvent.target instanceof Element) {
            const originalAppointmentElement = mouseEvent.target.closest('.appointment, .month-appointment');
            if (originalAppointmentElement) {
                // Store the exact dimensions and position of the original appointment
                originalRect = originalAppointmentElement.getBoundingClientRect();
                
                // Calculate the mouse offset within the appointment
                mouseOffsetY = mouseEvent.clientY - originalRect.top;
                
                // Create a drag overlay based on the original element's exact position
                createDragOverlay(appointment, originalRect);
                
                // Calculate and store the initial position data for dragging reference
                const weekViewRect = weekView?.getBoundingClientRect();
                if (weekViewRect) {
                    const dayHeaderElement = document.querySelector('.day-header');
                    const headerHeight = dayHeaderElement ? dayHeaderElement.getBoundingClientRect().height : 0;
                    
                    // Store the grid position for the original appointment
                    const hourHeight = 60;
                    const minuteHeight = hourHeight / 60;
                    initialMinutesSinceDayStart = (dragStartHour - businessHours.start) * 60 + dragStartMinute;
                }
            }
        }
        
        // Add the mouse event listeners
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
    
    // Create the drag overlay
    function createDragOverlay(appointment: Appointment, rect: DOMRect) {
        // Create a div for the drag overlay
        dragOverlay = document.createElement('div');
        dragOverlay.className = 'appointment-drag-overlay';
        
        // Set styles for fixed positioning at the original position
        dragOverlay.style.position = 'fixed';
        dragOverlay.style.top = `${rect.top}px`;
        dragOverlay.style.left = `${rect.left}px`;
        dragOverlay.style.width = `${rect.width}px`;
        dragOverlay.style.height = `${rect.height}px`;
        dragOverlay.style.backgroundColor = '#3498db'; // Default blue color for all appointments
        dragOverlay.style.borderRadius = '4px';
        dragOverlay.style.padding = '4px 8px';
        dragOverlay.style.boxSizing = 'border-box';
        dragOverlay.style.zIndex = '1000';
        dragOverlay.style.opacity = '0.8';
        dragOverlay.style.color = '#fff';
        dragOverlay.style.overflow = 'hidden';
        dragOverlay.style.display = 'flex';
        dragOverlay.style.flexDirection = 'column';
        
        // Add the client name
        const clientName = document.createElement('div');
        clientName.className = 'client-name';
        if (appointment.client?.name) {
            clientName.textContent = appointment.client.name;
            clientName.style.fontWeight = 'bold';
        }
        dragOverlay.appendChild(clientName);
        
        // Add the time display
        const timeDisplay = document.createElement('div');
        timeDisplay.className = 'time-display';
        if (timeDisplay instanceof HTMLElement) {
            timeDisplay.style.fontSize = '10px';
            timeDisplay.style.marginTop = 'auto';
            
            // Format and display the time
            const startTime = parseDateToLuxon(appointment.start_time);
            const endTime = parseDateToLuxon(appointment.end_time);
            timeDisplay.textContent = `${startTime.toFormat('h:mm a')} - ${endTime.toFormat('h:mm a')}`;
        }
        dragOverlay.appendChild(timeDisplay);
        
        // Append the overlay to the body
        document.body.appendChild(dragOverlay);
        
        return dragOverlay;
    }
    
    // Handle mouse movement during drag or resize
    function handleMouseMove(event: MouseEvent) {
        if (isDragging && dragOverlay) {
            // Calculate vertical movement
            const deltaY = event.clientY - dragStartY;
            
            // Update overlay position directly based on mouse movement
            if (originalRect) {
                // Simply move the overlay by the amount the mouse has moved
                dragOverlay.style.top = `${originalRect.top + deltaY}px`;
            }
            
            // During the drag, we'll just update the visual time display
            // without actually calculating the final appointment times
            updateDragTimeDisplay(event);
        }
        else if (isResizing && dragOverlay && resizeHandle && resizedAppointment && originalAppointment && originalRect) {
            // Handle resizing logic
            const deltaY = event.clientY - resizeStartY;
            
            // Update the overlay shape based on which handle is being dragged
            if (resizeHandle === 'top') {
                // Resize from the top - adjust top position and height
                const newTop = originalRect.top + deltaY;
                const newHeight = originalRect.height - deltaY;
                
                // Don't allow the appointment to become too small (minimum 15 min)
                const minHeight = 15; // 15 pixels represents 15 minutes
                if (newHeight >= minHeight) {
                    dragOverlay.style.top = `${newTop}px`;
                    dragOverlay.style.height = `${newHeight}px`;
                }
            } else if (resizeHandle === 'bottom') {
                // Resize from the bottom - just adjust height
                const newHeight = originalRect.height + deltaY;
                
                // Don't allow the appointment to become too small (minimum 15 min)
                const minHeight = 15; // 15 pixels represents 15 minutes
                if (newHeight >= minHeight) {
                    dragOverlay.style.height = `${newHeight}px`;
                }
            }
            
            // Update the time display based on the new dimensions
            updateResizeTimeDisplay(event);
        }
    }
    
    // Update just the time display during drag without changing the appointment times yet
    function updateDragTimeDisplay(event: MouseEvent) {
        if (!draggedAppointment || !dragStartDay || !originalAppointment || !dragOverlay) return;
        
        // Get the week view element to calculate relative positions
        const weekViewRect = weekView?.getBoundingClientRect();
        if (!weekViewRect) return;
        
        // Get the header height to offset calculations
        const dayHeaderElement = document.querySelector('.day-header');
        const headerHeight = dayHeaderElement ? dayHeaderElement.getBoundingClientRect().height : 0;
        
        // Each hour is 60px tall
        const hourHeight = 60;
        const minuteHeight = hourHeight / 60;
        
        // Calculate vertical movement
        const deltaY = event.clientY - dragStartY;
        
        // Convert movement to time change
        const minutesChange = Math.round(deltaY / minuteHeight);
        
        // Calculate new time from original time
        const originalStartTime = parseDateToLuxon(originalAppointment.start_time);
        let newStartTime = originalStartTime.plus({ minutes: minutesChange });
        
        // Snap to nearest 15-minute interval
        const snapInterval = 15;
        const minuteValue = newStartTime.minute;
        const remainder = minuteValue % snapInterval;
        
        if (remainder > 0) {
            // Round to nearest 15 min
            const snapMinutes = remainder < (snapInterval / 2) 
                ? -remainder 
                : (snapInterval - remainder);
            
            newStartTime = newStartTime.plus({ minutes: snapMinutes });
        }
        
        // Ensure we're within business hours
        if (newStartTime.hour < businessHours.start) {
            newStartTime = newStartTime.set({ hour: businessHours.start, minute: 0 });
        } else if (newStartTime.hour >= businessHours.end) {
            newStartTime = newStartTime.set({ hour: businessHours.end - 1, minute: 45 }); // Last 15-minute slot
        }
        
        // Calculate new end time for display
        const originalEndTime = parseDateToLuxon(originalAppointment.end_time);
        const durationMinutes = originalEndTime.diff(originalStartTime, 'minutes').minutes;
        const newEndTime = newStartTime.plus({ minutes: durationMinutes });
        
        // Only update the time display in the overlay, not the appointment times yet
        const timeDisplay = dragOverlay.querySelector('.time-display');
        if (timeDisplay instanceof HTMLElement) {
            timeDisplay.textContent = `${newStartTime.toFormat('h:mm a')} - ${newEndTime.toFormat('h:mm a')}`;
        }
    }
    
    // Handle mouse up to complete drag
    function finalizeAppointmentTime(event: MouseEvent) {
        if (!draggedAppointment || !dragStartDay || !originalAppointment) return;
        
        // Get the week view element to calculate relative positions
        const weekViewRect = weekView?.getBoundingClientRect();
        if (!weekViewRect) return;
        
        // Get the header height to offset calculations
        const dayHeaderElement = document.querySelector('.day-header');
        const headerHeight = dayHeaderElement ? dayHeaderElement.getBoundingClientRect().height : 0;
        
        // Each hour is 60px tall in our grid
        const hourHeight = 60;
        const minuteHeight = hourHeight / 60;
        
        // Calculate vertical movement
        const deltaY = event.clientY - dragStartY;
        
        // Convert movement to time change
        const minutesChange = Math.round(deltaY / minuteHeight);
        
        // Calculate new time from original time
        const originalStartTime = parseDateToLuxon(originalAppointment.start_time);
        let newStartTime = originalStartTime.plus({ minutes: minutesChange });
        
        // Snap to nearest 15-minute interval
        const snapInterval = 15;
        const minuteValue = newStartTime.minute;
        const remainder = minuteValue % snapInterval;
        
        if (remainder > 0) {
            // Round to nearest 15 min
            const snapMinutes = remainder < (snapInterval / 2) 
                ? -remainder 
                : (snapInterval - remainder);
            
            newStartTime = newStartTime.plus({ minutes: snapMinutes });
        }
        
        // Ensure we're within business hours
        if (newStartTime.hour < businessHours.start) {
            newStartTime = newStartTime.set({ hour: businessHours.start, minute: 0 });
        } else if (newStartTime.hour >= businessHours.end) {
            newStartTime = newStartTime.set({ hour: businessHours.end - 1, minute: 45 }); // Last 15-minute slot
        }
        
        // Calculate new end time  
        const originalEndTime = parseDateToLuxon(originalAppointment.end_time);
        const durationMinutes = originalEndTime.diff(originalStartTime, 'minutes').minutes;
        const newEndTime = newStartTime.plus({ minutes: durationMinutes });
        
        // Update the appointment times
        draggedAppointment.start_time = newStartTime.toISO() as string;
        draggedAppointment.end_time = newEndTime.toISO() as string;
    }
    
    // Handle appointment resize start
    function handleAppointmentResizeStart(detail: {appointment: Appointment, event: MouseEvent, handle: 'top' | 'bottom'}) {
        const { appointment, event: mouseEvent, handle } = detail;
        
        // Store the original appointment data
        originalAppointment = { ...appointment };
        
        // Store resize specific state
        isResizing = true;
        resizeHandle = handle;
        resizedAppointment = { ...appointment };
        resizeStartY = mouseEvent.clientY;
        
        console.log(`Starting resize from ${handle} handle for:`, appointment.id);
        
        // Get the original appointment element
        if (mouseEvent.target instanceof Element) {
            const originalAppointmentElement = mouseEvent.target.closest('.appointment, .month-appointment');
            if (originalAppointmentElement) {
                // Store the exact dimensions and position of the original appointment
                originalRect = originalAppointmentElement.getBoundingClientRect();
                
                // Create a resize overlay based on the original element's exact position
                createResizeOverlay(appointment, originalRect, handle);
                
                // Add event listeners for resizing
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            }
        }
    }
    
    // Create a resize overlay
    function createResizeOverlay(appointment: Appointment, rect: DOMRect, handle: 'top' | 'bottom') {
        // Create a div for the resize overlay - similar to drag overlay
        dragOverlay = document.createElement('div');
        dragOverlay.className = 'resize-overlay';
        dragOverlay.style.position = 'fixed';
        dragOverlay.style.zIndex = '1000';
        dragOverlay.style.left = `${rect.left}px`;
        dragOverlay.style.top = `${rect.top}px`;
        dragOverlay.style.width = `${rect.width}px`;
        dragOverlay.style.height = `${rect.height}px`;
        dragOverlay.style.backgroundColor = '#dbeafe';
        dragOverlay.style.borderLeft = '3px solid #3b82f6';
        dragOverlay.style.borderRadius = '3px';
        dragOverlay.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        dragOverlay.style.pointerEvents = 'none'; // Don't block mouse events
        
        // Add a resizing indicator
        dragOverlay.style.borderColor = '#ef4444';
        
        // Add a time display
        const timeDisplay = document.createElement('div');
        timeDisplay.className = 'time-display';
        timeDisplay.style.padding = '0.25rem';
        timeDisplay.style.fontWeight = 'bold';
        timeDisplay.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        timeDisplay.style.borderRadius = '2px';
        timeDisplay.style.position = 'absolute';
        timeDisplay.style.top = '2px';
        timeDisplay.style.left = '2px';
        timeDisplay.style.fontSize = '10px';
        
        // Calculate the display times
        const startTime = parseDateToLuxon(appointment.start_time);
        const endTime = parseDateToLuxon(appointment.end_time);
        timeDisplay.textContent = `${startTime.toFormat('h:mm a')} - ${endTime.toFormat('h:mm a')}`;
        
        dragOverlay.appendChild(timeDisplay);
        
        // Append the overlay to the body
        document.body.appendChild(dragOverlay);
        
        return dragOverlay;
    }
    
    // Update the resize overlay time display
    function updateResizeTimeDisplay(event: MouseEvent) {
        if (!isResizing || !dragOverlay || !resizeHandle || !originalAppointment || !resizedAppointment) return;
        
        // Get the week view element to calculate relative positions
        const weekViewRect = weekView?.getBoundingClientRect();
        if (!weekViewRect) return;
        
        // Each hour is 60px tall in our grid
        const hourHeight = 60;
        const minuteHeight = hourHeight / 60;
        
        // Calculate vertical movement
        const deltaY = event.clientY - resizeStartY;
        
        // Convert movement to minute changes (positive for moving down, negative for moving up)
        const minutesChange = Math.round(deltaY / minuteHeight);
        
        // Get original times
        const originalStartTime = parseDateToLuxon(originalAppointment.start_time);
        const originalEndTime = parseDateToLuxon(originalAppointment.end_time);
        
        // Initialize new times from original
        let newStartTime = originalStartTime;
        let newEndTime = originalEndTime;
        
        // Update the appropriate time based on which handle is being dragged
        if (resizeHandle === 'top') {
            // Modifying start time
            newStartTime = originalStartTime.plus({ minutes: minutesChange });
            
            // Snap to nearest 15-minute interval
            const snapInterval = 15;
            const minuteValue = newStartTime.minute;
            const remainder = minuteValue % snapInterval;
            
            if (remainder > 0) {
                // Round to nearest 15 min
                const snapMinutes = remainder < (snapInterval / 2) 
                    ? -remainder 
                    : (snapInterval - remainder);
                
                newStartTime = newStartTime.plus({ minutes: snapMinutes });
            }
            
            // Ensure we're within business hours
            if (newStartTime.hour < businessHours.start) {
                newStartTime = newStartTime.set({ hour: businessHours.start, minute: 0 });
            }
            
            // Don't allow start time to be after or equal to end time
            // Minimum appointment length is 15 minutes
            const minAppointmentMinutes = 15;
            if (newStartTime >= originalEndTime.minus({ minutes: minAppointmentMinutes })) {
                newStartTime = originalEndTime.minus({ minutes: minAppointmentMinutes });
            }
            
            // Keep end time the same, only update start time
            newEndTime = originalEndTime;
        } 
        else if (resizeHandle === 'bottom') {
            // Modifying end time
            newEndTime = originalEndTime.plus({ minutes: minutesChange });
            
            // Snap to nearest 15-minute interval
            const snapInterval = 15;
            const minuteValue = newEndTime.minute;
            const remainder = minuteValue % snapInterval;
            
            if (remainder > 0) {
                // Round to nearest 15 min
                const snapMinutes = remainder < (snapInterval / 2) 
                    ? -remainder 
                    : (snapInterval - remainder);
                
                newEndTime = newEndTime.plus({ minutes: snapMinutes });
            }
            
            // Ensure we're within business hours
            if (newEndTime.hour >= businessHours.end) {
                newEndTime = newEndTime.set({ hour: businessHours.end, minute: 0 });
            }
            
            // Don't allow end time to be before or equal to start time
            // Minimum appointment length is 15 minutes
            const minAppointmentMinutes = 15;
            if (newEndTime <= originalStartTime.plus({ minutes: minAppointmentMinutes })) {
                newEndTime = originalStartTime.plus({ minutes: minAppointmentMinutes });
            }
            
            // Keep start time the same, only update end time
            newStartTime = originalStartTime;
        }
        
        // Update the time display in the overlay
        if (dragOverlay) {
            // Find the time display element
            const timeDisplay = dragOverlay.querySelector('.time-display');
            if (timeDisplay instanceof HTMLElement) {
                timeDisplay.textContent = `${newStartTime.toFormat('h:mm a')} - ${newEndTime.toFormat('h:mm a')}`;
            }
        }
    }
    
    // Handle mouse up for both dragging and resizing
    function handleMouseUp(event: MouseEvent) {
        if (isDragging && draggedAppointment && originalAppointment) {
            // Finalize the drag
            finalizeAppointmentTime(event);
            
            // Check if we actually moved the appointment
            const originalStartTime = parseDateToLuxon(originalAppointment.start_time);
            const newStartTime = parseDateToLuxon(draggedAppointment.start_time);
            
            // Only dispatch if the time actually changed
            if (!originalStartTime.equals(newStartTime)) {
                const newEndTime = parseDateToLuxon(draggedAppointment.end_time);
                console.log('Appointment moved from', originalStartTime.toFormat('h:mm a'), 'to', newStartTime.toFormat('h:mm a'));
                
                // Dispatch event to handle the data update in the parent component
                dispatch('appointmentMoved', {
                    appointment: draggedAppointment,
                    newStartTime: newStartTime.toISO() as string,
                    newEndTime: newEndTime.toISO() as string
                });
            } else {
                console.log('Appointment not moved - same time');
            }
        }
        else if (isResizing && resizedAppointment && originalAppointment) {
            // Finalize the resize
            finalizeAppointmentResize(event);
            
            const originalStartTime = parseDateToLuxon(originalAppointment.start_time);
            const originalEndTime = parseDateToLuxon(originalAppointment.end_time);
            const newStartTime = parseDateToLuxon(resizedAppointment.start_time);
            const newEndTime = parseDateToLuxon(resizedAppointment.end_time);
            
            // Only dispatch if the time actually changed
            if (!originalStartTime.equals(newStartTime) || !originalEndTime.equals(newEndTime)) {
                console.log('Appointment resized from', 
                    `${originalStartTime.toFormat('h:mm a')} - ${originalEndTime.toFormat('h:mm a')}`,
                    'to',
                    `${newStartTime.toFormat('h:mm a')} - ${newEndTime.toFormat('h:mm a')}`);
                
                // Dispatch event to handle the data update in the parent component
                dispatch('appointmentMoved', {
                    appointment: resizedAppointment,
                    newStartTime: newStartTime.toISO() as string,
                    newEndTime: newEndTime.toISO() as string
                });
            } else {
                console.log('Appointment not resized - same times');
            }
        }
        
        // Clean up regardless of what we were doing
        cleanup();
    }
    
    // Calculate the final appointment times after resizing
    function finalizeAppointmentResize(event: MouseEvent) {
        if (!isResizing || !resizeHandle || !dragOverlay || !resizedAppointment || !originalAppointment) return;
        
        // Get the week view element to calculate relative positions
        const weekViewRect = weekView?.getBoundingClientRect();
        if (!weekViewRect) return;
        
        // Each hour is 60px tall in our grid
        const hourHeight = 60;
        const minuteHeight = hourHeight / 60;
        
        // Calculate vertical movement
        const deltaY = event.clientY - resizeStartY;
        
        // Convert movement to minute changes (positive for moving down, negative for moving up)
        const minutesChange = Math.round(deltaY / minuteHeight);
        
        // Get original times
        const originalStartTime = parseDateToLuxon(originalAppointment.start_time);
        const originalEndTime = parseDateToLuxon(originalAppointment.end_time);
        
        // Initialize new times from original
        let newStartTime = originalStartTime;
        let newEndTime = originalEndTime;
        
        // Update the appropriate time based on which handle is being dragged
        if (resizeHandle === 'top') {
            // Modifying start time
            newStartTime = originalStartTime.plus({ minutes: minutesChange });
            
            // Snap to nearest 15-minute interval
            const snapInterval = 15;
            const minuteValue = newStartTime.minute;
            const remainder = minuteValue % snapInterval;
            
            if (remainder > 0) {
                // Round to nearest 15 min
                const snapMinutes = remainder < (snapInterval / 2) 
                    ? -remainder 
                    : (snapInterval - remainder);
                
                newStartTime = newStartTime.plus({ minutes: snapMinutes });
            }
            
            // Ensure we're within business hours
            if (newStartTime.hour < businessHours.start) {
                newStartTime = newStartTime.set({ hour: businessHours.start, minute: 0 });
            }
            
            // Don't allow start time to be after or equal to end time
            // Minimum appointment length is 15 minutes
            const minAppointmentMinutes = 15;
            if (newStartTime >= originalEndTime.minus({ minutes: minAppointmentMinutes })) {
                newStartTime = originalEndTime.minus({ minutes: minAppointmentMinutes });
            }
            
            // Keep end time the same, only update start time
            newEndTime = originalEndTime;
        } 
        else if (resizeHandle === 'bottom') {
            // Modifying end time
            newEndTime = originalEndTime.plus({ minutes: minutesChange });
            
            // Snap to nearest 15-minute interval
            const snapInterval = 15;
            const minuteValue = newEndTime.minute;
            const remainder = minuteValue % snapInterval;
            
            if (remainder > 0) {
                // Round to nearest 15 min
                const snapMinutes = remainder < (snapInterval / 2) 
                    ? -remainder 
                    : (snapInterval - remainder);
                
                newEndTime = newEndTime.plus({ minutes: snapMinutes });
            }
            
            // Ensure we're within business hours
            if (newEndTime.hour >= businessHours.end) {
                newEndTime = newEndTime.set({ hour: businessHours.end, minute: 0 });
            }
            
            // Don't allow end time to be before or equal to start time
            // Minimum appointment length is 15 minutes
            const minAppointmentMinutes = 15;
            if (newEndTime <= originalStartTime.plus({ minutes: minAppointmentMinutes })) {
                newEndTime = originalStartTime.plus({ minutes: minAppointmentMinutes });
            }
            
            // Keep start time the same, only update end time
            newStartTime = originalStartTime;
        }
        
        // Update the appointment times
        resizedAppointment.start_time = newStartTime.toISO() as string;
        resizedAppointment.end_time = newEndTime.toISO() as string;
    }
    
    // Update the cleanup function for both dragging and resizing
    function cleanup() {
        // Clean up drag state
        isDragging = false;
        draggedAppointment = null;
        dragStartDay = null;
        
        // Clean up resize state
        isResizing = false;
        resizeHandle = null;
        resizedAppointment = null;
        
        // Remove the drag/resize overlay
        if (dragOverlay) {
            dragOverlay.remove();
            dragOverlay = null;
        }
        
        // Remove global event listeners
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
                    <div class="relative h-full day-column" style="min-width: 0;">
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
                                on:dragStart={handleAppointmentDragStart}
                                on:resizeStart={(e) => handleAppointmentResizeStart(e.detail)}
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
                            on:dragStart={handleAppointmentDragStart}
                            on:resizeStart={(e) => handleAppointmentResizeStart(e.detail)}
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
                                    <svelte:component 
                                        this={AppointmentCard} 
                                        {appointment} 
                                        view="month" 
                                        on:click={() => handleAppointmentClick(appointment, null)}
                                    />
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