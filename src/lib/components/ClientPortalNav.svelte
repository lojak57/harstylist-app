<script lang="ts">
    import { page } from '$app/stores';
    import { fade } from 'svelte/transition';
    import { onMount } from 'svelte';
    
    // Navigation links for the client portal
    const navLinks = [
        { href: '/client-portal/dashboard', label: 'Dashboard' },
        { href: '/client-portal/appointments', label: 'Appointments' },
        { href: '/client-portal/profile', label: 'Profile' },
        { href: '/client-portal/messages', label: 'Messages' }
    ];
    
    // Mobile navigation state
    let isMobileMenuOpen = false;
    let isScrolled = false;
    
    // Handle scroll effect for navigation
    onMount(() => {
        const handleScroll = () => {
            isScrolled = window.scrollY > 10;
        };
        
        window.addEventListener('scroll', handleScroll);
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    });
    
    function toggleMobileMenu() {
        isMobileMenuOpen = !isMobileMenuOpen;
    }
</script>

<div class="client-nav-wrapper {isScrolled ? 'scrolled' : ''}">
    <!-- Client Portal Navigation Bar - Fixed at top with gradient accent -->
    <header class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white {isScrolled ? 'shadow-md' : ''}">
        <!-- Gradient accent bar -->
        <div class="h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600"></div>
        
        <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <!-- Logo Section -->
                <div class="flex-shrink-0">
                    <a href="/client-portal/dashboard" class="flex items-center space-x-2">
                        <span class="text-xl font-medium text-gray-900">Client Portal</span>
                    </a>
                </div>
                
                <!-- Desktop Navigation - Hidden on mobile/tablet -->
                <div class="hidden lg:block">
                    <div class="ml-10 flex items-center space-x-8">
                        {#each navLinks as link}
                            <a
                                href={link.href}
                                class="{$page.url.pathname.startsWith(link.href) ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-500'} 
                                    px-1 py-2 text-sm transition-all duration-200"
                                aria-current={$page.url.pathname.startsWith(link.href) ? 'page' : undefined}
                            >
                                {link.label}
                            </a>
                        {/each}
                    </div>
                </div>
                
                <!-- Tablet/Large Mobile Navigation - Visible on medium screens -->
                <div class="hidden md:flex lg:hidden">
                    <div class="flex items-center justify-center w-full space-x-6">
                        {#each navLinks as link}
                            <a
                                href={link.href}
                                class="{$page.url.pathname.startsWith(link.href) ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-500'} 
                                    block py-2 text-sm transition-colors duration-200"
                                aria-current={$page.url.pathname.startsWith(link.href) ? 'page' : undefined}
                            >
                                {link.label}
                            </a>
                        {/each}
                    </div>
                </div>
                
                <!-- Mobile menu button - Only visible on small screens -->
                <div class="flex md:hidden">
                    <button 
                        type="button" 
                        on:click={toggleMobileMenu}
                        class="bg-white p-2 rounded-md text-gray-500 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <span class="sr-only">Open menu</span>
                        <!-- Icon when menu is closed -->
                        <svg 
                            class="{isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6" 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor" 
                            aria-hidden="true"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <!-- Icon when menu is open -->
                        <svg 
                            class="{isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6" 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor" 
                            aria-hidden="true"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </nav>
        
        <!-- Mobile menu dropdown -->
        {#if isMobileMenuOpen}
            <div 
                class="md:hidden bg-white shadow-lg mb-4 overflow-hidden transition-all" 
                transition:fade={{ duration: 200 }}
            >
                <div class="px-4 pt-2 pb-3 space-y-1">
                    {#each navLinks as link}
                        <a
                            href={link.href}
                            class="{$page.url.pathname.startsWith(link.href) ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'} 
                                block px-4 py-4 rounded-2xl text-base font-medium transition-colors duration-200"
                            aria-current={$page.url.pathname.startsWith(link.href) ? 'page' : undefined}
                        >
                            {link.label}
                        </a>
                    {/each}
                </div>
            </div>
        {/if}
    </header>
    
    <!-- Spacer div to push content below fixed navigation -->
    <div class="h-17"></div>
</div>

<style>
    /* Custom styling for client portal navigation */
    .client-nav-wrapper header {
        box-shadow: 0 0 0 rgba(0, 0, 0, 0);
        transition: box-shadow 0.3s ease;
    }
    
    .client-nav-wrapper.scrolled header {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    
    /* Height spacer to match header height */
    .h-17 {
        height: 4.25rem;
    }
</style>
