import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { oracleAI } from './client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Oracle Nexus: Genesis Service
// Strategic PDF Ingestion & Neural Segmentation.
// ═══════════════════════════════════════════════════════════

export interface GenesisResult {
    success: boolean;
    message: string;
    yearsProcessed?: number[];
}

export type ProgressCallback = (msg: string) => void;

export class OracleGenesis {
    /**
     * Extracts text from a file buffer.
     * PDFs: local extraction via standalone script (zero API cost).
     * Text: direct read.
     */
    async extractText(buffer: Buffer, filename: string, onProgress?: ProgressCallback): Promise<string> {
        const isPdf = filename.toLowerCase().endsWith('.pdf');

        if (!isPdf) {
            onProgress?.(`📄 Reading text file: ${filename}`);
            return buffer.toString('utf-8');
        }

        onProgress?.(`📄 Extracting PDF text locally: ${filename}`);
        try {
            const { execSync } = require('child_process');
            const path = require('path');
            const fs = require('fs');
            const os = require('os');

            const tmpPath = path.join(os.tmpdir(), `genesis_${Date.now()}.pdf`);
            fs.writeFileSync(tmpPath, buffer);

            const scriptPath = path.join(process.cwd(), 'scripts', 'extract-pdf.mjs');
            const text = execSync(`node "${scriptPath}" "${tmpPath}"`, {
                encoding: 'utf-8',
                maxBuffer: 50 * 1024 * 1024,
                timeout: 60000,
            }).trim();

            try { fs.unlinkSync(tmpPath); } catch { }

            if (text && text.length > 50) {
                onProgress?.(`✅ Local extraction: ${text.length} characters`);
                return text;
            }

            onProgress?.(`⚠️ Local extraction insufficient. Trying Gemini File API...`);
        } catch (localErr: any) {
            onProgress?.(`⚠️ Local extraction failed. Trying Gemini File API...`);
        }

        // Fallback: Gemini File API
        let attempts = 0;
        while (attempts < 3) {
            try {
                onProgress?.(`📤 Uploading to Gemini (Attempt ${attempts + 1})...`);
                const { fileUri, apiKey } = await oracleAI.uploadFile(buffer, filename, 'application/pdf');
                onProgress?.(`🧠 Extracting via Gemini multimodal...`);
                return await oracleAI.generateFromFile(fileUri, {
                    prompt: 'Extract ALL text verbatim from this UPSC exam paper PDF.',
                    systemInstruction: 'Verbatim extraction only.',
                }, apiKey);
            } catch (error: any) {
                if (error.message === '429_RATE_LIMIT' && attempts < 2) {
                    attempts++;
                    onProgress?.(`⚠️ Rate limited. Retrying...`);
                    await new Promise(r => setTimeout(r, 2000));
                } else throw error;
            }
        }
        throw new Error('Text extraction failed.');
    }

    /**
     * Segments raw text into structured question objects.
     */
    async segment(text: string, onProgress?: ProgressCallback): Promise<any[]> {
        const CHUNK_SIZE = 25000;
        const allQuestions: any[] = [];
        const totalChunks = Math.ceil(text.length / CHUNK_SIZE);

        for (let c = 0; c < totalChunks; c++) {
            const slice = text.substring(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE);
            onProgress?.(`🧠 Segmenting chunk ${c + 1}/${totalChunks}...`);

            const prompt = `Extract structured UPSC questions from the text below.
Return ONLY a valid JSON array, no markdown, no code blocks.

STRICT JSON SCHEMA:
[{"year":number,"subject":"GS","topic":"...","subTopic":"...","difficulty":"HARD","type":"MCQ","content":"..."}]

TEXT:
${slice}`;

            const rawResponse = await oracleAI.generate({
                prompt,
                systemInstruction: 'Return valid JSON array of UPSC questions. No markdown formatting, no code blocks, just raw JSON.',
                jsonMode: true
            });

            try {
                let cleaned = rawResponse.trim();
                if (cleaned.startsWith('```')) {
                    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
                }
                const parsed = JSON.parse(cleaned);
                if (Array.isArray(parsed)) {
                    allQuestions.push(...parsed);
                    onProgress?.(`✅ Chunk ${c + 1}/${totalChunks}: ${parsed.length} questions found`);
                }
            } catch (e) {
                onProgress?.(`⚠️ Chunk ${c + 1}/${totalChunks}: Parse error, skipping`);
            }
        }
        return allQuestions;
    }

