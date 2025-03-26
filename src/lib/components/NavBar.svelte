<script lang="ts">
    import { page } from '$app/stores';
    import { fade } from 'svelte/transition';
    import { onMount } from 'svelte';
    
    // Nav links for easy maintenance
    const navLinks = [
        { href: '/appointments', label: 'Appointments' },
        { href: '/clients', label: 'Clients' },
        { href: '/services', label: 'Services' },
        { href: '/style-guides', label: 'Styles' },
        { href: '/payments', label: 'Payments' },
        { href: '/profile', label: 'Profile' }
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

<div class="navigation-wrapper {isScrolled ? 'scrolled' : ''}">
    <!-- Main Navigation Bar - Fixed at top with app name integrated -->
    <nav class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white shadow-sm {isScrolled ? 'shadow' : ''}">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16 md:h-18">
                <!-- Logo Section (Now part of the nav) -->
                <div class="flex-shrink-0">
                    <a href="/" class="flex items-center space-x-2">
                        <span class="text-xl font-semibold text-primary-600 tracking-tight">HairStylist</span>
                    </a>
                </div>
                
                <!-- Desktop Navigation - Hidden on mobile -->
                <div class="hidden md:block">
                    <div class="ml-10 flex items-center space-x-6">
                        {#each navLinks as link}
                            <a
                                href={link.href}
                                class="{$page.url.pathname.startsWith(link.href) ? 'text-primary-700 border-primary-500 font-medium' : 'text-gray-600 hover:text-primary-600 hover:border-primary-300 border-transparent'} 
                                    px-1 py-2 text-sm border-b-2 transition-all duration-200"
                                aria-current={$page.url.pathname.startsWith(link.href) ? 'page' : undefined}
                            >
                                {link.label}
                            </a>
                        {/each}
                    </div>
                </div>
                
                <!-- Mobile menu button -->
                <div class="flex md:hidden">
                    <button 
                        type="button" 
                        on:click={toggleMobileMenu}
                        class="bg-white p-2 rounded-md text-gray-500 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <span class="sr-only">Open main menu</span>
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
        </div>
        
        <!-- Mobile menu, show/hide based on menu state -->
        {#if isMobileMenuOpen}
            <div 
                class="md:hidden bg-white shadow-lg rounded-b-2xl mx-4 mb-4 overflow-hidden transition-all" 
                transition:fade={{ duration: 200 }}
            >
                <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    {#each navLinks as link}
                        <a
                            href={link.href}
                            class="{$page.url.pathname.startsWith(link.href) ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'} 
                                block px-5 py-4 rounded-xl text-base font-medium transition-colors duration-200"
                            aria-current={$page.url.pathname.startsWith(link.href) ? 'page' : undefined}
                        >
                            {link.label}
                        </a>
                    {/each}
                </div>
            </div>
        {/if}
    </nav>
    
    <!-- Spacer div to push content below fixed navigation -->
    <div class="h-16 md:h-18"></div>
</div>

<style>
    /* Adjust primary color variables to match design system */
    :global(:root) {
        --color-primary-50: #f0f9ff;
        --color-primary-100: #e0f2fe;
        --color-primary-200: #bae6fd;
        --color-primary-300: #7dd3fc;
        --color-primary-400: #38bdf8;
        --color-primary-500: #0ea5e9;
        --color-primary-600: #0284c7;
        --color-primary-700: #0369a1;
        --color-primary-800: #075985;
        --color-primary-900: #0c4a6e;
    }
    
    /* Navigation styling */
    .navigation-wrapper.scrolled nav {
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
</style>