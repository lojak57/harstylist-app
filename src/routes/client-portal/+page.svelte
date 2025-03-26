<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import Card from '$lib/components/ui/Card.svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import Badge from '$lib/components/ui/Badge.svelte';
    import Notification from '$lib/components/ui/Notification.svelte';
    import AppointmentStatus from '$lib/components/ui/AppointmentStatus.svelte';
    import Skeleton from '$lib/components/ui/Skeleton.svelte';

    let loading = true;
    let error: string | null = null;
    let showSuccessMessage = false;
    
    interface Client {
        id: string;
        name: string;
        email: string;
        phone?: string;
        stylist_id?: string;
        user_id?: string;
        avatar_url?: string;
        last_visit?: string;
        client_code?: string;
        created_at: string;
    }
    
    interface Stylist {
        id: string;
        name: string;
        email: string;
    }
    
    interface Service {
        id: string;
        name: string;
        description?: string;
        price: number;
    }
    
    interface Appointment {
        id: string;
        client_id: string;
        start_time: string;
        end_time: string;
        status?: string;
        notes?: string;
        services?: Service[];
    }
    
    let client: Client | null = null;
    let stylist: Stylist | null = null;
    let appointments: Appointment[] = [];
    let upcomingAppointments: Appointment[] = [];
    let pastAppointments: Appointment[] = [];
    let services: Service[] = [];
    
    onMount(async () => {
        await fetchClientData();
    });

    async function fetchClientData() {
        try {
            loading = true;
            
            // Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError) throw userError;
            if (!user) {
                // Redirect to login if no user
                return goto('/client-portal/login');
            }
            
            console.log('User data:', user);
            
            // Check if user has client_id in metadata
            let clientId = user.user_metadata?.client_id;
            let clientQuery;
            
            if (clientId) {
                // If we have a client ID in metadata, use it for direct lookup
                console.log('Using client ID from metadata:', clientId);
                clientQuery = supabase
                    .from('clients')
                    .select('*')
                    .eq('id', clientId)
                    .single();
            } else {
                // Otherwise look up by user_id
                console.log('Looking up client by user_id');
                clientQuery = supabase
                    .from('clients')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();
            }
            
            // Get client profile associated with this user
            const { data: clientData, error: clientError } = await clientQuery;
            
            if (clientError) {
                console.error('Client data error:', clientError);
                // If no client record is found, check if we have user metadata to create one
                if (clientError.code === 'PGRST116') {
                    error = 'No client profile found for this account. Please contact your stylist.';
                } else {
                    error = clientError.message;
                }
                return;
            }
            
            if (!clientData) {
                error = 'No client profile found for this account';
                return;
            }
            
            console.log('Client data retrieved:', clientData);
            client = clientData as Client;
            
            // If the client record is missing information that exists in user metadata, update it
            let needsUpdate = false;
            let updates: Partial<Client> = {};
            
            if (!client.name && user.user_metadata?.full_name) {
                updates.name = user.user_metadata.full_name;
                needsUpdate = true;
            }
            
            if (!client.email && user.email) {
                updates.email = user.email;
                needsUpdate = true;
            }
            
            // If we need to update the client record with user data
            if (needsUpdate) {
                console.log('Updating client record with user data:', updates);
                const { error: updateError } = await supabase
                    .from('clients')
                    .update(updates)
                    .eq('id', client.id);
                
                if (updateError) {
                    console.error('Error updating client record:', updateError);
                } else {
                    // Update the local client object with our changes
                    client = { ...client, ...updates };
                }
            }
            
            // Fetch stylist information
            if (client.stylist_id) {
                const { data: stylistData, error: stylistError } = await supabase
                    .from('stylists')
                    .select('*')
                    .eq('id', client.stylist_id)
                    .single();
                
                if (!stylistError) {
                    stylist = stylistData as Stylist;
                } else {
                    console.error('Error fetching stylist:', stylistError);
                }
            }
            
            // Fetch appointments
            const { data: appointmentsData, error: appointmentsError } = await supabase
                .from('appointments')
                .select(`
                    *,
                    services (*)
                `)
                .eq('client_id', client.id)
                .order('start_time', { ascending: true });
            
            if (appointmentsError) throw appointmentsError;
            
            appointments = appointmentsData as Appointment[] || [];
            
            // Split appointments into upcoming and past
            const now = new Date();
            upcomingAppointments = appointments.filter(appt => new Date(appt.start_time) > now);
            pastAppointments = appointments.filter(appt => new Date(appt.start_time) <= now);
            
            // Fetch client services
            const { data: servicesData, error: servicesError } = await supabase
                .from('client_services')
                .select(`
                    *,
                    services (*)
                `)
                .eq('client_id', client.id);
            
            if (servicesError) throw servicesError;
            
            services = servicesData?.map(item => item.services) as Service[] || [];
            
        } catch (e: any) {
            console.error('Error fetching client data:', e);
            error = e.message;
        } finally {
            loading = false;
        }
    }

    async function requestCancellation(appointmentId: string) {
        try {
            // In a real app, you would send a cancellation request to the stylist
            // For now, we'll just show a message
            alert('Cancellation request sent to your stylist. They will contact you to confirm.');
        } catch (e: any) {
            console.error('Error requesting cancellation:', e);
            alert('Failed to send cancellation request. Please contact your stylist directly.');
        }
    }

    function formatDate(dateString: string): string {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        }).format(date);
    }

    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    function daysUntil(dateString: string): string {
        const appointmentDate = new Date(dateString);
        const now = new Date();
        const diffTime = appointmentDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        return `In ${diffDays} days`;
    }

    function getAppointmentDuration(startTime: string, endTime: string): string {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diffMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
        
        if (diffMinutes < 60) return `${diffMinutes} min`;
        
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        
        if (minutes === 0) return `${hours} hr`;
        return `${hours} hr ${minutes} min`;
    }
