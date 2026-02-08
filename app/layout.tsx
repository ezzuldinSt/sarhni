import type { Metadata } from "next";
import { Varela_Round } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner";
import { ConfirmDialogProvider } from "@/components/ui/ConfirmDialog";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";

const varela = Varela_Round({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-varela",
});

export const metadata: Metadata = {
  title: "Sarhni - Confess Freely",
  description: "A cozy place for honest words.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Sarhni - Confess Freely",
    description: "The cozy space for honest, anonymous confessions.",
    siteName: "Sarhni",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Sarhni - Confess Freely",
    description: "The cozy space for honest, anonymous confessions.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${varela.className} ${varela.variable} bg-leather-900 text-leather-accent min-h-screen relative`}>
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-leather-texture z-base bg-repeat" />
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <ErrorBoundaryWrapper>
            <ConfirmDialogProvider>
              {children}
            </ConfirmDialogProvider>
          </ErrorBoundaryWrapper>
        </main>
        {/* ADD THE TOASTER COMPONENT HERE */}
        <Toaster
          position="bottom-center"
          expand
          richColors
          closeButton
          toastOptions={{
            unstyled: false,
          }}
        />
      </body>
    </html>
  );
}
