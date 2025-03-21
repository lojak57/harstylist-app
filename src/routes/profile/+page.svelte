<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    import StyleGuideCard from '$lib/components/StyleGuideCard.svelte';
    import ServiceCard from '$lib/components/ServiceCard.svelte';
    import BusinessHoursSelector from '$lib/components/BusinessHoursSelector.svelte';
    import CommandInput from '$lib/components/CommandInput.svelte';
    import { fade, fly } from 'svelte/transition';

    let stylist: Stylist | null = null;
    let loading = false;
    let error: string | null = null;
    let profileImage: File | null = null;
    let imageUrl: string | null = null;
    let activeTab = 'basic'; // 'basic', 'hours', 'social'

    // Business Information
    let businessInfo = {
        phone: '',
        address: '',
        businessHours: [
            { day: 'Monday', hours: '9:00 AM - 6:00 PM', isOpen: true },
            { day: 'Tuesday', hours: '9:00 AM - 6:00 PM', isOpen: true },
            { day: 'Wednesday', hours: '9:00 AM - 6:00 PM', isOpen: true },
            { day: 'Thursday', hours: '9:00 AM - 6:00 PM', isOpen: true },
            { day: 'Friday', hours: '9:00 AM - 6:00 PM', isOpen: true },
            { day: 'Saturday', hours: '9:00 AM - 4:00 PM', isOpen: true },
            { day: 'Sunday', hours: 'Closed', isOpen: false }
        ],
        bio: '',
        socialMedia: {
            instagram: '',
            facebook: '',
            tiktok: ''
        },
        services: []
    };

    type Service = {
        id?: string;
        name: string;
        price: number;
        duration: string;
        description: string;
        stylist_id?: string;
    };

    type StyleGuide = {
        id: string;
        name: string;
        description: string;
        image_url?: string;
        stylist_id: string;
        created_at: string;
        steps?: any[];
        recommended_products?: any[];
    };

    type Stylist = {
        id: string;
        email: string;
        name: string;
        salon_name?: string;
        avatar_url?: string;
        business_info?: any;
        business_hours?: any;
        registration_completed?: boolean;
        registration_completed_at?: string;
    };

    // Stylist services
    let services: Service[] = [];
    
    // Style guide management
    let styleGuides: StyleGuide[] = [];

    // Product recommendations
    let recommendedProducts = [
        {
            id: 'heat-protectant',
            name: 'Professional Heat Protectant Spray',
            description: 'Shields hair from heat damage up to 450°F',
            link: 'https://example.com/heat-protectant'
        },
        {
            id: 'volumizing-mousse',
            name: 'Volumizing Mousse',
            description: 'Adds body and lift to fine hair',
            link: 'https://example.com/volumizing-mousse'
        },
        {
            id: 'curl-cream',
            name: 'Curl Defining Cream',
            description: 'Enhances natural curl pattern while reducing frizz',
            link: 'https://example.com/curl-cream'
        },
        {
            id: 'smoothing-serum',
            name: 'Smoothing Serum',
            description: 'Controls frizz and adds shine',
            link: 'https://example.com/smoothing-serum'
        },
        {
            id: 'dry-shampoo',
            name: 'Professional Dry Shampoo',
            description: 'Refreshes hair between washes',
            link: 'https://example.com/dry-shampoo'
        }
    ];

    // Phone number formatting
    let phoneInput = '';
    let formattedPhone = '';
    
    // Address components
    let addressComponents = {
        street: '',
        city: '',
        state: '',
        zip: ''
    };

    // Format phone number as user types
    function formatPhoneNumber(input: string): string {
        // Strip all non-numeric characters
        const cleaned = input.replace(/\D/g, '');
        
        // Format based on length
        if (cleaned.length <= 3) {
            return cleaned;
        } else if (cleaned.length <= 6) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
        } else {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
        }
    }
    
    // Handle phone number changes
    function handlePhoneChange(e: Event) {
        const target = e.target as HTMLInputElement;
        phoneInput = target.value;
        formattedPhone = formatPhoneNumber(phoneInput);
        businessInfo.phone = formattedPhone;
    }
    
    // Handle address component changes
    function updateAddress() {
        businessInfo.address = [
            addressComponents.street,
            addressComponents.city,
            addressComponents.state,
            addressComponents.zip
        ].filter(Boolean).join(', ');
    }
    
    // Split existing address into components on initial load
    function splitAddress(fullAddress: string) {
        if (!fullAddress) return;
        
        // Try to parse the address - this is a simple approach
        const parts = fullAddress.split(',').map(part => part.trim());
        
        if (parts.length >= 1) addressComponents.street = parts[0] || '';
        if (parts.length >= 2) addressComponents.city = parts[1] || '';
        
        // Try to split the last part into state and zip if possible
        if (parts.length >= 3) {
            const stateZip = parts[2].split(' ').filter(Boolean);
            if (stateZip.length >= 1) addressComponents.state = stateZip[0] || '';
            if (stateZip.length >= 2) addressComponents.zip = stateZip[1] || '';
        }
    }

    onMount(async () => {
        await loadStylistProfile();
        
        // Initialize phone and address components
        if (businessInfo.phone) {
            phoneInput = businessInfo.phone.replace(/\D/g, '');
            formattedPhone = formatPhoneNumber(phoneInput);
        }
        
        if (businessInfo.address) {
            splitAddress(businessInfo.address);
        }
    });

    async function loadStylistProfile() {
        try {
            loading = true;
            error = null;
            
            // Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError) {
                console.error('Auth error:', userError);
                throw new Error(`Authentication error: ${userError.message}`);
            }
            
            if (!user) {
                console.error('No authenticated user found');
                throw new Error('Not authenticated. Please sign in again.');
            }

            console.log('Current user:', user.id);
            
            // Check if stylist record exists
            const { data, error: fetchError } = await supabase
                .from('stylists')
                .select('*')
                .eq('id', user.id)
                .single();

            if (fetchError) {
                console.error('Error fetching stylist:', fetchError);
                
                // If the error is that no rows were returned, it means the stylist doesn't exist yet
                if (fetchError.code === 'PGRST116') {
                    console.log('No stylist record found, creating one...');
                    
                    // Create a basic stylist record
                    const { data: newStylist, error: createError } = await supabase
                        .from('stylists')
                        .insert({
                            id: user.id,
                            email: user.email,
                            name: user.email ? user.email.split('@')[0] : 'New Stylist'
                        })
                        .select();
                    
                    if (createError) {
                        console.error('Error creating stylist:', createError);
                        throw new Error(`Failed to create stylist profile: ${createError.message}`);
                    }
                    
                    if (newStylist && newStylist.length > 0) {
                        stylist = newStylist[0];
                        console.log('Created new stylist record:', stylist);
                    } else {
                        throw new Error('Failed to create stylist profile');
                    }
                } else {
                    throw new Error(`Database error: ${fetchError.message}`);
                }
            } else {
                stylist = data;
                console.log('Loaded existing stylist:', stylist);
            }
            
            // Load business info if exists
            if (stylist && stylist.business_info) {
                businessInfo = { ...businessInfo, ...stylist.business_info };
                console.log('Loaded business info:', businessInfo);
            }
            
            // Load business hours if exists
            if (stylist && stylist.business_hours) {
                businessInfo.businessHours = stylist.business_hours;
                console.log('Loaded business hours:', businessInfo.businessHours);
            }
            
            if (stylist && stylist.avatar_url) {
                imageUrl = stylist.avatar_url;
            }

            // Load stylist's style guides
            const { data: guidesData, error: guidesError } = await supabase
                .from('style_guides')
                .select('*')
                .eq('stylist_id', user.id)
                .order('created_at', { ascending: false });

            if (guidesError) {
                console.error('Error loading style guides:', guidesError);
            } else {
                styleGuides = guidesData;
                console.log('Loaded style guides:', styleGuides?.length || 0);
            }

            // Load stylist's services
            const { data: servicesData, error: servicesError } = await supabase
                .from('services')
                .select('*')
                .eq('stylist_id', user.id);

            if (servicesError) {
                console.error('Error loading services:', servicesError);
            } else {
                // Make sure all services have a description property
                services = (servicesData || []).map(service => ({
                    ...service,
                    description: service.description || ''
                }));
                console.log('Loaded services:', services?.length || 0);
            }
        } catch (e: any) {
            console.error('Error loading profile:', e);
            error = e.message || 'Failed to load profile';
        } finally {
            loading = false;
        }
    }

    async function handleImageUpload(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file || !stylist) return;

        try {
            loading = true;
            const fileExt = file.name.split('.').pop();
            const filePath = `${stylist.id}/avatar.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            imageUrl = publicUrl;

            // Update stylist profile with new avatar URL
            const { error: updateError } = await supabase
                .from('stylists')
                .update({ avatar_url: publicUrl })
                .eq('id', stylist.id);

            if (updateError) throw updateError;
        } catch (error: any) {
            console.error('Error uploading image:', error);
            error = error.message || 'Failed to upload image';
        } finally {
            loading = false;
        }
    }

    async function updateStylistProfile() {
        if (!stylist) return;
        
        try {
            loading = true;
            
            // Ensure phone number is properly formatted
            if (phoneInput) {
                businessInfo.phone = formattedPhone;
            }
            
            // Ensure address is combined correctly
            if (addressComponents.street) {
                updateAddress();
            }
            
            console.log('Saving business info:', businessInfo);
            
            // Store the business info and business hours separately
            const { error: updateError } = await supabase
                .from('stylists')
                .update({
                    // Use the business_info JSON column to store all the data
                    business_info: businessInfo,
                    // Save business hours separately
                    business_hours: businessInfo.businessHours
                })
                .eq('id', stylist.id);

            if (updateError) {
                console.error('Update error:', updateError);
                throw new Error(`Database Error: ${updateError.message}\nDetails: ${updateError.details}\nHint: ${updateError.hint || 'No hint provided'}`);
            }
            
            // Success notification
            error = null;
            alert('Business information saved successfully!');
        } catch (err: any) {
            console.error('Error updating business info:', err);
            error = err.message || 'Failed to update business information';
            
            // Check for specific database errors
            if (err.message && err.message.includes('column "business_info" of relation "stylists" does not exist')) {
                error = 'Your database is missing the business_info column. Please run the SQL script to add this column to your database.';
            }
        } finally {
            loading = false;
        }
    }
    
    async function saveServices() {
        if (!stylist) return;
        
        try {
            loading = true;
            
            // Process each service to save
            for (const service of services) {
                // For existing services, update them
                if (service.id) {
                    const { error } = await supabase
                        .from('services')
                        .update({
                            name: service.name,
                            price: service.price,
                            duration: service.duration,
                            description: service.description || ''
                        })
                        .eq('id', service.id);
                        
                    if (error) throw error;
                } 
                // For new services, insert them
                else {
                    const { error } = await supabase
                        .from('services')
                        .insert({
                            ...service,
                            stylist_id: stylist.id,
                            description: service.description || ''
                        });
                        
                    if (error) throw error;
                }
            }
            
            // Reload services to get fresh data with IDs
            await loadStylistProfile();
            
        } catch (error: any) {
            console.error('Error saving services:', error);
            error = error.message || 'Failed to save services';
        } finally {
            loading = false;
        }
    }
    
    async function deleteService(serviceId: string) {
        if (!stylist || !serviceId) return;
        
        try {
            loading = true;
            
            const { error } = await supabase
                .from('services')
                .delete()
                .eq('id', serviceId);
                
            if (error) throw error;
            
            // Remove from local list
            services = services.filter(s => s.id !== serviceId);
            
        } catch (error: any) {
            console.error('Error deleting service:', error);
            error = error.message || 'Failed to delete service';
        } finally {
            loading = false;
        }
    }

    // Sign out function
    async function handleSignOut() {
        try {
            loading = true;
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            // Redirect to login page after sign out
            window.location.href = '/';
        } catch (err) {
            console.error('Error signing out:', err);
            error = 'Failed to sign out. Please try again.';
        } finally {
            loading = false;
        }
    }
</script>

<div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CommandInput />
        
        <!-- Header with Gradient Background -->
        <div class="bg-gradient-to-r from-indigo-100 to-purple-100 backdrop-blur-sm rounded-xl mb-8 p-6 shadow-lg border border-indigo-200 mt-6">
            <div class="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div>
                    <h1 class="text-2xl font-bold text-indigo-800">Your Profile</h1>
                    <p class="mt-2 text-sm text-indigo-600">Manage your profile and business information</p>
                </div>
            </div>
        </div>

        {#if error}
            <div class="mt-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg" transition:fade>{error}</div>
        {/if}

        <!-- Debug information -->
        <!-- Removed Debug Information Section -->

        {#if stylist}
            <div class="mt-6 md:flex md:items-center md:justify-between md:space-x-5">
                <div class="flex items-start space-x-5">
                    <!-- Profile Image -->
                    <div class="flex-shrink-0">
                        <div class="relative">
                            <img class="h-16 w-16 rounded-full" src={imageUrl || 'https://via.placeholder.com/160'} alt="Profile" />
                            <label class="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white p-1 shadow-lg cursor-pointer">
                                <input type="file" class="hidden" accept="image/*" on:change={handleImageUpload} />
                                <svg class="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </label>
                        </div>
                    </div>
                    <div class="pt-1.5">
                        <h1 class="text-2xl font-bold text-gray-900">{stylist.name}</h1>
                        <p class="text-sm font-medium text-gray-500">{stylist.email}</p>
                    </div>
                </div>
            </div>

            <div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <!-- Left Column: Business Information -->
                <div class="space-y-6">
                    <div class="bg-white shadow sm:rounded-lg overflow-hidden">
                        <div class="px-4 py-5 sm:px-6 bg-gradient-to-r from-indigo-600 to-indigo-800">
                            <h2 class="text-lg font-medium leading-6 text-white">Business Information</h2>
                            <p class="mt-1 text-sm text-indigo-200">Update your business details and contact information</p>
                        </div>
                        
                        <!-- Tabs Section -->
                        <div class="bg-gray-50 border-b border-gray-200">
                            <nav class="flex -mb-px justify-center md:justify-start" aria-label="Tabs">
                                <button 
                                    class="px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap text-center {activeTab === 'basic' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
                                    on:click={() => activeTab = 'basic'}
                                    aria-label="Basic information tab"
                                >
                                    <span class="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Basic Info
                                    </span>
                                </button>
                                <button 
                                    class="px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap text-center {activeTab === 'hours' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
                                    on:click={() => activeTab = 'hours'}
                                    aria-label="Business hours tab"
                                >
                                    <span class="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 016 0z" />
                                        </svg>
                                        Business Hours
                                    </span>
                                </button>
                                <button 
                                    class="px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap text-center {activeTab === 'social' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
                                    on:click={() => activeTab = 'social'}
                                    aria-label="Social media tab"
                                >
                                    <span class="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                                        </svg>
                                        Social Media
                                    </span>
                                </button>
                            </nav>
                        </div>

                        <div class="border-t border-gray-200 px-4 py-5 sm:px-6 min-h-[500px]">
                            <!-- Basic Information Tab -->
                            {#if activeTab === 'basic'}
                                <div in:fade={{ duration: 200 }} class="space-y-6">
                                    <div class="bg-indigo-50 p-3 rounded-md mb-6">
                                        <p class="text-sm text-indigo-800"> Complete your business profile to help clients find and connect with you more easily.</p>
                                    </div>
                                    
                                    <!-- Contact Information -->
                                    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div class="col-span-2 sm:col-span-1">
                                            <label for="phone" class="block text-sm font-medium text-gray-700">Phone Number</label>
                                            <div class="mt-1 relative rounded-md shadow-sm">
                                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                </div>
                                                <input 
                                                    id="phone" 
                                                    type="tel" 
                                                    bind:value={phoneInput} 
                                                    on:input={handlePhoneChange}
                                                    class="pl-10 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                                                    placeholder="(555) 123-4567"
                                                />
                                            </div>
                                            <p class="mt-1 text-xs text-gray-500">{phoneInput ? `Formatted: ${formattedPhone}` : "Enter a 10-digit phone number"}</p>
                                        </div>
                                        
                                        <div class="col-span-2">
                                            <div class="mb-2">
                                                <span class="block text-sm font-medium text-gray-700">Business Address</span>
                                                <p class="text-xs text-gray-500">Enter your complete business address</p>
                                            </div>
                                            <div class="grid grid-cols-1 gap-y-3 gap-x-4 sm:grid-cols-6">
                                                <div class="sm:col-span-6">
                                                    <label for="street" class="block text-xs text-gray-500">Street Address</label>
                                                    <div class="mt-1 relative rounded-md shadow-sm">
                                                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                            </svg>
                                                        </div>
                                                        <input 
                                                            id="street" 
                                                            type="text" 
                                                            bind:value={addressComponents.street} 
                                                            on:input={updateAddress}
                                                            class="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                                                            placeholder="123 Main St"
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div class="sm:col-span-3">
                                                    <label for="city" class="block text-xs text-gray-500">City</label>
                                                    <input 
                                                        id="city" 
                                                        type="text" 
                                                        bind:value={addressComponents.city} 
                                                        on:input={updateAddress}
                                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                                                        placeholder="City"
                                                    />
                                                </div>
                                                
                                                <div class="sm:col-span-2">
                                                    <label for="state" class="block text-xs text-gray-500">State</label>
                                                    <input 
                                                        id="state" 
                                                        type="text" 
                                                        bind:value={addressComponents.state} 
                                                        on:input={updateAddress}
                                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                                                        placeholder="State"
                                                    />
                                                </div>
                                                
                                                <div class="sm:col-span-1">
                                                    <label for="zip" class="block text-xs text-gray-500">ZIP</label>
                                                    <input 
                                                        id="zip" 
                                                        type="text" 
                                                        bind:value={addressComponents.zip} 
                                                        on:input={updateAddress}
                                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                                                        placeholder="ZIP"
                                                    />
                                                </div>
                                            </div>
                                            <p class="mt-2 text-xs text-gray-500">{businessInfo.address ? `Preview: ${businessInfo.address}` : "Complete all fields for full address"}</p>
                                        </div>
                                        
                                        <div class="col-span-2">
                                            <label for="bio" class="block text-sm font-medium text-gray-700">About Your Business</label>
                                            <textarea 
                                                id="bio" 
                                                bind:value={businessInfo.bio} 
                                                rows="4" 
                                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                                                placeholder="Tell clients about your salon, specialties, and what makes your service unique..."
                                            ></textarea>
                                            <p class="mt-2 text-sm text-gray-500">Brief description for your profile. URLs are hyperlinked.</p>
                                        </div>
                                    </div>
                                </div>
                            {/if}
                            
                            <!-- Business Hours Tab -->
                            {#if activeTab === 'hours'}
                                <div in:fade={{ duration: 200 }}>
                                    <BusinessHoursSelector 
                                        bind:businessHours={businessInfo.businessHours} 
                                        on:change={updateStylistProfile}
                                    />
                                </div>
                            {/if}
                            
                            <!-- Social Media Tab -->
                            {#if activeTab === 'social'}
                                <div in:fade={{ duration: 200 }} class="space-y-6">
                                    <div class="bg-indigo-50 p-3 rounded-md mb-6">
                                        <p class="text-sm text-indigo-800"> Connecting your social media accounts helps clients see your latest work and follow you online!</p>
                                    </div>
                                    
                                    <div class="grid grid-cols-1 gap-6">
                                        <div>
                                            <label for="instagram" class="block text-sm font-medium text-gray-700">Instagram</label>
                                            <div class="mt-1 flex rounded-md shadow-sm">
                                                <span class="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">instagram.com/</span>
                                                <input 
                                                    id="instagram" 
                                                    type="text" 
                                                    bind:value={businessInfo.socialMedia.instagram} 
                                                    class="block w-full flex-1 rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                                                    placeholder="yourusername"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label for="facebook" class="block text-sm font-medium text-gray-700">Facebook</label>
                                            <div class="mt-1 flex rounded-md shadow-sm">
                                                <span class="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">facebook.com/</span>
                                                <input 
                                                    id="facebook" 
                                                    type="text" 
                                                    bind:value={businessInfo.socialMedia.facebook} 
                                                    class="block w-full flex-1 rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                                                    placeholder="yourbusinesspage"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label for="tiktok" class="block text-sm font-medium text-gray-700">TikTok</label>
                                            <div class="mt-1 flex rounded-md shadow-sm">
                                                <span class="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">tiktok.com/@</span>
                                                <input 
                                                    id="tiktok" 
                                                    type="text" 
                                                    bind:value={businessInfo.socialMedia.tiktok} 
                                                    class="block w-full flex-1 rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                                                    placeholder="yourusername"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="mt-6">
                                        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <h4 class="text-sm font-medium text-gray-800">Benefits of Social Media</h4>
                                            <ul class="mt-2 space-y-2 text-sm text-gray-600">
                                                <li class="flex items-start">
                                                    <svg class="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                                    </svg>
                                                    Showcase your portfolio with stunning visuals
                                                </li>
                                                <li class="flex items-start">
                                                    <svg class="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                                    </svg>
                                                    Attract new clients through social discovery
                                                </li>
                                                <li class="flex items-start">
                                                    <svg class="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                                    </svg>
                                                    Build relationships with existing clients
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            {/if}
                            
                            <!-- Save Button -->
                            <div class="mt-6 flex justify-end">
                                <button 
                                    type="button" 
                                    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    on:click={updateStylistProfile}
                                    disabled={loading}
                                >
                                    {#if loading}
                                        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    {:else}
                                        Save Changes
                                    {/if}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Right Column: Style Guides and Products -->
                <div class="space-y-6">
                    <!-- Style Guides -->
                    <div class="bg-white shadow sm:rounded-lg overflow-hidden">
                        <div class="px-4 py-5 sm:px-6 flex justify-between items-center">
                            <div>
                                <h2 class="text-lg font-medium leading-6 text-gray-900">Style Gallery</h2>
                                <p class="mt-1 text-sm text-gray-500">Showcase your best work to inspire your clients</p>
                            </div>
                            <a href="/style-guides/new" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Add Style
                            </a>
                        </div>
                        
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                            {#each styleGuides as guide}
                                <!-- We don't need the onDelete prop here since we're not deleting from the profile page -->
                                <div class="border rounded-lg p-3">
                                    <h3 class="font-medium">{guide.name}</h3>
                                    <p class="text-sm text-gray-500">{guide.description}</p>
                                    {#if guide.image_url}
                                        <img src={guide.image_url} alt={guide.name} class="mt-2 rounded-md w-full h-32 object-cover" />
                                    {/if}
                                </div>
                            {/each}
                            
                            {#if styleGuides.length === 0}
                                <p class="text-sm text-gray-500 p-4">You haven't created any style guides yet. Add your first style to showcase your work!</p>
                            {/if}
                        </div>
                    </div>
                    
                    <!-- Product Recommendations -->
                    <div class="bg-white shadow sm:rounded-lg">
                        <div class="px-4 py-5 sm:px-6">
                            <h2 class="text-lg font-medium leading-6 text-gray-900">Recommended Products</h2>
                            <p class="mt-1 text-sm text-gray-500">Products you recommend to your clients</p>
                        </div>
                        <div class="border-t border-gray-200 px-4 py-5 sm:px-6">
                            <ul class="divide-y divide-gray-200">
                                {#each recommendedProducts as product}
                                    <li class="py-4">
                                        <div class="flex space-x-3">
                                            <div class="flex-1 space-y-1">
                                                <div class="flex items-center justify-between">
                                                    <h3 class="text-sm font-medium">{product.name}</h3>
                                                </div>
                                                <p class="text-sm text-gray-500">{product.description}</p>
                                                <a href={product.link} target="_blank" class="text-xs text-indigo-600 hover:text-indigo-500">View Product →</a>
                                            </div>
                                        </div>
                                    </li>
                                {/each}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
        
        <!-- Sign Out Section -->
        <div class="max-w-3xl mx-auto mt-12 mb-8">
            <div class="bg-white shadow sm:rounded-lg overflow-hidden">
                <div class="px-4 py-5 sm:px-6 bg-gradient-to-r from-red-500 to-red-700">
                    <h2 class="text-lg font-medium leading-6 text-white">Account Settings</h2>
                    <p class="mt-1 text-sm text-red-100">Manage your account access</p>
                </div>
                <div class="border-t border-gray-200 px-4 py-5 sm:px-6">
                    <div class="bg-red-50 p-3 rounded-md mb-6">
                        <p class="text-sm text-red-800"> Signing out will end your current session. You'll need to log in again to access your account.</p>
                    </div>
                    <div class="flex justify-center">
                        <button 
                            on:click={handleSignOut}
                            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>