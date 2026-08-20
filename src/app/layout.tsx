import type { Metadata } from "next";
import { Bebas_Neue, Inter, IBM_Plex_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { getCurrentUser } from "@/lib/session";
import "./globals.css";

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "CinePass — Book your movie experience",
  description: "Discover movies, pick your seats, and get your digital ticket in minutes.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html
      lang="en"
      className={`${bebas.variable} ${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text-primary">
        <Navbar user={user} />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
