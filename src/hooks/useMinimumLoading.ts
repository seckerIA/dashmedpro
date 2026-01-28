import { useState, useEffect, useRef } from 'react'

/**
 * Hook para garantir um tempo mínimo de loading, evitando "flash" de skeleton
 * quando os dados carregam muito rápido.
 *
 * @param isLoading - Estado de loading real da query/operação
 * @param minTime - Tempo mínimo em ms para mostrar o loading (default: 500ms)
 * @returns showLoading - Boolean que deve ser usado para mostrar/esconder skeleton
 *
 * @example
 * const { data, isLoading } = useQuery(...)
 * const showSkeleton = useMinimumLoading(isLoading, 800)
 * return showSkeleton ? <Skeleton /> : <Content data={data} />
 */
export function useMinimumLoading(isLoading: boolean, minTime = 500): boolean {
  const [showLoading, setShowLoading] = useState(false)
  const startTimeRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isLoading && !showLoading) {
      // Começou a carregar
      setShowLoading(true)
      startTimeRef.current = Date.now()
    } else if (!isLoading && showLoading) {
      // Terminou de carregar
      const elapsed = Date.now() - startTimeRef.current
      const remaining = Math.max(0, minTime - elapsed)

      if (remaining === 0) {
        // Tempo mínimo já passou, pode esconder imediatamente
        setShowLoading(false)
      } else {
        // Aguardar tempo restante antes de esconder
        timeoutRef.current = setTimeout(() => {
          setShowLoading(false)
        }, remaining)
      }
    }
  }, [isLoading, showLoading, minTime])

  return showLoading
}

/**
 * Hook para delay antes de mostrar loading (evita flash para operações rápidas)
 *
 * @param isLoading - Estado de loading real
 * @param delay - Delay antes de mostrar loading (default: 200ms)
 * @returns showLoading - Boolean que atrasa o início do loading
 *
 * @example
 * const showSkeleton = useDelayedLoading(isLoading, 300)
 * // Loading só aparece se demorar mais de 300ms
 */
export function useDelayedLoading(isLoading: boolean, delay = 200): boolean {
  const [showLoading, setShowLoading] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isLoading) {
      // Começou a carregar, aguardar delay antes de mostrar
      timeoutRef.current = setTimeout(() => {
        setShowLoading(true)
      }, delay)
    } else {
      // Terminou de carregar, esconder imediatamente
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      setShowLoading(false)
    }
  }, [isLoading, delay])

  return showLoading
}
