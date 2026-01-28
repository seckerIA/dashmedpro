import { useEffect, useRef } from 'react'
import { motion, useSpring, useTransform, useInView } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  format?: (n: number) => string
  duration?: number
  delay?: number
  className?: string
}

/**
 * Componente que anima numeros de 0 ate o valor final.
 * Perfeito para metricas e KPIs no dashboard.
 *
 * @example
 * <AnimatedNumber value={45000} format={(n) => `R$ ${n.toLocaleString('pt-BR')}`} />
 */
export function AnimatedNumber({
  value,
  format = (n: number) => n.toLocaleString('pt-BR'),
  duration = 1,
  delay = 0,
  className
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  const spring = useSpring(0, {
    bounce: 0,
    duration: duration * 1000,
  })

  const display = useTransform(spring, (current) =>
    format(Math.floor(current))
  )

  useEffect(() => {
    if (isInView) {
      const timeout = setTimeout(() => {
        spring.set(value)
      }, delay * 1000)
      return () => clearTimeout(timeout)
    }
  }, [isInView, spring, value, delay])

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  )
}

interface AnimatedCurrencyProps {
  value: number
  currency?: string
  locale?: string
  duration?: number
  delay?: number
  className?: string
}

/**
 * Componente especifico para animacao de valores monetarios.
 *
 * @example
 * <AnimatedCurrency value={1500.50} />
 */
export function AnimatedCurrency({
  value,
  currency = 'BRL',
  locale = 'pt-BR',
  duration = 1,
  delay = 0,
  className
}: AnimatedCurrencyProps) {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

  return (
    <AnimatedNumber
      value={value}
      format={(n) => formatter.format(n)}
      duration={duration}
      delay={delay}
      className={className}
    />
  )
}

interface AnimatedPercentageProps {
  value: number
  decimals?: number
  duration?: number
  delay?: number
  className?: string
}

/**
 * Componente especifico para animacao de porcentagens.
 *
 * @example
 * <AnimatedPercentage value={85.5} />
 */
export function AnimatedPercentage({
  value,
  decimals = 1,
  duration = 1,
  delay = 0,
  className
}: AnimatedPercentageProps) {
  return (
    <AnimatedNumber
      value={value}
      format={(n) => `${n.toFixed(decimals)}%`}
      duration={duration}
      delay={delay}
      className={className}
    />
  )
}
