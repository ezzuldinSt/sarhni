"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Share2, MessageSquare, Pin, Sparkles } from "lucide-react";
import { Button } from "./Button";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
}

interface Step {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const steps: Step[] = [
  {
    id: 1,
    icon: <Sparkles size={32} className="text-leather-pop" />,
    title: "Welcome to Sarhni! 👋",
    description: "Your anonymous messaging platform is ready. Share your link and discover what people really think about you.",
  },
  {
    id: 2,
    icon: <Share2 size={32} className="text-leather-100" />,
    title: "Share Your Profile",
    description: "Copy your unique profile link and share it on social media, with friends, or anywhere you want to receive anonymous messages.",
  },
  {
    id: 3,
    icon: <MessageSquare size={32} className="text-success" />,
    title: "Send Anonymous Messages",
    description: "Visit other users' profiles to send them anonymous confessions. Choose to reveal yourself or stay completely anonymous.",
  },
  {
    id: 4,
    icon: <Pin size={32} className="text-warning" />,
    title: "Pin Your Favorites",
    description: "Love a message? Pin it to your profile! You can pin up to 3 messages to showcase your favorite confessions.",
  },
  {
    id: 5,
    icon: <Sparkles size={32} className="text-leather-pop" />,
    title: "You're All Set! 🚀",
    description: "Your journey begins now. Start sharing your link and wait for the anonymous messages to roll in!",
  },
];

export function WelcomeModal({ isOpen, onClose, username }: WelcomeModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0); // 1 for next, -1 for prev

  // Reset to first step when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    // Save that user has seen onboarding
    if (typeof window !== "undefined") {
      localStorage.setItem("sarhni-onboarded", "true");
    }
    onClose();
  };

  const handleShareProfile = () => {
    if (typeof window !== "undefined" && username) {
      const url = `${window.location.origin}/u/${username}`;
      navigator.clipboard.writeText(url);
      // You could add a toast notification here
    }
  };

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrevious();
    };
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStep]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-modal-backdrop"
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-leather-800 rounded-3xl shadow-2xl border border-leather-600/30 max-w-md w-full overflow-hidden"
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 end-4 text-leather-500 hover:text-leather-accent transition-colors duration-200 z-10 p-1 rounded-lg hover:bg-leather-700/50 focus-visible:ring-2 focus-visible:ring-leather-pop focus-visible:ring-offset-2 focus-visible:ring-offset-leather-800"
                aria-label="Close welcome tour"
              >
                <X size={24} />
              </button>

              {/* Progress bar */}
              <div className="h-1 bg-leather-900">
                <motion.div
                  className="h-full bg-leather-pop"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Content */}
              <div className="p-8 text-center">
                {/* Step indicator */}
                <div className="text-sm text-leather-accent mb-4">
                  Step {currentStep + 1} of {steps.length}
                </div>

                {/* Animated content */}
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentStep}
                    custom={direction}
                    initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Icon */}
                    <div className="w-20 h-20 mx-auto mb-6 bg-leather-900 rounded-full flex items-center justify-center">
                      {step.icon}
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-leather-accent mb-4">
                      {step.title}
                    </h2>

                    {/* Description */}
                    <p className="text-leather-100 mb-8 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Special action for share step */}
                    {currentStep === 1 && username && (
                      <Button
                        onClick={handleShareProfile}
                        className="mb-6 w-full"
                        variant="secondary"
                      >
                        <Share2 size={18} className="me-2" />
                        Copy Profile Link
                      </Button>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="px-4 py-2 text-sm font-bold text-leather-accent hover:text-leather-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-leather-pop focus-visible:ring-offset-2 focus-visible:ring-offset-leather-800 rounded-lg"
                  >
                    Previous
                  </button>

                  {/* Step dots */}
                  <div className="flex gap-2">
                    {steps.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setDirection(index > currentStep ? 1 : -1);
                          setCurrentStep(index);
                        }}
                        className={`w-2 h-2 rounded-full transition-all duration-200 focus-visible:ring-2 focus-visible:ring-leather-pop focus-visible:ring-offset-2 focus-visible:ring-offset-leather-800 ${
                          index === currentStep
                            ? "bg-leather-pop w-6"
                            : index < currentStep
                            ? "bg-leather-500"
                            : "bg-leather-700"
                        }`}
                        aria-label={`Go to step ${index + 1}`}
                      />
                    ))}
                  </div>

                  <Button onClick={handleNext} size="sm">
                    {isLastStep ? (
                      "Get Started"
                    ) : (
                      <>
                        Next
                        <ArrowRight size={16} className="ms-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook to check if user should see onboarding
export function useOnboarding() {
  const [shouldShow, setShouldShow] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasOnboarded = localStorage.getItem("sarhni-onboarded");
      setShouldShow(!hasOnboarded);
      setIsLoading(false);
    }
  }, []);

  const dismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sarhni-onboarded", "true");
    }
    setShouldShow(false);
  };

  return { shouldShow, dismiss, isLoading };
}
