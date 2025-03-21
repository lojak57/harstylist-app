# HairStylist App Project Context

## Project Overview
This is a SvelteKit application with Supabase integration for a hairstylist appointment scheduling system. The app is deployed to Vercel and uses technologies including SvelteKit, Supabase, TailwindCSS, Playwright and Vitest for testing.

## Recent Work

### UI Consistency Enhancement (March 21, 2025)
- Applied consistent UI styling across all pages of the application:
  - Added gradient background header boxes (from-indigo-100 to-purple-100) on all main pages
  - Standardized headers to use "Your [Resource]" format with descriptive subtitles
  - Improved card component styling with consistent shadows, borders and hover effects
  - Enhanced error and loading state styling for better user experience
  - Updated button styling for consistency across all action buttons
  - Implemented CommandInput component on all major pages

### UI Redesign (Previous Work)
- Redesigned the **Clients Page** with a mobile-friendly, modern UI inspired by the appointment details page
  - Gradient header with improved search and filter layout
  - Redesigned client cards with gradient backgrounds and better visual hierarchy
  - Enhanced layout and improved mobile responsiveness

- Redesigned the **Client Details Page** to match the new design approach
  - Gradient header with improved client avatar display
  - Card-based layout for client information with icons and visual elements
  - Enhanced appointment listing and redesigned available services section

### Appointment System Improvements
- Enhanced duration parser that handles both time formats (HH:MM:SS) and text formats (e.g., '2 hours 30 minutes')
- Improved end time calculation based on selected services' durations
- Unified the experience between the direct appointment creation form and the multi-step form accessed from clients
- Added detailed console logging for debugging duration calculations
- Added UI improvements including the ability to edit end times manually

### Debug Functionality
- Added functionality to delete all clients in the debug page
- Implemented proper deletion order to handle foreign key constraints (appointments must be deleted before clients)

## Database Structure
- **Clients**: Stores customer information (name, contact details, preferences, etc.)
- **Appointments**: Booking details with relationships to clients and services
- **Services**: Hairstyling services offered with pricing and duration information
- **Style Guides**: Reference materials for different hairstyles

## Database Relationships
- The database has foreign key constraints between clients and appointments (`appointments_client_id_fkey`)
- Added service_id to appointments with new migration (20250321000000_add_service_id_to_appointments.sql)

## Known Issues
- TypeScript errors related to properties that do not exist on specific types (e.g., `avatar_url` and `status`)
- Some deployment differences between local development and Vercel build

## Application Structure
Key pages and components:
- `/src/routes/clients/+page.svelte` - Clients listing page
- `/src/routes/clients/[id]/+page.svelte` - Client details page
- `/src/routes/clients/new/+page.svelte` - New client creation page
- `/src/routes/appointments/+page.svelte` - Appointments page
- `/src/routes/services/+page.svelte` - Services management page
- `/src/routes/style-guides/+page.svelte` - Style guides page
- `/src/routes/profile/+page.svelte` - Stylist profile management
- `/src/routes/debug/+page.svelte` - Debug tools for managing app data

Key components:
- `/src/lib/components/CommandInput.svelte` - Command bar component used across pages
- `/src/lib/components/StyleGuideCard.svelte` - Card component for style guides display
- `/src/lib/components/Calendar.svelte` - Calendar component for appointment display

Updated: March 21, 2025
