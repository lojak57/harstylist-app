<script lang="ts">
  export let variant: 'primary' | 'secondary' | 'accent' | 'text' | 'outline' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let fullWidth = false;
  export let loading = false;
  export let disabled = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let href: string | null = null;
  export let icon: string | null = null;
  export let iconPosition: 'left' | 'right' = 'left';
  
  // Compute CSS classes based on props
  $: variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800',
    accent: 'bg-accent-1 hover:bg-accent-1/90 text-white',
    text: 'bg-transparent hover:bg-neutral-100 text-primary-600',
    outline: 'bg-transparent border border-primary-600 text-primary-600 hover:bg-primary-50'
  }[variant];
  
  $: sizeClasses = {
    sm: 'text-sm px-3 py-1.5 rounded',
    md: 'text-base px-4 py-2 rounded-md',
    lg: 'text-lg px-6 py-3 rounded-lg'
  }[size];
  
  $: widthClass = fullWidth ? 'w-full' : '';
  $: disabledClass = disabled || loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer';
  
  // For rendering as <a> if href is provided
  $: isLink = !!href && !disabled && !loading;
</script>

{#if isLink}
  <a
    {href}
    class="inline-flex items-center justify-center font-medium transition-all duration-200 {variantClasses} {sizeClasses} {widthClass} {disabledClass} {$$props.class || ''}"
    on:click
    on:focus
    on:blur
    on:mouseenter
    on:mouseleave
  >
    {#if loading}
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    {:else if icon && iconPosition === 'left'}
      <span class="mr-2">
        <slot name="icon" />
      </span>
    {/if}
    
    <slot />
    
    {#if icon && iconPosition === 'right' && !loading}
      <span class="ml-2">
        <slot name="icon" />
      </span>
    {/if}
  </a>
{:else}
  <button
    {type}
    disabled={disabled || loading}
    class="inline-flex items-center justify-center font-medium transition-all duration-200 {variantClasses} {sizeClasses} {widthClass} {disabledClass} {$$props.class || ''}"
    on:click
    on:focus
    on:blur
    on:mouseenter
    on:mouseleave
  >
    {#if loading}
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    {:else if icon && iconPosition === 'left'}
      <span class="mr-2">
        <slot name="icon" />
      </span>
    {/if}
    
    <slot />
    
    {#if icon && iconPosition === 'right' && !loading}
      <span class="ml-2">
        <slot name="icon" />
      </span>
    {/if}
  </button>
{/if}
