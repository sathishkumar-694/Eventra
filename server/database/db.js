import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const pool = mysql.createPool({
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

export const runMigrations = async () => {
    const [columns] = await pool.query(
        "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'events' AND COLUMN_NAME = 'reminder_sent'",
        [process.env.DB_NAME]
    );
    if (columns.length === 0) {
        await pool.query("ALTER TABLE events ADD COLUMN reminder_sent TINYINT(1) DEFAULT 0");
    }

    const [categoryColumn] = await pool.query(
        "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'events' AND COLUMN_NAME = 'category'",
        [process.env.DB_NAME]
    );
    if (categoryColumn.length === 0) {
        await pool.query("ALTER TABLE events ADD COLUMN category VARCHAR(50) DEFAULT 'General'");
    }
};