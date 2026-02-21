'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error
        console.error("Route Error Segment:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-sm w-full space-y-6"
            >
                <div className="text-5xl">⚡</div>

                <div>
                    <h2 className="text-xl font-bold text-white/90">Cognitive Glitch Detected</h2>
                    <p className="text-sm text-white/50 mt-2 leading-relaxed">
                        Bhai, the AI engine encountered a temporary hiccup processing this module.
                        Don't lose focus, just reload it.
                    </p>
                </div>

                <button
                    onClick={() => reset()}
                    className="w-full py-3.5 rounded-xl border border-white/10 bg-white/5 text-white/80 font-semibold text-sm hover:bg-white/10 transition-colors"
                >
                    Refresh Module
                </button>
            </motion.div>
        </div>
    );
}
