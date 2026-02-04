"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Switch } from "./ui/Switch";
import { sendConfession } from "@/lib/actions/confess";
// Remove motion/AnimatePresence imports
import { toast } from "sonner"; // Import toast

const schema = z.object({
  content: z.string().min(1, "You can't send an empty void!").max(500),
});

export default function ConfessionForm({ receiverId, usernamePath, user }: { receiverId: string, usernamePath: string, user: any }) {
  const [isAnon, setIsAnon] = useState(true);
  // Remove success state
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data: any) => {
    const formData = new FormData();
    formData.append("content", data.content);
    formData.append("receiverId", receiverId);
    formData.append("usernamePath", usernamePath);
    formData.append("isAnonymous", isAnon.toString());

    const res = await sendConfession(formData);

    if (res?.error) {
        toast.error(res.error); // Show error toast
    } else {
        toast.success("Confession sent into the void! 🚀", {
            duration: 4000,
        });
        reset();
    }
  };

  return (
    <Card className="mb-8 relative overflow-hidden">
      {/* Remove the AnimatePresence success block */}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <label className="block text-leather-accent/80 text-sm font-bold uppercase tracking-widest">
          Leave a message
        </label>
        <textarea
          {...register("content")}
          className="w-full bg-leather-900/50 rounded-xl p-4 text-leather-accent placeholder-leather-600 focus:outline-none focus:ring-2 focus:ring-leather-pop resize-none h-32"
          placeholder="Type something nice (or spicy)..."
        />
        {errors.content && <p className="text-red-400 text-sm">{(errors.content as any).message}</p>}

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <Switch isOn={!isAnon} onToggle={() => user ? setIsAnon(!isAnon) : null} disabled={!user} />
            <span className="text-sm font-medium">
              {isAnon ? "Anonymous 👻" : `As ${user?.name || 'Me'}`}
            </span>
            {!user && <span className="text-xs text-leather-500">(Login to reveal)</span>}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
