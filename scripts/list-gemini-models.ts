import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function listModels() {
    const rawKeys = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || '';
    const apiKey = rawKeys.split(',')[0].trim();
    const genAI = new GoogleGenerativeAI(apiKey);

    console.log('--- FETCHING AVAILABLE MODELS ---');
    try {
        // The SDK doesn't expose a direct listModels, so we use fetch
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log('Available Models:');
            data.models.forEach((m: any) => {
                console.log(` - ${m.name} (${m.displayName}) | Methods: ${m.supportedGenerationMethods.join(', ')}`);
            });
        } else {
            console.log('No models found or error:', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error('Fetch Error:', e);
    }
}

listModels();
