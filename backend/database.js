import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ PostgreSQL connected successfully!");
    release();
  }
});

export default pool;