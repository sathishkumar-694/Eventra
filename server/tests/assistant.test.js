import { pool } from "../database/db.js";
import { runMigrations } from "./migration.js";

const BASE_URL = "http://localhost:5000";

async function runAssistantTest() {
  console.log("Starting Assistant API tests...");
  
  try {
    await runMigrations();
    await pool.query("DELETE FROM users WHERE email = 'assistant_test@example.com'");

    const guestRes = await fetch(`${BASE_URL}/api/assistant/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "explain seat holds" })
    });
    
    const guestData = await guestRes.json();
    if (!guestRes.ok) {
      throw new Error(`Guest chat failed: ${guestData.message}`);
    }
    if (!guestData.reply.toLowerCase().includes("lock")) {
      throw new Error(`Expected seat hold advice in response, got: ${guestData.reply}`);
    }
    console.log("[SUCCESS] Guest seat hold advice verified successfully");

    const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "assistant_user",
        email: "assistant_test@example.com",
        password: "Password123!"
      })
    });
    const regData = await registerRes.json();
    if (!registerRes.ok) {
      throw new Error(`Register failed: ${regData.message}`);
    }

    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "assistant_test@example.com",
        password: "Password123!"
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.accessToken;
    const userId = loginData.data.id;

    await pool.query(
      "INSERT INTO notifications (id, user_id, title, message, type) VALUES ('assistant-notif-uuid', ?, 'Assistant Notif', 'Test Msg', 'booking')",
      [userId]
    );

    const userRes = await fetch(`${BASE_URL}/api/assistant/chat`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ message: "Show my bookings" })
    });
    const userData = await userRes.json();
    if (!userRes.ok) {
      throw new Error(`Auth chat failed: ${userData.message}`);
    }
    if (!userData.reply.includes("don't have any active bookings")) {
      throw new Error(`Expected booking details in response, got: ${userData.reply}`);
    }
    console.log("[SUCCESS] Auth personal assistant query verified successfully");

    await pool.query("DELETE FROM users WHERE email = 'assistant_test@example.com'");
    console.log("\nALL ASSISTANT UNIT TESTS PASSED 🎉");
  } catch (err) {
    console.error(`[FAILURE] ${err.message}`);
    process.exit(1);
  }
}

runAssistantTest();
