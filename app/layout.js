import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import NetworkStatus from "@/components/shared/network-status";
import PwaServiceWorker from "@/components/shared/pwa-service-worker";

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "Virtus PlayCast",
    template: "%s | Virtus PlayCast",
  },
  description: "Transmissões, telões e patrocinadores em um só lugar.",
  applicationName: "Virtus PlayCast",
  keywords: [
    "transmissão",
    "telão",
    "igreja",
    "patrocinadores",
    "Virtus PlayCast",
  ],
  icons: {
    icon: "/brand/virtus-playcast-mark.png",
    apple: "/brand/virtus-playcast-mark.png",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Virtus PlayCast",
    title: "Virtus PlayCast",
    description: "Transmissões, telões e patrocinadores em um só lugar.",
    images: [
      { url: "/brand/virtus-playcast-color.png", alt: "Virtus PlayCast" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Virtus PlayCast",
    description: "Transmissões, telões e patrocinadores em um só lugar.",
    images: ["/brand/virtus-playcast-color.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <NetworkStatus />
        <PwaServiceWorker />
        <Analytics />
      </body>
    </html>
  );
}