</script>

<svelte:head>
    <title>Client Portal | Hairstylist App</title>
    <link rel="stylesheet" href="/src/lib/styles/design-system.css">
</svelte:head>

<div class="min-h-screen bg-neutral-50 dark:bg-neutral-900">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header class="mb-8">
            <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 class="text-3xl md:text-4xl font-bold text-primary-800 dark:text-primary-200">Client Portal</h1>
                <div class="flex items-center space-x-3">
                    <Button variant="text" href="/">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                        </svg>
                        Back to Home
                    </Button>
                    <Button on:click={() => supabase.auth.signOut()}>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-5-5H3zM2 4a2 2 0 012-2h7.586a1 1 0 01.707.293l5 5A1 1 0 0118 8v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" clip-rule="evenodd" />
                            <path fill-rule="evenodd" d="M10 8a1 1 0 011 1v3.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 12.586V9a1 1 0 011-1z" clip-rule="evenodd" />
                        </svg>
                        Sign Out
                    </Button>
                </div>
            </div>
        </header>

        {#if loading}
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-1">
                    <Card>
                        <div class="h-32 w-full bg-primary-100 dark:bg-primary-900/30 rounded-t-lg"></div>
                        <div class="p-6 space-y-4">
                            <div class="flex items-center space-x-3">
                                <Skeleton variant="circle" width="3rem" height="3rem" />
                                <div class="space-y-2">
                                    <Skeleton width="8rem" height="1.5rem" />
                                    <Skeleton width="6rem" height="1rem" />
                                </div>
                            </div>
                            <div class="space-y-3 mt-4">
                                <Skeleton width="100%" height="1rem" />
                                <Skeleton width="100%" height="1rem" />
                                <Skeleton width="70%" height="1rem" />
                            </div>
                        </div>
                    </Card>
                </div>
                <div class="lg:col-span-2">
                    <Card>
                        <div class="p-6">
                            <Skeleton width="10rem" height="1.5rem" />
                            <div class="mt-4 space-y-4">
                                <Skeleton width="100%" height="5rem" />
                                <Skeleton width="100%" height="5rem" />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        {:else if error}
            <Card>
                <div class="p-6">
                    <Notification type="error" title="Error Loading Profile">
                        {error}
                    </Notification>
                    <div class="mt-4 flex justify-center">
                        <Button on:click={fetchClientData}>Try Again</Button>
                    </div>
                </div>
            </Card>
        {:else if client}
            {#if showSuccessMessage}
                <div class="mb-6">
                    <Notification type="success" title="Success" autoDismiss={true}>
                        Your request has been submitted. The salon will contact you shortly.
                    </Notification>
                </div>
            {/if}

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Left Column: Client Profile and Services -->
                <div class="lg:col-span-1 space-y-6">
                    <!-- Client Profile Card -->
                    <Card variant="elevated" padding="none">
                        <div class="h-32 bg-gradient-to-r from-primary-500 to-primary-700 relative"></div>
                        <div class="px-6 py-5 -mt-16">
                            <div class="flex flex-col items-center">
                                <div class="rounded-full h-24 w-24 bg-white border-4 border-white shadow overflow-hidden">
                                    {#if client.avatar_url}
                                        <img src={client.avatar_url} alt={client.name} class="h-full w-full object-cover" />
                                    {:else}
                                        <div class="h-full w-full flex items-center justify-center bg-primary-100 text-primary-600 text-2xl font-semibold">
                                            {client.name ? client.name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                    {/if}
                                </div>
                                <h2 class="mt-4 text-xl font-bold text-neutral-900 dark:text-neutral-100">{client.name}</h2>
                                
                                {#if client.last_visit}
                                    <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                        Last visit: {formatDate(client.last_visit)}
                                    </p>
                                {/if}
                                
                                {#if stylist}
                                    <div class="mt-3">
                                        <Badge variant="primary">
                                            Client of {stylist.name}
                                        </Badge>
                                    </div>
                                {/if}
                            </div>
                            
                            <div class="mt-6 space-y-4">
                                {#if client.email}
                                    <div class="flex items-start">
                                        <svg class="h-5 w-5 text-primary-600 mt-0.5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                        </svg>
                                        <span class="text-neutral-700 dark:text-neutral-300">{client.email}</span>
                                    </div>
                                {/if}
                                
                                {#if client.phone}
                                    <div class="flex items-start">
                                        <svg class="h-5 w-5 text-primary-600 mt-0.5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                        </svg>
                                        <span class="text-neutral-700 dark:text-neutral-300">{client.phone}</span>
                                    </div>
                                {/if}
                                
                                <div class="flex items-start">
                                    <svg class="h-5 w-5 text-primary-600 mt-0.5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                                    </svg>
                                    <span class="text-neutral-700 dark:text-neutral-300">Client since {formatDate(client.created_at)}</span>
                                </div>
                            </div>
                        </div>

                        <div class="px-6 pb-6 pt-2">
                            <Button variant="outline" fullWidth={true}>
                                Edit Profile
                            </Button>
                        </div>
                    </Card>
                    
                    <!-- Preferred Services Section -->
                    {#if services.length > 0}
                        <Card>
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                    Your Favorite Services
                                </h3>
                                <Badge variant="neutral" rounded={true}>{services.length}</Badge>
                            </div>
                            
                            <div class="space-y-3">
                                {#each services as service}
                                    <div class="p-3 bg-neutral-50 dark:bg-neutral-800/30 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                        <div class="flex justify-between items-start">
                                            <div>
                                                <h4 class="font-medium text-neutral-900 dark:text-neutral-100">{service.name}</h4>
                                                {#if service.description}
                                                    <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{service.description}</p>
                                                {/if}
                                            </div>
                                            <div class="text-primary-600 font-semibold">
                                                {formatCurrency(service.price)}
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </Card>
                    {/if}
                </div>
                
                <!-- Right Column: Appointments -->
                <div class="lg:col-span-2 space-y-6">
                    <!-- Upcoming Appointments -->
                    <Card>
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                                Upcoming Appointments
                            </h3>
                            <Button variant="outline" size="sm">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                                </svg>
                                Book New
                            </Button>
                        </div>
                        
                        {#if upcomingAppointments.length === 0}
                            <div class="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-8 text-center">
                                <svg class="mx-auto h-12 w-12 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <h3 class="mt-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">No upcoming appointments</h3>
                                <p class="mt-2 text-neutral-500 dark:text-neutral-400">Book your next appointment with your stylist.</p>
                                <div class="mt-6">
                                    <Button variant="primary">
                                        Book an Appointment
                                    </Button>
                                </div>
                            </div>
                        {:else}
                            <div class="space-y-4">
                                {#each upcomingAppointments as appointment}
                                    <div class="relative overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 transition duration-200 hover:shadow-md">
                                        <!-- Colored left border indicator -->
                                        <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary-600"></div>
                                        
                                        <div class="p-5 pl-6">
                                            <div class="flex flex-col md:flex-row justify-between">
                                                <div class="flex-1">
                                                    <div class="flex items-center">
                                                        <AppointmentStatus status="booked" showLabel={true} />
                                                        <span class="ml-auto md:hidden">
                                                            <Badge variant="primary" rounded={true}>
                                                                {daysUntil(appointment.start_time)}
                                                            </Badge>
                                                        </span>
                                                    </div>
                                                    
                                                    <h3 class="text-lg font-medium text-neutral-900 dark:text-neutral-100 mt-2">
                                                        {appointment.services?.map(s => s.name).join(', ') || 'Appointment'}
                                                    </h3>
                                                    
                                                    <div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
                                                        <div class="flex items-center text-neutral-500 dark:text-neutral-400">
                                                            <svg class="h-5 w-5 mr-2 text-primary-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                                                            </svg>
                                                            <span>{formatDate(appointment.start_time)}</span>
                                                        </div>
                                                        
                                                        <div class="flex items-center text-neutral-500 dark:text-neutral-400">
                                                            <svg class="h-5 w-5 mr-2 text-primary-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                                                            </svg>
                                                            <span>{getAppointmentDuration(appointment.start_time, appointment.end_time)}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {#if appointment.notes}
                                                        <div class="mt-3 p-3 bg-neutral-50 dark:bg-neutral-700/30 rounded text-sm text-neutral-600 dark:text-neutral-300">
                                                            {appointment.notes}
                                                        </div>
                                                    {/if}
                                                </div>
                                                
                                                <div class="mt-4 md:mt-0 md:ml-6 flex flex-col items-end justify-between">
                                                    <div class="hidden md:block">
                                                        <Badge variant="primary" rounded={true}>
                                                            {daysUntil(appointment.start_time)}
                                                        </Badge>
                                                    </div>
                                                    
                                                    <div class="flex space-x-2 mt-4 md:mt-auto">
                                                        <Button variant="outline" size="sm" on:click={() => requestCancellation(appointment.id)}>
                                                            Cancel
                                                        </Button>
                                                        <Button variant="primary" size="sm">
                                                            Reschedule
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </Card>
                    
                    <!-- Past Appointments / Service History -->
                    <Card>
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Service History</h3>
                            <Badge variant="neutral" rounded={true}>{pastAppointments.length} visits</Badge>
                        </div>
                        
                        {#if pastAppointments.length === 0}
                            <div class="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-6 text-center">
                                <p class="text-neutral-500 dark:text-neutral-400">You don't have any past appointments yet.</p>
                            </div>
                        {:else}
                            <div class="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200 dark:before:bg-neutral-700 space-y-6">
                                {#each pastAppointments as appointment}
                                    <div class="relative">
                                        <!-- Timeline dot -->
                                        <div class="absolute -left-6 top-1.5 h-3 w-3 rounded-full bg-primary-600 shadow-sm"></div>
                                        
                                        <div class="flex justify-between items-start">
                                            <div>
                                                <h4 class="font-medium text-neutral-900 dark:text-neutral-100">
                                                    {appointment.services?.map(s => s.name).join(', ') || 'Appointment'}
                                                </h4>
                                                <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                                    {formatDate(appointment.start_time)}
                                                </p>
                                                {#if appointment.notes}
                                                    <p class="text-sm text-neutral-600 dark:text-neutral-300 mt-2 italic">
                                                        {appointment.notes}
                                                    </p>
                                                {/if}
                                            </div>
                                            <AppointmentStatus status={appointment.status || 'completed'} showLabel={true} />
                                        </div>
                                    </div>
                                {/each}
                            </div>
                            
                            {#if pastAppointments.length > 5}
                                <div class="mt-6 text-center">
                                    <Button variant="text">
                                        View All History
                                    </Button>
                                </div>
                            {/if}
                        {/if}
                    </Card>
                </div>
            </div>
        {/if}
    </div>
</div>
