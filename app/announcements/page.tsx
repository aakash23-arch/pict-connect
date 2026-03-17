"use client";

import { useEffect, useState } from "react";
import ProtectedPage from "../../components/ProtectedPage";
import { db } from "../../lib/firebase";
import firebase from "firebase/compat/app";
import { useUser } from "@/components/UserContext";

interface GlobalAnnouncement {
  id: string;
  clubId: string;
  clubName?: string;
  title: string;
  content: string;
  createdAt?: firebase.firestore.Timestamp;
  createdBy: string;
  category?: string;
}

interface PollOption {
  id: number;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  votedUsers?: string[];
  createdBy: string;
  createdAt?: firebase.firestore.Timestamp;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<GlobalAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Polls State
  const [activeTab, setActiveTab] = useState<"announcements" | "polls">("announcements");
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loadingPolls, setLoadingPolls] = useState(false);
  const [creatingPoll, setCreatingPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  const { user } = useUser();

  const CATEGORIES = ["All", "Academic", "Club Activity", "Exam", "Placement", "Sports", "General"];

  useEffect(() => {
    // Fetch all clubs, then all announcements per club.
    const unsubscribe = db.collection("clubs").onSnapshot(async (clubsSnapshot: firebase.firestore.QuerySnapshot) => {
      const clubDocs = clubsSnapshot.docs;
      if (clubDocs.length === 0) {
        setAnnouncements([]);
        setLoading(false);
        return;
      }

      const allAnnouncements: GlobalAnnouncement[] = [];

      await Promise.all(
        clubDocs.map(async (clubDoc: firebase.firestore.QueryDocumentSnapshot) => {
          const clubId = clubDoc.id;
          const clubName = (clubDoc.data() as { name?: string }).name;

          const annsSnapshot = await clubDoc.ref
            .collection("announcements")
            .orderBy("createdAt", "desc")
            .get();

          annsSnapshot.docs.forEach((aDoc: firebase.firestore.QueryDocumentSnapshot) => {
            const data = aDoc.data() as Omit<GlobalAnnouncement, "id" | "clubId" | "clubName">;
            // Infer category if missing, or default to General
            const inferredCategory = data.title.toLowerCase().includes("exam") ? "Exam" :
              data.title.toLowerCase().includes("hackathon") ? "Club Activity" :
                data.title.toLowerCase().includes("placement") ? "Placement" :
                  data.category || "General";

            allAnnouncements.push({
              id: aDoc.id,
              clubId,
              clubName,
              ...data,
              category: inferredCategory,
            });
          });
        })
      );

      allAnnouncements.sort((a, b) => {
        const at = a.createdAt?.toMillis() ?? 0;
        const bt = b.createdAt?.toMillis() ?? 0;
        return bt - at;
      });

      setAnnouncements(allAnnouncements);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch Polls
  useEffect(() => {
    if (activeTab === "polls") {
      setLoadingPolls(true);
      const unsubscribe = db.collection("polls").orderBy("createdAt", "desc").onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
        const fetchedPolls = snapshot.docs.map((doc: firebase.firestore.QueryDocumentSnapshot) => ({
          id: doc.id,
          ...doc.data()
        })) as Poll[];
        setPolls(fetchedPolls);
        setLoadingPolls(false);
      });
      return () => unsubscribe();
    }
  }, [activeTab]);

  const isNew = (timestamp?: firebase.firestore.Timestamp) => {
    if (!timestamp) return false;
    const now = new Date();
    const date = timestamp.toDate();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 2;
  };

  const filteredAnnouncements = announcements.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || a.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Poll Functions
  const handleVote = async (pollId: string, optionId: number) => {
    if (!user?.email) return;

    const pollRef = db.collection("polls").doc(pollId);

    try {
      await db.runTransaction(async (transaction: firebase.firestore.Transaction) => {
        const doc = await transaction.get(pollRef);
        if (!doc.exists) return;

        const poll = doc.data() as Poll;
        if (poll.votedUsers?.includes(user.email!)) {
          alert("You have already voted!");
          return;
        }

        const newOptions = poll.options.map(opt => {
          if (opt.id === optionId) {
            return { ...opt, votes: opt.votes + 1 };
          }
          return opt;
        });

        transaction.update(pollRef, {
          options: newOptions,
          votedUsers: firebase.firestore.FieldValue.arrayUnion(user.email)
        });
      });
    } catch (e) {
      console.error("Vote failed", e);
      alert("Failed to register vote.");
    }
  };

  const handleCreatePoll = async () => {
    if (!user?.email || !pollQuestion.trim()) return;
    const validOptions = pollOptions.filter(o => o.trim() !== "");
    if (validOptions.length < 2) {
      alert("Please provide at least 2 options.");
      return;
    }

    try {
      await db.collection("polls").add({
        question: pollQuestion,
        options: validOptions.map((text, idx) => ({ id: idx, text, votes: 0 })),
        votedUsers: [],
        createdBy: user.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      setCreatingPoll(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
    } catch (e) {
      console.error("Create poll failed", e);
      alert("Failed to create poll.");
    }
  };

  const addOption = () => {
    setPollOptions([...pollOptions, ""]);
  };

  const updateOption = (index: number, value: string) => {
    const newOpts = [...pollOptions];
    newOpts[index] = value;
    setPollOptions(newOpts);
  };

  return (
    <ProtectedPage>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-500">Announcements & Polls</h1>
            <p className="text-sm text-gray-600">
              Stay updated and participate in campus discussions.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex rounded-lg bg-gray-100 p-1 shadow-inner">
            <button
              onClick={() => setActiveTab("announcements")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${activeTab === "announcements" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Announcements
            </button>
            <button
              onClick={() => setActiveTab("polls")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${activeTab === "polls" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Campus Polls
            </button>
          </div>
        </div>

        {activeTab === "announcements" ? (
          <>
            {/* Search and Filter Controls */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${selectedCategory === cat
                      ? "bg-red-600 text-white shadow-sm"
                      : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {loading && <div className="text-sm text-gray-600">Loading announcements...</div>}

            {!loading && filteredAnnouncements.length === 0 && (
              <div className="rounded-md bg-white p-8 text-center text-gray-500 shadow-sm ring-1 ring-gray-200">
                <p className="font-medium">No announcements found</p>
                <p className="text-xs">Try adjusting your search or filters.</p>
              </div>
            )}

            <div className="space-y-4">
              {filteredAnnouncements.map((a) => (
                <a
                  key={`${a.clubId}_${a.id}`}
                  href={`/clubs/${a.clubId}`}
                  className="group block rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition hover:shadow-md hover:ring-red-100"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-full">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-700">
                          {a.category || "General"}
                        </span>
                        {isNew(a.createdAt) && (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
                            New
                          </span>
                        )}
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                          • {a.clubName || `Club: ${a.clubId}`}
                        </span>
                      </div>

                      <h2 className="mb-1 text-lg font-bold text-gray-900 group-hover:text-red-700 transition-colors">{a.title}</h2>
                      <p className="line-clamp-2 text-sm text-gray-600">{a.content}</p>
                    </div>

                    {a.createdAt && (
                      <div className="text-right">
                        <span className="block whitespace-nowrap text-xs font-medium text-gray-900">
                          {a.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="block text-[10px] text-gray-400">
                          {a.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                    <p className="text-xs font-medium text-gray-500">Posted by {a.createdBy}</p>
                    <span className="text-xs font-medium text-red-600 opacity-0 transition-opacity group-hover:opacity-100">Read more →</span>
                  </div>
                </a>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-6">
            {/* Create Poll Button */}
            {!creatingPoll ? (
              <button
                onClick={() => setCreatingPoll(true)}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-red-400 hover:text-red-600 transition flex items-center justify-center gap-2"
              >
                <span className="text-xl">+</span> Create New Poll
              </button>
            ) : (
              <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
                <h3 className="font-bold text-gray-900">Create a Poll</h3>
                <input
                  type="text"
                  placeholder="Ask a question..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                />
                <div className="space-y-2">
                  {pollOptions.map((opt, idx) => (
                    <input
                      key={idx}
                      type="text"
                      placeholder={`Option ${idx + 1}`}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500"
                      value={opt}
                      onChange={(e) => updateOption(idx, e.target.value)}
                    />
                  ))}
                </div>
                <button onClick={addOption} className="text-xs text-red-600 font-medium hover:underline">+ Add Option</button>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCreatePoll}
                    disabled={!pollQuestion.trim()}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    Post Poll
                  </button>
                  <button
                    onClick={() => setCreatingPoll(false)}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Polls List */}
            {loadingPolls && <div className="text-sm text-gray-600">Loading polls...</div>}

            <div className="grid gap-6 md:grid-cols-2">
              {polls.map(poll => {
                const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes, 0);
                const hasVoted = user?.email && poll.votedUsers?.includes(user?.email);

                return (
                  <div key={poll.id} className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-gray-200">
                    <h3 className="font-bold text-gray-900 mb-4">{poll.question}</h3>
                    <div className="space-y-3">
                      {poll.options.map(opt => {
                        const percent = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
                        return (
                          <div key={opt.id} className="relative">
                            {/* Background Bar */}
                            <div className="absolute top-0 left-0 h-full rounded-md bg-red-50 transition-all duration-500" style={{ width: `${percent}%` }}></div>

                            <button
                              onClick={() => handleVote(poll.id, opt.id)}
                              disabled={!!hasVoted}
                              className={`relative z-10 w-full flex justify-between items-center px-4 py-2 text-sm rounded-md border transition ${hasVoted
                                ? "border-transparent cursor-default"
                                : "border-gray-200 hover:border-red-300 hover:bg-white"
                                }`}
                            >
                              <span className="font-medium text-gray-800">{opt.text}</span>
                              <span className="text-xs font-bold text-gray-500">{percent}% ({opt.votes})</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-4 text-xs text-gray-400 text-right">
                      {totalVotes} votes • Created by {poll.createdBy}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}

