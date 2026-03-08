export default function StudyCardSkeleton() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 relative bg-[#050508]">
            <div className="w-full max-w-2xl h-full rounded-[48px] bg-white/[0.02] border border-white/[0.05] relative overflow-hidden flex flex-col p-12">
                {/* Shimmer Overlay */}
                <div className="absolute inset-0 skeleton opacity-[0.05]" />

                {/* Content Skeletons */}
                <div className="relative z-10 space-y-12">
                    <div className="flex justify-center gap-4">
                        <div className="w-24 h-6 bg-white/5 rounded-full skeleton" />
                        <div className="w-20 h-6 bg-white/5 rounded-full skeleton" />
                    </div>

                    <div className="space-y-4 pt-12 flex flex-col items-center">
                        <div className="w-full h-8 bg-white/5 rounded-xl skeleton" />
                        <div className="w-5/6 h-8 bg-white/5 rounded-xl skeleton" />
                        <div className="w-4/6 h-8 bg-white/5 rounded-xl skeleton" />
                    </div>
                </div>

                {/* Bottom Shell Skeleton */}
                <div className="absolute bottom-0 inset-x-0 h-[120px] bg-white/[0.03] rounded-t-[48px] border-t border-white/[0.05] p-10 flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="w-32 h-3 bg-white/5 rounded skeleton" />
                        <div className="w-48 h-4 bg-white/5 rounded skeleton" />
                    </div>
                    <div className="w-32 h-12 bg-white/5 rounded-2xl skeleton" />
                </div>
            </div>
        </div>
    );
}
