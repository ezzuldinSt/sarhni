export const GlitchText = ({ text, className = "" }: { text: string; className?: string }) => {
  return (
    <div className={`relative inline-block group overflow-visible ${className}`}>
      <span className="relative z-10">{text}</span>
      <span
        className={`absolute top-0 left-0 -z-10 text-leather-pop opacity-0 group-hover:opacity-100 group-hover:animate-glitch-1 ${className}`}
        aria-hidden="true"
      >
        {text}
      </span>
      <span
        className={`absolute top-0 left-0 -z-10 text-leather-pop opacity-0 group-hover:opacity-100 group-hover:animate-glitch-2 ${className}`}
        aria-hidden="true"
      >
        {text}
      </span>
    </div>
  );
};
