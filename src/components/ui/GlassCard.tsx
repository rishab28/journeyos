import * as React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/core/utils';

interface GlassCardProps extends HTMLMotionProps<"div"> {
    variant?: 'default' | 'luxury' | 'solid' | 'panel';
    interactive?: boolean;
}

export const GlassCard = React.memo(React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ className, variant = 'default', interactive = false, children, ...props }, ref) => {
        const baseStyle = "relative overflow-hidden rounded-2xl border transition-all duration-300";

        const variants = {
            default: "bg-white/[0.03] backdrop-blur-xl border-white/[0.08] shadow-lg",
            luxury: "glass-card", // Uses the globals.css luxury glass class
            solid: "bg-[#0a0f18] border-white/5",
            panel: "bg-black/40 backdrop-blur-md border-white/10"
        };

        const interactiveStyle = interactive
            ? "hover:bg-white/[0.06] hover:border-white/[0.15] hover:shadow-[0_8px_32px_rgba(255,255,255,0.05)] cursor-pointer active:scale-[0.98]"
            : "";

        return (
            <motion.div
                ref={ref}
                className={cn(baseStyle, variants[variant], interactiveStyle, className, "will-change-transform")}
                {...props}
            >
                {/* Subtle glare effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.01] to-transparent pointer-events-none" />

                {children as React.ReactNode}
            </motion.div>
        );
    }
));

GlassCard.displayName = 'GlassCard';
