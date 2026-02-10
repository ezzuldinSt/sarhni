import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { getCachedSession } from "@/lib/auth-cached";
import { Lock, Heart, Shield, Share2, MessageCircle } from "@/components/ui/Icon";
import { GlitchText } from "@/components/ui/GlitchText";

export default async function Home() {
  const session = await getCachedSession();

  return (
    <div className="flex flex-col min-h-[90vh]">
      {/* --- HERO SECTION --- */}
      <section className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-20 px-4">
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-hero md:text-hero-lg text-leather-pop tracking-tight drop-shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <GlitchText text="Sarhni" />
          </h1>
          <p className="text-xl md:text-2xl text-leather-accent/80 leading-relaxed max-w-2xl mx-auto">
            The cozy space for honest, anonymous confessions.
          </p>
          <p className="text-leather-100 text-lg">
            Connect with friends through genuine messages — no masks, no judgment.
          </p>
        </div>

        {/* Quick value props */}
        <div className="flex items-center justify-center gap-6 text-sm text-leather-500 flex-wrap">
          <span className="flex items-center gap-2">
            <Lock size={16} className="text-leather-pop" />
            100% Anonymous
          </span>
          <span className="flex items-center gap-2">
            <Heart size={16} className="text-leather-pop" />
            Free Forever
          </span>
          <span className="flex items-center gap-2">
            <Shield size={16} className="text-leather-pop" />
            Safe & Secure
          </span>
        </div>

        <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 flex-wrap justify-center">
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
                  Get Started Free
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

        {/* Social proof */}
        <p className="text-leather-600 text-sm">
          Join thousands sharing honest messages every day
        </p>
      </section>

      {/* --- HOW IT WORKS SECTION --- */}
      <section className="py-16 px-4 bg-leather-900/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-leather-pop text-center mb-12">
            How Sarhni Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Share2 size={32} />}
              title="1. Share your Link"
              desc="Create your personal space and share the link on Instagram, Twitter, or WhatsApp."
            />
            <FeatureCard
              icon={<MessageCircle size={32} />}
              title="2. Receive Truths"
              desc="Friends can send you anonymous messages without revealing their identity."
            />
            <FeatureCard
              icon={<Shield size={32} />}
              title="3. Reply & React"
              desc="Pin your favorites, reply to messages, or share them as cool stickers."
            />
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-8 text-center text-leather-500 text-sm border-t border-leather-700/20">
        <p>© 2026 Sarhni. Built for honest connections.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-leather-800/20 border border-leather-600/10 hover:border-leather-pop/30 transition-colors">
      <div className="p-4 rounded-full bg-leather-800 text-leather-pop mb-2" aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-leather-accent">{title}</h3>
      <p className="text-leather-500 leading-relaxed max-w-xs">{desc}</p>
    </div>
  );
}
