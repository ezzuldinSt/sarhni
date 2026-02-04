import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth"; 
import ConfessionForm from "@/components/ConfessionForm";
import ConfessionCard from "@/components/ConfessionCard"; 
import { Card } from "@/components/ui/Card";
import Image from "next/image";

// FIX: Define params as a Promise
export default async function UserProfile({ params }: { params: Promise<{ username: string }> }) {
  // 1. Await the params to get the username
  const { username } = await params;

  // 2. Get current logged-in user
  const session = await auth();
  
  // 3. Fetch the profile owner using the awaited username
  const user = await prisma.user.findUnique({
    where: { username: username },
    include: {
      receivedConfessions: {
        orderBy: [
          { isPinned: 'desc' }, 
          { createdAt: 'desc' } 
        ],
        include: {
            sender: { select: { username: true } },
            receiver: { select: { username: true } }
        }
      },
    },
  });

  if (!user) return notFound();

  // 4. Check if the viewer is the owner
  const isOwner = session?.user?.id === user.id;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header Profile Card */}
      <Card className="mb-8 text-center py-10 relative overflow-hidden">
         <div className="absolute inset-0 bg-leather-texture opacity-[0.05] pointer-events-none" />
         
         <div className="relative z-10 flex flex-col items-center">
            <div className="w-32 h-32 rounded-full border-4 border-leather-pop mb-4 overflow-hidden relative shadow-xl">
               <Image 
                 src={user.image || "/placeholder-avatar.png"} 
                 alt={user.username} 
                 fill 
                 className="object-cover"
                 unoptimized 
               />
            </div>
            <h1 className="text-3xl font-bold text-leather-accent mb-2">@{user.username}</h1>
            {user.bio && <p className="text-leather-500 max-w-sm mx-auto italic">"{user.bio}"</p>}
         </div>
      </Card>

      {/* Confession Form (Only if NOT the owner) */}
      {!isOwner && (
         <ConfessionForm 
           receiverId={user.id} 
           usernamePath={user.username} 
           user={session?.user} 
         />
      )}

      {/* Confessions List */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-leather-accent pl-2 border-l-4 border-leather-pop">
          {user.receivedConfessions.length > 0 ? "Confessions" : "No confessions yet"}
        </h3>
        
        {user.receivedConfessions.map((confession, i) => (
          <ConfessionCard 
            key={confession.id} 
            confession={confession} 
            index={i}
            isOwnerView={isOwner} 
          />
        ))}

        {user.receivedConfessions.length === 0 && (
          <div className="text-center py-12 text-leather-500 opacity-50">
             <p>The void is silent...</p>
          </div>
        )}
      </div>
    </div>
  );
}
