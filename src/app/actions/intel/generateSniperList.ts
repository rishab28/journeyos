'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Oracle Sniper Engine 2026 Prediction Generator
// Applies 2025 fully calibrated weights to 2025-2026 Current Affairs
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { getGeminiClient } from '@/lib/core/ai/gemini';
import { SchemaType } from '@google/generative-ai';

const GENERATE_2026_PROMPT = `You are the final stage of the JourneyOS 'Time-Traveling Examiner'.
You have just completed a rigorous 15-year recursive backtesting loop.
Your logic weights have evolved through continuous error-correction from 2008 to 2025.

HERE ARE YOUR FULLY EVOLVED, HIGH-LETHALITY LOGIC WEIGHTS (CALIBRATED AFTER THE 2025 EXAM):
{EVOLVED_WEIGHTS}

LAST YEAR'S PATTERN SHIFT (What UPSC did in 2025 to trick aspirants):
{PATTERN_SHIFT}

TASK: Synthesize this structural intelligence with the macro socio-economic landscape of 2025-2026.
Predict the TOP 10 highest-probability ("God-Mode") themes for the 2026 exam.
Also predict the dominant "Format Styles" (e.g., Statement Pair Matching vs. Assertion-Reason).

Output strictly in JSON as follows:
{
  "godModeThemes": ["theme1", "theme2"...],
  "formatStyles": ["style1", "style2"],
  "reasoningText": "Explain briefly why these are high-probability based on recent pattern shifts."
}`;

export async function generateFinal2026SniperList() {
    try {
        const supabase = createServerSupabaseClient();

        // Fetch the final calibration state (Year 2025)
        const { data: finalCal } = await supabase
            .from('oracle_calibrations')
            .select('*')
            .eq('year', 2025)
            .single();

        if (!finalCal) {
            throw new Error("Cannot generate 2026 list: 2025 calibration data represents the critical final weight set and is missing.");
        }

        const evolvedWeights = finalCal.learned_logic_weights;
        const patternShift = finalCal.pattern_shift || "No major shift detected in 2025.";

        const prompt = GENERATE_2026_PROMPT
            .replace(/{EVOLVED_WEIGHTS}/g, JSON.stringify(evolvedWeights))
            .replace(/{PATTERN_SHIFT}/g, patternShift);

        const genAI = getGeminiClient();
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: {
                temperature: 0.3, // Steady temperature for authoritative final output
                responseMimeType: 'application/json',
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        godModeThemes: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        formatStyles: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        reasoningText: { type: SchemaType.STRING }
                    },
                    required: ["godModeThemes", "formatStyles", "reasoningText"]
                }
            }
        });

        const response = await model.generateContent(prompt);
        const parsedResult = JSON.parse(response.response.text());

        return {
            success: true,
            data: parsedResult
        };

    } catch (error) {
        console.error('Final 2026 Generator Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
