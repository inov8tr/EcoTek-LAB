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
    <html lang="en" suppressHydrationWarning>
      <body
        className="
          min-h-screen 
          bg-[var(--color-bg-main)] 
          text-[var(--color-text-main)] 
          antialiased
        "
      >
        {/* App wrapper ensures overlays & fixed elements work consistently */}
        <div id="app-root" className="relative min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
