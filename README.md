# Gertrude's Children Hospital Web-Based System

A full-stack pediatric hospital management platform built with Next.js and Supabase.

This handover README is written for lecturer assessment and demo navigation.

## 1. Project Summary

This system supports end-to-end child care operations across multiple hospital roles:

- Caregiver account and appointment management
- Receptionist check-in and queue management
- Doctor consultations, prescriptions, and lab orders
- Lab order processing and result publishing
- Pharmacy dispensing and inventory workflows
- Supplier order fulfillment and analytics
- Admin auditing, reporting, staff, and user management

## 2. Tech Stack

- Frontend: Next.js 14, React, TypeScript, Tailwind CSS
- Backend: Next.js Route Handlers + Supabase (PostgreSQL + Auth + Realtime)
- Testing: Vitest
- PDF/Docs: jsPDF, react-pdf

## 3. High-Level Codebase Structure

- app: Route groups and dashboards by role
- app/api: Route handlers for auth, appointments, check-ins, consultations, lab, pharmacy, admin, billing, etc.
- components: Shared and role-specific UI components
- lib: Supabase clients, auth helpers, activity logging, utilities
- supabase/migrations: Database schema and migration SQL
- hooks: Data-fetching and domain hooks

## 4. Prerequisites

- Node.js 18+
- npm 9+
- A Supabase project (URL + keys)

## 5. Environment Variables

Create a .env.local file in the project root:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

Notes:
- NEXT_PUBLIC_* keys are used by browser/server clients.
- SUPABASE_SERVICE_ROLE_KEY is required for admin operations such as user seeding.
- Never commit real service role keys in public repositories.

## 6. Installation and Run

1. Install dependencies

npm install

2. Start development server

npm run dev

3. Build production bundle (for validation)

npm run build

4. Run tests

npm run test:run

Default app URL: http://localhost:3000

## 7. Dummy Users (from seed_users.js)

The dataset defines 14 demo users (2 per major role).

### Admin

- admin1@gertrudes.com / Admin@2024!
- admin2@gertrudes.com / Admin@2024!

### Caregiver

- caregiver1@gertrudes.com / Care@2024!
- caregiver2@gertrudes.com / Care@2024!

### Doctor

- doctor1@gertrudes.com / Doctor@2024!
- doctor2@gertrudes.com / Doctor@2024!

### Lab Technician

- labtech1@gertrudes.com / Lab@2024!
- labtech2@gertrudes.com / Lab@2024!

### Pharmacist

- pharmacist1@gertrudes.com / Pharm@2024!
- pharmacist2@gertrudes.com / Pharm@2024!

### Supplier

- supplier1@gertrudes.com / Supply@2024!
- supplier2@gertrudes.com / Supply@2024!

### Receptionist

- receptionist1@gertrudes.com / Recept@2024!
- receptionist2@gertrudes.com / Recept@2024!

## 8. Role Redirect Map After Login

The login flow redirects users by role:

- admin -> /admin
- doctor -> /doctor
- receptionist -> /receptionist
- lab_tech -> /lab
- pharmacist -> /pharmacy
- supplier -> /supplier
- caregiver -> /dashboard
- staff -> /staff-appointments

## 9. Lecturer Dashboard Navigation Guide

Use one browser profile per role (or incognito windows) to avoid session collision.

### A. Admin Navigation

Login as admin1@gertrudes.com

1. /admin
- View top-level KPIs and admin dashboard cards

2. /admin/activity
- View audit trail and activity history

3. /admin/appointments
- View and manage appointment records

4. /admin/staff
- Create and update staff records

5. /admin/users
- Manage user profiles and role changes

6. /admin/reports
- Generate and export operational reports

7. /settings
- Review system settings pages

### B. Caregiver Navigation

Login as caregiver1@gertrudes.com

1. /dashboard
- Caregiver home and summary cards

2. /patients
- View/manage linked child profiles

3. /caregiver-appointments
- Book and track appointments

4. /caregiver-health-records
- View prescriptions, lab results, and record summaries

5. /caregiver-messages
- Messaging with care team

6. /caregiver-settings
- Profile, preferences, support

### C. Receptionist Navigation

Login as receptionist1@gertrudes.com

1. /receptionist
- Dashboard with queue and daily stats

2. /receptionist/appointments
- Appointment desk workflow

3. /receptionist/check-in
- Check-in via appointment, code, or QR flow

4. /receptionist/queue
- Move patients through waiting and consultation queue states

5. /receptionist/messages
- Team communications

### D. Doctor Navigation

Login as doctor1@gertrudes.com

1. /doctor
- Doctor dashboard summary

2. /doctor/queue
- Start consultation, document diagnosis/treatment, complete consultation
- Launch quick prescription and quick lab order modals

3. /doctor/consultations
- View consultation list

4. /doctor/consultations/[id]
- Consultation detail page (clinical notes, status)

5. /doctor/schedule
- Doctor schedule and timeline

6. /doctor/messages
- Team communication channel

### E. Lab Technician Navigation

Login as labtech1@gertrudes.com

1. /lab
- Lab dashboard overview

2. /lab/orders
- Process pending/active lab orders

3. /lab/results
- Enter and submit test results

4. /lab/completed
- View completed tests

5. /lab/results/[id]
- Result-level detail page

6. /lab/messages
- Team communication

### F. Pharmacist Navigation

Login as pharmacist1@gertrudes.com

1. /pharmacy
- Pharmacy dashboard overview

2. /pharmacy/prescriptions
- Prepare and dispense prescriptions

3. /pharmacy/dispensed
- Dispensed records

4. /pharmacy/inventory
- Inventory, restock requests, supplier invoice/payment flows

5. /pharmacy/messages
- Team communication

### G. Supplier Navigation

Login as supplier1@gertrudes.com

1. /supplier
- Supplier overview

2. /supplier/orders
- View and update supply order statuses

3. /supplier/medications
- View submitted medication lines

4. /supplier/analytics
- Basic supplier analytics

## 10. End-to-End Demo Script (Recommended for Lecturer)

1. Login as caregiver and book/view appointment.
2. Login as receptionist and perform patient check-in.
3. Move patient through receptionist queue.
4. Login as doctor, open queue, complete consultation with diagnosis.
5. Create prescription/lab order from doctor workflow.
6. Login as pharmacist to process and dispense prescription.
7. Login as lab technician to process and complete lab results.
8. Return to caregiver to view updated health records.
9. Login as admin to verify activity logs and reports.

## 11. Notes on Activity Logging

Core auth and operational actions are logged to audit trails (login/logout, check-ins, consultations, payments, inventory/supplier updates, admin operations).

## 12. Seeding Notes

The provided seed_users.js content includes role-based dummy accounts and role-specific inserts.

Recommended secure approach:
- Keep credentials in environment variables
- Do not hardcode service role keys in scripts committed to source control
- Rotate any exposed service role key immediately

## 13. Submission Checklist

- Source code folder zipped (excluding node_modules and .next)
- README includes:
  - project architecture overview
  - run/setup instructions
  - dummy test users
  - complete role navigation guide
- Build command runs successfully in lecturer environment after setting .env.local

## 14. Contact

For demo support, walkthrough questions, or setup troubleshooting, contact project owner: bennhinn.
