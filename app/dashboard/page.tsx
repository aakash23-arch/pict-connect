"use client";

import ProtectedPage from "../../components/ProtectedPage";
import { useUser } from "../../components/UserContext";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <ProtectedPage>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-500">Dashboard</h1>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Logged in as <span className="font-medium">{user?.email}</span>
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Link
            href="/clubs"
            className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50 hover:shadow-md dark:bg-gray-800 dark:ring-gray-700 dark:hover:bg-gray-750"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Clubs</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              View and join student-led clubs, and see announcements.
            </p>
          </Link>
          <Link
            href="/academics"
            className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50 hover:shadow-md dark:bg-gray-800 dark:ring-gray-700 dark:hover:bg-gray-750"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Academics</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Access notes, previous year papers and other resources.
            </p>
          </Link>
          <Link
            href="/announcements"
            className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50 hover:shadow-md dark:bg-gray-800 dark:ring-gray-700 dark:hover:bg-gray-750"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Announcements</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              See what&apos;s happening across all clubs.
            </p>
          </Link>
          <Link
            href="/inbox"
            className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50 hover:shadow-md dark:bg-gray-800 dark:ring-gray-700 dark:hover:bg-gray-750"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Start a one-to-one chat with other PICT students.
            </p>
          </Link>
          <Link
            href="/profile"
            className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50 hover:shadow-md dark:bg-gray-800 dark:ring-gray-700 dark:hover:bg-gray-750"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Profile</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              View and edit your personal and academic information.
            </p>
          </Link>
        </div>
      </div>
    </ProtectedPage>
  );
}

