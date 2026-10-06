import "server-only";
import { Pool, type PoolClient } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { AppError } from "./errors";
let pool: Pool | undefined;
export function getDb(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL)
      throw new AppError(503, "Tietokantayhteys ei ole käytettävissä.");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 15000,
      allowExitOnIdle: true,
    });
    pool.on("error", () => console.error("Database idle connection failed"));
    if (process.env.VERCEL) attachDatabasePool(pool);
  }
  return pool;
}
export async function transaction<T>(
  work: (db: PoolClient) => Promise<T>,
  readOnly = false,
): Promise<T> {
  const client = await getDb().connect();
  try {
    await client.query(
      readOnly ? "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY" : "BEGIN",
    );
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
