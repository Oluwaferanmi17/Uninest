import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import AuthProvider from "@/components/providers/AuthProvider";
import Navbar from "@/components/ui/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "UniNest — Find Off-Campus Student Accommodation in Nigeria",
  description:
    "UniNest helps Nigerian university students find safe, affordable off-campus housing near their university. Browse listings, chat with landlords, and pay securely with Paystack.",
  keywords: [
    "student accommodation",
    "off-campus housing",
    "Nigeria",
    "university",
    "UNILAG",
    "UI",
    "OAU",
    "FUTA",
    "UNIBEN",
    "rent",
    "hostel",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#fff",
                color: "#1a1a1a",
                borderRadius: "12px",
                border: "1px solid #f0f0f0",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
