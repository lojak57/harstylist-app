<script lang="ts">
    import { page } from '$app/stores';
    import { fade } from 'svelte/transition';
    
    // Mobile menu state
    let isMenuOpen = false;
    
    // Toggle mobile menu
    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
    }
    
    // Close menu when route changes
    $: if ($page.url.pathname) {
        isMenuOpen = false;
    }
    
    // Nav links for easy maintenance
    const navLinks = [
        { href: '/appointments', label: 'Appointments' },
        { href: '/clients', label: 'Clients' },
        { href: '/services', label: 'Services' },
        { href: '/style-guides', label: 'Style Guides' },
        { href: '/payments', label: 'Payments' },
        { href: '/profile', label: 'Profile' }
    ];
</script>

<nav class="bg-white shadow sticky top-0 z-50">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 justify-between items-center">
            <!-- Logo and brand name -->
            <div class="flex items-center">
                <div class="flex flex-shrink-0 items-center">
                    <span class="text-xl font-semibold text-indigo-600">HairStylist</span>
                </div>
            </div>
            
            <!-- Desktop navigation -->
            <div class="hidden md:flex space-x-8">
                {#each navLinks as link}
                    <a
                        href={link.href}
                        class="{$page.url.pathname.startsWith(link.href) ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors duration-200"
                    >
                        {link.label}
                    </a>
                {/each}
            </div>
            
            <!-- Mobile menu button -->
            <div class="md:hidden flex items-center">
                <button 
                    type="button" 
                    class="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors duration-200" 
                    aria-controls="mobile-menu" 
                    aria-expanded={isMenuOpen}
                    on:click={toggleMenu}
                >
                    <span class="sr-only">{isMenuOpen ? 'Close menu' : 'Open menu'}</span>
                    <!-- Icon when menu is closed -->
                    {#if !isMenuOpen}
                        <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    {:else}
                        <!-- Icon when menu is open -->
                        <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    {/if}
                </button>
            </div>
        </div>
    </div>

    <!-- Mobile menu, show/hide based on menu state -->
    {#if isMenuOpen}
        <div 
            id="mobile-menu" 
            class="md:hidden bg-white shadow-lg absolute w-full left-0 right-0 z-50"
            transition:fade={{ duration: 200 }}
        >
            <div class="px-2 pt-2 pb-3 space-y-1">
                {#each navLinks as link}
                    <a
                        href={link.href}
                        class="{$page.url.pathname.startsWith(link.href) ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200"
                    >
                        {link.label}
                    </a>
                {/each}
            </div>
        </div>
    {/if}
</nav>