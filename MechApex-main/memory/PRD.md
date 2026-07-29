# MechApex — Product Requirements Document (v1.1)

## Vision
A simplified mobile clone of Garage Plug: a mobile workshop management app for independent garages and their staff, built for on-the-shop-floor use.

## Personas
- **Garage Owner (main user)**: Full access. Manages profile, sub-users, all job cards, analytics.
- **Mechanic (sub user)**: Limited access. Creates and updates only their own job cards.

## Tech Stack
- Frontend: Expo (React Native), expo-router, expo-camera, expo-image-picker, expo-location, expo-print, expo-sharing, react-native-svg (annotations), AsyncStorage.
- Backend: FastAPI + Motor (MongoDB), JWT auth, MSG91 SMS (with graceful DEMO fallback).
- AI: Claude Sonnet 4.5 via emergentintegrations (kept as endpoint for future use).

## Auth
- Mobile Number + 6-digit OTP (MSG91).
- Auto-switches to demo mode when MSG91 keys are absent (OTP is returned in API response and shown on screen).
- First-time verifiers become main users; sub-users are created by a main user and log in with the same OTP flow.

## Core Modules

### 1. Home
- Big "Two Wheeler" / "Four Wheeler" selector.
- KPI strip (Pending, In Progress, Ready, Completed counts).
- Revenue card (main users only).
- Recent job cards.

### 2. Service Select
- After picking vehicle type, choose Service vs Washing → opens Job Card creation.

### 3. Job Card Creation
- Vehicle brand + model dropdowns backed by an Indian catalog (Hero, Bajaj, TVS, Honda, Maruti, Tata, Mahindra, Hyundai, Kia, Toyota, etc.).
- Registration number, year, fuel type, odometer.
- Customer name + phone.
- Complaint / notes.
- Add items from catalog OR custom item, each with editable INR price and quantity.
- Total in INR.

### 4. Job Card Detail
- Status pipeline: Pending → In Progress → Ready → Completed (Dispatch).
- Past service history (same registration).
- Editable complaint/notes.
- **Digital Checklist** (Brakes, Fluids, Tires, Battery, Lights, Belts, Chain, Wipers).
- **Time Tracker** with Start/Pause per job.
- **Camera + Annotate Photos**: mechanics take photos, draw over them (5 colors, undo/clear), attach notes. Photos saved as base64 in the job record.
- Photo viewer with SVG-rendered annotations overlay.
- **WhatsApp** deep-link that opens the customer's WhatsApp with a fully-formatted invoice message.
- **PDF Invoice** (`expo-print`) with garage name + address + phone on the left header, itemised line items + INR totals on the right, and a thank-you footer. Shared via native share sheet.
- On "Complete", a follow-up **reminder is auto-created 2 months later**.

### 5. Reminders
- Lists all pending follow-up reminders across the org (main) or for the sub-user's own jobs.
- Overdue (past due date) rows visually flagged.
- One-tap Call, WhatsApp (auto-formatted "hi, it's been 2 months …" message), or Dismiss.

### 6. Analytics (main only)
- Revenue + vehicles-serviced summary.
- 12-month bar chart with year navigation.
- Tap a month to filter.
- Sort completed jobs by Date or Price.

### 7. Account
- Photo (image picker), Garage Name*, GSTIN, Telephone*, Email.
- Address + "Use current location" (expo-location + reverse geocoding).
- Mandatory fields enforced for main users.

### 8. Sub Users (main only)
- Add sub-user with Name, Mobile*, Aadhar*, Driving License (optional).
- Sub-user logs in with their mobile via OTP.

### 9. More
- Language selector: **English, ಕನ್ನಡ (Kannada), हिन्दी (Hindi)**.
- Settings toggles: Sound, Notifications.
- Logout.

## Design
- Clean professional light theme (surface `#F3F4F6`, brand Deep Burgundy `#BE123C`).
- Bottom tab navigation: Home, Jobs, Reminders, Analytics (main only, hidden for sub-users), More.
- Top-right avatar/photo circle on every main screen → opens Account.
- High-contrast status badges (Pending → amber, In Progress → blue, Ready → purple, Completed → green).

## Non-goals (v1)
- Real SMS delivery without MSG91 keys.
- Real-time WhatsApp Business API integration (uses `wa.me` deep-link only).
- Push notifications (reminders are pull-based; the app shows them in the Reminders tab).
- Multi-branch billing / GST tax computation.
