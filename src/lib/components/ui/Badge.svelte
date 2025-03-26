<script lang="ts">
  export let variant: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let rounded = false;
  
  $: variantClasses = {
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300',
    success: 'bg-success/10 text-success-800 dark:bg-success/20 dark:text-success-300',
    warning: 'bg-warning/10 text-warning-800 dark:bg-warning/20 dark:text-warning-300',
    error: 'bg-error/10 text-error-800 dark:bg-error/20 dark:text-error-300',
    info: 'bg-info/10 text-info-800 dark:bg-info/20 dark:text-info-300',
    neutral: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'
  }[variant];
  
  $: sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1'
  }[size];
  
  $: roundedClass = rounded ? 'rounded-full' : 'rounded';
</script>

<span class="inline-flex items-center font-medium {variantClasses} {sizeClasses} {roundedClass} {$$props.class || ''}">
  <slot />
</span>
