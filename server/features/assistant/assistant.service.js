import { pool } from "../../database/db.js";

export const generateAssistantReply = async (prompt, userId) => {
  const query = (prompt || "").toLowerCase().trim();

  let user = null;
  let bookings = [];
  let holds = [];
  let waitlists = [];

  if (userId) {
    try {
      const [uRows] = await pool.query("SELECT username, email, role FROM users WHERE id = ?", [userId]);
      if (uRows.length > 0) {
        user = uRows[0];
      }
      
      const [bRows] = await pool.query(
        "SELECT b.id, e.title, b.ticket_count FROM bookings b JOIN events e ON b.event_id = e.id WHERE b.user_id = ? AND b.booking_status = 'CONFIRMED'",
        [userId]
      );
      bookings = bRows;

      const [hRows] = await pool.query(
        "SELECT h.id, e.title, h.seats_held, h.expires_at FROM seat_holds h JOIN events e ON h.event_id = e.id WHERE h.user_id = ? AND h.expires_at > NOW()",
        [userId]
      );
      holds = hRows;

      const [wRows] = await pool.query(
        "SELECT w.id, e.title, w.queue_position, w.status FROM waitlist w JOIN events e ON w.event_id = e.id WHERE w.user_id = ? AND w.status = 'PENDING'",
        [userId]
      );
      waitlists = wRows;
    } catch (err) {
      console.error("Assistant data query failed:", err);
    }
  }

  if (query.includes("booking") || query.includes("ticket") || query.includes("active")) {
    if (!userId) {
      return "To check your active bookings, please sign in to your Eventra account.";
    }
    if (bookings.length === 0) {
      return `Hi ${user.username}, you don't have any active bookings at the moment. You can browse and check out events on our Explore page!`;
    }
    const list = bookings.map(b => `• "${b.title}" (${b.ticket_count} seats)`).join("\n");
    return `Hi ${user.username}, you currently have ${bookings.length} active booking(s):\n${list}\n\nYou can view and print your ticket stubs from your Dashboard.`;
  }

  if (query.includes("hold") || query.includes("reserve") || query.includes("lock") || query.includes("countdown")) {
    if (userId && holds.length > 0) {
      const list = holds.map(h => `• "${h.title}" (${h.seats_held} seats)`).join("\n");
      return `I see you have an active seat reservation hold:\n${list}\n\nYou have 5 minutes from reservation time to complete payment before seats are released back to the general capacity.`;
    }
    return "When you reserve seats, Eventra locks them for 5 minutes. During this period, you must complete your payment inside the checkout modal, or the seats will be released back to the event pool.";
  }

  if (query.includes("waitlist") || query.includes("queue") || query.includes("position")) {
    if (!userId) {
      return "Please sign in to check your waitlist queues.";
    }
    if (waitlists.length === 0) {
      return `Hi ${user.username}, you are not currently on any event waitlists. If an event is sold out, you can join its waitlist to be automatically promoted if seats become available.`;
    }
    const list = waitlists.map(w => `• "${w.title}" (Queue Position: #${w.queue_position})`).join("\n");
    return `Hi ${user.username}, here is your current waitlist status:\n${list}\n\nIf a booking is cancelled, waitlisted users are promoted in order and notified immediately via email.`;
  }

  if (query.includes("host") || query.includes("organizer") || query.includes("promote") || query.includes("role")) {
    if (!userId) {
      return "To host events, create an account, go to Profile settings, and submit a Host Promotion Request.";
    }
    if (user.role === "ORGANIZER" || user.role === "ADMIN") {
      return `You already have ${user.role} privileges! You can manage events, edit ticket parameters, and check sales analytics on your Dashboard.`;
    }
    return `Hi ${user.username}, you are currently a standard USER. To host your own events, go to the "Settings" tab in your profile, click "Request Host Promotion", and wait for Admin approval.`;
  }

  if (query.includes("cancel") || query.includes("refund") || query.includes("delete")) {
    return "You can cancel any active booking from your Dashboard. When a ticket is cancelled, the event capacity increments, and waitlisted members are promoted. Refunds are processed automatically.";
  }

  if (query.includes("hi") || query.includes("hello") || query.includes("hey") || query.includes("help") || query.includes("support")) {
    const greeting = user ? `Hi ${user.username}! ` : "Hello! ";
    return `${greeting}I'm the Eventra Virtual Assistant. I can help you with:\n\n• Checking your active bookings/tickets\n• Explaining seat holds & reservations\n• Checking waitlist queue status\n• Getting organizer or host role credentials\n• Explaining cancellations & ticket refunds\n\nWhat can I help you with today?`;
  }

  return "I'm not sure I fully understand. You can ask me about your bookings, ticket holds, waitlist statuses, or how to become a host!";
};
