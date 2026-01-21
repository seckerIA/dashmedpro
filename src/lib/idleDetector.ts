// Idle Detection - Tracks user activity WITHOUT forcing reloads
// This module tracks user idle time and handles session recovery gracefully

let lastActivityTime = Date.now();

// Track user activity
if (typeof window !== 'undefined') {
    // Expose lastActivityTime globally for RouteChangeHandler
    (window as any).lastActivityTime = lastActivityTime;

    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        window.addEventListener(event, () => {
            lastActivityTime = Date.now();
            (window as any).lastActivityTime = lastActivityTime;
        }, { passive: true });
    });

    // On visibility change - graceful recovery WITHOUT reload
    document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') {
            const idleTime = Date.now() - lastActivityTime;
            const idleMinutes = Math.floor(idleTime / 60000);
            const idleSeconds = Math.floor(idleTime / 1000);

            console.log(`👁️ [IdleDetector] Window focused after ${idleMinutes} min (${idleSeconds}s) idle`);

            // REMOVED: Aggressive reload after 30s idle
            // Instead, we let React Query and Supabase client handle reconnection
            // gracefully. If token is expired, the QueryCache error handler will
            // refresh it. If connection is stale, the next query will reconnect.

            // For very long idle periods (>10 min), we can proactively trigger
            // a soft reconnection check
            if (idleTime > 600000) { // 10 minutes
                console.log('🔄 [IdleDetector] Long idle detected. Triggering soft session check...');
                // This is imported dynamically to avoid circular deps
                try {
                    const { checkToken } = await import('@/integrations/supabase/client');
                    const isValid = await checkToken();
                    if (isValid) {
                        console.log('✅ [IdleDetector] Session still valid after long idle.');
                    }
                    // If not valid, checkToken will redirect to login - no reload needed
                } catch (e) {
                    console.warn('⚠️ [IdleDetector] Could not check session:', e);
                    // Don't reload - let the user continue and queries will fail-soft
                }
            }

            // Reset activity time on focus (user is now active)
            lastActivityTime = Date.now();
            (window as any).lastActivityTime = lastActivityTime;
        }
    });
}

export { lastActivityTime };
