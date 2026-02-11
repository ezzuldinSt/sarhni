import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { getCachedSession } from "@/lib/auth-cached";
import { MessageCircle, Shield, Share2, Heart, Lock } from "lucide-react";
import { GlitchText } from "@/components/ui/GlitchText";
import { getTranslations } from 'next-intl/server';

export default async function Home() {
  const session = await getCachedSession();
  const t = await getTranslations('HomePage');

  return (
    <div className="flex flex-col min-h-[90vh]">
      {/* --- HERO SECTION --- */}
      <section className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-20 px-4">
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-hero md:text-hero-lg text-leather-pop tracking-tight drop-shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <GlitchText text="Sarhni" />
          </h1>
          <p className="text-xl md:text-2xl text-leather-accent/80 leading-relaxed max-w-2xl mx-auto">
            {t('hero.tagline')}
          </p>
          <p className="text-leather-100 text-lg">
            {t('hero.description')}
          </p>
        </div>

        {/* Quick value props */}
        <div className="flex items-center justify-center gap-6 text-sm text-leather-500 flex-wrap">
          <span className="flex items-center gap-2">
            <Lock size={16} className="text-leather-pop" />
            {t('hero.anonymous')}
          </span>
          <span className="flex items-center gap-2">
            <Heart size={16} className="text-leather-pop" />
            {t('hero.free')}
          </span>
          <span className="flex items-center gap-2">
            <Shield size={16} className="text-leather-pop" />
            {t('hero.secure')}
          </span>
        </div>

        <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 flex-wrap justify-center">
          {session?.user ? (
            <Link href="/dashboard">
              <Button className="text-lg px-8 py-6 shadow-2xl hover:scale-105 transition-transform">
                {t('hero.goToDashboard')}
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/register">
                <Button className="text-lg px-8 py-6 shadow-2xl hover:scale-105 transition-transform">
                  {t('hero.getStarted')}
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" className="text-lg px-8 py-6 bg-leather-800/50 hover:bg-leather-800">
                  {t('hero.login')}
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Social proof */}
        <p className="text-leather-600 text-sm">
          {t('hero.socialProof')}
        </p>
      </section>

      {/* --- HOW IT WORKS SECTION --- */}
      <section className="py-16 px-4 bg-leather-900/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-leather-pop text-center mb-12">
            {t('howItWorks.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Share2 size={32} />}
              title={t('howItWorks.step1.title')}
              desc={t('howItWorks.step1.description')}
            />
            <FeatureCard
              icon={<MessageCircle size={32} />}
              title={t('howItWorks.step2.title')}
              desc={t('howItWorks.step2.description')}
            />
            <FeatureCard
              icon={<Shield size={32} />}
              title={t('howItWorks.step3.title')}
              desc={t('howItWorks.step3.description')}
            />
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-8 text-center text-leather-500 text-sm border-t border-leather-700/20">
        <p>{t('footer.copyright')}</p>
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
