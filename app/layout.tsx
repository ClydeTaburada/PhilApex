import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Phil-Apex Placement Agency Inc. — Apply for Japan Jobs",
  description:
    "Licensed overseas placement agency (DMW-514-LB-08132024-R) connecting skilled Filipino workers with employers in Japan through TITP and SSW programs. Apply now — no placement fee.",
  keywords: "Phil-Apex, placement agency, Japan jobs, TITP, SSW, Filipino workers, overseas employment, DMW licensed, Bacolod",
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
