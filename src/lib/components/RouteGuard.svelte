<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';

    onMount(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user && $page.url.pathname !== '/') {
            goto('/');
        }
    });
</script>

<slot />