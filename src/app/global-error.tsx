'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log to an error reporting service like Sentry or Axiom
        console.error('Critical Global Crash:', error);
    }, [error]);

    return (
        <html lang="en">
            <body className="bg-[#050505] text-white flex flex-col items-center justify-center min-h-screen font-outfit px-6 text-center">
                <div className="absolute inset-0 bg-rose-500/[0.02] pointer-events-none" />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full border border-rose-500/10 bg-white/[0.02] backdrop-blur-md rounded-3xl p-8 shadow-2xl space-y-6"
                >
                    <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 text-3xl">
                        ⚠️
                    </div>

                    <div>
                        <h1 className="text-2xl font-black text-white/90 tracking-tight">System Overload</h1>
                        <p className="text-sm text-white/50 mt-2 leading-relaxed">
                            Bhai, it seems our AI engine or database took a hit. This is a critical fallback state.
                            The servers might be facing unprecedented traffic from other aspirants.
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-left overflow-x-auto text-[10px] font-mono text-rose-400/70">
                        {error.message || "Unknown Runtime Exception"}
                    </div>

                    <button
                        onClick={() => reset()}
                        className="w-full py-4 rounded-xl bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-white/90 transition-colors"
                    >
                        Restart Cognitive Engine
                    </button>

                    <p className="text-[10px] text-white/30 italic">
                        "The obstacle in the path becomes the path." — Marcus Aurelius
                    </p>
                </motion.div>
            </body>
        </html>
    );
}
