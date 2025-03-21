import { parse, addDays, setHours, setMinutes, format, parseISO } from 'date-fns';

type ParsedCommand = {
    clientName: string | null;
    serviceType: string | null;
    appointmentTime: Date | null;
    error?: string;
};

export function parseSchedulingCommand(command: string): ParsedCommand {
    const result: ParsedCommand = { clientName: null, serviceType: null, appointmentTime: null };
    
    console.log('Processing command:', command);
    
    if (!command) {
        result.error = 'No command provided';
        return result;
    }
    
    // Extract client name from quotes or after "schedule"
    let clientName = null;
    const quoteRegex = /["']([^"']+)["']/;
    const quoteMatch = command.match(quoteRegex);
    
    if (quoteMatch && quoteMatch[1]) {
        clientName = quoteMatch[1].trim();
    } else {
        // Try to extract client name after "schedule" and before "for"
        const scheduleRegex = /\bschedule\s+([^"'\s][^\s]*(?:\s+[^\s]+)*?)\s+for\b/i;
        const scheduleMatch = command.match(scheduleRegex);
        
        if (scheduleMatch && scheduleMatch[1]) {
            clientName = scheduleMatch[1].trim();
        }
    }
    
    if (clientName) {
        result.clientName = clientName;
        console.log('Extracted client name:', result.clientName);
    }
    
    // Extract service type between "for" and date/time indicators
    const serviceRegex = /\bfor\s+([^\s][^\s]*(?:\s+[^\s]+)*?)\s+(?:on|at|tomorrow|next|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
    const serviceMatch = command.match(serviceRegex);
    
    if (serviceMatch && serviceMatch[1]) {
        result.serviceType = serviceMatch[1].trim();
        console.log('Extracted service type:', result.serviceType);
    } else {
        // Try alternative pattern: after "for" and before date/time indicators or end of string
        const altServiceRegex = /\bfor\s+([^\s][^\s]*(?:\s+[^\s]+)*?)(?:\s+(?:on|at|tomorrow|next|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}[-/]\d{1,2})\b|$)/i;
        const altServiceMatch = command.match(altServiceRegex);
        
        if (altServiceMatch && altServiceMatch[1]) {
            result.serviceType = altServiceMatch[1].trim();
            console.log('Extracted service type:', result.serviceType);
        }
    }
    
    // Clean up service type by removing leading articles if present
    if (result.serviceType) {
        result.serviceType = result.serviceType.replace(/^(a|an)\s+/i, '').trim();
        console.log('Cleaned service type:', result.serviceType);
    }

    // Parse date from the command
    const dateRegex = /\b(?:on|at)\s+([a-zA-Z]+day|tomorrow|\d{1,2}[-/]\d{1,2}(?:[-/]\d{2,4})?)\b|\btomorrow\b/i;
    const dateMatch = command.match(dateRegex);
    let hasSetDate = false;
    let hasSetTime = false;
    
    // Initialize appointmentDate to current date as fallback
    let appointmentDate = new Date();
    // Ensure we're working with a fresh date object that's definitely valid
    appointmentDate = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
    
    // Check if command contains tomorrow anywhere
    if (command.toLowerCase().includes('tomorrow')) {
        appointmentDate = addDays(appointmentDate, 1);
        hasSetDate = true;
        console.log('Parsed date as tomorrow:', appointmentDate);
    } 
    // Check for days of week anywhere in the command
    else if (/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(command)) {
        const dayMatch = command.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
        if (dayMatch) {
            const dayStr = dayMatch[1].toLowerCase();
            const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayIndex = daysOfWeek.indexOf(dayStr);
            
            if (dayIndex !== -1) {
                appointmentDate = getNextDayOfWeek(appointmentDate, dayIndex);
                hasSetDate = true;
                console.log('Parsed date as next', dayStr, ':', appointmentDate);
            }
        }
    }
    // If we haven't set a date yet, try the dateMatch
    else if (dateMatch && dateMatch[1]) {
        const dateStr = dateMatch[1].toLowerCase();
        
        // Handle special date keywords
        if (dateStr === 'tomorrow') {
            appointmentDate = addDays(appointmentDate, 1);
            hasSetDate = true;
            console.log('Parsed date as tomorrow:', appointmentDate);
        } 
        // Handle day of week (e.g., "monday", "tuesday")
        else if (dateStr.endsWith('day')) {
            const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayIndex = daysOfWeek.indexOf(dateStr);
            
            if (dayIndex !== -1) {
                appointmentDate = getNextDayOfWeek(appointmentDate, dayIndex);
                hasSetDate = true;
                console.log('Parsed date as next', dateStr, ':', appointmentDate);
            }
        } 
        // Handle MM/DD or MM-DD or MM/DD/YYYY format
        else if (/\d{1,2}[-/]\d{1,2}(?:[-/]\d{2,4})?/.test(dateStr)) {
            try {
                // Replace hyphens with slashes for consistent parsing
                const normalizedDateStr = dateStr.replace(/-/g, '/');
                
                // Handle both MM/DD and MM/DD/YYYY formats
                let parsedDate;
                if (normalizedDateStr.split('/').length === 2) {
                    // For MM/DD format, add current year
                    const [month, day] = normalizedDateStr.split('/').map(Number);
                    const currentYear = new Date().getFullYear();
                    parsedDate = new Date(currentYear, month - 1, day);
                } else {
                    // For MM/DD/YYYY format
                    parsedDate = new Date(normalizedDateStr);
                }
                
                // Validate the parsed date
                if (!isNaN(parsedDate.getTime())) {
                    appointmentDate = parsedDate;
                    hasSetDate = true;
                    console.log('Parsed date from', dateStr, 'as', appointmentDate);
                } else {
                    console.error('Failed to parse date:', dateStr);
                }
            } catch (e) {
                console.error('Error parsing date:', e);
            }
        }
    }

    // Parse time from the command
    const timeRegex = /\b(?:at|and)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b|\b(noon|midnight)\b/i;
    const timeMatch = command.match(timeRegex);
    
    if (timeMatch) {
        // Handle special time words
        if (timeMatch[4]) {
            const specialTime = timeMatch[4].toLowerCase();
            if (specialTime === 'noon') {
                appointmentDate.setHours(12, 0, 0, 0);
                hasSetTime = true;
                console.log('Parsed time as noon - Result:', appointmentDate);
            } else if (specialTime === 'midnight') {
                appointmentDate.setHours(0, 0, 0, 0);
                hasSetTime = true;
                console.log('Parsed time as midnight - Result:', appointmentDate);
            }
        } else if (timeMatch[1]) {
            // Handle regular time format
            const hours = parseInt(timeMatch[1]);
            const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
            const period = timeMatch[3]?.toLowerCase();
            
            let adjustedHours = hours;
            
            // Adjust hours for AM/PM
            if (period === 'pm' && hours < 12) {
                adjustedHours = hours + 12;
            } else if (period === 'am' && hours === 12) {
                adjustedHours = 0;
            } else if (!period) {
                // If no AM/PM specified, use business hour assumptions
                // For 1-6, assume PM (13-18)
                if (hours >= 1 && hours <= 6) {
                    adjustedHours = hours + 12;
                }
                // For 7-11, also assume PM during business hours
                else if (hours >= 7 && hours <= 11) {
                    adjustedHours = hours + 12;
                }
                // For 12, keep as noon
                // For 0 or 24, set to midnight
                else if (hours === 0 || hours === 24) {
                    adjustedHours = 0;
                }
            }
            
            // Set the time on the appointment date
            appointmentDate.setHours(adjustedHours, minutes, 0, 0);
            hasSetTime = true;
            
            console.log(`Parsed time as ${adjustedHours} : ${minutes} - Result:`, appointmentDate);
        }
    }

    if (hasSetDate || hasSetTime) {
        // Final validation to ensure we have a valid date
        if (appointmentDate instanceof Date && !isNaN(appointmentDate.getTime())) {
            result.appointmentTime = appointmentDate;
            console.log('Parsed appointment time:', result.appointmentTime);
        } else {
            console.error('Invalid date object created:', appointmentDate);
            result.error = 'Could not create a valid appointment time';
        }
    }

    // Validate the parsed data
    if (!result.clientName) {
        result.error = 'Could not identify client name';
    } else if (!result.serviceType) {
        result.error = 'Could not identify service type';
    } else if (!result.appointmentTime) {
        result.error = 'Could not identify appointment time';
    } else if (!hasSetTime) {
        result.error = 'Could not identify a specific time';
    }
    
    return result;
}

export function getNextDayOfWeek(date: Date, dayOfWeek: number, forceNext: boolean = false): Date {
    const resultDate = new Date(date.getTime());
    resultDate.setDate(date.getDate() + (7 + dayOfWeek - date.getDay()) % 7);
    
    // If the calculated date is today and forceNext is true, add 7 days
    if (forceNext && resultDate.getDate() === date.getDate()) {
        resultDate.setDate(resultDate.getDate() + 7);
    }
    
    return resultDate;
}

export function formatParsedCommand(parsed: ParsedCommand): string {
    if (parsed.error) return parsed.error;
    
    let formattedTime = '';
    if (parsed.appointmentTime) {
        formattedTime = format(parsed.appointmentTime, 'EEEE, MMMM d, yyyy \\at h:mm a');
    }
    
    return `Scheduling ${parsed.clientName} for ${parsed.serviceType} on ${formattedTime}`;
}