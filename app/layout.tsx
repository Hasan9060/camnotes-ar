import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CamNotes AR | Intelligent Vision & Notes Suite",
  description: "Real-time AI camera OCR, note extraction, flashcard generator, interactive quizzes, and math solver powered by Next.js & Tailwind CSS.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased bg-slate-50 dark:bg-slate-900 text-black dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
