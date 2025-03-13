<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    
    export let businessHours: BusinessHour[] = [
        { day: 'Monday', hours: '9:00 AM - 6:00 PM', isOpen: true },
        { day: 'Tuesday', hours: '9:00 AM - 6:00 PM', isOpen: true },
        { day: 'Wednesday', hours: '9:00 AM - 6:00 PM', isOpen: true },
        { day: 'Thursday', hours: '9:00 AM - 6:00 PM', isOpen: true },
        { day: 'Friday', hours: '9:00 AM - 6:00 PM', isOpen: true },
        { day: 'Saturday', hours: '9:00 AM - 4:00 PM', isOpen: true },
        { day: 'Sunday', hours: 'Closed', isOpen: false }
    ];
    
    const dispatch = createEventDispatcher();
    let initialized = false;
    
    // Time options for the dropdowns
    const startTimeOptions: string[] = [
        '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', 
        '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
        '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
        '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM',
        '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM'
    ];
    
    const endTimeOptions: string[] = [
        '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', 
        '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM',
        '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM',
        '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM',
        '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM'
    ];
    
    // Define template types
    type BusinessHour = {
        day: string;
        hours: string;
        isOpen: boolean;
    };
    
    type HoursTemplate = {
        name: string;
        hours: BusinessHour[];
    };
    
    // Templates for quick selection
    const templates: HoursTemplate[] = [
        { name: 'Standard Week', hours: [
            { day: 'Monday', hours: '9:00 AM - 6:00 PM', isOpen: true },
            { day: 'Tuesday', hours: '9:00 AM - 6:00 PM', isOpen: true },
            { day: 'Wednesday', hours: '9:00 AM - 6:00 PM', isOpen: true },
            { day: 'Thursday', hours: '9:00 AM - 6:00 PM', isOpen: true },
            { day: 'Friday', hours: '9:00 AM - 6:00 PM', isOpen: true },
            { day: 'Saturday', hours: '9:00 AM - 4:00 PM', isOpen: true },
            { day: 'Sunday', hours: 'Closed', isOpen: false }
        ]},
        { name: 'Weekdays Only', hours: [
            { day: 'Monday', hours: '8:00 AM - 5:00 PM', isOpen: true },
            { day: 'Tuesday', hours: '8:00 AM - 5:00 PM', isOpen: true },
            { day: 'Wednesday', hours: '8:00 AM - 5:00 PM', isOpen: true },
            { day: 'Thursday', hours: '8:00 AM - 5:00 PM', isOpen: true },
            { day: 'Friday', hours: '8:00 AM - 5:00 PM', isOpen: true },
            { day: 'Saturday', hours: 'Closed', isOpen: false },
            { day: 'Sunday', hours: 'Closed', isOpen: false }
        ]},
        { name: 'Late Hours', hours: [
            { day: 'Monday', hours: '11:00 AM - 8:00 PM', isOpen: true },
            { day: 'Tuesday', hours: '11:00 AM - 8:00 PM', isOpen: true },
            { day: 'Wednesday', hours: '11:00 AM - 8:00 PM', isOpen: true },
            { day: 'Thursday', hours: '11:00 AM - 8:00 PM', isOpen: true },
            { day: 'Friday', hours: '11:00 AM - 8:00 PM', isOpen: true },
            { day: 'Saturday', hours: '11:00 AM - 6:00 PM', isOpen: true },
            { day: 'Sunday', hours: 'Closed', isOpen: false }
        ]},
    ];
    
    // Parse hours string to get start and end times
    function parseHours(hoursString: string): { start: string, end: string } {
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
    function updateHours(index: number, isStart: boolean, value: string): void {
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
        dispatchChange();
    }
    
    // Toggle day open/closed
    function toggleDay(index: number): void {
        const dayData = businessHours[index];
        dayData.isOpen = !dayData.isOpen;
        
        if (dayData.isOpen) {
            dayData.hours = '9:00 AM - 6:00 PM';
        } else {
            dayData.hours = 'Closed';
        }
        
        businessHours = [...businessHours];
        dispatchChange();
    }
    
    // Apply a template to all business hours
    function applyTemplate(template: HoursTemplate): void {
        businessHours = [...template.hours];
        dispatchChange();
    }
    
    // Copy hours from one day to others
    function copyHoursToAllWeekdays(fromIndex: number): void {
        const sourceDay = businessHours[fromIndex];
        for (let i = 0; i < 5; i++) { // Monday to Friday (indices 0-4)
            if (i !== fromIndex) {
                businessHours[i].hours = sourceDay.hours;
                businessHours[i].isOpen = sourceDay.isOpen;
            }
        }
        businessHours = [...businessHours];
        dispatchChange();
    }
    
    // Copy hours to weekend days
    function copyHoursToWeekend(fromIndex: number): void {
        const sourceDay = businessHours[fromIndex];
        for (let i = 5; i < 7; i++) { // Saturday and Sunday (indices 5-6)
            businessHours[i].hours = sourceDay.hours;
            businessHours[i].isOpen = sourceDay.isOpen;
        }
        businessHours = [...businessHours];
        dispatchChange();
    }
    
    function dispatchChange(): void {
        if (initialized) {
            dispatch('change', { businessHours });
        }
    }
    
    onMount(() => {
        initialized = true;
    });
</script>

<div class="space-y-4 bg-white p-5 rounded-lg shadow-sm border border-gray-100">
    <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-800">Business Hours</h3>
        <div class="relative group">
            <button 
                class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                type="button"
                id="hours-template-menu-button"
                aria-expanded="true"
                aria-haspopup="true"
            >
                Quick Templates
                <svg class="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
            </button>
            
            <div 
                class="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 hidden group-hover:block"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="hours-template-menu-button"
                tabindex="-1"
            >
                <div class="py-1" role="none">
                    {#each templates as template}
                        <button 
                            on:click={() => applyTemplate(template)}
                            class="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-900"
                            role="menuitem"
                            tabindex="-1"
                            transition:fade={{ duration: 150 }}
                        >
                            {template.name}
                        </button>
                    {/each}
                </div>
            </div>
        </div>
    </div>

    <div class="bg-indigo-50 p-3 rounded-md">
        <p class="text-sm text-indigo-800">👋 Tip: Set your business hours to help clients know when they can book appointments with you</p>
    </div>

    <div class="mt-4 space-y-3 bg-gray-50 p-4 rounded-md border border-gray-100">
        {#each businessHours as day, i}
            <div class="bg-white p-3 rounded-md shadow-sm border border-gray-100 hover:border-indigo-200" transition:fly={{ y: 5, duration: 200, delay: i * 50 }}>
                <div class="flex items-center space-x-4">
                    <div class="w-24">
                        <span class="text-sm font-medium {day.isOpen ? 'text-gray-800' : 'text-gray-500'}">{day.day}</span>
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
                            <span class="ml-2 text-sm font-medium {day.isOpen ? 'text-indigo-600' : 'text-gray-500'}">
                                {day.isOpen ? 'Open' : 'Closed'}
                            </span>
                        </label>
                    </div>
                    
                    {#if day.isOpen}
                        <div class="flex items-center space-x-2 flex-1">
                            <select 
                                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                value={parseHours(day.hours).start}
                                on:change={(e) => {
                                    const target = e.target as HTMLSelectElement;
                                    updateHours(i, true, target.value);
                                }}
                                aria-label="Opening time"
                            >
                                {#each startTimeOptions as time}
                                    <option value={time}>{time}</option>
                                {/each}
                            </select>
                            
                            <span class="text-gray-500">to</span>
                            
                            <select 
                                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                value={parseHours(day.hours).end}
                                on:change={(e) => {
                                    const target = e.target as HTMLSelectElement;
                                    updateHours(i, false, target.value);
                                }}
                                aria-label="Closing time"
                            >
                                {#each endTimeOptions as time}
                                    <option value={time}>{time}</option>
                                {/each}
                            </select>
                            
                            <div class="ml-2 flex space-x-1">
                                {#if i < 5} <!-- If weekday -->
                                    <button
                                        on:click={() => copyHoursToAllWeekdays(i)}
                                        class="text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 p-1 rounded"
                                        title="Copy to all weekdays"
                                        aria-label="Copy to all weekdays"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                                            <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                                        </svg>
                                    </button>
                                {/if}
                                <button
                                    on:click={() => copyHoursToWeekend(i)}
                                    class="text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 p-1 rounded"
                                    title="Copy to weekend"
                                    aria-label="Copy to weekend"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                        <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    {:else}
                        <div class="flex-1 text-sm text-gray-500 italic">
                            Closed all day
                        </div>
                    {/if}
                </div>
            </div>
        {/each}
    </div>
    
    <div class="flex justify-end">
        <span class="text-sm text-gray-600 italic">Your changes are saved automatically</span>
    </div>
</div>