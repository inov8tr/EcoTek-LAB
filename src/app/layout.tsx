import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EcoTek R&D Portal",
  description:
    "Research and development portal for EcoTek polymer-modified asphalt formulations.",
  icons: {
    icon: "/EcoTek Logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[var(--color-bg-main)] text-[var(--color-text-main)] antialiased">
        {children}
      </body>
    </html>
  );
}
