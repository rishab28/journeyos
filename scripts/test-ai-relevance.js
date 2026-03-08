const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const SurgicalNews_SYSTEM = `You are the JourneyOS 'Surgical News Editor'. Your mission is to convert raw news into high-yield, rank-producing 'Neural Loops' for UPSC aspirants.
        
        STRATEGIC DIRECTIVES:
        1. RELEVANCE: Only process items with direct GS Pillar impact (Polity, Economy, IR, S&T, Environment, History).
        2. EXECUTIVE SUMMARY: Exactly 2 points. Point 1: The 'Event' (What happened). Point 2: The 'Neural Hook' (Why it matters for UPSC/Analytical context).
        3. PERMANENT CARD: Create a concept-focused study card. 
           - If FLASHCARD: Focus on 'Process' or 'Causal' logic.
           - If MCQ: Focus on 'Statement Analysis' (UPSC style).
        4. TONE: Serious, strategic, and high-IQ. Use bolding for critical keywords in stories and card 'back' fields.

        STRICT JSON STRUCTURE:
        {
            "isRelevant": boolean,
            "subject": "Polity|Economy|Science|Environment|History|Geography|Social Issues|IR",
            "topic": "Syllabus keyword",
            "title": "Clean Headline",
            "story": ["Point 1", "Point 2"],
            "mainsFodder": "Answer writing edge / Data point",
            "card": {
                "type": "flashcard" | "mcq",
                "front": "Conceptual question / Statement",
                "back": "Direct answer with **bolded keywords**",
                "options": ["Op A", "Op B", "Op C", "Op D"], // Mandatory for MCQ
                "answer": "A|B|C|D" // Mandatory for MCQ
            }
        }`;

const batch = [
    { source: 'The Hindu', title: 'Right to hold passport, travel abroad integral facet of personal liberty: Delhi HC', description: 'The Delhi High Court on Friday held that the right to hold a passport and travel abroad is an integral facet of personal liberty.' },
    { source: 'The Hindu', title: 'Sai Prasad to assume charge as new Chief Secretary of Andhra Pradesh on Saturday', description: 'Senior IAS officer Neerabh Kumar Prasad will assume charge as the new Chief Secretary of the Andhra Pradesh government.' },
    { source: 'Indian Express', title: 'Afghanistan-Pakistan ‘open war’: Iran, Russia, and China call for dialogue', description: 'Regional powers urge restraint as border tensions escalate between Kabul and Islamabad.' }
];

async function testAI() {
    console.log('--- TESTING AI CLASSIFICATION ---');
    const rawKeys = process.env.GOOGLE_GENAI_API_KEY || '';
    const apiKey = rawKeys.split(',')[0].trim();

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: { responseMimeType: "application/json" }
    });

    const batchText = batch.map((it, idx) => `[${idx}] ${it.source}: ${it.title}\nDescription: ${it.description || 'N/A'}`).join('\n---\n');
    const prompt = SurgicalNews_SYSTEM + '\n\nBATCH TO PROCESS:\n' + batchText + '\n\nReturn a JSON array of processed items.';

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log('AI Status: OK');
        const parsed = JSON.parse(text);
        parsed.forEach((item, i) => {
            console.log(`[${i}] Relevant: ${item.isRelevant} | Subject: ${item.subject} | Title: ${item.title}`);
        });
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testAI();
