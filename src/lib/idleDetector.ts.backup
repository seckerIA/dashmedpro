// Idle Detection - Tracks user activity WITHOUT forcing reloads
// This module tracks user idle time and handles session recovery gracefully

let lastActivityTime = Date.now();

// Track user activity
if (typeof window !== 'undefined') {
    // Expose lastActivityTime globally for RouteChangeHandler
    (window as any).lastActivityTime = lastActivityTime;

    // Track persistent idle state (how long user WAS idle before waking up)
    let lastLongIdleDuration = 0;
    (window as any).lastLongIdleDuration = 0;

    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        window.addEventListener(event, () => {
            const currentIdle = Date.now() - lastActivityTime;

            // If user was idle for more than 30s, record it
            // This allows RouteChangeHandler to know they JUST woke up
            if (currentIdle > 30000) {
                lastLongIdleDuration = currentIdle;
                (window as any).lastLongIdleDuration = lastLongIdleDuration;
                console.log(`⏱️ [IdleDetector] User active after ${Math.floor(currentIdle / 1000)}s idle (Stored for next navigation)`);
            }

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

            // For long idle periods (>2 min), we proactively trigger
            // a soft reconnection check
            if (idleTime > 120000) { // 2 minutos (era 10min)
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
