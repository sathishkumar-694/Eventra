import { pool } from "../../database/db.js";


export const createRoleRequestRepository = async (requestId, userId, reason) => {
  await ensureRoleRequestsTable();

  const [result] = await pool.execute(
    "INSERT INTO role_requests (id, user_id, reason, status) VALUES (?, ?, ?, 'PENDING')",
    [requestId, userId, reason]
  );

  return result;
};

export const getRoleRequestByUserRepository = async (userId) => {
  await ensureRoleRequestsTable();

  const [result] = await pool.execute(
    "SELECT * FROM role_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
    [userId]
  );

  return result;
};
