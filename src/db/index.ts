import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import process from 'node:process';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const config: any = {
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15000,
    };

    if (process.env.SQL_SSL === 'true') {
      config.ssl = {
        rejectUnauthorized: process.env.SQL_SSL_REJECT_UNAUTHORIZED === 'true',
      };
    }

    global._postgresPool = new Pool(config);

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
