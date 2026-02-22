'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Oracle Sniper Engine (Server Action)
// Iterative Backtesting System (Time-Traveling Examiner)
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getGeminiClient, AIError, generateEmbedding } from '@/lib/ai/gemini';
import { SchemaType } from '@google/generative-ai';

interface BacktestResult {
    success: boolean;
    message: string;
    details?: any;
    error?: string;
}

/**
 * PROMPT: CAUSAL AUDIT (The Why)
 */
const CAUSAL_AUDIT_PROMPT = `You are the JourneyOS 'Causal Architect'.
You are auditing the ACTUAL {YEAR} UPSC Paper.

THEMES EXTRACTED FROM {YEAR}:
{ACTUAL_THEMES}

VAULT INTELLIGENCE (News, Books, Triggers):
{VAULT_CONTEXT}

TASK: For each theme, identify its 'Causal DNA'.
1. Identify the 'Causal Anchor' (Why did they ask this in {YEAR}? Was there a 50-year anniversary? A Supreme Court Case? A new Policy?).
2. Map to Standard Book: Which Chapter/Source from the vault contains this? (e.g. Laxmikanth Ch. 12).
3. Assign Lethality Components: (S.P.V, C.A, O.E, X.S, G.C) on a scale of 1-10.

Output JSON:
{
  "causalMap": [
    {
      "theme": "string",
      "trigger": "string",
      "source": "string",
      "weights": { "spv": 1-10, "ca": 1-10, "oe": 1-10, "xs": 1-10, "gc": 1-10 }
    }
  ],
  "structuralLogicShift": "How UPSC changed its logic in {YEAR}"
}`;

// Prompt 1: Generate 5 Independent Sets
const GENERATION_PROMPT = `You are the JourneyOS 'Time-Traveling Examiner'.
Your task is to predict the {NEXT_YEAR} UPSC/HAS paper based on historical learnings.

You are currently standing at the end of {YEAR}.
PREVIOUS LEARNED LOGIC FROM {PREV_YEAR}: {LEARNED_LOGIC}
ACTUAL THEMES EXTRACTED FROM {YEAR}: {ACTUAL_THEMES}
CAUSAL AUDIT OF {YEAR}: {CAUSAL_AUDIT}

TASK: Based on the structural shifts and causal triggers in {YEAR}, predict 10 highly probable specific themes and 2 question formats for {NEXT_YEAR}.
Be adventurous but logical.

Output JSON:
{
  "predictedThemes": ["theme1", "theme2"...],
  "predictedFormats": ["format1", "format2"]
}`;

// Prompt 2: The Consensus & Validation Loop
const VALIDATION_PROMPT = `You are the JourneyOS 'Oracle Validator'.
You are now validating predictions made for {YEAR} against the ACTUAL {YEAR} paper.

5 INDEPENDENT AI PREDICTION SETS FOR {YEAR}:
{PREDICTION_SETS}

ACTUAL THEMES IN {YEAR}:
{ACTUAL_THEMES}

TASK 1: MATCH PERCENTAGE
Calculate exactly what percentage of the ACTUAL themes were successfully predicted across any of the 5 sets. Output a number 0-100.

TASK 2: IDENTIFY MISSES
What major themes from {YEAR} were completely missed by all 5 prediction sets? These are the blind spots.

TASK 3: PATTERN SHIFT
Did the format or logic fundamentally change in {YEAR} compared to previous years? (e.g. "Elimination tricks removed").

TASK 4: EVOLVE LOGIC WEIGHTS
Based on the misses and pattern shifts, update your core operating logic for the next iteration.

Output JSON:
{
  "matchPercentage": 0-100,
  "unpredictedTopics": ["topic1", "topic2"],
  "patternShift": "Description of structural shift",
  "evolvedWeights": { "conceptual": 0.0-1.0, "factual": 0.0-1.0, "formatShift": "string" },
  "consensusPredictionForThisYear": ["consensus1", "consensus2"] 
}`;

