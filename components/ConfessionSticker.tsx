import { Varela_Round } from "next/font/google";
import { cn } from "@/lib/utils";

const varela = Varela_Round({ weight: "400", subsets: ["latin"] });

// This component is designed to be captured as an image
export const ConfessionSticker = ({ confession }: { confession: any }) => {
  const date = new Date(confession.createdAt).toLocaleDateString();
  const senderName = confession.isAnonymous ? "Secret Admirer" : confession.sender?.username;

  return (
    <div 
      id={`sticker-${confession.id}`}
      className={cn(
        varela.className, 
        // Square aspect ratio for social media
        "aspect-square w-[600px] flex flex-col justify-center items-center p-12 bg-leather-900 relative overflow-hidden text-leather-accent"
      )}
    >
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-[0.05] bg-leather-texture bg-repeat z-0" />

      {/* The Card Look */}
      <div className="relative z-10 bg-leather-800 border-4 border-dashed border-leather-600/50 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center transform rotate-2">
        <h3 className="text-leather-pop text-sm font-bold uppercase tracking-[0.2em] mb-6">
          Someone told me on Sarhni
        </h3>
        <p className="text-3xl md:text-4xl font-bold leading-tight mb-8">
          "{confession.content}"
        </p>
        <div className="flex items-center justify-center gap-3 text-leather-500 font-bold">
             <span className="bg-leather-700 px-3 py-1 rounded-full text-sm">
                — {senderName}
             </span>
             <span className="text-xs opacity-70">{date}</span>
        </div>
      </div>
       <div className="absolute bottom-6 text-leather-600 font-bold tracking-widest uppercase text-sm z-10">
         sarhni.zhrworld.com
       </div>
    </div>
  );
};
