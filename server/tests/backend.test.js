import { pool } from "../database/db.js";
import { runMigrations } from "./migration.js";

const BASE_URL = "http://localhost:5000";

const results = [];

function logTest(name, status, details = "") {
  console.log(`[${status ? "SUCCESS" : "FAILURE"}] ${name} ${details ? `- ${details}` : ""}`);
  results.push({ name, status, details });
}

async function cleanupDB() {
  const [users] = await pool.query("SELECT id FROM users WHERE email LIKE 'test_%' OR username LIKE 'test_%'");
  const userIds = users.map(u => u.id);

  if (userIds.length > 0) {
    const placeholders = userIds.map(() => "?").join(",");
    await pool.query(`DELETE FROM reviews WHERE user_id IN (${placeholders})`, userIds);
    await pool.query(`DELETE FROM seat_holds WHERE user_id IN (${placeholders})`, userIds);
    await pool.query(`DELETE FROM waitlist WHERE user_id IN (${placeholders})`, userIds);
    await pool.query(`DELETE FROM bookings WHERE user_id IN (${placeholders})`, userIds);
    await pool.query(`DELETE FROM organizer_requests WHERE user_id IN (${placeholders})`, userIds);
    await pool.query(`DELETE FROM refresh_tokens WHERE user_id IN (${placeholders})`, userIds);
    await pool.query(`DELETE FROM events WHERE organizer_id IN (${placeholders})`, userIds);
    await pool.query(`DELETE FROM users WHERE id IN (${placeholders})`, userIds);
  }
}

