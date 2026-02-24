import * as React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/core/utils';
import { LucideIcon } from 'lucide-react';

interface MatrixButtonProps extends HTMLMotionProps<"button"> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'neon';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
}

export const MatrixButton = React.forwardRef<HTMLButtonElement, MatrixButtonProps>(
    ({
        className,
        variant = 'primary',
        size = 'md',
        icon: Icon,
        iconPosition = 'left',
        loading = false,
        children,
        disabled,
        ...props
    }, ref) => {

        const baseStyles = "relative inline-flex items-center justify-center font-bold transition-all duration-300 rounded-xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black";

        const variants = {
            primary: "bg-white text-black hover:bg-white/90 focus:ring-white/50",
            secondary: "bg-white/10 text-white hover:bg-white/20 border border-white/10 focus:ring-white/30",
            ghost: "bg-transparent text-white/70 hover:text-white hover:bg-white/5 focus:ring-white/20",
            danger: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 focus:ring-red-500/50",
            neon: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/60 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] focus:ring-emerald-500/50"
        };

        const sizes = {
            sm: "text-xs px-3 py-1.5 gap-1.5",
            md: "text-sm px-5 py-2.5 gap-2",
            lg: "text-base px-8 py-4 gap-3",
            icon: "p-2.5"
        };

        return (
            <motion.button
                ref={ref}
                whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                disabled={disabled || loading}
                {...props}
            >
                {/* Micro-interaction highlight */}
                <span className="absolute inset-0 bg-white/0 hover:bg-white/5 transition-colors pointer-events-none" />

                {loading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current opacity-70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : Icon && iconPosition === 'left' ? (
                    <Icon className={cn("shrink-0", size === 'sm' ? "w-3.5 h-3.5" : size === 'lg' ? "w-5 h-5" : "w-4 h-4")} />
                ) : null}

                {children as React.ReactNode}

                {!loading && Icon && iconPosition === 'right' && (
                    <Icon className={cn("shrink-0", size === 'sm' ? "w-3.5 h-3.5" : size === 'lg' ? "w-5 h-5" : "w-4 h-4")} />
                )}
            </motion.button>
        );
    }
);

MatrixButton.displayName = 'MatrixButton';
