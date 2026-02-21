'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Lethality Engine 2.0 (The Formula)
// Calculates the mathematical probability of a topic appearing
// ═══════════════════════════════════════════════════════════

export interface LethalityComponents {
    spv: number; // Static Pillar Value (0-10) - Core syllabus weight
    ca: number;  // Causal Anchor (0-10) - News / Anniversary / Legal trigger
    oe: number;  // Option Evolution (0-10) - Format shift / Complexity increase
    xs: number;  // Cross-Exam Signals (0-10) - Data points from CDS / NDA exams
    gc: number;  // Grey-Area Complexity (0-10) - Ambiguity / Trap potential
}

/**
 * THE FORMULA:
 * Lethality = (S.P.V * 0.4) + (C.A * 0.3) + (O.E * 0.15) + (X.S * 0.1) + (G.C * 0.05)
 * Returns a score from 0 to 100.
 */
export function calculateLethalityScore(components: LethalityComponents): number {
    const { spv, ca, oe, xs, gc } = components;

    // Weighted Calculation
    const rawScore = (
        (spv * 0.4) +
        (ca * 0.3) +
        (oe * 0.15) +
        (xs * 0.1) +
        (gc * 0.05)
    );

    // Normalize to 100 (since each component is 0-10)
    return Math.round(rawScore * 10);
}

/**
 * Returns a verbal 'Status' based on Lethality %
 */
export function getLethalityTier(score: number): 'Low' | 'Moderate' | 'High' | 'GOD-MODE' {
    if (score >= 90) return 'GOD-MODE';
    if (score >= 70) return 'High';
    if (score >= 40) return 'Moderate';
    return 'Low';
}

/**
 * Explanation Generator for UI (Mathematical Proof)
 */
export function getLethalityBreakdown(components: LethalityComponents): string {
    const score = calculateLethalityScore(components);
    const tier = getLethalityTier(score);

    return `Score: ${score}% [${tier}]. S.P.V Pillar at ${components.spv}/10. Causal Anchor trigger identified at ${components.ca}/10. Shift in Option Evolution: ${components.oe}/10. Signals detected from CDS/NDA pipelines.`;
}
