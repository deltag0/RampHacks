import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Swapp — Trusted home exchanges",
    template: "%s | Swapp",
  },
  description:
    "Find reciprocal home exchanges with members whose destinations, dates, and homes align.",
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
