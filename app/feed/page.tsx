"use client";

import { useEffect, useState } from "react";
import ProtectedPage from "../../components/ProtectedPage";
import { db } from "../../lib/firebase";
import { useUser } from "../../components/UserContext";
import firebase from "firebase/compat/app";
import PostCard, { Post } from "../../components/PostCard";
import { toast } from "sonner";
import { MessageSquareText } from "lucide-react";

const TAGS = ["General", "Doubt", "LostFound", "News", "Confession"];

export default function FeedPage() {
    const { user, profile } = useUser();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastDoc, setLastDoc] = useState<firebase.firestore.QueryDocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [activeFilterTag, setActiveFilterTag] = useState("All");

    // New Post State
    const [content, setContent] = useState("");
    const [selectedTag, setSelectedTag] = useState("General");
    const [posting, setPosting] = useState(false);

    useEffect(() => {
        const unsubscribe = db
            .collection("posts")
            .orderBy("createdAt", "desc")
            .limit(20)
            .onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
                const data = snapshot.docs.map((doc: firebase.firestore.QueryDocumentSnapshot) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Post[];
                setPosts(data);
                if (snapshot.docs.length > 0) {
                    setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
                }
                setHasMore(snapshot.docs.length === 20);
                setLoading(false);
            }, (error: Error) => {
                console.error("Error fetching feed", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, []);

    const loadMore = async () => {
        if (!lastDoc) return;
        try {
            const snapshot = await db
                .collection("posts")
                .orderBy("createdAt", "desc")
                .startAfter(lastDoc)
                .limit(20)
                .get();

            const morePosts = snapshot.docs.map((doc: firebase.firestore.QueryDocumentSnapshot) => ({
                id: doc.id,
                ...doc.data(),
            })) as Post[];

            setPosts(prev => {
                // Prevent duplicates by checking IDs
                const prevIds = new Set(prev.map(p => p.id));
                const uniqueNew = morePosts.filter(p => !prevIds.has(p.id));
                return [...prev, ...uniqueNew];
            });

            if (snapshot.docs.length > 0) {
                setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            }
            setHasMore(snapshot.docs.length === 20);
        } catch (error) {
            console.error("Error loading more posts", error);
            toast.error("Failed to load more posts");
        }
    };

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
            toast.success("Posted successfully!");
        } catch (error) {
            console.error("Error creating post", error);
            toast.error("Failed to create post.");
        } finally {
            setPosting(false);
        }
    };

    const filteredPosts = activeFilterTag === "All" 
        ? posts 
        : posts.filter(post => post.tags?.includes(activeFilterTag));

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

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-2 py-2">
                    <button
                        onClick={() => setActiveFilterTag("All")}
                        className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                            activeFilterTag === "All" 
                            ? "bg-red-600 text-white shadow-sm" 
                            : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
                        }`}
                    >
                        All
                    </button>
                    {TAGS.map(tag => (
                        <button
                            key={tag}
                            onClick={() => setActiveFilterTag(tag)}
                            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                                activeFilterTag === tag 
                                ? "bg-red-600 text-white shadow-sm" 
                                : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
                            }`}
                        >
                            #{tag}
                        </button>
                    ))}
                </div>

                {/* Feed */}
                <div className="space-y-4">
                    {loading && <p className="text-center text-sm text-gray-500">Loading feed...</p>}

                    {!loading && filteredPosts.length === 0 && (
                        <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 p-12 text-center text-gray-500">
                            <MessageSquareText size={48} className="mb-4 text-gray-400" />
                            <p className="font-medium text-gray-600">No posts yet. Be the first to share something!</p>
                        </div>
                    )}

                    {filteredPosts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                    
                    {!loading && hasMore && filteredPosts.length > 0 && (
                        <div className="pt-4 text-center">
                            <button
                                onClick={loadMore}
                                className="rounded bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
                            >
                                Load More
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedPage>
    );
}