async function runTests() {
  console.log("Starting full structured backend test...");
  try {
    await runMigrations();
    await cleanupDB();
    logTest("DB Cleanup", true, "Database migrated and test records cleared successfully");
  } catch (err) {
    logTest("DB Cleanup", false, err.message);
    process.exit(1);
  }

  const testUser = {
    username: "test_user_normal",
    email: "test_user_normal@example.com",
    password: "Password123!",
  };

  const testOrganizer = {
    username: "test_user_org",
    email: "test_user_org@example.com",
    password: "Password123!",
  };

  const testAdmin = {
    username: "test_user_admin",
    email: "test_user_admin@example.com",
    password: "Password123!",
  };

  let userToken = "";
  let userCookie = "";
  let orgToken = "";
  let adminToken = "";
  
  let organizerRequestId = "";
  let eventId = "";
  let holdId = "";
  let bookingId = "";
  let reviewId = "";

  // ==========================================
  // 1. AUTH FLOWS
  // ==========================================
  
  // Register Normal User
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    const data = await res.json();
    logTest("POST /api/auth/register (User)", res.status === 201 && data.success, `Status: ${res.status}`);
  } catch (err) {
    logTest("POST /api/auth/register (User)", false, err.message);
  }

  // Register Duplicate
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    logTest("POST /api/auth/register (Duplicate Error)", res.status === 400, `Status: ${res.status} (Expected 400)`);
  } catch (err) {
    logTest("POST /api/auth/register (Duplicate Error)", false, err.message);
  }

  // Register Organizer User
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testOrganizer),
    });
    logTest("POST /api/auth/register (Organizer)", res.status === 201, `Status: ${res.status}`);
  } catch (err) {
    logTest("POST /api/auth/register (Organizer)", false, err.message);
  }

  // Register Admin User
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testAdmin),
    });
    logTest("POST /api/auth/register (Admin)", res.status === 201, `Status: ${res.status}`);

    // Direct DB update to promote the admin user to ADMIN role
    await pool.query("UPDATE users SET role = 'ADMIN' WHERE username = ?", [testAdmin.username]);
    logTest("DB Admin Promotion", true, "Promoted admin test user directly in DB");
  } catch (err) {
    logTest("POST /api/auth/register (Admin)", false, err.message);
  }

  // Login Normal User
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testUser.email, password: testUser.password }),
    });
    const data = await res.json();
    userToken = data.accessToken;
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(/refreshToken=[^;]+/);
      if (match) userCookie = match[0];
    }
    logTest("POST /api/auth/login (User)", res.status === 200 && userToken, `Status: ${res.status}`);
  } catch (err) {
    logTest("POST /api/auth/login (User)", false, err.message);
  }

  // Login Organizer User
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testOrganizer.email, password: testOrganizer.password }),
    });
    const data = await res.json();
    orgToken = data.accessToken;
    logTest("POST /api/auth/login (Organizer)", res.status === 200 && orgToken, `Status: ${res.status}`);
  } catch (err) {
    logTest("POST /api/auth/login (Organizer)", false, err.message);
  }

  // Login Admin User
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testAdmin.email, password: testAdmin.password }),
    });
    const data = await res.json();
    adminToken = data.accessToken;
    logTest("POST /api/auth/login (Admin)", res.status === 200 && adminToken, `Status: ${res.status}`);
  } catch (err) {
    logTest("POST /api/auth/login (Admin)", false, err.message);
  }

  // GET Profile
  try {
    const res = await fetch(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const data = await res.json();
    logTest("GET /api/auth/profile (Authenticated)", res.status === 200 && data.success, `Username: ${data.user?.username}`);
  } catch (err) {
    logTest("GET /api/auth/profile (Authenticated)", false, err.message);
  }

  // GET Profile Unauthorized
  try {
    const res = await fetch(`${BASE_URL}/api/auth/profile`);
    logTest("GET /api/auth/profile (No Token Error)", res.status === 400, `Status: ${res.status} (Expected 400/401)`);
  } catch (err) {
    logTest("GET /api/auth/profile (No Token Error)", false, err.message);
  }

  // POST Refresh Token
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { Cookie: userCookie },
    });
    const data = await res.json();
    logTest("POST /api/auth/refresh", res.status === 200 && data.accessToken, `New Access Token returned`);
  } catch (err) {
    logTest("POST /api/auth/refresh", false, err.message);
  }

  // ==========================================
  // 2. ROLE REQUEST FLOWS
  // ==========================================

  // Create Role Request
  try {
    const res = await fetch(`${BASE_URL}/api/roles/request`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${orgToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason: "I want to host tech conferences" }),
    });
    const data = await res.json();
    organizerRequestId = data.data?.id;
    logTest("POST /api/roles/request", res.status === 201 && organizerRequestId, `Request ID: ${organizerRequestId}`);
  } catch (err) {
    logTest("POST /api/roles/request", false, err.message);
  }

  // Get Role Request Status
  try {
    const res = await fetch(`${BASE_URL}/api/roles/request/status`, {
      headers: { Authorization: `Bearer ${orgToken}` },
    });
    const data = await res.json();
    logTest("GET /api/roles/request/status", res.status === 200 && data.data?.status === "PENDING", `Status: ${data.data?.status}`);
  } catch (err) {
    logTest("GET /api/roles/request/status", false, err.message);
  }

  // ==========================================
  // 3. ADMIN ROLE FLOWS & APPROVAL
  // ==========================================

  // List Pending Role Requests (Admin)
  try {
    const res = await fetch(`${BASE_URL}/api/admin/role-requests`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    const hasRequest = data.data?.some(r => r.id === organizerRequestId);
    logTest("GET /api/admin/role-requests", res.status === 200 && hasRequest, `Found pending request in list`);
  } catch (err) {
    logTest("GET /api/admin/role-requests", false, err.message);
  }

  // Approve Role Request (Admin)
  try {
    const res = await fetch(`${BASE_URL}/api/admin/role-requests/${organizerRequestId}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logTest("PATCH /api/admin/role-requests/:id/approve", res.status === 200, `Approved Organizer Promotion`);
  } catch (err) {
    logTest("PATCH /api/admin/role-requests/:id/approve", false, err.message);
  }

  // Re-login Organizer to obtain ORGANIZER role claims
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testOrganizer.email, password: testOrganizer.password }),
    });
    const data = await res.json();
    orgToken = data.accessToken;
    logTest("Re-login Organizer for claims", res.status === 200 && data.data?.role === "ORGANIZER", `New Role Claim: ${data.data?.role}`);
  } catch (err) {
    logTest("Re-login Organizer for claims", false, err.message);
  }

  // ==========================================
  // 4. EVENT ENDPOINTS
  // ==========================================

  // Create Event (as Organizer)
  const eventDetails = {
    title: "Test Tech Conference 2026",
    description: "A comprehensive event for developers and engineering leaders.",
    location: "San Francisco City Hall",
    event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    price: 99.00,
    total_seats: 5, // small number to test seat exhaust/waitlist
  };

  try {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${orgToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventDetails),
    });
    const data = await res.json();
    eventId = data.data?.id;
    logTest("POST /api/events", res.status === 201 && eventId, `Event ID: ${eventId}`);
  } catch (err) {
    logTest("POST /api/events", false, err.message);
  }

  // Create Event as normal user (should fail or require approval flow? Oh, anybody can create, but event needs admin approval)
  // Let's verify event status is PENDING by default
  try {
    const [rows] = await pool.query("SELECT approval_status FROM events WHERE id = ?", [eventId]);
    logTest("Verify Event approval_status is PENDING", rows[0]?.approval_status === "PENDING", `Status: ${rows[0]?.approval_status}`);
  } catch (err) {
    logTest("Verify Event approval_status is PENDING", false, err.message);
  }

  // Approve Event by Admin
  try {
    const res = await fetch(`${BASE_URL}/api/admin/events/${eventId}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logTest("PATCH /api/admin/events/:id/approve", res.status === 200, `Approved event`);
  } catch (err) {
    logTest("PATCH /api/admin/events/:id/approve", false, err.message);
  }

  // Get All Events (should contain our approved event)
  try {
    const res = await fetch(`${BASE_URL}/api/events`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const data = await res.json();
    const hasEvent = data.data?.some(e => e.id === eventId);
    logTest("GET /api/events", res.status === 200 && hasEvent, `Found approved event in public listing`);
  } catch (err) {
    logTest("GET /api/events", false, err.message);
  }

  // Get Event By ID
  try {
    const res = await fetch(`${BASE_URL}/api/events/${eventId}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const data = await res.json();
    logTest("GET /api/events/:id", res.status === 200 && data.data?.id === eventId, `Fetched successfully`);
  } catch (err) {
    logTest("GET /api/events/:id", false, err.message);
  }

  // Update Event
  try {
    const res = await fetch(`${BASE_URL}/api/events/${eventId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${orgToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ price: 120.00 }),
    });
    logTest("PATCH /api/events/:id", res.status === 200, `Updated price successfully`);
  } catch (err) {
    logTest("PATCH /api/events/:id", false, err.message);
  }

  // ==========================================
  // 5. SEAT HOLD FLOWS
  // ==========================================

  // Create Seat Hold
  try {
    const res = await fetch(`${BASE_URL}/api/bookings/hold`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventId, seatsHeld: 2 }),
    });
    const data = await res.json();
    holdId = data.data?.holdId;
    logTest("POST /api/bookings/hold", res.status === 201 && holdId, `Hold ID: ${holdId}`);
  } catch (err) {
    logTest("POST /api/bookings/hold", false, err.message);
  }

  // Get Seat Hold Status
  try {
    const res = await fetch(`${BASE_URL}/api/bookings/hold/status?eventId=${eventId}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const data = await res.json();
    logTest("GET /api/bookings/hold/status", res.status === 200 && data.data?.holdId === holdId, `Seconds remaining: ${data.data?.secondsRemaining}`);
  } catch (err) {
    logTest("GET /api/bookings/hold/status", false, err.message);
  }

  // ==========================================
  // 6. BOOKING FLOWS
  // ==========================================

  // Book Seats using Seat Hold (Converting Seat Hold to Booking)
  try {
    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ holdId }),
    });
    const data = await res.json();
    bookingId = data.data?.id;
    logTest("POST /api/bookings (From Seat Hold)", res.status === 201 && bookingId, `Booking ID: ${bookingId}`);
  } catch (err) {
    logTest("POST /api/bookings (From Seat Hold)", false, err.message);
  }

  // Check seat counts after booking from hold. Total seats was 5. We held/booked 2. Remaining should be 3.
  try {
    const [rows] = await pool.query("SELECT available_seats FROM events WHERE id = ?", [eventId]);
    logTest("Verify Seats Decremented via Hold", rows[0]?.available_seats === 3, `Available Seats remaining: ${rows[0]?.available_seats}`);
  } catch (err) {
    logTest("Verify Seats Decremented via Hold", false, err.message);
  }

  // Standard Booking (without seat hold)
  let normalBookingId = "";
  try {
    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventId, seats_booked: 3 }), // books all remaining 3 seats
    });
    const data = await res.json();
    normalBookingId = data.data?.id;
    logTest("POST /api/bookings (Direct)", res.status === 201 && normalBookingId, `Booking ID: ${normalBookingId}`);
  } catch (err) {
    logTest("POST /api/bookings (Direct)", false, err.message);
  }

  // Check seats counts: now available seats should be 0.
  try {
    const [rows] = await pool.query("SELECT available_seats FROM events WHERE id = ?", [eventId]);
    logTest("Verify Seats Fully Booked", rows[0]?.available_seats === 0, `Available Seats remaining: ${rows[0]?.available_seats}`);
  } catch (err) {
    logTest("Verify Seats Fully Booked", false, err.message);
  }

  // Booking when seats are 0 (should fail)
  try {
    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventId, seats_booked: 1 }),
    });
    logTest("POST /api/bookings (Exhausted Error)", res.status === 400, `Status: ${res.status} (Expected 400)`);
  } catch (err) {
    logTest("POST /api/bookings (Exhausted Error)", false, err.message);
  }

  // GET User Bookings
  try {
    const res = await fetch(`${BASE_URL}/api/bookings`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const data = await res.json();
    const hasBooking = data.data?.some(b => b.id === bookingId);
    logTest("GET /api/bookings", res.status === 200 && hasBooking, `Found user booking in bookings list`);
  } catch (err) {
    logTest("GET /api/bookings", false, err.message);
  }

  // ==========================================
  // 7. WAITLIST FLOWS & PROMOTION
  // ==========================================

  // Join waitlist since available_seats = 0
  try {
    const res = await fetch(`${BASE_URL}/api/waitlist/${eventId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
    });
    logTest("POST /api/waitlist/:eventId", res.status === 201, `Joined waitlist successfully`);
  } catch (err) {
    logTest("POST /api/waitlist/:eventId", false, err.message);
  }

  // Check waitlist position
  try {
    const res = await fetch(`${BASE_URL}/api/waitlist/${eventId}/position`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const data = await res.json();
    logTest("GET /api/waitlist/:eventId/position", res.status === 200 && data.data?.position === 1, `Queue position: ${data.data?.position}`);
  } catch (err) {
    logTest("GET /api/waitlist/:eventId/position", false, err.message);
  }

  // Cancel booking to trigger waitlist notification/promotion
  try {
    const res = await fetch(`${BASE_URL}/api/bookings/${normalBookingId}/cancel`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${userToken}` },
    });
    logTest("PATCH /api/bookings/:id/cancel", res.status === 200, `Cancelled booking successfully`);
  } catch (err) {
    logTest("PATCH /api/bookings/:id/cancel", false, err.message);
  }

  // Verify waitlist status is now NOTIFIED
  try {
    const res = await fetch(`${BASE_URL}/api/waitlist/${eventId}/position`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const data = await res.json();
    logTest("Verify Waitlist Promotion status", res.status === 200 && data.data?.status === "NOTIFIED", `New Status: ${data.data?.status}`);
  } catch (err) {
    logTest("Verify Waitlist Promotion status", false, err.message);
  }

  // Leave Waitlist (DELETE)
  try {
    const res = await fetch(`${BASE_URL}/api/waitlist/${eventId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${userToken}` },
    });
    logTest("DELETE /api/waitlist/:eventId", res.status === 200, `Left waitlist successfully`);
  } catch (err) {
    logTest("DELETE /api/waitlist/:eventId", false, err.message);
  }

  // ==========================================
  // 8. REVIEWS FLOW
  // ==========================================

  // Attempting to review an event date in the future (should fail)
  try {
    const res = await fetch(`${BASE_URL}/api/reviews`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventId, rating: 5, comment: "Amazing!" }),
    });
    logTest("POST /api/reviews (Future Event Error)", res.status === 403, `Status: ${res.status} (Expected 403)`);
  } catch (err) {
    logTest("POST /api/reviews (Future Event Error)", false, err.message);
  }

  // Directly adjust event date in DB to past date (e.g. 1 day ago) to permit review testing
  try {
    await pool.query("UPDATE events SET event_date = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE id = ?", [eventId]);
    logTest("DB Event Date Manipulation", true, "Changed event date to past for review validation");

    const [[dbUser]] = await pool.query("SELECT id FROM users WHERE username = ?", [testUser.username]);
    const normalUserId = dbUser.id;
  } catch (err) {
    logTest("DB Event Date Manipulation", false, err.message);
  }

  // Review the past event (should succeed)
  try {
    const res = await fetch(`${BASE_URL}/api/reviews`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventId, rating: 5, comment: "Excellent event and location!" }),
    });
    const data = await res.json();
    reviewId = data.data?.id;
    logTest("POST /api/reviews (Past Event)", res.status === 201 && reviewId, `Review ID: ${reviewId}`);
  } catch (err) {
    logTest("POST /api/reviews (Past Event)", false, err.message);
  }

  // GET Event Reviews
  try {
    const res = await fetch(`${BASE_URL}/api/reviews/event/${eventId}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const data = await res.json();
    logTest("GET /api/reviews/event/:id", res.status === 200 && data.data?.reviews?.length > 0, `Avg Rating: ${data.data?.stats?.averageRating}, Reviews Count: ${data.data?.reviews?.length}`);
  } catch (err) {
    logTest("GET /api/reviews/event/:id", false, err.message);
  }

  // DELETE Review
  try {
    const res = await fetch(`${BASE_URL}/api/reviews/${reviewId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${userToken}` },
    });
    logTest("DELETE /api/reviews/:id", res.status === 204 || res.status === 200, `Review deleted successfully`);
  } catch (err) {
    logTest("DELETE /api/reviews/:id", false, err.message);
  }

  // ==========================================
  // 9. ADMIN GLOBAL STATS
  // ==========================================

  // GET Admin Stats
  try {
    const res = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    logTest("GET /api/admin/stats", res.status === 200 && data.data?.totalUsers !== undefined, `Total users in DB stats: ${data.data?.totalUsers}`);
  } catch (err) {
    logTest("GET /api/admin/stats", false, err.message);
  }

  // Clean up
  try {
    await cleanupDB();
    logTest("Post-test DB Cleanup", true, "Cleared temporary records successfully");
  } catch (err) {
    logTest("Post-test DB Cleanup", false, err.message);
  }

  // Print Summary Table
  console.log("\n=========================================");
  console.log("             TEST RESULTS SUMMARY         ");
  console.log("=========================================");
  console.table(results.map(r => ({ Endpoint: r.name, Success: r.status ? "✅ PASS" : "❌ FAIL", Details: r.details })));

  const allPassed = results.every(r => r.status);
  console.log(`\nFinal result: ${allPassed ? "ALL TESTS PASSED 🎉" : "SOME TESTS FAILED ❌"}`);
  
  process.exit(allPassed ? 0 : 1);
}

runTests();
