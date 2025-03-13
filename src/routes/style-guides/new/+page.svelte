<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { fade } from 'svelte/transition';

    let loading = false;
    let error: string | null = null;

    // Form data
    let name = '';
    let description = '';
    let steps: string[] = [''];
    let recommendedProducts: string[] = [];
    let newProduct = '';
    let showDoneButton = false;
    let guideImage: File | null = null;
    
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
            if (!name.trim()) formErrors.name = 'Style guide name is required';
            if (!description.trim()) formErrors.description = 'Description is required';
        } else if (currentStep === 2) {
            // Finalize steps before validation
            finalizeSteps();
            if (steps.length === 0) {
                formErrors.steps = 'Please add at least one step';
            }
        }
        
        return Object.keys(formErrors).length === 0;
    }

    function handleStepInput(index: number, value: string) {
        steps[index] = value;
        steps = steps; // Trigger reactivity

        // If this is the last step and it's not empty, add a new step
        if (index === steps.length - 1 && value.trim() !== '') {
            steps = [...steps, ''];
        }

        // Show done button if we have at least one non-empty step
        showDoneButton = steps.some(step => step.trim() !== '');
    }

    function finalizeSteps() {
        // Remove empty steps
        steps = steps.filter(step => step.trim() !== '');
    }

    function addProduct() {
        if (newProduct.trim()) {
            recommendedProducts = [...recommendedProducts, newProduct.trim()];
            newProduct = '';
        }
    }

    function removeProduct(index: number) {
        recommendedProducts = recommendedProducts.filter((_, i) => i !== index);
    }

    async function handleSubmit() {
        // Validate all steps before submission
        formErrors = {};
        
        if (!name.trim()) formErrors.name = 'Style guide name is required';
        if (!description.trim()) formErrors.description = 'Description is required';
        
        // Finalize steps before validation
        finalizeSteps();
        if (steps.length === 0) {
            formErrors.steps = 'Please add at least one step';
        }
        
        if (Object.keys(formErrors).length > 0) {
            // Go to the first step with errors
            currentStep = formErrors.name || formErrors.description ? 1 : 2;
            return;
        }
        
        loading = true;
        error = null;

        try {
            // Get the current user to verify we're authenticated
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');
            
            // Format steps as numbered list
            const formattedSteps = steps.map((step, index) => 
                `Step ${index + 1}: ${step}`
            ).join('\n');
            
            // Step 1: Create the style guide
            const styleGuideData = {
                stylist_id: user.id,
                name,
                description,
                steps: formattedSteps,
                recommended_products: recommendedProducts
            };

            const { data: styleGuide, error: styleGuideError } = await supabase
                .from('style_guides')
                .insert([styleGuideData])
                .select()
                .single();

            if (styleGuideError) throw styleGuideError;

            // Step 2: Upload guide image if provided
            if (guideImage) {
                const fileExt = guideImage.name.split('.').pop();
                const filePath = `${styleGuide.id}/guide-image.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('style-guide-images')
                    .upload(filePath, guideImage);

                if (uploadError) throw uploadError;

                // Update style guide with image URL
                const { error: updateError } = await supabase
                    .from('style_guides')
                    .update({ image_url: filePath })
                    .eq('id', styleGuide.id);

                if (updateError) throw updateError;
            }

            // Redirect to style guides page after successful creation
            goto('/style-guides');
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
                <h1 class="text-2xl font-bold text-gray-900">New Style Guide</h1>
                <p class="mt-2 text-sm text-gray-600">Create a new style guide for your clients</p>
                
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
                            Step 1: Basic Information
                        {:else if currentStep === 2}
                            Step 2: Style Steps
                        {:else if currentStep === 3}
                            Step 3: Products & Images
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
                                <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
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
                                {#if formErrors.description}
                                    <p class="mt-2 text-sm text-red-600">{formErrors.description}</p>
                                {/if}
                                <p class="mt-2 text-sm text-gray-500">A brief description of the style guide for your clients.</p>
                            </div>
                        </div>
                    {/if}

                    {#if currentStep === 2}
                        <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6" transition:fade={{ duration: 200 }}>
                            <div class="sm:col-span-6">
                                <label for="steps" class="block text-sm font-medium text-gray-700">Style Steps</label>
                                <p class="mt-1 text-sm text-gray-500">Add the step-by-step instructions for this style.</p>
                                
                                {#if formErrors.steps}
                                    <p class="mt-2 text-sm text-red-600">{formErrors.steps}</p>
                                {/if}
                                
                                <div class="mt-1 space-y-3">
                                    {#each steps as step, i}
                                        <div class="flex gap-2 items-start" transition:fade>
                                            <div class="flex-grow">
                                                <label for="step-{i}" class="block text-sm font-medium text-gray-700 mb-1">Step {i + 1}</label>
                                                <input
                                                    type="text"
                                                    id="step-{i}"
                                                    bind:value={steps[i]}
                                                    on:input={(e) => handleStepInput(i, (e.target as HTMLInputElement).value)}
                                                    placeholder="Enter step instructions..."
                                                    class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                />
                                            </div>
                                            {#if i > 0}
                                                <button
                                                    type="button"
                                                    class="mt-7 text-gray-400 hover:text-gray-500"
                                                    on:click={() => {
                                                        steps = steps.filter((_, index) => index !== i);
                                                        showDoneButton = steps.some(step => step.trim() !== '');
                                                    }}
                                                >
                                                    <span class="sr-only">Remove step</span>
                                                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            {/if}
                                        </div>
                                    {/each}
                                    {#if showDoneButton}
                                        <button
                                            type="button"
                                            on:click={finalizeSteps}
                                            class="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                        >
                                            <svg class="-ml-0.5 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            Done adding steps
                                        </button>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {/if}

                    {#if currentStep === 3}
                        <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6" transition:fade={{ duration: 200 }}>
                            <div class="sm:col-span-6">
                                <label for="products" class="block text-sm font-medium text-gray-700">Recommended Products</label>
                                <p class="mt-1 text-sm text-gray-500">Add products that you recommend for this style.</p>
                                
                                <div class="mt-2 flex space-x-2">
                                    <input
                                        type="text"
                                        id="products"
                                        value={newProduct}
                                        on:input={(e) => newProduct = (e.target as HTMLInputElement).value}
                                        placeholder="Enter product name"
                                        class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    />
                                    <button
                                        type="button"
                                        on:click={addProduct}
                                        class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Add
                                    </button>
                                </div>
                                
                                {#if recommendedProducts.length > 0}
                                    <div class="mt-4 flex flex-wrap gap-2">
                                        {#each recommendedProducts as product, i}
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-indigo-100 text-indigo-800">
                                                {product}
                                                <button 
                                                    type="button" 
                                                    class="ml-1.5 inline-flex flex-shrink-0 h-4 w-4 rounded-full text-indigo-400 hover:text-indigo-600 focus:outline-none focus:text-indigo-500"
                                                    on:click={() => removeProduct(i)}
                                                >
                                                    <span class="sr-only">Remove {product}</span>
                                                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </span>
                                        {/each}
                                    </div>
                                {/if}
                            </div>

                            <div class="sm:col-span-6">
                                <label for="guide-image-upload" class="block text-sm font-medium text-gray-700">Style Image</label>
                                <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                    <div class="space-y-1 text-center">
                                        {#if guideImage}
                                            <div class="flex justify-center">
                                                <img src={URL.createObjectURL(guideImage)} alt="Style guide preview" class="h-40 object-cover" />
                                            </div>
                                            <button 
                                                type="button" 
                                                on:click={() => guideImage = null}
                                                class="text-sm text-red-600 hover:text-red-500 mt-2"
                                            >
                                                Remove image
                                            </button>
                                        {:else}
                                            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H8m36-12h-4m-8 0V8m0 0v20m0-20h-4m4 0h4" stroke-width="2" stroke-linecap="round" />
                                            </svg>
                                            <div class="flex text-sm text-gray-600">
                                                <label for="guide-image-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                                    <span>Upload an image</span>
                                                    <input 
                                                        id="guide-image-upload" 
                                                        name="guide-image-upload" 
                                                        type="file" 
                                                        class="sr-only" 
                                                        on:change={(e) => {
                                                            const target = e.target as HTMLInputElement;
                                                            if (target && target.files && target.files.length > 0) {
                                                                guideImage = target.files[0];
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
                                    Create Style Guide
                                {/if}
                            </button>
                        {/if}
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
