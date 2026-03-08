import * as React from 'react';
import { cn } from '@/lib/core/utils';
import { motion } from 'framer-motion';

interface NeonBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'emerald' | 'amber' | 'blue' | 'purple' | 'rose' | 'slate';
    pulse?: boolean;
}

export const NeonBadge = React.memo(React.forwardRef<HTMLDivElement, NeonBadgeProps>(
    ({ className, variant = 'slate', pulse = false, children, ...props }, ref) => {

        const baseStyle = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border backdrop-blur-md transition-colors";

        const variants = {
            emerald: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
            amber: "bg-white/5 text-slate-400 border-white/10",
            blue: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
            purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
            rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
            slate: "bg-slate-500/10 text-slate-400 border-slate-500/20"
        };

        const glowVariants = {
            emerald: "shadow-[0_0_15px_rgba(99,102,241,0.1)]",
            amber: "shadow-none",
            blue: "shadow-[0_0_15px_rgba(99,102,241,0.1)]",
            purple: "shadow-[0_0_15px_rgba(168,85,247,0.1)]",
            rose: "shadow-[0_0_15px_rgba(244,63,94,0.1)]",
            slate: "shadow-[0_0_15px_rgba(100,116,139,0.1)]"
        };

        if (pulse) {
            return (
                <motion.div
                    ref={ref as any}
                    className={cn(baseStyle, variants[variant], glowVariants[variant], className, "will-change-opacity")}
                    animate={{ opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" } as any}
                    viewport={{ once: true, margin: "-20%" }}
                    {...(props as any)}
                >
                    {children as React.ReactNode}
                </motion.div>
            );
        }

        return (
            <div
                ref={ref}
                className={cn(baseStyle, variants[variant], glowVariants[variant], className)}
                {...props}
            >
                {children as React.ReactNode}
            </div>
        );
    }
));

NeonBadge.displayName = 'NeonBadge';
