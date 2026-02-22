// list_models.ts
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { GoogleGenerativeAI } from '@google/generative-ai';

async function list() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY!);
    try {
        console.log("Fetching models...");
        // Hack: The node SDK doesn't expose ListModels directly on the main client in older versions,
        // but let's try calling an intentional failure to trace it or check the docs online via search.
        const req = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_GENAI_API_KEY}`);
        const data = await req.json();
        console.log("Models:", data.models?.map((m: any) => m.name).filter((n: string) => n.includes('embed')));
    } catch (e) {
        console.error(e);
    }
}
list();
