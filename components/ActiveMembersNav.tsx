"use client";

import { useEffect, useState } from "react";
import { useUser, UserProfile } from "./UserContext";
import { db } from "../lib/firebase";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

export default function ActiveMembersNav() {
    const { user } = useUser();
    const [activeMembers, setActiveMembers] = useState<(UserProfile & { email: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const snapshot = await db.collection("users").limit(5).get();
                const membersWithId: (UserProfile & { email: string })[] = snapshot.docs.map((doc: firebase.firestore.QueryDocumentSnapshot) => ({
                    ...(doc.data() as UserProfile),
                    email: doc.id
                }));

                const others = membersWithId.filter((m) => m.email !== user?.email);
                setActiveMembers(others.slice(0, 5));
            } catch (error) {
                console.error("Error fetching members", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchMembers();
        }
    }, [user]);

    if (!user || activeMembers.length === 0) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition"
                title="Active Members"
            >
                <div className="flex -space-x-2">
                    {activeMembers.slice(0, 3).map((m: UserProfile & { email: string }, i: number) => (
                        <div key={i} className="flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-white dark:ring-gray-900 bg-red-100 text-[10px] font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            {m.displayName ? m.displayName[0] : m.email[0].toUpperCase()}
                        </div>
                    ))}
                </div>
                <span className="ml-2 text-xs font-medium text-gray-600 dark:text-gray-300 hidden sm:inline">Members</span>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-72 rounded-xl bg-white p-4 shadow-xl ring-1 ring-gray-200 z-50 dark:bg-gray-800 dark:ring-gray-700 font-sans">
                        <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-gray-100">Active Members</h3>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            {activeMembers.map((member: UserProfile & { email: string }) => (
                                <div key={member.email} className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                            {member.displayName ? member.displayName[0] : member.email[0].toUpperCase()}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-200">
                                                {member.displayName || member.email}
                                            </p>
                                            <p className="truncate text-[10px] text-gray-500 dark:text-gray-400">
                                                {member.branch || "Student"} • {member.year || "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/chat/${member.email}`}
                                        className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition"
                                        title="Message"
                                    >
                                        <MessageCircle size={16} />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
