"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Switch } from "./ui/Switch";
import { sendConfession } from "@/lib/actions/confess";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const schema = z.object({
  content: z.string().min(1, "You can't send an empty void!").max(500),
});

export default function ConfessionForm({ receiverId, usernamePath, user }: { receiverId: string, usernamePath: string, user: any }) {
  const [isAnon, setIsAnon] = useState(true);
  const [isSent, setIsSent] = useState(false); // New state for success view
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data: any) => {
    // 1. OPTIMISTIC UPDATE: Show success immediately
    setIsSent(true);
    const content = data.content; // Capture content before reset
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
        // Revert if failed (Rare)
        setIsSent(false);
        toast.error(res.error);
    } else {
        // Optional: Trigger a confetti or sound effect here
        toast.success("Sent into the void! 🚀");
        
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
          >
            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-2">
              <Send size={32} />
            </div>
            <h3 className="text-2xl font-bold text-white">Message Sent!</h3>
            <p className="text-leather-500 max-w-xs mx-auto">
              Your secret is safe with us. Want to send another?
            </p>
            <Button 
                variant="secondary" 
                onClick={() => setIsSent(false)}
                className="mt-4"
            >
                Send Another
            </Button>
          </motion.div>
        ) : (

        /* FORM VIEW */
        <motion.form 
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit(onSubmit)} 
            className="space-y-4"
        >
            <div className="flex justify-between items-center mb-2">
                <label className="text-leather-accent/80 text-sm font-bold uppercase tracking-widest">
                Leave a message
                </label>
                <span className="text-xs text-leather-500 font-mono">
                    {/* Character count could go here */}
                </span>
            </div>

            <textarea
            {...register("content")}
            className="w-full bg-leather-900/50 rounded-xl p-4 text-leather-accent placeholder-leather-600 focus:outline-none focus:ring-2 focus:ring-leather-pop resize-none h-32 transition-all"
            placeholder="Type something nice (or spicy)..."
            />
            {errors.content && <p className="text-red-400 text-sm animate-pulse">{(errors.content as any).message}</p>}

            <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
                <Switch isOn={!isAnon} onToggle={() => user ? setIsAnon(!isAnon) : toast.error("Login to reveal yourself!")} disabled={!user} />
                <div className="flex flex-col">
                    <span className={`text-sm font-bold transition-colors ${isAnon ? 'text-leather-500' : 'text-leather-pop'}`}>
                        {isAnon ? "Anonymous 👻" : user?.name || 'Me'}
                    </span>
                    {!user && <span className="text-[10px] text-leather-600 cursor-pointer hover:text-leather-pop">Login to reveal</span>}
                </div>
            </div>
            
            <Button type="submit" disabled={isSubmitting} className="group">
                {isSubmitting ? <Loader2 className="animate-spin" /> : (
                    <span className="flex items-center gap-2">
                        Send <Send size={16} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                )}
            </Button>
            </div>
        </motion.form>
        )}
      </AnimatePresence>
    </Card>
  );
}
