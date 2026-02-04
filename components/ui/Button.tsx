"use client";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

// FIX: We must extend HTMLMotionProps<"button">, not standard HTML attributes
// This ensures compatibility with <motion.button>
interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary";
}

export const Button = ({ children, className, variant = "primary", ...props }: ButtonProps) => {
  const base = "px-6 py-3 rounded-xl font-bold transition-colors shadow-md border-b-4 active:border-b-0 active:translate-y-1";
  
  const styles = {
    primary: "bg-leather-pop text-leather-900 border-leather-popHover hover:bg-leather-popHover",
    secondary: "bg-leather-700 text-leather-accent border-leather-900 hover:bg-leather-600"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      className={cn(base, styles[variant], className)}
      {...props}
    >
      {children}
    </motion.button>
  );
};

