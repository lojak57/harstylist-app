import { parse, addDays, setHours, setMinutes, startOfDay, format } from 'date-fns';

type ParsedCommand = {
    clientName: string | null;
    serviceType: string | null;
    appointmentTime: Date | null;
    error?: string;
};

export function parseSchedulingCommand(command: string): ParsedCommand {
    const result: ParsedCommand = {
        clientName: null,
        serviceType: null,
        appointmentTime: null
    };

    try {
        // Convert to lowercase for easier matching
        command = command.toLowerCase();

        // Extract client name (assuming it comes after "schedule" and before "for")
        const nameMatch = command.match(/schedule\s+([^\s]+(?:\s+[^\s]+)?)\s+for/);
        if (nameMatch) {
            result.clientName = nameMatch[1];
        }

        // Extract service type (assuming it comes after "for a" or "for an")
        const serviceMatch = command.match(/for\s+(?:a|an)\s+([^\s]+)/);
        if (serviceMatch) {
            result.serviceType = serviceMatch[1];
        }

        // Extract day and time
        const today = new Date();
        let appointmentDate = today;

        // Check for day keywords
        if (command.includes('next')) {
            if (command.includes('monday')) appointmentDate = getNextDayOfWeek(today, 1);
            else if (command.includes('tuesday')) appointmentDate = getNextDayOfWeek(today, 2);
            else if (command.includes('wednesday')) appointmentDate = getNextDayOfWeek(today, 3);
            else if (command.includes('thursday')) appointmentDate = getNextDayOfWeek(today, 4);
            else if (command.includes('friday')) appointmentDate = getNextDayOfWeek(today, 5);
            else if (command.includes('saturday')) appointmentDate = getNextDayOfWeek(today, 6);
            else if (command.includes('sunday')) appointmentDate = getNextDayOfWeek(today, 0);
        }

        // Extract time
        const timeMatch = command.match(/(\d{1,2})(?::\d{2})?\s*(?:am|pm)?/);
        if (timeMatch) {
            let hour = parseInt(timeMatch[1]);
            const isPM = command.includes('pm');
            
            // Adjust hour for PM times
            if (isPM && hour < 12) hour += 12;
            // Adjust for 12 AM
            if (!isPM && hour === 12) hour = 0;

            appointmentDate = setHours(appointmentDate, hour);
            appointmentDate = setMinutes(appointmentDate, 0);
        }

        result.appointmentTime = appointmentDate;

        // Validate the parsed data
        if (!result.clientName) {
            result.error = 'Could not identify client name';
        } else if (!result.serviceType) {
            result.error = 'Could not identify service type';
        } else if (!result.appointmentTime) {
            result.error = 'Could not identify appointment time';
        }

        return result;
    } catch (error) {
        return {
            ...result,
            error: 'Failed to parse command'
        };
    }
}

function getNextDayOfWeek(date: Date, dayOfWeek: number): Date {
    const resultDate = new Date(date.getTime());
    const currentDay = date.getDay();
    const daysUntilNext = (dayOfWeek + 7 - currentDay) % 7;
    // If today is the target day, add 7 to get next week's occurrence
    const daysToAdd = daysUntilNext === 0 ? 7 : daysUntilNext;
    resultDate.setDate(date.getDate() + daysToAdd);
    return resultDate;
}

export function formatParsedCommand(parsed: ParsedCommand): string {
    if (parsed.error) {
        return `Error: ${parsed.error}`;
    }

    return `Schedule appointment for ${parsed.clientName} ` +
           `for a ${parsed.serviceType} on ` +
           `${format(parsed.appointmentTime!, 'EEEE, MMMM do, yyyy')} at ` +
           `${format(parsed.appointmentTime!, 'h:mm a')}`;
}