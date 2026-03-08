'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Officer Biodata (Service Record)
// High-fidelity profile management for UPSC Aspirants
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '@/lib/core/haptics';
import { getProfile, updateProfile, uploadAvatar } from '@/app/actions/learner';
import { GlassCard } from '@/components/ui/GlassCard';
import { useProfileStore } from '@/store/profileStore';

export default function OfficerBiodata() {
    const { updateLocalProfile } = useProfileStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const res = await getProfile();
        if (res.success) {
            setProfile(res.profile);
            updateLocalProfile({
                fullName: res.profile.full_name,
                avatarUrl: res.profile.avatar_url,
                upscIQ: res.profile.upsc_iq,
                officerStatus: res.profile.officer_status
            });
        }
        setLoading(false);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        triggerHaptic('medium');

        const formData = new FormData();
        formData.append('file', file);

        const res = await uploadAvatar(formData);
        if (res.success && res.avatarUrl) {
            setProfile({ ...profile, avatar_url: res.avatarUrl });
            updateLocalProfile({ avatarUrl: res.avatarUrl });
            setMessage({ type: 'success', text: 'Avatar Updated.' });
            setTimeout(() => setMessage(null), 3000);
        } else {
            setMessage({ type: 'error', text: 'Upload Failed.' });
        }
        setUploading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        triggerHaptic('medium');

        const res = await updateProfile({
            full_name: profile.full_name,
            target_year: parseInt(profile.target_year) || null,
            optional_subject: profile.optional_subject,
            attempt_count: parseInt(profile.attempt_count) || 0,
            hometown_state: profile.hometown_state,
            service_preference: profile.service_preference,
            officer_status: profile.officer_status,
        });

        if (res.success) {
            updateLocalProfile({
                fullName: profile.full_name,
                officerStatus: profile.officer_status
            });
            setMessage({ type: 'success', text: 'Service Record Updated.' });
            setTimeout(() => setMessage(null), 3000);
        } else {
            setMessage({ type: 'error', text: 'Update Failed. Try again.' });
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-32 bg-white/5 rounded-3xl" />
                <div className="h-64 bg-white/5 rounded-3xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <form onSubmit={handleSave} className="space-y-6">
                {/* ── Status Card ── */}
                <GlassCard variant="default" className="p-6 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full" />
                    <div className="flex items-center gap-5 mb-6">
                        {/* Avatar Upload */}
                        <div className="relative group">
                            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-inner group-hover:border-indigo-500/30 transition-all">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Officer" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl">🦁</span>
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center cursor-pointer hover:scale-110 active:scale-90 transition-all shadow-lg">
                                <span className="text-xs">📸</span>
                                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                            </label>
                        </div>

                        <div>
                            <h3 className="text-[10px] font-black text-white/30 tracking-widest uppercase mb-1" style={{ fontFamily: 'var(--font-outfit)' }}>Current Designation</h3>
                            <select
                                value={profile?.officer_status || 'Aspirant'}
                                onChange={(e) => setProfile({ ...profile, officer_status: e.target.value })}
                                className="bg-transparent text-indigo-400 font-black text-xl outline-none cursor-pointer"
                            >
                                <option value="Aspirant" className="bg-black text-white">Aspirant</option>
                                <option value="Candidate" className="bg-black text-white">Candidate</option>
                                <option value="Officer" className="bg-black text-white">Officer</option>
                                <option value="Veteran" className="bg-black text-white">Veteran</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 text-[10px] font-black tracking-widest uppercase">
                        <div>
                            <p className="text-white/30 mb-1">UPSC IQ</p>
                            <p className="text-white">{profile?.upsc_iq || 0}</p>
                        </div>
                        <div>
                            <p className="text-white/30 mb-1">Service Rank</p>
                            <p className="text-white">Unassigned</p>
                        </div>
                    </div>
                </GlassCard>

                {/* ── Personal Details ── */}
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Personal Service Record</p>

                    <div className="space-y-3">
                        {/* Full Name */}
                        <div className="group relative">
                            <div className="absolute inset-0 bg-white/[0.02] rounded-2xl -m-1 opacity-0 group-focus-within:opacity-100 transition-opacity" />
                            <div className="relative p-4 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/50 backdrop-blur-sm transition-all group-focus-within:border-indigo-500/30">
                                <label className="block text-[9px] font-black text-white/30 uppercase tracking-widest mb-1.5">Officer Name</label>
                                <input
                                    type="text"
                                    value={profile?.full_name || ''}
                                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                    placeholder="Enter your full name"
                                    className="w-full bg-transparent border-none outline-none text-sm font-bold text-white placeholder:text-white/10"
                                />
                            </div>
                        </div>

                        {/* Two Column details */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Target Year */}
                            <div className="relative p-4 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/50 backdrop-blur-sm">
                                <label className="block text-[9px] font-black text-white/30 uppercase tracking-widest mb-1.5">Target Year</label>
                                <input
                                    type="number"
                                    value={profile?.target_year || ''}
                                    onChange={(e) => setProfile({ ...profile, target_year: e.target.value })}
                                    placeholder="2026"
                                    className="w-full bg-transparent border-none outline-none text-sm font-bold text-white placeholder:text-white/10"
                                />
                            </div>

                            {/* Optional Subject */}
                            <div className="relative p-4 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/50 backdrop-blur-sm">
                                <label className="block text-[9px] font-black text-white/30 uppercase tracking-widest mb-1.5">Optional</label>
                                <input
                                    type="text"
                                    value={profile?.optional_subject || ''}
                                    onChange={(e) => setProfile({ ...profile, optional_subject: e.target.value })}
                                    placeholder="PSIR / Anthro"
                                    className="w-full bg-transparent border-none outline-none text-sm font-bold text-white placeholder:text-white/10"
                                />
                            </div>
                        </div>

                        {/* Attempt Count & Home State */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative p-4 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/50 backdrop-blur-sm">
                                <label className="block text-[9px] font-black text-white/30 uppercase tracking-widest mb-1.5">Attempts</label>
                                <input
                                    type="number"
                                    value={profile?.attempt_count || 0}
                                    onChange={(e) => setProfile({ ...profile, attempt_count: e.target.value })}
                                    className="w-full bg-transparent border-none outline-none text-sm font-bold text-white"
                                />
                            </div>
                            <div className="relative p-4 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/50 backdrop-blur-sm">
                                <label className="block text-[9px] font-black text-white/30 uppercase tracking-widest mb-1.5">Home State</label>
                                <input
                                    type="text"
                                    value={profile?.hometown_state || ''}
                                    onChange={(e) => setProfile({ ...profile, hometown_state: e.target.value })}
                                    placeholder="Delhi / HP"
                                    className="w-full bg-transparent border-none outline-none text-sm font-bold text-white placeholder:text-white/10"
                                />
                            </div>
                        </div>

                        {/* Service Preference */}
                        <div className="group relative">
                            <div className="relative p-4 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/50 backdrop-blur-sm">
                                <label className="block text-[9px] font-black text-white/30 uppercase tracking-widest mb-1.5">Service Preference</label>
                                <input
                                    type="text"
                                    value={profile?.service_preference || ''}
                                    onChange={(e) => setProfile({ ...profile, service_preference: e.target.value })}
                                    placeholder="IAS / IPS / IFS"
                                    className="w-full bg-transparent border-none outline-none text-sm font-bold text-white placeholder:text-white/10"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-4 bg-white text-black font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {saving ? 'Updating Record...' : 'Update Service Record'}
                    </button>

                    {message && (
                        <motion.p
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`text-center text-[10px] font-black uppercase tracking-widest ${message.type === 'success' ? 'text-indigo-400' : 'text-rose-500'}`}
                        >
                            {message.text}
                        </motion.p>
                    )}
                </div>
            </form>
        </div>
    );
}
