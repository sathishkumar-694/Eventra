import assert from "assert";
import {
  getBookingConfirmationTemplate,
  getBookingCancellationTemplate,
  getEventApprovalTemplate,
  getRoleApprovalTemplate,
  getWaitlistNotificationTemplate,
  getEventReminderTemplate,
} from "../services/mail.service.js";
import { redisConnection } from "../config/redis.js";

async function runQueueUnitTests() {
  console.log("Starting queue and email template unit tests...");

  // 1. Verify Redis Config is parsed correctly
  try {
    assert.strictEqual(typeof redisConnection.host, "string", "Redis host should be a string");
    assert.strictEqual(typeof redisConnection.port, "number", "Redis port should be a number");
    console.log("[SUCCESS] Redis Configuration verified.");
  } catch (err) {
    console.error("[FAILURE] Redis Configuration verification failed:", err.message);
    process.exit(1);
  }

  // 2. Verify Email Templates compilation
  try {
    const confirmHtml = getBookingConfirmationTemplate("John Doe", "Tech Summit", 2, 100);
    assert.ok(confirmHtml.includes("John Doe"), "Booking confirmation must include username");
    assert.ok(confirmHtml.includes("Tech Summit"), "Booking confirmation must include event title");
    assert.ok(confirmHtml.includes("2"), "Booking confirmation must include seats");
    assert.ok(confirmHtml.includes("$100"), "Booking confirmation must include total amount");

    const cancelHtml = getBookingCancellationTemplate("John Doe", "Tech Summit", 2);
    assert.ok(cancelHtml.includes("cancelled"), "Booking cancellation template mismatch");

    const eventApproveHtml = getEventApprovalTemplate("John Doe", "Tech Summit", "APPROVED");
    assert.ok(eventApproveHtml.includes("approved"), "Event status template mismatch");

    const roleApproveHtml = getRoleApprovalTemplate("John Doe", "APPROVED");
    assert.ok(roleApproveHtml.includes("organizer panel"), "Role status template mismatch");
    
    const waitlistHtml = getWaitlistNotificationTemplate("John Doe", "Tech Summit");
    assert.ok(waitlistHtml.includes("30 minutes"), "Waitlist notification must warn user about 30 min limit");

    const reminderHtml = getEventReminderTemplate("John Doe", "Tech Summit", new Date(), "Room A");
    assert.ok(reminderHtml.includes("John Doe"), "Reminder template must include username");
    assert.ok(reminderHtml.includes("Tech Summit"), "Reminder template must include event title");
    assert.ok(reminderHtml.includes("Room A"), "Reminder template must include location");

    console.log("[SUCCESS] All HTML email templates verified successfully.");
  } catch (err) {
    console.error("[FAILURE] Email Template verification failed:", err.message);
    process.exit(1);
  }

  console.log("\nALL QUEUE UNIT TESTS PASSED 🎉");
  process.exit(0);
}

runQueueUnitTests();
