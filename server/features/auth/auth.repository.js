import { pool } from "../../database/db.js"

export const userExists = async(email)=>
{
    const [rows] = await pool.query("SELECT id FROM users where email = ?" , [email]);
    return rows;
}

export const createUser = async(username ,email , password)=>
{
    const [rows] = await pool.query("INSERT INTO users (username , email , password) VALUES (?,?,?)" , [username , email , password]);
    return rows;
}