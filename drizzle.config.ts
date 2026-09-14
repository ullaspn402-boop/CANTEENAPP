import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import process from 'node:process';

dotenv.config();

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.SQL_HOST || 'localhost',
    user: process.env.SQL_USER || 'postgres',
    password: process.env.SQL_PASSWORD || '',
    database: process.env.SQL_DB_NAME || 'canteen_db',
    ssl:
      process.env.SQL_SSL === 'true'
        ? { rejectUnauthorized: process.env.SQL_SSL_REJECT_UNAUTHORIZED === 'true' }
        : false,
  },
});
