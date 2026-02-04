"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Copy, Check, Share2 } from "lucide-react";
import { toast } from "sonner";

export default function ShareLinkCard({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);
  
  // Use window.location.origin to get the correct domain (localhost or production)
  const getLink = () => `${window.location.origin}/u/${username}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(getLink());
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-gradient-to-br from-leather-800 to-leather-900 border-leather-pop/30 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Share2 size={100} />
      </div>
      
      <div className="relative z-10">
        <h2 className="text-lg font-bold text-leather-pop mb-2 uppercase tracking-wider">
          Get Messages
        </h2>
        <p className="text-leather-accent/80 mb-6 max-w-md">
          Share your personal link to start receiving anonymous confessions.
        </p>

        <div className="flex items-center gap-2 bg-leather-950/50 p-2 rounded-xl border border-leather-600/50">
          <code className="flex-1 text-sm text-leather-500 truncate px-2 font-mono">
             {typeof window !== 'undefined' ? getLink() : `sarhni.com/u/${username}`}
          </code>
          <button 
            onClick={handleCopy}
            className="bg-leather-pop text-leather-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-leather-popHover transition-colors flex items-center gap-2"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </Card>
  );
}
