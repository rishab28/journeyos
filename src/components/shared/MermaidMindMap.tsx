'use client';

import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidMindMapProps {
    code: string;
}

const MermaidMindMap: React.FC<MermaidMindMapProps> = ({ code }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            securityLevel: 'loose',
            fontFamily: 'Inter',
        });

        const renderMermaid = async () => {
            if (containerRef.current && code) {
                try {
                    containerRef.current.innerHTML = '';
                    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                    const { svg } = await mermaid.render(id, code);
                    containerRef.current.innerHTML = svg;

                    // Style the generated SVG
                    const svgElement = containerRef.current.querySelector('svg');
                    if (svgElement) {
                        svgElement.style.width = '100%';
                        svgElement.style.height = 'auto';
                        svgElement.style.maxWidth = '100%';
                    }
                } catch (error) {
                    console.error('Mermaid render error:', error);
                    containerRef.current.innerHTML = '<p class="text-rose-400 text-xs">Mind Map visualization failed.</p>';
                }
            }
        };

        renderMermaid();
    }, [code]);

    return (
        <div className="w-full bg-black/20 rounded-2xl p-4 border border-white/5 overflow-hidden">
            <div ref={containerRef} className="flex justify-center" />
        </div>
    );
};

export default MermaidMindMap;
