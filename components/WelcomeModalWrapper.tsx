"use client";

import { memo } from "react";
import { WelcomeModal, useOnboarding } from "@/components/ui/WelcomeModal";

interface WelcomeModalWrapperProps {
  username?: string;
}

function WelcomeModalWrapperInner({ username }: WelcomeModalWrapperProps) {
  const { shouldShow, dismiss } = useOnboarding();

  return (
    <WelcomeModal
      isOpen={shouldShow}
      onClose={dismiss}
      username={username}
    />
  );
}

// Memoize to prevent unnecessary re-renders when username doesn't change
// Note: shouldShow is managed by useOnboarding hook, which handles its own state
const WelcomeModalWrapper = memo(WelcomeModalWrapperInner, (prev, next) => {
  return prev.username === next.username;
});

WelcomeModalWrapper.displayName = "WelcomeModalWrapper";

export default WelcomeModalWrapper;
