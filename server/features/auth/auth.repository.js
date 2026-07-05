import { pool } from "../../database/db.js"

export const userExists = async(email) => {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    return rows;
}

export const usernameExists = async(username) => {
    const [rows] = await pool.query("SELECT id FROM users WHERE username = ?", [username]);
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
    return rows[0];
}

export const saveRefreshTokenRepository = async (id, userId, token, expiresAt) => {
    const [result] = await pool.query(
        "INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)",
        [id, userId, token, expiresAt]
    );
    return result;
}

export const findRefreshTokenRepository = async (token) => {
    const [rows] = await pool.query(
        "SELECT * FROM refresh_tokens WHERE token = ?",
        [token]
    );
    return rows[0];
}

export const deleteRefreshTokenRepository = async (token) => {
    const [result] = await pool.query(
        "DELETE FROM refresh_tokens WHERE token = ?",
        [token]
    );
    return result;
}

export const updateUserRepository = async (id, fields) => {
    const keys = [];
    const values = [];
    Object.entries(fields).forEach(([key, value]) => {
        keys.push(`${key} = ?`);
        values.push(value);
    });
    values.push(id);
    const [result] = await pool.query(
        `UPDATE users SET ${keys.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
    );
    return result;
}