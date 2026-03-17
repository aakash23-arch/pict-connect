"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProtectedPage from "@/components/ProtectedPage";
import { db } from "@/lib/firebase";
import { useUser } from "@/components/UserContext";
import firebase from "firebase/compat/app";
import { CLUBS } from "@/lib/data/clubs";
import { getBatchBadge } from "@/lib/batch-utils";

interface Club {
  id: string;
  name: string;
  description?: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt?: firebase.firestore.Timestamp;
  createdBy: string;
}

export default function ClubDetailPage() {
  const params = useParams<{ id: string }>();
  const clubId = params.id;
  const { user } = useUser();

  const [club, setClub] = useState<Club | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingClub, setLoadingClub] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [isMember, setIsMember] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  // Load club info
  useEffect(() => {
    const staticClub = CLUBS.find((c) => c.id === clubId);
    if (staticClub) {
      setClub(staticClub);
      setLoadingClub(false);
    }

    const unsubscribe = db.collection("clubs").doc(clubId).onSnapshot((doc: firebase.firestore.DocumentSnapshot) => {
      if (doc.exists) {
        // If it exists in DB, prefer DB data (or merge)
        setClub({ id: doc.id, ...(doc.data() as Omit<Club, "id">) });
      } else if (!staticClub) {
        // Only set to null if it's not in static list either
        setClub(null);
      }
      setLoadingClub(false);
    });

    return () => unsubscribe();
  }, [clubId]);

  // Admin check
  useEffect(() => {
    if (!user) return;

    const adminRef = db
      .collection("clubs")
      .doc(clubId)
      .collection("admins")
      .doc(user.email || "");

    const unsubscribe = adminRef.onSnapshot((doc: firebase.firestore.DocumentSnapshot) => {
      setIsAdmin(doc.exists);
    });

    return () => unsubscribe();
  }, [clubId, user]);

  // Member check
  useEffect(() => {
    if (!user) return;

    const memberRef = db
      .collection("clubs")
      .doc(clubId)
      .collection("members")
      .doc(user.email || "");

    const unsubscribe = memberRef.onSnapshot((doc: firebase.firestore.DocumentSnapshot) => {
      setIsMember(doc.exists);
    });

    return () => unsubscribe();
  }, [clubId, user]);

  // Announcements
  useEffect(() => {
    const unsubscribe = db
      .collection("clubs")
      .doc(clubId)
      .collection("announcements")
      .orderBy("createdAt", "desc")
      .onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
        const data: Announcement[] = snapshot.docs.map((doc: firebase.firestore.QueryDocumentSnapshot) => ({
          id: doc.id,
          ...(doc.data() as Omit<Announcement, "id">),
        }));
        setAnnouncements(data);
        setLoadingAnnouncements(false);
      });

    return () => unsubscribe();
  }, [clubId]);

  const handleJoin = async () => {
    if (!user?.email) return;
    setJoining(true);
    try {
      const batch = db.batch();
      const userClubRef = db
        .collection("users")
        .doc(user.email)
        .collection("clubs")
        .doc(clubId);
      const clubMemberRef = db
        .collection("clubs")
        .doc(clubId)
        .collection("members")
        .doc(user.email);

      batch.set(userClubRef, { joinedAt: firebase.firestore.FieldValue.serverTimestamp() });
      batch.set(clubMemberRef, { joinedAt: firebase.firestore.FieldValue.serverTimestamp() });

      await batch.commit();
    } catch (error) {
      console.error("Error joining club", error);
      alert("Could not join club. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!user?.email) return;
    setLeaving(true);
    try {
      const batch = db.batch();
      const userClubRef = db
        .collection("users")
        .doc(user.email)
        .collection("clubs")
        .doc(clubId);
      const clubMemberRef = db
        .collection("clubs")
        .doc(clubId)
        .collection("members")
        .doc(user.email);

      batch.delete(userClubRef);
      batch.delete(clubMemberRef);

      await batch.commit();
    } catch (error) {
      console.error("Error leaving club", error);
      alert("Could not leave club. Please try again.");
    } finally {
      setLeaving(false);
    }
  };

  const handlePostAnnouncement = async () => {
    if (!isAdmin || !user?.email) return;
    if (!title.trim() || !content.trim()) {
      alert("Please provide a title and content.");
      return;
    }

    setPosting(true);
    try {
      await db
        .collection("clubs")
        .doc(clubId)
        .collection("announcements")
        .add({
          title: title.trim(),
          content: content.trim(),
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          createdBy: user.email,
        });

      setTitle("");
      setContent("");
    } catch (error) {
      console.error("Error posting announcement", error);
      alert("Could not post announcement. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <ProtectedPage>
      <div className="space-y-6">
        {loadingClub && <div className="text-sm text-gray-600">Loading club...</div>}
        {!loadingClub && !club && (
          <div className="rounded-md bg-white p-4 text-sm text-gray-600 shadow">
            Club not found. Please check the URL or create a club document in Firestore at{" "}
            <code className="font-mono text-xs">clubs/{clubId}</code>.
          </div>
        )}

        {club && (
          <>
            <div className="flex flex-col justify-between gap-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200 md:flex-row md:items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{club.name}</h1>
                {club.description && (
                  <p className="mt-1 text-sm text-gray-600 max-w-xl">{club.description}</p>
                )}
              </div>
              <div className="flex gap-3">
                {isMember ? (
                  <button
                    onClick={handleLeave}
                    disabled={leaving}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60"
                  >
                    {leaving ? "Leaving..." : "Leave Club"}
                  </button>
                ) : (
                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
                  >
                    {joining ? "Joining..." : "Join Club"}
                  </button>
                )}
              </div>
            </div>

            {isAdmin && (
              <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200">
                <h2 className="mb-2 text-lg font-semibold text-gray-900">Post Announcement</h2>
                <p className="mb-4 text-xs text-gray-500">
                  Only club admins can see this form. Announcements are visible to all students.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      placeholder="E.g. Recruitment drive, workshop, meeting..."
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Content</label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={4}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      placeholder="Share details such as date, time, venue and registration links."
                    />
                  </div>
                  <button
                    onClick={handlePostAnnouncement}
                    disabled={posting}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
                  >
                    {posting ? "Posting..." : "Post announcement"}
                  </button>
                </div>
              </section>
            )}

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">Announcements</h2>
              {loadingAnnouncements && (
                <div className="text-sm text-gray-600">Loading announcements...</div>
              )}
              {!loadingAnnouncements && announcements.length === 0 && (
                <div className="rounded-md bg-white p-4 text-sm text-gray-600 shadow">
                  No announcements yet. Club admins can post updates here.
                </div>
              )}

              <div className="space-y-3">
                {announcements.map((a) => (
                  <article
                    key={a.id}
                    className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200"
                  >
                    <h3 className="text-base font-semibold text-gray-900">{a.title}</h3>
                    <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">{a.content}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <span>Posted by {a.createdBy}</span>
                        {(() => {
                          const badge = getBatchBadge(a.createdBy);
                          if (badge) {
                            return (
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${badge.bgColor} ${badge.color}`}>
                                {badge.label}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      {a.createdAt && (
                        <span>
                          {a.createdAt.toDate().toLocaleDateString()}{" "}
                          {a.createdAt.toDate().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </ProtectedPage>
  );
}
