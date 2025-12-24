import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedWrapperProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  animationType?: "fadeIn" | "slideUp" | "slideDown" | "slideLeft" | "slideRight" | "scale";
}

const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.4 }
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: "easeOut" }
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: "easeOut" }
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, ease: "easeOut" }
  },
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, ease: "easeOut" }
  },
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

export function AnimatedWrapper({ 
  children, 
  delay = 0, 
  className = "",
  animationType = "fadeIn" 
}: AnimatedWrapperProps) {
  const animation = animations[animationType];

  return (
    <motion.div
      initial={animation.initial}
      animate={animation.animate}
      transition={{ ...animation.transition, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}






