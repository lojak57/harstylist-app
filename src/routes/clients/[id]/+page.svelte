<div class="min-h-full bg-gray-50">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Back Button in Top Left -->
        <div class="mb-4">
            <a href="/clients" class="inline-flex items-center rounded-md border border-indigo-300 bg-white px-3 py-2 text-sm font-medium text-indigo-700 shadow-sm hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Clients
            </a>
        </div>

        {#if loading}
            <div class="flex justify-center items-center h-64">
                <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-500"></div>
            </div>
        {:else if error}
            <div class="rounded-md bg-red-50 p-4 mb-4 shadow-sm">
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
        {:else if client}
            <!-- Header with gradient background -->
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-xl shadow-lg">
                <div class="px-6 py-5 flex flex-col sm:flex-row justify-between gap-4">
                    <div class="flex items-center space-x-5">
                        <div class="flex-shrink-0 h-20 w-20">
                            {#if client.avatar_url}
                                <img class="h-20 w-20 rounded-full border-2 border-white shadow" src={client.avatar_url} alt="{client.name}" />
                            {:else}
                                <div class="h-20 w-20 rounded-full bg-white flex items-center justify-center shadow">
                                    <span class="text-3xl font-bold text-indigo-600">{client.name ? client.name[0].toUpperCase() : '?'}</span>
                                </div>
                            {/if}
                        </div>
                        <div>
                            <h1 class="text-2xl font-bold text-white">{client.name}</h1>
                            <p class="text-sm font-medium text-indigo-100">
                                {client.last_visit ? `Last visit: ${new Date(client.last_visit).toLocaleDateString()}` : 'First-time client'}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center mt-4 sm:mt-0">
                        <button
                            type="button"
                            on:click={scheduleAppointment}
                            class="inline-flex items-center justify-center rounded-md bg-purple-500 bg-opacity-90 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-400 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 transition-colors duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Schedule
                        </button>
                    </div>
                </div>
            </div>

            <!-- Content Cards -->
            <div class="bg-white rounded-b-xl shadow-lg mb-8 divide-y divide-gray-100">
                <!-- Client Information Card -->
                <div class="p-6">
                    <h2 class="text-lg font-semibold text-gray-900 flex items-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Client Information
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {#if client.email}
                            <div class="bg-gray-50 p-4 rounded-lg shadow-sm">
                                <p class="text-sm font-medium text-gray-500 mb-1">Email</p>
                                <div class="flex items-center">
                                    <svg class="flex-shrink-0 mr-2 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                    </svg>
                                    <p class="text-sm text-gray-900 break-all">{client.email}</p>
                                </div>
                            </div>
                        {/if}
                        {#if client.phone}
                            <div class="bg-gray-50 p-4 rounded-lg shadow-sm">
                                <p class="text-sm font-medium text-gray-500 mb-1">Phone</p>
                                <div class="flex items-center">
                                    <svg class="flex-shrink-0 mr-2 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                    </svg>
                                    <p class="text-sm text-gray-900">{client.phone}</p>
                                </div>
                            </div>
                        {/if}
                        {#if client.hair_type || true}
                            <div class="bg-gray-50 p-4 rounded-lg shadow-sm">
                                <p class="text-sm font-medium text-gray-500 mb-1">Hair Type</p>
                                <div class="flex items-center">
                                    <svg class="flex-shrink-0 mr-2 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947z" clip-rule="evenodd" />
                                        <path d="M10 13a3 3 0 100-6 3 3 0 000 6z" />
                                    </svg>
                                    <p class="text-sm text-gray-900">{client.hair_type || 'Not specified'}</p>
                                </div>
                            </div>
                        {/if}
                    </div>

                    {#if client.notes}
                        <div class="mt-6 bg-gray-50 p-4 rounded-lg shadow-sm">
                            <p class="text-sm font-medium text-gray-500 mb-1">Notes</p>
                            <div class="flex">
                                <svg class="flex-shrink-0 mr-2 h-5 w-5 text-indigo-500 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clip-rule="evenodd" />
                                </svg>
                                <p class="text-sm text-gray-900 whitespace-pre-line">{client.notes}</p>
                            </div>
                        </div>
                    {/if}
                </div>

                <!-- Recent Appointments -->
                <div class="p-6">
                    <h2 class="text-lg font-semibold text-gray-900 flex items-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Recent Appointments
                    </h2>
                    <div class="overflow-hidden">
                        {#if appointments.length > 0}
                            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {#each appointments as appointment}
                                    <a href="/appointments/{appointment.id}" class="block group">
                                        <div class="bg-gray-50 rounded-lg p-4 shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:bg-gray-100 border border-gray-100">
                                            <div class="flex justify-between items-start mb-2">
                                                <span class="text-sm font-semibold text-indigo-600">
                                                    {new Date(appointment.start_time).toLocaleDateString(undefined, {weekday: 'short', month: 'short', day: 'numeric'})}
                                                </span>
                                                <span class="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-green-100 text-green-800">
                                                    {appointment.status || 'Scheduled'}
                                                </span>
                                            </div>
                                            <div class="text-sm text-gray-600">
                                                {new Date(appointment.start_time).toLocaleTimeString(undefined, {hour: 'numeric', minute: '2-digit'})}
                                                {#if appointment.end_time}
                                                    - {new Date(appointment.end_time).toLocaleTimeString(undefined, {hour: 'numeric', minute: '2-digit'})}
                                                {/if}
                                            </div>
                                            {#if appointment.service_name}
                                                <div class="mt-1 text-xs text-gray-500">{appointment.service_name}</div>
                                            {/if}
                                        </div>
                                    </a>
                                {/each}
                            </div>
                        {:else}
                            <div class="text-center py-8 bg-gray-50 rounded-lg border border-gray-100">
                                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <h3 class="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
                                <p class="mt-1 text-sm text-gray-500">Get started by scheduling a new appointment.</p>
                                <div class="mt-6">
                                    <button 
                                        on:click={scheduleAppointment}
                                        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                        <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
                                        </svg>
                                        Schedule Appointment
                                    </button>
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Available Services Section -->
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-lg font-semibold text-gray-900 flex items-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    Available Services
                </h2>
                <p class="text-sm text-gray-500 mb-4">Select services for this client</p>
                
                <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {#each allServices as service}
                        <label class="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors duration-200">
                            <input
                                type="checkbox"
                                value={service.id}
                                bind:group={selectedServices}
                                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <div class="ml-3">
                                <p class="text-sm font-medium text-gray-900">{service.name}</p>
                                <p class="text-xs text-gray-500">{service.duration}</p>
                            </div>
                        </label>
                    {/each}
                </div>

                {#if selectedServices.length > 0}
                    <div class="mt-6 flex justify-end">
                        <button
                            on:click={saveClientServices}
                            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                            </svg>
                            Save Services
                        </button>
                    </div>
                {/if}
            </div>

            <!-- Client Portal Access Section -->
            <div class="bg-white rounded-xl shadow-lg p-6 mt-8">
                <h2 class="text-lg font-semibold text-gray-900 flex items-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Client Portal Access
                </h2>
                
                <div class="bg-gray-50 p-4 rounded-lg shadow-sm mb-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-900">Portal Status</p>
                            <p class="text-sm text-gray-500 mt-1">
                                {#if client.user_id}
                                    Client has access to the portal
                                {:else}
                                    Client does not have portal access yet
                                {/if}
                            </p>
                        </div>
                        {#if client.user_id}
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <svg class="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                                    <circle cx="4" cy="4" r="3" />
                                </svg>
                                Active
                            </span>
                        {:else}
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                <svg class="-ml-0.5 mr-1.5 h-2 w-2 text-gray-400" fill="currentColor" viewBox="0 0 8 8">
                                    <circle cx="4" cy="4" r="3" />
                                </svg>
                                Inactive
                            </span>
                        {/if}
                    </div>
                </div>
                
                {#if !client.user_id}
                    <div class="bg-gray-50 p-4 rounded-lg shadow-sm mb-4">
                        <p class="text-sm font-medium text-gray-900 mb-2">Client Code</p>
                        {#if client.client_code}
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <span class="font-mono text-sm bg-white px-3 py-1 border border-gray-300 rounded-md">{client.client_code}</span>
                                </div>
                                <div class="flex space-x-2">
                                    <button 
                                        on:click={copyClientCode} 
                                        class="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                        </svg>
                                        Copy
                                    </button>
                                    <button 
                                        on:click={regenerateClientCode} 
                                        class="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Regenerate
                                    </button>
                                </div>
                            </div>
                        {:else}
                            <button 
                                on:click={generateClientCode} 
                                class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Generate Client Code
                            </button>
                        {/if}
                    </div>
                    
                    <div class="bg-gray-50 p-4 rounded-lg shadow-sm">
                        <p class="text-sm font-medium text-gray-900 mb-2">Invite to Portal</p>
                        <div class="flex items-center">
                            <button 
                                on:click={sendPortalInvite} 
                                disabled={!client.client_code || !client.email}
                                class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z" />
                                </svg>
                                Send Invitation Email
                            </button>
                        </div>
                        {#if !client.email}
                            <p class="text-xs text-red-500 mt-2">Client email is required to send an invitation</p>
                        {/if}
                    </div>
                {:else}
                    <div class="bg-gray-50 p-4 rounded-lg shadow-sm">
                        <p class="text-sm font-medium text-gray-900 mb-2">Portal Access</p>
                        <button 
                            on:click={revokePortalAccess} 
                            class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            Revoke Portal Access
                        </button>
                    </div>
                {/if}
                
                {#if portalMessage}
                    <div class="mt-4 rounded-md {portalMessageType === 'success' ? 'bg-green-50' : 'bg-red-50'} p-4">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                {#if portalMessageType === 'success'}
                                    <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                                    </svg>
                                {:else}
                                    <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                                    </svg>
                                {/if}
                            </div>
                            <div class="ml-3">
                                <p class="text-sm font-medium {portalMessageType === 'success' ? 'text-green-800' : 'text-red-800'}">{portalMessage}</p>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        {:else}
            <div class="text-center py-12 bg-white rounded-xl shadow-md">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">Client not found</h3>
                <p class="mt-1 text-sm text-gray-500">This client may have been deleted or does not exist.</p>
                <div class="mt-6">
                    <a href="/clients" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Back to Clients
                    </a>
                </div>
            </div>
        {/if}
    </div>
</div>

<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import type { Database } from '$lib/supabase';

    type Service = {
        id: string;
        name: string;
        category: string;
        description: string;
        duration: string;
    };

    let allServices: Service[] = [];
    let selectedServices: string[] = [];
    let loading = false;
    let error: string | null = null;

    // Update the Client type to include user_id and client_code fields
    type Client = Database['public']['Tables']['clients']['Row'] & {
        user_id?: string | null;
        client_code?: string | null;
    };
    
    type Appointment = Database['public']['Tables']['appointments']['Row'] & {
        service_name?: string;
    };

    let client: Client | null = null;
    let appointments: Appointment[] = [];
    let portalMessage = '';
    let portalMessageType: 'success' | 'error' = 'success';
    let copyTimeout: ReturnType<typeof setTimeout> | null = null;

    onMount(async () => {
        await Promise.all([
            loadClient(),
            loadAppointments(),
            loadAllServices(),
            loadClientServices()
        ]);
    });

    async function loadClient() {
        try {
            loading = true;
            const { data, error: fetchError } = await supabase
                .from('clients')
                .select('*')
                .eq('id', $page.params.id)
                .single();

            if (fetchError) throw fetchError;
            client = data;
        } catch (e: any) {
            error = e.message;
            client = null;
        } finally {
            loading = false;
        }
    }

    async function loadAppointments() {
        try {
            if (!$page.params.id) return;
            
            // Get appointments with service names
            const { data, error: fetchError } = await supabase
                .from('appointments')
                .select(`
                    *,
                    services!appointments_service_id_fkey (name)
                `)
                .eq('client_id', $page.params.id)
                .order('start_time', { ascending: false });

            if (fetchError) throw fetchError;
            
            appointments = (data || []).map(apt => ({
                ...apt,
                service_name: apt.services?.name
            }));
        } catch (e: any) {
            error = e.message;
        }
    }

    async function loadAllServices() {
        try {
            const { data, error: fetchError } = await supabase
                .from('services')
                .select('*')
                .order('name');

            if (fetchError) throw fetchError;
            allServices = data || [];
        } catch (e: any) {
            error = e.message;
        }
    }

    async function loadClientServices() {
        try {
            if (!$page.params.id) return;
            
            const { data, error: fetchError } = await supabase
                .from('client_services')
                .select('service_id')
                .eq('client_id', $page.params.id);

            if (fetchError) throw fetchError;
            selectedServices = data?.map(item => item.service_id) || [];
        } catch (e: any) {
            error = e.message;
        }
    }

    async function saveClientServices() {
        try {
            loading = true;
            // Remove existing client services
            const { error: deleteError } = await supabase
                .from('client_services')
                .delete()
                .eq('client_id', $page.params.id);

            if (deleteError) throw deleteError;

            // Add selected services
            if (selectedServices.length > 0) {
                const clientServices = selectedServices.map(serviceId => ({
                    client_id: $page.params.id,
                    service_id: serviceId
                }));

                const { error: insertError } = await supabase
                    .from('client_services')
                    .insert(clientServices);

                if (insertError) throw insertError;
            }

            // Add a success message here if you want
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    function scheduleAppointment() {
        goto(`/appointments?client=${$page.params.id}&autoOpen=true`);
    }

    // Client Portal Functions
    async function generateClientCode() {
        try {
            // Generate a random 8-character alphanumeric code
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let code = '';
            for (let i = 0; i < 8; i++) {
                code += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            
            // Update the client with the new code
            const { error: updateError } = await supabase
                .from('clients')
                .update({ client_code: code })
                .eq('id', $page.params.id);
                
            if (updateError) throw updateError;
            
            // Reload the client data
            await loadClient();
            
            portalMessage = 'Client code generated successfully';
            portalMessageType = 'success';
            
            // Clear the message after 3 seconds
            setTimeout(() => {
                portalMessage = '';
            }, 3000);
            
        } catch (e: any) {
            portalMessage = e.message || 'Failed to generate client code';
            portalMessageType = 'error';
        }
    }
    
    async function regenerateClientCode() {
        // Just call the generate function again
        await generateClientCode();
    }
    
    function copyClientCode() {
        if (client?.client_code) {
            navigator.clipboard.writeText(client.client_code);
            
            // Show a message
            portalMessage = 'Client code copied to clipboard';
            portalMessageType = 'success';
            
            // Clear the message after 3 seconds
            if (copyTimeout) clearTimeout(copyTimeout);
            copyTimeout = setTimeout(() => {
                portalMessage = '';
            }, 3000);
        }
    }
    
    async function sendPortalInvite() {
        try {
            if (!client?.email || !client?.client_code) {
                portalMessage = 'Client must have an email and client code';
                portalMessageType = 'error';
                return;
            }
            
            // Generate the registration URL with the client code
            const registrationUrl = `${window.location.origin}/client-portal/register?code=${client.client_code}`;
            
            // In a real app, you would send an email here
            // For now, we'll just copy the URL to clipboard
            navigator.clipboard.writeText(registrationUrl);
            
            portalMessage = 'Registration link copied to clipboard. Send this to your client.';
            portalMessageType = 'success';
            
            // Clear the message after 5 seconds
            setTimeout(() => {
                portalMessage = '';
            }, 5000);
            
        } catch (e: any) {
            portalMessage = e.message || 'Failed to create invitation';
            portalMessageType = 'error';
        }
    }
    
    async function revokePortalAccess() {
        try {
            if (!client?.user_id) {
                portalMessage = 'Client does not have portal access';
                portalMessageType = 'error';
                return;
            }
            
            // First, get the user ID to delete from auth
            const userId = client.user_id;
            
            // Update the client to remove the user_id
            const { error: updateError } = await supabase
                .from('clients')
                .update({ 
                    user_id: null,
                    client_code: null // Also clear the client code
                })
                .eq('id', $page.params.id);
                
            if (updateError) throw updateError;
            
            // In a real app with admin privileges, you might want to delete the user from auth as well
            // This would require a server-side function with admin rights
            // For now, we'll just disconnect the account
            
            // Reload the client data
            await loadClient();
            
            portalMessage = 'Portal access revoked successfully';
            portalMessageType = 'success';
            
            // Clear the message after 3 seconds
            setTimeout(() => {
                portalMessage = '';
            }, 3000);
            
        } catch (e: any) {
            portalMessage = e.message || 'Failed to revoke portal access';
            portalMessageType = 'error';
        }
    }
</script>