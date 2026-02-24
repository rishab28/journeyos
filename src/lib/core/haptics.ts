/**
 * JourneyOS — Haptic Feedback Utility
 * Trigggers subtle vibrations on supported mobile devices.
 */

export const triggerHaptic = (style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' = 'light') => {
    if (typeof window === 'undefined' || !window.navigator.vibrate) return;

    switch (style) {
        case 'light':
            window.navigator.vibrate(10);
            break;
        case 'medium':
            window.navigator.vibrate(20);
            break;
        case 'heavy':
            window.navigator.vibrate(50);
            break;
        case 'success':
            window.navigator.vibrate([10, 30, 10]);
            break;
        case 'warning':
            window.navigator.vibrate([10, 50, 10, 50]);
            break;
        default:
            window.navigator.vibrate(10);
    }
};
