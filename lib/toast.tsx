import { toast } from "sonner";
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react";

// Custom toast icons component
function ToastIcon({ type, size = 20 }: { type: "success" | "error" | "warning" | "info" | "loading"; size?: number }) {
  const icons = {
    success: <CheckCircle size={size} className="text-green-400 flex-shrink-0" />,
    error: <XCircle size={size} className="text-red-400 flex-shrink-0" />,
    warning: <AlertTriangle size={size} className="text-yellow-400 flex-shrink-0" />,
    info: <Info size={size} className="text-blue-400 flex-shrink-0" />,
    loading: <Loader2 size={size} className="text-leather-pop animate-spin-fast flex-shrink-0" />,
  };
  return icons[type];
}

// Custom toast styles for each variant
const toastStyles = {
  success: "border-l-4 border-l-green-400",
  error: "border-l-4 border-l-red-400",
  warning: "border-l-4 border-l-yellow-400",
  info: "border-l-4 border-l-blue-400",
  loading: "border-l-4 border-l-leather-pop",
};

/**
 * Show a success toast with icon
 */
export function toastSuccess(message: string, options?: { id?: string; duration?: number }) {
  return toast.success(message, {
    icon: <ToastIcon type="success" />,
    className: toastStyles.success,
    classNames: {
      toast: "bg-leather-800 text-leather-accent border-2 border-leather-600 rounded-xl shadow-xl font-medium",
    },
    duration: options?.duration || 4000,
    id: options?.id,
  });
}

/**
 * Show an error toast with icon
 */
export function toastError(message: string, options?: { id?: string; duration?: number }) {
  return toast.error(message, {
    icon: <ToastIcon type="error" />,
    className: toastStyles.error,
    classNames: {
      toast: "bg-leather-800 text-leather-accent border-2 border-leather-600 rounded-xl shadow-xl font-medium",
    },
    duration: options?.duration || 5000,
    id: options?.id,
  });
}

/**
 * Show a warning toast with icon
 */
export function toastWarning(message: string, options?: { id?: string; duration?: number }) {
  return toast.warning(message, {
    icon: <ToastIcon type="warning" />,
    className: toastStyles.warning,
    classNames: {
      toast: "bg-leather-800 text-leather-accent border-2 border-leather-600 rounded-xl shadow-xl font-medium",
    },
    duration: options?.duration || 4000,
    id: options?.id,
  });
}

/**
 * Show an info toast with icon
 */
export function toastInfo(message: string, options?: { id?: string; duration?: number }) {
  return toast.info(message, {
    icon: <ToastIcon type="info" />,
    className: toastStyles.info,
    classNames: {
      toast: "bg-leather-800 text-leather-accent border-2 border-leather-600 rounded-xl shadow-xl font-medium",
    },
    duration: options?.duration || 4000,
    id: options?.id,
  });
}

/**
 * Show a loading toast with icon
 */
export function toastLoading(message: string, options?: { id?: string }) {
  return toast.loading(message, {
    icon: <ToastIcon type="loading" />,
    className: toastStyles.loading,
    classNames: {
      toast: "bg-leather-800 text-leather-accent border-2 border-leather-600 rounded-xl shadow-xl font-medium",
    },
    id: options?.id,
  });
}

// Re-export default toast for backward compatibility
export { toast };

// Export a custom toast hook that includes all variants
export function useCustomToast() {
  return {
    success: toastSuccess,
    error: toastError,
    warning: toastWarning,
    info: toastInfo,
    loading: toastLoading,
    toast,
  };
}
