'use client';

import { useState } from 'react';
import { supabase } from '@/lib/core/supabase/client';
import { motion } from 'framer-motion';

interface AuthFormProps {
    onSuccess: () => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
    const [isLogin, setIsLogin] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
            }
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-black text-white font-outfit uppercase tracking-tighter">
                    {isLogin ? 'Welcome Back' : 'Create Neural Identity'}
                </h2>
                <p className="text-white/40 text-xs mt-2">
                    {isLogin ? 'Sync your progress across the matrix' : 'Your data will be encrypted and synced to the cloud'}
                </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Secret Key (Password)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                        required
                    />
                </div>

                {error && (
                    <p className="text-rose-500 text-[10px] font-bold text-center uppercase tracking-widest">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-full bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {loading ? 'Authenticating...' : (isLogin ? 'Login To Brain' : 'Initialize Identity')}
                </button>
            </form>

            <div className="text-center">
                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-white/30 text-[10px] font-bold uppercase tracking-widest hover:text-white/50 transition-colors"
                >
                    {isLogin ? "Don't have an identity? Create one" : 'Already partitioned? Login here'}
                </button>
            </div>
        </div>
    );
}
