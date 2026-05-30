import { pool } from "../../database/db.js"

export const userExists = async(email)=>
{
    const [rows] = await pool.query("SELECT * FROM users where email = ?" , [email]);
    // console.log("existsrow",rows);
    // console.log("existresult" , result);
    return rows;
}

export const createUser = async(username ,email , password)=>
{
    const [rows] = await pool.query("INSERT INTO users (username , email , password) VALUES (?,?,?)" , [username , email , password]);
    // console.log("createrow" ,rows);
    // console.log("createrow" , result);
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