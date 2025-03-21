/**
 * Time utilities for consistent handling of dates and times throughout the application
 * Using Luxon for better timezone handling
 */
import { DateTime } from 'luxon';

// Salon's timezone - should be configured based on the business location
const SALON_TIMEZONE = 'America/Denver'; // This matches the user's current timezone but should be adjusted as needed

/**
 * Creates a standardized date object from time components using Luxon
 * @param date Date string in YYYY-MM-DD format
 * @param time Time string in HH:MM format 
 * @returns JavaScript Date object in salon's timezone
 */
export function createLocalDate(date: string, time: string): Date {
    try {
        // Create a DateTime object in the salon's timezone
        const dt = DateTime.fromFormat(`${date} ${time}`, 'yyyy-MM-dd HH:mm', { zone: SALON_TIMEZONE });
        console.log(`[Luxon] Created date in salon timezone: ${dt.toISO()}`);
        
        // Convert to JavaScript Date (will be in local system timezone)
        return dt.toJSDate();
    } catch (error) {
        console.error('Error creating local date with Luxon:', error);
        // Fallback to old method
        return new Date(`${date}T${time}:00`);
    }
}

/**
 * Enhanced debug function for date objects to help track timezone issues
 */
export function debugDate(date: Date, label: string) {
    // Create a Luxon DateTime from the Date
    const dt = DateTime.fromJSDate(date);
    const dtInSalon = dt.setZone(SALON_TIMEZONE);
    
    console.log(`[DEBUG] ${label}:`);
    console.log(`  → Local Date: ${date.toLocaleString()}`);
    console.log(`  → Luxon in System TZ: ${dt.toString()}`);
    console.log(`  → Luxon in Salon TZ: ${dtInSalon.toString()}`);
    console.log(`  → ISO String: ${date.toISOString()}`);
    console.log(`  → Salon Time: ${dtInSalon.toLocaleString(DateTime.DATETIME_FULL)}`);
}

/**
 * Parse a database timestamp into a DateTime object in the salon's timezone
 * This is the preferred method for handling all dates in the application
 * @param dateStr Date string from database
 * @returns Luxon DateTime object in salon timezone
 */
export function parseDateToLuxon(dateStr: string): DateTime {
    if (!dateStr) {
        console.error('Attempted to parse empty date string');
        return DateTime.now().setZone(SALON_TIMEZONE);
    }
    
    try {
        // Assume the incoming string is in ISO format (from database)
        // Parse it as UTC first, then convert to the salon timezone
        const dt = DateTime.fromISO(dateStr, { zone: 'utc' }).setZone(SALON_TIMEZONE);
        console.log(`[Luxon] Parsed ${dateStr} → ${dt.toLocaleString(DateTime.DATETIME_FULL)} (${SALON_TIMEZONE})`);
        return dt;
    } catch (error) {
        console.error('Error parsing date with Luxon:', error);
        return DateTime.now().setZone(SALON_TIMEZONE);
    }
}

/**
 * NEW UNIFIED DATE PARSING FUNCTION
 * This is now the source of truth for all date parsing in the application
 * @param dateStr Date string from database or form input
 * @returns Date object
 */
export function parseDbDate(dateStr: string): Date {
    if (!dateStr) {
        console.error('Attempted to parse empty date string');
        return new Date(); // Return current date as fallback
    }
    
    // Use Luxon for parsing to ensure consistent timezone handling
    return parseDateToLuxon(dateStr).toJSDate();
}

/**
 * Consistent conversion from database storage format (ISO string) to local Date
 * This is the definitive method to use when retrieving dates from the database
 */
export function storageToLocalDate(isoString: string): Date {
    // Now just calls our unified parser for consistency
    console.log('Using storageToLocalDate which now calls parseDbDate under the hood');
    return parseDbDate(isoString);
}

/**
 * Convert a local Date object to database storage format (ISO string)
 * This is the definitive method to use when sending dates to the database
 */
