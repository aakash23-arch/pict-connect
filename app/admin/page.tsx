"use client";

import { useEffect, useState } from "react";
import ProtectedPage from "../../components/ProtectedPage";
import { db } from "../../lib/firebase";
import { useUser } from "../../components/UserContext";
import firebase from "firebase/compat/app";

interface UserData {
    email: string;
    role?: string;
    createdAt?: firebase.firestore.Timestamp;
}

interface ReportedItem {
    id: string;
    type: "post" | "comment";
    content: string;
    reason: string;
}

export default function AdminPage() {
    const { user } = useUser();
    const [isAdmin, setIsAdmin] = useState(false);
    const [users, setUsers] = useState<UserData[]>([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalPosts: 0,
        totalEvents: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.email) return;

        // Hardcoded admin check for demo, or fetching from a specific 'admins' collection
        // In a real app, you might check a custom claim or a document in 'admins' collection
        const checkAdmin = async () => {
            // For this demo, let's assume the current user is admin if they have a specific email pattern
            // or just allow for demonstration purposes if the user is authorized in some other way.
            // Let's check a 'roles' collection or similar.
            // For now, let's just allow it for testing if the email contains 'admin'
            if (user.email.includes("admin") || user.email.includes("pict.edu")) { // rigorous check needed in prod
                setIsAdmin(true);
                fetchData();
            } else {
                setLoading(false);
            }
        };

        checkAdmin();
    }, [user]);

    const fetchData = async () => {
        try {
            const usersSnap = await db.collection("users").get();
            const postsSnap = await db.collection("posts").get();
            const eventsSnap = await db.collection("events").get();

            setStats({
                totalUsers: usersSnap.size,
                totalPosts: postsSnap.size,
                totalEvents: eventsSnap.size,
            });

            const usersData = usersSnap.docs.map((doc: firebase.firestore.QueryDocumentSnapshot) => ({
                email: doc.id,
                ...doc.data()
            })) as UserData[];
            setUsers(usersData.slice(0, 10)); // Just show first 10 for now

            setLoading(false);
        } catch (error) {
            console.error("Error fetching admin data", error);
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Checking permissions...</div>;

    if (!isAdmin) {
        return (
            <ProtectedPage>
                <div className="flex h-64 items-center justify-center rounded-lg bg-red-50 p-8 text-center text-red-800">
                    <p className="text-lg font-semibold">Access Denied</p>
                    <p className="text-sm">You do not have administrative privileges.</p>
                </div>
            </ProtectedPage>
        );
    }

    return (
        <ProtectedPage>
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
                        <p className="text-sm font-medium text-gray-500">Total Students</p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                    </div>
                    <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
                        <p className="text-sm font-medium text-gray-500">Total Posts</p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalPosts}</p>
                    </div>
                    <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
                        <p className="text-sm font-medium text-gray-500">Active Events</p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalEvents}</p>
                    </div>
                </div>

                {/* Recent Users Table */}
                <div className="rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
                    <div className="border-b px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Email</th>
                                    <th className="px-6 py-3 font-medium">Joined</th>
                                    <th className="px-6 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {users.map((u) => (
                                    <tr key={u.email}>
                                        <td className="px-6 py-3 text-gray-900">{u.email}</td>
                                        <td className="px-6 py-3 text-gray-500">
                                            {u.createdAt ? u.createdAt.toDate().toLocaleDateString() : "-"}
                                        </td>
                                        <td className="px-6 py-3">
                                            <button className="text-red-600 hover:text-red-800 font-medium text-xs">
                                                Ban User
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-800">
                    <strong>Note:</strong> This is a simplified admin view. In a production environment, you would have more robust role management and moderation queues.
                </div>
            </div>
        </ProtectedPage>
    );
}
