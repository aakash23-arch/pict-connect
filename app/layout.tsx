import "./globals.css";
import Navbar from "../components/Navbar";
import { UserProvider } from "../components/UserContext";
import { ThemeProvider } from "@/components/ThemeProvider";

import { Toaster } from "sonner";

export const metadata = {
  title: "PICT Connect",
  description: "Platform for PICT students",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <Toaster position="top-right" richColors />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <UserProvider>
            <Navbar />
            <main className="p-6">{children}</main>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
