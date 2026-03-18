"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedPage from "../../../components/ProtectedPage";
import { db } from "../../../lib/firebase";
import { useUser, UserProfile } from "../../../components/UserContext";
import firebase from "firebase/compat/app";
import { toast } from "sonner";

export default function OtherUserProfilePage() {
    const params = useParams<{ email: string }>();
    const router = useRouter();
    const { user } = useUser();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [startingChat, setStartingChat] = useState(false);

    const email = decodeURIComponent(params.email || "");

    useEffect(() => {
        if (!email) return;

        const fetchProfile = async () => {
            try {
                const doc = await db.collection("users").doc(email).get();
                if (doc.exists) {
                    setProfile(doc.data() as UserProfile);
                }
            } catch (error) {
                console.error("Error fetching profile", error);
                toast.error("Failed to load profile.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [email]);

    const handleMessage = async () => {
        if (!user?.email || !email) return;
        if (user.email === email) {
            router.push("/profile");
            return;
        }

        setStartingChat(true);
        try {
            const participants = [user.email, email].sort();
            const chatId = participants.join("__");

            const chatRef = db.collection("chats").doc(chatId);
            const chatDoc = await chatRef.get();

            if (!chatDoc.exists) {
                await chatRef.set({
                    participants,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                });
            }

            const batch = db.batch();
            batch.set(
                db.collection("users").doc(user.email).collection("chats").doc(chatId),
                { otherEmail: email },
                { merge: true }
            );
            batch.set(
                db.collection("users").doc(email).collection("chats").doc(chatId),
                { otherEmail: user.email },
                { merge: true }
            );
            await batch.commit();

            router.push(`/chat/${chatId}`);
        } catch (error) {
            console.error("Error starting chat", error);
            toast.error("Could not start chat.");
        } finally {
            setStartingChat(false);
        }
    };

    if (loading) {
        return (
            <ProtectedPage>
                <div className="flex h-64 items-center justify-center">
                    <p className="text-gray-500">Loading profile...</p>
                </div>
            </ProtectedPage>
        );
    }

    if (!profile) {
        return (
            <ProtectedPage>
                <div className="flex h-64 items-center justify-center flex-col gap-4">
                    <p className="text-gray-500">User profile not found.</p>
                    <button onClick={() => router.back()} className="text-red-600 hover:underline">
                        Go Back
                    </button>
                </div>
            </ProtectedPage>
        );
    }

    return (
        <ProtectedPage>
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-500">
                            {profile.displayName || email.split("@")[0]}
                        </h1>
                        <p className="text-sm text-gray-500">{email}</p>
                    </div>
                    {user?.email !== email && (
                        <button
                            onClick={handleMessage}
                            disabled={startingChat}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                            {startingChat ? "Opening Chat..." : "Message"}
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow ring-1 ring-gray-200 p-6 space-y-6">
                    {/* Basic Info */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Academic Information</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-medium text-gray-500 text-xs uppercase tracking-wider">Branch</p>
                                <p className="font-medium text-gray-900 mt-1">{profile.branch || "Not specified"}</p>
                            </div>

                            <div>
                                <p className="font-medium text-gray-500 text-xs uppercase tracking-wider">Current Year</p>
                                <p className="font-medium text-gray-900 mt-1">{profile.year || "Not specified"}</p>
                            </div>

                            <div>
                                <p className="font-medium text-gray-500 text-xs uppercase tracking-wider">Division</p>
                                <p className="font-medium text-gray-900 mt-1">{profile.division || "Not specified"}</p>
                            </div>

                            {user?.email === email && (
                                <>
                                    <div>
                                        <p className="font-medium text-gray-500 text-xs uppercase tracking-wider">Roll No.</p>
                                        <p className="font-medium text-gray-900 mt-1">{profile.rollNo || "Not specified"}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-500 text-xs uppercase tracking-wider">Enrollment No.</p>
                                        <p className="font-medium text-gray-900 mt-1">{profile.enrollmentNo || "Not specified"}</p>
                                    </div>
                                </>
                            )}
                            
                            <div>
                                <p className="font-medium text-gray-500 text-xs uppercase tracking-wider">Role</p>
                                <p className="font-medium text-gray-900 mt-1 capitalize">{profile.role || "Student"}</p>
                            </div>
                        </div>
                    </section>

                    {/* Personal Info */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Personal Details</h2>

                        <div className="space-y-4 text-sm">
                            <div>
                                <p className="font-medium text-gray-500 text-xs uppercase tracking-wider">Skills</p>
                                <p className="font-medium text-gray-900 mt-1">{profile.skills || "Not specified"}</p>
                            </div>

                            <div>
                                <p className="font-medium text-gray-500 text-xs uppercase tracking-wider">Interests</p>
                                <p className="font-medium text-gray-900 mt-1">{profile.interests || "Not specified"}</p>
                            </div>

                            <div>
                                <p className="font-medium text-gray-500 text-xs uppercase tracking-wider">Achievements</p>
                                <p className="font-medium text-gray-900 mt-1 whitespace-pre-wrap">{profile.achievements || "Not specified"}</p>
                            </div>

                            <div>
                                <p className="font-medium text-gray-500 text-xs uppercase tracking-wider">Relationship Status</p>
                                <p className="font-medium text-gray-900 mt-1">{profile.relationshipStatus || "Not specified"}</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </ProtectedPage>
    );
}
