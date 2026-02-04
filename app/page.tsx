import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { auth } from "@/lib/auth";
import { MessageCircle, Shield, Share2 } from "lucide-react";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-col min-h-[90vh]">
      {/* --- HERO SECTION --- */}
      <section className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-20 px-4">
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-6xl md:text-8xl font-bold text-leather-pop tracking-tight drop-shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            Sarhni
          </h1>
          <p className="text-xl md:text-2xl text-leather-accent/80 leading-relaxed max-w-2xl mx-auto">
            The cozy space for honest, anonymous confessions. <br />
            <span className="text-leather-500 text-lg">Connect with friends without the mask.</span>
          </p>
        </div>

        <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          {session?.user ? (
            <Link href="/dashboard">
              <Button className="text-lg px-8 py-6 shadow-2xl hover:scale-105 transition-transform">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/register">
                <Button className="text-lg px-8 py-6 shadow-2xl hover:scale-105 transition-transform">
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" className="text-lg px-8 py-6 bg-leather-800/50 hover:bg-leather-800">
                  Login
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 py-20 px-4 border-t border-leather-600/20 bg-leather-900/50">
        <FeatureCard 
          icon={<Share2 size={32} />}
          title="1. Share your Link"
          desc="Create your personal space and share the link on Instagram, Twitter, or WhatsApp."
        />
        <FeatureCard 
          icon={<MessageCircle size={32} />}
          title="2. Receive Truths"
          desc="Friends (and foes) can send you messages without revealing their identity."
        />
        <FeatureCard 
          icon={<Shield size={32} />}
          title="3. Reply & React"
          desc="Pin your favorites or reply to them on your social media with cool stickers."
        />
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-8 text-center text-leather-500 text-sm">
        <p>© 2026 Sarhni. Built for honesty.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-leather-800/20 border border-leather-600/10 hover:border-leather-pop/30 transition-colors">
      <div className="p-4 rounded-full bg-leather-800 text-leather-pop mb-2">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-leather-accent">{title}</h3>
      <p className="text-leather-500 leading-relaxed max-w-xs">{desc}</p>
    </div>
  );
}
