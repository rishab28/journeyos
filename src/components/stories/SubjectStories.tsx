'use client';

import { motion } from 'framer-motion';

const SUBJECTS = [
    { id: 'polity', name: 'Polity', icon: '🏛️', color: 'from-blue-600 to-indigo-400' },
    { id: 'economy', name: 'Economy', icon: '📈', color: 'from-indigo-600 to-violet-400' },
    { id: 'history', name: 'History', icon: '📜', color: 'from-amber-600 to-orange-400' },
    { id: 'geography', name: 'Geography', icon: '🌍', color: 'from-indigo-600 to-blue-400' },
    { id: 'ir', name: 'IR', icon: '🤝', color: 'from-rose-500 to-pink-400' },
    { id: 'scitech', name: 'Sci-Tech', icon: '🚀', color: 'from-blue-500 to-violet-400' },
    { id: 'environment', name: 'Env', icon: '🌿', color: 'from-indigo-500 to-blue-400' },
    { id: 'ethics', name: 'Ethics', icon: '⚖️', color: 'from-purple-600 to-violet-400' },
];

export default function SubjectStories() {
    return (
        <div className="w-full bg-black/40 backdrop-blur-3xl border-b border-white/[0.03] py-5 overflow-x-auto no-scrollbar touch-pan-x">
            <div className="flex px-6 gap-6 min-w-max items-center">
                {/* Your Story (Intelligence) */}
                <div className="flex flex-col items-center gap-2">
                    <div className="relative group cursor-pointer">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-[62px] h-[62px] rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[2px]"
                        >
                            <div className="w-full h-full rounded-full bg-black border-[1.5px] border-black flex items-center justify-center overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 animate-pulse" />
                                <span className="text-2xl z-10">🧠</span>
                            </div>
                        </motion.div>
                        <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 border-2 border-black rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white text-[10px] font-bold">+</span>
                        </div>
                    </div>
                    <span className="text-[10px] font-semibold text-white/50 tracking-wider uppercase">Your IQ</span>
                </div>

                {/* Subject Stories */}
                {SUBJECTS.map((sub, i) => (
                    <motion.div
                        key={sub.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                            type: 'spring',
                            stiffness: 260,
                            damping: 20,
                            delay: i * 0.04
                        }}
                        className="flex flex-col items-center gap-2"
                    >
                        <div className="relative cursor-pointer group">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-[62px] h-[62px] rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[2px]"
                            >
                                <div className="w-full h-full rounded-full bg-black border-[1.5px] border-black flex items-center justify-center overflow-hidden">
                                    <div className={`w-full h-full bg-gradient-to-br ${sub.color} opacity-10 absolute inset-0 group-hover:opacity-30 transition-opacity duration-300`} />
                                    <span className="text-2xl z-10 group-hover:scale-110 transition-transform duration-300">
                                        {sub.name === 'History' && '🏺'}
                                        {sub.name === 'Geography' && '🌍'}
                                        {sub.name === 'Polity' && '🏛️'}
                                        {sub.name === 'Economy' && '📈'}
                                        {sub.name === 'IR' && '🤝'}
                                        {sub.name === 'Sci-Tech' && '🚀'}
                                        {sub.name === 'Env' && '🌿'}
                                        {sub.name === 'Ethics' && '⚖️'}
                                    </span>
                                </div>
                            </motion.div>
                        </div>
                        <span className="text-[10px] font-semibold text-white/70 tracking-tight">{sub.name}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
