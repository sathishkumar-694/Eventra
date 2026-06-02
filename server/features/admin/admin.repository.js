import pool from "../../database/db.js"

export const getAllEventsRepository = async()=>
{
    const [rows] = await pool.query("SELECT * FROM events");
    return rows;
}

export const getAllPendingEventsRepository = async()=>
{
    const [rows] = await pool.query("SELECT * FROM events WHERE approval_status = ?" , ["PENDING"]);
    return rows;
}

export const getApprovedEventsRepository = async()=>
{
    const [rows] = await pool.query("SELECT * FROM events WHERE approval_status = ?" , ["APPROVED"]);
    return rows;
}

export const getRejectedEventsRepository = async()=>
{
    const [rows] = await pool.query("SELECT * FROM events WHERE approval_status = ?" , ["REJECTED"]);
    return rows;
}

export const approveEventsRepository = async(id , adminId)=>{
    const [rows] = await pool.query("UPDATE events SET approval_status = ? , approved_by = ? where id = ? ", [ "APPROVED",adminId , id]);
    return rows;
}

export const rejectEventsRepository = async(id , reason)=>{
    const [rows] = await pool.query("UPDATE events SET approval_status = ? , rejection_reason = ? where id = ?", ["REJECTED" ,reason , id]);
    return rows;
}