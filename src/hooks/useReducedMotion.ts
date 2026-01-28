import { useEffect, useState } from 'react'

/**
 * Hook to detect if the user prefers reduced motion.
 * Respects the `prefers-reduced-motion` media query.
 *
 * @example
 * ```tsx
 * function AnimatedComponent() {
 *   const reducedMotion = useReducedMotion()
 *
 *   return (
 *     <motion.div
 *       animate={{ x: reducedMotion ? 0 : 100 }}
 *       transition={{ duration: reducedMotion ? 0 : 0.3 }}
 *     >
 *       Content
 *     </motion.div>
 *   )
 * }
 * ```
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    // Check if matchMedia is available (SSR safety)
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    // Set initial value
    setReducedMotion(mediaQuery.matches)

    // Listen for changes
    const handler = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handler)

    return () => {
      mediaQuery.removeEventListener('change', handler)
    }
  }, [])

  return reducedMotion
}

/**
 * Get animation duration based on reduced motion preference.
 * Returns 0 if user prefers reduced motion, otherwise returns the provided duration.
 *
 * @param duration - Animation duration in seconds
 * @returns Duration adjusted for reduced motion preference
 *
 * @example
 * ```tsx
 * const duration = useAnimationDuration(0.3)
 * // Returns 0 if reduced motion, 0.3 otherwise
 * ```
 */
export function useAnimationDuration(duration: number): number {
  const reducedMotion = useReducedMotion()
  return reducedMotion ? 0 : duration
}

/**
 * Get animation variants based on reduced motion preference.
 * Returns static values if user prefers reduced motion.
 *
 * @param animated - Animation values when motion is allowed
 * @param static_ - Static values for reduced motion (defaults to final state of animated)
 * @returns Appropriate values based on user preference
 *
 * @example
 * ```tsx
 * const variants = useMotionVariants(
 *   { initial: { opacity: 0 }, animate: { opacity: 1 } },
 *   { initial: { opacity: 1 }, animate: { opacity: 1 } }
 * )
 * ```
 */
export function useMotionVariants<T>(animated: T, static_?: T): T {
  const reducedMotion = useReducedMotion()
  return reducedMotion ? (static_ ?? animated) : animated
}
