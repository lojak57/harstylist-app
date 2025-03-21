<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import type { Database } from '$lib/supabase';
    import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js';
    import { fade } from 'svelte/transition';

    // Define types for our data
    type Service = {
        id: string;
        name: string;
        description?: string;
    };

    type StyleGuide = {
        id: string;
        name: string;
        description?: string;
        recommended_products?: string[] | string;
    };

    let availableServices: Service[] = [];
    let loading = false;
    let error: string | null = null;

    // Form data
    let first_name = '';
    let last_name = '';
    let middleInitial = '';
    let email = '';
    let phone = '';
    let formattedPhone = '';
    let phoneError = '';
    let phoneArea = '';
    let phonePrefix = '';
    let phoneLine = '';
    let address = '';
    let city = '';
    let state = '';
    let zip = '';
    let birth_date = '';
    let notes = '';
    let hair_type = '';
    let preferred_products = '';
    let selectedServices: string[] = [];
    let selectedStyleGuide = '';
    let hairImage: File | null = null;
    
    // References for phone input fields
    let phonePrefixInput: HTMLInputElement;
    let phoneLineInput: HTMLInputElement;
    
    // Form validation
    let formErrors: Record<string, string> = {};
    
    // Multi-step form
    let currentStep = 1;
    const totalSteps = 3;
    
    function nextStep(): void {
        if (validateCurrentStep()) {
            currentStep = Math.min(currentStep + 1, totalSteps);
        }
    }
    
    function prevStep(): void {
        currentStep = Math.max(currentStep - 1, 1);
    }
    
    function validateCurrentStep(): boolean {
        formErrors = {};
        
        if (currentStep === 1) {
            if (!first_name.trim()) formErrors.first_name = 'First name is required';
            if (!last_name.trim()) formErrors.last_name = 'Last name is required';
            if (email && !isValidEmail(email)) formErrors.email = 'Please enter a valid email';
            if (phone && !isValidPhoneNumber(`+1${phone}`, 'US')) formErrors.phone = 'Please enter a valid phone number';
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
    
    function handlePhoneAreaInput(e: Event): void {
        const target = e.target as HTMLInputElement;
        const value = target.value.replace(/\D/g, '');
        phoneArea = value;
        
        // Auto-advance to prefix field when 3 digits are entered
        if (value.length === 3 && phonePrefixInput) {
            phonePrefixInput.focus();
        }
        
        updatePhoneValue();
    }
    
    function handlePhoneAreaKeydown(e: KeyboardEvent): void {
        // If backspace is pressed on empty area field, do nothing special
        if (e.key === 'Backspace' && phoneArea.length === 0) {
            return;
        }
    }
    
    function handlePhonePrefixInput(e: Event): void {
        const target = e.target as HTMLInputElement;
        const value = target.value.replace(/\D/g, '');
        phonePrefix = value;
        
        // Auto-advance to line field when 3 digits are entered
        if (value.length === 3 && phoneLineInput) {
            phoneLineInput.focus();
        }
        
        updatePhoneValue();
    }
    
    function handlePhonePrefixKeydown(e: KeyboardEvent): void {
        // Move focus back to area field when backspace is pressed on empty prefix field
        if (e.key === 'Backspace' && phonePrefix.length === 0) {
            const areaInput = document.getElementById('phone_area') as HTMLInputElement;
            if (areaInput) areaInput.focus();
        }
    }
    
    function handlePhoneLineInput(e: Event): void {
        const target = e.target as HTMLInputElement;
        const value = target.value.replace(/\D/g, '');
        phoneLine = value;
        updatePhoneValue();
    }
    
    function updatePhoneValue(): void {
        phone = `${phoneArea}${phonePrefix}${phoneLine}`;
        formattedPhone = phone.length > 0 ? `(${phoneArea}) ${phonePrefix}-${phoneLine}` : '';
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

    let styleGuides: StyleGuide[] = [];
    let selectedStyleGuides: string[] = [];

    async function loadStyleGuides(): Promise<void> {
        const { data, error } = await supabase
            .from('style_guides')
            .select('id, name, description, recommended_products')
            .order('name');
        
        if (error) {
            console.error('Error fetching style guides:', error);
        } else {
            styleGuides = data || [];
        }
    }

    function handleStyleGuideChange(event: Event): void {
        const target = event.target as HTMLSelectElement;
        const selectedGuide = styleGuides.find(guide => guide.id === target.value);
        if (selectedGuide && selectedGuide.recommended_products) {
            if (Array.isArray(selectedGuide.recommended_products)) {
                preferred_products = selectedGuide.recommended_products.join(', ');
            } else if (typeof selectedGuide.recommended_products === 'string') {
                preferred_products = selectedGuide.recommended_products;
            }
        }
    }

    onMount(async () => {
        await Promise.all([loadServices(), loadStyleGuides()]);
    });

    async function loadServices(): Promise<void> {
        try {
            // Get the current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError) {
                console.error('Error getting current user:', userError);
                return;
            }
            
            if (!user) {
                console.error('No authenticated user found');
                return;
            }
            
            // Fetch only services for the current stylist
            const { data, error } = await supabase
                .from('services')
                .select('id, name, description')
                .eq('stylist_id', user.id);
                
            if (error) {
                console.error('Error fetching services:', error);
            } else {
                availableServices = data || [];
                console.log('Loaded services for stylist:', availableServices.length);
            }
        } catch (err) {
            console.error('Error in loadServices:', err);
        }
    }

    async function handleSubmit(): Promise<void> {
        // Validate all steps before submission
        formErrors = {};
        
        if (!first_name.trim()) formErrors.first_name = 'First name is required';
        if (!last_name.trim()) formErrors.last_name = 'Last name is required';
        if (email && !isValidEmail(email)) formErrors.email = 'Please enter a valid email';
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
            
            const fullName = `${first_name} ${middleInitial ? middleInitial + '.' : ''} ${last_name}`.trim();
            
            // Step 1: Create the client
            const clientData = {
                name: fullName,
                email,
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
        } catch (e: unknown) {
            error = e instanceof Error ? e.message : 'An unknown error occurred';
        } finally {
            loading = false;
        }
    }

    onMount(loadServices);

    // Toggle service selection
    function toggleService(serviceId: string): void {
        const index = selectedServices.indexOf(serviceId);
        if (index !== -1) {
            selectedServices.splice(index, 1);
            selectedServices = [...selectedServices]; // Trigger reactivity
        } else {
            selectedServices = [...selectedServices, serviceId]; // Trigger reactivity
        }
        console.log('Selected services:', selectedServices); // Debug line
    }
</script>

<div class="py-6 bg-pattern min-h-screen">
    <div class="max-w-3xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-indigo-100">
            <h2 class="text-2xl font-semibold text-gray-800 font-display">Create New Client</h2>
            <p class="text-gray-600 font-body mt-1">Add a new client to your database</p>
        </div>

        <div class="px-6 pt-4">
            <div class="mb-6">
                <div class="relative pt-1">
                    <div class="flex items-center justify-between mb-2">
                        <div>
                            <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-100">
                                Step {currentStep} of {totalSteps}
                            </span>
                        </div>
                        <div class="text-right">
                            <span class="text-xs font-semibold inline-block text-indigo-600">
                                {Math.round((currentStep / totalSteps) * 100)}%
                            </span>
                        </div>
                    </div>
                    <div class="overflow-hidden h-2 text-xs flex rounded bg-indigo-100">
                        <div 
                            style="width: {(currentStep / totalSteps) * 100}%" 
                            class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 transition-all duration-500 ease-in-out"
                        ></div>
                    </div>
                </div>
                <div class="flex justify-between mt-2 text-sm text-gray-600">
                    <div class="flex space-x-6 px-2">
                        <div class="flex flex-col items-center">
                            <div class="{currentStep >= 1 ? 'bg-indigo-600' : 'bg-gray-300'} h-6 w-6 rounded-full flex items-center justify-center mb-1">
                                <span class="text-white text-xs">{currentStep > 1 ? '✓' : '1'}</span>
                            </div>
                            <span class="text-xs {currentStep === 1 ? 'font-medium text-indigo-700' : 'text-gray-500'}">Personal Info</span>
                        </div>
                        <div class="flex flex-col items-center">
                            <div class="{currentStep >= 2 ? 'bg-indigo-600' : 'bg-gray-300'} h-6 w-6 rounded-full flex items-center justify-center mb-1">
                                <span class="text-white text-xs">{currentStep > 2 ? '✓' : '2'}</span>
                            </div>
                            <span class="text-xs {currentStep === 2 ? 'font-medium text-indigo-700' : 'text-gray-500'}">Hair Details</span>
                        </div>
                        <div class="flex flex-col items-center">
                            <div class="{currentStep >= 3 ? 'bg-indigo-600' : 'bg-gray-300'} h-6 w-6 rounded-full flex items-center justify-center mb-1">
                                <span class="text-white text-xs">{currentStep > 3 ? '✓' : '3'}</span>
                            </div>
                            <span class="text-xs {currentStep === 3 ? 'font-medium text-indigo-700' : 'text-gray-500'}">Services</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {#if error}
            <div class="px-6 py-4 text-sm text-red-700 bg-red-100">{error}</div>
        {/if}

        <form on:submit|preventDefault={handleSubmit} class="px-6 py-6 space-y-6" transition:fade={{ duration: 200 }}>
        {#if currentStep === 1}
            <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6" transition:fade={{ duration: 200 }}>
                <div class="sm:col-span-3">
                    <label for="first_name" class="block text-sm font-medium text-gray-700">First name</label>
                    <div class="mt-1">
                        <input
                            id="first_name"
                            name="first_name"
                            type="text"
                            bind:value={first_name}
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div class="sm:col-span-3">
                    <label for="last_name" class="block text-sm font-medium text-gray-700">Last name</label>
                    <div class="mt-1">
                        <input
                            id="last_name"
                            name="last_name"
                            type="text"
                            bind:value={last_name}
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div class="sm:col-span-4">
                    <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                    <div class="mt-1">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            bind:value={email}
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div class="sm:col-span-6">
                    <label for="phone" class="block text-sm font-medium text-gray-700">Phone</label>
                    <div class="mt-1 flex gap-2">
                        <div class="w-24">
                            <input
                                id="phone_area"
                                name="phone_area"
                                type="text"
                                maxlength="3"
                                placeholder="Area"
                                bind:value={phoneArea}
                                on:input={handlePhoneAreaInput}
                                on:keydown={handlePhoneAreaKeydown}
                                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-center"
                            />
                        </div>
                        <div class="w-24">
                            <input
                                id="phone_prefix"
                                name="phone_prefix"
                                type="text"
                                maxlength="3"
                                placeholder="Prefix"
                                bind:value={phonePrefix}
                                bind:this={phonePrefixInput}
                                on:input={handlePhonePrefixInput}
                                on:keydown={handlePhonePrefixKeydown}
                                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-center"
                            />
                        </div>
                        <div class="w-32">
                            <input
                                id="phone_line"
                                name="phone_line"
                                type="text"
                                maxlength="4"
                                placeholder="Line"
                                bind:value={phoneLine}
                                bind:this={phoneLineInput}
                                on:input={handlePhoneLineInput}
                                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-center"
                            />
                        </div>
                    </div>
                    <p class="mt-1 text-sm text-gray-500">Format: XXX-XXX-XXXX</p>
                </div>

                <div class="sm:col-span-6">
                    <label for="address" class="block text-sm font-medium text-gray-700">Street address</label>
                    <div class="mt-1">
                        <input
                            id="address"
                            name="address"
                            type="text"
                            bind:value={address}
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div class="sm:col-span-2">
                    <label for="city" class="block text-sm font-medium text-gray-700">City</label>
                    <div class="mt-1">
                        <input
                            id="city"
                            name="city"
                            type="text"
                            bind:value={city}
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div class="sm:col-span-2">
                    <label for="state" class="block text-sm font-medium text-gray-700">State / Province</label>
                    <div class="mt-1">
                        <input
                            id="state"
                            name="state"
                            type="text"
                            bind:value={state}
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div class="sm:col-span-2">
                    <label for="zip" class="block text-sm font-medium text-gray-700">ZIP / Postal code</label>
                    <div class="mt-1">
                        <input
                            id="zip"
                            name="zip"
                            type="text"
                            bind:value={zip}
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div class="sm:col-span-6">
                    <label for="birth_date" class="block text-sm font-medium text-gray-700">Birth Date</label>
                    <div class="mt-1">
                        <input
                            id="birth_date"
                            name="birth_date"
                            type="date"
                            bind:value={birth_date}
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
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
                            on:change={(e) => {
                                const target = e.target as HTMLInputElement;
                                hairImage = target.files?.[0] || null;
                            }}
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
                    <label for="style_guide" class="block text-sm font-medium text-gray-700">Style Guide</label>
                    <div class="mt-1">
                        <select
                            id="style_guide"
                            name="style_guide"
                            bind:value={selectedStyleGuide}
                            on:change={handleStyleGuideChange}
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                            <option value="">Select a style guide</option>
                            {#each styleGuides as guide}
                                <option value={guide.id}>{guide.name}</option>
                            {/each}
                        </select>
                    </div>
                    {#if selectedStyleGuide}
                        {@const selectedGuideInfo = styleGuides.find(g => g.id === selectedStyleGuide)}
                        <div class="mt-2 p-4 bg-gray-50 rounded-md border border-gray-200 text-sm text-gray-700">
                            {#if selectedGuideInfo?.description}
                                <div class="mb-2">
                                    <h4 class="font-medium text-gray-900 mb-1">Description:</h4>
                                    <p class="text-gray-700">{selectedGuideInfo.description}</p>
                                </div>
                            {/if}
                            
                            {#if selectedGuideInfo?.recommended_products}
                                <div>
                                    <h4 class="font-medium text-gray-900 mb-1">Recommended Products:</h4>
                                    <ul class="list-disc pl-5 text-gray-700">
                                    {#if Array.isArray(selectedGuideInfo.recommended_products)}
                                        {#each selectedGuideInfo.recommended_products as product}
                                            <li>{product}</li>
                                        {/each}
                                    {:else}
                                        <li>{selectedGuideInfo.recommended_products}</li>
                                    {/if}
                                    </ul>
                                </div>
                            {/if}
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
            </div>
        {/if}

        {#if currentStep === 3}
            <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6" transition:fade={{ duration: 200 }}>
                <div class="sm:col-span-6">
                    <div class="mb-4">
                        <h3 class="text-lg font-medium text-gray-900">Select Services</h3>
                        <p class="text-sm text-gray-500">Choose the services this client is interested in</p>
                    </div>
                    
                    <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {#each availableServices as service}
                            <button 
                                type="button"
                                class="text-left w-full relative flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150 cursor-pointer {selectedServices.includes(service.id) ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-200 ring-opacity-50' : ''}"
                                on:click={() => toggleService(service.id)}
                                aria-pressed={selectedServices.includes(service.id)}
                            >
                                <div class="min-w-0 flex-1 text-sm">
                                    <span class="font-medium text-gray-700 select-none">{service.name}</span>
                                    {#if service.description}
                                        <p class="text-xs text-gray-500 mt-1">{service.description}</p>
                                    {/if}
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
                    </div>
                    
                    {#if selectedServices.length > 0}
                        <div class="mt-4 p-4 border border-indigo-100 bg-indigo-50 rounded-md">
                            <h4 class="text-sm font-medium text-indigo-800 mb-2">Selected Services:</h4>
                            <div class="flex flex-wrap gap-2">
                                {#each selectedServices as serviceId}
                                    {@const service = availableServices.find(s => s.id === serviceId)}
                                    {#if service}
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                            {service.name}
                                            <button 
                                                type="button" 
                                                class="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-indigo-400 hover:bg-indigo-200 hover:text-indigo-600 focus:outline-none focus:bg-indigo-500 focus:text-white"
                                                on:click|stopPropagation={() => toggleService(serviceId)}
                                            >
                                                <span class="sr-only">Remove {service.name}</span>
                                                <svg class="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                                                    <path stroke-linecap="round" stroke-width="1.5" d="M1 1l6 6m0-6L1 7" />
                                                </svg>
                                            </button>
                                        </span>
                                    {/if}
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
                
                <div class="sm:col-span-6">
                    <label for="notes" class="block text-sm font-medium text-gray-700">Additional Notes</label>
                    <div class="mt-1">
                        <textarea
                            id="notes"
                            name="notes"
                            rows="4"
                            bind:value={notes}
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Any additional details about this client that might be helpful"
                        ></textarea>
                    </div>
                </div>
            </div>
        {/if}

            <div class="flex justify-between mt-6 px-6 py-4 bg-gray-50 border-t border-gray-200">
                {#if currentStep > 1}
                    <button 
                        type="button" 
                        on:click={prevStep}
                        class="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                    >
                        Back
                    </button>
                {:else}
                    <div></div>
                {/if}
                
                {#if currentStep < totalSteps}
                    <button 
                        type="button" 
                        on:click={nextStep}
                        class="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                    >
                        Next
                    </button>
                {:else}
                    <button 
                        type="submit" 
                        disabled={loading}
                        class="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed flex items-center"
                    >
                        {#if loading}
                            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating...
                        {:else}
                            Create Client
                        {/if}
                    </button>
                {/if}
            </div>
        </form>
    </div>
</div>