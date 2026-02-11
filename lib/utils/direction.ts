/**
 * Determines the text direction for a given locale
 * @param locale - The locale code (e.g., 'en', 'ar')
 * @returns 'rtl' for right-to-left languages, 'ltr' otherwise
 */
export function getDirection(locale: string): 'ltr' | 'rtl' {
  const rtlLocales = ['ar', 'he', 'fa', 'ur'];
  return rtlLocales.includes(locale) ? 'rtl' : 'ltr';
}
