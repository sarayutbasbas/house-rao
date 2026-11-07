import { attachDatabasePool } from '@vercel/functions';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
let instance: ReturnType<typeof createDb> | undefined;
function createDb() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  if (process.env.VERCEL) attachDatabasePool(pool);
  return drizzle(pool, { schema });
}
export function db() { return instance ??= createDb(); }
