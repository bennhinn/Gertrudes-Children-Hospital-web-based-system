# Staff Dashboards Implementation Plan

## 🎯 Refined Requirement

Create role-specific dashboards for the four primary staff roles: **Receptionist**, **Doctor**, **Lab Technician**, and **Pharmacist**. Each dashboard should provide a tailored workflow optimized for that role's daily responsibilities, with real-time updates, intuitive navigation, and mobile-responsive design.

### Core Principles
- **Role-Specific Workflows**: Each dashboard displays only relevant data and actions
- **Real-Time Updates**: Use Supabase real-time subscriptions for live data
- **Quick Actions**: One-click access to frequent tasks
- **Mobile-First**: Optimized for tablets and phones used in clinical settings
- **Accessibility**: WCAG 2.1 AA compliant with proper ARIA labels
- **Performance**: Fast load times with optimistic UI updates

---

## 🏥 1. Receptionist Dashboard (Priority #1)

### User Story
*"As a receptionist, I need to efficiently check patients in, manage the waiting queue, handle walk-ins, and provide real-time updates to doctors about patient flow, so that the clinic operates smoothly and patients have minimal wait times."*

### Key Responsibilities
- Patient check-in (QR code + manual)
- Manage waiting queue and patient flow
- Handle walk-in registrations
- Appointment verification and rescheduling
- Communicate with caregivers about wait times
- Track checked-in vs waiting vs with-doctor status

### Dashboard Sections

#### 1.1 Overview Stats (Top Row)
- **Checked In Today**: Count with animated number
- **Currently Waiting**: Real-time count with pulse indicator
- **With Doctor Now**: Active consultations count
- **Average Wait Time**: Calculated from check-in to doctor

#### 1.2 Quick Actions Bar
- "🔍 Search Patient" (by name, QR, phone)
- "➕ Add Walk-In" (quick registration form)
- "📋 View Full Queue" (expandable list)
- "🔔 Send Notification" (to caregivers)

#### 1.3 Check-In Section
- **QR Scanner**: Html5QrcodeScanner with auto-check-in
- **Manual Search**: Typeahead patient search
- **Check-In Form**: Capture reason, vitals (optional), assign doctor
- **Success Confirmation**: Visual + sound feedback, print queue number

#### 1.4 Queue Management (Main Section)
- **Real-Time Queue List**: Sortable by check-in time, appointment time, priority
- **Patient Cards**: Show name, appointment time, status badge, wait time, assigned doctor
- **Status Actions**:
  - "Ready for Doctor" button (changes status to in-consultation)
  - "Reschedule" (opens appointment modal)
  - "Cancel/No-Show" (updates appointment status)
- **Filter Toggles**: All / Waiting / In Consultation / Completed

#### 1.5 Upcoming Appointments Widget
- Next 5 appointments (not yet checked in)
- Shows scheduled time, patient name, caregiver contact
- "Mark as Checked In" button for proactive check-ins

### API Endpoints Needed
```typescript
// GET /api/receptionist/queue - Get today's check-ins and appointments
// POST /api/receptionist/check-in - Check in patient (QR or manual)
// PATCH /api/receptionist/appointments/[id]/status - Update appointment status
// POST /api/receptionist/walk-ins - Register walk-in patient
// GET /api/receptionist/search?q=name - Search patients
```

### Database Schema Additions
```sql
-- check_ins table (new)
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id),
  child_id UUID REFERENCES children(id),
  checked_in_at TIMESTAMP DEFAULT NOW(),
  checked_in_by UUID REFERENCES profiles(id), -- receptionist ID
  status TEXT DEFAULT 'waiting', -- waiting | in_consultation | completed
  queue_number INTEGER,
  vitals JSONB, -- {temperature, weight, height, blood_pressure}
  reason TEXT,
  notes TEXT
);

-- Add index for today's check-ins
CREATE INDEX idx_check_ins_today ON check_ins(checked_in_at) 
WHERE checked_in_at > CURRENT_DATE;
```

