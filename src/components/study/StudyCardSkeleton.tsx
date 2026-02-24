'use client';

import { motion } from 'framer-motion';

export default function StudyCardSkeleton() {
    return (
        <div className="w-full h-full flex items-center justify-center p-6 relative">
            <div className="w-full max-w-sm aspect-[3/4] rounded-[2.5rem] bg-white/[0.03] border border-white/5 relative overflow-hidden flex flex-col p-8">
                {/* Shimmer Overlay */}
                <div className="absolute inset-0 skeleton" />

                {/* Content Skeletons */}
                <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="w-16 h-4 bg-white/5 rounded-full skeleton" />
                        <div className="w-12 h-12 rounded-full bg-white/5 skeleton" />
                    </div>

                    <div className="space-y-3 pt-10">
                        <div className="w-full h-6 bg-white/5 rounded-lg skeleton" />
                        <div className="w-5/6 h-6 bg-white/5 rounded-lg skeleton" />
                        <div className="w-4/6 h-6 bg-white/5 rounded-lg skeleton" />
                    </div>

                    <div className="pt-20 space-y-2">
                        <div className="w-full h-3 bg-white/5 rounded skeleton" />
                        <div className="w-full h-3 bg-white/5 rounded skeleton" />
                    </div>
                </div>

                {/* Bottom UI Skeleton */}
                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                    <div className="w-10 h-10 rounded-full bg-white/5 skeleton" />
                    <div className="w-24 h-10 rounded-xl bg-white/5 skeleton" />
                </div>
            </div>
        </div>
    );
}
