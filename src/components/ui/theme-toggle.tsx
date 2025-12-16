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

  const Icon = theme === "light" ? Moon : Sun
  
  const linkContent = (
    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
      <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
        <Icon className={`
          w-5 h-5 transition-all duration-200
          text-white/70 group-hover:text-white
        `} />
        {!isCollapsed && (
          <span className={`
            font-medium transition-all duration-200
            text-white/70 group-hover:text-white
          `}>
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
        block ${isCollapsed ? 'p-2' : 'p-3'} rounded-lg transition-all duration-200 group relative w-full
        text-white/70 hover:bg-white/5 hover:text-white
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





