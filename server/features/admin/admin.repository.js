import {pool} from "../../database/db.js";

export const getAllEventsRepository = async () => {
  const [rows] = await pool.query("SELECT * FROM events");
  return rows;
};

export const getEventByIdRepository = async(id)=>
{
  const [rows , fields] = await pool.query("SELECT * FROM events where id = ?" , id);
  
  return rows;
}
export const getAllPendingEventsRepository = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM events WHERE approval_status = ?",
    ["PENDING"],
  );
  return rows;
};


export const getApprovedEventsRepository = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM events WHERE approval_status = ?",
    ["APPROVED"],
  );
  return rows;
};

export const getRejectedEventsRepository = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM events WHERE approval_status = ?",
    ["REJECTED"],
  );
  return rows;
};

export const approveEventsRepository = async (id, adminId) => {
  const [rows , fields] = await pool.query(
    "UPDATE events SET approval_status = ? , approved_by = ? where id = ? ",
    ["APPROVED", adminId, id],
  );
  console.log("repo approve"  ,rows);
  return rows;
};

export const rejectEventsRepository = async (id, reason, adminId) => {
  const [rows , fields] = await pool.query(
    "UPDATE events SET approval_status = ? , rejection_reason = ?, approved_by = ? where id = ?",
    ["REJECTED", reason, adminId, id],
  );
  return rows;
};
