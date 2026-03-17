"use client";

import { useEffect, useState } from "react";
import ProtectedPage from "../../components/ProtectedPage";
import { db } from "../../lib/firebase";
import { useUser } from "../../components/UserContext";
import firebase from "firebase/compat/app";
import PostCard, { Post } from "../../components/PostCard";

const TAGS = ["General", "Doubt", "LostFound", "News", "Confession"];

export default function FeedPage() {
    const { user, profile } = useUser();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    // New Post State
    const [content, setContent] = useState("");
    const [selectedTag, setSelectedTag] = useState("General");
    const [posting, setPosting] = useState(false);

    useEffect(() => {
        const unsubscribe = db
            .collection("posts")
            .orderBy("createdAt", "desc")
            .onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
                const data = snapshot.docs.map((doc: firebase.firestore.QueryDocumentSnapshot) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Post[];
                setPosts(data);
                setLoading(false);
            });

        return () => unsubscribe();
    }, []);

    const handleCreatePost = async () => {
        if (!user?.email || !content.trim()) return;

        setPosting(true);
        try {
            const newPost = {
                content: content.trim(),
                authorEmail: user.email,
                authorName: profile?.displayName || user.email.split("@")[0],
                tags: [selectedTag],
                likes: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            };

            await db.collection("posts").add(newPost);
            setContent("");
            setSelectedTag("General");
        } catch (error) {
            console.error("Error creating post", error);
            alert("Failed to create post.");
        } finally {
            setPosting(false);
        }
    };

    return (
        <ProtectedPage>
            <div className="mx-auto max-w-2xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-500">Community Feed</h1>
                    <p className="text-sm text-gray-600">
                        Share news, ask doubts, or discuss campus life.
                    </p>
                </div>

                {/* Create Post Widget */}
                <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's on your mind?"
                        rows={3}
                        className="w-full resize-none rounded-md border border-gray-300 p-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                    <div className="mt-3 flex items-center justify-between">
                        <select
                            value={selectedTag}
                            onChange={(e) => setSelectedTag(e.target.value)}
                            className="rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-red-500"
                        >
                            {TAGS.map((tag) => (
                                <option key={tag} value={tag}>
                                    #{tag}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleCreatePost}
                            disabled={posting || !content.trim()}
                            className="rounded-md bg-red-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
                        >
                            {posting ? "Posting..." : "Post"}
                        </button>
                    </div>
                </div>

                {/* Feed */}
                <div className="space-y-4">
                    {loading && <p className="text-center text-sm text-gray-500">Loading feed...</p>}

                    {!loading && posts.length === 0 && (
                        <div className="rounded-lg bg-gray-50 p-8 text-center text-gray-500">
                            No posts yet. Be the first to share something!
                        </div>
                    )}

                    {posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            </div>
        </ProtectedPage>
    );
}
