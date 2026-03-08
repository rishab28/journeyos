# Design System: JourneyOS (Executive Obsidian)
**Project Status:** Premium Overhaul Phase 1

## 1. Visual Theme & Atmosphere
The aesthetic is **"Executive Obsidian"**—a high-density, minimalist workspace designed for peak cognitive performance. It feels like a futuristic command center (Mission Control) rather than a simple web app.
*   **Mood:** Focused, authoritative, premium, and calm.
*   **Density:** Airy with generous whitespace, but with high-precision information clusters.
*   **Aesthetic philosophy:** Less is more. Use depth (Z-axis) through glassmorphism and subtle shadows rather than flat colors.

## 2. Color Palette & Roles
The palette is centered on deep obsidian blacks balanced with indigo accents and brilliant white foregrounds.

*   **Executive Obsidian (#050507):** Main background color. Deep, almost black, with a hint of blue. Used for the base level.
*   **Deep Obsidian (#0F0F12):** Surface color for primary panels and containers.
*   **Signature Indigo (#6366F1):** The primary accent. Used for critical actions, lethal confidence indicators, and brand highlights.
*   **Lethal Indigo Glow (#6366F1 with 15% opacity):** Used for soft glows, background orbs, and hover highlights.
*   **Neural White (#F8FAFC):** Primary text and iconography color. High contrast for readability.
*   **Muted Slate (#64748B):** Secondary text and non-interactive borders.
*   **Backfire Mauve (#A78BFA):** Secondary accent for "Shadow Matrix" or "Hype-Backfire" penalties (replaces traditional Red).

## 3. Typography Rules
*   **Headlines (Primary):** **Outfit** (Sans-serif). Bold (700). Letter-spacing (-0.02em). Should feel sharp and structural.
*   **Body (Primary):** **Inter** (Sans-serif). Regular (400) or Medium (500). Letter-spacing (-0.01em). Designed for long-form reading.
*   **Accents (Monospace/Serif):** 
    *   **Monospace:** For technical data points and "Oracle Logs".
    *   **Playfair Display:** Used sparingly for "Quotes" or "Bio-Sense" philosophical moments.

## 4. Component Stylings
*   **Buttons:** 
    *   **Shape:** Subtly rounded corners (12px / `rounded-xl`).
    *   **Interaction:** Magnetic hover effects (subtle shift) and liquid scaling (active tap: `scale-95`).
    *   **Shadow:** Deep diffused shadows with an indigo tint.
*   **GlassCards:** 
    *   **Surface:** Ultra-thin background (white at 2-3% opacity) with high blur (24px-32px).
    *   **Border:** "Neural Border"—a 1px hairline stroke (white at 8-10% opacity).
    *   **Inner Glow:** Subtle gradient glare from top-right.
*   **Navigation:** Floating sidebar/bottom bar with glassmorphism. Icons should be minimalist (Lucide).

## 5. Layout Principles
*   **The Grid:** Strict 8px baseline grid.
*   **Whitespace:** "Cognitive Breathing Room"—ensure no more than 60% of the screen is covered by permanent UI elements.
*   **Z-Index Hierarchy:** 
    *   Level 0: Background Orbs & Matrix.
    *   Level 1: Main Page Content.
    *   Level 2: Glass Panels & Cards.
    *   Level 3: Global Navigation & Modals.
    *   Level 4: Tooltips & Notifications.

## 6. Micro-Interactions
*   **Neural Pulse:** Important elements (e.g., Sync Status) should have a slow, rhythmic brightness pulse.
*   **Holographic Badges:** Oracle confidence badges should have a "shimmer" effect that moves as if light is hitting a metallic surface.
