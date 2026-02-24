'use server';

import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { revalidatePath } from 'next/cache';

function generateInviteCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function createSquad(name: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const inviteCode = generateInviteCode();

    const { data: squad, error: squadError } = await supabase
        .from('squads')
        .insert({
            name,
            invite_code: inviteCode,
            creator_id: user.id
        })
        .select()
        .single();

    if (squadError) return { success: false, error: squadError.message };

    // Add creator as admin member
    const { error: memberError } = await supabase
        .from('squad_members')
        .insert({
            squad_id: squad.id,
            user_id: user.id,
            role: 'admin'
        });

    if (memberError) return { success: false, error: memberError.message };

    revalidatePath('/squads');
    return { success: true, squad };
}

export async function joinSquad(inviteCode: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Find squad by invite code
    const { data: squad, error: squadError } = await supabase
        .from('squads')
        .select('id')
        .eq('invite_code', inviteCode.toUpperCase())
        .single();

    if (squadError || !squad) return { success: false, error: 'Squad not found' };

    // Check if already a member
    const { data: existing } = await supabase
        .from('squad_members')
        .select('id')
        .eq('squad_id', squad.id)
        .eq('user_id', user.id)
        .maybeSingle();

    if (existing) return { success: false, error: 'Already a member' };

    // Add as member
    const { error: memberError } = await supabase
        .from('squad_members')
        .insert({
            squad_id: squad.id,
            user_id: user.id,
            role: 'member'
        });

    if (memberError) return { success: false, error: memberError.message };

    revalidatePath('/squads');
    return { success: true, squadId: squad.id };
}

export async function shareIntel(squadId: string, type: 'card' | 'story' | 'note', targetId: string, title: string, contentSnapshot: any) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Verify membership
    const { data: member } = await supabase
        .from('squad_members')
        .select('id')
        .eq('squad_id', squadId)
        .eq('user_id', user.id)
        .single();

    if (!member) return { success: false, error: 'Not a squad member' };

    const { data, error } = await supabase
        .from('shared_intel')
        .insert({
            squad_id: squadId,
            user_id: user.id,
            type,
            target_id: targetId,
            title,
            content_snapshot: contentSnapshot
        })
        .select()
        .single();

    if (error) return { success: false, error: error.message };

    return { success: true, intel: data };
}

export async function getSquadIntel(squadId: string) {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
        .from('shared_intel')
        .select(`
            *,
            profiles:user_id(full_name, avatar_url),
            comments:shared_intel_comments(count)
        `)
        .eq('squad_id', squadId)
        .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, intel: data };
}

export async function getMySquads() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data, error } = await supabase
        .from('squad_members')
        .select(`
            id,
            role,
            joined_at,
            squads(*)
        `)
        .eq('user_id', user.id);

    if (error) return { success: false, error: error.message };
    return { success: true, squads: data.map(d => ({ ...d.squads, myRole: d.role, joinedAt: d.joined_at })) };
}

export async function analyzeSquadBlindspots(squadId: string) {
    const supabase = await createServerSupabaseClient();

    // 1. Fetch all telemetry for squad members in the last 7 days
    const { data: members } = await supabase
        .from('squad_members')
        .select('user_id')
        .eq('squad_id', squadId);

    if (!members || members.length === 0) return { success: false, error: 'No members' };
    const userIds = members.map(m => m.user_id);

    // 2. Identify topics with multiple failures across different members
    // For MVP, we'll look at the most recent failures
    const { data: failures } = await supabase
        .from('telemetry')
        .select('metadata->topic, user_id')
        .in('user_id', userIds)
        .eq('action', 'card_swiped')
        .eq('metadata->correct', false)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (!failures) return { success: true, blindspots: [] };

    // Group by topic and count unique users
    const topicStats: Record<string, Set<string>> = {};
    failures.forEach(f => {
        const topic = f.topic as string;
        if (!topic) return;
        if (!topicStats[topic]) topicStats[topic] = new Set();
        topicStats[topic].add(f.user_id);
    });

    const blindspots = Object.entries(topicStats)
        .filter(([_, users]) => users.size >= 2) // Flag if 2 or more members fail
        .map(([topic, users]) => ({
            topic,
            memberCount: users.size
        }));

    // 3. Persist squad blindspots
    for (const bs of blindspots) {
        await supabase.from('squad_blindspots').upsert({
            squad_id: squadId,
            topic: bs.topic,
            member_failure_count: bs.memberCount,
            status: 'active'
        }, { onConflict: 'squad_id,topic' });
    }

    return { success: true, blindspots };
}
