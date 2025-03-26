<script lang="ts">
  export let steps: { label: string; description?: string; completed: boolean; current: boolean }[] = [];
  export let vertical = false;
  export let size: 'sm' | 'md' | 'lg' = 'md';

  $: sizeClasses = {
    sm: {
      container: 'space-y-2',
      step: 'h-6 w-6 text-xs',
      line: 'w-full h-0.5',
      verticalLine: 'w-0.5 h-full',
      label: 'text-xs',
      description: 'text-xs'
    },
    md: {
      container: 'space-y-3',
      step: 'h-8 w-8 text-sm',
      line: 'w-full h-0.5',
      verticalLine: 'w-0.5 h-full',
      label: 'text-sm',
      description: 'text-xs'
    },
    lg: {
      container: 'space-y-4',
      step: 'h-10 w-10 text-base',
      line: 'w-full h-1',
      verticalLine: 'w-1 h-full',
      label: 'text-base',
      description: 'text-sm'
    }
  }[size];
</script>

{#if vertical}
  <div class="flex flex-col {sizeClasses.container}">
    {#each steps as step, i}
      <div class="flex items-start">
        <div class="flex flex-col items-center">
          <div 
            class="{sizeClasses.step} flex items-center justify-center rounded-full
            {step.completed ? 'bg-primary-600 text-white' : step.current ? 'border-2 border-primary-600 text-primary-600' : 'border border-neutral-300 text-neutral-400'}"
          >
            {#if step.completed}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
              </svg>
            {:else}
              {i + 1}
            {/if}
          </div>
          
          {#if i < steps.length - 1}
            <div 
              class="{sizeClasses.verticalLine} mt-2 mb-2
              {steps[i].completed ? 'bg-primary-600' : 'bg-neutral-200'}"
            ></div>
          {/if}
        </div>
        
        <div class="ml-4 mt-1">
          <p class="{sizeClasses.label} font-medium 
            {step.current ? 'text-primary-600' : step.completed ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-500'}"
          >
            {step.label}
          </p>
          {#if step.description}
            <p class="{sizeClasses.description} text-neutral-500 dark:text-neutral-400 mt-1">
              {step.description}
            </p>
          {/if}
        </div>
      </div>
    {/each}
  </div>
{:else}
  <div class="flex items-center w-full">
    {#each steps as step, i}
      <div class="flex items-center {i === 0 ? 'pr-2' : i === steps.length - 1 ? 'pl-2' : 'px-2'} relative">
        <!-- Step indicator -->
        <div 
          class="{sizeClasses.step} flex items-center justify-center rounded-full z-10
          {step.completed ? 'bg-primary-600 text-white' : step.current ? 'border-2 border-primary-600 text-primary-600' : 'border border-neutral-300 text-neutral-400'}"
        >
          {#if step.completed}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
              <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
            </svg>
          {:else}
            {i + 1}
          {/if}
        </div>
        
        <!-- Label and description -->
        <div class="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 w-max text-center">
          <p class="{sizeClasses.label} font-medium whitespace-nowrap
            {step.current ? 'text-primary-600' : step.completed ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-500'}"
          >
            {step.label}
          </p>
          {#if step.description}
            <p class="{sizeClasses.description} text-neutral-500 dark:text-neutral-400 mt-1 whitespace-nowrap">
              {step.description}
            </p>
          {/if}
        </div>
      </div>
      
      <!-- Connecting line -->
      {#if i < steps.length - 1}
        <div class="flex-1 {sizeClasses.line}
          {steps[i].completed ? 'bg-primary-600' : 'bg-neutral-200'}"
        ></div>
      {/if}
    {/each}
  </div>
{/if}
