import { Queue, Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { pool } from "../database/db.js";
import { getSeatHoldByIdRepository, deleteSeatHoldRepository } from "../features/bookings/seat-hold.repository.js";
import { incrementSeats } from "../features/bookings/booking.repository.js";

const QUEUE_NAME = "seat-hold";

export const seatHoldQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
});

export const seatHoldWorker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { holdId } = job.data;
    console.log(`Processing seat hold expiry job for ID: ${holdId}`);

    const holds = await getSeatHoldByIdRepository(holdId);
    if (holds.length === 0) {
      console.log(`Hold ${holdId} no longer exists. Probably converted to booking or cancelled.`);
      return;
    }

    const hold = holds[0];
    
    if (new Date(hold.expires_at) > new Date()) {
      console.log(`Hold ${holdId} is not expired yet. Skipping.`);
      return;
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await deleteSeatHoldRepository(conn, holdId);

      await incrementSeats(conn, hold.event_id, hold.seats_held);

      await conn.commit();
      console.log(`Successfully expired seat hold ${holdId} and restored ${hold.seats_held} seats to event ${hold.event_id}`);
    } catch (err) {
      await conn.rollback();
      console.error(`Failed to process seat hold expiry transaction: ${err.message}`);
      throw err;
    } finally {
      conn.release();
    }
  },
  {
    connection: redisConnection,
  }
);

seatHoldWorker.on("completed", (job) => {
  console.log(`Seat hold job ${job.id} processed successfully`);
});

seatHoldWorker.on("failed", (job, err) => {
  console.error(`Seat hold job ${job?.id} failed: ${err.message}`);
});
