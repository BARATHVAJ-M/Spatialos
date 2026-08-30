import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/AppLayout";

const nunito = Nunito({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
  variable: '--font-nunito'
});

export const metadata: Metadata = {
  title: "SpatialOS Dashboard",
  description: "Control Plane for Spatial Experiences",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="font-nunito antialiased bg-slate-900 text-white">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
