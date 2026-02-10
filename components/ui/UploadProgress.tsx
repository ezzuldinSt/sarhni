"use client";

import { motion } from "framer-motion";
import { X, Upload } from "lucide-react";
import { Button } from "./Button";

interface UploadProgressProps {
  percentage: number;
  speed: string | null;
  onCancel?: () => void;
  error?: string;
}

export function UploadProgress({ percentage, speed, onCancel, error }: UploadProgressProps) {
  const getStatusColor = () => {
    if (error) return "bg-danger";
    if (percentage === 100) return "bg-success";
    return "bg-leather-pop";
  };

  const getStatusText = () => {
    if (error) return "Upload failed";
    if (percentage === 100) return "Upload complete!";
    return `Uploading... ${percentage}%`;
  };

  const getStatusIconColor = () => {
    if (error) return "text-danger";
    if (percentage === 100) return "text-success";
    return "text-leather-pop";
  };

  const getStatusTextColor = () => {
    if (error) return "text-danger";
    if (percentage === 100) return "text-success";
    return "text-leather-accent";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-leather-800 rounded-xl p-4 border border-leather-600/30"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Upload size={18} className={getStatusIconColor()} />
          <span className={`text-sm font-medium ${getStatusTextColor()}`}>
            {getStatusText()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {speed && !error && (
            <span className="text-xs text-leather-500 font-mono">{speed}</span>
          )}
          {onCancel && percentage < 100 && !error && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onCancel}
              className="h-7 px-2 text-xs bg-leather-900 border border-leather-600 text-red-400 hover:bg-red-900/20"
            >
              <X size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-leather-900 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ ease: "easeOut", duration: 0.3 }}
          className={`absolute top-0 left-0 h-full ${getStatusColor()} rounded-full`}
        />
      </div>

      {/* Error message */}
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-danger mt-2"
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
}
