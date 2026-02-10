import { useState } from "react";
import { toastSuccess, toastError } from "@/lib/toast";
import { deleteConfession, togglePin, replyToConfession } from "@/lib/actions/manage";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";

interface UseConfessionActionsOptions {
  onActionComplete?: () => void;
  onDeletingStart?: (id: string) => void;
  onDeletingEnd?: (id: string) => void;
}

export function useConfessionActions(
  initialPinned: boolean,
  initialReply: string | null,
  options?: UseConfessionActionsOptions
) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPinned, setIsPinned] = useState(initialPinned);
  const [optimisticReply, setOptimisticReply] = useState(initialReply);
  const { confirm } = useConfirmDialog();
  const { onActionComplete, onDeletingStart, onDeletingEnd } = options || {};

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Delete Message",
      message: "Are you sure you want to delete this message? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger"
    });

    if (!confirmed) return;

    setIsDeleting(true);
    onDeletingStart?.(id); // Register this ID as being deleted
    const res = await deleteConfession(id);
    if (res?.error) {
      toastError(res.error);
      onDeletingEnd?.(id); // Unregister on error
    } else {
      toastSuccess("Message deleted.");
      onActionComplete?.();
      // Keep the ID registered for a bit to prevent it from reappearing during polling
      setTimeout(() => onDeletingEnd?.(id), 6000);
    }
    setIsDeleting(false);
  };

  const handlePin = async (id: string) => {
    const newState = !isPinned;
    setIsPinned(newState);
    const res = await togglePin(id);
    if (res?.error) {
      toastError(res.error);
      setIsPinned(!newState);
    } else {
      toastSuccess(newState ? "Pinned!" : "Unpinned.");
      onActionComplete?.();
    }
  };

  const handleReply = async (id: string, text: string, onClose: () => void) => {
    if (!text.trim()) return;

    // Optimistically show the reply
    const previousReply = optimisticReply;
    setOptimisticReply(text);

    const res = await replyToConfession(id, text);
    if (res?.error) {
      // Revert on error
      setOptimisticReply(previousReply);
      toastError(res.error);
    } else {
      toastSuccess("Replied!");
      onClose();
      onActionComplete?.();
    }
  };

  return {
    isDeleting,
    isPinned,
    optimisticReply,
    handleDelete,
    handlePin,
    handleReply
  };
}
