<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    export let businessHours = [
        { day: 'Monday', hours: '9:00 AM - 6:00 PM', isOpen: true },
        { day: 'Tuesday', hours: '9:00 AM - 6:00 PM', isOpen: true },
        { day: 'Wednesday', hours: '9:00 AM - 6:00 PM', isOpen: true },
        { day: 'Thursday', hours: '9:00 AM - 6:00 PM', isOpen: true },
        { day: 'Friday', hours: '9:00 AM - 6:00 PM', isOpen: true },
        { day: 'Saturday', hours: '9:00 AM - 4:00 PM', isOpen: true },
        { day: 'Sunday', hours: 'Closed', isOpen: false }
    ];
    
    const dispatch = createEventDispatcher();
    
    // Time options for the dropdowns
    const startTimeOptions = [
        '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', 
        '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
        '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
        '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM',
        '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM'
    ];
    
    const endTimeOptions = [
        '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', 
        '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM',
        '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM',
        '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM',
        '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM'
    ];
    
    // Parse hours string to get start and end times
    function parseHours(hoursString) {
        if (hoursString === 'Closed') {
            return { start: '', end: '' };
        }
        
        const parts = hoursString.split(' - ');
        return {
            start: parts[0],
            end: parts.length > 1 ? parts[1] : ''
        };
    }
    
    // Update hours when dropdown selection changes
    function updateHours(index, isStart, value) {
        const dayData = businessHours[index];
        const { start, end } = parseHours(dayData.hours);
        
        if (isStart) {
            // If setting start time, ensure end time is later
            const newStart = value;
            const newEnd = end;
            
            // If end time is earlier than new start time, adjust end time
            const startIndex = startTimeOptions.indexOf(newStart);
            const endIndex = endTimeOptions.indexOf(newEnd);
            
            if (endIndex <= startIndex && newEnd !== '') {
                const newEndIndex = Math.min(startIndex + 2, endTimeOptions.length - 1);
                businessHours[index].hours = `${newStart} - ${endTimeOptions[newEndIndex]}`;
            } else {
                businessHours[index].hours = newEnd ? `${newStart} - ${newEnd}` : newStart;
            }
        } else {
            // Setting end time
            businessHours[index].hours = `${start} - ${value}`;
        }
        
        businessHours = [...businessHours];
        dispatch('change', { businessHours });
    }
    
    // Toggle day open/closed
    function toggleDay(index) {
        const dayData = businessHours[index];
        dayData.isOpen = !dayData.isOpen;
        
        if (dayData.isOpen) {
            dayData.hours = '9:00 AM - 6:00 PM';
        } else {
            dayData.hours = 'Closed';
        }
        
        businessHours = [...businessHours];
        dispatch('change', { businessHours });
    }
</script>

<div class="space-y-4">
    <h3 class="text-sm font-medium text-gray-700">Business Hours</h3>
    <div class="mt-2 space-y-3">
        {#each businessHours as day, i}
            <div class="flex items-center space-x-4">
                <div class="w-24">
                    <span class="text-sm font-medium text-gray-700">{day.day}</span>
                </div>
                
                <div class="flex items-center">
                    <label class="inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            class="sr-only peer" 
                            checked={day.isOpen} 
                            on:change={() => toggleDay(i)}
                        >
                        <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        <span class="ml-2 text-sm font-medium text-gray-500">
                            {day.isOpen ? 'Open' : 'Closed'}
                        </span>
                    </label>
                </div>
                
                {#if day.isOpen}
                    <div class="flex items-center space-x-2 flex-1">
                        <select 
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={parseHours(day.hours).start}
                            on:change={(e) => updateHours(i, true, e.target.value)}
                        >
                            {#each startTimeOptions as time}
                                <option value={time}>{time}</option>
                            {/each}
                        </select>
                        
                        <span class="text-gray-500">to</span>
                        
                        <select 
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={parseHours(day.hours).end}
                            on:change={(e) => updateHours(i, false, e.target.value)}
                        >
                            {#each endTimeOptions as time}
                                <option value={time}>{time}</option>
                            {/each}
                        </select>
                    </div>
                {:else}
                    <div class="flex-1 text-sm text-gray-500 italic">
                        Closed all day
                    </div>
                {/if}
            </div>
        {/each}
    </div>
</div>