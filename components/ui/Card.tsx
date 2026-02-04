import { cn } from "@/lib/utils";

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={cn(
      "bg-leather-800 rounded-3xl p-6 shadow-xl border-2 border-dashed border-leather-600/30 text-leather-accent",
      className
    )}>
      {children}
    </div>
  );
};
