<script lang="ts">
    import { supabase } from '$lib/supabase';
    import CommandInput from '$lib/components/CommandInput.svelte';
    import { onMount } from 'svelte';
    // Replace date-fns with Luxon
    import { DateTime } from 'luxon';
    import { goto } from '$app/navigation';
    import { fade } from 'svelte/transition';
    import Calendar from '$lib/components/Calendar.svelte';
    import { createLocalDate, localToStorageFormat, storageToLocalDate, debugDate, parseDateToLuxon, formatSalonTime } from '$lib/utils/timeUtils';
    import type { Appointment, Client, Service } from '$lib/types';
    import type { Database } from '$lib/supabase';
    import { page } from '$app/stores';

    type AppointmentFromDB = Database['public']['Tables']['appointments']['Row'];
    type AppointmentWithClient = AppointmentFromDB & { client: { id: string; name: string; email?: string; phone?: string; }; };
    
    // Form state management
    let loading = false;
    let error: string | null = null;
    let formErrors: Record<string, string> = {};
    let currentStep = 1;
    const totalSteps = 3;
    
    // Core page states
    let showForm = false;
    let showList = false;
    let viewMode: 'calendar' | 'list' = 'calendar';

    // Appointment data
    let appointments: AppointmentWithClient[] = [];
    let clients: { id: string; name: string; email?: string; phone?: string; }[] = [];
    let services: Service[] = [];
    let searchQuery = '';
    let filteredClients: { id: string; name: string; email?: string; phone?: string; }[] = [];
    
    // Function to update filtered clients based on search query
    function updateFilteredClients() {
        filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Form fields
    let selectedClientId = '';
    // Initialize form fields with today's date
    function initializeFormDates() {
        // Use Luxon's formatting for date strings - default to today
        const today = DateTime.now().setZone('America/Denver');
        startDate = today.toFormat('yyyy-MM-dd');
        startTimeValue = '12:00';
        
        // Ensure end date/time is initialized properly
        calculateEndTime();
    }
    let startDate = '';
    let startTimeValue = '';
    // Initialize end date/time, but these will be calculated
    let endDate = ''; // Same day as start date by default
    let endTimeValue = ''; // 30 minutes after start by default
    let notes = '';
    let selectedServices: Service[] = [];
    let calculatedDurationMinutes = 30; // Default to 30 minutes

    // Calendar
    let calendarView: 'week' | 'day' = 'week';
    let selectedDate = new Date();
    
    // Time slots for appointment selection with formatted labels
    const timeOptions = [
        { value: '08:00', label: '8:00 AM' },
        { value: '08:30', label: '8:30 AM' },
        { value: '09:00', label: '9:00 AM' },
        { value: '09:30', label: '9:30 AM' },
        { value: '10:00', label: '10:00 AM' },
        { value: '10:30', label: '10:30 AM' },
        { value: '11:00', label: '11:00 AM' },
        { value: '11:30', label: '11:30 AM' },
        { value: '12:00', label: '12:00 PM' },
        { value: '12:30', label: '12:30 PM' },
        { value: '13:00', label: '1:00 PM' },
        { value: '13:30', label: '1:30 PM' },
        { value: '14:00', label: '2:00 PM' },
        { value: '14:30', label: '2:30 PM' },
        { value: '15:00', label: '3:00 PM' },
        { value: '15:30', label: '3:30 PM' },
        { value: '16:00', label: '4:00 PM' },
        { value: '16:30', label: '4:30 PM' },
        { value: '17:00', label: '5:00 PM' },
        { value: '17:30', label: '5:30 PM' },
        { value: '18:00', label: '6:00 PM' },
        { value: '18:30', label: '6:30 PM' },
        { value: '19:00', label: '7:00 PM' },
        { value: '19:30', label: '7:30 PM' },
        { value: '20:00', label: '8:00 PM' },
    ];

    // Helper function to parse duration strings
    function parseDuration(durationStr: string) {
        if (!durationStr) return 30;
        
        // Strip any parentheses or extra whitespace
        const cleanDuration = durationStr.replace(/[\s()]/g, '');
        
        // Check if it's in the format HH:MM:SS or similar time format
        const timeFormatMatch = cleanDuration.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
        if (timeFormatMatch) {
            const hours = parseInt(timeFormatMatch[1] || '0');
            const minutes = parseInt(timeFormatMatch[2] || '0');
            // Convert to total minutes
            return (hours * 60) + minutes;
        }
        
        // If not in time format, try text format
        const lowerDuration = durationStr.toLowerCase();
        let totalMinutes = 0;
        
        // Extract hours
        const hourMatch = lowerDuration.match(/(\d+)\s*hours?/i);
        if (hourMatch && hourMatch[1]) {
            totalMinutes += parseInt(hourMatch[1]) * 60;
        }
        
        // Extract minutes
        const minuteMatch = lowerDuration.match(/(\d+)\s*minutes?/i);
        if (minuteMatch && minuteMatch[1]) {
            totalMinutes += parseInt(minuteMatch[1]);
        }
        
        // If no valid duration found, default to 30 minutes
        return totalMinutes || 30;
    }

    // Initialize the form with today's date
    function resetForm() {
        // Do not reset client ID, it should be preserved if needed
        selectedServices = [];
        initializeFormDates();
        notes = '';
        currentStep = 1;
        formErrors = {};
    }

    function toggleForm(eventOrPreserve?: MouseEvent | boolean) {
        // Determine if we should preserve the client ID
        // If a boolean is passed, use it directly. Otherwise, it's an event and we don't preserve
        const preserveClientId = typeof eventOrPreserve === 'boolean' ? eventOrPreserve : false;
        
        if (!showForm) {
            // When opening the form, only reset certain fields
            resetForm();
            // Only clear client ID if we're not preserving it
            if (!preserveClientId) {
                selectedClientId = '';
            }
            showForm = true;
        } else {
            // When closing, reset everything including client ID
            resetForm();
            selectedClientId = '';
            showForm = false;
        }
    }

    // Form validation
    function validateCurrentStep(): boolean {
        formErrors = {};
        
        if (currentStep === 1) {
            if (!selectedClientId) formErrors.client = 'Please select a client';
        } else if (currentStep === 2) {
            if (selectedServices.length === 0) formErrors.services = 'Please select at least one service';
        } else if (currentStep === 3) {
            if (!startDate) formErrors.date = 'Please select a date';
            if (!startTimeValue) formErrors.time = 'Please select a time';
        }
        
        return Object.keys(formErrors).length === 0;
    }
    
    function goToNextStep() {
        if (validateCurrentStep()) {
            currentStep++;
            if (currentStep === 3) {
                calculateEndTime(); // Ensure end time is calculated when we reach step 3
            }
        }
    }
    
    function goToPreviousStep() {
        currentStep--;
    }
    
    // Calculate the end time based on selected services and start time
    function calculateEndTime() {
        if (!startDate || !startTimeValue) {
            console.log('Missing start date or time, cannot calculate end time');
            return;
        }
        
        console.log('Calculating end time with services:', selectedServices);
        let totalMinutes = 0;
        
        // Count total minutes from all selected services
        if (selectedServices && selectedServices.length > 0) {
            selectedServices.forEach(service => {
                console.log('Service found:', service);
                console.log('Service duration raw:', service.duration);
                
                // Handle undefined duration by defaulting to 30 minutes
                const durationValue = service.duration || '30 minutes';
                const minutes = parseDuration(durationValue);
                
                console.log(`Parsed duration for ${service.name}: ${minutes} minutes`);
                totalMinutes += minutes;
            });
        } else {
            // Default to 30 minutes if no services selected
            totalMinutes = 30;
            console.log('No services selected, defaulting to 30 minutes');
        }
        
        // Ensure minimum duration of 30 minutes
        if (totalMinutes === 0) totalMinutes = 30;
        
        console.log('Final appointment duration:', totalMinutes, 'minutes');
        calculatedDurationMinutes = totalMinutes; // Store for reference
        
        // Calculate end time by adding total duration to start time
        try {
            // Format with a space between date and time as expected by the utility
            const startDateTimeStr = `${startDate} ${startTimeValue}`;
            console.log('Start datetime string format:', startDateTimeStr);
            
            // Create a DateTime directly using the proper format
            const startDateObj = DateTime.fromFormat(startDateTimeStr, 'yyyy-MM-dd HH:mm', {
                zone: 'America/Denver'
            });
            
            if (!startDateObj.isValid) {
                console.error('Invalid date format:', startDateObj.invalidReason, startDateObj.invalidExplanation);
                return;
            }
            
            console.log('Start datetime object:', startDateObj.toISO());
            
            // Add duration minutes to get end time
            const endDateObj = startDateObj.plus({ minutes: totalMinutes });
            console.log('End datetime object:', endDateObj.toISO());
            
            // Format end date and time for form fields
            endDate = endDateObj.toFormat('yyyy-MM-dd');
            endTimeValue = endDateObj.toFormat('HH:mm');
            
            console.log('Calculated end time:', `${endDate} ${endTimeValue}`);
            console.log(`Duration: ${totalMinutes} minutes`);
        } catch (e: unknown) {
            console.error('Error calculating end time:', e);
            if (e instanceof Error) {
                console.error('Error details:', e.message, e.stack);
            }
        }
    }

    function toggleService(serviceId: string) {
        if (selectedServices.find(s => s.id === serviceId)) {
            selectedServices = selectedServices.filter(s => s.id !== serviceId);
        } else {
            const service = services.find(s => s.id === serviceId);
            if (service) {
                selectedServices = [...selectedServices, service];
            }
        }
        calculateEndTime();
    }

    // Watch for start time changes
    $: if (startDate && startTimeValue) {
        calculateEndTime();
    }
    
    // Watch for service changes
    $: if (selectedServices) {
        calculateEndTime();
    }

    async function handleSubmit(event: Event) {
        try {
            loading = true;
            error = null;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Always make sure end time is calculated before submission
            if (startDate && startTimeValue) {
                calculateEndTime();
            }

            // Verify we have valid start and end times
            if (!startDate || !startTimeValue || !endDate || !endTimeValue) {
                throw new Error('Please select both start and end times');
            }

            // DEBUG: Log actual raw form values
            console.log('===== APPOINTMENT CREATION DEBUG =====');
            console.log(`Raw form values: startDate=${startDate}, startTime=${startTimeValue}`);
            console.log(`Raw form values: endDate=${endDate}, endTime=${endTimeValue}`);

            // Log browser's timezone for reference
            console.log('Browser timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
            console.log('Browser timezone offset (minutes):', new Date().getTimezoneOffset());

            // Create date objects using the same method as calculateEndTime for consistency
            const startDateTimeStr = `${startDate} ${startTimeValue}`;
            console.log(`Formatted start datetime: ${startDateTimeStr}`);
            
            const startDateTime = DateTime.fromFormat(startDateTimeStr, 'yyyy-MM-dd HH:mm', { zone: 'America/Denver' });
            if (!startDateTime.isValid) {
                console.error('Invalid start date:', startDateTime.invalidReason, startDateTime.invalidExplanation);
                throw new Error('Invalid start date/time format');
            }
            console.log(`Start date parsed: ${startDateTime.toISO()}`);
            
            const endDateTimeStr = `${endDate} ${endTimeValue}`;
            console.log(`Formatted end datetime: ${endDateTimeStr}`);
            
            const endDateTime = DateTime.fromFormat(endDateTimeStr, 'yyyy-MM-dd HH:mm', { zone: 'America/Denver' });
            if (!endDateTime.isValid) {
                console.error('Invalid end date:', endDateTime.invalidReason, endDateTime.invalidExplanation);
                throw new Error('Invalid end date/time format');
            }
            console.log(`End date parsed: ${endDateTime.toISO()}`);

            // Validate end time is after start time
            if (endDateTime <= startDateTime) {
                throw new Error('End time must be after start time');
            }
            
            console.log(`Start date/time: ${startDateTime.toLocaleString()}`);
            console.log(`End date/time: ${endDateTime.toLocaleString()}`);
            
            // Duration in minutes
            const durationMinutes = endDateTime.diff(startDateTime, 'minutes').minutes;
            console.log(`Calculated duration: ${durationMinutes} minutes`);

            // For database storage, convert to proper UTC format
            const dbStartTime = startDateTime.toUTC().toISO();
            const dbEndTime = endDateTime.toUTC().toISO();
            
            console.log(`Database start_time: ${dbStartTime}`);
            console.log(`Database end_time: ${dbEndTime}`);

            // Validate form data
            if (!selectedClientId) {
                throw new Error('Please select a client');
            }

            const serviceIds = selectedServices.map(service => service.id);

            // Create appointment in database
            const { data: appointment, error: submitError } = await supabase
                .from('appointments')
                .insert({
                    client_id: selectedClientId,
                    stylist_id: user.id,
                    start_time: dbStartTime,
                    end_time: dbEndTime,
                    status: 'scheduled',
                    service_type: selectedServices.map(s => s.name).join(', '), // Convert to string as expected
                    notes: notes
                })
                .select();

            if (submitError) throw submitError;

            // Reset form and close it
            resetForm();
            showForm = false;

            await fetchAppointments();
            alert('Appointment created successfully');
        } catch (e: unknown) { // Type assertion to access error properties
            error = e instanceof Error ? e.message : 'Unknown error';
            alert(`Error: ${e instanceof Error ? e.message : 'Failed to create appointment'}`);
        } finally {
            loading = false;
        }
    }

    async function deleteAppointment(id: string) {
        try {
            loading = true;
            error = null;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error: deleteError } = await supabase
                .from('appointments')
                .delete()
                .eq('id', id)
                .eq('stylist_id', user.id);

            if (deleteError) throw deleteError;

            await fetchAppointments();
            alert('Appointment deleted successfully');
        } catch (e: unknown) { // Type assertion to access error properties
            error = e instanceof Error ? e.message : 'Unknown error';
            alert(`Error: ${e instanceof Error ? e.message : 'Failed to delete appointment'}`);
        } finally {
            loading = false;
        }
    }

    // New function to handle appointment edits
    async function handleEditAppointment(event: CustomEvent) {
        try {
            const { appointment } = event.detail;
            console.log('Appointment edited:', appointment.id);
            
            // Update the appointment in Supabase
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Store the original appointment state in case we need to revert
            const originalAppointment = appointments.find(a => a.id === appointment.id);
            if (!originalAppointment) throw new Error('Appointment not found in local state');
            
            // Optimistically update the UI first for responsiveness
            appointments = appointments.map(a => {
                if (a.id === appointment.id) {
                    return appointment;
                }
                return a;
            });
            
            // Update the database
            const { error: updateError } = await supabase
                .from('appointments')
                .update(appointment)
                .eq('id', appointment.id)
                .eq('stylist_id', user.id);

            if (updateError) {
                console.error('Error updating appointment:', updateError);
                
                // Revert the optimistic update if the database update failed
                appointments = appointments.map(a => {
                    if (a.id === appointment.id) {
                        return originalAppointment;
                    }
                    return a;
                });
                
                throw updateError;
            }
            
            // Refresh from database to ensure consistency
            await fetchAppointments();
            
            // Create a simple toast notification
            const toast = document.createElement('div');
            toast.textContent = 'Appointment updated';
            toast.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background-color: #10B981; color: white; padding: 12px 20px; border-radius: 4px; z-index: 100; box-shadow: 0 2px 10px rgba(0,0,0,0.1);';
            document.body.appendChild(toast);
            
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 3000);
        } catch (e: unknown) { // Type assertion to access error properties
            console.error('Error in handleEditAppointment:', e);
            
            // Refresh from database to ensure UI is consistent with backend
            await fetchAppointments();
            
            // Show error toast
            const errorToast = document.createElement('div');
            errorToast.textContent = `Error: ${e instanceof Error ? e.message : 'Failed to update appointment'}`;
            errorToast.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background-color: #EF4444; color: white; padding: 12px 20px; border-radius: 4px; z-index: 100; box-shadow: 0 2px 10px rgba(0,0,0,0.1);';
            document.body.appendChild(errorToast);
            
            setTimeout(() => {
                if (document.body.contains(errorToast)) {
                    document.body.removeChild(errorToast);
                }
            }, 3000);
        }
    }
    
    // Handles appointment time updates from both drag-and-drop and manual edits
    async function updateAppointment(event: CustomEvent) {
        try {
            loading = true;
            error = null;

            const { appointment, newStartTime, newEndTime } = event.detail;
            console.log('Updating appointment:', appointment.id);
            console.log('New start time:', newStartTime);
            console.log('New end time:', newEndTime);

            // Convert the new times to full ISO format with timezone using Luxon
            const updatedStart = DateTime.fromFormat(newStartTime, "yyyy-MM-dd'T'HH:mm", { zone: 'America/Denver' }).toUTC().toISO();
            const updatedEnd = DateTime.fromFormat(newEndTime, "yyyy-MM-dd'T'HH:mm", { zone: 'America/Denver' }).toUTC().toISO();

            const { error: updateError } = await supabase
                .from('appointments')
                .update({
                    start_time: updatedStart,
                    end_time: updatedEnd
                })
                .eq('id', appointment.id);

            if (updateError) throw updateError;

            // Schedule a notification to show briefly and then hide it
            const appointmentIndex = appointments.findIndex(a => a.id === appointment.id);
            if (appointmentIndex !== -1) {
                // Update the local copy
                appointments[appointmentIndex].start_time = newStartTime;
                appointments[appointmentIndex].end_time = newEndTime;
                appointments = [...appointments]; // Trigger reactivity
            }
            
            // Show confirmation message
            setTimeout(() => {
                try {
                    const notification = document.createElement('div');
                    notification.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50';
                    notification.textContent = 'Appointment updated';
                    document.body.appendChild(notification);
                    
                    // Remove after 3 seconds
                    setTimeout(() => {
                        notification?.remove();
                    }, 3000);
                } catch (e) {
                    console.error('Error showing notification:', e);
                }
            }, 100);

            // Refresh appointments list
            await fetchAppointments();
        } catch (e: unknown) { // Type assertion to access error properties
            console.error('Error updating appointment:', e);
            error = e instanceof Error ? e.message : 'Unknown error';
            
            // Refresh from database to ensure UI is consistent with backend
            await fetchAppointments();
            
            // Show error notification
            try {
                const notification = document.createElement('div');
                notification.className = 'fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-50';
                notification.textContent = `Error: ${e instanceof Error ? e.message : 'Failed to update appointment'}`;
                document.body.appendChild(notification);
                
                // Remove after 3 seconds
                setTimeout(() => {
                    notification?.remove();
                }, 3000);
            } catch (e) {
                console.error('Error showing notification:', e);
            }
        } finally {
            loading = false;
        }
    }

    // Function to handle appointment clicks in the calendar
    async function handleAppointmentClick(event: CustomEvent<{ appointment: Appointment }>) {
        const appointment = event.detail.appointment;
        if (appointment && appointment.id) {
            // Navigate to appointment detail page
            goto(`/appointments/${appointment.id}`);
        }
    }
    
    function formatDateTime(dateStr: string) {
        return DateTime.fromISO(dateStr).toLocaleString(DateTime.DATETIME_FULL);
    }
    
    async function fetchAppointments() {
        try {
            loading = true;
            error = null;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // DIRECT AND SIMPLIFIED APPROACH: Get all appointments first
            const { data: appointmentsData, error: appointmentError } = await supabase
                .from('appointments')
                .select('*')
                .eq('stylist_id', user.id)
                .order('start_time', { ascending: true });
                
            if (appointmentError) throw appointmentError;
            
            // Now separately get ALL clients
            const { data: allClients, error: clientsError } = await supabase
                .from('clients')
                .select('*');
                
            if (clientsError) throw clientsError;
                
            // Create a map of clients by ID for easy lookup
            const clientsById: Record<string, any> = {};
            if (allClients) {
                allClients.forEach(client => {
                    if (client && client.id) {
                        clientsById[client.id] = client;
                    }
                });
            }
            
            console.log('All clients:', allClients);
            console.log('Clients by ID map:', clientsById);
            
            // Process appointments with explicit client assignment
            appointments = (appointmentsData || []).map(apt => {
                // Get the matching client using client_id
                const clientId = apt.client_id;
                let client = null;
                
                if (clientId && clientsById[clientId]) {
                    client = clientsById[clientId];
                    console.log(`Found client for appointment ${apt.id}:`, client);
                } else {
                    console.log(`No client found for appointment ${apt.id} with client_id ${clientId}`);
                }
                
                // Calculate duration in minutes
                const startTime = DateTime.fromISO(apt.start_time, { zone: 'America/Denver' });
                const endTime = DateTime.fromISO(apt.end_time, { zone: 'America/Denver' });
                const durationMinutes = endTime.diff(startTime, 'minutes').minutes;
                
                // Create a clean appointment with explicit client object
                return {
                    ...apt,
                    client, // Directly set the client object
                    duration: durationMinutes
                };
            });
            
            console.log('Final processed appointments:', appointments);
        } catch (e: unknown) { // Type assertion to access error properties
            console.error('Error fetching appointments:', e);
            error = e instanceof Error ? e.message : 'Unknown error';
        } finally {
            loading = false;
        }
    }

    async function fetchClients() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error: fetchError } = await supabase
                .from('clients')
                .select('*')
                .eq('stylist_id', user.id)
                .order('name');

            if (fetchError) throw fetchError;
            clients = data;
        } catch (e: unknown) { // Type assertion to access error properties
            error = e instanceof Error ? e.message : 'Unknown error';
        }
    }

    async function fetchServices() {
        try {
            // Get the current user first
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error('No authenticated user found');
                return;
            }

            // Fetch only services for the current stylist
            const { data, error: fetchError } = await supabase
                .from('services')
                .select('*')
                .eq('stylist_id', user.id);

            if (fetchError) throw fetchError;
            services = data;
        } catch (e: unknown) { // Type assertion to access error properties
            error = e instanceof Error ? e.message : 'Unknown error';
        }
    }

    let clientParam: string | null = null;
    let autoOpenParam: string | null = null;

    // Track URL parameters with Svelte reactivity
    $: {
        clientParam = $page.url.searchParams.get('client');
        autoOpenParam = $page.url.searchParams.get('autoOpen');
        
        // If client parameter exists, set the selected client immediately
        if (clientParam) {
            console.log('Setting client ID from URL param:', clientParam);
            selectedClientId = clientParam;
        }
        
        // If autoOpen is true and the form isn't already open, open it
        if (autoOpenParam === 'true' && !showForm) {
            console.log('Auto-opening form from URL param');
            // Show the form first before any resets to ensure it's visible
            showForm = true;
            // Only reset the form fields, not the client ID
            initializeFormDates();
            selectedServices = [];
            notes = '';
        }
    }

    onMount(async () => {
        await fetchAppointments();
        await fetchClients();
        await fetchServices();
        
        // Initialize end time from start time + default duration when the page loads
        initializeFormDates();
        
        // Filter clients initially
        updateFilteredClients();
    });
