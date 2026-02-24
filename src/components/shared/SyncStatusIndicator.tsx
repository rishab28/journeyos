'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { triggerHaptic } from '@/lib/core/haptics';
import { useSRSStore } from '@/store/srsStore';
import { useProgressStore } from '@/store/progressStore';

export default function SyncStatusIndicator() {
    const [isOnline, setIsOnline] = useState(true);
    const srsSyncStatus = useSRSStore(s => s.syncStatus);
    const progressSyncStatus = useProgressStore(s => s.syncStatus);

    const isSyncing = srsSyncStatus === 'syncing' || progressSyncStatus === 'syncing';
    const isError = srsSyncStatus === 'error' || progressSyncStatus === 'error';

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleOnline = () => {
            setIsOnline(true);
            triggerHaptic('success');
        };
        const handleOffline = () => {
            setIsOnline(false);
            triggerHaptic('warning');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        setIsOnline(navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const getStatusColor = () => {
        if (!isOnline) return 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]';
        if (isSyncing) return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
        if (isError) return 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]';
        return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
    };

    const getStatusText = () => {
        if (!isOnline) return 'Offline (Local-First)';
        if (isSyncing) return 'Syncing Pulse...';
        if (isError) return 'Sync Error';
        return 'Synced';
    };

    return (
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5 backdrop-blur-md">
            <div className="relative flex items-center justify-center">
                <div className={`w-2 h-2 rounded-full ${getStatusColor()} transition-colors duration-500`} />
                {isSyncing && (
                    <motion.div
                        className="absolute inset-0 w-2 h-2 rounded-full border border-amber-400"
                        animate={{ scale: [1, 2], opacity: [1, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                    />
                )}
            </div>

            <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 leading-none mb-0.5">
                    {getStatusText()}
                </span>
            </div>

            <AnimatePresence mode="wait">
                {!isOnline ? (
                    <motion.div
                        key="offline"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                    >
                        <WifiOff size={10} className="text-rose-400" />
                    </motion.div>
                ) : isSyncing ? (
                    <motion.div
                        key="syncing"
                        initial={{ opacity: 0, rotate: 0 }}
                        animate={{ opacity: 1, rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        exit={{ opacity: 0 }}
                    >
                        <RefreshCw size={10} className="text-amber-400" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="online"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                    >
                        <Wifi size={10} className="text-emerald-400" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
