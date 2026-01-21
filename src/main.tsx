import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/idleDetector"; // Track user activity for session recovery

// Disable React DevTools to prevent extension crashes
if (typeof window !== 'undefined' && 'try' in window) {
    try {
        // @ts-ignore
        if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
            // @ts-ignore
            window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject = function () { };
        }
    } catch (e) {
        // Ignore errors here
    }
}

// =============================================================================
// Global Error Handler for Chrome Extension Errors
// These errors are NOT from our app - they're from browser extensions
// We suppress them to prevent false-positive crashes
// =============================================================================
if (typeof window !== 'undefined') {
    // Catch unhandled promise rejections from extensions
    window.addEventListener('unhandledrejection', (event) => {
        const errorMessage = event.reason?.message || String(event.reason) || '';

        // Suppress Chrome extension errors
        if (
            errorMessage.includes('message channel closed') ||
            errorMessage.includes('runtime.lastError') ||
            errorMessage.includes('Extension context invalidated') ||
            errorMessage.includes('back/forward cache') ||
            errorMessage.includes('No tab with id') ||
            errorMessage.includes('The message port closed')
        ) {
            console.debug('[Extension Error - Ignored]', errorMessage.substring(0, 100));
            event.preventDefault(); // Prevent the error from bubbling up
            return;
        }
    });

    // Catch synchronous errors from extensions
    const originalOnError = window.onerror;
    window.onerror = function (message, source, lineno, colno, error) {
        const errorMessage = String(message) || '';

        // Suppress Chrome extension errors
        if (
            errorMessage.includes('message channel closed') ||
            errorMessage.includes('runtime.lastError') ||
            errorMessage.includes('Extension context invalidated') ||
            errorMessage.includes('back/forward cache') ||
            (source && source.includes('chrome-extension://'))
        ) {
            console.debug('[Extension Error - Ignored]', errorMessage.substring(0, 100));
            return true; // Prevent the error from propagating
        }

        // Call original handler for real errors
        if (originalOnError) {
            return originalOnError.call(window, message, source, lineno, colno, error);
        }
        return false;
    };

    console.log('✅ [App] Extension error handler installed');
}

createRoot(document.getElementById("root")!).render(<App />);
