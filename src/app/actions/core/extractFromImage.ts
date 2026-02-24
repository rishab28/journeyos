'use server'

import { GoogleGenerativeAI } from '@google/generative-ai';

// Instantiate Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function extractCardsFromImage(base64Image: string, mimeType: string, subject: string, topic: string) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are a strict UPSC/HAS content digitized engine. Read this handwritten note or newspaper clipping image.
        Extract the core factual concepts and return them strictly as an array of JSON objects matching the ExtractedCard schema.
        Use "FLASHCARD" or "MCQ" type. Give it a priority score and sub_topics.
        Format your response ONLY as a JSON array. DO NOT wrap with markdown code blocks (\`\`\`json). Just the raw array bracket to bracket.`;

        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text().trim();

        // Simple sanitization for unterminated JSON or markdown wrapper
        let cleanText = responseText;
        if (cleanText.startsWith('```json')) cleanText = cleanText.substring(7);
        if (cleanText.startsWith('```')) cleanText = cleanText.substring(3);
        if (cleanText.endsWith('```')) cleanText = cleanText.substring(0, cleanText.length - 3);
        cleanText = cleanText.trim();

        const cards = JSON.parse(cleanText);
        return { success: true, cards };
    } catch (error: any) {
        console.error("Vision AI Error:", error);
        return { success: false, error: error.message };
    }
}
