<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { invalidate } from '$app/navigation';
    import { onMount } from 'svelte';
    import NavBar from '$lib/components/NavBar.svelte';
    import '../app.css';

    onMount(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            invalidate('supabase:auth');
        });

        return () => subscription.unsubscribe();
    });
</script>

<div class="min-h-screen bg-gray-100">
    <NavBar />

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <slot />
    </main>
</div>
