import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/AppLayout";
import { ThemeProvider } from "@/components/ThemeProvider";

const nunito = Nunito({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
  variable: '--font-nunito'
});

export const metadata: Metadata = {
  title: "SpatialOS Dashboard",
  description: "Control Plane for Spatial Experiences",
  icons: {
    icon: '/icon.svg'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={nunito.variable} suppressHydrationWarning>
      <body className="font-nunito antialiased bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-50 transition-colors duration-200">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AppLayout>{children}</AppLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
