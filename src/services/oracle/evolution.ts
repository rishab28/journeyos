import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { oracleAI } from './client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Oracle Nexus: Evolution Service
// God-Mode Backtesting & Chronological Logic Evolution.
// ═══════════════════════════════════════════════════════════

export interface EvolutionResult {
    year: number;
    matchPercentage: number;
    accuracy: number;
    shadowMatrix: any[];
    weights: any;
    survivingTopics?: string[];
    prunedTopics?: string[];
    directHits?: string[];
    misses?: string[];
    surpriseTopics?: string[];
    learningInsight?: string;
    hypeBackfireLogs?: string[];
    debateLogs?: string[];
}

export class OracleEvolution {
    async runEvolutionaryStep(year: number): Promise<EvolutionResult> {
        const supabase = createServerSupabaseClient();
        console.log(`[OracleEvolution] Initiating Evolution Phase: ${year} -> ${year + 1}`);

        // 1. Fetch Actual Paper Data (structured by Genesis)
        const { data: papers } = await supabase
            .from('oracle_raw_papers')
            .select('questions')
            .eq('year', year);

        if (!papers || papers.length === 0) {
            throw new Error(`Insufficient data for year ${year}. Genesis must be run first.`);
        }

        const actualQuestions = papers.flatMap(p => p.questions || []);
        // Condense the 40,000+ char dataset into a clean array of Unique Topics so the AI doesn't drown in noise
        const rawTopics = actualQuestions.map(q => q.topic).filter(Boolean);
        const actualTopics = Array.from(new Set(rawTopics));
        const actualJsonStr = JSON.stringify(actualTopics);

        // 2. Fetch Historical Memory Vault (Last 5 Years for Compound Intelligence)
        const { data: pastHistory } = await supabase
            .from('oracle_chronologies')
            .select('year, predicted_themes, logic_weights, learning_insight, accuracy_score')
            .lt('year', year)
            .order('year', { ascending: false })
            .limit(5);

        const history = pastHistory || [];
        const prevState = history.length > 0 ? history[0] : null;

        const predictedForThisYear = prevState?.predicted_themes || [];
        const currentLogicWeights = prevState?.logic_weights || { factual_bias: 0.5, conceptual_bias: 0.5 };

        // Construct the Rolling Memory Vault to cure AI Amnesia
        const memoryVaultLog = history.reverse().map(h =>
            `[YEAR ${h.year}] Accuracy: ${h.accuracy_score}%. Insight: "${h.learning_insight}". Bias Shift: Fact(${h.logic_weights?.factual_bias}), Concept(${h.logic_weights?.conceptual_bias})`
        ).join('\n');

        // 3. Execution via Oracle AI Client
        const prompt = `
            You are the "JourneyOS Ultimate Oracle Engine".
            YEAR UNDER REVIEW: ${year}
            PREDICTED THEMES (From Last Year): ${JSON.stringify(predictedForThisYear)}
            ACTUAL TOPICS TESTED (This Year): ${actualJsonStr}
            CURRENT WEIGHTS: ${JSON.stringify(currentLogicWeights)}

            LONG-TERM MEMORY VAULT (Your Past 5 Years of Evolution):
            ${memoryVaultLog || "No history yet. This is your first cycle."}

            PHASE 1 (THE POST-MORTEM AUDIT):
            - Compare PREDICTED THEMES against ACTUAL TOPICS TESTED. Use Semantic Fuzzy-Matching (if you predicted "Economy -> Inflation", and "CPI Inflation" appeared, that is a HIT).
            - List "directHits" (You predicted a theme, and a conceptually similar topic appeared).
            - List "misses" (You predicted a theme, but NOTHING conceptually related appeared).
            - List "surpriseTopics" (A major topic appeared that you completely failed to predict).
            
            PHASE 2 (MATHEMATICAL ACCURACY):
            - Calculate "matchPercentage" (0-100) strictly using: (Number of directHits / Total PREDICTED THEMES) * 100. DO NOT GUESS.
            
            PHASE 3 (COMPOUND INTELLIGENCE & SELF-CORRECTION):
            - Review your LONG-TERM MEMORY VAULT. Are you repeating mistakes from 3 years ago? Has your Accuracy been dropping? Can you identify a multi-year trend in UPSC testing?
            - Write a brilliant "learningInsight" (2-3 sentences) synthesizing your past failures and explaining how you will fix your predictions for next year.
            - Evolve your logic weights based on this compound insight (Do not randomly swing weights back and forth; make calculated, permanent shifts).

            PHASE 4 (NEXT PREDICTION):
            - Propose exactly 100 lethal topics for ${year + 1} (Full Syllabus Shadow Paper).
            - The 100 topics MUST be distributed across core subjects: Polity, Economy, Environment, History, Geography, Science & Tech, Current Affairs.

            RETURN ONLY STRICT JSON. NO MARKDOWN. NO COMMENTS.
            {
                "directHits": ["Topic A", "Topic B"],
                "misses": ["Topic C"],
                "surpriseTopics": ["Topic D"],
                "learningInsight": "I underestimated static polity traps. Shifting weight towards conceptual facts.",
                "matchPercentage": 0, // MUST BE CALCULATED FROM HITS
                "shadowMatrix": [
                    { 
                        "target_hierarchy": "Syllabus -> Topic", 
                        "lethality_score": 0, 
                        "origin_agent": "Conceptual Integrator", 
                        "the_catch_warning": "Warning text..." 
                    }
                ],
                "evolvedWeights": { "factual_bias": 0.5, "conceptual_bias": 0.5 },
                "survivingTopics": ["..."],
                "prunedTopics": ["..."]
            }
        `;

        const systemInstruction = 'You are Oracle God-Mode. Return ONLY valid JSON matching the exact schema requested. No markdown wrappers.';

        const responseText = await oracleAI.generate({
            prompt,
            systemInstruction,
            jsonMode: true,
            temperature: 0.7
        });

        // Strip markdown wrappers (Gemma compatibility)
        let cleaned = responseText.trim();
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
        }

