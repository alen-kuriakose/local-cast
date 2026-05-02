import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LocalCast — Stream Local Videos Peer-to-Peer",
  description:
    "Cast any video file from your phone to your TV browser, zero install required. WebRTC DataChannel streaming with MediaSource Extensions.",
  keywords: ["local cast", "webrtc streaming", "peer to peer video", "screen cast", "local network stream"],
  openGraph: {
    title: "LocalCast",
    description: "Stream local videos from phone to TV — zero install, zero cloud.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="grid-overlay fixed inset-0 pointer-events-none z-0" />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