### UI Components to Create
- `<QueueCard />` - Patient card with status, actions, time elapsed
- `<CheckInScanner />` - QR scanner with fallback manual search
- `<WalkInModal />` - Quick patient registration form
- `<QueueNumberDisplay />` - Large print-friendly queue number

### Technical Implementation Notes
- Use SWR with `refreshInterval: 5000` for queue polling
- Supabase real-time subscription on `check_ins` table
- Sound notification on successful check-in (accessible, user-controlled)
- Print queue number: use browser print dialog with custom CSS
- Optimistic updates for status changes to feel instant

---

## 👨‍⚕️ 2. Doctor Dashboard

### User Story
*"As a doctor, I need to see my patient queue in order of priority, access patient medical history quickly, write prescriptions and lab orders, and document consultations efficiently, so I can provide quality care to all patients."*

### Key Responsibilities
- View assigned patient queue
- Access patient medical records and history
- Conduct consultations and write notes
- Prescribe medications
- Order lab tests
- Mark consultations as complete

### Dashboard Sections

#### 2.1 Overview Stats
- **Waiting for Me**: Count of patients in queue
- **Completed Today**: Consultations finished
- **Avg Consultation Time**: Performance metric
- **Pending Lab Results**: Tests awaiting review

#### 2.2 Quick Actions
- "🔍 Search Patient History"
- "📝 Quick Prescription" (for follow-ups)
- "🧪 Lab Order Form"
- "📄 View My Schedule"

#### 2.3 Patient Queue (Priority View)
- **Queue Cards**: Show patient name, reason for visit, wait time, vitals
- **Priority Indicators**: Urgent (red), Standard (blue), Follow-up (green)
- **Call Next Patient**: Button to pull next from queue
- **Patient Details Drawer**: Slides in with full medical history

#### 2.4 Consultation Workspace
- **Patient Info Header**: Name, age, allergies, current medications
- **Medical History Timeline**: Previous visits, conditions, treatments
- **Vitals Display**: From check-in (temperature, BP, weight, height)
- **Consultation Notes Editor**: Rich text with voice-to-text option
- **Prescription Writer**: Drug search, dosage, duration, instructions
- **Lab Order Form**: Test type, urgency, special instructions
- **Complete Consultation**: Button to mark done and move to next

#### 2.5 Today's Schedule
- List of all appointments for the day
- Completed vs pending status
- Time slot availability

### API Endpoints Needed
```typescript
// GET /api/doctor/queue - Get doctor's current patient queue
// GET /api/doctor/patients/[id]/history - Full medical history
// POST /api/doctor/consultations - Save consultation notes
// POST /api/doctor/prescriptions - Create prescription
// POST /api/doctor/lab-orders - Create lab order
// PATCH /api/doctor/appointments/[id]/complete - Mark consultation done
```

