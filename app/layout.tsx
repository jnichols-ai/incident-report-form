import type { Metadata, Viewport } from "next";
import UpdateBanner from "@/components/UpdateBanner";

export const metadata: Metadata = {
  title: "Incident Report",
  description: "Report an auto accident, work injury, or property damage incident.",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#c1272d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif", background: "#f5f6f8" }}>
        {children}
        <UpdateBanner />
      </body>
    </html>
  );
}
