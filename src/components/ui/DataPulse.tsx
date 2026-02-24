import * as React from 'react';
import { cn } from '@/lib/core/utils';
import { motion } from 'framer-motion';

interface DataPulseProps extends React.HTMLAttributes<HTMLDivElement> {
    color?: 'emerald' | 'blue' | 'purple' | 'rose' | 'amber';
    size?: 'sm' | 'md' | 'lg';
}

export const DataPulse = React.forwardRef<HTMLDivElement, DataPulseProps>(
    ({ className, color = 'emerald', size = 'md', ...props }, ref) => {

        const colors = {
            emerald: "bg-emerald-500",
            blue: "bg-blue-500",
            purple: "bg-purple-500",
            rose: "bg-rose-500",
            amber: "bg-amber-500"
        };

        const sizes = {
            sm: "w-1.5 h-1.5",
            md: "w-2.5 h-2.5",
            lg: "w-4 h-4"
        };

        return (
            <div ref={ref} className={cn("relative flex items-center justify-center", sizes[size], className)} {...props}>
                <motion.div
                    className={cn("absolute rounded-full w-full h-full", colors[color])}
                    animate={{
                        scale: [1, 2.5, 3],
                        opacity: [0.7, 0, 0]
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeOut"
                    }}
                />
                <div className={cn("relative rounded-full w-full h-full", colors[color])} />
            </div>
        );
    }
);

DataPulse.displayName = 'DataPulse';
