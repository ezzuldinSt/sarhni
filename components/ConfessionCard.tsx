"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "./ui/Card";
import { Share2, Loader2, Trash2, MessageCircle, Pin } from "lucide-react";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { ConfessionSticker } from "./ConfessionSticker";
import { deleteConfession, replyToConfession, togglePin } from "@/lib/actions/manage";

interface ConfessionCardProps {
  confession: any;
  index: number;
  isOwnerView?: boolean;
}

export default function ConfessionCard({ confession, index, isOwnerView = false }: ConfessionCardProps) {
  const date = new Date(confession.createdAt).toLocaleDateString();
  const stickerRef = useRef<HTMLDivElement>(null);
  
  // -- State Management --
  const [isGenerating, setIsGenerating] = useState(false); // Sharing
  const [isDeleting, setIsDeleting] = useState(false);     // Deleting
  const [isReplying, setIsReplying] = useState(false);     // Toggling Reply Form
  const [replyText, setReplyText] = useState("");          // Reply Input
  
  // Optimistic UI States
  const [optimisticReply, setOptimisticReply] = useState(confession.reply);
  const [isPinned, setIsPinned] = useState(confession.isPinned);

  // --- 1. Share Logic ---
  const handleShare = async () => {
    if (!stickerRef.current || isGenerating) return;
    
    setIsGenerating(true);
    const loading = toast.loading("Generating sticker...", { id: "sticker-toast" });

    try {
      const canvas = await html2canvas(stickerRef.current, {
        backgroundColor: "#2C1A1D", // Match theme background
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
        
        toast.success("Sticker saved!", { id: "sticker-toast" });
      }, 'image/jpeg', 0.9);

    } catch (error) {
      console.error(error);
      toast.error("Failed to generate image.", { id: "sticker-toast" });
    } finally {
      setIsGenerating(false);
    }
  };

  // --- 2. Delete Logic ---
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this message? This cannot be undone.")) return;

    setIsDeleting(true); // Fade out
    const res = await deleteConfession(confession.id);
    
    if (res?.error) {
        toast.error(res.error);
        setIsDeleting(false);
    } else {
        toast.success("Message deleted forever.");
    }
  };

  // --- 3. Pin Logic ---
  const handlePin = async () => {
    const newState = !isPinned;
    setIsPinned(newState); // Optimistic Toggle
    
    const res = await togglePin(confession.id);
    
    if (res?.error) {
      toast.error(res.error);
      setIsPinned(!newState); // Revert
    } else {
      toast.success(newState ? "Pinned to profile!" : "Unpinned.");
    }
  };

  // --- 4. Reply Logic ---
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const loading = toast.loading("Posting reply...");
    const res = await replyToConfession(confession.id, replyText);
    
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Reply posted!");
      setOptimisticReply(replyText);
      setIsReplying(false);
    }
    toast.dismiss(loading);
  };

  return (
    <>
    {/* Main Card Display */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDeleting ? 0 : 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`h-full ${isDeleting ? "pointer-events-none" : ""}`}
    >
      <Card className="h-full flex flex-col bg-leather-700/50 border-leather-600 hover:border-leather-pop/50 transition-colors relative group">
        
        {/* --- Visual Pin Indicator (Always Visible if Pinned) --- */}
        {isPinned && (
          <div className="absolute -top-2 -left-2 bg-leather-pop text-leather-900 p-1.5 rounded-full shadow-lg z-20 rotate-[-15deg] border-2 border-leather-900">
            <Pin size={12} fill="currentColor" />
          </div>
        )}

        {/* --- Header Controls (Owner View Only) --- */}
        {isOwnerView && (
           <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
             
             {/* Pin Button */}
             <button 
               onClick={handlePin}
               className={`p-2 rounded-full shadow-lg transition-colors ${
                 isPinned 
                   ? "bg-leather-pop text-leather-900 hover:bg-leather-popHover" 
                   : "bg-leather-800 text-leather-500 hover:text-leather-pop"
               }`}
               title={isPinned ? "Unpin" : "Pin to Top"}
             >
                <Pin className="w-4 h-4" fill={isPinned ? "currentColor" : "none"} />
             </button>

             {/* Delete Button */}
             <button 
               onClick={handleDelete}
               disabled={isDeleting || isGenerating}
               className="p-2 bg-leather-800 text-red-400 rounded-full hover:bg-red-500 hover:text-white shadow-lg disabled:opacity-50 transition-colors"
               title="Delete Message"
             >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
             </button>

             {/* Share Button */}
             <button 
               onClick={handleShare}
               disabled={isGenerating || isDeleting}
               className="p-2 bg-leather-800 text-leather-pop rounded-full hover:bg-leather-pop hover:text-leather-900 shadow-lg disabled:opacity-50 transition-colors"
               title="Generate Story Sticker"
             >
               {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
             </button>
           </div>
        )}

        {/* --- Message Body --- */}
        <div className="p-2 mb-2 pr-4">
           <p className="text-lg whitespace-pre-wrap leading-relaxed">"{confession.content}"</p>
        </div>

        {/* --- Reply Section (Display) --- */}
        {optimisticReply && (
          <div className="mt-2 bg-leather-900/50 p-4 rounded-xl border-l-4 border-leather-pop mb-4">
            <div className="flex items-center gap-2 mb-1">
               <div className="w-5 h-5 rounded-full bg-leather-pop flex items-center justify-center text-[10px] text-leather-900 font-bold">
                 {confession.receiver?.username?.[0].toUpperCase() || "Me"}
               </div>
               <p className="text-xs text-leather-500 font-bold uppercase tracking-wide">
                 Replied:
               </p>
            </div>
            <p className="text-leather-accent text-sm leading-relaxed">{optimisticReply}</p>
          </div>
        )}

        {/* --- Reply Form (Owner Input) --- */}
        {isOwnerView && !optimisticReply && (
          <div className="mt-auto pt-4 border-t border-leather-600/30">
            {!isReplying ? (
              <button 
                onClick={() => setIsReplying(true)}
                className="text-xs font-bold text-leather-500 hover:text-leather-pop flex items-center gap-2 transition-colors"
              >
                <MessageCircle size={14} /> 
                Reply to this message
              </button>
            ) : (
              <form onSubmit={handleReplySubmit} className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                <input 
                  autoFocus
                  className="bg-leather-900/80 rounded-lg px-3 py-2 text-sm w-full outline-none focus:ring-1 focus:ring-leather-pop text-leather-accent placeholder-leather-600"
                  placeholder="Type your comeback..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <button 
                  type="submit" 
                  disabled={!replyText.trim()}
                  className="text-xs bg-leather-pop text-leather-900 font-bold px-3 rounded-lg hover:bg-leather-popHover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Post
                </button>
                <button 
                   type="button"
                   onClick={() => setIsReplying(false)}
                   className="text-xs text-leather-500 hover:text-red-400 px-2"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        )}

        {/* --- Footer (Sender Info) --- */}
        <div className="flex items-center gap-3 pt-4 mt-4 border-t border-leather-600/30">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${confession.isAnonymous ? 'bg-leather-600' : 'bg-leather-pop text-leather-900'}`}>
            {confession.isAnonymous ? "?" : confession.sender?.username?.[0].toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold">
              {confession.isAnonymous ? "Secret Admirer" : confession.sender?.username}
            </span>
            <span className="text-xs text-leather-500">{date}</span>
          </div>
        </div>

      </Card>
    </motion.div>

    {/* Hidden Sticker for Capture (Only needed in Dashboard View) */}
    {isOwnerView && (
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={stickerRef}>
            <ConfessionSticker confession={confession} />
          </div>
        </div>
    )}
    </>
  );
}
