<script lang="ts">
  export let variant: 'default' | 'outlined' | 'elevated' = 'default';
  export let interactive = false;
  export let padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  
  $: variantClasses = {
    default: 'bg-white dark:bg-neutral-800 shadow',
    outlined: 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700',
    elevated: 'bg-white dark:bg-neutral-800 shadow-lg'
  }[variant];
  
  $: paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8'
  }[padding];
  
  $: interactiveClasses = interactive ? 
    'transition-all duration-200 hover:shadow-md hover:-translate-y-1 cursor-pointer' : '';
</script>

<div 
  class="rounded-lg {variantClasses} {paddingClasses} {interactiveClasses} {$$props.class || ''}"
  on:click
  on:mouseenter
  on:mouseleave
>
  <slot />
</div>
