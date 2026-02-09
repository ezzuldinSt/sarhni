"use client";
import { useState, useEffect, memo } from "react";
import { Card } from "@/components/ui/Card";
import { Copy, Check, Share2, Link as LinkIcon, ExternalLink } from "lucide-react";
import { toastSuccess } from "@/lib/toast";
import Link from "next/link";

interface ShareLinkCardProps {
  username: string;
}

function ShareLinkCardInner({ username }: ShareLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const link = origin ? `${origin}/u/${username}` : `${process.env.NEXT_PUBLIC_URL || 'https://sarhni.zhrworld.com'}/u/${username}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toastSuccess("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-gradient-to-br from-leather-800/80 to-leather-900/80 border-leather-pop/20 overflow-hidden relative group hover:border-leather-pop/30 transition-all duration-300">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
        <Share2 size={120} className="text-leather-pop" />
      </div>
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-leather-pop/5 rounded-full blur-3xl" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-leather-pop/10 flex items-center justify-center">
            <LinkIcon className="w-5 h-5 text-leather-pop" />
          </div>
          <div>
            <h2 className="text-base font-bold text-leather-pop uppercase tracking-wider">
              Share Your Link
            </h2>
            <p className="text-xs text-leather-100/60">
              Get anonymous messages from anyone
            </p>
          </div>
        </div>

        <p className="text-sm text-leather-accent/70 mb-5 max-w-md leading-relaxed">
          Share your personal link anywhere to start receiving anonymous messages and confessions.
        </p>

        {/* Link Input with Copy Button */}
        <div className="flex items-stretch gap-2 p-1.5 rounded-xl bg-leather-900/80 border border-leather-700/50">
          <code className="flex-1 text-sm text-leather-100 truncate px-3 py-2.5 font-mono bg-leather-900/50 rounded-lg self-center">
            {link}
          </code>
          <button
            onClick={handleCopy}
            className="group/btn relative overflow-hidden bg-leather-pop hover:bg-leather-popHover text-leather-900 px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-leather-pop focus:ring-offset-2 focus:ring-offset-leather-900 flex items-center gap-2 min-w-[100px] justify-center"
          >
            <span className="relative z-10 flex items-center gap-2">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied!" : "Copy Link"}
            </span>
          </button>
        </div>

        {/* Quick Action Links */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-leather-700/30">
          <Link
            href={`/u/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link inline-flex items-center gap-2 text-xs text-leather-100/60 hover:text-leather-pop transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
            Preview profile
          </Link>
          <span className="text-leather-700/50">•</span>
          <span className="text-xs text-leather-100/40">
            Works on all devices
          </span>
        </div>
      </div>
    </Card>
  );
}

// Memoize to prevent unnecessary re-renders when username doesn't change
const ShareLinkCard = memo(ShareLinkCardInner, (prev, next) => {
  return prev.username === next.username;
});

ShareLinkCard.displayName = "ShareLinkCard";

export default ShareLinkCard;
