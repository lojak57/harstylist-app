<script lang="ts">
  export let type: 'success' | 'error' | 'warning' | 'info' = 'info';
  export let title: string | null = null;
  export let dismissable = true;
  export let autoDismiss = false;
  export let autoDismissTimeout = 5000; // 5 seconds
  
  import { onMount, createEventDispatcher, onDestroy } from 'svelte';
  
  const dispatch = createEventDispatcher();
  let visible = true;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  $: typeClasses = {
    success: 'bg-success/10 border-l-4 border-success',
    error: 'bg-error/10 border-l-4 border-error',
    warning: 'bg-warning/10 border-l-4 border-warning',
    info: 'bg-info/10 border-l-4 border-info'
  }[type];
  
  $: iconColor = {
    success: 'text-success',
    error: 'text-error',
    warning: 'text-warning',
    info: 'text-info'
  }[type];
  
  $: icon = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
              <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
            </svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
            <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clip-rule="evenodd" />
           </svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
              <path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" />
             </svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
          <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" />
         </svg>`
  }[type];
  
  function dismiss() {
    visible = false;
    dispatch('dismiss');
    
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  }
  
  onMount(() => {
    if (autoDismiss && visible) {
      timeout = setTimeout(() => {
        dismiss();
      }, autoDismissTimeout);
    }
  });
  
  onDestroy(() => {
    if (timeout) {
      clearTimeout(timeout);
    }
  });
</script>

{#if visible}
  <div class="{typeClasses} p-4 rounded-md flex items-start space-x-3 shadow-sm {$$props.class || ''}" role="alert">
    <div class="{iconColor} flex-shrink-0">
      {@html icon}
    </div>
    
    <div class="flex-1">
      {#if title}
        <h3 class="font-medium text-neutral-900 dark:text-neutral-100">{title}</h3>
      {/if}
      <div class="text-neutral-700 dark:text-neutral-300 text-sm">
        <slot />
      </div>
    </div>
    
    {#if dismissable}
      <button 
        class="flex-shrink-0 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        on:click={dismiss}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    {/if}
  </div>
{/if}
