"use client";

import { useEffect, useState } from "react";
import ProtectedPage from "../../components/ProtectedPage";
import { db } from "../../lib/firebase";
import { useUser } from "../../components/UserContext";
import firebase from "firebase/compat/app";
import { toast } from "sonner";
import { MessageSquareOff } from "lucide-react";
import Link from "next/link";

interface ChatSummary {
  chatId: string;
  otherEmail: string;
  lastMessage?: string;
  lastTimestamp?: firebase.firestore.Timestamp;
}

export default function InboxPage() {
  const { user } = useUser();
  const [inbox, setInbox] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [newChatEmail, setNewChatEmail] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user?.email) return;

    const inboxRef = db
      .collection("users")
      .doc(user.email)
      .collection("chats")
      .orderBy("lastTimestamp", "desc");

    const unsubscribe = inboxRef.onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
      const data: ChatSummary[] = snapshot.docs.map((doc: firebase.firestore.QueryDocumentSnapshot) => ({
        chatId: doc.id,
        ...(doc.data() as Omit<ChatSummary, "chatId">),
      }));
      setInbox(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleStartChat = async () => {
    if (!user?.email || !newChatEmail.trim()) return;

    const email = newChatEmail.trim().toLowerCase();
    if (!email.endsWith("@ms.pict.edu")) {
      toast.error("You can only message other @ms.pict.edu addresses.");
      return;
    }

    if (email === user.email) {
      toast.error("You cannot start a chat with yourself.");
      return;
    }

    setCreating(true);
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

      const userInboxRef = db
        .collection("users")
        .doc(user.email)
        .collection("chats")
        .doc(chatId);
      const otherInboxRef = db
        .collection("users")
        .doc(email)
        .collection("chats")
        .doc(chatId);

      const batch = db.batch();
      batch.set(
        userInboxRef,
        {
          otherEmail: email,
        },
        { merge: true }
      );
      batch.set(
        otherInboxRef,
        {
          otherEmail: user.email,
        },
        { merge: true }
      );
      await batch.commit();

      window.location.href = `/chat/${chatId}`;
    } catch (error) {
      console.error("Error starting chat", error);
      toast.error("Could not start chat. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <ProtectedPage>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-blue-700 dark:text-blue-500">Inbox</h1>
        <p className="text-sm text-gray-600">
          One-to-one messages between PICT students. No media, just clean text conversations.
        </p>

        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-2 text-sm font-semibold text-gray-900">Start a new chat</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              value={newChatEmail}
              onChange={(e) => setNewChatEmail(e.target.value)}
              placeholder="student@ms.pict.edu"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
            <button
              onClick={handleStartChat}
              disabled={creating}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
            >
              {creating ? "Starting..." : "Start chat"}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Only official PICT email IDs are allowed.
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-900">Recent chats</h2>

          {loading && <div className="text-sm text-gray-600">Loading inbox...</div>}

          {!loading && inbox.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 p-12 text-center text-gray-500">
              <MessageSquareOff size={48} className="mb-4 text-gray-400" />
              <p className="font-medium text-gray-600">No conversations yet.</p>
              <p className="text-sm">Start a new chat with a PICT email above.</p>
            </div>
          )}

          <div className="space-y-2">
            {inbox.map((c) => (
              <Link
                key={c.chatId}
                href={`/chat/${c.chatId}`}
                className="block rounded-lg bg-white p-3 text-sm shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{c.otherEmail}</p>
                    {c.lastMessage && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-gray-600">
                        {c.lastMessage}
                      </p>
                    )}
                  </div>
                  {c.lastTimestamp && (
                    <span className="whitespace-nowrap text-[11px] text-gray-500">
                      {c.lastTimestamp.toDate().toLocaleDateString()}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </ProtectedPage>
  );
}