</script>

<div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CommandInput />
        
        <!-- Header with Gradient Background -->
        <div class="bg-gradient-to-r from-indigo-100 to-purple-100 backdrop-blur-sm rounded-xl mb-8 p-6 shadow-lg border border-indigo-200 mt-6">
            <div class="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div>
                    <h1 class="text-2xl font-bold text-indigo-800">Your Appointments</h1>
                    <p class="mt-2 text-sm text-indigo-600">Schedule and manage client appointments</p>
                </div>
                <div class="flex space-x-3">
                    <div class="inline-flex rounded-md shadow-sm" role="group">
                        <button
                            type="button"
                            class="px-4 py-2 text-sm font-medium {viewMode === 'calendar' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} border border-gray-300 rounded-l-md focus:z-10 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            on:click={() => {
                                viewMode = 'calendar';
                                showList = false;
                            }}
                        >
                            <div class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                </svg>
                                Calendar
                            </div>
                        </button>
                        <button 
                            type="button"
                            class="px-4 py-2 text-sm font-medium {viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} border border-gray-300 rounded-r-md focus:z-10 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            on:click={() => {
                                viewMode = 'list';
                                showList = true;
                            }}
                        >
                            <div class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                                List
                            </div>
                        </button>
                    </div>
                    <button
                        type="button"
                        on:click={() => {
                            showForm = true;
                            showList = false;
                            initializeFormDates();
                            currentStep = 1;
                        }}
                        class="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add Appointment
                    </button>
                </div>
            </div>
        </div>
        {#if error}
            <div class="mt-4 rounded-md bg-red-50 p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-red-800">Error</h3>
                        <div class="mt-2 text-sm text-red-700">
                            <p>{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        {/if}

        {#if showForm}
            <div class="mt-6 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                <div class="px-4 py-5 sm:p-6">
                    <form on:submit|preventDefault={handleSubmit} class="space-y-6">
                        {#if currentStep === 1}
                            <div class="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                                <div>
                                    <label for="client" class="block text-sm font-medium leading-6 text-gray-900">Client</label>
                                    <div class="mt-2">
                                        <select
                                            id="client"
                                            name="client"
                                            class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                            bind:value={selectedClientId}
                                        >
                                            <option value="">Select a client</option>
                                            {#each clients as client}
                                                <option value={client.id}>{client.name}</option>
                                            {/each}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center justify-end gap-x-4">
                                <button 
                                    type="button"
                                    on:click={goToNextStep}
                                    class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                >
                                    Next
                                </button>
                            </div>
                        {:else if currentStep === 2}
                            <div class="col-span-full">
                                <fieldset>
                                    <legend class="text-sm font-medium leading-6 text-gray-900">Services</legend>
                                    <div class="mt-3 space-y-1">
                                        <div class="grid grid-cols-1 gap-1 mt-1">
                                            {#each services as service (service.id)}
                                                <button 
                                                    type="button"
                                                    class="py-2 px-3 rounded-md text-left flex justify-between items-center text-sm {selectedServices.find(s => s.id === service.id) ? 'bg-indigo-100 text-indigo-900 ring-1 ring-indigo-500' : 'bg-white hover:bg-gray-50 text-gray-700 ring-1 ring-gray-300'}"
                                                    on:click={() => toggleService(service.id)}
                                                >
                                                    <div>
                                                        <span class="font-medium">{service.name}</span>
                                                        <span class="text-xs ml-2 text-gray-500">({service.duration})</span>
                                                    </div>
                                                    {#if selectedServices.find(s => s.id === service.id)}
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                                        </svg>
                                                    {/if}
                                                </button>
                                            {/each}
                                        </div>
                                    </div>
                                </fieldset>
                            </div>
                            <div class="flex items-center justify-between gap-x-4">
                                <button 
                                    type="button"
                                    on:click={goToPreviousStep}
                                    class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                >
                                    Previous
                                </button>
                                <button 
                                    type="button"
                                    on:click={goToNextStep}
                                    class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                >
                                    Next
                                </button>
                            </div>
                        {:else if currentStep === 3}
                            <div class="time-picker-container mt-6 space-y-6">
                                <h3 class="text-base font-semibold text-gray-900">Appointment Time</h3>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                    <div class="col-span-1">
                                        <div>
                                            <label for="start-date" class="block text-sm font-medium leading-6 text-gray-900">Start Date</label>
                                            <div class="mt-2">
                                                <input 
                                                    type="date" 
                                                    id="start-date" 
                                                    name="start-date" 
                                                    required
                                                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 mobile-date-input"
                                                    bind:value={startDate}
                                                    on:change={() => {
                                                        if (startDate && startTimeValue && selectedServices.length > 0) {
                                                            calculateEndTime();
                                                        }
                                                    }}
                                                >
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-span-1">
                                        <div>
                                            <label for="start-time" class="block text-sm font-medium leading-6 text-gray-900">Start Time</label>
                                            <div class="mt-2">
                                                <select 
                                                    id="start-time" 
                                                    name="start-time"
                                                    required
                                                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 mobile-select-input"
                                                    bind:value={startTimeValue}
                                                    on:change={() => {
                                                        if (startDate && startTimeValue && selectedServices.length > 0) {
                                                            calculateEndTime();
                                                        }
                                                    }}
                                                >
                                                    <option value="">Select a time</option>
                                                    {#each timeOptions as option}
                                                        <option value={option.value}>{option.label}</option>
                                                    {/each}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-span-1">
                                        <div>
                                            <div class="flex justify-between">
                                                <label for="end-date" class="block text-sm font-medium leading-6 text-gray-900">End Date</label>
                                                {#if selectedServices.length > 0}
                                                    <span class="text-xs text-gray-500">(Auto-calculated)</span>
                                                {/if}
                                            </div>
                                            <div class="mt-2">
                                                <input 
                                                    type="date" 
                                                    id="end-date" 
                                                    name="end-date" 
                                                    required
                                                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 mobile-date-input {selectedServices.length > 0 ? 'bg-gray-100' : ''}"
                                                    bind:value={endDate}
                                                    disabled={selectedServices.length > 0}
                                                    on:change={() => {
                                                        if (endDate && endTimeValue) {
                                                            calculateEndTime();
                                                        }
                                                    }}
                                                >
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-span-1">
                                        <div>
                                            <div class="flex justify-between">
                                                <label for="end-time" class="block text-sm font-medium leading-6 text-gray-900">End Time</label>
                                                {#if selectedServices.length > 0}
                                                    <button 
                                                        type="button" 
                                                        class="text-indigo-600 hover:text-indigo-900 text-xs font-medium"
                                                        on:click={() => {
                                                            // Enable manual override
                                                            const endDateInput = document.getElementById('end-date') as HTMLInputElement;
                                                            const endTimeInput = document.getElementById('end-time') as HTMLSelectElement;
                                                            
                                                            if (endDateInput && endTimeInput) {
                                                                endDateInput.disabled = false;
                                                                endTimeInput.disabled = false;
                                                                endDateInput.classList.remove('bg-gray-100');
                                                                endTimeInput.classList.remove('bg-gray-100');
                                                                endTimeInput.focus();
                                                            }
                                                        }}
                                                    >
                                                        Edit manually
                                                    </button>
                                                {/if}
                                            </div>
                                            <div class="mt-2">
                                                <select 
                                                    id="end-time" 
                                                    name="end-time"
                                                    required
                                                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 mobile-select-input {selectedServices.length > 0 ? 'bg-gray-100' : ''}"
                                                    bind:value={endTimeValue}
                                                    disabled={selectedServices.length > 0}
                                                    on:change={() => {
                                                        if (endDate && endTimeValue) {
                                                            calculateEndTime();
                                                        }
                                                    }}
                                                >
                                                    <option value="">Select a time</option>
                                                    {#each timeOptions as option}
                                                        <option value={option.value}>{option.label}</option>
                                                    {/each}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-span-full">
                                <div>
                                    <label for="notes" class="block text-sm font-medium leading-6 text-gray-900">Notes</label>
                                    <div class="mt-2">
                                        <textarea
                                            id="notes"
                                            name="notes"
                                            rows="3"
                                            bind:value={notes}
                                            placeholder="Any notes about the appointment"
                                            class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center justify-between gap-x-4">
                                <button 
                                    type="button"
                                    on:click={goToPreviousStep}
                                    class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                >
                                    Previous
                                </button>
                                <button 
                                    type="submit"
                                    class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                    disabled={loading}>
                                    {loading ? 'Saving...' : 'Create Appointment'}
                                </button>
                            </div>
                        {/if}
                    </form>
                </div>
            </div>
        {/if}

        {#if !showList}
            <div class="mt-6 overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                <div class="px-4 py-5 sm:p-6">
                    <Calendar 
                        bind:view={calendarView} 
                        initialDate={selectedDate} 
                        {appointments} 
                        on:appointmentMoved={updateAppointment}
                        on:appointmentClick={handleAppointmentClick}
                    />
                </div>
            </div>
        {/if}

        {#if showList}
            <div class="mt-6 overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                <div class="px-4 py-5 sm:p-6">
                    {#if appointments.length === 0}
                        <div class="text-center py-12">
                            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <h3 class="mt-2 text-sm font-semibold text-gray-900">No appointments</h3>
                            <p class="mt-1 text-sm text-gray-500">Get started by creating a new appointment.</p>
                            <div class="mt-6">
                                <a 
                                    href="/appointments/new"
                                    class="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                >
                                    <svg class="-ml-0.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                                    </svg>
                                    New Appointment
                                </a>
                            </div>
                        </div>
                    {:else}
                        <div class="flow-root">
                            <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                                <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                                    <table class="min-w-full divide-y divide-gray-300">
                                        <thead>
                                            <tr>
                                                <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Client</th>
                                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Service</th>
                                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Start Time</th>
                                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">End Time</th>
                                                <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-0">
                                                    <span class="sr-only">Actions</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-gray-200">
                                            {#each appointments as appointment}
                                                <tr class="hover:bg-gray-50">
                                                    <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-0">
                                                        <div class="flex items-center">
                                                            <div class="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center">
                                                                <span class="text-indigo-700 font-medium text-xs">
                                                                    {appointment.client?.name ? appointment.client.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : '??'}
                                                                </span>
                                                            </div>
                                                            <div class="ml-4">
                                                                <div class="font-medium text-gray-900">{appointment.client?.name || 'Unknown'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                        <div class="rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
                                                            {appointment.service_type || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                        {formatDateTime(appointment.start_time)}
                                                    </td>
                                                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                        {appointment.end_time ? formatDateTime(appointment.end_time) : 'N/A'}
                                                    </td>
                                                    <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                                        <div class="flex justify-end space-x-4">
                                                            <a
                                                                href="/appointments/{appointment.id}"
                                                                class="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010 1.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                                </svg>
                                                                View
                                                            </a>
                                                            <button
                                                                type="button"
                                                                on:click={() => deleteAppointment(appointment.id)}
                                                                class="text-red-600 hover:text-red-900 flex items-center gap-1"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                </svg>
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
</div>