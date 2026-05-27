import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    connectionLimit: Number(process.env.CONNECTIONLIMIT)
});

export const testDB = async () => {
    const [rows] = await pool.query("SELECT 1");
    return rows;

};