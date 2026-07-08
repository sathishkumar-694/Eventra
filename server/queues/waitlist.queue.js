import { Queue, Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { pool } from "../database/db.js";
import { notifyWaitlistService } from "../features/waitlist/waitlist.service.js";

const QUEUE_NAME = "waitlist";

export const waitlistQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
});

waitlistQueue.on("error", (err) => {
  console.error("Waitlist queue connection error:", err.message);
});

if (process.env.ENABLE_WORKERS === "true") {
  const waitlistWorker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { waitlistId, eventId } = job.data;
      console.log(`Processing waitlist notification timeout for entry: ${waitlistId}`);

      const [rows] = await pool.execute(
        "SELECT * FROM waitlist WHERE id = ?",
        [waitlistId]
      );

      if (rows.length === 0) {
        console.log(`Waitlist entry ${waitlistId} no longer exists. User likely completed the booking.`);
        return;
      }

      const entry = rows[0];
      if (entry.status !== "NOTIFIED") {
        console.log(`Waitlist entry ${waitlistId} status is ${entry.status}. No timeout actions needed.`);
        return;
      }

      await pool.execute("DELETE FROM waitlist WHERE id = ?", [waitlistId]);
      console.log(`Waitlist entry ${waitlistId} timed out. Removed user ${entry.user_id} from waitlist.`);

      await notifyWaitlistService(eventId);
    },
    {
      connection: redisConnection,
    }
  );

  waitlistWorker.on("error", (err) => {
    console.error("Waitlist worker connection error:", err.message);
  });

  waitlistWorker.on("completed", (job) => {
    console.log(`Waitlist timeout job ${job.id} processed successfully`);
  });

  waitlistWorker.on("failed", (job, err) => {
    console.error(`Waitlist timeout job ${job?.id} failed: ${err.message}`);
  });
}
