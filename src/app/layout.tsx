import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Swapp — Go somewhere new. Feel right at home.",
  description:
    "Swap homes with people you can trust and experience the world like a local.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
