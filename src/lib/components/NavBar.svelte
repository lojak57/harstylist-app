<script lang="ts">
    import { page } from '$app/stores';
</script>

<nav class="bg-white shadow">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 justify-between">
            <div class="flex">
                <div class="flex flex-shrink-0 items-center">
                    <span class="text-xl font-semibold">HairStylist</span>
                </div>
                <div class="flex ml-6 space-x-4 md:space-x-8">
                    <a
                        href="/appointments"
                        class="{$page.url.pathname.startsWith('/appointments') ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium"
                    >
                        Appointments
                    </a>
                    <a
                        href="/clients"
                        class="{$page.url.pathname.startsWith('/clients') ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium"
                    >
                        Clients
                    </a>
                    <a
                        href="/services"
                        class="{$page.url.pathname.startsWith('/services') ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium"
                    >
                        Services
                    </a>
                    <a
                        href="/payments"
                        class="{$page.url.pathname.startsWith('/payments') ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium"
                    >
                        Payments
                    </a>
                    <a
                        href="/profile"
                        class="{$page.url.pathname.startsWith('/profile') ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium"
                    >
                        Profile
                    </a>
                </div>
            </div>
        </div>
    </div>
</nav>