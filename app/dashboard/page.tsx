import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import ConfessionCard from "@/components/ConfessionCard";
import ShareLinkCard from "@/components/ShareLinkCard";
import { Mail, Send, Inbox } from "lucide-react"; // Fixed import

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: {
        select: { receivedConfessions: true, sentConfessions: true }
      },
      receivedConfessions: {
        orderBy: { createdAt: 'desc' },
        include: { sender: { select: { username: true, image: true } } }
      },
      sentConfessions: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { receiver: true }
      }
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-8 justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-leather-pop mb-2">Hello, {user?.username} 👋</h1>
          <p className="text-leather-500">Ready to see what people really think?</p>
        </div>
      </div>

      {/* --- NEW: SHARE LINK SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <ShareLinkCard username={user?.username || ""} />
        </div>
        
        {/* Stats Column */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
          <Card className="flex flex-col items-center justify-center p-6 bg-leather-800/50 hover:bg-leather-800 transition-colors">
            <Inbox className="w-8 h-8 text-leather-pop mb-2 opacity-80" />
            <span className="text-3xl font-bold text-white mb-1">{user?._count.receivedConfessions ?? 0}</span>
            <span className="text-leather-500 uppercase text-[10px] tracking-widest text-center">Received</span>
          </Card>
          <Card className="flex flex-col items-center justify-center p-6 bg-leather-800/50 hover:bg-leather-800 transition-colors">
            <Send className="w-8 h-8 text-leather-pop mb-2 opacity-80" />
            <span className="text-3xl font-bold text-white mb-1">{user?._count.sentConfessions ?? 0}</span>
            <span className="text-leather-500 uppercase text-[10px] tracking-widest text-center">Sent</span>
          </Card>
        </div>
      </div>

      {/* --- INBOX SECTION --- */}
      <div>
        <div className="flex items-center gap-2 mb-6">
           <Mail className="text-leather-pop" />
           <h2 className="text-xl font-bold text-leather-accent">Your Inbox</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user?.receivedConfessions.map((confession, i) => (
            <ConfessionCard key={confession.id} confession={confession} index={i} isOwnerView={true} />
          ))}
          
          {/* FIX: Added safe fallback (?? 0) to ensure we compare numbers */}
          {(user?.receivedConfessions?.length ?? 0) === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-leather-600/30 rounded-3xl bg-leather-800/20">
               <p className="text-leather-500 italic mb-4">Your inbox is empty.</p>
               <p className="text-leather-accent font-bold">Share your link above to break the silence!</p>
            </div>
          )}
        </div>
      </div>

      {/* --- RECENT SENT SECTION --- */}
      {/* FIX: Added safe fallback (?? 0) to ensure we compare numbers */}
      {(user?.sentConfessions?.length ?? 0) > 0 && (
        <div className="pt-8 border-t border-leather-600/20">
          <h2 className="text-lg font-bold mb-4 text-leather-500 uppercase tracking-widest text-xs">Recently Sent</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {user?.sentConfessions.map((msg) => (
              <div key={msg.id} className="p-4 rounded-xl bg-leather-900 border border-leather-700 hover:border-leather-600 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-leather-500">To: <span className="text-leather-pop">@{msg.receiver.username}</span></span>
                  <span className="text-[10px] text-leather-600">{msg.createdAt.toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-leather-accent/80 line-clamp-2">"{msg.content}"</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
