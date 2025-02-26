<script lang="ts">
    const paymentMethods = [
        {
            name: 'Venmo',
            logo: '/payment-logos/venmo.svg',
            description: 'Send payments quickly and securely with Venmo'
        },
        {
            name: 'Cash App',
            logo: '/payment-logos/cashapp.svg',
            description: 'Fast and easy payments with Cash App'
        },
        {
            name: 'Apple Pay',
            logo: '/payment-logos/applepay.svg',
            description: 'Secure contactless payments with Apple Pay'
        },
        {
            name: 'Stripe',
            logo: '/payment-logos/stripe.svg',
            description: 'Professional payment processing with Stripe'
        }
    ];
</script>

<div class="py-6">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
            <h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Payment Methods</h2>
            <p class="mt-4 text-lg leading-8 text-gray-600">
                Choose your preferred payment method for a seamless transaction experience
            </p>
        </div>

        <div class="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {#each paymentMethods as method}
                <div class="relative flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div class="mb-4 h-16 w-16">
                        <img src={method.logo} alt="{method.name} logo" class="h-full w-full object-contain" />
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900">{method.name}</h3>
                    <p class="mt-2 text-center text-sm text-gray-500">{method.description}</p>
                    <button
                        class="mt-6 w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        Pay with {method.name}
                    </button>
                </div>
            {/each}
        </div>

        <div class="mt-12 text-center">
            <p class="text-sm text-gray-500">
                This is a demonstration of payment integration options. No actual payment processing is implemented.
            </p>
        </div>
    </div>
</div>