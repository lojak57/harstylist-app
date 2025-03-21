# HairStylist App Project Context

## Project Overview
This is a SvelteKit application with Supabase integration for a hairstylist appointment scheduling system. The app is deployed to Vercel and uses technologies including SvelteKit, Supabase, TailwindCSS, Playwright and Vitest for testing.

## Recent Work

### UI Redesign
- Redesigned the **Clients Page** with a mobile-friendly, modern UI inspired by the appointment details page
  - Gradient header with improved search and filter layout
  - Redesigned client cards with gradient backgrounds and better visual hierarchy
  - Enhanced layout and improved mobile responsiveness

- Redesigned the **Client Details Page** to match the new design approach
  - Gradient header with improved client avatar display
  - Card-based layout for client information with icons and visual elements
  - Enhanced appointment listing and redesigned available services section

### Debug Functionality
- Added functionality to delete all clients in the debug page
- Implemented proper deletion order to handle foreign key constraints (appointments must be deleted before clients)

## Database Relationships
- The database has foreign key constraints between clients and appointments (`appointments_client_id_fkey`)
- Currently experiencing an issue with relationships between 'appointments' and 'services' in the schema cache

## Known Issues
- TypeScript errors related to properties that do not exist on specific types (e.g., `avatar_url` and `status`)
- Error "Could not find a relationship between 'appointments' and 'services'" when creating a client

## Application Structure
Key pages and components:
- `/src/routes/clients/+page.svelte` - Clients listing page
- `/src/routes/clients/[id]/+page.svelte` - Client details page
- `/src/routes/clients/new/+page.svelte` - New client creation page
- `/src/routes/appointments/+page.svelte` - Appointments page
- `/src/routes/debug/+page.svelte` - Debug tools for managing app data

## Recent Feature Implementation
- Enhanced duration parser for appointment times
- Unified experience between appointment creation forms
- Improved end time calculation based on selected services
- Added detailed logging for debugging duration calculations

Created on: March 21, 2025
