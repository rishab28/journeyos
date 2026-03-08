console.log('--- START ---');
try {
    const dotenv = require('dotenv');
    console.log('Dotenv loaded');
    dotenv.config({ path: '.env.local' });
    console.log('Config loaded');
    
    const { createClient } = require('@supabase/supabase-js');
    console.log('Supabase loaded');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    console.log('Client created');
    
    async function test() {
        console.log('Fetching counts...');
        const { count, error } = await supabase.from('daily_stories').select('*', { count: 'exact', head: true });
        if (error) console.error('Error:', error.message);
        else console.log('Total daily_stories:', count);
        
        console.log('--- END ---');
    }
    test();
} catch (e) {
    console.error('CRASH:', e.message);
}
