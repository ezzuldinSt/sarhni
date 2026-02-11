"use client";

import { useState, useEffect, useRef, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./Button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

// Context for sharing dialog state
const ConfirmDialogContext = createContext<{
  confirm: (options: Omit<ConfirmDialogProps, "isOpen" | "onClose" | "onConfirm">) => Promise<boolean>;
} | null>(null);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<Omit<ConfirmDialogProps, "isOpen" | "onClose" | "onConfirm">>({
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    variant: "danger"
  });
  const resolveRef = useRef<(confirmed: boolean) => void>();

  const confirm = (options: Omit<ConfirmDialogProps, "isOpen" | "onClose" | "onConfirm">) => {
    return new Promise<boolean>((resolve) => {
      setConfig(options);
      setIsOpen(true);
      resolveRef.current = resolve;
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    resolveRef.current?.(false);
  };

  const handleConfirm = () => {
    setIsOpen(false);
    resolveRef.current?.(true);
  };

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        {...config}
      />
    </ConfirmDialogContext.Provider>
  );
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger"
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      // Focus the cancel button by default (safer)
      setTimeout(() => cancelButtonRef.current?.focus(), 50);
    } else {
      // Restore focus when dialog closes
      previousActiveElement.current?.focus();
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

  // Trap focus within dialog
  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: "text-danger",
          iconBg: "bg-danger-bg",
          button: "bg-danger hover:bg-danger-hover text-white focus-visible:ring-danger"
        };
      case "warning":
        return {
          icon: "text-warning",
          iconBg: "bg-warning-bg",
          button: "bg-warning hover:bg-warning/90 text-leather-900 focus-visible:ring-warning"
        };
      case "info":
        return {
          icon: "text-leather-pop",
          iconBg: "bg-leather-pop/20",
          button: "bg-leather-pop hover:bg-leather-popHover text-leather-900 focus-visible:ring-leather-pop"
        };
    }
  };

  const styles = getVariantStyles();

  const handleConfirmClick = () => {
    onConfirm();
    onClose();
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
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="dialog-title"
              aria-describedby="dialog-message"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-leather-800 rounded-2xl shadow-2xl border border-leather-600/30 max-w-md w-full p-6"
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <AlertTriangle size={24} className={styles.icon} />
                </div>
                <div className="flex-1 pe-8">
                  <h2
                    id="dialog-title"
                    className="text-lg font-bold text-leather-accent mb-1"
                  >
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    className="absolute top-4 end-4 text-leather-500 hover:text-leather-accent transition-colors duration-200 p-1 rounded-lg hover:bg-leather-700/50 focus-visible:ring-2 focus-visible:ring-leather-pop focus-visible:ring-offset-2 focus-visible:ring-offset-leather-800"
                    aria-label="Close dialog"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Message */}
              <p
                id="dialog-message"
                className="text-leather-500 mb-6 leading-relaxed"
              >
                {message}
              </p>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  ref={cancelButtonRef}
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-leather-700 hover:bg-leather-500 text-leather-accent font-bold rounded-lg transition-all duration-200 shadow-md border-b-4 border-leather-900 active:border-b-0 active:translate-y-1 active:scale-95 focus-visible:ring-2 focus-visible:ring-leather-accent focus-visible:ring-offset-2 focus-visible:ring-offset-leather-800"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClick}
                  className={`px-4 py-2 font-bold rounded-lg transition-all duration-200 shadow-md border-b-4 active:border-b-0 active:translate-y-1 active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-leather-800 ${styles.button}`}
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook for using the confirm dialog
export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirmDialog must be used within ConfirmDialogProvider");
  }
  return context;
}
