# Eventra: Next-Gen Event Booking & Management Platform

Eventra is a high-performance, secure, and modern event ticketing and management platform. It features high-concurrency seat holds, automated waitlisting, real-time analytics, digital ticket printing, and gate check-in verification.

---

## 🚀 Tech Stack

### Frontend (Client)
* **Core**: React 18, React Router DOM, Vite
* **Styling**: Premium Glassmorphic UI styled using Vanilla CSS
* **Icons**: React Icons (Heroicons / Hi Icons)

### Backend (Server)
* **Core**: Node.js, Express, REST APIs
* **Database**: MySQL 
* **Queues & Async Jobs**: Redis & Bull (E-mail templates dispatch, automated waitlist promotion timeouts, and seat hold releases)
* **Emailing**: Resend API (Transports custom transactional HTML/CSS e-mails)
* **Authentication**: Two-Token JWT Architecture (Short-lived Access tokens, secure HttpOnly Refresh cookies, request interceptors for silent token refreshes)

---

## 💎 Features Implemented

### 1. Account Security & Profile Settings
* **Two-Token Authentication**: Features access tokens combined with secure refresh tokens. If access tokens expire, a frontend client interceptor silently renews the session. On complete session expiry, the app redirects to `/login`.
* **User Settings Panel**: Users can update their security profiles, usernames, and passwords under a secure settings dashboard tab.

### 2. Organizer & Role Request System
* **Promoter Promotion Roster**: Normal users can submit promoter requests inside settings, which are queued under a dedicated Admin panel.
* **Role Verification**: Administrators can approve, reject, or revoke organizer roles dynamically.

### 3. Advanced Event Explore & Filtering
* **Dynamic Search**: Live search matching keywords across events.
* **Category Filters**: Categorized tags (`Tech`, `Music`, `Art`, `Business`, `General`, `Sports`) dynamically filter matching cards.
* **Location Selector**: A dropdown menu populated with unique locations in the database isolates venue cities.

### 4. Seat Hold & Ticket Checkout
* **5-Minute Reservation Expiry**: When booking, seats are locked on a 5-minute countdown timer using Redis queues, preventing overselling under high concurrency.
* **Booking Conversion**: Payment confirmation converts holds into finalized tickets, releasing seats if the countdown expires.

### 5. Automated Waitlists
* **Waitlist Queue**: Joining waitlists when capacity is exhausted.
* **Promotional Cascade**: If a booking is cancelled, the first waitlisted member is promoted, given a 30-minute window to complete checkout, and notified via emails/notifications.

### 6. Organizer Control & Attendee Roster
* **Event Cancellations**: Organizers can cancel events, which invalidates all bookings, processes refunds, and alerts attendees.
* **Roster Downloads**: Exposes attendee lists to organizers with features to download data as CSV.

### 7. Host Analytics Dashboard
* **Metrics Cards**: Displays total ticket counts, gross revenues, and average venue occupancy.
* **Visual Progress Bars**: Visual indicators representing event ticket sales progress.

### 8. Digital Ticket Stubs & QR Gate Checks
* **Printable Stub Layouts**: Dotted ticket stubs with printable layouts optimized for PDF export and custom CSS print rules.
* **QR Validation Gate**: Real-time validation route `/tickets/validate/:bookingId` verifies ticket status and authenticity on scan.

### 9. In-App Notification Center
* **Bell Notification Dropdown**: A glassmorphic bell showing real-time booking confirmation, waitlist promotions, and admin approvals.
* **Unread Indicators**: Displays unread badge counts and exposes dismiss controls.

---

## 🛠️ Getting Started

### 1. Database Setup
Ensure you have MySQL running and create a database named `eventra_test`.

### 2. Server Configuration
Create `server/.env`:
```env
PORT=5000
DB_HOST=localhost
DB_USER=your_user
DB_PASS=your_password
DB_NAME=eventra_test
CONNECTIONLIMIT=50
NODE_ENV=dev
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_ACCESS_SECRET=your_jwt_access_secret
FRONTEND_URL=http://localhost:5173
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASS=
RESEND_API_KEY=your_resend_api_key
RESEND_FROM=onboarding@resend.dev
```

### 3. Start Backend
```bash
cd server
npm install
node server.js
```

### 4. Start Frontend
```bash
cd client
npm install
npm run dev
```

### 5. Run Verification Tests
```bash
cd server
# Run backend integration tests
node tests/backend.test.js

# Run notifications integration tests
node tests/notifications.test.js
```
