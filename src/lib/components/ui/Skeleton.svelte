<script lang="ts">
  export let variant: 'text' | 'circle' | 'rectangle' | 'card' | 'avatar' = 'text';
  export let width: string = '100%';
  export let height: string = 'auto';
  export let animated = true;

  $: variantClasses = {
    text: 'h-4 rounded',
    circle: 'rounded-full',
    rectangle: 'rounded-md',
    card: 'rounded-lg',
    avatar: 'rounded-full'
  }[variant];

  $: animationClass = animated ? 'animate-pulse' : '';
</script>

<div 
  class="bg-neutral-200 dark:bg-neutral-700 {variantClasses} {animationClass} {$$props.class || ''}"
  style="width: {width}; height: {height};"
></div>
