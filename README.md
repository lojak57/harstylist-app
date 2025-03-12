# HairStyle Pro

A modern web application for hairstylists to manage clients, appointments, services, and style guides.

## Features

- **Client Management**: Store and manage client information, including contact details and style preferences
- **Appointment Scheduling**: Calendar-based appointment management with multiple views (day, week, month)
- **Natural Language Commands**: Schedule appointments using natural language (e.g., "schedule John Doe for a haircut next wednesday at 2pm")
- **Service Management**: Create and manage services with pricing, duration, and descriptions
- **Style Guides**: Create and assign style guides to clients

## Tech Stack

- **Frontend**: SvelteKit 2.x with Svelte 5
- **Styling**: TailwindCSS 4.0
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## Development

To run the project locally:

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your Supabase credentials (see `.env.example`)
4. Start the development server: `npm run dev`

```bash
npm run dev -- --open
```

## Deployment to Vercel

### Prerequisites

1. A [GitHub](https://github.com) account
2. A [Vercel](https://vercel.com) account (you can sign up with your GitHub account)
3. A [Supabase](https://supabase.com) project with the required tables

### Deployment Steps

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push
   ```

2. Connect your GitHub repository to Vercel:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." > "Project"
   - Select your GitHub repository
   - Vercel will automatically detect SvelteKit

3. Configure environment variables in Vercel:
   - Add the following environment variables:
     - `PUBLIC_SUPABASE_URL`: Your Supabase project URL
     - `PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

4. Deploy the project
   - Click "Deploy"
   - Vercel will build and deploy your application

5. Your application will be available at the provided Vercel URL

## License

MIT
