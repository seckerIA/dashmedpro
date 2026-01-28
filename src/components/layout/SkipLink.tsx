/**
 * SkipLink component for keyboard accessibility.
 * Allows users to skip navigation and go directly to main content.
 *
 * Should be placed at the very beginning of the page, before any navigation.
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border focus:border-border focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
    >
      Pular para o conteúdo principal
    </a>
  )
}

/**
 * SkipLinks component with multiple skip targets.
 * Useful for complex layouts with multiple main sections.
 */
interface SkipTarget {
  id: string
  label: string
}

interface SkipLinksProps {
  targets?: SkipTarget[]
}

export function SkipLinks({
  targets = [
    { id: "main-content", label: "Pular para o conteúdo principal" },
    { id: "main-navigation", label: "Pular para navegação" },
  ]
}: SkipLinksProps) {
  return (
    <div className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-4 focus-within:left-4 focus-within:z-[9999] focus-within:flex focus-within:flex-col focus-within:gap-2">
      {targets.map((target) => (
        <a
          key={target.id}
          href={`#${target.id}`}
          className="px-4 py-2 bg-background text-foreground border border-border rounded-md shadow-lg outline-none ring-2 ring-primary"
        >
          {target.label}
        </a>
      ))}
    </div>
  )
}
