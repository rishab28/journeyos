import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applyFix() {
    console.log('--- APPLYING SEMANTIC CACHE RPC FIX ---');

    // The SQL from 041_ai_semantic_cache.sql's match_ai_cache function
    const sql = `
    CREATE OR REPLACE FUNCTION match_ai_cache (
      query_embedding VECTOR(768),
      match_threshold FLOAT,
      match_count INT
    )
    RETURNS TABLE (
      query_text TEXT,
      response_body JSONB,
      similarity FLOAT
    )
    LANGUAGE sql STABLE
    AS $$
      SELECT
        query_text,
        response_body,
        1 - (embedding <=> query_embedding) AS similarity
      FROM public.ai_semantic_cache
      WHERE 1 - (embedding <=> query_embedding) > match_threshold
      ORDER BY (embedding <=> query_embedding) ASC
      LIMIT match_count;
    $$;
    `;

    try {
        // We use the postgres extension via internal RPC if available, 
        // but normally we'd run this via the SQL editor.
        // Since we don't have a direct 'run sql' tool, we check if 
        // we can use a special RPC 'exec_sql' if it exists.
        // If not, we might need the user to run it.

        console.log('Attempting to apply SQL via anonymous RPC...');
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('RPC Error (Expected if exec_sql missing):', error.message);
            console.log('\n[CRITICAL] Please run the following SQL in your Supabase SQL Editor:');
            console.log(sql);
        } else {
            console.log('✅ Successfully applied match_ai_cache function.');
        }
    } catch (e: any) {
        console.error('Fatal Script Error:', e.message);
    }
}

applyFix();
