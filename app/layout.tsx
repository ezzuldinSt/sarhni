import type { Metadata } from "next";
import { Varela_Round } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner"; // <-- IMPORT SONNER

const varela = Varela_Round({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sarhni - Confess Freely",
  description: "A cozy place for honest words.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${varela.className} bg-leather-900 text-leather-accent min-h-screen relative`}>
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-leather-texture z-50 bg-repeat" />
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        {/* ADD THE TOASTER COMPONENT HERE */}
        <Toaster 
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#3E2723', // leather-800
              color: '#D7CCC8', // leather-accent
              border: '2px solid #5D4037', // leather-600
              borderRadius: '16px',
              fontFamily: 'var(--font-varela)',
            },
            className: 'shadow-xl'
          }}
        />
      </body>
    </html>
  );
}
