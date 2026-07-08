import { pool } from "../database/db.js";
import { runMigrations } from "./migration.js";

const BASE_URL = "http://localhost:5000";

async function runNotificationsTest() {
  console.log("Starting Notifications API tests...");

  try 
  {
    await runMigrations();
    await pool.query("DELETE FROM users WHERE email = 'test_notif_user@example.com'");

    const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "test_notif_user",
        email: "test_notif_user@example.com",
        password: "Password123!"
      })
    });
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test_notif_user@example.com",
        password: "Password123!"
      })
    });
    
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginData.message}`);
    }
    
    const token = loginData.accessToken;
    const userId = loginData.data.id;

    await pool.query(
      "INSERT INTO notifications (id, user_id, title, message, type) VALUES ('test-notif-uuid', ?, 'Test Title', 'Test Msg', 'booking')",
      [userId]
    );
    
    const listRes = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const listData = await listRes.json();
    if (!listRes.ok) {
      throw new Error(`Fetch notifications failed: ${listData.message}`);
    }
    console.log(`[SUCCESS] Fetch notifications returned ${listData.data.length} items`);

    const readAllRes = await fetch(`${BASE_URL}/api/notifications/read-all`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const readAllData = await readAllRes.json();
    if (!readAllRes.ok) {
      throw new Error(`Mark all read failed: ${readAllData.message}`);
    }
    console.log("[SUCCESS] Mark all read completed successfully");

    const checkRes = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const checkData = await checkRes.json();
    const unreadCount = checkData.data.filter(n => !n.is_read).length;
    if (unreadCount !== 0) {
      throw new Error(`Expected 0 unread notifications, got ${unreadCount}`);
    }
    console.log("[SUCCESS] Verified all notifications are marked as read");

    await pool.query("DELETE FROM users WHERE email = 'test_notif_user@example.com'");
    console.log("\nALL NOTIFICATIONS UNIT TESTS PASSED 🎉");
  } catch (err) {
    console.error(`[FAILURE] ${err.message}`);
    process.exit(1);
  }
}

runNotificationsTest();
