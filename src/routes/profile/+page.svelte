<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';

    let stylist = null;
    let loading = false;
    let error: string | null = null;
    let profileImage: File | null = null;
    let imageUrl: string | null = null;

    // Business Information
    let businessInfo = {
        phone: '',
        address: '',
        businessHours: [
            { day: 'Monday', hours: '9:00 AM - 6:00 PM' },
            { day: 'Tuesday', hours: '9:00 AM - 6:00 PM' },
            { day: 'Wednesday', hours: '9:00 AM - 6:00 PM' },
            { day: 'Thursday', hours: '9:00 AM - 6:00 PM' },
            { day: 'Friday', hours: '9:00 AM - 6:00 PM' },
            { day: 'Saturday', hours: '9:00 AM - 4:00 PM' },
            { day: 'Sunday', hours: 'Closed' }
        ],
        bio: '',
        socialMedia: {
            instagram: '',
            facebook: '',
            tiktok: ''
        },
        services: [
            { name: 'Women\'s Haircut', price: 65, duration: '60 min' },
            { name: 'Men\'s Haircut', price: 35, duration: '30 min' },
            { name: 'Color Service', price: 120, duration: '120 min' },
            { name: 'Highlights', price: 150, duration: '150 min' },
            { name: 'Blowout', price: 45, duration: '45 min' }
        ]
    };

    // Style guide management
    let styleGuides = [
        {
            id: 'classic-blowout',
            name: 'Classic Blowout',
            description: 'Step-by-step guide for achieving a salon-quality blowout at home',
            steps: [
                '1. Start with freshly washed, towel-dried hair',
                '2. Apply heat protectant evenly throughout hair',
                '3. Section hair into manageable parts',
                '4. Use a round brush starting at the roots',
                '5. Direct airflow downward to minimize frizz',
                '6. Set with cool shot button'
            ].join('\n')
        },
        {
            id: 'beach-waves',
            name: 'Beach Waves',
            description: 'Create effortless, natural-looking waves',
            steps: [
                '1. Apply sea salt spray to damp hair',
                '2. Scrunch hair while air drying or diffusing',
                '3. Use a 1-inch curling iron on select pieces',
                '4. Break up curls with fingers',
                '5. Finish with light-hold hairspray'
            ].join('\n')
        },
        {
            id: 'sleek-straight',
            name: 'Sleek and Straight',
            description: 'Achieve smooth, frizz-free straight hair',
            steps: [
                '1. Apply smoothing serum to damp hair',
                '2. Rough dry hair until 80% dry',
                '3. Section hair and use flat iron',
                '4. Apply anti-frizz oil to ends',
                '5. Finish with shine spray'
            ].join('\n')
        },
        {
            id: 'volume-boost',
            name: 'Volume Boost',
            description: 'Add body and volume to fine or flat hair',
            steps: [
                '1. Apply volumizing mousse to roots',
                '2. Blow dry hair upside down',
                '3. Use velcro rollers at crown',
                '4. Set with cool air',
                '5. Remove rollers and style with fingers'
            ].join('\n')
        },
        {
            id: 'curly-care',
            name: 'Curly Hair Care',
            description: 'Enhance and maintain natural curls',
            steps: [
                '1. Co-wash or use sulfate-free shampoo',
                '2. Apply leave-in conditioner',
                '3. Use praying hands method for product',
                '4. Scrunch with microfiber towel',
                '5. Air dry or diffuse on low heat'
            ].join('\n')
        }
    ];

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

    onMount(async () => {
        await loadStylistProfile();
    });

    async function loadStylistProfile() {
        try {
            loading = true;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error: fetchError } = await supabase
                .from('stylists')
                .select('*')
                .eq('id', user.id)
                .single();

            if (fetchError) throw fetchError;
            stylist = data;
            
            // Load business info if exists
            if (stylist.business_info) {
                businessInfo = { ...businessInfo, ...stylist.business_info };
            }
            if (stylist.avatar_url) {
                imageUrl = stylist.avatar_url;
            }
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    async function handleImageUpload(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

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
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    async function updateBusinessInfo() {
        try {
            loading = true;
            const { error: updateError } = await supabase
                .from('stylists')
                .update({ business_info: businessInfo })
                .eq('id', stylist.id);

            if (updateError) throw updateError;
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }
</script>

<div class="py-6">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {#if error}
            <div class="mt-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>
        {/if}

        {#if stylist}
            <div class="md:flex md:items-center md:justify-between md:space-x-5">
                <div class="flex items-start space-x-5">
                    <!-- Profile Image -->
                    <div class="flex-shrink-0">
                        <div class="relative">
                            <img class="h-16 w-16 rounded-full" src={imageUrl || 'https://via.placeholder.com/160'} alt="Profile" />
                            <label class="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white p-1 shadow-lg cursor-pointer">
                                <input type="file" class="hidden" accept="image/*" on:change={handleImageUpload} />
                                <svg class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
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
                    <div class="bg-white shadow sm:rounded-lg">
                    <div class="px-4 py-5 sm:px-6">
                        <h2 class="text-lg font-medium leading-6 text-gray-900">Business Information</h2>
                        <p class="mt-1 text-sm text-gray-500">Update your business details and contact information</p>
                    </div>
                    <div class="border-t border-gray-200 px-4 py-5 sm:px-6">
                        <div class="space-y-6">
                            <!-- Contact Information -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Phone</label>
                                <input type="tel" bind:value={businessInfo.phone} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Address</label>
                                <textarea bind:value={businessInfo.address} rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Bio</label>
                                <textarea bind:value={businessInfo.bio} rows="4" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="Tell your clients about yourself and your expertise..."></textarea>
                            </div>

                            <!-- Social Media Links -->
                            <div class="space-y-4">
                                <h3 class="text-sm font-medium text-gray-700">Social Media</h3>
                                <div>
                                    <label class="block text-sm font-medium text-gray-500">Instagram</label>
                                    <input type="text" bind:value={businessInfo.socialMedia.instagram} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-500">Facebook</label>
                                    <input type="text" bind:value={businessInfo.socialMedia.facebook} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-500">TikTok</label>
                                    <input type="text" bind:value={businessInfo.socialMedia.tiktok} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                </div>
                            </div>

                            <!-- Business Hours -->
                            <div>
                                <h3 class="text-sm font-medium text-gray-700">Business Hours</h3>
                                <div class="mt-2 space-y-2">
                                    {#each businessInfo.businessHours as { day, hours }, i}
                                        <div class="flex items-center justify-between">
                                            <span class="text-sm text-gray-500">{day}</span>
                                            <input type="text" bind:value={businessInfo.businessHours[i].hours} class="block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                        </div>
                                    {/each}
                                </div>
                            </div>

                            <!-- Services & Pricing -->
                            <div>
                                <h3 class="text-sm font-medium text-gray-700">Services & Pricing</h3>
                                <div class="mt-2 space-y-2">
                                    {#each businessInfo.services as service, i}
                                        <div class="grid grid-cols-3 gap-4">
                                            <input type="text" bind:value={businessInfo.services[i].name} placeholder="Service name" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            <input type="number" bind:value={businessInfo.services[i].price} placeholder="Price" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            <input type="text" bind:value={businessInfo.services[i].duration} placeholder="Duration" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                        </div>
                                    {/each}
                                </div>
                            </div>

                            <div class="pt-5">
                                <button type="button" on:click={updateBusinessInfo} class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                </div>
                <!-- Right Column: Style Guides and Products -->
                <div class="space-y-6">
                    <!-- Style Guides -->
                    <div class="bg-white shadow sm:rounded-lg">
                        <div class="px-4 py-5 sm:px-6">
                            <h2 class="text-lg font-medium leading-6 text-gray-900">Style Guides</h2>
                            <p class="mt-1 text-sm text-gray-500">Pre-defined styling instructions for clients</p>
                        </div>
                        <div class="border-t border-gray-200 px-4 py-5 sm:px-6">
                            <div class="space-y-4">
                                {#each styleGuides as guide}
                                    <div class="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                                        <h3 class="text-sm font-medium text-gray-900">{guide.name}</h3>
                                        <p class="mt-1 text-sm text-gray-500">{guide.description}</p>
                                        <div class="mt-2 text-sm text-gray-700 whitespace-pre-line">{guide.steps}</div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    </div>

                    <!-- Product Recommendations -->
                    <div class="bg-white shadow sm:rounded-lg">
                        <div class="px-4 py-5 sm:px-6">
                            <h2 class="text-lg font-medium leading-6 text-gray-900">Product Recommendations</h2>
                            <p class="mt-1 text-sm text-gray-500">Curated products for your clients</p>
                        </div>
                        <div class="border-t border-gray-200 px-4 py-5 sm:px-6">
                            <div class="space-y-4">
                                {#each recommendedProducts as product}
                                    <div class="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                                        <h3 class="text-sm font-medium text-gray-900">{product.name}</h3>
                                        <p class="mt-1 text-sm text-gray-500">{product.description}</p>
                                        <a href={product.link} target="_blank" rel="noopener noreferrer" class="mt-2 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500">
                                            View Product
                                            <svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>