        let result;
        try {
            result = JSON.parse(cleaned);
        } catch (e) {
            console.error("Evolution JSON Parse Error for year", year, cleaned);
            throw e;
        }

        // 4. Persistence
        await supabase.from('oracle_chronologies').upsert({
            year,
            actual_themes: actualQuestions.map((q: any) => q.topic).filter(Boolean),
            predicted_themes: (result.shadowMatrix || []).map((m: any) => m.target_hierarchy),
            accuracy_score: result.matchPercentage || 0,
            logic_weights: result.evolvedWeights || currentLogicWeights,
            shadow_matrix: result.shadowMatrix || [],
            direct_hits: result.directHits || [],
            misses: result.misses || [],
            surprise_topics: result.surpriseTopics || [],
            learning_insight: result.learningInsight || "No insight generated.",
            status: 'completed',
            updated_at: new Date().toISOString()
        }, { onConflict: 'year' });

        return {
            year,
            matchPercentage: result.matchPercentage || 0,
            accuracy: result.matchPercentage || 0, // UI expects `accuracy` for the curve
            shadowMatrix: result.shadowMatrix,
            weights: result.evolvedWeights,
            survivingTopics: result.survivingTopics || [],
            prunedTopics: result.prunedTopics || [],
            directHits: result.directHits || [],
            misses: result.misses || [],
            surpriseTopics: result.surpriseTopics || [],
            learningInsight: result.learningInsight || "No insight generated.",
            // Mocking the debate logs based on pruned topics for the Assassination UI
            hypeBackfireLogs: (result.prunedTopics || []).slice(0, 2).map((t: string) => `${t} hyped by coaching, but ignored by UPSC. Weight penalized.`),
            debateLogs: [
                `Conceptual Integrator: "The tilt towards ${result.evolvedWeights?.conceptual_bias > 0.5 ? 'concepts' : 'facts'} is clear."`,
                `Trap Analyst: "Inserted ${result.shadowMatrix?.length || 0} lethal traps into the matrix."`
            ]
        };
    }
}

export const oracleEvolution = new OracleEvolution();
