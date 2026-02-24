'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Oracle Sniper Engine (Server Action)
// Iterative Backtesting System (Time-Traveling Examiner)
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { generateEmbedding } from '@/lib/core/ai/gemini';
import { neuralGateway } from '@/lib/core/ai/neuralGateway';
import { PROMPTS } from '@/lib/core/ai/prompts';
import { logSystemEvolution, calculateSyllabusCoverage } from './evolutionTracker';

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

VAULT INTELLIGENCE (News, Patterns, Triggers):
{VAULT_CONTEXT}

SYLLABUS BLUEPRINT:
{SYLLABUS_CONTEXT}

TASK: For each theme, identify its 'Causal DNA'.
1. Identify the 'Causal Anchor' (Why did they ask this in {YEAR}? Was there a 50-year anniversary? A Supreme Court Case? A recurring CA trigger?).
2. Map to Syllabus Node: Link this theme to the most relevant Syllabus Node ID provided.
3. Assign Lethality Components: (S.P.V, C.A, O.E, X.S, G.C) on a scale of 1-10.

Output JSON:
{
  "causalMap": [
    {
      "theme": "string",
      "trigger": "string",
      "nodeId": "uuid_from_syllabus",
      "weights": { "spv": 1-10, "ca": 1-10, "oe": 1-10, "xs": 1-10, "gc": 1-10 }
    }
  ],
  "structuralLogicShift": "How UPSC changed its logic or format in {YEAR}"
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
        const supabase = createServerSupabaseClient();
        const previousYear = year - 1;

        // 1. Fetch State
        const { data: currentCal } = await supabase.from('oracle_calibrations').select('*').eq('year', year).single();
        const { data: prevCal } = await supabase.from('oracle_calibrations').select('*').eq('year', previousYear).single();

        const learnedLogic = prevCal ? prevCal.learned_logic_weights : "Baseline - Assuming Fact Heavy.";
        const predictionSetsMadeForThisYear = currentCal?.prediction_sets || [];

        // 2. Extract Actual Themes from THIS year's text
        const themePrompt = `Extract exactly 15 core syllabus themes tested in this text. Output ONLY a JSON string array like ["theme1", "theme2"]. TEXT:\n${paperText.substring(0, 15000)}`;
        const themeResponse = await neuralGateway.generateContent({
            model: 'gemini-2.5-flash', // fast extraction
            userPrompt: themePrompt,
            responseFormat: 'json'
        });
        const themesArray = JSON.parse(themeResponse.text);

        // 2.5 CAUSAL AUDIT: Query Intelligence Vault & Syllabus for each theme
        const vaultContexts = [];
        const syllabusContexts = [];

        for (const theme of themesArray.slice(0, 8)) { // Higher density for God-Mode
            // Match Vault (Current Affairs / Triggers)
            const { data: vMatches } = await supabase.rpc('match_vault_content', {
                query_embedding: await generateEmbedding(theme),
                match_threshold: 0.5,
                match_count: 3
            });
            if (vMatches) vaultContexts.push(...vMatches);

            // Match Syllabus (Academic Blueprint)
            const { data: sMatches } = await supabase.rpc('match_syllabus_node', {
                query_embedding: await generateEmbedding(theme),
                match_threshold: 0.4,
                match_count: 2
            });
            if (sMatches) syllabusContexts.push(...sMatches);
        }

        const auditPrompt = CAUSAL_AUDIT_PROMPT
            .replace(/{YEAR}/g, year.toString())
            .replace(/{ACTUAL_THEMES}/g, JSON.stringify(themesArray))
            .replace(/{VAULT_CONTEXT}/g, JSON.stringify(vaultContexts.map(v => ({ source: v.source_name, content: v.content }))))
            .replace(/{SYLLABUS_CONTEXT}/g, JSON.stringify(syllabusContexts.map(s => ({ id: s.id, name: s.node_name, paper: s.paper_name }))));

        const auditResponse = await neuralGateway.generateContent({
            model: 'claude-3-7-sonnet-20250219',
            systemPrompt: PROMPTS.Oracle.SYSTEM,
            userPrompt: auditPrompt,
            responseFormat: 'json',
            temperature: 0.1
        });
        const causalAuditResult = JSON.parse(auditResponse.text);

        // 3. Validation Phase (If we have predictions carried over from last year)
        let validationResult: any = null;
        if (predictionSetsMadeForThisYear.length > 0) {
            const valPrompt = VALIDATION_PROMPT
                .replace(/{YEAR}/g, year.toString())
                .replace(/{PREDICTION_SETS}/g, JSON.stringify(predictionSetsMadeForThisYear))
                .replace(/{ACTUAL_THEMES}/g, JSON.stringify(themesArray));

            const vRes = await neuralGateway.generateContent({
                model: 'claude-3-7-sonnet-20250219',
                systemPrompt: PROMPTS.Oracle.SYSTEM,
                userPrompt: valPrompt,
                responseFormat: 'json',
                temperature: 0.1
            });
            validationResult = JSON.parse(vRes.text);
        }

        const activeLogicToUseForNextYear = validationResult ? validationResult.evolvedWeights : learnedLogic;

        // 4. Generation Phase (Generate 5 independent sets for NEXT year)
        const nextYearSets = [];
        const genPrompt = GENERATION_PROMPT
            .replace(/{YEAR}/g, year.toString())
            .replace(/{NEXT_YEAR}/g, (year + 1).toString())
            .replace(/{PREV_YEAR}/g, previousYear.toString())
            .replace(/{LEARNED_LOGIC}/g, JSON.stringify(activeLogicToUseForNextYear))
            .replace(/{ACTUAL_THEMES}/g, JSON.stringify(themesArray))
            .replace(/{CAUSAL_AUDIT}/g, causalAuditResult.structuralLogicShift);

        for (let i = 0; i < 5; i++) {
            const res = await neuralGateway.generateContent({
                model: 'claude-3-7-sonnet-20250219',
                systemPrompt: PROMPTS.Oracle.SYSTEM,
                userPrompt: genPrompt,
                responseFormat: 'json',
                temperature: 0.7
            });
            nextYearSets.push(JSON.parse(res.text));
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

        // 6. LOG SYSTEM EVOLUTION (God-Mode Evolution)
        if (validationResult) {
            const coverage = await calculateSyllabusCoverage();
            await logSystemEvolution({
                patternAccuracy: validationResult.matchPercentage,
                causalDensity: causalAuditResult.causalMap?.length || 0,
                nodeCoverage: coverage,
                reasoningShift: validationResult.patternShift,
                logicSnapshot: validationResult.evolvedWeights
            });
        }

        return {
            success: true,
            message: `Recursive Backtest loop completed for ${year}. Generated 5 sets for ${year + 1}. Match accuracy: ${validationResult?.matchPercentage || 'N/A'}%`,
            details: {
                validation: validationResult,
                causalAudit: causalAuditResult,
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