export async function runOracleBacktestCycle(
    year: number,
    paperText: string
): Promise<BacktestResult> {
    try {
        const genAI = getGeminiClient();

        // Model configurations
        const genModel = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                temperature: 0.7, // Higher temp for diverse independent sets
                responseMimeType: 'application/json',
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        predictedThemes: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        predictedFormats: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                    },
                    required: ["predictedThemes", "predictedFormats"]
                }
            }
        });

        const valModel = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                temperature: 0.1, // Low temp for rigorous validation
                responseMimeType: 'application/json',
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        matchPercentage: { type: SchemaType.NUMBER },
                        unpredictedTopics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        patternShift: { type: SchemaType.STRING },
                        evolvedWeights: {
                            type: SchemaType.OBJECT,
                            properties: {
                                conceptual: { type: SchemaType.NUMBER },
                                factual: { type: SchemaType.NUMBER },
                                formatShift: { type: SchemaType.STRING }
                            }
                        },
                        consensusPredictionForThisYear: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                    },
                    required: ["matchPercentage", "unpredictedTopics", "patternShift", "evolvedWeights", "consensusPredictionForThisYear"]
                }
            }
        });

        const supabase = createServerSupabaseClient();
        const previousYear = year - 1;

        // 1. Fetch State
        const { data: currentCal } = await supabase.from('oracle_calibrations').select('*').eq('year', year).single();
        const { data: prevCal } = await supabase.from('oracle_calibrations').select('*').eq('year', previousYear).single();

        const learnedLogic = prevCal ? prevCal.learned_logic_weights : "Baseline - Assuming Fact Heavy.";
        const predictionSetsMadeForThisYear = currentCal?.prediction_sets || [];

        // 2. Extract Actual Themes from THIS year's text (Helper prompt)
        const themeExtractionModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const themeResponse = await themeExtractionModel.generateContent(`Extract exactly 15 core syllabus themes tested in this text. Output ONLY a comma separated list. TEXT:\n${paperText.substring(0, 15000)}`);
        const actualThemesForThisYear = themeResponse.response.text();
        const themesArray = actualThemesForThisYear.split(',').map(t => t.trim());

        // 2.5 CAUSAL AUDIT: Query Intelligence Vault for each theme
        const vaultContexts = [];
        for (const theme of themesArray.slice(0, 5)) { // Limit to top 5 to avoid token boom
            const { data: matches } = await supabase.rpc('match_vault_content', {
                query_embedding: await generateEmbedding(theme),
                match_threshold: 0.5,
                match_count: 3
            });
            if (matches) vaultContexts.push(...matches);
        }

        const auditPrompt = CAUSAL_AUDIT_PROMPT
            .replace(/{YEAR}/g, year.toString())
            .replace(/{ACTUAL_THEMES}/g, actualThemesForThisYear)
            .replace(/{VAULT_CONTEXT}/g, JSON.stringify(vaultContexts.map(v => ({ source: v.source_name, content: v.content, meta: v.metadata }))));

        const auditResponse = await valModel.generateContent(auditPrompt);
        const causalAuditResult = JSON.parse(auditResponse.response.text());

        // 3. Validation Phase (If we have predictions carried over from last year)
        let validationResult: any = null;
        if (predictionSetsMadeForThisYear.length > 0) {
            const valPrompt = VALIDATION_PROMPT
                .replace(/{YEAR}/g, year.toString())
                .replace(/{PREDICTION_SETS}/g, JSON.stringify(predictionSetsMadeForThisYear))
                .replace(/{ACTUAL_THEMES}/g, actualThemesForThisYear);

            const vRes = await valModel.generateContent(valPrompt);
            validationResult = JSON.parse(vRes.response.text());
        }

        const activeLogicToUseForNextYear = validationResult ? validationResult.evolvedWeights : learnedLogic;

        // 4. Generation Phase (Generate 5 independent sets for NEXT year)
        const nextYearSets = [];
        const genPrompt = GENERATION_PROMPT
            .replace(/{YEAR}/g, year.toString())
            .replace(/{NEXT_YEAR}/g, (year + 1).toString())
            .replace(/{PREV_YEAR}/g, previousYear.toString())
            .replace(/{LEARNED_LOGIC}/g, JSON.stringify(activeLogicToUseForNextYear))
            .replace(/{ACTUAL_THEMES}/g, actualThemesForThisYear)
            .replace(/{CAUSAL_AUDIT}/g, causalAuditResult.structuralLogicShift);

        for (let i = 0; i < 5; i++) {
            const res = await genModel.generateContent(genPrompt);
            nextYearSets.push(JSON.parse(res.response.text()));
        }

        // 5. Database Upserts
        // Save validation data and CAUSAL AUDIT to THIS year's record
        if (validationResult) {
            await supabase.from('oracle_calibrations').upsert({
                year: year,
                actual_themes: themesArray,
                predicted_themes: validationResult.consensusPredictionForThisYear,
                deviation_analysis: validationResult.patternShift,
                learned_logic_weights: validationResult.evolvedWeights,
                match_percentage: validationResult.matchPercentage,
                unpredicted_topics: validationResult.unpredictedTopics,
                pattern_shift: validationResult.patternShift,
                causal_audit: causalAuditResult
            }, { onConflict: 'year' });
        }

        // Save the 5 Prediction Sets to NEXT year's record (seeding it for the next loop)
        await supabase.from('oracle_calibrations').upsert({
            year: year + 1,
            prediction_sets: nextYearSets
        }, { onConflict: 'year' });

        return {
            success: true,
            message: `Recursive Backtest loop completed for ${year}. Generated 5 sets for ${year + 1}. Match accuracy: ${validationResult?.matchPercentage || 'N/A'}%`,
            details: {
                validation: validationResult,
                nextYearSetsGenerated: 5
            }
        };

    } catch (error) {
        console.error('Oracle Backtest Error:', error);
        return {
            success: false,
            message: 'Failed to run Oracle Calibration Cycle',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
