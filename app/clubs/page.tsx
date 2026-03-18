"use client";

import { useState } from "react";
import ProtectedPage from "../../components/ProtectedPage";
import { useUser } from "../../components/UserContext";
import { CLUBS } from "../../lib/data/clubs";
import { Users } from "lucide-react";
import Link from "next/link";

export default function ClubsPage() {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClubs = CLUBS.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedPage>
      <div>
        <h1 className="mb-4 text-2xl font-semibold text-blue-700 dark:text-blue-500">All Clubs</h1>
        <p className="mb-6 text-sm text-gray-600">
          Browse student clubs and open their pages to see announcements and members.
        </p>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search clubs..."
            className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClubs.map((club) => (
            <Link
              key={club.id}
              href={`/clubs/${club.id}`}
              className="flex flex-col justify-between rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{club.name}</h2>
                <p className="mt-1 text-sm text-gray-600 line-clamp-3">{club.description}</p>
              </div>
              <span className="mt-3 text-xs font-medium text-red-600">View club →</span>
            </Link>
          ))}
        </div>

        {filteredClubs.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 p-12 text-center text-gray-500">
            <Users size={48} className="mb-4 text-gray-400" />
            <p className="font-medium text-gray-600">No clubs found matching your search.</p>
          </div>
        )}

        {user && (
          <p className="mt-6 text-xs text-gray-500">
            Joined status is managed via subcollections: <code>users/{"{email}"}/clubs</code> and{" "}
            <code>clubs/{"{clubId}"}/members</code>.
          </p>
        )}
      </div>
    </ProtectedPage>
  );
}
