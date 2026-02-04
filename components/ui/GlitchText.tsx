"use client";
import { motion } from "framer-motion";

export const GlitchText = ({ text }: { text: string }) => {
  return (
    <div className="relative inline-block group">
      <span className="relative z-10">{text}</span>
      <motion.span
        className="absolute top-0 left-0 -z-10 text-leather-pop opacity-0 group-hover:opacity-100"
        animate={{ x: [-2, 2, -2], y: [1, -1, 0] }}
        transition={{ repeat: Infinity, duration: 0.2 }}
      >
        {text}
      </motion.span>
      <motion.span
        className="absolute top-0 left-0 -z-10 text-red-500 opacity-0 group-hover:opacity-100"
        animate={{ x: [2, -2, 2], y: [-1, 1, 0] }}
        transition={{ repeat: Infinity, duration: 0.3 }}
      >
        {text}
      </motion.span>
    </div>
  );
}
