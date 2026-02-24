// test_action_ingest.ts
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local BEFORE importing any code that uses process.env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { ingestText } from './src/app/actions/ingest';
import { Domain, Subject } from './src/types';

async function runIngestTest() {
    console.log('🧪 Testing Ingest Server Action (Gemini + Supabase)...\n');

    const dummyText = `
    The Right to Information (RTI) Act was passed by the Parliament of India in 2005. 
    It mandates a timely response to citizen requests for government information. 
    The basic object of the Right to Information Act is to empower the citizens, 
    promote transparency and accountability in the working of the Government, 
    contain corruption, and make our democracy work for the people in real sense.
    Exceptions include matters of national security and personal information.
    `;

    console.log('Sending text to Gemini for extraction...');

    try {
        const result = await ingestText({
            text: dummyText,
            domain: Domain.GS,
            subject: Subject.POLITY,
            topic: 'Right to Information Act',
            examTags: ['UPSC'],
        });

        if (result.success) {
            console.log(`✅ PASS: Extracted ${result.cardsCreated} cards successfully.`);
            console.log(`Sample Card Front: ${result.cards[0]?.front}`);
            console.log(`Sample Card Back: ${result.cards[0]?.back}`);
            console.log(`Sample Card Back: ${result.cards[0]?.back}`);
        } else {
            console.error('❌ FAIL: Ingest failed.');
            console.error(result.errors);
        }
    } catch (e) {
        console.error('❌ FAIL: Exception thrown:', e);
    }
}

runIngestTest();
