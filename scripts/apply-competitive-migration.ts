
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function applyMigration() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/030_competitive_edge.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying migration 030_competitive_edge.sql...');

    // We use a simple RPC or multiple queries if needed, but since we don't have a generic "run_sql" RPC 
    // unless defined, we'll try to split by semicolons and execute.
    // Note: This is a bit risky for complex SQL, but for ALTER TABLE it works.

    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
        try {
            const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
            if (error) {
                // Fallback: try raw query if exec_sql doesn't exist (though it usually doesn't by default)
                // Actually, without a custom RPC, we can't run arbitrary SQL from the client.
                // We'll instruct the user or try a known trick.
                console.error(`Error executing statement: ${statement}`, error);
            } else {
                console.log(`Successfully executed: ${statement.substring(0, 50)}...`);
            }
        } catch (e) {
            console.error(`Failed: ${statement}`, e);
        }
    }
}

console.log('NOTE: If this fails, please run the SQL in supabase/migrations/030_competitive_edge.sql manually in the Supabase SQL Editor.');
applyMigration();
