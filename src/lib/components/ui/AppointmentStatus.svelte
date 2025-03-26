<script lang="ts">
  export let status: 'booked' | 'available' | 'pending' | 'cancelled' | 'completed' = 'booked';
  export let showLabel = true;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  
  const statusLabels = {
    booked: 'Booked',
    available: 'Available',
    pending: 'Pending',
    cancelled: 'Cancelled',
    completed: 'Completed'
  };
  
  $: statusColorClasses = {
    booked: 'bg-purple-500',
    available: 'bg-emerald-500',
    pending: 'bg-amber-500',
    cancelled: 'bg-red-500',
    completed: 'bg-neutral-500'
  }[status];
  
  $: statusTextClasses = {
    booked: 'text-purple-800 bg-purple-100 dark:text-purple-200 dark:bg-purple-900/30',
    available: 'text-emerald-800 bg-emerald-100 dark:text-emerald-200 dark:bg-emerald-900/30',
    pending: 'text-amber-800 bg-amber-100 dark:text-amber-200 dark:bg-amber-900/30',
    cancelled: 'text-red-800 bg-red-100 dark:text-red-200 dark:bg-red-900/30',
    completed: 'text-neutral-800 bg-neutral-100 dark:text-neutral-200 dark:bg-neutral-800/30'
  }[status];
  
  $: sizeClasses = {
    sm: showLabel ? 'text-xs px-1.5 py-0.5' : 'w-2 h-2',
    md: showLabel ? 'text-sm px-2 py-0.5' : 'w-3 h-3',
    lg: showLabel ? 'text-base px-2.5 py-1' : 'w-4 h-4'
  }[size];
</script>

{#if showLabel}
  <span class="inline-flex items-center font-medium rounded-full {statusTextClasses} {sizeClasses}">
    <span class="{statusColorClasses} rounded-full w-2 h-2 mr-1.5"></span>
    {statusLabels[status]}
  </span>
{:else}
  <span class="inline-block rounded-full {statusColorClasses} {sizeClasses}"></span>
{/if}
