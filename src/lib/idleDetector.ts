// Idle Detection and Auto-Reload
// This module detects when the user has been idle and forces a page reload
// to reset the Supabase client and clear stale HTTP connections.

let lastActivityTime = Date.now();

// Track user activity
if (typeof window !== 'undefined') {
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        window.addEventListener(event, () => {
            lastActivityTime = Date.now();
        }, { passive: true });
    });

    // Check on visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            const idleTime = Date.now() - lastActivityTime;
            const idleMinutes = Math.floor(idleTime / 60000);

            console.log(`👁️ [IdleDetector] Window focused after ${idleMinutes} minutes idle`);

            // Force reload if idle for more than 3 minutes
            if (idleTime > 180000) {
                console.warn(`🔄 [IdleDetector] Idle for ${idleMinutes} min. Forcing reload to clear connections...`);
                window.location.reload();
                return;
            }

            lastActivityTime = Date.now();
        }
    });
}

export { lastActivityTime };
