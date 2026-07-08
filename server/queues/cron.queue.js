import { Queue, Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { pool } from "../database/db.js";
import { emailQueue } from "./email.queue.js";

const QUEUE_NAME = "cron";

export const cronQueue = new Queue(QUEUE_NAME, {connection: redisConnection,});

if (process.env.ENABLE_WORKERS === "true") {
  const cronWorker = new Worker(
    QUEUE_NAME,
    async (job) => {
      console.log(`Processing cron job: ${job.name}`);
      if (job.name === "hourly-reminders") {
        const [events] = await pool.query(
          "SELECT * FROM events WHERE approval_status = 'APPROVED' AND reminder_sent = 0 AND event_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)"
        );

        for (const event of events) {
          const [bookings] = await pool.query(
            "SELECT b.*, u.email, u.username FROM bookings b JOIN users u ON b.user_id = u.id WHERE b.event_id = ? AND b.booking_status IN ('CONFIRMED', 'BOOKED')",
            [event.id]
          );

          for (const booking of bookings) {
            await emailQueue.add(
              "send-email",
              {
                type: "event-reminder",
                to: booking.email,
                payload: {
                  username: booking.username,
                  eventTitle: event.title,
                  eventDate: event.event_date,
                  location: event.location,
                },
              },
              {
                removeOnComplete: true,
                removeOnFail: true,
              }
            ).catch((err) => {
              console.error(`Failed to enqueue reminder email for booking ${booking.id}: ${err.message}`);
            });
          }

          await pool.query("UPDATE events SET reminder_sent = 1 WHERE id = ?", [event.id]);
          console.log(`Event reminder processed and marked sent for event ${event.id}`);
        }
      } else if (job.name === "daily-cleanup") {
        await pool.query(
          "UPDATE events SET approval_status = 'EXPIRED' WHERE event_date < NOW() AND approval_status = 'APPROVED'"
        );
        console.log("Cleaned up/expired past events");

        const [expiredHolds] = await pool.query(
          "SELECT * FROM seat_holds WHERE expires_at < NOW()"
        );

        for (const hold of expiredHolds) {
          const conn = await pool.getConnection();
          try {
            await conn.beginTransaction();
            const [res] = await conn.query("DELETE FROM seat_holds WHERE id = ?", [hold.id]);
            if (res.affectedRows > 0) {
              await conn.query("UPDATE events SET available_seats = available_seats + ? WHERE id = ?", [
                hold.seats_held,
                hold.event_id,
              ]);
            }
            await conn.commit();
            console.log(`Released expired hold ${hold.id} and restored ${hold.seats_held} seats for event ${hold.event_id}`);
          } catch (err) {
            await conn.rollback();
            console.error(`Failed to release expired seat hold ${hold.id}: ${err.message}`);
          } finally {
            conn.release();
          }
        }

        await pool.query("DELETE FROM waitlist WHERE status = 'EXPIRED'");
        console.log("Purged expired waitlist promotions");
      }
    },
    {
      connection: redisConnection,
    }
  );

  cronWorker.on("error", (err) => {
    console.error("Cron worker connection error:", err.message);
  });
}

export const initScheduler = async () => {
  if (process.env.ENABLE_WORKERS !== "true") {
    console.log("Workers disabled — skipping scheduler registration.");
    return;
  }

  try {
    const repeatableJobs = await cronQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await cronQueue.removeRepeatableByKey(job.key);
    }

    await cronQueue.add(
      "hourly-reminders",
      {},
      {
        repeat: { pattern: "0 * * * *" },
      }
    );

    await cronQueue.add(
      "daily-cleanup",
      {},
      {
        repeat: { pattern: "0 0 * * *" },
      }
    );

    console.log("Repeatable cron jobs registered successfully.");
  } catch (err) {
    console.error(`Failed to register repeatable cron jobs: ${err.message}`);
  }
};
