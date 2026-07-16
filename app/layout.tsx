import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Phil-Apex Placement Agency — Applicant System",
  description:
    "Secure applicant and document tracking platform for Phil-Apex Placement Agency Inc.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className="h-full antialiased">
        {children}
      </body>
    </html>
  );
}
