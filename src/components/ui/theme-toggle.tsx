import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
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

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  const Icon = theme === "light" ? Moon : Sun

  const linkContent = (
    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} w-full`}>
      <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
        <Icon className="w-5 h-5 transition-all duration-200 text-muted-foreground group-hover:text-primary" />
        {!isCollapsed && (
          <span className="text-sm font-medium transition-colors duration-200 text-muted-foreground group-hover:text-foreground">
            Tema {theme === "light" ? "Escuro" : "Claro"}
          </span>
        )}
      </div>
    </div>
  );

  const buttonContent = (
    <button
      onClick={toggleTheme}
      className={`
        block ${isCollapsed ? 'p-2' : 'px-3 py-2'} rounded-2xl text-sm font-medium transition-all duration-200 group relative w-full
        text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-transparent
      `}
    >
      {linkContent}
    </button>
  );

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
