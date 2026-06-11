import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeContext";
import AuthGuard from "@/components/AuthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Xeno | AI-Native Shopper CRM",
  description:
    "Next-generation shopper engagement platform powered by autonomous AI agents and predictive segmentation.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200">
        <ThemeProvider>
          <AuthGuard>
            {/* Top Navigation Navbar */}
            <Navbar />

            {/* Main Application Area */}
            <main className="flex-1 w-full bg-radial-[at_top_right,_var(--tw-gradient-stops)] from-indigo-950/5 via-transparent to-transparent flex flex-col">
              <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
                {children}
              </div>
            </main>
          </AuthGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
