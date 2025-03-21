<script lang="ts">
    import { page } from '$app/stores';
    import { fade } from 'svelte/transition';
    
    // Nav links for easy maintenance
    const navLinks = [
        { href: '/appointments', label: 'Appointments', icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5' },
        { href: '/clients', label: 'Clients', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' },
        { href: '/services', label: 'Services', icon: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z' },
        { href: '/style-guides', label: 'Styles', icon: 'M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z' },
        { href: '/payments', label: 'Payments', icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 01-.75.75h-.75m-6-1.5H19.5a.75.75 0 00.75-.75v-.75m-1.5 0V12a.75.75 0 00-.75-.75h-1.5m-6 1.5H3.75a.75.75 0 01-.75-.75v-.75' },
        { href: '/profile', label: 'Profile', icon: 'M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z' }
    ];
</script>

<div class="navigation-container">
    <!-- Main Navigation Bar -->
    <nav class="bg-white shadow sticky top-0 z-50">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="flex h-14 justify-center items-center">
                <!-- Primary Navigation - Centered on all screens -->
                <div class="flex justify-center overflow-x-auto hide-scrollbar py-2 gap-1 sm:gap-2 md:gap-4">
                    {#each navLinks as link}
                        <a
                            href={link.href}
                            class="{$page.url.pathname.startsWith(link.href) ? 'bg-indigo-100 text-indigo-700 border-indigo-500' : 'text-gray-500 hover:text-indigo-500 hover:bg-indigo-50 border-transparent'} 
                                flex items-center gap-1 whitespace-nowrap px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-sm font-medium border-b-2 transition-all duration-200"
                            aria-current={$page.url.pathname.startsWith(link.href) ? 'page' : undefined}
                        >
                            <!-- Icon (always visible) -->
                            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={link.icon} />
                            </svg>
                            
                            <!-- Label (hidden on very small screens) -->
                            <span class="hidden xs:inline">{link.label}</span>
                        </a>
                    {/each}
                </div>
            </div>
        </div>
    </nav>
    
    <!-- Logo section below the navigation -->
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="py-3 flex items-center">
            <a href="/" class="text-xl font-semibold text-indigo-600 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
                </svg>
                <span>HairStylist</span>
            </a>
        </div>
    </div>
</div>

<style>
    /* Hide scrollbar but allow scrolling */
    .hide-scrollbar {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
    }
    .hide-scrollbar::-webkit-scrollbar {
        display: none;  /* Chrome, Safari, Opera */
    }
    
    /* Add custom breakpoint for extra small screens */
    @media (min-width: 475px) {
        .xs\:inline {
            display: inline;
        }
    }
    
    /* Set navigation container with negative bottom margin to reduce space */
    .navigation-container {
        margin-bottom: -0.5rem;
    }
</style>