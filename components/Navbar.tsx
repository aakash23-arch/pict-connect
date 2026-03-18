"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { useUser } from "./UserContext";
import { useTheme } from "next-themes";
import ActiveMembersNav from "./ActiveMembersNav";
import { Menu, X } from "lucide-react";
import type firebase from "firebase/compat/app";

export default function Navbar() {
  const pathname = usePathname();
  const { user, profile } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isAuthRoute = pathname.startsWith("/login");

  const handleLogout = async () => {
    await auth.signOut();
    window.location.href = "/login";
  };

  useEffect(() => {
    if (!user?.email) {
      setUnreadCount(0);
      return;
    }
    
    const unsubscribe = db
      .collection("users")
      .doc(user.email)
      .collection("chats")
      .where("unread", "==", true)
      .onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
        setUnreadCount(snapshot.size);
      });

    return () => unsubscribe();
  }, [user]);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", show: true },
    { href: "/feed", label: "Feed", show: true },
    { href: "/events", label: "Events", show: true },
    { href: "/admin", label: "Admin", show: profile?.role === "admin" },
    { href: "/clubs", label: "Clubs", show: true },
    { href: "/academics", label: "Academics", show: true },
    { href: "/announcements", label: "Announcements", show: true },
    { href: "/inbox", label: "Messages", show: true, badge: unreadCount },
    { href: "/profile", label: "Profile", show: true },
  ].filter(link => link.show);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white shadow-md dark:bg-gray-800 dark:border-b dark:border-gray-700">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-bold text-red-600 dark:text-red-500 transition-colors">
          <Link href="/">PICT Connect</Link>
        </h1>

        <div className="flex items-center gap-4 text-sm font-medium">
          {!isAuthRoute && (
            <div className="hidden md:flex gap-4 text-gray-700 dark:text-gray-200">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="relative hover:text-red-600 dark:hover:text-red-400">
                  {link.label}
                  {link.badge ? (
                    <span className="absolute -top-2 -right-3 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                      {link.badge > 9 ? "9+" : link.badge}
                    </span>
                  ) : null}
                </Link>
              ))}
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
            <div className="hidden items-center gap-3 sm:flex">
              <span className="text-xs text-gray-600 dark:text-gray-400">
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

          {!isAuthRoute && user && (
            <button
              className="md:hidden p-1 text-gray-600 dark:text-gray-300 hover:text-red-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && !isAuthRoute && user && (
        <div className="md:hidden border-t dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4 space-y-4 shadow-inner">
          <div className="flex flex-col gap-3 text-sm font-medium text-gray-700 dark:text-gray-200">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="flex items-center justify-between hover:text-red-600 dark:hover:text-red-400">
                <span>{link.label}</span>
                {link.badge ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                    {link.badge > 9 ? "9+" : link.badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
          <div className="pt-4 border-t dark:border-gray-700 mt-4 flex justify-between items-center text-xs">
            <span className="text-gray-600 dark:text-gray-400">{user.email}</span>
            <button
              onClick={handleLogout}
              className="rounded bg-red-50 text-red-600 dark:bg-gray-700 dark:text-red-400 px-3 py-1.5 font-medium hover:bg-red-100"
            >
              Logout
            </button>
          </div>
        </div>
      )}
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
