"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Switch } from "./ui/Switch";
import { sendConfession } from "@/lib/actions/confess";
import { toastSuccess, toastError } from "@/lib/toast";
import { Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const schema = z.object({
  content: z.string().min(1, "You can't send an empty void!").max(500),
});

export default function ConfessionForm({ receiverId, usernamePath, user }: { receiverId: string, usernamePath: string, user: any }) {
  const [isAnon, setIsAnon] = useState(true);
  const [isSent, setIsSent] = useState(false); // New state for success view
  const savedContentRef = useRef<string | null>(null); // Store content for error recovery
  const formId = "confession-form";
  const contentErrorId = "content-error";

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema)
  });

  const contentValue = watch("content", "");
  const charCount = contentValue.length;

  const onSubmit = async (data: any) => {
    // 1. OPTIMISTIC UPDATE: Show success immediately
    setIsSent(true);
    const content = data.content; // Capture content before reset
    savedContentRef.current = content; // Store for potential error recovery
    reset(); // Clear form instantly

    // 2. Prepare Data
    const formData = new FormData();
    formData.append("content", content);
    formData.append("receiverId", receiverId);
    formData.append("usernamePath", usernamePath);
    formData.append("isAnonymous", isAnon.toString());

    // 3. Send in Background
    // We don't await this for the UI, but we catch errors if it fails
    const res = await sendConfession(formData);

    if (res?.error) {
        // Revert if failed - restore the form content
        setIsSent(false);
        // Restore the saved content
        if (savedContentRef.current) {
          reset({ content: savedContentRef.current });
          savedContentRef.current = null;
        }
        toastError(res.error);
    } else {
        // Optional: Trigger a confetti or sound effect here
        toastSuccess("Sent into the void! 🚀");
        savedContentRef.current = null; // Clear saved content on success

        // Reset the "Sent" view after 3 seconds so they can send another
        setTimeout(() => setIsSent(false), 3000);
    }
  };

  return (
    <Card className="mb-8 relative overflow-hidden transition-all duration-300">
      <AnimatePresence mode="wait">
        
        {/* SUCCESS VIEW */}
        {isSent ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center py-12 text-center space-y-4"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mb-2" aria-hidden="true">
              <Send size={32} />
            </div>
            <h3 className="text-2xl font-bold text-white">Message Sent!</h3>
            <p className="text-leather-accent/80 max-w-xs mx-auto">
              Your secret is safe with us. Want to send another?
            </p>
            <Button
                variant="secondary"
                onClick={() => setIsSent(false)}
                className="mt-4"
                aria-label="Send another message"
            >
                Send Another
            </Button>
          </motion.div>
        ) : (

        /* FORM VIEW */
        <motion.form
            key="form"
            id={formId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
        >
            <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="confession-content"
                  className="text-leather-accent/80 text-sm font-bold uppercase tracking-widest"
                >
                Leave a message
                </label>
                <span
                  id="char-count"
                  className={`text-xs font-mono transition-colors ${charCount > 450 ? 'text-red-400 font-bold' : 'text-leather-500'}`}
                  aria-live="polite"
                  aria-atomic="true"
                >
                    {charCount}/500
                </span>
            </div>

            <textarea
              id="confession-content"
              {...register("content")}
              className="w-full bg-leather-900/50 rounded-xl p-4 text-leather-accent placeholder-leather-600 focus:outline-none focus:ring-2 focus:ring-leather-pop focus:ring-offset-2 focus:ring-offset-leather-800 resize-none h-32 transition-all"
              placeholder="Type something nice (or spicy)..."
              aria-label="Write your anonymous message"
              aria-describedby={errors.content ? `${contentErrorId} char-count` : "char-count"}
              aria-invalid={errors.content ? "true" : "false"}
              aria-required="true"
              maxLength={500}
            />
            {errors.content && (
              <p
                id={contentErrorId}
                className="text-red-400 text-sm mt-2 flex items-center gap-2"
                role="alert"
                aria-live="assertive"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {(errors.content as any).message}
              </p>
            )}

            <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3" role="group" aria-label="Message identity settings">
                <Switch
                  isOn={!isAnon}
                  onToggle={() => user ? setIsAnon(!isAnon) : toastError("Login to reveal yourself!")}
                  disabled={!user}
                  aria-label={isAnon ? "Send anonymously - currently enabled" : "Reveal your identity - currently disabled"}
                />
                <div className="flex flex-col">
                    <span
                      className={`text-sm font-bold transition-colors ${isAnon ? 'text-leather-500' : 'text-leather-pop'}`}
                      aria-live="polite"
                    >
                        {isAnon ? "Anonymous 👻" : user?.name || 'Me'}
                    </span>
                    {!user && (
                      <span
                        className="text-[10px] text-leather-600 cursor-pointer hover:text-leather-pop"
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          // Navigate to login
                          window.location.href = '/login';
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            window.location.href = '/login';
                          }
                        }}
                      >
                        Login to reveal
                      </span>
                    )}
                </div>
            </div>

            <Button
              type="submit"
              isLoading={isSubmitting}
              className="group"
              disabled={isSubmitting}
              aria-label={isSubmitting ? "Sending message..." : "Send your anonymous message"}
            >
                <span className="flex items-center gap-2">
                    Send <Send size={16} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </span>
            </Button>
            </div>
        </motion.form>
        )}
      </AnimatePresence>
    </Card>
  );
}
