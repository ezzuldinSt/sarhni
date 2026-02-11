import {routing} from '@/i18n/routing';
import {notFound} from 'next/navigation';
import {setRequestLocale} from 'next-intl/server';
import Navbar from "@/components/Navbar";
import {ConfirmDialogProvider} from "@/components/ui/ConfirmDialog";
import {ErrorBoundaryWrapper} from "@/components/ErrorBoundaryWrapper";

type Props = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({children, params}: Props) {
  const {locale} = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <ErrorBoundaryWrapper>
          <ConfirmDialogProvider>
            {children}
          </ConfirmDialogProvider>
        </ErrorBoundaryWrapper>
      </main>
    </>
  );
}
