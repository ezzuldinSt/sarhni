import {routing} from '@/i18n/routing';
import {notFound} from 'next/navigation';
import {getMessages} from 'next-intl/server';
import {NextIntlClientProvider} from 'next-intl';
import {getLocale} from 'next-intl/server';
import {getDirection} from '@/lib/utils/direction';
import { Varela_Round } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ConfirmDialogProvider } from "@/components/ui/ConfirmDialog";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";
import { SpeedInsights } from "@vercel/speed-insights/next";

const varela = Varela_Round({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-varela",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  // Ensure locale is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  return (
    <html lang={locale} dir={getDirection(locale)}>
      <body className={`${varela.className} ${varela.variable} bg-leather-900 text-leather-accent min-h-screen relative`}>
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-leather-texture z-base bg-repeat" />
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Toaster
          position="bottom-center"
          expand
          richColors
          closeButton
          toastOptions={{
            unstyled: false,
          }}
        />
        <SpeedInsights />
      </body>
    </html>
  );
}
