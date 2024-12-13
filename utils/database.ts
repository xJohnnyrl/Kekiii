import sqlite3 from "sqlite3";
import type { Database, AsyncDatabase } from "@/interfaces/database";

// Initialize the database connection
const db = new sqlite3.Database(
  process.env.DEPLOYMENT_ENV === "dev" ? "./main.db" : "app/main.db",
  (err) => {
    if (err) {
      console.error("Error connecting to the database:", err.message);
    } else {
      console.log("Connected to SQLite database.");
    }
  }
);

const dbAsync: AsyncDatabase = {
  get<T>(sql: string, params: any = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row as T);
      });
    });
  },
  run(sql: string, params: any = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(sql, params, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  },
};

export default dbAsync;

const initializeDatabase = () => {
  // Users Table
  db.run(`
      CREATE TABLE IF NOT EXISTS profiles (
        user_id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        exp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

  console.log("Database initialized successfully.");
};

// Call the initialize function
initializeDatabase();
