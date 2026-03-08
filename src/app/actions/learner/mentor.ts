'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Ask Mentor Server Action
// Persistent multi-turn conversations (ChatGPT style)
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { neuralGateway } from '@/lib/core/ai/neuralGateway';
import { PROMPTS } from '@/lib/core/ai/prompts';
import { generateEmbedding } from '@/lib/core/ai/gemini';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function getMentorConversations() {
    try {
        const supabase = createServerSupabaseClient();
        const { data, error } = await supabase
            .from('mentor_conversations')
            .select('*')
            .eq('user_id', DEFAULT_USER_ID)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return { success: true, conversations: data };
    } catch (error: any) {
        console.error('Failed to fetch mentor conversations:', error);
        return { success: false, error: error.message };
    }
}

export async function getMentorMessages(conversationId: string) {
    try {
        const supabase = createServerSupabaseClient();
        const { data, error } = await supabase
            .from('mentor_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return { success: true, messages: data };
    } catch (error: any) {
        console.error('Failed to fetch mentor messages:', error);
        return { success: false, error: error.message };
    }
}

export async function createMentorConversation(title: string) {
    try {
        const supabase = createServerSupabaseClient();
        const { data, error } = await supabase
            .from('mentor_conversations')
            .insert({ title, user_id: DEFAULT_USER_ID })
            .select()
            .single();

        if (error) throw error;
        return { success: true, conversation: data };
    } catch (error: any) {
        console.error('Failed to create mentor conversation:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteMentorConversation(conversationId: string) {
    try {
        const supabase = createServerSupabaseClient();
        const { error } = await supabase
            .from('mentor_conversations')
            .delete()
            .eq('id', conversationId);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete mentor conversation:', error);
        return { success: false, error: error.message };
    }
}

export async function updateConversationTags(conversationId: string, subject: string, topic: string) {
    try {
        const supabase = createServerSupabaseClient();
        const { error } = await supabase
            .from('mentor_conversations')
            .update({ subject, topic, updated_at: new Date().toISOString() })
            .eq('id', conversationId);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update conversation tags:', error);
        return { success: false, error: error.message };
    }
}

export async function askMentor(
    userQuestion: string,
    conversationId?: string
): Promise<{ success: boolean; answer: string; conversationId: string; error?: string }> {
    try {
        const supabase = createServerSupabaseClient();
        let activeConversationId = conversationId;

        // 1. Ensure Conversation exists
        if (!activeConversationId) {
            const title = userQuestion.length > 40 ? userQuestion.substring(0, 37) + '...' : userQuestion;
            const convRes = await createMentorConversation(title);
            if (!convRes.success || !convRes.conversation) throw new Error('Failed to start conversation');
            activeConversationId = convRes.conversation.id;
        }

        // 2. Fetch Conversation Meta (to check if tags exist)
        const { data: convMeta } = await supabase
            .from('mentor_conversations')
            .select('subject, topic')
            .eq('id', activeConversationId)
            .single();

        // 3. Save User Message
        const { error: userMsgError } = await supabase
            .from('mentor_messages')
            .insert({ conversation_id: activeConversationId, role: 'user', content: userQuestion });
        if (userMsgError) throw userMsgError;

        // 4. Fetch History (last 6 messages for context)
        const { data: history } = await supabase
            .from('mentor_messages')
            .select('role, content')
            .eq('conversation_id', activeConversationId)
            .order('created_at', { ascending: false })
            .limit(7);

        const chatHistoryString = history
            ? history.reverse().map(m => `${m.role === 'user' ? 'Student' : 'Mentor'}: ${m.content}`).join('\n')
            : `Student: ${userQuestion}`;

        // 5. Generate RAG context
        const questionEmbedding = await generateEmbedding(userQuestion);
        const { data: matchedCards } = await supabase.rpc('match_cards', {
            query_embedding: questionEmbedding,
            match_threshold: 0.65,
            match_count: 5
        });

        let context = '';
        if (matchedCards && matchedCards.length > 0) {
            context = 'RELEVANT KNOWLEDGE FROM THE ARCHIVE:\n';
            matchedCards.forEach((c: any, i: number) => {
                context += `[Source ${i + 1}] Topic: ${c.topic} | Idea: ${c.front} -> ${c.back}\n`;
            });
        }

        // 6. Call AI with History + Context
        const result = await neuralGateway.generateContent({
            model: 'gemini-2.0-flash',
            systemPrompt: PROMPTS.Mentor.SYSTEM,
            userPrompt: `${context}\n\nCONVERSATION HISTORY:\n${chatHistoryString}\n\nMentor, please respond to the latest student query keeping the context and history in mind. Keep it natural and guiding.`,
            temperature: 0.7,
            maxTokens: 1536,
        });

        const answer = result.text;

        // 7. Auto-Categorize if tags are missing
        if (activeConversationId && (!convMeta?.subject || !convMeta?.topic)) {
            try {
                const catResult = await neuralGateway.generateContent({
                    model: 'gemini-2.0-flash',
                    systemPrompt: "You are a UPSC classification expert. Given a student's conversation with a mentor, extract the UPSC 'Subject' (e.g., Polity, History, Economy, Ethics, Internal Security) and a specific 'Topic'. Return ONLY a JSON object: { \"subject\": \"...\", \"topic\": \"...\" }",
                    userPrompt: chatHistoryString + `\n\nMentor Answer: ${answer}`,
                    temperature: 0.1,
                });
                const categories = JSON.parse(catResult.text.replace(/```json|```/g, '').trim());
                if (categories.subject && categories.topic) {
                    await supabase
                        .from('mentor_conversations')
                        .update({ subject: categories.subject, topic: categories.topic })
                        .eq('id', activeConversationId);
                }
            } catch (catErr) {
                console.warn('[Mentor] Failed to auto-categorize:', catErr);
            }
        }

        // 8. Save Mentor Response
        const { error: mentorMsgError } = await supabase
            .from('mentor_messages')
            .insert({ conversation_id: activeConversationId, role: 'mentor', content: answer });
        if (mentorMsgError) throw mentorMsgError;

        // 9. Update conversation updated_at
        await supabase
            .from('mentor_conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', activeConversationId);

        return { success: true, answer, conversationId: activeConversationId as string };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[Mentor] Error: ${message}`);
        return { success: false, answer: '', conversationId: '', error: message };
    }
}
