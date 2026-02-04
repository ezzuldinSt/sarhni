"use client";
import { motion } from "framer-motion";

interface SwitchProps {
  isOn: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export const Switch = ({ isOn, onToggle, disabled }: SwitchProps) => {
  return (
    <div 
      className={`w-16 h-8 rounded-full flex items-center p-1 cursor-pointer transition-colors ${isOn ? 'bg-leather-pop' : 'bg-leather-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={!disabled ? onToggle : undefined}
    >
      <motion.div
        className="bg-white w-6 h-6 rounded-full shadow-md"
        layout
        transition={{ type: "spring", stiffness: 700, damping: 30 }}
        style={{ marginLeft: isOn ? "auto" : "0" }}
      />
    </div>
  );
};
