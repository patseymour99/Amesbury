import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "react-hot-toast";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Amesbury – Family Hub",
  description:
    "A personal family hub with shared calendar, tasks, hobby tracker, travel planner and AI assistant.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "#fff",
                color: "#0f172a",
                boxShadow:
                  "0 4px 20px -2px rgba(0,0,0,0.1), 0 2px 8px -2px rgba(0,0,0,0.06)",
                borderRadius: "12px",
                fontSize: "14px",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
