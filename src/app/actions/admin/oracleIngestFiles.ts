'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Oracle Evolution Ingestor
// Server-side PDF extraction using pdf-parse v2 PDFParse class
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { neuralGateway } from '@/lib/core/ai/neuralGateway';

// pdf-parse v2 exports an object — PDFParse is the actual class
const { PDFParse } = require('pdf-parse');

interface IngestionResult {
    success: boolean;
    message: string;
    yearsProcessed?: number[];
    error?: string;
}

export async function ingestEvolutionaryFiles(
    formData: FormData
): Promise<IngestionResult> {
    try {
        const supabase = createServerSupabaseClient();

        const pyqFile = formData.get('pyq') as File | null;
        const notifFile = formData.get('notif') as File | null;

        let pyqText = '';
        let notificationText = '';

        // Server-side PDF text extraction using pdf-parse v2 API
        const extractText = async (file: File): Promise<string> => {
            if (file.type === 'application/pdf') {
                const buffer = Buffer.from(await file.arrayBuffer());
                const parser = new PDFParse();
                const data = await parser.parse(buffer);
                return data.text || '';
            }
            return await file.text();
        };

        if (notifFile) {
            console.log(`[Oracle Ingest] Extracting Notification on server: ${notifFile.name}`);
            notificationText = await extractText(notifFile);
            console.log(`[Oracle Ingest] Notification extracted: ${notificationText.length} chars`);
        }

        if (pyqFile) {
            console.log(`[Oracle Ingest] Extracting PYQ on server: ${pyqFile.name}`);
            pyqText = await extractText(pyqFile);
            console.log(`[Oracle Ingest] PYQ extracted: ${pyqText.length} chars`);
        }

        // 1. Save the Notification Text (year 2025)
        if (notificationText && notificationText.length > 50) {
            await supabase.from('oracle_raw_papers').upsert({
                year: 2025,
                subject: 'UPSC_NOTIFICATION',
                content: notificationText.substring(0, 100000)
            }, { onConflict: 'year,subject' });
            console.log(`[Oracle Ingest] Saved 2025 Notification data.`);
        }

        if (!pyqText || pyqText.length < 100) {
            return {
                success: true,
                message: pyqText.length === 0 ? 'No PYQ text extracted. Is the PDF text-based?' : 'Only notification processed.',
                yearsProcessed: [2025]
            };
        }

        // 2. Segment PYQ text using Gemini in chunks
        const chunkSize = 40000;
        const totalChunks = Math.ceil(pyqText.length / chunkSize);
        let allExtractedQuestions: any[] = [];

        for (let i = 0; i < totalChunks; i++) {
            const chunk = pyqText.substring(i * chunkSize, (i + 1) * chunkSize);
            console.log(`[Oracle Ingest] Deep Segmenting PYQ chunk ${i + 1}/${totalChunks}...`);

            const prompt = `You are the JourneyOS Deep Data Examiner.
            Analyze this UPSC PYQ text chunk and extract every question with full metadata.
            If year is not explicit, infer it from nearby headings.
            
            Return ONLY a valid JSON array:
            [
               {
                 "year": 2015,
                 "subject": "Polity",
                 "topic": "Fundamental Rights",
                 "subTopic": "Article 21",
                 "difficulty": "Hard",
                 "type": "Conceptual",
                 "content": "Question text here..."
               }
            ]
            
            TEXT CHUNK:
            ${chunk.substring(0, 39000)}`;

            try {
                const response = await neuralGateway.generateContent({
                    model: 'gemini-2.0-flash',
                    systemPrompt: 'You extract deeply structured JSON schemas from raw UPSC exam papers. Return only valid JSON arrays.',
                    userPrompt: prompt,
                    responseFormat: 'json',
                    temperature: 0.1
                });

                const parsed = JSON.parse(response.text);
                if (Array.isArray(parsed)) {
                    allExtractedQuestions.push(...parsed);
                }
            } catch (aiErr) {
                console.warn(`[Oracle Ingest] Failed to segment chunk ${i + 1}:`, aiErr);
            }
        }

        console.log(`[Oracle Ingest] Total questions extracted: ${allExtractedQuestions.length}`);

        // 3. Aggregate by Year + Subject
        const aggregated: Record<string, { year: number; subject: string; questions: any[]; rawConcat: string }> = {};
        for (const q of allExtractedQuestions) {
            if (!q.year) continue;
            const subject = q.subject || 'General Studies';
            const key = `${q.year}_${subject}`;
            if (!aggregated[key]) {
                aggregated[key] = { year: q.year, subject, questions: [], rawConcat: '' };
            }
            aggregated[key].questions.push(q);
            aggregated[key].rawConcat += '\n\n' + (q.content || '');
        }

        // 4. Save to DB
        const yearsProcessed = new Set<number>();
        for (const key of Object.keys(aggregated)) {
            const data = aggregated[key];
            if (isNaN(data.year)) continue;

            await supabase.from('oracle_raw_papers').upsert({
                year: data.year,
                subject: data.subject,
                content: data.rawConcat,
                questions: data.questions
            }, { onConflict: 'year,subject' });

            yearsProcessed.add(data.year);
        }

        const sortedYears = Array.from(yearsProcessed).sort();
        console.log(`[Oracle Ingest] Saved years: ${sortedYears.join(', ')}`);

        return {
            success: true,
            message: `Processed ${yearsProcessed.size} years of PYQs (${sortedYears[0]}–${sortedYears[sortedYears.length - 1]}).`,
            yearsProcessed: sortedYears
        };

    } catch (error) {
        console.error('Oracle Ingestion Error:', error);
        return {
            success: false,
            message: 'Failed to ingest evolution files',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
