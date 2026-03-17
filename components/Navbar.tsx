"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useUser } from "./UserContext";
import { useTheme } from "next-themes";
import ActiveMembersNav from "./ActiveMembersNav";

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useUser();

  const isAuthRoute = pathname.startsWith("/login");

  const handleLogout = async () => {
    await auth.signOut();
    window.location.href = "/login";
  };

  return (
    <nav className="sticky top-0 z-50 flex w-full items-center justify-between bg-white px-6 py-4 shadow-md dark:bg-gray-800 dark:border-b dark:border-gray-700">
      <h1 className="text-xl font-bold text-red-600 dark:text-red-500 transition-colors">PICT Connect</h1>

      <div className="flex items-center gap-4 text-sm font-medium">
        {!isAuthRoute && (
          <div className="hidden md:flex gap-4 text-gray-700 dark:text-gray-200">
            <Link href="/dashboard" className="hover:text-red-600 dark:hover:text-red-400">Dashboard</Link>
            <Link href="/feed" className="hover:text-red-600 dark:hover:text-red-400">Feed</Link>
            <Link href="/events" className="hover:text-red-600 dark:hover:text-red-400">Events</Link>
            <Link href="/admin" className="hover:text-red-600 dark:hover:text-red-400">Admin</Link>
            <Link href="/clubs" className="hover:text-red-600 dark:hover:text-red-400">Clubs</Link>
            <Link href="/academics" className="hover:text-red-600 dark:hover:text-red-400">Academics</Link>
            <Link href="/announcements" className="hover:text-red-600 dark:hover:text-red-400">Announcements</Link>
            <Link href="/inbox" className="hover:text-red-600 dark:hover:text-red-400">Messages</Link>
            <Link href="/profile" className="hover:text-red-600 dark:hover:text-red-400">Profile</Link>
          </div>
        )}

        <ActiveMembersNav />
        <ThemeToggle />

        {!user && (
          <Link
            href="/login"
            className="rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600"
          >
            Login
          </Link>
        )}

        {user && (
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-gray-600 dark:text-gray-400 sm:inline">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
      title="Toggle Theme"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
