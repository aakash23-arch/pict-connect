"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import ProtectedPage from "../../../components/ProtectedPage";
import { db } from "../../../lib/firebase";
import { useUser } from "../../../components/UserContext";
import firebase from "firebase/compat/app";
import { getBatchBadge } from "@/lib/batch-utils";
import { toast } from "sonner";

interface Message {
  id: string;
  sender: string;
  receiver: string;
  text: string;
  timestamp?: firebase.firestore.Timestamp;
}

export default function ChatPage() {
  const params = useParams<{ chatId: string }>();
  const chatId = params.chatId;
  const { user } = useUser();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [otherEmail, setOtherEmail] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!user?.email) return;

    const chatRef = db.collection("chats").doc(chatId);
    chatRef.get().then((doc: firebase.firestore.DocumentSnapshot) => {
      if (doc.exists) {
        const participants = (doc.data() as { participants?: string[] }).participants || [];
        const other = participants.find((p) => p !== user.email) || null;
        setOtherEmail(other);
      }
    });
  }, [chatId, user]);

  useEffect(() => {
    const messagesRef = db
      .collection("chats")
      .doc(chatId)
      .collection("messages")
      .orderBy("timestamp", "asc");

    const unsubscribe = messagesRef.onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
      const data: Message[] = snapshot.docs.map((doc: firebase.firestore.QueryDocumentSnapshot) => ({
        id: doc.id,
        ...(doc.data() as Omit<Message, "id">),
      }));
      setMessages(data);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSend = async () => {
    if (!user?.email || !otherEmail || !text.trim()) return;

    setSending(true);
    try {
      const msgRef = db
        .collection("chats")
        .doc(chatId)
        .collection("messages")
        .doc();

      await msgRef.set({
        sender: user.email,
        receiver: otherEmail,
        text: text.trim(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });

      const lastData = {
        lastMessage: text.trim(),
        lastTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
      };

      const batch = db.batch();
      const userInboxRef = db
        .collection("users")
        .doc(user.email)
        .collection("chats")
        .doc(chatId);
      const otherInboxRef = db
        .collection("users")
        .doc(otherEmail)
        .collection("chats")
        .doc(chatId);
      batch.set(userInboxRef, lastData, { merge: true });
      batch.set(otherInboxRef, lastData, { merge: true });
      await batch.commit();

      setText("");
    } catch (error) {
      console.error("Error sending message", error);
      toast.error("Could not send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <ProtectedPage>
      <div className="flex h-[70vh] flex-col rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-gray-900">
                Chat with {otherEmail || "..."}
              </h1>
              {(() => {
                const badge = getBatchBadge(otherEmail || undefined);
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
            <p className="text-[11px] text-gray-500">
              One-to-one internal messaging. Please keep conversations professional.
            </p>
          </div>
        </header>

        <div className="flex-1 space-y-2 overflow-y-auto bg-gray-50 px-3 py-3 text-sm">
          {messages.map((m) => {
            const isMine = m.sender === user?.email;
            return (
              <div
                key={m.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 ${isMine ? "bg-red-600 text-white" : "bg-white text-gray-900 shadow-sm"
                    }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                  <p className="mt-1 text-[10px] opacity-80">
                    {m.timestamp
                      ? m.timestamp
                        .toDate()
                        .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "Sending..."}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="border-t px-3 py-2">
          <div className="flex gap-2">
            <textarea
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              className="max-h-32 flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
            <button
              onClick={handleSend}
              disabled={sending || !text.trim()}
              className="self-end rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}

