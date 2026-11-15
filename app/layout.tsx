import type { Metadata, Viewport } from "next";
import { Karla, Playfair_Display } from "next/font/google";
import "./globals.css";

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://home-heart-cafe.vercel.app"),
  title: {
    default: "Home ❤️ Cafe | Sips of happiness in every cup",
    template: "%s | Home ❤️ Cafe",
  },
  description:
    "Interactive campus cafe ordering system for Home ❤️ Cafe. Order handcrafted milk tea, fruit sodas, iced coffee, and crispy fries ahead of your campus break with verified student guest checkout.",
  keywords: [
    "Home Cafe",
    "Campus Cafe",
    "Milk Tea",
    "Fruit Soda",
    "Barkada Bundles",
    "Coffee",
    "French Fries",
    "Student Ordering",
  ],
  authors: [{ name: "Home Heart Cafe Team" }],
  creator: "Home Heart Cafe",
  publisher: "Home Heart Cafe",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: "/icon.svg",
    shortcut: "/icon.svg",
  },
  openGraph: {
    title: "Home ❤️ Cafe | Campus Cafe Ordering",
    description:
      "Sips of happiness in every cup. Order handcrafted milk tea, fruit sodas, and crispy fries ahead of your campus break.",
    url: "https://home-heart-cafe.vercel.app",
    siteName: "Home ❤️ Cafe",
    locale: "en_PH",
    type: "website",
    images: [
      {
        url: "/logo.svg",
        width: 800,
        height: 240,
        alt: "Home Heart Cafe Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Home ❤️ Cafe | Campus Cafe Ordering",
    description:
      "Sips of happiness in every cup. Order drinks and fries ahead of your campus break.",
    images: ["/logo.svg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${karla.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans selection:bg-[#dbeafe] selection:text-[#2563eb]">
        {children}
      </body>
    </html>
  );
}
