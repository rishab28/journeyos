import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getProfile } from '@/app/actions/learner/profile';

interface ProfileState {
    fullName: string;
    avatarUrl: string;
    upscIQ: number;
    officerStatus: string;
    isLoading: boolean;

    // Actions
    fetchProfile: () => Promise<void>;
    updateLocalProfile: (data: Partial<{ fullName: string; avatarUrl: string; upscIQ: number; officerStatus: string }>) => void;
}

export const useProfileStore = create<ProfileState>()(
    persist(
        (set) => ({
            fullName: '',
            avatarUrl: '',
            upscIQ: 40,
            officerStatus: 'Aspirant',
            isLoading: false,

            fetchProfile: async () => {
                set({ isLoading: true });
                const res = await getProfile();
                if (res.success && res.profile) {
                    set({
                        fullName: res.profile.full_name || '',
                        avatarUrl: res.profile.avatar_url || '',
                        upscIQ: res.profile.upsc_iq || 40,
                        officerStatus: res.profile.officer_status || 'Aspirant',
                        isLoading: false
                    });
                } else {
                    set({ isLoading: false });
                }
            },

            updateLocalProfile: (data) => {
                set((state) => ({
                    fullName: data.fullName ?? state.fullName,
                    avatarUrl: data.avatarUrl ?? state.avatarUrl,
                    upscIQ: data.upscIQ ?? state.upscIQ,
                    officerStatus: data.officerStatus ?? state.officerStatus,
                }));
            }
        }),
        {
            name: 'journeyos-profile-storage',
        }
    )
);
