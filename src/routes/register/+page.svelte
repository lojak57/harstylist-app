<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { v4 as uuidv4 } from 'uuid';

    // Registration steps
    const STEPS = {
        ACCOUNT: 0,
        PERSONAL: 1,
        BUSINESS: 2,
        SERVICES: 3,
        HOURS: 4,
        STYLE_GUIDE: 5,
        COMPLETE: 6
    };

    // Define the day type for business hours
    type Day = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    type DayHours = { open: string; close: string; isOpen: boolean };
    type BusinessHours = Record<Day, DayHours>;

    // Define registration data store
    interface RegistrationData {
        userId?: string;
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        profilePhoto?: File | null;
        salonName: string;
        address: string;
        city: string;
        state: string;
        zip: string;
        phone: string;
        services: {
            id: string;
            name: string;
            description: string;
            price: number;
            duration: number;
        }[];
        hours: BusinessHours;
        businessHours: {
            day: string;
            hours: string;
            isOpen: boolean;
        }[];
        styleGuide: {
            title: string;
            description: string;
            images: File[];
        };
    }

    // Registration data store
    const registrationData = writable<RegistrationData>({
        userId: '',
        // Account info
        email: '',
        password: '',
        // Personal info
        firstName: '',
        lastName: '',
        profilePhoto: null as File | null,
        // Business info
        salonName: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        // Services info
        services: [] as RegistrationData['services'],
        // Business hours
        hours: {
            monday: { open: '09:00', close: '17:00', isOpen: true },
            tuesday: { open: '09:00', close: '17:00', isOpen: true },
            wednesday: { open: '09:00', close: '17:00', isOpen: true },
            thursday: { open: '09:00', close: '17:00', isOpen: true },
            friday: { open: '09:00', close: '17:00', isOpen: true },
            saturday: { open: '10:00', close: '16:00', isOpen: true },
            sunday: { open: '10:00', close: '16:00', isOpen: false }
        } as BusinessHours,
        businessHours: [
            { day: 'Monday', hours: '9:00 AM - 6:00 PM', isOpen: true },
            { day: 'Tuesday', hours: '9:00 AM - 6:00 PM', isOpen: true },
            { day: 'Wednesday', hours: '9:00 AM - 6:00 PM', isOpen: true },
            { day: 'Thursday', hours: '9:00 AM - 6:00 PM', isOpen: true },
            { day: 'Friday', hours: '9:00 AM - 6:00 PM', isOpen: true },
            { day: 'Saturday', hours: '10:00 AM - 4:00 PM', isOpen: true },
            { day: 'Sunday', hours: 'Closed', isOpen: false }
        ],
        // Style guide
        styleGuide: {
            title: '',
            description: '',
            images: [] as Array<File>
        }
    });

    let currentStep = STEPS.ACCOUNT;
    let loading = false;
    let error: string | null = null;
    
    // Email validation function
    function isValidEmail(email: string): boolean {
        return email.includes('@') && email.includes('.') && email.length > 5;
    }

    onMount(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            goto('/clients');
        }
    });

    // Step 1: Create account
    async function createAccount() {
        try {
            loading = true;
            error = null;
            
            // Validate email and password
            if (!$registrationData.email || !$registrationData.password) {
                error = 'Email and password are required';
                return;
            }
            
            if (!isValidEmail($registrationData.email)) {
                error = 'Please enter a valid email address';
                return;
            }
            
            if ($registrationData.password.length < 6) {
                error = 'Password must be at least 6 characters';
                return;
            }
            
            // Create user account with Supabase
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: $registrationData.email,
                password: $registrationData.password
            });

            if (signUpError) throw signUpError;
            
            if (!data?.user || !data.user.id) {
                throw new Error('Failed to create user account. Please try again.');
            }
            
            // Store the user ID for later steps
            const userId = data.user.id;
            registrationData.update(rd => ({
                ...rd,
                userId
            }));
            
            // Skip sign-in attempt for now - we'll continue with the registration flow
            console.log('Account created successfully, proceeding with registration');
            
            // Move to next step
            nextStep();
        } catch (e: any) {
            error = e.message || 'An error occurred during registration';
            console.error('Registration error:', e);
        } finally {
            loading = false;
        }
    }

    // Step 2: Update personal information
    async function updatePersonalInfo() {
        try {
            loading = true;
            error = null;
            
            // Validate first and last name
            if (!$registrationData.firstName || !$registrationData.lastName) {
                error = 'First and last name are required';
                return;
            }
            
            // Check if userId is available
            if (!$registrationData.userId) {
                error = 'User ID is missing. Please restart the registration process.';
                return;
            }
            
            // Store the personal information in the registration data store
            // We'll update the database at the end of the registration process
            console.log('Personal information updated, proceeding to next step');
            
            // Move to next step
            nextStep();
        } catch (e: any) {
            error = e.message || 'An error occurred while updating personal information';
        } finally {
            loading = false;
        }
    }

    // Step 3: Update business information
    async function updateBusinessInfo() {
        try {
            loading = true;
            error = null;
            
            // Validate required fields
            if (!$registrationData.salonName) {
                error = 'Salon name is required';
                return;
            }
            
            // Check if userId is available
            if (!$registrationData.userId) {
                error = 'User ID is missing. Please restart the registration process.';
                return;
            }
            
            // Store the business information in the registration data store
            // We'll update the database at the end of the registration process
            console.log('Business information updated, proceeding to next step');
            
            // Move to next step
            nextStep();
        } catch (e: any) {
            error = e.message || 'An error occurred while updating business information';
        } finally {
            loading = false;
        }
    }

    // Step 4: Update services information
    async function updateServicesInfo() {
        try {
            loading = true;
            error = null;
            
            // Validate at least one service is added
            if ($registrationData.services.length === 0) {
                error = 'Please add at least one service';
                return;
            }
            
            // Check if userId is available
            if (!$registrationData.userId) {
                error = 'User ID is missing. Please restart the registration process.';
                return;
            }
            
            // Store the services information in the registration data store
            // We'll update the database at the end of the registration process
            console.log('Services information updated, proceeding to next step');
            
            // Move to next step
            nextStep();
        } catch (e: any) {
            error = e.message || 'An error occurred while updating services';
        } finally {
            loading = false;
        }
    }

    // Step 5: Update business hours
    async function updateBusinessHours() {
        try {
            loading = true;
            error = null;
            
            // Check if userId is available
            if (!$registrationData.userId) {
                error = 'User ID is missing. Please restart the registration process.';
                return;
            }
            
            // Store the business hours in the registration data store
            // We'll update the database at the end of the registration process
            console.log('Business hours updated, proceeding to next step');
            
            // Move to next step
            nextStep();
        } catch (e: any) {
            error = e.message || 'An error occurred while updating business hours';
        } finally {
            loading = false;
        }
    }

    // Step 6: Update style guide
    async function updateStyleGuide() {
        try {
            loading = true;
            error = null;
            
            // Validate title and description
            if (!$registrationData.styleGuide.title) {
                error = 'Please provide a title for your style guide';
                return;
            }
            
            // Check if userId is available
            if (!$registrationData.userId) {
                error = 'User ID is missing. Please restart the registration process.';
                return;
            }
            
            // Store the style guide in the registration data store
            // We'll update the database at the end of the registration process
            console.log('Style guide updated, proceeding to next step');
            
            // Move to next step
            nextStep();
        } catch (e: any) {
            error = e.message || 'An error occurred while updating style guide';
        } finally {
            loading = false;
        }
    }

    // Step 7: Complete registration
    async function completeRegistration() {
        try {
            loading = true;
            error = null;
            
            // Check if userId is available
            if (!$registrationData.userId) {
                error = 'User ID is missing. Please restart the registration process.';
                return;
            }
            
            // Try to create the stylist record with all the collected information
            try {
                // First, check if the stylist record already exists
                const { data: existingStylist, error: checkError } = await supabase
                    .from('stylists')
                    .select('id')
                    .eq('id', $registrationData.userId)
                    .single();
                
                if (checkError && checkError.code !== 'PGRST116') {
                    // If there's an error other than 'not found', log it
                    console.error('Error checking for existing stylist:', checkError);
                }
                
                if (!existingStylist) {
                    // Create the stylist record if it doesn't exist
                    const { error: insertError } = await supabase
                        .from('stylists')
                        .insert({
                            id: $registrationData.userId,
                            email: $registrationData.email,
                            name: `${$registrationData.firstName} ${$registrationData.lastName}`,
                            // Use the database column names that actually exist
                            // These may differ from our frontend naming convention
                            salon_name: $registrationData.salonName,
                            address: $registrationData.address,
                            city: $registrationData.city,
                            state: $registrationData.state,
                            zip: $registrationData.zip,
                            phone: $registrationData.phone,
                            business_hours: $registrationData.businessHours,
                            registration_completed: true,
                            registration_completed_at: new Date().toISOString()
                        });
                    
                    if (insertError) {
                        console.error('Error creating stylist record:', insertError);
                    }
                } else {
                    // Update the existing stylist record
                    const { error: updateError } = await supabase
                        .from('stylists')
                        .update({
                            name: `${$registrationData.firstName} ${$registrationData.lastName}`,
                            salon_name: $registrationData.salonName,
                            address: $registrationData.address,
                            city: $registrationData.city,
                            state: $registrationData.state,
                            zip: $registrationData.zip,
                            phone: $registrationData.phone,
                            business_hours: $registrationData.businessHours,
                            registration_completed: true,
                            registration_completed_at: new Date().toISOString()
                        })
                        .eq('id', $registrationData.userId);
                    
                    if (updateError) {
                        console.error('Error updating stylist record:', updateError);
                    }
                }
                
                // Insert services
                if ($registrationData.services.length > 0) {
                    for (const service of $registrationData.services) {
                        const { error: serviceError } = await supabase
                            .from('services')
                            .insert({
                                stylist_id: $registrationData.userId,
                                name: service.name,
                                description: service.description,
                                price: service.price,
                                duration: service.duration
                            });
                        
                        if (serviceError) {
                            console.error('Error creating service:', serviceError);
                        }
                    }
                }
                
                // Create style guide if title is provided
                if ($registrationData.styleGuide.title) {
                    const { data: styleGuideData, error: styleGuideError } = await supabase
                        .from('style_guides')
                        .insert({
                            stylist_id: $registrationData.userId,
                            title: $registrationData.styleGuide.title,
                            description: $registrationData.styleGuide.description
                        })
                        .select();
                    
                    if (styleGuideError) {
                        console.error('Error creating style guide:', styleGuideError);
                    } else if (styleGuideData && styleGuideData[0] && $registrationData.styleGuide.images.length > 0) {
                        // Upload style guide images
                        for (let i = 0; i < $registrationData.styleGuide.images.length; i++) {
                            const file = $registrationData.styleGuide.images[i];
                            const fileExt = file.name.split('.').pop();
                            const fileName = `${$registrationData.userId}-style-${i}.${fileExt}`;
                            
                            const { error: uploadError } = await supabase.storage
                                .from('style-guide-images')
                                .upload(fileName, file);
                            
                            if (uploadError) {
                                console.error('Error uploading style guide image:', uploadError);
                                continue;
                            }
                            
                            const { data: urlData } = supabase.storage
                                .from('style-guide-images')
                                .getPublicUrl(fileName);
                            
                            if (urlData) {
                                const { error: imageError } = await supabase
                                    .from('style_guide_images')
                                    .insert({
                                        style_guide_id: styleGuideData[0].id,
                                        image_url: urlData.publicUrl,
                                        order: i
                                    });
                                
                                if (imageError) {
                                    console.error('Error creating style guide image record:', imageError);
                                }
                            }
                        }
                    }
                }
                
                // Registration complete - show success message
                // We'll leave the user on the completion page with a success message
                // They can then sign in manually
            } catch (e) {
                console.error('Error completing registration:', e);
                error = 'An error occurred while completing registration. Please try signing in manually.';
            }
        } catch (e: any) {
            error = e.message || 'An error occurred while completing registration';
        } finally {
            loading = false;
        }
    }

    // Service management
    let newService = { name: '', description: '', price: 0, duration: 30 };
    
    function addService() {
        // Validate service
        if (!newService.name || newService.price <= 0 || newService.duration <= 0) {
            error = 'Please fill in all service details';
            return;
        }
        
        // Add service to the list
        registrationData.update(rd => ({
            ...rd,
            services: [...rd.services, { 
                id: uuidv4(),
                name: newService.name, 
                description: newService.description, 
                price: newService.price, 
                duration: newService.duration 
            }]
        }));
        
        // Reset new service form
        newService = { name: '', description: '', price: 0, duration: 30 };
        error = null;
    }
    
    function removeService(index: number) {
        registrationData.update(rd => ({
            ...rd,
            services: rd.services.filter((_, i) => i !== index)
        }));
    }

    // Business hours management
    type BusinessHour = {
        day: string;
        hours: string;
        isOpen: boolean;
    };
    
    // Templates for quick selection
    const hoursTemplates = [
        { 
            name: 'Standard Week', 
            hours: [
                { day: 'Monday', hours: '9:00 AM - 6:00 PM', isOpen: true },
                { day: 'Tuesday', hours: '9:00 AM - 6:00 PM', isOpen: true },
                { day: 'Wednesday', hours: '9:00 AM - 6:00 PM', isOpen: true },
                { day: 'Thursday', hours: '9:00 AM - 6:00 PM', isOpen: true },
                { day: 'Friday', hours: '9:00 AM - 6:00 PM', isOpen: true },
                { day: 'Saturday', hours: '9:00 AM - 4:00 PM', isOpen: true },
                { day: 'Sunday', hours: 'Closed', isOpen: false }
            ]
        },
        { 
            name: 'Weekdays Only', 
            hours: [
                { day: 'Monday', hours: '8:00 AM - 5:00 PM', isOpen: true },
                { day: 'Tuesday', hours: '8:00 AM - 5:00 PM', isOpen: true },
                { day: 'Wednesday', hours: '8:00 AM - 5:00 PM', isOpen: true },
                { day: 'Thursday', hours: '8:00 AM - 5:00 PM', isOpen: true },
                { day: 'Friday', hours: '8:00 AM - 5:00 PM', isOpen: true },
                { day: 'Saturday', hours: 'Closed', isOpen: false },
                { day: 'Sunday', hours: 'Closed', isOpen: false }
            ]
        },
        { 
            name: 'Late Hours', 
            hours: [
                { day: 'Monday', hours: '11:00 AM - 8:00 PM', isOpen: true },
                { day: 'Tuesday', hours: '11:00 AM - 8:00 PM', isOpen: true },
                { day: 'Wednesday', hours: '11:00 AM - 8:00 PM', isOpen: true },
                { day: 'Thursday', hours: '11:00 AM - 8:00 PM', isOpen: true },
                { day: 'Friday', hours: '11:00 AM - 8:00 PM', isOpen: true },
                { day: 'Saturday', hours: '11:00 AM - 6:00 PM', isOpen: true },
                { day: 'Sunday', hours: 'Closed', isOpen: false }
            ]
        },
    ];
    
    // Time options for the dropdowns
    const startTimeOptions: string[] = [
        '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', 
        '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
        '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
        '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM',
        '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM'
    ];
    
    const endTimeOptions: string[] = [
        '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', 
        '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM',
        '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM',
        '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM',
        '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM'
    ];
    
    // Parse hours string to get start and end times
    function parseHours(hoursString: string): { start: string, end: string } {
        if (hoursString === 'Closed') {
            return { start: '', end: '' };
        }
        
        const parts = hoursString.split(' - ');
        return {
            start: parts[0],
            end: parts.length > 1 ? parts[1] : ''
        };
    }
    
    // Initialize business hours if not already set
    function initializeBusinessHours() {
        if (!$registrationData.businessHours) {
            registrationData.update(rd => ({
                ...rd,
                businessHours: hoursTemplates[0].hours
            }));
        }
    }
    
    // Toggle day open/closed
    function toggleDay(index: number): void {
        const dayData = $registrationData.businessHours[index];
        dayData.isOpen = !dayData.isOpen;
        
        if (dayData.isOpen) {
            dayData.hours = '9:00 AM - 6:00 PM';
        } else {
            dayData.hours = 'Closed';
        }
        
        registrationData.update(rd => ({
            ...rd,
            businessHours: [...rd.businessHours]
        }));
    }
    
    // Update hours when dropdown selection changes
    function updateBusinessHoursTime(index: number, isStart: boolean, value: string): void {
        const dayData = $registrationData.businessHours[index];
        const { start, end } = parseHours(dayData.hours);
        
        if (isStart) {
            // If setting start time, ensure end time is later
            const newStart = value;
            const newEnd = end;
            
            // If end time is earlier than new start time, adjust end time
            const startIndex = startTimeOptions.indexOf(newStart);
            const endIndex = endTimeOptions.indexOf(newEnd);
            
            if (endIndex <= startIndex && newEnd !== '') {
                const newEndIndex = Math.min(startIndex + 2, endTimeOptions.length - 1);
                registrationData.update(rd => {
                    const updatedHours = [...rd.businessHours];
                    updatedHours[index].hours = `${newStart} - ${endTimeOptions[newEndIndex]}`;
                    return { ...rd, businessHours: updatedHours };
                });
            } else {
                registrationData.update(rd => {
                    const updatedHours = [...rd.businessHours];
                    updatedHours[index].hours = newEnd ? `${newStart} - ${newEnd}` : newStart;
                    return { ...rd, businessHours: updatedHours };
                });
            }
        } else {
            // Setting end time
            registrationData.update(rd => {
                const updatedHours = [...rd.businessHours];
                updatedHours[index].hours = `${start} - ${value}`;
                return { ...rd, businessHours: updatedHours };
            });
        }
    }
    
    // Apply a template to all business hours
    function applyTemplate(templateIndex: number): void {
        registrationData.update(rd => ({
            ...rd,
            businessHours: [...hoursTemplates[templateIndex].hours]
        }));
    }
    
    // Copy hours from one day to others
    function copyHoursToAllWeekdays(fromIndex: number): void {
        registrationData.update(rd => {
            const updatedHours = [...rd.businessHours];
            const sourceDay = updatedHours[fromIndex];
            
            for (let i = 0; i < 5; i++) { // Monday to Friday (indices 0-4)
                if (i !== fromIndex) {
                    updatedHours[i].hours = sourceDay.hours;
                    updatedHours[i].isOpen = sourceDay.isOpen;
                }
            }
            
            return { ...rd, businessHours: updatedHours };
        });
    }
    
    // Copy hours to weekend days
    function copyHoursToWeekend(fromIndex: number): void {
        registrationData.update(rd => {
            const updatedHours = [...rd.businessHours];
            const sourceDay = updatedHours[fromIndex];
            
            for (let i = 5; i < 7; i++) { // Saturday and Sunday (indices 5-6)
                updatedHours[i].hours = sourceDay.hours;
                updatedHours[i].isOpen = sourceDay.isOpen;
            }
            
            return { ...rd, businessHours: updatedHours };
        });
    }
    
    // Initialize business hours on component mount
    onMount(() => {
        initializeBusinessHours();
    });

    // Toggle day open/closed
    function toggleDayStatus(day: Day) {
        registrationData.update(rd => ({
            ...rd,
            hours: {
                ...rd.hours,
                [day]: {
                    ...rd.hours[day],
                    isOpen: !rd.hours[day].isOpen
                }
            }
        }));
    }

    // Update hours for a day
    function updateHours(day: Day, type: 'open' | 'close', value: string) {
        registrationData.update(rd => ({
            ...rd,
            hours: {
                ...rd.hours,
                [day]: {
                    ...rd.hours[day],
                    [type]: value
                }
            }
        }));
    }

    // Handle profile photo selection
    let profilePhotoPreview: string | null = null;
    
    function handleProfilePhotoChange(event: Event) {
        const target = event.target as HTMLInputElement;
        if (target.files && target.files[0]) {
            const file = target.files[0];
            
            // Update registration data
            registrationData.update(rd => ({
                ...rd,
                profilePhoto: file
            }));
            
            // Create preview URL
            profilePhotoPreview = URL.createObjectURL(file);
        }
    }

    // Handle style guide image selection
    let styleGuideImagePreviews: string[] = [];
    
    function handleStyleGuideImagesChange(event: Event) {
        const target = event.target as HTMLInputElement;
        if (target.files) {
            const files = Array.from(target.files);
            
            // Update registration data
            registrationData.update(rd => ({
                ...rd,
                styleGuide: {
                    ...rd.styleGuide,
                    images: files
                }
            }));
            
            // Create preview URLs
            styleGuideImagePreviews = files.map(file => URL.createObjectURL(file));
        }
    }

    // Format phone number as user types
    function formatPhoneNumber(event: Event) {
        const input = event.target as HTMLInputElement;
        let value = input.value.replace(/\D/g, '');
        
        if (value.length > 0) {
            if (value.length <= 3) {
                value = `(${value}`;
            } else if (value.length <= 6) {
                value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
            } else {
                value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
            }
        }
        
        registrationData.update(rd => ({
            ...rd,
            phone: value
        }));
    }

    // Navigation functions
    function nextStep() {
        if (currentStep < STEPS.COMPLETE) {
            currentStep++;
            error = null;
        }
    }

    function prevStep() {
        if (currentStep > STEPS.ACCOUNT) {
            currentStep--;
            error = null;
        }
    }

    function goToSignIn() {
        goto('/');
    }
