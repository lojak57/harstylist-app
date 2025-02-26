<script lang="ts">
    import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday, eachHourOfInterval, startOfDay, endOfDay, addDays } from 'date-fns';
    import type { Database } from '$lib/supabase';
    import { goto } from '$app/navigation';

    type Appointment = Database['public']['Tables']['appointments']['Row'] & { client: { name: string } };

    export let appointments: Appointment[] = [];
    export let currentMonth = new Date();

    let viewType: 'month' | 'week' | 'day' = 'month';
    let currentDate = new Date();

    $: monthStart = startOfMonth(currentMonth);
    $: monthEnd = endOfMonth(currentMonth);
    $: calendarStart = startOfWeek(monthStart);
    $: calendarEnd = endOfWeek(monthEnd);
    $: weekStart = startOfWeek(currentDate);
    $: weekEnd = endOfWeek(currentDate);
    $: dayStart = startOfDay(currentDate);
    $: dayEnd = endOfDay(currentDate);

    $: days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    $: weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    $: dayHours = eachHourOfInterval({ start: dayStart, end: dayEnd });

    $: appointmentsByDay = appointments.reduce((acc, appointment) => {
        const date = format(new Date(appointment.start_time), 'yyyy-MM-dd');
        if (!acc[date]) acc[date] = [];
        acc[date].push(appointment);
        return acc;
    }, {} as Record<string, Appointment[]>);

    function previousMonth() {
        currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    }

    function nextMonth() {
        currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
    }

    function previousWeek() {
        currentDate = addDays(currentDate, -7);
    }

    function nextWeek() {
        currentDate = addDays(currentDate, 7);
    }

    function previousDay() {
        currentDate = addDays(currentDate, -1);
    }

    function nextDay() {
        currentDate = addDays(currentDate, 1);
    }

    function viewAppointment(id: string) {
        goto(`/appointments/${id}`);
    }
</script>

