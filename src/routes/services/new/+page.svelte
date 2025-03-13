<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { fade } from 'svelte/transition';

    let loading = false;
    let error: string | null = null;

    // Form data
    let name = '';
    let category = 'both';
    let description = '';
    let duration = '';
    let price = 0;
    let formattedPrice = '$0';
    let serviceImage: File | null = null;
    
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
            if (!name.trim()) formErrors.name = 'Service name is required';
            if (!category) formErrors.category = 'Category is required';
        } else if (currentStep === 2) {
            if (!duration) formErrors.duration = 'Duration is required';
            if (price < 0) formErrors.price = 'Price cannot be negative';
        }
        
        return Object.keys(formErrors).length === 0;
    }
    
    function formatPrice(value: number): string {
        return `$${value}`;
    }
    
    function handlePriceInput(event: Event) {
        const input = event.target as HTMLInputElement;
        // Remove non-numeric characters except decimal point
        const value = input.value.replace(/[^0-9.]/g, '');
        
        // Parse as float and handle validation
        const numericValue = parseFloat(value);
        price = isNaN(numericValue) ? 0 : numericValue;
        
        // Format for display
        formattedPrice = formatPrice(price);
    }

    // Service categories
    const serviceCategories = [
        { id: 'both', name: 'All Clients' },
        { id: 'men', name: 'Men Only' },
        { id: 'women', name: 'Women Only' },
        { id: 'children', name: 'Children Only' }
    ];

    async function handleSubmit() {
        // Validate all steps before submission
        formErrors = {};
        
        if (!name.trim()) formErrors.name = 'Service name is required';
        if (!category) formErrors.category = 'Category is required';
        if (!duration) formErrors.duration = 'Duration is required';
        
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
            
            // Step 1: Create the service
            const serviceData = {
                name,
                category,
                description,
                duration,
                price,
                stylist_id: user.id
            };

            const { data: service, error: serviceError } = await supabase
                .from('services')
                .insert([serviceData])
                .select()
                .single();

            if (serviceError) throw serviceError;

            // Step 2: Upload service image if provided
            if (serviceImage) {
                const fileExt = serviceImage.name.split('.').pop();
                const filePath = `${service.id}/service-image.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('service-images')
                    .upload(filePath, serviceImage);

                if (uploadError) throw uploadError;

                // Update service with image URL
                const { error: updateError } = await supabase
                    .from('services')
                    .update({ image_url: filePath })
                    .eq('id', service.id);

                if (updateError) throw updateError;
            }

            // Redirect to services page after successful creation
            goto('/services');
        } catch (err: any) {
            error = err.message;
            loading = false;
        }
    }
</script>

<div class="py-6 bg-gray-50 min-h-screen">
    <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div class="bg-white rounded-lg shadow-lg overflow-hidden">
            <div class="px-6 py-8 border-b border-gray-200">
                <h1 class="text-2xl font-bold text-gray-900">New Service</h1>
                <p class="mt-2 text-sm text-gray-600">Add a new service to your offerings</p>
                
                <!-- Step indicator -->
                <div class="mt-6">
                    <div class="flex items-center">
                        {#each Array(totalSteps) as _, i}
                            <div class="flex items-center relative">
                                <div class={`h-10 w-10 rounded-full flex items-center justify-center ${i + 1 <= currentStep ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                    {i + 1}
                                </div>
                                {#if i + 1 < totalSteps}
                                    <div class={`h-1 flex-1 w-16 mx-1 ${i + 1 < currentStep ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                    <div class="mt-2 text-sm text-gray-500">
                        {#if currentStep === 1}
                            Step 1: Basic Details
                        {:else if currentStep === 2}
                            Step 2: Pricing & Duration
                        {:else if currentStep === 3}
                            Step 3: Images & Final Details
                        {/if}
                    </div>
                </div>
            </div>

            <div class="px-6 py-6">
                {#if error}
                    <div class="rounded-md bg-red-50 p-4 mb-6">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                                </svg>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm font-medium text-red-800">{error}</p>
                            </div>
                        </div>
                    </div>
                {/if}

                <form on:submit|preventDefault={handleSubmit}>
                    {#if currentStep === 1}
                        <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6" transition:fade={{ duration: 200 }}>
                            <div class="sm:col-span-4">
                                <label for="name" class="block text-sm font-medium text-gray-700">Service Name</label>
                                <div class="mt-1">
                                    <input 
                                        type="text" 
                                        name="name" 
                                        id="name" 
                                        bind:value={name}
                                        class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>
                                {#if formErrors.name}
                                    <p class="mt-2 text-sm text-red-600">{formErrors.name}</p>
                                {/if}
                            </div>

                            <div class="sm:col-span-3">
                                <label for="category" class="block text-sm font-medium text-gray-700">Category</label>
                                <div class="mt-1">
                                    <select 
                                        id="category" 
                                        name="category" 
                                        bind:value={category}
                                        class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    >
                                        {#each serviceCategories as cat}
                                            <option value={cat.id}>{cat.name}</option>
                                        {/each}
                                    </select>
                                </div>
                                {#if formErrors.category}
                                    <p class="mt-2 text-sm text-red-600">{formErrors.category}</p>
                                {/if}
                            </div>

                            <div class="sm:col-span-6">
                                <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
                                <div class="mt-1">
                                    <textarea 
                                        id="description" 
                                        name="description" 
                                        rows="3" 
                                        bind:value={description}
                                        class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    ></textarea>
                                </div>
                                <p class="mt-2 text-sm text-gray-500">A brief description of the service for your clients.</p>
                            </div>
                        </div>
                    {/if}

                    {#if currentStep === 2}
                        <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6" transition:fade={{ duration: 200 }}>
                            <div class="sm:col-span-3">
                                <label for="duration" class="block text-sm font-medium text-gray-700">Duration</label>
                                <div class="mt-1">
                                    <select 
                                        id="duration" 
                                        name="duration" 
                                        bind:value={duration}
                                        class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    >
                                        <option value="">Select duration</option>
                                        {#each Array.from({length: 24}, (_, i) => (i + 2) * 15) as minutes}
                                            <option value={`${Math.floor(minutes / 60)} hour${Math.floor(minutes / 60) !== 1 ? 's' : ''} ${minutes % 60 ? `${minutes % 60} minutes` : ''}`?.trim()}>
                                                {Math.floor(minutes / 60) > 0 ? `${Math.floor(minutes / 60)} hour${Math.floor(minutes / 60) !== 1 ? 's' : ''}` : ''} 
                                                {minutes % 60 ? `${minutes % 60} minutes` : ''}
                                            </option>
                                        {/each}
                                    </select>
                                </div>
                                {#if formErrors.duration}
                                    <p class="mt-2 text-sm text-red-600">{formErrors.duration}</p>
                                {/if}
                            </div>

                            <div class="sm:col-span-3">
                                <label for="price" class="block text-sm font-medium text-gray-700">Price</label>
                                <div class="mt-1 relative rounded-md shadow-sm">
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span class="text-gray-500 sm:text-sm">$</span>
                                    </div>
                                    <input 
                                        type="text" 
                                        name="price" 
                                        id="price" 
                                        value={formattedPrice}
                                        on:input={handlePriceInput}
                                        class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>
                                {#if formErrors.price}
                                    <p class="mt-2 text-sm text-red-600">{formErrors.price}</p>
                                {/if}
                            </div>
                        </div>
                    {/if}

                    {#if currentStep === 3}
                        <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6" transition:fade={{ duration: 200 }}>
                            <div class="sm:col-span-6">
                                <label for="service-image-upload" class="block text-sm font-medium text-gray-700">Service Image</label>
                                <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                    <div class="space-y-1 text-center">
                                        {#if serviceImage}
                                            <div class="flex justify-center">
                                                <img src={URL.createObjectURL(serviceImage)} alt="Service preview" class="h-40 object-cover" />
                                            </div>
                                            <button 
                                                type="button" 
                                                on:click={() => serviceImage = null}
                                                class="text-sm text-red-600 hover:text-red-500 mt-2"
                                            >
                                                Remove image
                                            </button>
                                        {:else}
                                            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H8m36-12h-4m-8 0V8m0 0v20m0-20h-4m4 0h4" stroke-width="2" stroke-linecap="round" />
                                            </svg>
                                            <div class="flex text-sm text-gray-600">
                                                <label for="service-image-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                                    <span>Upload an image</span>
                                                    <input 
                                                        id="service-image-upload" 
                                                        name="service-image-upload" 
                                                        type="file" 
                                                        class="sr-only" 
                                                        on:change={(e) => {
                                                            const target = e.target as HTMLInputElement;
                                                            if (target && target.files && target.files.length > 0) {
                                                                serviceImage = target.files[0];
                                                            }
                                                        }}
                                                        accept="image/*"
                                                    />
                                                </label>
                                                <p class="pl-1">or drag and drop</p>
                                            </div>
                                            <p class="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                        {/if}
                                    </div>
                                </div>
                            </div>

                            <div class="sm:col-span-6">
                                <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                    <div class="flex">
                                        <div class="flex-shrink-0">
                                            <svg class="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                                            </svg>
                                        </div>
                                        <div class="ml-3">
                                            <p class="text-sm text-yellow-700">
                                                Please review your service details before submitting. Images help clients understand what to expect.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/if}

                    <div class="flex justify-between mt-6">
                        {#if currentStep > 1}
                            <button 
                                type="button" 
                                on:click={prevStep}
                                class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                                class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Continue
                            </button>
                        {:else}
                            <button 
                                type="submit" 
                                class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 {loading ? 'opacity-50 cursor-not-allowed' : ''}"
                                disabled={loading}
                            >
                                {#if loading}
                                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                {:else}
                                    Create Service
                                {/if}
                            </button>
                        {/if}
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
