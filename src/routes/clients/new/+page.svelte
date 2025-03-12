<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import type { Database } from '$lib/supabase';
    import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js';
    import { fade } from 'svelte/transition';

    let availableServices = [];
    let loading = false;
    let error: string | null = null;

    // Form data
    let firstName = '';
    let lastName = '';
    let middleInitial = '';
    let clientEmail = '';
    let phone = '';
    let formattedPhone = '';
    let phoneError = '';
    let notes = '';
    let hair_type = '';
    let preferred_products = '';
    let selectedServices: string[] = [];
    let selectedStyleGuide = '';
    let hairImage: File | null = null;
    
    // Form validation
    let formErrors: Record<string, string> = {};
    
    // Multi-step form
    let currentStep = 1;
    const totalSteps = 3;
    
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
            if (!firstName.trim()) formErrors.firstName = 'First name is required';
            if (!lastName.trim()) formErrors.lastName = 'Last name is required';
            if (clientEmail && !isValidEmail(clientEmail)) formErrors.clientEmail = 'Please enter a valid email';
            if (phone && !isValidPhoneNumber(phone, 'US')) formErrors.phone = 'Please enter a valid phone number';
        }
        
        return Object.keys(formErrors).length === 0;
    }
    
    function isValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    function formatPhoneNumber(value: string): string {
        if (!value) return '';
        
        try {
            const phoneNumber = parsePhoneNumberFromString(value, 'US');
            if (phoneNumber) {
                return phoneNumber.formatNational();
            }
            return value;
        } catch (e) {
            return value;
        }
    }
    
    function handlePhoneInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const value = input.value.replace(/\D/g, '');
        
        // Store raw phone number for validation
        phone = value;
        
        // Format for display
        formattedPhone = formatPhoneNumber(value);
        
        // Validate
        phoneError = value && !isValidPhoneNumber(`+1${value}`, 'US') ? 'Please enter a valid phone number' : '';
    }

    // Predefined hair types
    const hairTypes = [
        { id: 'straight', name: 'Straight' },
        { id: 'wavy', name: 'Wavy' },
        { id: 'curly', name: 'Curly' },
        { id: 'coily', name: 'Coily' },
        { id: 'fine', name: 'Fine' },
        { id: 'medium', name: 'Medium' },
        { id: 'thick', name: 'Thick' },
        { id: 'processed', name: 'Chemically Processed' }
    ];

    let styleGuides = [];
    let selectedStyleGuides: string[] = [];

    async function loadStyleGuides() {
        const { data, error } = await supabase
            .from('style_guides')
            .select('id, name, description, recommended_products')
            .order('name');
        
        if (error) {
            console.error('Error fetching style guides:', error);
        } else {
            styleGuides = data;
        }
    }

    function handleStyleGuideChange(event) {
        const selectedGuide = styleGuides.find(guide => guide.id === event.target.value);
        if (selectedGuide && selectedGuide.recommended_products) {
            preferred_products = selectedGuide.recommended_products.join(', ');
        }
    }

    onMount(async () => {
        await Promise.all([loadServices(), loadStyleGuides()]);
    });

    async function loadServices() {
        const { data, error } = await supabase.from('services').select('id, name');
        if (error) {
            console.error('Error fetching services:', error);
        } else {
            availableServices = data;
        }
    }

    async function handleSubmit() {
        // Validate all steps before submission
        formErrors = {};
        
        if (!firstName.trim()) formErrors.firstName = 'First name is required';
        if (!lastName.trim()) formErrors.lastName = 'Last name is required';
        if (clientEmail && !isValidEmail(clientEmail)) formErrors.clientEmail = 'Please enter a valid email';
        if (phone && !isValidPhoneNumber(`+1${phone}`, 'US')) formErrors.phone = 'Please enter a valid phone number';
        
        if (Object.keys(formErrors).length > 0) {
            // Go to the first step with errors
            currentStep = 1;
            return;
        }
        
        loading = true;
        error = null;

        try {
            // Get the current user to verify we're authenticated
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');
            
            const fullName = `${firstName} ${middleInitial ? middleInitial + '.' : ''} ${lastName}`.trim();
            
            // Step 1: Create the client
            const clientData = {
                name: fullName,
                email: clientEmail,
                phone,
                notes,
                hair_type,
                preferred_products,
                style_guide: selectedStyleGuide,
                stylist_id: user.id  // Add the stylist_id to associate the client with the stylist
            };

            const { data: client, error: clientError } = await supabase
                .from('clients')
                .insert([clientData])
                .select()
                .single();

            if (clientError) throw clientError;

            // Step 2: Upload hair image if provided
            if (hairImage) {
                const fileExt = hairImage.name.split('.').pop();
                const filePath = `${client.id}/hair-type.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('client-images')
                    .upload(filePath, hairImage);

                if (uploadError) throw uploadError;

                // Update client with image URL
                const { error: updateError } = await supabase
                    .from('clients')
                    .update({ hair_image_url: filePath })
                    .eq('id', client.id);

                if (updateError) throw updateError;
            }

            // Step 3: Link selected services to the client
            if (selectedServices.length > 0) {
                // Get the current user to verify we're authenticated
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');
                
                // Verify the client was created and belongs to this stylist
                const { data: verifyClients, error: verifyError } = await supabase
                    .from('clients')
                    .select('id')
                    .eq('id', client.id)
                    .eq('stylist_id', user.id);
                
                // Check if we got any results instead of using .single()
                    
                if (verifyError) throw verifyError;
                if (!verifyClients || verifyClients.length === 0) throw new Error('Client creation verification failed');
                
                // Now create the client-service relationships
                const clientServices = selectedServices.map(serviceId => ({
                    client_id: client.id,
                    service_id: serviceId
                }));

                const { error: servicesError } = await supabase
                    .from('client_services')
                    .insert(clientServices);

                if (servicesError) throw servicesError;
            }

            // Redirect to the client's page
            goto(`/clients/${client.id}`);
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    onMount(loadServices);
</script>

<div class="py-6 bg-gray-50 min-h-screen">
    <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div class="bg-white rounded-lg shadow-lg overflow-hidden">
            <div class="px-6 py-8 border-b border-gray-200">
                <h1 class="text-2xl font-bold text-gray-900">New Client</h1>
                <p class="mt-2 text-sm text-gray-600">Add a new client to your database</p>
                
                <!-- Progress bar -->
                <div class="mt-6">
                    <div class="flex items-center justify-between">
                        {#each Array(totalSteps) as _, i}
                            <div class="flex items-center">
                                <div class={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep > i ? 'bg-indigo-600' : currentStep === i+1 ? 'bg-indigo-500' : 'bg-gray-300'} text-white`}>
                                    {i+1}
                                </div>
                                {#if i < totalSteps - 1}
                                    <div class={`w-full h-1 mx-2 ${currentStep > i+1 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                    <div class="flex justify-between mt-2 text-xs text-gray-600">
                        <div>Personal Info</div>
                        <div>Hair Details</div>
                        <div>Additional Info</div>
                    </div>
                </div>
            </div>

            {#if error}
                <div class="px-6 py-4 text-sm text-red-700 bg-red-100">{error}</div>
            {/if}

            <form on:submit|preventDefault={handleSubmit} class="px-6 py-6 space-y-6" transition:fade={{ duration: 200 }}>
            {#if currentStep === 1}
                <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6" transition:fade={{ duration: 200 }}>
                <div class="sm:col-span-2">
                    <label for="firstName" class="block text-sm font-medium text-gray-700">First Name</label>
                    <div class="mt-1">
                        <input
                            type="text"
                            name="firstName"
                            id="firstName"
                            bind:value={firstName}
                            required
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div class="sm:col-span-1">
                    <label for="middleInitial" class="block text-sm font-medium text-gray-700">Middle Initial</label>
                    <div class="mt-1">
                        <input
                            type="text"
                            name="middleInitial"
                            id="middleInitial"
                            bind:value={middleInitial}
                            maxlength="1"
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div class="sm:col-span-3">
                    <label for="lastName" class="block text-sm font-medium text-gray-700">Last Name</label>
                    <div class="mt-1">
                        <input
                            type="text"
                            name="lastName"
                            id="lastName"
                            bind:value={lastName}
                            required
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div class="sm:col-span-3">
                    <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                    <div class="mt-1">
                        <input
                            type="email"
                            name="email"
                            id="email"
                            bind:value={clientEmail}
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div class="sm:col-span-3">
                    <label for="phone" class="block text-sm font-medium text-gray-700">Phone</label>
                    <div class="mt-1 relative">
                        <input
                            type="tel"
                            name="phone"
                            id="phone"
                            value={formattedPhone}
                            on:input={handlePhoneInput}
                            placeholder="(555) 123-4567"
                            class="block w-full rounded-md ${formErrors.phone ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'} shadow-sm sm:text-sm"
                            aria-invalid={formErrors.phone ? 'true' : 'false'}
                            aria-describedby={formErrors.phone ? 'phone-error' : undefined}
                        />
                        {#if formErrors.phone}
                            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <svg class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                                </svg>
                            </div>
                        {/if}
                    </div>
                    {#if formErrors.phone}
                        <p class="mt-2 text-sm text-red-600" id="phone-error">{formErrors.phone}</p>
                    {/if}
                </div>

                </div>
            {/if}

            {#if currentStep === 2}
                <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6" transition:fade={{ duration: 200 }}>                
                    <div class="sm:col-span-3">
                        <label for="hair_type" class="block text-sm font-medium text-gray-700">Hair Type</label>
                        <div class="mt-1">
                            <select
                                id="hair_type"
                                name="hair_type"
                                bind:value={hair_type}
                                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                                <option value="">Select a hair type</option>
                                {#each hairTypes as type}
                                    <option value={type.id}>{type.name}</option>
                                {/each}
                            </select>
                        </div>
                    </div>

                    <div class="sm:col-span-3">
                        <label for="hairImage" class="block text-sm font-medium text-gray-700">Hair Photo</label>
                        <div class="mt-1">
                            <input
                                type="file"
                                id="hairImage"
                                name="hairImage"
                                accept="image/*"
                                on:change={(e) => hairImage = e.target.files?.[0] || null}
                                class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                        </div>
                        {#if hairImage}
                            <div class="mt-2">
                                <p class="text-xs text-gray-500">Selected: {hairImage.name}</p>
                            </div>
                        {/if}
                    </div>

                    <div class="sm:col-span-6">
                        <label for="style_guides" class="block text-sm font-medium text-gray-700">Style Guides</label>
                        <div class="mt-4 space-y-2">
                            <!-- Style guides content will go here -->
                        </div>
                    </div>

                    <div class="sm:col-span-6">
                        <label for="services" class="block text-sm font-medium text-gray-700">Services</label>
                        <div class="mt-4 space-y-2">
                            {#each availableServices as service}
                                <label class="inline-flex items-center mr-4">
                                    <input
                                        type="checkbox"
                                        value={service.id}
                                        bind:group={selectedServices}
                                        class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span class="ml-2 text-sm text-gray-700">{service.name}</span>
                                </label>
                            {/each}
                        </div>
                    </div>
            </div>
        {/if}

        {#if currentStep === 3}
            <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6" transition:fade={{ duration: 200 }}>

                <div class="sm:col-span-6">
                    <label for="style_guides" class="block text-sm font-medium text-gray-700">Style Guides</label>
                    <div class="mt-4 space-y-2">
                        {#each styleGuides as guide}
                            <label class="inline-flex items-center mr-4">
                                <input
                                    type="checkbox"
                                    value={guide.id}
                                    bind:group={selectedStyleGuides}
                                    class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span class="ml-2 text-sm text-gray-700">{guide.name}</span>
                            </label>
                        {/each}
                    </div>
                    {#if selectedStyleGuides.length > 0}
                        <div class="mt-2 flex flex-wrap gap-2">
                            {#each selectedStyleGuides as guideId}
                                {@const guide = styleGuides.find(g => g.id === guideId)}
                                {#if guide}
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                        {guide.name}
                                    </span>
                                {/if}
                            {/each}
                        </div>
                    {/if}
                </div>

                <div class="sm:col-span-6">
                    <label for="preferred_products" class="block text-sm font-medium text-gray-700">Preferred Products</label>
                    <div class="mt-1">
                        <textarea
                            id="preferred_products"
                            name="preferred_products"
                            rows="3"
                            bind:value={preferred_products}
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        ></textarea>
                    </div>
                </div>

                <div class="sm:col-span-6">
                    <label for="notes" class="block text-sm font-medium text-gray-700">Notes</label>
                    <div class="mt-1">
                        <textarea
                            id="notes"
                            name="notes"
                            rows="3"
                            bind:value={notes}
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        ></textarea>
                    </div>
                </div>
            </div>
        {/if}

            <div class="flex justify-between mt-6">
                {#if currentStep > 1}
                    <button 
                        type="button" 
                        on:click={prevStep}
                        class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <svg class="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
                        </svg>
                        Previous
                    </button>
                {:else}
                    <div></div>
                {/if}
                
                {#if currentStep < totalSteps}
                    <button 
                        type="button" 
                        on:click={nextStep}
                        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Next
                        <svg class="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                        </svg>
                    </button>
                {:else}
                    <button
                        type="submit"
                        disabled={loading}
                        class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Client'}
                    </button>
                {/if}
            </div>
        </form>
    </div>
</div>
</div>