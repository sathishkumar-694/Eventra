import { pool } from "./database/db.js";

async function run() {
  const [users] = await pool.query("SELECT * FROM users WHERE email = 'test_user_org@example.com'");
  console.log("Users:", users);
  const [requests] = await pool.query("SELECT * FROM organizer_requests");
  console.log("Organizer Requests:", requests);
  process.exit(0);
}

run();