### Database Schema Additions
```sql
-- consultations table (new)
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id),
  doctor_id UUID REFERENCES doctors(id),
  child_id UUID REFERENCES children(id),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  diagnosis TEXT,
  notes TEXT,
  treatment_plan TEXT,
  follow_up_instructions TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- prescriptions table (new)
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id),
  child_id UUID REFERENCES children(id),
  doctor_id UUID REFERENCES doctors(id),
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT,
  instructions TEXT,
  status TEXT DEFAULT 'pending', -- pending | dispensed | completed
  created_at TIMESTAMP DEFAULT NOW()
);

-- lab_orders table (new)
CREATE TABLE lab_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id),
  child_id UUID REFERENCES children(id),
  doctor_id UUID REFERENCES doctors(id),
  test_type TEXT NOT NULL,
  urgency TEXT DEFAULT 'routine', -- urgent | routine | stat
  special_instructions TEXT,
  status TEXT DEFAULT 'pending', -- pending | collected | in_progress | completed
  ordered_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

### UI Components to Create
- `<PatientQueueCard />` - Patient card with medical context
- `<MedicalHistoryTimeline />` - Chronological history view
- `<ConsultationEditor />` - Notes + prescription + lab orders in one
- `<PrescriptionForm />` - Drug search, dosage calculator
- `<LabOrderForm />` - Test selection with pre-filled common panels

### Technical Implementation Notes
- Real-time queue updates via Supabase subscriptions
- Auto-save consultation notes every 30 seconds
- Voice-to-text integration for hands-free note-taking (Web Speech API)
- Drug database for prescription autocomplete (can mock initially)
- Print prescription with barcode for pharmacy tracking

---

## 🔬 3. Lab Technician Dashboard

### User Story
*"As a lab technician, I need to see pending test requests, track sample collection status, enter results efficiently, and flag abnormal values, so that doctors receive accurate test results promptly."*

### Key Responsibilities
- View pending lab orders
- Track sample collection
- Process samples and enter results
- Flag critical/abnormal values
- Generate lab reports
- Manage lab inventory (optional)

### Dashboard Sections

#### 3.1 Overview Stats
- **Pending Tests**: Orders awaiting processing
- **In Progress**: Tests being run
- **Completed Today**: Finished tests
- **Critical Results**: Abnormal values flagged

#### 3.2 Quick Actions
- "🧪 New Test Entry"
- "📊 Batch Processing" (multiple samples)
- "🔍 Search by Patient"
- "📋 Print Worklist"

#### 3.3 Test Request Queue
- **Lab Order Cards**: Patient name, test type, doctor, urgency, ordered time
- **Status Pipeline**: Pending → Sample Collected → In Progress → Results Entered → Reviewed
- **Urgency Filters**: STAT (red) | Urgent (orange) | Routine (blue)
- **Action Buttons**: "Collect Sample" | "Start Test" | "Enter Results"

#### 3.4 Result Entry Form
- **Test Type Selection**: Pre-filled from order
- **Result Fields**: Dynamic based on test type (e.g., CBC has WBC, RBC, Hemoglobin, etc.)
- **Reference Ranges**: Auto-displayed with normal/abnormal indicators
- **Abnormal Value Alerts**: Automatic flagging with color coding
- **Notes Field**: For technician observations
- **Validate & Submit**: Double-check before finalizing

#### 3.5 Today's Completed Tests
- List of all results entered today
- Filter by doctor, test type, abnormal only
- Quick re-print option

### API Endpoints Needed
```typescript
// GET /api/lab/orders - Get pending lab orders
// PATCH /api/lab/orders/[id]/status - Update order status
// POST /api/lab/results - Submit test results
// GET /api/lab/results/[id] - View specific result
// GET /api/lab/test-templates - Get test type configurations
```

### Database Schema Additions
```sql
-- lab_results table (new)
CREATE TABLE lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_order_id UUID REFERENCES lab_orders(id),
  child_id UUID REFERENCES children(id),
  technician_id UUID REFERENCES lab_technicians(id),
  results JSONB NOT NULL, -- { "WBC": "8.5", "RBC": "4.2", ... }
  abnormal_flags JSONB, -- { "WBC": false, "Hemoglobin": true }
  reference_ranges JSONB, -- { "WBC": "4.5-11.0 x10^9/L" }
  technician_notes TEXT,
  reviewed_by UUID REFERENCES doctors(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- test_templates table (new)
CREATE TABLE test_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name TEXT UNIQUE NOT NULL,
  test_code TEXT,
  fields JSONB NOT NULL, -- [{ name: "WBC", unit: "x10^9/L", min: 4.5, max: 11.0 }]
  category TEXT, -- Hematology, Chemistry, Microbiology, etc.
  turnaround_time TEXT -- "2 hours", "24 hours"
);
```

### UI Components to Create
- `<LabOrderCard />` - Test request with urgency indicators
- `<ResultEntryForm />` - Dynamic fields based on test type
- `<AbnormalValueAlert />` - Visual warning for out-of-range values
- `<LabReportPreview />` - Print-ready result format

### Technical Implementation Notes
- Auto-calculate abnormal flags by comparing results to reference ranges
- Color-coded result fields: green (normal), red (abnormal), yellow (borderline)
- Barcode scanner integration for sample tracking (optional enhancement)
- Batch entry mode for multiple samples of same test type
- Audit trail for result modifications (required for compliance)

---

## 💊 4. Pharmacist Dashboard

### User Story
*"As a pharmacist, I need to see incoming prescriptions, verify medications against patient allergies, dispense drugs efficiently, manage inventory, and track controlled substances, so that patients receive safe and accurate medications."*

### Key Responsibilities
- Review and verify prescriptions
- Check for drug interactions and allergies
- Dispense medications
- Manage inventory and reorder
- Track controlled substances
- Provide patient counseling notes

### Dashboard Sections

#### 4.1 Overview Stats
- **Pending Prescriptions**: Awaiting dispensing
- **Dispensed Today**: Completed prescriptions
- **Low Stock Items**: Inventory alerts
- **Controlled Substances**: Special tracking count

#### 4.2 Quick Actions
- "🔍 Search Prescription"
- "📦 Receive Stock" (inventory management)
- "⚠️ Report Drug Interaction"
- "📋 Reorder List"

#### 4.3 Prescription Queue
- **Prescription Cards**: Patient name, medication, doctor, date/time
- **Priority Indicators**: Urgent (red) | Standard (blue) | Refill (green)
- **Status Pipeline**: Pending → Verified → Dispensed → Collected
- **Action Buttons**: "Verify" | "Dispense" | "Mark Collected"

#### 4.4 Prescription Verification Workspace
- **Patient Info**: Name, age, weight, allergies
- **Prescription Details**: Drug, dosage, frequency, duration
- **Allergy Check**: Auto-flag if patient has listed allergy
- **Drug Interaction Check**: Warning if patient on conflicting medications
- **Dosage Calculator**: Age/weight-based validation
- **Substitution Suggestions**: Generic alternatives if brand unavailable
- **Verification Notes**: Pharmacist comments
- **Approve & Queue for Dispensing**

#### 4.5 Inventory Management
- **Stock Levels**: Current quantity by medication
- **Low Stock Alerts**: Items below reorder threshold
- **Expiry Tracking**: Medications nearing expiration
- **Reorder List**: Auto-generated based on usage patterns
- **Receive Stock**: Log incoming deliveries

### API Endpoints Needed
```typescript
// GET /api/pharmacy/prescriptions - Get pending prescriptions
// GET /api/pharmacy/prescriptions/[id] - Get prescription details
// PATCH /api/pharmacy/prescriptions/[id]/verify - Verify prescription
// PATCH /api/pharmacy/prescriptions/[id]/dispense - Mark as dispensed
// GET /api/pharmacy/inventory - Get stock levels
// POST /api/pharmacy/inventory/receive - Log stock receipt
// GET /api/pharmacy/interactions?medication=X&patientId=Y - Check interactions
```

### Database Schema Additions
```sql
-- pharmacy_inventory table (new)
CREATE TABLE pharmacy_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_name TEXT NOT NULL,
  generic_name TEXT,
  strength TEXT, -- "500mg", "10mg/ml"
  form TEXT, -- tablet, syrup, injection
  quantity INTEGER NOT NULL,
  unit TEXT, -- tablets, bottles, vials
  reorder_level INTEGER DEFAULT 50,
  expiry_date DATE,
  batch_number TEXT,
  is_controlled BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- prescription_dispensing table (new)
