'use server';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Profile / Biodata Server Actions
// Officer Service Record Management
// ═══════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/core/supabase/server';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function getProfile() {
    try {
        const supabase = createServerSupabaseClient();
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', DEFAULT_USER_ID)
            .single();

        if (error) throw error;
        return { success: true, profile: data };
    } catch (error: any) {
        console.error('Failed to fetch profile:', error);
        return { success: false, error: error.message };
    }
}

export async function updateProfile(data: any) {
    try {
        const supabase = createServerSupabaseClient();

        const { error } = await supabase
            .from('profiles')
            .update(data)
            .eq('user_id', DEFAULT_USER_ID);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update profile:', error);
        return { success: false, error: error.message };
    }
}

export async function uploadAvatar(formData: FormData) {
    try {
        const supabase = createServerSupabaseClient();
        const file = formData.get('file') as File;
        if (!file) throw new Error('No file provided');

        const fileExt = file.name.split('.').pop();
        const fileName = `${DEFAULT_USER_ID}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        // 1. Upload to Storage
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        // 3. Update Profile
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('user_id', DEFAULT_USER_ID);

        if (updateError) throw updateError;

        return { success: true, avatarUrl: publicUrl };
    } catch (error: any) {
        console.error('Failed to upload avatar:', error);
        return { success: false, error: error.message };
    }
}
