<script lang="ts">
    export let value = 'name';

    const options = [
        { value: 'name', label: 'Name (A-Z)' },
        { value: 'recent', label: 'Recent Visits' },
        { value: 'upcoming', label: 'Upcoming Appointments' }
    ];
</script>

<select
    bind:value
    class="block rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
>
    {#each options as option}
        <option value={option.value}>{option.label}</option>
    {/each}
</select>