CREATE TABLE prescription_dispensing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES prescriptions(id),
  pharmacist_id UUID REFERENCES pharmacists(id),
  verified_at TIMESTAMP,
  verification_notes TEXT,
  dispensed_at TIMESTAMP,
  dispensed_quantity INTEGER,
  batch_number TEXT,
  collected_at TIMESTAMP,
  collected_by TEXT, -- Caregiver name
  pharmacist_notes TEXT
);

-- drug_interactions table (new - can be pre-populated)
CREATE TABLE drug_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_a TEXT NOT NULL,
  drug_b TEXT NOT NULL,
  severity TEXT, -- minor | moderate | major
  description TEXT,
  recommendation TEXT
);
```

### UI Components to Create
- `<PrescriptionCard />` - Prescription with patient context
- `<VerificationChecklist />` - Allergy, interaction, dosage checks
- `<InventoryTable />` - Sortable, filterable stock view
- `<DispenseModal />` - Confirmation with batch tracking

### Technical Implementation Notes
- Real-time prescription updates via Supabase subscriptions
- Drug interaction database (can use OpenFDA API or local database)
- Barcode scanning for medication verification
- Print labels with dosage instructions and patient name
- Controlled substance tracking with audit log
- SMS notification to caregiver when prescription ready

---

## 🔧 Technical Infrastructure Updates

### 1. RBAC Enhancement
```typescript
// lib/rbac.ts - Update to support sub-roles
export const ROLE = {
  ADMIN: 'admin',
  RECEPTIONIST: 'receptionist',
  DOCTOR: 'doctor',
  LAB_TECH: 'lab_tech',
  PHARMACIST: 'pharmacist',
  CAREGIVER: 'caregiver',
  SUPPLIER: 'supplier', // for future use
} as const

