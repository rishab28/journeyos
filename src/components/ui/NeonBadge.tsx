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
            emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
            blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
            purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
            rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
            slate: "bg-slate-500/10 text-slate-400 border-slate-500/20"
        };

        const glowVariants = {
            emerald: "shadow-[0_0_15px_rgba(16,185,129,0.15)]",
            amber: "shadow-[0_0_15px_rgba(245,158,11,0.15)]",
            blue: "shadow-[0_0_15px_rgba(59,130,246,0.15)]",
            purple: "shadow-[0_0_15px_rgba(168,85,247,0.15)]",
            rose: "shadow-[0_0_15px_rgba(244,63,94,0.15)]",
            slate: "shadow-[0_0_15px_rgba(100,116,139,0.15)]"
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
