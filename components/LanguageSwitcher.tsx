"use client";

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const handleChange = (newLocale: string) => {
    // Get the pathname without the current locale
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPathname = segments.join('/');
    router.push(newPathname);
  };

  return (
    <div className="fixed bottom-4 end-4 z-50">
      <div className="bg-leather-800/90 backdrop-blur-md border border-leather-600/30 rounded-full p-1 flex items-center gap-1 shadow-lg">
        {/* English Option */}
        <button
          onClick={() => handleChange('en')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            locale === 'en'
              ? 'bg-leather-pop text-leather-900 shadow-md'
              : 'text-leather-accent hover:text-white hover:bg-leather-700/50'
          }`}
          aria-label="Switch to English"
        >
          <Globe size={14} />
          <span>EN</span>
        </button>

        {/* Arabic Option */}
        <button
          onClick={() => handleChange('ar')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            locale === 'ar'
              ? 'bg-leather-pop text-leather-900 shadow-md'
              : 'text-leather-accent hover:text-white hover:bg-leather-700/50'
          }`}
          aria-label="التبديل إلى العربية"
        >
          <Globe size={14} />
          <span>عربي</span>
        </button>
      </div>
    </div>
  );
}