    /**
     * Entry point for Ingest Protocol.
     */
    async processIngest(
        { pyq, pyqFilename, notification, notifFilename }: {
            pyq?: Buffer; pyqFilename?: string;
            notification?: Buffer; notifFilename?: string;
        },
        onProgress?: ProgressCallback
    ): Promise<GenesisResult> {
        const yearsProcessed: number[] = [];

        if (notification) {
            onProgress?.(`Processing Notification...`);
            const fname = notifFilename || 'notification.pdf';
            const text = await this.extractText(notification, fname, onProgress);
            const themes = await this.extractThemes(text);
            await this.savePaper(2025, 'UPSC_NOTIFICATION', themes, text);
            onProgress?.(`✅ Notification processed.`);
        }

        if (pyq) {
            const fname = pyqFilename || 'pyq_paper.pdf';
            onProgress?.(`═══ Processing PYQ: ${fname} ═══`);
            const fullText = await this.extractText(pyq, fname, onProgress);

            if (!fullText || fullText.length < 50) {
                return { success: false, message: 'Extracted text too short. PDF may be image-only.' };
            }

            onProgress?.(`📊 Extracted ${fullText.length} chars. Starting segmentation...`);
            const questions = await this.segment(fullText, onProgress);

            // Diagnostic: Check how many questions have valid years
            const withYear = questions.filter(q => {
                const y = Number(q.year);
                return y && y >= 1990 && y <= 2026;
            });
            const withoutYear = questions.length - withYear.length;
            onProgress?.(`📊 Total: ${questions.length} questions | With valid year: ${withYear.length} | No year: ${withoutYear}`);

            const grouped = this.groupByYear(questions);
            const yearKeys = Object.keys(grouped);
            onProgress?.(`📊 Grouped into ${yearKeys.length} years: ${yearKeys.join(', ')}`);

            for (const [year, data] of Object.entries(grouped)) {
                onProgress?.(`💾 Saving year ${year}: ${data.questions.length} questions...`);
                const result = await this.savePaper(Number(year), 'GS', data.questions, data.raw);
                if (result.error) {
                    onProgress?.(`❌ Save failed for ${year}: ${result.error.message}`);
                } else {
                    onProgress?.(`✅ Year ${year} saved to database`);
                    yearsProcessed.push(Number(year));
                }
            }

            onProgress?.(`✅ ${questions.length} questions across years: ${yearsProcessed.join(', ')}`);
        }

        return {
            success: true,
            message: `Genesis complete. ${yearsProcessed.length} year(s) processed.`,
            yearsProcessed
        };
    }

    private async extractThemes(text: string): Promise<any[]> {
        try {
            const response = await oracleAI.generate({
                prompt: `Extract "Constraint Themes" from this UPSC Notification.\n\nTEXT:\n${text.substring(0, 30000)}`,
                systemInstruction: 'Return valid JSON array of themes.',
                jsonMode: true
            });
            let cleaned = response.trim();
            if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
            }
            return JSON.parse(cleaned);
        } catch { return []; }
    }

    private groupByYear(questions: any[]) {
        const map: Record<number, { questions: any[]; raw: string }> = {};
        for (const q of questions) {
            const y = Number(q.year);
            if (!y || y < 1990 || y > 2026) continue;
            if (!map[y]) map[y] = { questions: [], raw: '' };
            map[y].questions.push(q);
            map[y].raw += `\n\n${q.content}`;
        }
        return map;
    }

    async savePaper(year: number, subject: string, questions: any[], rawContent: string) {
        const supabase = createServerSupabaseClient();
        console.log(`[OracleGenesis] Saving to DB: year=${year}, subject=${subject}, questions=${questions.length}`);
        const result = await supabase.from('oracle_raw_papers').upsert({
            year, subject, questions,
            content: rawContent.substring(0, 100000)
        }, { onConflict: 'year,subject' });
        if (result.error) {
            console.error(`[OracleGenesis] DB Save Error for year ${year}:`, result.error);
        } else {
            console.log(`[OracleGenesis] ✅ DB Save success for year ${year}`);
        }
        return result;
    }
}

export const oracleGenesis = new OracleGenesis();
