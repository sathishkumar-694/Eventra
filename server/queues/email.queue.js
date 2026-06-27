import { Queue, Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import {
  sendEmail,
  getBookingConfirmationTemplate,
  getBookingCancellationTemplate,
  getEventApprovalTemplate,
  getRoleApprovalTemplate,
  getWaitlistNotificationTemplate,
  getEventReminderTemplate,
} from "../services/mail.service.js";

const QUEUE_NAME = "email";

export const emailQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
});

export const emailWorker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { type, to, payload } = job.data;
    console.log(`Processing email job: ${job.id} (Type: ${type}, To: ${to})`);

    let subject = "";
    let html = "";

    switch (type) {
      case "booking-confirmation":
        subject = "Booking Confirmed - Eventra";
        html = getBookingConfirmationTemplate(
          payload.username,
          payload.eventTitle,
          payload.seats,
          payload.price
        );
        break;

      case "booking-cancellation":
        subject = "Booking Cancelled - Eventra";
        html = getBookingCancellationTemplate(
          payload.username,
          payload.eventTitle,
          payload.seats
        );
        break;

      case "event-status":
        subject = `Event Approval Status: ${payload.status} - Eventra`;
        html = getEventApprovalTemplate(
          payload.organizerName,
          payload.eventTitle,
          payload.status,
          payload.reason
        );
        break;

      case "role-status":
        subject = `Organizer Role Request: ${payload.status} - Eventra`;
        html = getRoleApprovalTemplate(
          payload.username,
          payload.status,
          payload.reason
        );
        break;

      case "waitlist-notify":
        subject = "Seat Available! Complete your booking - Eventra";
        html = getWaitlistNotificationTemplate(
          payload.username,
          payload.eventTitle
        );
        break;

      case "event-reminder":
        subject = `Reminder: ${payload.eventTitle} is starting soon! - Eventra`;
        html = getEventReminderTemplate(
          payload.username,
          payload.eventTitle,
          payload.eventDate,
          payload.location
        );
        break;

      default:
        console.error(`Unknown email job type: ${type}`);
        return;
    }

    await sendEmail(to, subject, html);
  },
  {
    connection: redisConnection,
  }
);

emailWorker.on("completed", (job) => {
  console.log(`Email job ${job.id} completed successfully`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`Email job ${job?.id} failed: ${err.message}`);
});
