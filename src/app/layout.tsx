import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { THEME_INIT_SCRIPT } from "@/theme/preference";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Control Freak",
    template: "%s · Control Freak",
  },
  description:
    "Document NIST SP 800-53 Rev. 5 Moderate controls and export OSCAL SSP JSON.",
  applicationName: "Control Freak",
  icons: {
    icon: [{ url: "/brand/mark-on-light.png", type: "image/png" }],
    apple: [{ url: "/brand/mark-on-light.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full overflow-hidden antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex h-full min-h-0 flex-col overflow-hidden bg-background text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
