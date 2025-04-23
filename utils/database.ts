import { Database } from "bun:sqlite";
import type { AsyncDatabase } from "@/interfaces/database";

let dbAsync: AsyncDatabase;

// Skip database initialization if we're just registering commands
if (process.env.COMMAND_REGISTRATION === "true") {
  console.log("Skipping database initialization for command registration");
  dbAsync = {
    get: <T>() => Promise.resolve({} as T),
    all: <T>() => Promise.resolve([] as T[]),
    run: () => Promise.resolve(),
  };
} else {
  // Initialize the database connection
  const dbPath =
    process.env.DEPLOYMENT_ENV === "dev" ? "./main.db" : "/app/main.db";

  let db: Database;
  try {
    db = new Database(dbPath);
    console.log("Connected to SQLite database.");
  } catch (error) {
    console.error("Error connecting to database:", error);
    throw error;
  }

  dbAsync = {
    get<T>(sql: string, params: any = {}): Promise<T> {
      return new Promise((resolve) => {
        const stmt = db.prepare(sql);
        const row = stmt.get(params) as T;
        resolve(row);
      });
    },
    all<T>(sql: string, params: any = {}): Promise<T[]> {
      return new Promise((resolve) => {
        const stmt = db.prepare(sql);
        const rows = stmt.all(params) as T[];
        resolve(rows);
      });
    },
    run(sql: string, params: any = {}): Promise<void> {
      return new Promise((resolve) => {
        const stmt = db.prepare(sql);
        stmt.run(params);
        resolve();
      });
    },
  };

  const initializeDatabase = () => {
    // Users Table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        joined_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    
      CREATE TABLE IF NOT EXISTS profiles (
        user_id TEXT PRIMARY KEY,
        level INTEGER DEFAULT 1,
        balance_konpeito INTEGER DEFAULT 0,
        balance_sugar_cubes INTEGER DEFAULT 0,
        xp INTEGER DEFAULT 0,
        profile_picture TEXT,
        total_voice_time INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      );

      CREATE TABLE IF NOT EXISTS voice_sessions (
        user_id TEXT,
        joined_at DATETIME,
        PRIMARY KEY(user_id)
      );

      CREATE TABLE IF NOT EXISTS currency (
        user_id TEXT,
        type TEXT CHECK(type IN ('konpeito', 'sugar_cubes')),
        amount INTEGER,
        updated_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      );

      CREATE TABLE IF NOT EXISTS daily_claim (
        user_id TEXT,
        streak INTEGER DEFAULT 1,
        last_claim DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      );

      CREATE TABLE IF NOT EXISTS items (
        item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        catchphrase TEXT,
        description TEXT,
        price_sugar INTEGER DEFAULT 0,
        price_konpeito INTEGER DEFAULT 0,
        category TEXT,
        rarity TEXT, 
        is_sellable BOOLEAN DEFAULT TRUE,
        image_url TEXT
      );

      CREATE TABLE IF NOT EXISTS lotteries (
        lottery_id INTEGER PRIMARY KEY AUTOINCREMENT,
        prize_amount INTEGER NOT NULL,
        prize_type TEXT CHECK(prize_type IN ('konpeito', 'sugar_cubes')) NOT NULL,
        start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_time DATETIME NOT NULL,
        status TEXT CHECK(status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
        winner_id TEXT,
        FOREIGN KEY (winner_id) REFERENCES users(user_id)
      );

      CREATE TABLE IF NOT EXISTS lottery_entries (
        entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
        lottery_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        entry_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lottery_id) REFERENCES lotteries(lottery_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      );
    `);

    console.log("Database initialized successfully.");
  };

  const runMigrations = async () => {
    try {
      // Check if items table is empty
      const itemCount = await dbAsync.get<{ count: number }>(
        "SELECT COUNT(*) as count FROM items"
      );

      if (!itemCount || itemCount.count === 0) {
        // Insert default items
        await dbAsync.run(
          `INSERT INTO items (name, catchphrase, description, price_sugar, price_konpeito, category, rarity, image_url) VALUES
          ('Sakura Charm', 'A delicate cherry blossom charm that brings good fortune.', 'This beautiful charm is said to bring luck to its owner.', 100, 0, 'accessories', 'common', 'https://example.com/sakura.png'),
          ('Crystal Star', 'A rare star that glows in the moonlight.', 'A mysterious crystal that seems to hold magical properties.', 0, 500, 'collectibles', 'rare', 'https://example.com/star.png')`
        );
        console.log("Added default items to the database.");
      }
    } catch (error) {
      console.error("Error running migrations:", error);
      throw error;
    }
  };

  // Initialize database and run migrations
  initializeDatabase();
  runMigrations().catch(console.error);
}

export default dbAsync;
