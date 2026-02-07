"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Check } from "lucide-react";
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
              <div className="flex items-start gap-4 p-6 pb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={24} className="text-red-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-leather-accent mb-1">Report Message</h2>
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-leather-100 hover:text-leather-accent transition-colors"
                    aria-label="Close dialog"
                  >
                    <X size={20} />
                  </button>
                  <p className="text-sm text-leather-100">
                    Help us keep the community safe by reporting inappropriate content.
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 pb-6">
                {/* Reason Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-leather-accent mb-3">
                    Reason for reporting <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {REPORT_REASONS.map((reason) => (
                      <button
                        key={reason.value}
                        type="button"
                        onClick={() => setSelectedReason(reason.value)}
                        className={`p-3 rounded-xl border-2 transition-all text-left ${
                          selectedReason === reason.value
                            ? "border-red-500 bg-red-500/10"
                            : "border-leather-600 bg-leather-900 hover:border-leather-500"
                        }`}
                      >
                        <span className="text-lg mr-2">{reason.icon}</span>
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
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide any additional context that might help us review this report..."
                    className="w-full bg-leather-900 rounded-xl p-3 text-sm text-leather-accent focus:ring-2 focus:ring-red-500 outline-none min-h-[100px] resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-bold bg-leather-700 hover:bg-leather-600 text-leather-accent rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedReason || isSubmitting}
                    className="px-4 py-2 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Report"}
                    {!isSubmitting && <AlertTriangle size={16} />}
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
