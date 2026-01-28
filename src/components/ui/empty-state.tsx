import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  /** Icon to display */
  icon: LucideIcon
  /** Main title */
  title: string
  /** Description text */
  description: string
  /** Optional primary action */
  action?: {
    label: string
    onClick: () => void
  }
  /** Optional secondary action */
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  /** Additional CSS classes */
  className?: string
  /** Size variant */
  size?: "sm" | "default" | "lg"
}

const sizeStyles = {
  sm: {
    container: "py-8 px-4",
    iconWrapper: "h-12 w-12 mb-3",
    icon: "h-6 w-6",
    title: "text-base",
    description: "text-sm max-w-[200px]",
  },
  default: {
    container: "py-12 px-4",
    iconWrapper: "h-16 w-16 mb-4",
    icon: "h-8 w-8",
    title: "text-lg",
    description: "text-sm max-w-sm",
  },
  lg: {
    container: "py-16 px-6",
    iconWrapper: "h-20 w-20 mb-5",
    icon: "h-10 w-10",
    title: "text-xl",
    description: "text-base max-w-md",
  },
}

/**
 * EmptyState component for displaying when there's no data or content.
 * Provides consistent visual hierarchy and optional call-to-action.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={Users}
 *   title="Nenhum paciente encontrado"
 *   description="Comece cadastrando seu primeiro paciente"
 *   action={{ label: "Cadastrar paciente", onClick: () => setOpen(true) }}
 * />
 * ```
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "default",
}: EmptyStateProps) {
  const styles = sizeStyles[size]

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        styles.container,
        className
      )}
    >
      <div
        className={cn(
          "rounded-full bg-muted flex items-center justify-center",
          styles.iconWrapper
        )}
      >
        <Icon className={cn("text-muted-foreground", styles.icon)} />
      </div>

      <h3 className={cn("font-semibold text-foreground mb-1", styles.title)}>
        {title}
      </h3>

      <p className={cn("text-muted-foreground mb-4", styles.description)}>
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <Button onClick={action.onClick} size={size === "sm" ? "sm" : "default"}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              size={size === "sm" ? "sm" : "default"}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * EmptyState variant for inline/card usage
 */
interface InlineEmptyStateProps {
  icon: LucideIcon
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function InlineEmptyState({
  icon: Icon,
  message,
  action,
  className,
}: InlineEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 py-6 px-4 text-muted-foreground",
        className
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-sm">{message}</span>
      {action && (
        <Button variant="link" size="sm" className="h-auto p-0" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
