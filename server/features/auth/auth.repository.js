import { pool } from "../../database/db.js"

export const userExists = async(email)=>
{
    const [rows] = await pool.query("SELECT * FROM users where email = ?" , [email]);
    return rows;
}

export const createUser = async(id , username ,email , password)=>
{
    const [rows] = await pool.query("INSERT INTO users (id , username , email , password) VALUES (?,?,?,?)" , [id ,username , email , password]);
    return rows;
}

export const findUserById = async(id)=>
{
    const [rows] = await pool.query(
        "SELECT * FROM users WHERE id = ?",
        [id]
    );

    console.log(rows[0]);

    return rows[0];
}