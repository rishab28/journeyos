'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Suggest Edit Server Action
// Crowdsourced editing with AI validation
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { validateSuggestion } from '@/lib/core/ai/gemini';

export interface SuggestEditInput {
    cardId: string;
    originalFront: string;
    originalBack: string;
    suggestedFront: string;
    suggestedBack: string;
}

export interface SuggestEditResult {
    success: boolean;
    suggestionId?: string;
    aiApproved?: boolean;
    aiReason?: string;
    error?: string;
}

export async function submitSuggestion(input: SuggestEditInput): Promise<SuggestEditResult> {
    try {
        const { cardId, originalFront, originalBack, suggestedFront, suggestedBack } = input;

        // Validate
        if (!cardId || !suggestedFront.trim() || !suggestedBack.trim()) {
            return { success: false, error: 'Card ID and suggested content are required' };
        }

        // Check if content actually changed
        if (suggestedFront.trim() === originalFront.trim() && suggestedBack.trim() === originalBack.trim()) {
            return { success: false, error: 'No changes detected' };
        }

        const supabase = createServerSupabaseClient();

        // Insert suggestion
        const { data: suggestion, error: insertError } = await supabase
            .from('suggestions')
            .insert({
                card_id: cardId,
                original_front: originalFront,
                original_back: originalBack,
                suggested_front: suggestedFront,
                suggested_back: suggestedBack,
                ai_validation_status: 'pending',
                is_applied: false,
            })
            .select('id')
            .single();

        if (insertError) {
            return { success: false, error: `Failed to save suggestion: ${insertError.message}` };
        }

        // AI validation (non-blocking — we proceed even if AI fails)
        let aiApproved = false;
        let aiReason = '';

        try {
            const { result, error: aiError } = await validateSuggestion(
                originalFront, originalBack,
                suggestedFront, suggestedBack
            );

            if (result && !aiError) {
                aiApproved = result.approved;
                aiReason = result.reason;

                // Update suggestion with AI result
                await supabase
                    .from('suggestions')
                    .update({
                        ai_validation_status: result.approved ? 'approved' : 'rejected',
                        ai_response: JSON.stringify(result),
                    })
                    .eq('id', suggestion.id);

                // If AI approved, move card to admin_review
                if (result.approved) {
                    await supabase
                        .from('cards')
                        .update({
                            status: 'admin_review',
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', cardId);
                }
            } else {
                // AI failed but suggestion was saved
                await supabase
                    .from('suggestions')
                    .update({ ai_validation_status: 'error' })
                    .eq('id', suggestion.id);
            }
        } catch {
            // AI validation failed — suggestion still saved with 'pending' status
            console.error('AI validation failed for suggestion', suggestion.id);
        }

        return {
            success: true,
            suggestionId: suggestion.id,
            aiApproved,
            aiReason,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
