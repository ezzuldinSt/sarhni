import { useState } from "react";
import { toastSuccess, toastError } from "@/lib/toast";
import { deleteConfession, togglePin, replyToConfession } from "@/lib/actions/manage";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";

export function useConfessionActions(initialPinned: boolean, initialReply: string | null) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPinned, setIsPinned] = useState(initialPinned);
  const [optimisticReply, setOptimisticReply] = useState(initialReply);
  const { confirm } = useConfirmDialog();

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
    const res = await deleteConfession(id);
    if (res?.error) {
      toastError(res.error);
    } else {
      toastSuccess("Message deleted.");
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