</script>

<div class="min-h-screen relative flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <!-- Background Image with Overlay -->
    <div class="absolute inset-0 bg-cover bg-center z-0" style="background-image: url('https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'); background-position: center;">
        <div class="absolute inset-0 bg-gradient-to-r from-indigo-900/90 to-purple-900/80 backdrop-blur-sm"></div>
    </div>

    <!-- Content -->
    <div class="relative z-10 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div class="text-center">
            <div class="flex justify-center">
                <div class="h-16 w-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.5 4h-5L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3l-2.5-3z" />
                    </svg>
                </div>
            </div>

            <h2 class="mt-6 text-center text-3xl font-extrabold text-white">HairStyle Pro</h2>
            <p class="mt-2 text-center text-sm text-indigo-100">
                Create your stylist account
            </p>
        </div>
    </div>

    <!-- Progress Bar -->
    <div class="relative z-10 sm:mx-auto sm:w-full sm:max-w-2xl mt-8">
        <div class="bg-white/20 backdrop-blur-md h-2 rounded-full overflow-hidden">
            <div 
                class="bg-indigo-500 h-full transition-all duration-300 ease-in-out" 
                style="width: {(currentStep / (Object.keys(STEPS).length - 1)) * 100}%"
            ></div>
        </div>
        <div class="flex justify-between px-2 mt-2 text-xs text-white/80">
            <span>Account</span>
            <span>Personal</span>
            <span>Business</span>
            <span>Services</span>
            <span>Hours</span>
            <span>Style</span>
            <span>Complete</span>
        </div>
    </div>

    <!-- Registration Form -->
    <div class="mt-8 relative z-10 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div class="bg-white/90 backdrop-blur-md py-8 px-4 shadow-2xl sm:rounded-lg sm:px-10 border border-white/20">
            {#if error}
                <div class="rounded-md bg-red-50 p-4 mb-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            {/if}

            <!-- Step 1: Account Creation -->
            {#if currentStep === STEPS.ACCOUNT}
                <div class="space-y-6">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900">Create your account</h3>
                        <p class="mt-1 text-sm text-gray-500">Let's start by setting up your login credentials.</p>
                    </div>

                    <div>
                        <label for="email" class="block text-sm font-medium text-gray-700">Email address</label>
                        <div class="mt-1">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autocomplete="email"
                                required
                                bind:value={$registrationData.email}
                                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="you@example.com"
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
                                bind:value={$registrationData.password}
                                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="••••••••"
                            />
                        </div>
                        <p class="mt-1 text-xs text-gray-500">Password must be at least 6 characters</p>
                    </div>

                    <div class="flex justify-between">
                        <button
                            type="button"
                            on:click={goToSignIn}
                            class="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Back to Sign In
                        </button>
                        <button
                            type="button"
                            on:click={createAccount}
                            disabled={loading}
                            class="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {#if loading}
                                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Processing...
                            {:else}
                                Continue
                            {/if}
                        </button>
                    </div>
                </div>
            {/if}

            <!-- Step 2: Personal Information -->
            {#if currentStep === STEPS.PERSONAL}
                <div class="space-y-6">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900">Personal Information</h2>
                        <p class="mt-1 text-sm text-gray-600">Tell us about yourself so clients can get to know you.</p>
                    </div>

                    <div class="space-y-4">
                        <!-- Profile Photo Upload -->
                        <div>
                            <label for="profile-photo" class="block text-sm font-medium text-gray-700">Profile Photo</label>
                            <div class="mt-1 flex items-center space-x-5">
                                <div class="flex-shrink-0">
                                    {#if profilePhotoPreview}
                                        <img src={profilePhotoPreview} alt="Profile preview" class="h-24 w-24 rounded-full object-cover" />
                                    {:else}
                                        <div class="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                                            <svg class="h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                    {/if}
                                </div>
                                <div class="flex text-sm text-gray-600">
                                    <label for="profile-photo" class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                        <span>Upload a photo</span>
                                        <input id="profile-photo" name="profile-photo" type="file" class="sr-only" accept="image/*" on:change={handleProfilePhotoChange} />
                                    </label>
                                    <p class="pl-1">or drag and drop</p>
                                </div>
                            </div>
                            <p class="mt-2 text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                        </div>

                        <!-- First Name -->
                        <div>
                            <label for="first-name" class="block text-sm font-medium text-gray-700">First Name</label>
                            <input
                                type="text"
                                id="first-name"
                                bind:value={$registrationData.firstName}
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                required
                            />
                        </div>

                        <!-- Last Name -->
                        <div>
                            <label for="last-name" class="block text-sm font-medium text-gray-700">Last Name</label>
                            <input
                                type="text"
                                id="last-name"
                                bind:value={$registrationData.lastName}
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                required
                            />
                        </div>
                    </div>

                    <!-- Error message -->
                    {#if error}
                        <div class="rounded-md bg-red-50 p-4">
                            <div class="flex">
                                <div class="flex-shrink-0">
                                    <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h3 class="text-sm font-medium text-red-800">{error}</h3>
                                </div>
                            </div>
                        </div>
                    {/if}

                    <!-- Navigation buttons -->
                    <div class="flex justify-between">
                        <button
                            type="button"
                            on:click={prevStep}
                            class="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            on:click={updatePersonalInfo}
                            disabled={loading}
                            class="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {#if loading}
                                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Saving...
                            {:else}
                                Continue
                            {/if}
                        </button>
                    </div>
                </div>
            {/if}

            <!-- Step 3: Business Details -->
            {#if currentStep === STEPS.BUSINESS}
                <div class="space-y-6">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900">Business Details</h3>
                        <p class="mt-1 text-sm text-gray-500">Tell us about your salon or business.</p>
                    </div>
                    
                    <div>
                        <label for="salonName" class="block text-sm font-medium text-gray-700">Salon name</label>
                        <div class="mt-1">
                            <input
                                id="salonName"
                                name="salonName"
                                type="text"
                                bind:value={$registrationData.salonName}
                                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Elegant Cuts"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label for="address" class="block text-sm font-medium text-gray-700">Address</label>
                        <div class="mt-1">
                            <input
                                id="address"
                                name="address"
                                type="text"
                                bind:value={$registrationData.address}
                                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="123 Main St"
                            />
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <div>
                            <label for="city" class="block text-sm font-medium text-gray-700">City</label>
                            <div class="mt-1">
                                <input
                                    id="city"
                                    name="city"
                                    type="text"
                                    bind:value={$registrationData.city}
                                    class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="San Francisco"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label for="state" class="block text-sm font-medium text-gray-700">State</label>
                            <div class="mt-1">
                                <input
                                    id="state"
                                    name="state"
                                    type="text"
                                    bind:value={$registrationData.state}
                                    class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="CA"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label for="zip" class="block text-sm font-medium text-gray-700">ZIP / Postal code</label>
                            <div class="mt-1">
                                <input
                                    id="zip"
                                    name="zip"
                                    type="text"
                                    bind:value={$registrationData.zip}
                                    class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="94103"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label for="phone" class="block text-sm font-medium text-gray-700">Phone number</label>
                        <div class="mt-1">
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                bind:value={$registrationData.phone}
                                on:input={formatPhoneNumber}
                                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="(555) 123-4567"
                            />
                        </div>
                    </div>

                    <div class="flex justify-between">
                        <button
                            type="button"
                            on:click={prevStep}
                            class="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            on:click={updateBusinessInfo}
                            disabled={loading}
                            class="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {#if loading}
                                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Saving...
                            {:else}
                                Continue
                            {/if}
                        </button>
                    </div>
                </div>
            {/if}

            <!-- Step 4: Services -->
            {#if currentStep === STEPS.SERVICES}
                <div class="space-y-6">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900">Service Offerings</h3>
                        <p class="mt-1 text-sm text-gray-500">Add the services you offer to your clients.</p>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <label for="service-name" class="block text-sm font-medium text-gray-700">Service Name</label>
                            <input
                                type="text"
                                id="service-name"
                                bind:value={newService.name}
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label for="service-description" class="block text-sm font-medium text-gray-700">Service Description</label>
                            <textarea
                                id="service-description"
                                bind:value={newService.description}
                                rows="3"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="Describe your service..."
                            ></textarea>
                        </div>

                        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label for="service-price" class="block text-sm font-medium text-gray-700">Price</label>
                                <input
                                    type="number"
                                    id="service-price"
                                    min="0"
                                    step="0.01"
                                    bind:value={newService.price}
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                            </div>

                            <div>
                                <label for="service-duration" class="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                                <input
                                    type="number"
                                    id="service-duration"
                                    min="1"
                                    bind:value={newService.duration}
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            on:click={addService}
                            class="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Add Service
                        </button>

                        <button
                            type="button"
                            on:click={nextStep}
                            class="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Skip for now
                        </button>

                        {#if $registrationData.services.length > 0}
                            <div class="mt-4">
                                <h4 class="text-sm font-medium text-gray-700 mb-2">Added Services:</h4>
                                <ul class="mt-2 divide-y divide-gray-200">
                                    {#each $registrationData.services as service, index}
                                        <li class="py-3">
                                            <div class="flex justify-between">
                                                <div class="flex-1">
                                                    <h5 class="text-sm font-medium text-gray-900">{service.name}</h5>
                                                    {#if service.description}
                                                        <p class="mt-1 text-sm text-gray-500">{service.description}</p>
                                                    {/if}
                                                    <div class="mt-1 flex items-center text-sm text-gray-500">
                                                        <span class="mr-4">${service.price}</span>
                                                        <span>{service.duration} minutes</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <button
                                                        type="button"
                                                        on:click={() => removeService(index)}
                                                        class="text-red-600 hover:text-red-900"
                                                        aria-label="Remove service"
                                                    >
                                                        <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    {/each}
                                </ul>
                            </div>
                        {/if}
                    </div>

                    <div class="flex justify-between mt-6">
                        <button
                            type="button"
                            on:click={prevStep}
                            class="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Back
                        </button>
                        
                        <div class="flex space-x-3">
                            <button
                                type="button"
                                on:click={nextStep}
                                class="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Skip for now
                            </button>
                            
                            <button
                                type="button"
                                on:click={updateServicesInfo}
                                class="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                disabled={loading}
                            >
                                {#if loading}
                                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                {:else}
                                    Continue
                                {/if}
                            </button>
                        </div>
                    </div>
                </div>
            {/if}

            <!-- Step 5: Business Hours -->
            {#if currentStep === STEPS.HOURS}
                <div class="space-y-6">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900">Business Hours</h3>
                        <p class="mt-1 text-sm text-gray-500">Set your business hours to help clients plan their visits.</p>
                    </div>

                    <div class="space-y-4 bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                        <div class="flex items-center justify-between">
                            <h3 class="text-sm font-medium text-gray-800">Quick Templates</h3>
                            <div class="flex space-x-2">
                                {#each hoursTemplates as template, i}
                                    <button 
                                        type="button"
                                        on:click={() => applyTemplate(i)}
                                        class="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        {template.name}
                                    </button>
                                {/each}
                            </div>
                        </div>
                        
                        <div class="mt-4 space-y-3 bg-gray-50 p-4 rounded-md border border-gray-100">
                            {#each $registrationData.businessHours as day, i}
                                <div class="bg-white p-3 rounded-md shadow-sm border border-gray-100 hover:border-indigo-200 transition-all duration-200">
                                    <div class="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                                        <div class="w-full sm:w-24 flex items-center justify-between sm:justify-start mb-2 sm:mb-0">
                                            <span class="text-sm font-medium {day.isOpen ? 'text-gray-800' : 'text-gray-500'}">{day.day}</span>
                                            <div class="sm:ml-2">
                                                <label class="inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        class="sr-only peer" 
                                                        checked={day.isOpen} 
                                                        on:change={() => toggleDay(i)}
                                                    >
                                                    <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                                    <span class="ml-2 text-xs text-gray-600">{day.isOpen ? 'Open' : 'Closed'}</span>
                                                </label>
                                            </div>
                                        </div>
                                        
                                        {#if day.isOpen}
                                            <div class="flex-1 flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                                                <div class="flex-1 flex items-center">
                                                    <select 
                                                        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                        value={parseHours(day.hours).start}
                                                        on:change={(e) => updateBusinessHoursTime(i, true, (e.target as HTMLSelectElement).value)}
                                                    >
                                                        {#each startTimeOptions as time}
                                                            <option value={time}>{time}</option>
                                                        {/each}
                                                    </select>
                                                </div>
                                                
                                                <div class="flex items-center justify-center">
                                                    <span class="text-sm text-gray-500">to</span>
                                                </div>
                                                
                                                <div class="flex-1 flex items-center">
                                                    <select 
                                                        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                        value={parseHours(day.hours).end}
                                                        on:change={(e) => updateBusinessHoursTime(i, false, (e.target as HTMLSelectElement).value)}
                                                    >
                                                        {#each endTimeOptions as time}
                                                            <option value={time}>{time}</option>
                                                        {/each}
                                                    </select>
                                                </div>
                                            </div>
                                        {:else}
                                            <div class="flex-1 flex items-center justify-center sm:justify-start">
                                                <span class="text-sm text-gray-500 italic">Closed all day</span>
                                            </div>
                                        {/if}
                                        
                                        <div class="hidden sm:flex items-center mt-2 sm:mt-0">
                                            <div class="relative group">
                                                <button 
                                                    type="button" 
                                                    class="text-gray-400 hover:text-gray-500"
                                                    aria-label="More options"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                    </svg>
                                                </button>
                                                <div class="hidden group-hover:block absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                                    <div class="py-1">
                                                        <button 
                                                            type="button" 
                                                            class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                            on:click={() => copyHoursToAllWeekdays(i)}
                                                        >
                                                            Copy to all weekdays
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                            on:click={() => copyHoursToWeekend(i)}
                                                        >
                                                            Copy to weekend
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>

                    <div class="flex justify-between">
                        <button
                            type="button"
                            on:click={prevStep}
                            class="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            on:click={updateBusinessHours}
                            disabled={loading}
                            class="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {#if loading}
                                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Saving...
                            {:else}
                                Continue
                            {/if}
                        </button>
                    </div>
                </div>
            {/if}

            <!-- Step 6: Style Guide -->
            {#if currentStep === STEPS.STYLE_GUIDE}
                <div class="space-y-6">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900">Style Guide</h2>
                        <p class="mt-1 text-sm text-gray-600">Showcase your work and style preferences.</p>
                    </div>

                    <div class="space-y-4">
                        <!-- Title -->
                        <div>
                            <label for="style-guide-title" class="block text-sm font-medium text-gray-700">Title</label>
                            <input
                                type="text"
                                id="style-guide-title"
                                bind:value={$registrationData.styleGuide.title}
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="e.g., Summer Styles 2023"
                                required
                            />
                        </div>

                        <!-- Description -->
                        <div>
                            <label for="style-guide-description" class="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                id="style-guide-description"
                                bind:value={$registrationData.styleGuide.description}
                                rows="3"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="Describe your style preferences and specialties..."
                            ></textarea>
                        </div>

                        <!-- Image Upload -->
                        <div>
                            <label for="file-upload" class="block text-sm font-medium text-gray-700">Photos</label>
                            <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                <div class="space-y-1 text-center">
                                    <svg class="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div class="flex text-sm text-gray-600">
                                        <label for="file-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                            <span>Upload files</span>
                                            <input id="file-upload" name="file-upload" type="file" class="sr-only" multiple accept="image/*" on:change={handleStyleGuideImagesChange} />
                                        </label>
                                        <p class="pl-1">or drag and drop</p>
                                    </div>
                                    <p class="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                                </div>
                            </div>
                        </div>

                        <!-- Image Previews -->
                        {#if $registrationData.styleGuide.images.length > 0}
                            <div>
                                <h4 class="text-sm font-medium text-gray-700 mb-2">Selected Images:</h4>
                                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {#each $registrationData.styleGuide.images as image, index}
                                        <div class="relative rounded-lg overflow-hidden h-32">
                                            <img src={URL.createObjectURL(image)} alt="Style preview" class="w-full h-full object-cover" />
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    </div>

                    <!-- Error message -->
                    {#if error}
                        <div class="rounded-md bg-red-50 p-4">
                            <div class="flex">
                                <div class="flex-shrink-0">
                                    <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h3 class="text-sm font-medium text-red-800">{error}</h3>
                                </div>
                            </div>
                        </div>
                    {/if}

                    <!-- Navigation buttons -->
                    <div class="flex justify-between">
                        <button
                            type="button"
                            on:click={prevStep}
                            class="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Back
                        </button>
                        <div class="flex space-x-3">
                            <button
                                type="button"
                                on:click={nextStep}
                                class="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Skip for now
                            </button>
                            <button
                                type="button"
                                on:click={updateStyleGuide}
                                disabled={loading}
                                class="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {#if loading}
                                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Saving...
                                {:else}
                                    Continue
                                {/if}
                            </button>
                        </div>
                    </div>
                </div>
            {/if}

            <!-- Completion Step -->
            {#if currentStep === STEPS.COMPLETE}
                <div class="space-y-6">
                    <div class="text-center">
                        <svg class="mx-auto h-12 w-12 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h2 class="mt-3 text-2xl font-bold text-gray-900">Registration Complete!</h2>
                        <p class="mt-2 text-sm text-gray-600">
                            Congratulations! You've completed all the steps to set up your stylist profile.
                            Your account has been created successfully.
                        </p>
                    </div>

                    {#if error}
                        <div class="rounded-md bg-red-50 p-4 mb-4">
                            <div class="flex">
                                <div class="flex-shrink-0">
                                    <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h3 class="text-sm font-medium text-red-800">There was an issue with your registration</h3>
                                    <div class="mt-2 text-sm text-red-700">
                                        <p>{error}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/if}

                    <div class="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-sm font-medium text-green-800">Your profile is ready!</h3>
                                <div class="mt-2 text-sm text-green-700">
                                    <p>You can now sign in to access your dashboard and start managing your business.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-sm font-medium text-blue-800">What's next?</h3>
                                <div class="mt-2 text-sm text-blue-700">
                                    <ul class="list-disc pl-5 space-y-1">
                                        <li>Sign in to your account</li>
                                        <li>Set up your availability calendar</li>
                                        <li>Customize your profile further</li>
                                        <li>Invite clients to book appointments</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-center mt-6">
                        <a href="/login" class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Go to Login
                        </a>
                    </div>
                </div>
            {/if}
        </div>
    </div>

    <div class="mt-8 text-center text-xs text-white/70 relative z-10">
        <p> 2025 HairStyle Pro. All rights reserved.</p>
    </div>
</div>
