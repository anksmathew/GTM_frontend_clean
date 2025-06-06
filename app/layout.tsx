import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./global.css";
import Sidebar from '../components/Sidebar';
import Link from 'next/link';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Catapult!",
  description: "A dashboard for managing product launches",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-[#0a0a0a] text-white min-h-screen`}>
        <div className="flex min-h-screen w-full">
          <aside className="h-full w-64 flex-shrink-0">
            <Sidebar />
          </aside>
          <main className="flex-1 min-h-screen h-full w-full bg-[#F8FAFC] text-[#181C2A] p-6 shadow-lg flex flex-col">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