<div class="calendar">
    <div class="calendar-header">
        <div class="view-toggles">
            <button class:active={viewType === 'month'} on:click={() => viewType = 'month'}>Month</button>
            <button class:active={viewType === 'week'} on:click={() => viewType = 'week'}>Week</button>
            <button class:active={viewType === 'day'} on:click={() => viewType = 'day'}>Day</button>
        </div>
        <div class="navigation">
            <button on:click={viewType === 'month' ? previousMonth : viewType === 'week' ? previousWeek : previousDay}>&lt;</button>
            <h2>
                {#if viewType === 'month'}
                    {format(currentMonth, 'MMMM yyyy')}
                {:else if viewType === 'week'}
                    {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                {:else}
                    {format(currentDate, 'EEEE, MMMM d, yyyy')}
                {/if}
            </h2>
            <button on:click={viewType === 'month' ? nextMonth : viewType === 'week' ? nextWeek : nextDay}>&gt;</button>
        </div>
    </div>

    {#if viewType === 'month'}
        <div class="calendar-grid">
            <div class="weekday-header">Sun</div>
            <div class="weekday-header">Mon</div>
            <div class="weekday-header">Tue</div>
            <div class="weekday-header">Wed</div>
            <div class="weekday-header">Thu</div>
            <div class="weekday-header">Fri</div>
            <div class="weekday-header">Sat</div>

            {#each days as day}
                <div class="calendar-day {!isSameMonth(day, currentMonth) ? 'other-month' : ''} {isToday(day) ? 'today' : ''}">
                    <span class="day-number">{format(day, 'd')}</span>
                    <div class="appointments">
                        {#each appointmentsByDay[format(day, 'yyyy-MM-dd')] || [] as appointment}
                            <div 
                                class="appointment"
                                on:click={() => viewAppointment(appointment.id)}
                                on:keydown={(e) => e.key === 'Enter' && viewAppointment(appointment.id)}
                                role="button"
                                tabindex="0"
                            >
                                <span class="time">{format(new Date(appointment.start_time), 'h:mm a')}</span>
                                <span class="client">{appointment.client.name}</span>
                            </div>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    {:else if viewType === 'week'}
        <div class="week-view">
            <div class="time-column">
                {#each Array(24) as _, hour}
                    <div class="time-slot">{format(new Date().setHours(hour, 0), 'h a')}</div>
                {/each}
            </div>
            <div class="week-grid">
                {#each weekDays as day}
                    <div class="week-day">
                        <div class="week-day-header {isToday(day) ? 'today' : ''}">
                            {format(day, 'EEE d')}
                        </div>
                        <div class="day-appointments">
                            {#each appointmentsByDay[format(day, 'yyyy-MM-dd')] || [] as appointment}
                                <div 
                                    class="appointment"
                                    on:click={() => viewAppointment(appointment.id)}
                                    on:keydown={(e) => e.key === 'Enter' && viewAppointment(appointment.id)}
                                    role="button"
                                    tabindex="0"
                                >
                                    <span class="time">{format(new Date(appointment.start_time), 'h:mm a')}</span>
                                    <span class="client">{appointment.client.name}</span>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {:else}
        <div class="day-view">
            <div class="time-column">
                {#each dayHours as hour}
                    <div class="time-slot">{format(hour, 'h a')}</div>
                {/each}
            </div>
            <div class="day-appointments">
                {#each appointmentsByDay[format(currentDate, 'yyyy-MM-dd')] || [] as appointment}
                    <div 
                        class="appointment"
                        on:click={() => viewAppointment(appointment.id)}
                        on:keydown={(e) => e.key === 'Enter' && viewAppointment(appointment.id)}
                        role="button"
                        tabindex="0"
                    >
                        <span class="time">{format(new Date(appointment.start_time), 'h:mm a')}</span>
                        <span class="client">{appointment.client.name}</span>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>

<style>
    .calendar {
        background: white;
        border-radius: 0.75rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        padding: 1.5rem;
    }

    .calendar-header {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .view-toggles {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
    }

    .view-toggles button {
        padding: 0.5rem 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.375rem;
        background: white;
        color: #4b5563;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .view-toggles button.active {
        background: #4f46e5;
        color: white;
        border-color: #4f46e5;
    }

    .navigation {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 0.5rem;
    }

    .navigation button {
        background: #f3f4f6;
        border: none;
        border-radius: 0.5rem;
        padding: 0.75rem 1.25rem;
        cursor: pointer;
        font-weight: 500;
        color: #4b5563;
        transition: all 0.2s;
    }

    .navigation button:hover {
        background: #e5e7eb;
    }

    .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 1px;
        background: #e5e7eb;
        border: 1px solid #e5e7eb;
    }

    .weekday-header {
        background: #f3f4f6;
        padding: 0.5rem;
        text-align: center;
        font-weight: 500;
    }

    .calendar-day {
        background: white;
        min-height: 120px;
        padding: 0.75rem;
        transition: background-color 0.2s;
    }

    .other-month {
        opacity: 0.5;
    }

    .today {
        background: #f0f9ff;
    }

    .day-number {
        font-weight: 500;
        margin-bottom: 0.5rem;
        display: block;
    }

    .appointments {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .appointment {
        background: #e0e7ff;
        border-radius: 0.375rem;
        padding: 0.375rem 0.75rem;
        font-size: 0.75rem;
        cursor: pointer;
        border: 1px solid #c7d2fe;
        transition: all 0.2s;
    }

    .appointment:hover {
        background: #c7d2fe;
    }

    .appointment .time {
        font-weight: 500;
        margin-right: 0.25rem;
    }

    .appointment .client {
        color: #4b5563;
    }

    .week-view, .day-view {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 1px;
        background: #e5e7eb;
        border: 1px solid #e5e7eb;
    }

    .time-column {
        background: #f3f4f6;
        padding: 0.5rem;
        width: 5rem;
    }

    .time-slot {
        height: 4rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        color: #4b5563;
    }

    .week-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 1px;
    }

    .week-day {
        background: white;
    }

    .week-day-header {
        padding: 0.5rem;
        text-align: center;
        font-weight: 500;
        background: #f3f4f6;
        border-bottom: 1px solid #e5e7eb;
    }

    .day-appointments {
        padding: 0.5rem;
        min-height: calc(24 * 4rem);
        background: white;
    }
</style>