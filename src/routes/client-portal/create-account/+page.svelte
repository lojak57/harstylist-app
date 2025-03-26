<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    // Track current step in the onboarding process
    let currentStep = 1;
    const totalSteps = 4;

    // Form fields
    let email = '';
    let password = '';
    let confirmPassword = '';
    let firstName = '';
    let lastName = '';
    let phoneCountryCode = '+1';
    let phoneNumber = '';
    let clientCode = '';
    let selectedStylistId = '';
    let loading = false;
    let error: string | null = null;
    let stepErrors: {[key: number]: string | null} = {};
    let successMessage = '';
    let stylists: any[] = [];

    onMount(async () => {
        // Check if user is already logged in
        const { data } = await supabase.auth.getSession();
        if (data.session) {
            goto('/client-portal');
        }

        // Load available stylists
        await loadStylists();
    });

    // Helper to get full name
    function getFullName() {
        return `${firstName} ${lastName}`.trim();
    }

    // Helper to get formatted phone
    function getFormattedPhone() {
        if (!phoneNumber) return '';
        return `${phoneCountryCode}${phoneNumber}`;
    }

    async function loadStylists() {
        try {
            const { data: stylistsData, error: stylistsError } = await supabase
                .from('stylists')
                .select('id, name, email')
                .order('name');
                
            if (stylistsError) throw stylistsError;
            
            stylists = stylistsData || [];
        } catch (e: any) {
            console.error('Error loading stylists:', e);
            error = e.message || 'Failed to load stylists';
        }
    }

    // Validates the client code against the selected stylist
    async function validateClientCode() {
        if (!clientCode) {
            stepErrors[3] = 'Please enter your client code';
            return false;
        }

        if (!selectedStylistId) {
            stepErrors[3] = 'Please select your stylist first';
            return false;
        }

        try {
            const { data, error: validateError } = await supabase
                .rpc('validate_client_code', {
                    code_param: clientCode,
                    stylist_id_param: selectedStylistId
                });

            if (validateError) throw validateError;
            
            if (!data) {
                stepErrors[3] = 'Invalid client code. Please check with your stylist.';
                return false;
            }
            
            return true;
        } catch (e: any) {
            console.error('Error validating client code:', e);
            stepErrors[3] = e.message || 'Failed to validate client code';
            return false;
        }
    }

    // Validate the current step before proceeding
    async function validateStep() {
        stepErrors[currentStep] = null;
        
        switch(currentStep) {
            case 1: // Email & Password
                if (!email) {
                    stepErrors[1] = 'Please enter your email';
                    return false;
                }
                
                if (!password) {
                    stepErrors[1] = 'Please enter a password';
                    return false;
                }

                if (password.length < 8) {
                    stepErrors[1] = 'Password must be at least 8 characters';
                    return false;
                }
                
                if (password !== confirmPassword) {
                    stepErrors[1] = 'Passwords do not match';
                    return false;
                }
                return true;
                
            case 2: // Personal Information
                if (!firstName) {
                    stepErrors[2] = 'Please enter your first name';
                    return false;
                }
                if (!lastName) {
                    stepErrors[2] = 'Please enter your last name';
                    return false;
                }
                return true;
                
            case 3: // Stylist Selection
                if (!selectedStylistId) {
                    stepErrors[3] = 'Please select your stylist';
                    return false;
                }
                return await validateClientCode();
                
            case 4: // Review & Submit
                return true;
        }
        
        return true;
    }

    // Navigate to the next step
    async function nextStep() {
        if (await validateStep()) {
            if (currentStep < totalSteps) {
                currentStep++;
            }
        }
    }

    // Go back to the previous step
    function prevStep() {
        if (currentStep > 1) {
            currentStep--;
        }
    }

    async function handleRegister() {
        try {
            loading = true;
            error = null;
            
            // Final validation before submission
            if (!email || !password || !firstName || !lastName || !selectedStylistId || !clientCode) {
                error = 'Please complete all required fields';
                return;
            }
            
            const fullName = getFullName();
            const formattedPhone = getFormattedPhone();
            
            // First, create the client record using the stylist's RLS policy
            const { data: clientData, error: clientError } = await supabase
                .rpc('create_client_for_registration', {
                    client_name: fullName,
                    client_email: email,
                    client_phone: formattedPhone || null,
                    stylist_id_param: selectedStylistId,
                    client_code_param: clientCode
                });
                
            if (clientError) {
                console.error('Error creating client:', clientError);
                throw clientError;
            }
            
            if (!clientData) {
                throw new Error('Failed to create client record');
            }
            
            console.log('Client record created with ID:', clientData);
            
            // Now create the user account
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/client-portal/login`,
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        full_name: fullName,
                        phone: formattedPhone || '',
                        client_id: clientData
                    }
                }
            });
            
            if (signUpError) {
                console.error('Error signing up:', signUpError);
                throw signUpError;
            }
            
            console.log('User account created:', data.user?.id);
            
            // Link the user account to the client record
            const { error: updateError } = await supabase
                .rpc('link_client_to_user', {
                    client_id_param: clientData,
                    user_id_param: data.user?.id
                });
                
            if (updateError) {
                console.error('Error linking client to user:', updateError);
                throw updateError;
            }
            
            console.log('Client successfully linked to user account');
            
            // Show success message
            successMessage = 'Account created! Please check your email to confirm your account.';
            
        } catch (e: any) {
            console.error('Registration error:', e);
            error = e.message || 'An error occurred during registration';
        } finally {
            loading = false;
        }
    }
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="text-center">
            <h2 class="text-3xl font-extrabold text-gray-900">Create Client Account</h2>
            <p class="mt-2 text-sm text-gray-600">
                Register to access your appointments and profile
            </p>
        </div>
        
        <!-- Progress indicator -->
        <div class="mt-6">
            <div class="relative">
                <!-- Progress bar background -->
                <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                    <!-- Progress bar filled -->
                    <div 
                        style="width:{(currentStep/totalSteps)*100}%" 
                        class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 transition-all duration-300"></div>
                </div>
                <!-- Step markers -->
                <div class="flex justify-between -mt-2">
                    {#each Array(totalSteps) as _, i}
                        <div 
                            class="flex items-center justify-center w-8 h-8 rounded-full text-xs 
                                {i + 1 <= currentStep ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'} 
                                transition-colors duration-300">
                            {i + 1}
                        </div>
                    {/each}
                </div>
                <!-- Step labels -->
                <div class="flex justify-between text-xs text-gray-600 mt-1">
                    <div class="w-8 text-center">Account</div>
                    <div class="w-8 text-center">Profile</div>
                    <div class="w-8 text-center">Stylist</div>
                    <div class="w-8 text-center">Review</div>
                </div>
            </div>
        </div>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200">
            {#if error}
                <div class="rounded-md bg-red-50 p-4 mb-4">
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
            
            {#if successMessage}
                <div class="rounded-md bg-green-50 p-4 mb-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm font-medium text-green-800">{successMessage}</p>
                            <div class="mt-4">
                                <a href="/client-portal/login" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                    Go to Login
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            {/if}
            
            {#if !successMessage}
                <!-- Step 1: Account Information -->
                {#if currentStep === 1}
                    <div class="space-y-6">
                        <h3 class="text-lg font-medium text-gray-900">Account Information</h3>
                        {#if stepErrors[1]}
                            <div class="text-sm text-red-600">{stepErrors[1]}</div>
                        {/if}
                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                            <div class="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autocomplete="email"
                                    required
                                    bind:value={email}
                                    class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                            <div class="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autocomplete="new-password"
                                    required
                                    bind:value={password}
                                    class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <p class="mt-1 text-xs text-gray-500">Password must be at least 8 characters</p>
                        </div>
                        
                        <div>
                            <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirm Password</label>
                            <div class="mt-1">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    autocomplete="new-password"
                                    required
                                    bind:value={confirmPassword}
                                    class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                        </div>
                    </div>
                {/if}
                
                <!-- Step 2: Personal Information -->
                {#if currentStep === 2}
                    <div class="space-y-6">
                        <h3 class="text-lg font-medium text-gray-900">Personal Information</h3>
                        {#if stepErrors[2]}
                            <div class="text-sm text-red-600">{stepErrors[2]}</div>
                        {/if}
                        
                        <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                            <div>
                                <label for="firstName" class="block text-sm font-medium text-gray-700">First Name</label>
                                <div class="mt-1">
                                    <input
                                        id="firstName"
                                        name="firstName"
                                        type="text"
                                        autocomplete="given-name"
                                        required
                                        bind:value={firstName}
                                        class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label for="lastName" class="block text-sm font-medium text-gray-700">Last Name</label>
                                <div class="mt-1">
                                    <input
                                        id="lastName"
                                        name="lastName"
                                        type="text"
                                        autocomplete="family-name"
                                        required
                                        bind:value={lastName}
                                        class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <label for="phone" class="block text-sm font-medium text-gray-700">Phone Number (optional)</label>
                            <div class="mt-1 flex rounded-md shadow-sm">
                                <div class="relative flex items-stretch flex-grow focus-within:z-10">
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span class="text-gray-500 sm:text-sm">+1</span>
                                    </div>
                                    <input
                                        type="tel"
                                        name="phone"
                                        id="phone"
                                        autocomplete="tel"
                                        class="focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-md pl-10 sm:text-sm border-gray-300"
                                        bind:value={phoneNumber}
                                        placeholder="(555) 123-4567"
                                    />
                                </div>
                            </div>
                            <p class="mt-1 text-xs text-gray-500">Format: (555) 123-4567</p>
                        </div>
                        
                        <div class="flex justify-between">
                            <button
                                type="button"
                                on:click={prevStep}
                                class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                on:click={nextStep}
                                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                {/if}
                
                <!-- Step 3: Stylist Selection -->
                {#if currentStep === 3}
                    <div class="space-y-6">
                        <h3 class="text-lg font-medium text-gray-900">Connect with Your Stylist</h3>
                        {#if stepErrors[3]}
                            <div class="text-sm text-red-600">{stepErrors[3]}</div>
                        {/if}
                        <div>
                            <label for="stylist" class="block text-sm font-medium text-gray-700">Select Your Stylist</label>
                            <div class="mt-1">
                                <select
                                    id="stylist"
                                    name="stylist"
                                    required
                                    bind:value={selectedStylistId}
                                    class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                >
                                    <option value="">Select a stylist</option>
                                    {#each stylists as stylist}
                                        <option value={stylist.id}>{stylist.name}</option>
                                    {/each}
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <label for="clientCode" class="block text-sm font-medium text-gray-700">Client Code</label>
                            <div class="mt-1">
                                <input
                                    id="clientCode"
                                    name="clientCode"
                                    type="text"
                                    required
                                    bind:value={clientCode}
                                    class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <p class="mt-1 text-xs text-gray-500">Enter the client code provided by your stylist</p>
                        </div>
                    </div>
                {/if}
                
                <!-- Step 4: Review & Submit -->
                {#if currentStep === 4}
                    <div class="space-y-6">
                        <h3 class="text-lg font-medium text-gray-900">Review Your Information</h3>
                        <div class="bg-gray-50 p-4 rounded-md">
                            <dl class="divide-y divide-gray-200">
                                <div class="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                                    <dt class="text-sm font-medium text-gray-500">Email</dt>
                                    <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{email}</dd>
                                </div>
                                <div class="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                                    <dt class="text-sm font-medium text-gray-500">Name</dt>
                                    <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{getFullName()}</dd>
                                </div>
                                {#if phoneNumber}
                                <div class="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                                    <dt class="text-sm font-medium text-gray-500">Phone</dt>
                                    <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{getFormattedPhone()}</dd>
                                </div>
                                {/if}
                                <div class="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                                    <dt class="text-sm font-medium text-gray-500">Stylist</dt>
                                    <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {stylists.find(s => s.id === selectedStylistId)?.name || ''}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                        
                        <div class="flex justify-between">
                            <button
                                type="button"
                                on:click={prevStep}
                                class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                on:click={handleRegister}
                                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                disabled={loading}
                            >
                                {#if loading}
                                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating Account...
                                {:else}
                                    Create Account
                                {/if}
                            </button>
                        </div>
                    </div>
                {/if}
                
                <!-- Navigation buttons -->
                <div class="mt-6 flex justify-between">
                    {#if currentStep > 1}
                        <button 
                            type="button" 
                            on:click={prevStep}
                            class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Back
                        </button>
                    {:else}
                        <div></div> <!-- Empty div to maintain flex layout -->
                    {/if}
                    
                    {#if currentStep < totalSteps}
                        <button 
                            type="button" 
                            on:click={nextStep}
                            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Continue
                        </button>
                    {:else}
                        <button 
                            type="button" 
                            on:click={handleRegister}
                            disabled={loading}
                            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {#if loading}
                                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating Account...
                            {:else}
                                Create Account
                            {/if}
                        </button>
                    {/if}
                </div>

                <div class="mt-6">
                    <div class="relative">
                        <div class="absolute inset-0 flex items-center">
                            <div class="w-full border-t border-gray-300"></div>
                        </div>
                        <div class="relative flex justify-center text-sm">
                            <span class="px-2 bg-white text-gray-500">Already have an account?</span>
                        </div>
                    </div>
                    <div class="mt-4 text-center">
                        <a href="/client-portal/login" class="font-medium text-indigo-600 hover:text-indigo-500">
                            Sign in to your account
                        </a>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>
