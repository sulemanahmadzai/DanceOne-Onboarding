# DanceOne Onboarding Hub

A private web application for managing employee onboarding across three user roles: National Director (ND), Candidate (CDD), and HR.

## Features

- **Three-Step Onboarding Workflow**
  - Step 1: ND creates hire request with candidate and job details
  - Step 2: Candidate completes personal information via secure link
  - Step 3: HR completes ADP details and finalizes onboarding

- **Role-Based Access Control**
  - Admin: Full system access, user management, unified dashboard
  - ND: Create and manage their own onboarding requests
  - HR: View all requests, complete HR forms, export data
  - Candidates: Access via secure magic link (no login required)

- **Admin Features**
  - Unified dashboard with all onboarding requests
  - User invitation system (sends magic link to set password)
  - User management (view, deactivate, delete users)

- **Email Notifications** (via Resend)
  - Candidate invitation with magic link
  - HR notification when candidate completes their form
  - Completion confirmation

- **ADP-Compatible Export**
  - Export completed records to CSV
  - Column order matches ADP import format

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Material UI, Redux Toolkit
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL) with Drizzle ORM
- **Authentication**: Supabase Auth
- **Email**: Resend

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Resend account

### Environment Variables

Create a `.env.local` file with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Database (Supabase Postgres connection string)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Resend (Email)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=DanceOne Onboarding <onboarding@yourdomain.com>

# App URL (for generating invitation links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation

```bash
# Install dependencies
npm install

# Push database schema to Supabase
npm run db:push

# Start development server
npm run dev
```

### Database Setup

The schema is already defined in `src/lib/db/schema.ts`. Run the following to push it to your Supabase database:

```bash
npm run db:push
```

To view your database in Drizzle Studio:

```bash
npm run db:studio
```

## Project Structure

```
src/
├── app/
│   ├── (DashboardLayout)/     # Protected dashboard routes
│   │   ├── nd/                # ND pages (dashboard, new-request, request details)
│   │   ├── hr/                # HR pages (dashboard, request details, export)
│   │   └── layout/            # Sidebar, header components
│   ├── auth/                  # Login page
│   ├── candidate/[token]/     # Candidate form (public)
│   ├── api/                   # API routes
│   │   ├── auth/              # User role endpoint
│   │   ├── onboarding/        # CRUD operations
│   │   ├── candidate/         # Candidate form submission
│   │   └── export/            # CSV export
│   └── components/            # Shared UI components
├── lib/
│   ├── db/                    # Drizzle schema and client
│   ├── supabase/              # Supabase client setup
│   └── email/                 # Resend email templates
├── store/                     # Redux store (customizer)
└── utils/theme/               # MUI theme configuration
```

## User Roles

### Admin
- Access: `/admin/dashboard`, `/admin/users`, `/admin/invite`, plus all ND and HR routes
- Unified view of all onboarding requests
- Invite new users via email (magic link to set password)
- Manage users (view, deactivate, delete)
- Full access to all system features

### National Director (ND)
- Access: `/nd/dashboard`, `/nd/new-request`, `/nd/request/[id]`
- Can create new onboarding requests
- Can view and track their own requests
- Cannot edit candidate or HR fields

### HR
- Access: `/hr/dashboard`, `/hr/request/[id]`, `/hr/export`
- Can view all onboarding requests
- Can complete HR form fields
- Can export completed records to CSV

### Candidate
- Access: `/candidate/[token]` (via magic link)
- No login required
- Can submit personal information once
- Link expires after 7 days

## Onboarding Workflow

1. **ND Creates Request**
   - Fills in candidate info (name, email, phone, state)
   - Fills in job details (tour, position, hire date, salary, worker category)
   - System generates secure link and emails candidate

2. **Candidate Completes Form**
   - Receives email with magic link
   - Fills in personal info (SSN, birth date, address, marital status)
   - System notifies HR upon submission

3. **HR Completes Onboarding**
   - Reviews all ND and candidate data
   - Fills in ADP fields (company code, department, SUI, I-9, E-Verify)
   - Marks as complete

4. **Export to ADP**
   - HR exports completed records to CSV
   - File format compatible with ADP import

## License

Private - DanceOne Internal Use Only
