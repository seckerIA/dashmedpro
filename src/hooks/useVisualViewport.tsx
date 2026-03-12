import { useState, useEffect, useCallback } from 'react';

interface VisualViewportState {
  keyboardHeight: number;
  isKeyboardOpen: boolean;
  viewportHeight: number;
}

/**
 * Hook that tracks the iOS visual viewport to detect keyboard open/close.
 * On iOS Safari, the virtual keyboard does NOT resize the layout viewport -
 * it overlays content. This hook uses the VisualViewport API to compute
 * the actual keyboard height and sets a CSS custom property --keyboard-height
 * on the document root for use in CSS.
 */
export function useVisualViewport(): VisualViewportState {
  const [state, setState] = useState<VisualViewportState>({
    keyboardHeight: 0,
    isKeyboardOpen: false,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const update = useCallback(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const kbHeight = Math.max(0, window.innerHeight - viewport.height);
    const isOpen = kbHeight > 150; // Threshold to avoid false positives from toolbar

    setState({
      keyboardHeight: kbHeight,
      isKeyboardOpen: isOpen,
      viewportHeight: viewport.height,
    });

    // Set CSS custom property for use in Tailwind/CSS
    document.documentElement.style.setProperty(
      '--keyboard-height',
      `${isOpen ? kbHeight : 0}px`
    );
  }, []);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);

    // Initial update
    update();

    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      document.documentElement.style.removeProperty('--keyboard-height');
    };
  }, [update]);

  return state;
}

/**
 * Hook that scrolls focused inputs into view when keyboard opens on iPad/iOS.
 * Should be used once at the app level or in pages with many inputs.
 */
export function useInputScrollIntoView() {
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        // Wait for keyboard animation to complete
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 350);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, []);
}
