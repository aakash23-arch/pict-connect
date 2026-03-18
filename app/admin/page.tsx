"use client";

import { useEffect, useState } from "react";
import ProtectedPage from "../../components/ProtectedPage";
import { db } from "../../lib/firebase";
import { useUser } from "../../components/UserContext";
import firebase from "firebase/compat/app";
import { toast } from "sonner";

interface UserData {
    email: string;
    role?: string;
    createdAt?: firebase.firestore.Timestamp;
}

export default function AdminPage() {
    const { user, profile } = useUser();
    const [isAdmin, setIsAdmin] = useState(false);
    const [users, setUsers] = useState<UserData[]>([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalPosts: 0,
        totalEvents: 0,
    });
    const [loading, setLoading] = useState(true);

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
            setUsers(usersData.slice(0, 50));

            setLoading(false);
        } catch (error) {
            console.error("Error fetching admin data", error);
            toast.error("Failed to fetch admin data");
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user?.email || !profile) return;

        if (profile.role === "admin") {
            setIsAdmin(true);
            fetchData();
        } else {
            setLoading(false);
        }
    }, [user, profile]);

    const handleRoleChange = async (email: string, newRole: string) => {
        try {
            await db.collection("users").doc(email).update({ role: newRole });
            setUsers(users.map(u => u.email === email ? { ...u, role: newRole } : u));
            toast.success(`Role updated to ${newRole} for ${email}`);
        } catch (error) {
            console.error("Error updating role", error);
            toast.error("Failed to update role");
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

                <div className="rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
                    <div className="border-b px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Users (Roles)</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Email</th>
                                    <th className="px-6 py-3 font-medium">Joined</th>
                                    <th className="px-6 py-3 font-medium">Role</th>
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
                                            <select
                                                value={u.role || "student"}
                                                onChange={(e) => handleRoleChange(u.email, e.target.value)}
                                                className="rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-red-500"
                                            >
                                                <option value="student">Student</option>
                                                <option value="cr">CR</option>
                                                <option value="organizer">Organizer</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </ProtectedPage>
    );
}
