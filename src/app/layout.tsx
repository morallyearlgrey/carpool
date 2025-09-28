import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers"; 

export const metadata: Metadata = {
  title: "Knightpool",
  description: "Where carpools are made.",
  icons: {
    icon: '/favicon.png', 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
        <Providers>
        <body>
          {children}
        </body>
        </Providers>

    </html>
  );
}