export function localToStorageFormat(localDate: Date): string {
    if (!localDate || !(localDate instanceof Date) || isNaN(localDate.getTime())) {
        console.error('Invalid date provided to localToStorageFormat');
        return new Date().toISOString(); // Return current date as fallback
    }
    
    // Convert to Luxon DateTime in salon timezone, then to UTC ISO string for storage
    const dt = DateTime.fromJSDate(localDate).setZone(SALON_TIMEZONE);
    const utcIso = dt.toUTC().toISO();
    
    console.log(`[Luxon] Converting local date to storage: ${localDate.toLocaleString()} → ${utcIso}`);
    return utcIso;
}

/**
 * Format a date for display in the salon's timezone
 * @param date Date object or ISO string
 * @param formatStr Luxon format string (default: 'h:mm a')
 * @returns Formatted date string
 */
export function formatSalonTime(date: Date | string, formatStr: string = 'h:mm a'): string {
    let dt: DateTime;
    
    if (typeof date === 'string') {
        dt = parseDateToLuxon(date);
    } else {
        dt = DateTime.fromJSDate(date).setZone(SALON_TIMEZONE);
    }
    
    return dt.toFormat(formatStr);
}

/**
 * Formats an hour in 24-hour format to a readable 12-hour format with AM/PM
 * @param hour Hour in 24-hour format (0-23) 
 * @returns Formatted hour string (e.g., "12 PM")
 */
export function formatHour(hour: number): string {
    const h = hour % 12 || 12; // Convert to 12-hour format (0->12)
    const period = hour >= 12 ? 'PM' : 'AM';
    return `${h} ${period}`;
}

/**
 * Extracts hour from a date
 * @param date JavaScript Date object
 * @returns Hour in 24h format (0-23)
 */
export function getHour(date: Date): number {
    return DateTime.fromJSDate(date).setZone(SALON_TIMEZONE).hour;
}

/**
 * Extracts minutes from a date
 * @param date JavaScript Date object
 * @returns Minutes (0-59)
 */
export function getMinutes(date: Date): number {
    return DateTime.fromJSDate(date).setZone(SALON_TIMEZONE).minute;
}

/**
 * Gets the day index for display in calendar
 * @param date JavaScript Date object
 * @returns Day index (0-6) where 0 = Monday, 6 = Sunday
 */
export function getCalendarDayIndex(date: Date): number {
    // Luxon: 1 = Monday, 7 = Sunday
    // We want: 0 = Monday, 6 = Sunday
    const weekday = DateTime.fromJSDate(date).setZone(SALON_TIMEZONE).weekday;
    return weekday - 1;
}

/**
 * Calculates minutes from business start time
 * @param date JavaScript Date object
 * @param businessStartHour Business start hour (0-23)
 * @returns Minutes from business start
 */
export function getMinutesFromBusinessStart(date: Date, businessStartHour: number): number {
    const dt = DateTime.fromJSDate(date).setZone(SALON_TIMEZONE);
    return ((dt.hour - businessStartHour) * 60) + dt.minute;
}

/**
 * Calculates duration between two dates in minutes
 * @param startDate Start date
 * @param endDate End date
 * @returns Duration in minutes
 */
export function getDurationMinutes(startDate: Date, endDate: Date): number {
    const start = DateTime.fromJSDate(startDate).setZone(SALON_TIMEZONE);
    const end = DateTime.fromJSDate(endDate).setZone(SALON_TIMEZONE);
    
    // Calculate duration with Luxon (in milliseconds) and convert to minutes
    const durationMs = end.diff(start).milliseconds;
    const durationMinutes = durationMs / (1000 * 60);
    
    // Log for debugging
    console.log('[Luxon] Duration calculation:');
    console.log(`Start time: ${start.toLocaleString()}`);
    console.log(`End time: ${end.toLocaleString()}`);
    console.log(`Duration: ${durationMinutes} minutes`);
    
    // Ensure duration is at least 30 minutes if calculated incorrectly
    return Math.max(durationMinutes, 30);
}
