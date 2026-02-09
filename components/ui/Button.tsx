"use client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = ({ children, className, variant = "primary", size = "md", isLoading, ...props }: ButtonProps) => {
  const base = "font-bold transition-all duration-200 shadow-md border-b-4 active:border-b-0 active:translate-y-1 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:border-b-4 disabled:transform-none focus-visible:ring-2 focus-visible:ring-leather-pop focus-visible:ring-offset-2 focus-visible:ring-offset-leather-900";

  const variants = {
    primary: "bg-leather-pop text-leather-900 border-leather-popHover hover:bg-leather-popHover focus-visible:ring-leather-pop",
    secondary: "bg-leather-700 text-leather-accent border-leather-900 hover:bg-leather-500 focus-visible:ring-leather-accent"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg min-h-touch min-w-touch",
    md: "px-6 py-3 text-base rounded-xl min-h-touch",
    lg: "px-8 py-4 text-lg rounded-2xl min-h-touch"
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : children}
    </button>
  );
};
