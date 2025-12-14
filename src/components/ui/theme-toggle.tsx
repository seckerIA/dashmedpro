import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ThemeToggleProps {
  isCollapsed?: boolean
}

export function ThemeToggle({ isCollapsed = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Evitar hidratação mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  const buttonContent = (
    <Button
      variant="ghost"
      size={isCollapsed ? "icon" : "default"}
      onClick={toggleTheme}
      className={`${isCollapsed ? "w-full p-3" : "w-full justify-start p-3 h-auto"} hover:bg-white/10 text-white/70 hover:text-white`}
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
      {!isCollapsed && (
        <span className="ml-3 font-medium">Tema {theme === "light" ? "Escuro" : "Claro"}</span>
      )}
    </Button>
  )

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {buttonContent}
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-card text-foreground border-border">
          <p>Alternar para tema {theme === "light" ? "escuro" : "claro"}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return buttonContent
}
