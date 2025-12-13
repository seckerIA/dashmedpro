import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedProgressBarProps {
  value: number;
  maxValue: number;
  variant?: "blue" | "green";
  className?: string;
}

export function AnimatedProgressBar({
  value,
  maxValue,
  variant = "blue",
  className,
}: AnimatedProgressBarProps) {
  const percentage = maxValue > 0 ? Math.min(100, (value / maxValue) * 100) : 0;

  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
  };

  return (
    <div className={cn("h-2 w-full rounded-full bg-gray-700/50", className)}>
      <motion.div
        className={cn("h-full rounded-full", colorClasses[variant])}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 20,
        }}
      />
    </div>
  );
}