export const ROLE_PERMISSIONS = {
  admin: ['*'], // all permissions
  receptionist: ['check_in_patients', 'manage_queue', 'view_appointments', 'register_walk_ins'],
  doctor: ['view_patient_queue', 'access_medical_records', 'write_prescriptions', 'order_labs', 'document_consultations'],
  lab_tech: ['view_lab_orders', 'enter_results', 'manage_samples'],
  pharmacist: ['view_prescriptions', 'dispense_medications', 'manage_inventory', 'verify_prescriptions'],
  caregiver: ['book_appointments', 'view_own_appointments', 'view_children'],
  supplier: ['view_orders', 'update_deliveries'], // for future use
} as const
```

### 2. Middleware Updates
```typescript
// middleware.ts - Add role-based route protection
const ROLE_ROUTES = {
  '/receptionist': ['receptionist', 'admin'],
  '/doctor': ['doctor', 'admin'],
  '/lab': ['lab_tech', 'admin'],
  '/pharmacy': ['pharmacist', 'admin'],
  '/admin': ['admin'],
  '/dashboard': ['caregiver'],
}
```

### 3. Shared UI Components
Create reusable components across all dashboards:
- `<DashboardLayout />` - Consistent sidebar, header, notifications
- `<StatCard />` - Animated stat cards with icons
- `<RealTimeIndicator />` - Pulsing dot for live data
- `<StatusBadge />` - Consistent status colors
- `<SearchBar />` - Unified patient/order search
- `<EmptyState />` - Consistent "no data" messages

### 4. Real-Time Setup
```typescript
// lib/realtime.ts
import { createClient } from './supabase/client'

export function subscribeToQueue(callback: (payload: any) => void) {
  const supabase = createClient()
  return supabase
    .channel('queue-changes')
    .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'check_ins' }, 
        callback
    )
    .subscribe()
}

