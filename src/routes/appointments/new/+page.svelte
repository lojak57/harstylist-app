<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { fade } from 'svelte/transition';
    import { formatDate, formatTime } from '$lib/utils';

    type Client = {
        id: string;
        name: string;
        email: string;
        phone: string;
    };

    type Service = {
        id: string;
        name: string;
        price: number;
        duration: string;
        category: string;
    };

    // Form data
    let clients: Client[] = [];
    let services: Service[] = [];
    let selectedClient: string = '';
    let selectedServices: string[] = [];
    let date = '';
    let time = '';
    let notes = '';
    let filteredClients: Client[] = [];
    let searchQuery = '';
    
    // Form state
    let loading = false;
    let error: string | null = null;
    let formErrors: Record<string, string> = {};
    
    // Multi-step form
    let currentStep = 1;
    const totalSteps = 3;
    
    let formattedDateTime = 'Not selected';

    onMount(async () => {
        await Promise.all([
            loadClients(),
            loadServices()
        ]);
    });

    async function loadClients() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error: err } = await supabase
                .from('clients')
                .select('*')
                .eq('stylist_id', user.id)
                .order('name');

            if (err) throw err;
            clients = data || [];
            filteredClients = [...clients];
        } catch (err: any) {
            error = err.message;
        }
    }

    async function loadServices() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error: err } = await supabase
                .from('services')
                .select('*')
                .eq('stylist_id', user.id)
                .order('name');

            if (err) throw err;
            services = data || [];
        } catch (err: any) {
            error = err.message;
        }
    }

    function filterClients() {
        const query = searchQuery.toLowerCase();
        filteredClients = clients.filter(client => 
            client.name.toLowerCase().includes(query) || 
            client.email.toLowerCase().includes(query) || 
            client.phone.includes(query)
        );
    }

    function toggleService(serviceId: string) {
        if (selectedServices.includes(serviceId)) {
            selectedServices = selectedServices.filter(id => id !== serviceId);
        } else {
            selectedServices = [...selectedServices, serviceId];
        }
    }

    function nextStep() {
        if (validateCurrentStep()) {
            currentStep = Math.min(currentStep + 1, totalSteps);
        }
    }
    
    function prevStep() {
        currentStep = Math.max(currentStep - 1, 1);
    }
    
    function validateCurrentStep(): boolean {
        formErrors = {};
        
        if (currentStep === 1) {
            if (!selectedClient) formErrors.client = 'Please select a client';
        } else if (currentStep === 2) {
            if (selectedServices.length === 0) formErrors.services = 'Please select at least one service';
        } else if (currentStep === 3) {
            if (!date) formErrors.date = 'Please select a date';
            if (!time) formErrors.time = 'Please select a time';
            if (!validateAppointmentTimes()) {
                return false;
            }
        }
        
        return Object.keys(formErrors).length === 0;
    }

    function getSelectedServicesTotal(): number {
        return services
            .filter(service => selectedServices.includes(service.id))
            .reduce((sum, service) => sum + service.price, 0);
    }

    function getSelectedServicesDuration(): string {
        const selectedServicesList = services.filter(service => selectedServices.includes(service.id));
        if (selectedServicesList.length === 0) return '';
        
        // For simplicity, we'll just display the total time as a sum
        // A more advanced implementation could calculate actual time slots
        let totalMinutes = 0;
        for (const service of selectedServicesList) {
            const durationParts = service.duration.match(/(\d+)\s*hours?|\s*(\d+)\s*minutes?/gi) || [];
            
            for (const part of durationParts) {
                if (part.includes('hour')) {
                    const match = part.match(/(\d+)/);
                    totalMinutes += parseInt(match ? match[0] : '0') * 60;
                } else if (part.includes('minute')) {
                    const match = part.match(/(\d+)/);
                    totalMinutes += parseInt(match ? match[0] : '0');
                }
            }
        }
        
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        let durationText = '';
        if (hours > 0) {
            durationText += `${hours} hour${hours !== 1 ? 's' : ''}`;
        }
        if (minutes > 0) {
            if (durationText) durationText += ' ';
            durationText += `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
        
        return durationText;
    }

    function validateAppointmentTimes() {
        if (!date || !time) return false;
        
        try {
            // First check if date and time are valid
            const appointmentDate = new Date(`${date}T${time}`);
            if (isNaN(appointmentDate.getTime())) {
                formErrors.time = 'Invalid date or time format';
                return false;
            }
            
            // Check duration calculation
            const durationText = getSelectedServicesDuration();
            if (!durationText) {
                // If no duration, we can't calculate end time
                return true;
            }
            
            // Check if appointment is in the past
            const now = new Date();
            if (appointmentDate < now) {
                formErrors.date = 'Appointment cannot be in the past';
                return false;
            }
            
            // Check if appointment is during business hours (8 AM to 8 PM)
            const hours = appointmentDate.getHours();
            if (hours < 8 || hours >= 20) {
                formErrors.time = 'Appointments must be between 8 AM and 8 PM';
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Validation error:', error);
            formErrors.time = 'Error validating appointment time';
            return false;
        }
    }

    async function handleSubmit() {
        // Validate all steps before submission
        formErrors = {};
        
        if (!selectedClient) formErrors.client = 'Please select a client';
        if (selectedServices.length === 0) formErrors.services = 'Please select at least one service';
        if (!date) formErrors.date = 'Please select a date';
        if (!time) formErrors.time = 'Please select a time';
        
        // Validate appointment times
        if (date && time && !validateAppointmentTimes()) {
            currentStep = 3;
            return;
        }
        
        if (Object.keys(formErrors).length > 0) {
            // Go to the first step with errors
            if (formErrors.client) {
                currentStep = 1;
            } else if (formErrors.services) {
                currentStep = 2;
            } else {
                currentStep = 3;
            }
            return;
        }
        
        loading = true;
        error = null;

        try {
            // Get the current user to verify we're authenticated
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Ensure we're working with the correct UTC dates
            let startTimeObj = new Date(`${date}T${time}`);
            
            // Verify we have a valid date
            if (isNaN(startTimeObj.getTime())) {
                throw new Error('Invalid date or time format');
            }
            
            // Guarantee a minimum appointment duration of 30 minutes
            let durationMinutes = Math.max(30, 0); // Start with 30 min minimum
            
            // Add duration from selected services if available
            if (selectedServices.length > 0) {
                for (const serviceId of selectedServices) {
                    const service = services.find(s => s.id === serviceId);
                    if (service?.duration) {
                        const hourMatch = service.duration.match(/(\d+)\s*hour/i);
                        const minuteMatch = service.duration.match(/(\d+)\s*minute/i);
                        
                        if (hourMatch) durationMinutes += parseInt(hourMatch[1]) * 60;
                        if (minuteMatch) durationMinutes += parseInt(minuteMatch[1]);
                    }
                }
            }
            
            // Create end time by adding duration
            let endTimeObj = new Date(startTimeObj.getTime() + (durationMinutes * 60 * 1000));
            
            console.log('Start time (local):', startTimeObj.toString());
            console.log('End time (local):', endTimeObj.toString());
            console.log('Duration minutes:', durationMinutes);
            
            // Create the appointment record
            const appointment = {
                stylist_id: user.id,
                client_id: selectedClient,
                start_time: startTimeObj.toISOString(),
                end_time: endTimeObj.toISOString(),
                notes: notes || null,
                service_type: services.filter(s => selectedServices.includes(s.id)).map(s => s.name).join(', ')
            };
            
            console.log('Submitting appointment:', appointment);

            const { error: insertError } = await supabase
                .from('appointments')
                .insert([appointment]);

            if (insertError) {
                console.error('Insert error:', insertError);
                throw insertError;
            }

            // Redirect to the appointments list
            goto('/appointments');
        } catch (e: any) {
            console.error('Error:', e);
            error = e.message || 'An error occurred';
            loading = false;
        }
    }

    $: {
        // Update the summary section whenever date or time changes
        if (date && time) {
            try {
                const fullDateTime = new Date(`${date}T${time}`);
                if (!isNaN(fullDateTime.getTime())) {
                    const formattedDate = formatDate(date);
                    const formattedTime = formatTime(time);
                    formattedDateTime = `${formattedDate} at ${formattedTime}`;
                } else {
                    formattedDateTime = 'Invalid Date';
                }
            } catch (error) {
                formattedDateTime = 'Invalid Date';
            }
        } else {
            formattedDateTime = 'Not selected';
        }
    }
</script>

<div class="py-6 bg-gray-50 min-h-screen">
    <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div class="bg-white rounded-lg shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
            <div class="px-6 py-8 border-b border-gray-200">
                <a href="/appointments" class="inline-flex items-center gap-x-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-500 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                    Back to appointments
                </a>
                <h1 class="text-2xl font-bold text-gray-900">New Appointment</h1>
                <p class="mt-2 text-sm text-gray-600">Schedule a new appointment for your client</p>
                
                <!-- Steps indicator -->
                <div class="mt-8">
                    <nav aria-label="Progress">
                        <ol role="list" class="flex items-center">
                            {#each Array(totalSteps) as _, i}
                                {@const stepNum = i + 1}
                                {@const status = stepNum < currentStep ? 'complete' : stepNum === currentStep ? 'current' : 'upcoming'}
                                <li class="relative flex items-center {i !== 0 ? 'ml-8 sm:ml-16' : ''}">
                                    {#if i !== 0}
                                        <!-- Line connecting steps -->
                                        <div class="absolute inset-0 -left-8 sm:-left-16 flex items-center" aria-hidden="true">
                                            <div class="h-0.5 w-full {status === 'upcoming' ? 'bg-gray-200' : 'bg-indigo-600'}"></div>
                                        </div>
                                    {/if}
                                    
                                    <div class="relative flex items-center justify-center" aria-current={status === 'current' ? 'step' : undefined}>
                                        {#if status === 'complete'}
                                            <span class="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                                                <svg class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                    <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                                                </svg>
                                            </span>
                                        {:else if status === 'current'}
                                            <span class="h-8 w-8 rounded-full border-2 border-indigo-600 flex items-center justify-center">
                                                <span class="text-indigo-600 font-medium">{stepNum}</span>
                                            </span>
                                        {:else}
                                            <span class="h-8 w-8 rounded-full border-2 border-gray-300 flex items-center justify-center">
                                                <span class="text-gray-500">{stepNum}</span>
                                            </span>
                                        {/if}
                                    </div>
                                </li>
                            {/each}
                        </ol>
                    </nav>
                </div>
            </div>
            <div class="px-6 py-6">
                {#if error}
                    <div class="rounded-md bg-red-50 p-4 mb-6">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
                                </svg>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-sm font-medium text-red-800">There was an error with your submission</h3>
                                <div class="mt-2 text-sm text-red-700">
                                    <p>{error}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                {/if}

                <form on:submit|preventDefault={handleSubmit}>
                    {#if currentStep === 1}
                        <div class="space-y-6" transition:fade={{ duration: 200 }}>
                            <div>
                                <label for="search-client" class="block text-sm font-medium leading-6 text-gray-900">Search Clients</label>
                                <div class="mt-2 relative">
                                    <input
                                        type="text"
                                        id="search-client"
                                        name="search-client"
                                        placeholder="Search by name, email, or phone"
                                        bind:value={searchQuery}
                                        on:input={filterClients}
                                        class="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    >
                                    <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                                        <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                                {#if formErrors.client}
                                    <p class="mt-2 text-sm text-red-600">{formErrors.client}</p>
                                {/if}
                            </div>

                            <div>
                                <fieldset>
                                    <legend class="text-base font-medium text-gray-900">Select Client</legend>
                                    <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        {#if filteredClients.length === 0}
                                            <div class="col-span-2 p-4 text-center text-sm text-gray-500 border border-gray-200 rounded-md">
                                                No clients found. Try a different search or <a href="/clients/new" class="text-indigo-600 hover:text-indigo-500 font-medium">create a new client</a>.
                                            </div>
                                        {:else}
                                            {#each filteredClients as client}
                                                <button
                                                    type="button"
                                                    class="relative flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150 {selectedClient === client.id ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-600 ring-opacity-50' : ''}"
                                                    on:click={() => selectedClient = client.id}
                                                >
                                                    <div class="min-w-0 flex-1">
                                                        <div class="flex items-center space-x-2">
                                                            <div class="h-8 w-8 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center">
                                                                <span class="text-indigo-700 font-medium text-xs">
                                                                    {client.name ? client.name.split(' ').map(n => n[0]).join('').toUpperCase() : '??'}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <h3 class="text-sm font-medium text-gray-900">{client.name}</h3>
                                                                <p class="text-xs text-gray-500 mt-1">{client.email || 'No email'}</p>
                                                                <p class="text-xs text-gray-500">{client.phone || 'No phone'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="ml-3 flex h-5 items-center">
                                                        <input
                                                            type="radio"
                                                            name="client-selection"
                                                            value={client.id}
                                                            checked={selectedClient === client.id}
                                                            class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600 pointer-events-none"
                                                            aria-hidden="true"
                                                        />
                                                    </div>
                                                </button>
                                            {/each}
                                        {/if}
                                    </div>
                                </fieldset>
                            </div>
                        </div>
                    {/if}

                    {#if currentStep === 2}
                        <div class="space-y-6" transition:fade={{ duration: 200 }}>
                            <div>
                                <fieldset>
                                    <legend class="text-base font-medium text-gray-900">Select Services</legend>
                                    <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {#if services.length === 0}
                                            <div class="col-span-2 p-4 text-center text-sm text-gray-500 border border-gray-200 rounded-md">
                                                No services found. <a href="/services" class="text-indigo-600 hover:text-indigo-500 font-medium">Manage your services</a>.
                                            </div>
                                        {:else}
                                            {#each services as service}
                                                <button
                                                    type="button"
                                                    class="text-left w-full relative flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150 cursor-pointer {selectedServices.includes(service.id) ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-200 ring-opacity-50' : ''}"
                                                    on:click={() => toggleService(service.id)}
                                                    aria-pressed={selectedServices.includes(service.id)}
                                                >
                                                    <div class="min-w-0 flex-1 text-sm">
                                                        <span class="font-medium text-gray-700 select-none">{service.name}</span>
                                                        <div class="mt-1 flex flex-wrap gap-2 items-center">
                                                            {#if service.price}
                                                                <div class="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                                                                    ${service.price}
                                                                </div>
                                                            {/if}
                                                            {#if service.duration}
                                                                <div class="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                                                    {service.duration}
                                                                </div>
                                                            {/if}
                                                            {#if service.category}
                                                                <div class="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                                                                    {service.category}
                                                                </div>
                                                            {/if}
                                                        </div>
                                                    </div>
                                                    <div class="ml-3 flex items-center h-5">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedServices.includes(service.id)}
                                                            class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                                                            tabindex="-1"
                                                            aria-hidden="true"
                                                        />
                                                    </div>
                                                </button>
                                            {/each}
                                        {/if}
                                    </div>
                                    {#if formErrors.services}
                                        <p class="mt-2 text-sm text-red-600">{formErrors.services}</p>
                                    {/if}
                                </fieldset>
                            </div>

                            {#if selectedServices.length > 0}
                                <div class="px-4 py-4 sm:rounded-md bg-gray-50 border border-gray-200">
                                    <h3 class="text-sm font-medium text-gray-900">Selected Services</h3>
                                    <div class="mt-3 flow-root">
                                        <ul role="list" class="-my-4 divide-y divide-gray-200">
                                            {#each services.filter(s => selectedServices.includes(s.id)) as service}
                                                <li class="py-4 flex items-center justify-between">
                                                    <div class="flex items-start">
                                                        <p class="text-sm font-medium text-gray-900">{service.name}</p>
                                                    </div>
                                                    <div class="ml-4 flex-shrink-0 flex">
                                                        <p class="text-sm text-gray-500">{service.duration}</p>
                                                        {#if service.price}
                                                            <p class="ml-4 text-sm font-medium text-gray-900">${service.price}</p>
                                                        {/if}
                                                    </div>
                                                </li>
                                            {/each}
                                            <li class="py-4 flex items-center justify-between">
                                                <p class="text-sm font-medium text-gray-900">Total Duration</p>
                                                <p class="text-sm font-medium text-gray-900">{getSelectedServicesDuration()}</p>
                                            </li>
                                            <li class="py-4 flex items-center justify-between">
                                                <p class="text-sm font-medium text-gray-900">Total Price</p>
                                                <p class="text-sm font-medium text-gray-900">${getSelectedServicesTotal()}</p>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {/if}

                    {#if currentStep === 3}
                        <div class="space-y-6" transition:fade={{ duration: 200 }}>
                            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label for="date" class="block text-sm font-medium leading-6 text-gray-900">Date</label>
                                    <div class="mt-2">
                                        <input 
                                            type="date" 
                                            name="date" 
                                            id="date"
                                            min={new Date().toISOString().split('T')[0]}
                                            bind:value={date}
                                            class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        />
                                    </div>
                                    {#if formErrors.date}
                                        <p class="mt-2 text-sm text-red-600">{formErrors.date}</p>
                                    {/if}
                                </div>
                                <div>
                                    <label for="time" class="block text-sm font-medium leading-6 text-gray-900">Time</label>
                                    <div class="mt-2">
                                        <select
                                            name="time"
                                            id="time"
                                            bind:value={time}
                                            class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        >
                                            <option value="">Select a time</option>
                                            <!-- Morning slots -->
                                            <option value="08:00">8:00 AM</option>
                                            <option value="08:15">8:15 AM</option>
                                            <option value="08:30">8:30 AM</option>
                                            <option value="08:45">8:45 AM</option>
                                            <option value="09:00">9:00 AM</option>
                                            <option value="09:15">9:15 AM</option>
                                            <option value="09:30">9:30 AM</option>
                                            <option value="09:45">9:45 AM</option>
                                            <option value="10:00">10:00 AM</option>
                                            <option value="10:15">10:15 AM</option>
                                            <option value="10:30">10:30 AM</option>
                                            <option value="10:45">10:45 AM</option>
                                            <option value="11:00">11:00 AM</option>
                                            <option value="11:15">11:15 AM</option>
                                            <option value="11:30">11:30 AM</option>
                                            <option value="11:45">11:45 AM</option>
                                            <!-- Afternoon slots -->
                                            <option value="12:00">12:00 PM</option>
                                            <option value="12:15">12:15 PM</option>
                                            <option value="12:30">12:30 PM</option>
                                            <option value="12:45">12:45 PM</option>
                                            <option value="13:00">1:00 PM</option>
                                            <option value="13:15">1:15 PM</option>
                                            <option value="13:30">1:30 PM</option>
                                            <option value="13:45">1:45 PM</option>
                                            <option value="14:00">2:00 PM</option>
                                            <option value="14:15">2:15 PM</option>
                                            <option value="14:30">2:30 PM</option>
                                            <option value="14:45">2:45 PM</option>
                                            <option value="15:00">3:00 PM</option>
                                            <option value="15:15">3:15 PM</option>
                                            <option value="15:30">3:30 PM</option>
                                            <option value="15:45">3:45 PM</option>
                                            <!-- Evening slots -->
                                            <option value="16:00">4:00 PM</option>
                                            <option value="16:15">4:15 PM</option>
                                            <option value="16:30">4:30 PM</option>
                                            <option value="16:45">4:45 PM</option>
                                            <option value="17:00">5:00 PM</option>
                                            <option value="17:15">5:15 PM</option>
                                            <option value="17:30">5:30 PM</option>
                                            <option value="17:45">5:45 PM</option>
                                            <option value="18:00">6:00 PM</option>
                                            <option value="18:15">6:15 PM</option>
                                            <option value="18:30">6:30 PM</option>
                                            <option value="18:45">6:45 PM</option>
                                            <option value="19:00">7:00 PM</option>
                                            <option value="19:15">7:15 PM</option>
                                            <option value="19:30">7:30 PM</option>
                                            <option value="19:45">7:45 PM</option>
                                        </select>
                                    </div>
                                    {#if formErrors.time}
                                        <p class="mt-2 text-sm text-red-600">{formErrors.time}</p>
                                    {/if}
                                </div>
                            </div>

                            <div class="sm:col-span-6">
                                <label for="notes" class="block text-sm font-medium leading-6 text-gray-900">Notes</label>
                                <div class="mt-2">
                                    <textarea 
                                        id="notes" 
                                        name="notes" 
                                        rows="4" 
                                        bind:value={notes} 
                                        placeholder="Add any notes about this appointment..."
                                        class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    ></textarea>
                                </div>
                            </div>

                            <div class="bg-gray-50 p-4 rounded-md border border-gray-200">
                                <h3 class="text-sm font-medium text-gray-900">Appointment Summary</h3>
                                <dl class="mt-2 space-y-2">
                                    <div class="flex justify-between">
                                        <dt class="text-sm font-normal text-gray-500">Client:</dt>
                                        <dd class="text-sm font-medium text-gray-900">
                                            {selectedClient ? clients.find(c => c.id === selectedClient)?.name : 'None selected'}
                                        </dd>
                                    </div>
                                    <div class="flex justify-between">
                                        <dt class="text-sm font-normal text-gray-500">Services:</dt>
                                        <dd class="text-sm font-medium text-gray-900">
                                            {selectedServices.length > 0 
                                                ? services.filter(s => selectedServices.includes(s.id)).map(s => s.name).join(', ')
                                                : 'None selected'}
                                        </dd>
                                    </div>
                                    <div class="flex justify-between">
                                        <dt class="text-sm font-normal text-gray-500">Duration:</dt>
                                        <dd class="text-sm font-medium text-gray-900">{getSelectedServicesDuration()}</dd>
                                    </div>
                                    <div class="flex justify-between">
                                        <dt class="text-sm font-normal text-gray-500">Date/Time:</dt>
                                        <dd class="text-sm font-medium text-gray-900">{formattedDateTime}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    {/if}

                    <div class="flex justify-between mt-8">
                        {#if currentStep > 1}
                            <button 
                                type="button" 
                                on:click={prevStep}
                                class="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
                            >
                                <span class="flex items-center gap-x-1.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                                    </svg>
                                    Previous
                                </span>
                            </button>
                        {:else}
                            <div></div> <!-- Empty div for flex alignment -->
                        {/if}

                        {#if currentStep < totalSteps}
                            <button 
                                type="button" 
                                on:click={nextStep}
                                class="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                <span class="flex items-center gap-x-1.5">
                                    Next
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                    </svg>
                                </span>
                            </button>
                        {:else}
                            <button 
                                type="submit" 
                                class="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 {loading ? 'opacity-75 cursor-not-allowed' : ''}"
                                disabled={loading}
                            >
                                {loading ? 'Creating...' : 'Create Appointment'}
                            </button>
                        {/if}
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
