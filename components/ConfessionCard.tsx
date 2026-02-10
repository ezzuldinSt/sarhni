"use client";

import { memo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "./ui/Card";
import { Share2, Loader2, Trash2, MessageCircle, Pin, Edit3, X, Check, Flag } from "lucide-react";
import { toastSuccess, toastError, toastLoading } from "@/lib/toast";
import { ConfessionSticker } from "./ConfessionSticker";
import { useConfessionActions } from "@/hooks/useConfessionActions";
import { ConfessionWithUser } from "@/lib/types";
import { useReportDialog } from "./ReportDialog";

interface ConfessionCardProps {
  confession: ConfessionWithUser;
  index: number;
  isOwnerView?: boolean;
  isSentView?: boolean;
  currentUserId?: string;
  onDeletingStart?: (id: string) => void;
  onDeletingEnd?: (id: string) => void;
  onActionComplete?: () => void;
}

function ConfessionCardInner({ confession, index, isOwnerView = false, isSentView = false, currentUserId, onDeletingStart, onDeletingEnd, onActionComplete }: ConfessionCardProps) {
  const date = new Date(confession.createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  const stickerRef = useRef<HTMLDivElement>(null);

  // -- Local UI State --
  const [isGenerating, setIsGenerating] = useState(false); // Sharing
  const [isReplying, setIsReplying] = useState(false);     // Toggling Reply Form
  const [replyText, setReplyText] = useState("");          // Reply Input
  const [isEditing, setIsEditing] = useState(false);       // Editing state
  const [editText, setEditText] = useState(confession.content); // Edit Input
  const [timeRemaining, setTimeRemaining] = useState<string>(""); // Edit countdown

  // -- Report Dialog --
  const { ReportDialog, isOpen: isReportOpen, open: openReport, close: closeReport } = useReportDialog();

  // -- Check if message can be edited (within 5 minutes and is sender's message) --
  const canEdit = currentUserId && confession.senderId === currentUserId;
  const timeSinceCreation = Date.now() - new Date(confession.createdAt).getTime();
  const fiveMinutes = 5 * 60 * 1000;
  const isWithinEditWindow = timeSinceCreation < fiveMinutes;

  // -- Edit Countdown Timer --
  useEffect(() => {
    if (!isWithinEditWindow) {
      setTimeRemaining("");
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const elapsed = now - new Date(confession.createdAt).getTime();
      const remaining = Math.max(0, fiveMinutes - elapsed);

      if (remaining <= 0) {
        setTimeRemaining("");
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [confession.createdAt, isWithinEditWindow, fiveMinutes]);

  // -- Business Logic Hook --
  const {
    isDeleting,
    isPinned,
    optimisticReply,
    handleDelete,
    handlePin,
    handleReply
  } = useConfessionActions(confession.isPinned, confession.reply, {
    onActionComplete,
    onDeletingStart,
    onDeletingEnd
  });

  // --- 1. Share Logic (Kept Local due to Ref) ---
  const handleShare = async () => {
    if (!stickerRef.current || isGenerating) return;

    setIsGenerating(true);
    const loading = toastLoading("Generating sticker...", { id: "sticker-toast" });

    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(stickerRef.current, {
        backgroundColor: "#2C1A1D", // leather-900 - keeping hex for html2canvas compatibility
        scale: 2, // High resolution
        logging: false,
        useCORS: true
      });

      canvas.toBlob((blob) => {
        if (!blob) throw new Error("Image generation failed");

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `sarhni-confession-${confession.id.slice(0, 6)}.jpg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);

        toastSuccess("Sticker saved!", { id: "sticker-toast" });
      }, 'image/jpeg', 0.9);

    } catch (error) {
      toastError("Failed to generate image.", { id: "sticker-toast" });
    } finally {
      setIsGenerating(false);
    }
  };

  // --- 2. Reply Wrapper ---
  const onReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleReply(confession.id, replyText, () => setIsReplying(false));
  };

  // --- 3. Edit Handler ---
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editText.trim()) return;

    const { editConfession } = await import("@/lib/actions/manage");
    const result = await editConfession(confession.id, editText);

    if (result?.error) {
      toastError(result.error);
    } else {
      toastSuccess("Message edited!");
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditText(confession.content);
    setIsEditing(false);
  };

  const handleReport = () => {
    openReport(confession.id);
  };

  return (
    <>
    {/* Main Card Display */}
    <div
      className={`h-full animate-in fade-in slide-in-from-bottom-4 transition-opacity duration-300 motion-reduce:animate-none motion-reduce:transition-none ${isDeleting ? "opacity-0 pointer-events-none" : ""}`}
      style={{ animationDelay: `${index * 100}ms`, animationDuration: "400ms", animationFillMode: "both" }}
    >
      <Card className="h-full flex flex-col bg-leather-700/50 border-leather-600 hover:border-leather-pop/50 transition-colors relative group">

        {/* --- Flexbox Control Bar --- */}
        <div className="flex items-start justify-between gap-4 mb-4">

          {/* Left Zone: Status Indicators */}
          <div className="flex items-center gap-2 min-h-10">
            {/* Pin Badge */}
            {isPinned && (
              <div className="bg-leather-pop text-leather-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                <Pin size={12} fill="currentColor" />
                Pinned
              </div>
            )}
            {/* Edited Indicator */}
            {confession.editedAt && !isEditing && (
              <span className="text-xs text-leather-accent italic">(edited)</span>
            )}
          </div>

          {/* Right Zone: Action Buttons (Always Visible) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Pin Button (Owner only) */}
            {isOwnerView && (
              <button
                onClick={() => handlePin(confession.id)}
                aria-label={isPinned ? "Unpin message" : "Pin message"}
                className={`flex items-center justify-center p-1.5 min-h-[38px] min-w-[38px] rounded-full shadow-lg transition-colors ${
                  isPinned
                    ? "bg-leather-pop text-leather-900 hover:opacity-90"
                    : "bg-leather-800 text-leather-100 hover:text-leather-pop"
                }`}
                title={isPinned ? "Unpin" : "Pin to Top"}
              >
                <Pin className="w-3.5 h-3.5" fill={isPinned ? "currentColor" : "none"} />
              </button>
            )}

            {/* Edit Button (Sender only, within 5 min) */}
            {isSentView && canEdit && isWithinEditWindow && !isEditing && (
              <div className="flex items-center gap-2">
                {timeRemaining && (
                  <span className="text-xs text-leather-100 font-medium">{timeRemaining}</span>
                )}
                <button
                  onClick={() => setIsEditing(true)}
                  aria-label="Edit message"
                  className="flex items-center justify-center p-1.5 min-h-[38px] min-w-[38px] bg-leather-800 text-leather-pop rounded-full hover:bg-leather-pop hover:text-leather-900 shadow-lg transition-colors"
                  title="Edit message (5 min window)"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Delete Button */}
            <button
              onClick={() => handleDelete(confession.id)}
              disabled={isDeleting || isGenerating}
              aria-label="Delete message"
              className="flex items-center justify-center p-1.5 min-h-[38px] min-w-[38px] bg-leather-800 text-danger-light rounded-full hover:bg-danger hover:text-white shadow-lg disabled:opacity-50 transition-colors"
              title="Delete Message"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin-fast" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              disabled={isGenerating || isDeleting}
              aria-label="Generate shareable sticker"
              className="flex items-center justify-center p-1.5 min-h-[38px] min-w-[38px] bg-leather-800 text-leather-pop rounded-full hover:bg-leather-pop hover:text-leather-900 shadow-lg disabled:opacity-50 transition-colors"
              title="Generate Story Sticker"
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin-fast" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>

            {/* Report Button (for logged-in users) */}
            {currentUserId && (
              <button
                onClick={handleReport}
                aria-label="Report this message"
                className="flex items-center justify-center p-1.5 min-h-[38px] min-w-[38px] bg-leather-800/80 text-danger-light rounded-full hover:bg-danger hover:text-white shadow-lg transition-colors"
                title="Report inappropriate content"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* --- Message Body --- */}
        <div className="flex-1 p-4 md:p-5 min-h-0">
           {isEditing ? (
             <form onSubmit={handleEditSubmit} className="space-y-3">
               <textarea
                 autoFocus
                 value={editText}
                 onChange={(e) => setEditText(e.target.value)}
                 className="w-full bg-leather-900/80 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-leather-pop text-leather-accent placeholder-leather-600 min-h-20"
                 placeholder="Edit your message..."
                 maxLength={500}
               />
               <div className="flex items-center justify-between text-xs text-leather-100">
                 <span>{editText.length}/500</span>
                 <div className="flex gap-2">
                   <button
                     type="button"
                     onClick={handleCancelEdit}
                     className="flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-leather-800 text-leather-100"
                     aria-label="Cancel edit"
                   >
                     <X size={14} />
                     Cancel
                   </button>
                   <button
                     type="submit"
                     disabled={!editText.trim()}
                     className="flex items-center gap-1 px-3 py-1 rounded-lg bg-info text-white hover:bg-info/90 disabled:opacity-50 disabled:cursor-not-allowed"
                     aria-label="Save edit"
                   >
                     <Check size={14} />
                     Save
                   </button>
                 </div>
               </div>
             </form>
           ) : (
             <p className="text-lg whitespace-pre-wrap leading-relaxed">"{confession.content}"</p>
           )}
        </div>

        {/* --- Reply Section (Display) --- */}
        {optimisticReply && (
          <div className="mt-5 pt-5 border-t border-leather-600/30 bg-leather-800/50 p-4 rounded-xl border-l-4 border-leather-pop mb-4">
            <div className="flex items-center gap-2 mb-1">
               <div className="w-avatar-xs h-avatar-xs rounded-full bg-leather-pop flex items-center justify-center text-[10px] text-leather-900 font-bold">
                 {confession.receiver?.username?.[0].toUpperCase() || "Me"}
               </div>
               <p className="text-xs text-leather-100 font-bold uppercase tracking-wide">
                 Replied:
               </p>
            </div>
            <p className="text-leather-accent text-sm leading-relaxed">{optimisticReply}</p>
          </div>
        )}

        {/* --- Reply Form (Owner Input) --- */}
        {isOwnerView && !optimisticReply && !isEditing && (
          <div className="mt-auto pt-4 pb-4 border-t border-leather-600/30">
            {!isReplying ? (
              <button
                onClick={() => setIsReplying(true)}
                aria-label="Open reply form"
                className="text-xs font-bold text-leather-100 hover:text-leather-pop flex items-center gap-2 transition-colors"
              >
                <MessageCircle size={14} className="shrink-0" />
                Reply to this message
              </button>
            ) : (
              <form onSubmit={onReplySubmit} className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                <input
                  autoFocus
                  className="bg-leather-900/80 rounded-xl p-3 text-sm w-full outline-none focus:ring-2 focus:ring-leather-pop text-leather-accent placeholder-leather-600"
                  placeholder="Type your comeback..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  maxLength={500}
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-leather-100">{replyText.length}/500</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsReplying(false)}
                      className="text-xs text-leather-100 hover:text-red-400 px-3 py-2 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      className="text-xs bg-leather-pop text-leather-900 font-bold px-4 py-2 rounded-lg hover:bg-leather-popHover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* --- Footer (Sender Info) --- */}
        <div className="flex items-center gap-3 pt-5 mt-auto border-t border-leather-600/30">
          {confession.isAnonymous ? (
            // Anonymous - non-clickable
            <>
              <div className="w-avatar-sm h-avatar-sm rounded-full flex items-center justify-center text-xs font-bold bg-leather-600">
                ?
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold">Anonymous</span>
                <span className="text-xs text-leather-100">{date}</span>
              </div>
            </>
          ) : (
            // Registered user - clickable avatar and username
            <Link href={`/u/${confession.sender?.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              {!confession.sender?.image ? (
                <div className="w-avatar-sm h-avatar-sm rounded-full flex items-center justify-center text-xs font-bold bg-leather-pop text-leather-900">
                  {confession.sender?.username?.[0].toUpperCase()}
                </div>
              ) : (
                <img
                  src={confession.sender.image}
                  alt={confession.sender.username}
                  className="w-avatar-sm h-avatar-sm rounded-full object-cover"
                />
              )}
              <div className="flex flex-col">
                <span className="text-sm font-bold text-leather-accent hover:text-leather-pop transition-colors">
                  @{confession.sender?.username}
                </span>
                <span className="text-xs text-leather-100">{date}</span>
              </div>
            </Link>
          )}
        </div>

      </Card>
    </div>

    {/* Hidden Sticker for Capture (Only needed in Dashboard View) */}
    {isOwnerView && (
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={stickerRef}>
            <ConfessionSticker confession={confession} />
          </div>
        </div>
    )}

    {/* Report Dialog */}
    <ReportDialog />
    </>
  );
}

const ConfessionCard = memo(ConfessionCardInner, (prev, next) => {
  return (
    prev.confession.id === next.confession.id &&
    prev.confession.isPinned === next.confession.isPinned &&
    prev.confession.reply === next.confession.reply &&
    prev.confession.content === next.confession.content &&
    prev.confession.editedAt === next.confession.editedAt &&
    prev.index === next.index &&
    prev.isOwnerView === next.isOwnerView &&
    prev.isSentView === next.isSentView
  );
});

export default ConfessionCard;
