import { LucideIcon } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  illustration?: "inbox" | "search" | "sent" | "ghost" | "messages";
}

const illustrations = {
  inbox: (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="40" y="60" width="120" height="100" rx="8" className="stroke-leather-600" strokeWidth="2" fill="none"/>
      <path d="M40 80 L100 120 L160 80" className="stroke-leather-600" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="150" cy="50" r="20" className="fill-leather-600/20" />
      <path d="M145 45 L155 55 M155 45 L145 55" className="stroke-leather-100" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="80" cy="80" r="40" className="stroke-leather-600" strokeWidth="2" fill="none"/>
      <path d="M110 110 L150 150" className="stroke-leather-600" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="65" cy="70" r="3" className="fill-leather-600/50"/>
      <circle cx="95" cy="85" r="5" className="fill-leather-600/30"/>
      <circle cx="75" cy="95" r="4" className="fill-leather-600/40"/>
    </svg>
  ),
  sent: (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 100 L70 130 L160 50" className="stroke-leather-600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="100" cy="50" r="20" className="fill-leather-600/10"/>
      <path d="M95 45 L105 55 M105 45 L95 55" className="stroke-leather-100" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  ghost: (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M70 60 C70 45, 130 45, 130 60 L130 140 L120 130 L110 140 L100 130 L90 140 L80 130 L70 140 Z" className="stroke-leather-600" strokeWidth="2" fill="none" strokeLinejoin="round"/>
      <circle cx="90" cy="80" r="5" className="fill-leather-600"/>
      <circle cx="110" cy="80" r="5" className="fill-leather-600"/>
      <path d="M90 100 Q100 110, 110 100" className="stroke-leather-600" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  messages: (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="50" width="140" height="100" rx="12" className="stroke-leather-600" strokeWidth="2" fill="none"/>
      <path d="M30 70 L80 100 L130 70" className="stroke-leather-600" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
      <circle cx="160" cy="60" r="15" className="fill-leather-pop/20"/>
      <path d="M155 55 L165 65 M165 55 L155 65" className="stroke-leather-pop" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
};

// Memoize EmptyState to prevent unnecessary re-renders
export const EmptyState = memo(function EmptyState({
  icon: Icon,
  emoji,
  title,
  description,
  action,
  secondaryAction,
  illustration,
}: EmptyStateProps) {
  // Stabilize action callbacks with useCallback to prevent memo busting
  const handleActionClick = useCallback(() => {
    action?.onClick();
  }, [action]);

  const handleSecondaryActionClick = useCallback(() => {
    secondaryAction?.onClick();
  }, [secondaryAction]);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Illustration or Icon */}
      {illustration && (
        <div className="w-32 h-32 mb-6 opacity-60">
          {illustrations[illustration]}
        </div>
      )}
      {Icon && !illustration && (
        <div className="w-16 h-16 bg-leather-800 rounded-full flex items-center justify-center mb-4">
          <Icon size={32} className="text-leather-100" />
        </div>
      )}
      {emoji && !Icon && !illustration && (
        <div className="w-16 h-16 bg-leather-800 rounded-full flex items-center justify-center mb-4 text-3xl">
          {emoji}
        </div>
      )}

      {/* Title */}
      <h3 className="text-xl font-bold text-leather-accent mb-2">{title}</h3>

      {/* Description */}
      <p className="text-leather-accent max-w-xs mx-auto mb-6">{description}</p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button onClick={handleActionClick} size="sm">
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <button
              onClick={handleSecondaryActionClick}
              className="px-4 py-2 text-sm text-leather-pop hover:text-white transition-colors font-bold"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
});

// Pre-configured empty states for common use cases
// Memoize to prevent re-renders when props don't change
export const EmptyInbox = memo(function EmptyInbox({ isOwner, onShare }: { isOwner: boolean; onShare?: () => void }) {
  // Memoize the action object to prevent memo busting
  const action = useMemo(() => {
    return isOwner ? { label: "Share Profile", onClick: onShare || (() => {}) } : undefined;
  }, [isOwner, onShare]);

  return (
    <EmptyState
      illustration="inbox"
      title={isOwner ? "Your inbox is empty" : "No messages yet"}
      description={
        isOwner
          ? "Share your profile link to start receiving anonymous messages."
          : "Be the first to break the silence. Send a confession now!"
      }
      action={action}
    />
  );
});

// Memoize EmptySearchResults to prevent re-renders on unrelated changes
export const EmptySearchResults = memo(function EmptySearchResults({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <svg viewBox="0 0 200 200" className="w-20 h-20 mb-3 opacity-40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="80" cy="80" r="40" className="stroke-leather-100" strokeWidth="2" fill="none"/>
        <path d="M110 110 L150 150" className="stroke-leather-100" strokeWidth="2" strokeLinecap="round"/>
        <path d="M65 70 L70 75 M70 70 L65 75" className="stroke-leather-100" strokeWidth="2" strokeLinecap="round"/>
        <path d="M95 85 L100 90 M100 85 L95 90" className="stroke-leather-100" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <p className="text-sm text-leather-100">
        No souls found matching <span className="text-leather-accent font-medium">"{query}"</span>
      </p>
      <p className="text-xs text-leather-accent mt-1">Try a different search term</p>
    </div>
  );
});

// Memoize - no props so never re-renders
export const EmptySentMessages = memo(function EmptySentMessages() {
  return (
    <EmptyState
      illustration="sent"
      title="No sent messages yet"
      description="Messages you send will appear here. Start sharing your thoughts with others!"
    />
  );
});

// Memoize - no props so never re-renders
export const EmptyProfile = memo(function EmptyProfile() {
  return (
    <EmptyState
      illustration="ghost"
      title="This profile is quiet"
      description="No confessions yet. Be the first to send an anonymous message!"
    />
  );
});
