import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertDummy() {
    console.log('Inserting surgical UPSC story...');
    const { error } = await supabase.from('daily_stories').insert({
        subject: 'Polity',
        title: 'Supreme Court on Electoral Bonds',
        summary: [
            'Supreme Court struck down the Electoral Bonds scheme as unconstitutional.',
            'UPSC Relevance: GS Paper 2 - Transparency in electoral funding.'
        ],
        // syllabus_topic: 'Electoral Reforms',
        // mains_fodder: 'Transparency in political funding is bedrock of free and fair elections - SC',
        source_url: 'https://thehindu.com',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    if (error) console.error('Error:', error);
    else console.log('✅ Surgical dummy story inserted successfully!');
}

insertDummy();
