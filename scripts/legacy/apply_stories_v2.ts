import * as dotenv from 'dotenv';
import path from 'path';
import { Client } from 'pg';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runMigration() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL not found in .env.local');
        process.exit(1);
    }

    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('Connected to Postgres.');

        const sqlPath = path.resolve(process.cwd(), 'supabase/migrations/022_stories_engine_v2.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Applying migration 022_stories_engine_v2.sql...');
        await client.query(sql);
        console.log('✅ Migration applied successfully.');

    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigration();
