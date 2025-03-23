<script lang="ts">
    // This layout doesn't use RouteGuard, allowing access without authentication
    import "../../app.css";
</script>

<div class="min-h-screen bg-gray-100">
    <main class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <slot />
    </main>
</div>
