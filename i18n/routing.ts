import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  // Locales supported by the application
  locales: ['en', 'ar'],

  // Default locale
  defaultLocale: 'en',

  // Always show locale prefix for clear routing
  // /en for English, /ar for Arabic
  localePrefix: 'always',
});
