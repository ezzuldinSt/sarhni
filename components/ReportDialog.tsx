"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Check, Loader2 } from "lucide-react";
import { toastSuccess, toastError } from "@/lib/toast";
import { createReport } from "@/lib/actions/report";

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  confessionId: string;
}

const REPORT_REASONS = [
  { value: "SPAM", label: "Spam", icon: "📧" },
  { value: "HARASSMENT", label: "Harassment", icon: "⚠️" },
  { value: "HATE_SPEECH", label: "Hate Speech", icon: "🚫" },
  { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate Content", icon: "🔞" },
  { value: "OTHER", label: "Other", icon: "📝" },
];

export function ReportDialog({ isOpen, onClose, confessionId }: ReportDialogProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedReason("");
      setDescription("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason.trim()) return;

    setIsSubmitting(true);
    const result = await createReport(confessionId, selectedReason, description);

    if (result?.error) {
      toastError(result.error);
      setIsSubmitting(false);
    } else {
      toastSuccess("Report submitted successfully. Thank you for helping keep our community safe.");
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-modal-backdrop"
            aria-hidden="true"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-leather-800 rounded-2xl shadow-2xl border border-leather-600/30 max-w-md w-full"
            >
              {/* Header */}
              <div className="flex items-start gap-4 p-6 pb-4 relative">
                <div className="w-12 h-12 rounded-full bg-leather-pop/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={24} className="text-leather-pop" />
                </div>
                <div className="flex-1 pe-8">
                  <h2 className="text-xl font-bold text-leather-accent mb-1">Report Message</h2>
                  <button
                    onClick={onClose}
                    className="absolute top-4 end-4 p-2 text-leather-100 hover:text-leather-accent hover:bg-leather-700/50 rounded-lg transition-colors"
                    aria-label="Close dialog"
                  >
                    <X size={20} />
                  </button>
                  <p className="text-sm text-leather-accent/70">
                    Help us keep the community safe by reporting inappropriate content.
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 pb-6">
                {/* Reason Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-leather-accent mb-3">
                    Reason for reporting <span className="text-leather-pop">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {REPORT_REASONS.map((reason) => (
                      <button
                        key={reason.value}
                        type="button"
                        onClick={() => setSelectedReason(reason.value)}
                        className={`p-3 rounded-xl border-2 transition-all text-start min-h-[64px] ${
                          selectedReason === reason.value
                            ? "border-leather-pop bg-leather-pop/10 shadow-lg shadow-leather-pop/20"
                            : "border-leather-700 bg-leather-900 hover:border-leather-600 hover:bg-leather-800"
                        }`}
                        aria-pressed={selectedReason === reason.value}
                      >
                        <span className="text-lg me-2" aria-hidden="true">{reason.icon}</span>
                        <span className="text-sm font-medium">{reason.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <label htmlFor="description" className="block text-sm font-bold text-leather-accent mb-2">
                    Additional details <span className="text-leather-500">(optional)</span>
                  </label>
                  <div className="relative">
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => {
                        if (e.target.value.length <= 500) {
                          setDescription(e.target.value);
                        }
                      }}
                      placeholder="Provide any additional context that might help us review this report..."
                      className="w-full bg-leather-900 rounded-xl p-3 text-sm text-leather-accent focus:ring-2 focus:ring-leather-pop focus:ring-offset-2 focus:ring-offset-leather-800 outline-none min-h-[100px] resize-none transition-all"
                      maxLength={500}
                      aria-describedby="description-char-count"
                    />
                    <span
                      id="description-char-count"
                      className={`absolute bottom-2 end-2 text-xs font-mono transition-colors ${
                        description.length > 450 ? 'text-red-400 font-bold' : 'text-leather-500'
                      }`}
                      aria-live="polite"
                    >
                      {description.length}/500
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 text-sm font-bold bg-leather-700 hover:bg-leather-600 text-leather-accent rounded-lg transition-colors disabled:opacity-50 min-h-touch"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedReason || isSubmitting}
                    className="px-4 py-2.5 text-sm font-bold bg-danger hover:bg-danger-hover text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-touch shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin-fast" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Report
                        <AlertTriangle size={16} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook for managing report dialog
export function useReportDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [confessionId, setConfessionId] = useState("");

  const open = (id: string) => {
    setConfessionId(id);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setConfessionId("");
  };

  return {
    isOpen,
    open,
    close,
    ReportDialog: (props: Omit<ReportDialogProps, "isOpen" | "onClose" | "confessionId">) => (
      <ReportDialog
        isOpen={isOpen}
        onClose={close}
        confessionId={confessionId}
        {...props}
      />
    )
  };
}
