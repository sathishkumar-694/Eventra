import { pool } from "../database/db.js";

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

    await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) NOT NULL,
            is_read TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
};