// Similar functions for prescriptions, lab_orders, etc.
```

---

## 📋 Implementation Checklist

### Phase 1: Receptionist Dashboard (Week 1)
- [ ] Create route structure `app/(receptionist)/receptionist/page.tsx`
- [ ] Build overview stats with SWR data fetching
- [ ] Implement QR check-in with Html5QrcodeScanner
- [ ] Create queue management with real-time updates
- [ ] Add patient search and manual check-in
- [ ] Implement walk-in registration modal
- [ ] Create API routes for check-ins and queue
- [ ] Add database migrations for check_ins table
- [ ] Test on mobile devices (iPad, tablets)

### Phase 2: Doctor Dashboard (Week 2)
- [ ] Create route structure `app/(doctor)/doctor/page.tsx`
- [ ] Build patient queue view with priority sorting
- [ ] Create medical history timeline component
- [ ] Implement consultation notes editor
- [ ] Build prescription writing form with drug search
- [ ] Create lab order form
- [ ] Add API routes for consultations, prescriptions, lab_orders
- [ ] Add database migrations for new tables
- [ ] Implement voice-to-text for notes (optional)

### Phase 3: Lab Technician Dashboard (Week 3)
- [ ] Create route structure `app/(lab)/lab/page.tsx`
- [ ] Build lab order queue with status tracking
- [ ] Create dynamic result entry form
- [ ] Implement abnormal value detection
- [ ] Build test templates system
- [ ] Create lab report preview/print
- [ ] Add API routes for lab operations
- [ ] Add database migrations for lab_results and test_templates
- [ ] Test result validation logic

### Phase 4: Pharmacist Dashboard (Week 4)
- [ ] Create route structure `app/(pharmacy)/pharmacy/page.tsx`
- [ ] Build prescription queue with verification workflow
- [ ] Create allergy and interaction checker
- [ ] Implement inventory management views
- [ ] Build stock receive and reorder system
- [ ] Create dispensing workflow with tracking
- [ ] Add API routes for pharmacy operations
- [ ] Add database migrations for inventory and dispensing
- [ ] Test controlled substance tracking

### Phase 5: Integration & Polish (Week 5)
- [ ] Connect all workflows (e.g., check-in → doctor → lab → pharmacy)
- [ ] Add cross-role notifications (e.g., doctor notified of lab results)
- [ ] Implement print functionality across all dashboards
- [ ] Add comprehensive error handling
- [ ] Optimize performance and database queries
- [ ] Mobile responsiveness testing
- [ ] Accessibility audit (keyboard navigation, screen readers)
- [ ] User acceptance testing with each role
- [ ] Create user documentation/guides

---

## 🎨 Design Consistency

### Color Scheme by Role
- **Receptionist**: Blue theme (`from-blue-500 to-blue-600`)
- **Doctor**: Purple theme (`from-purple-500 to-purple-600`)
- **Lab Tech**: Yellow/Green theme (`from-yellow-500 to-green-500`)
- **Pharmacist**: Cyan theme (`from-cyan-500 to-teal-600`)

### Status Badge Colors (Consistent Across All)
- Pending/Waiting: `bg-yellow-100 text-yellow-800`
- In Progress: `bg-blue-100 text-blue-800`
- Completed: `bg-green-100 text-green-800`
- Urgent/Critical: `bg-red-100 text-red-800`
- Cancelled: `bg-slate-100 text-slate-800`

### Typography
- Dashboard Title: `text-3xl font-bold text-slate-800`
- Section Heading: `text-xl font-semibold text-slate-700`
- Card Title: `text-lg font-medium text-slate-800`
- Body Text: `text-sm text-slate-600`
- Emphasized: `text-sm font-medium text-slate-700`

---

## 🚀 Next Steps

1. **Review this plan** with stakeholders/team
2. **Start with Receptionist Dashboard** (highest priority)
3. **Create database migrations** first (foundation)
4. **Build API routes** next (backend logic)
5. **Develop UI components** (frontend)
6. **Test each dashboard** individually before integration
7. **Iterate based on user feedback**

---

## 📝 Notes
- All timestamps should use `Intl.DateTimeFormat` for localization
- Consider offline functionality for poor network areas
- Add user activity logging for auditing
- Plan for future features: telemedicine, payment integration, SMS reminders
- Ensure HIPAA/GDPR compliance if applicable (data encryption, access logs)
