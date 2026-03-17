"use client";

import { useState } from "react";
import { useUser } from "./UserContext";
import { db } from "@/lib/firebase";
import firebase from "firebase/compat/app";
import { getBatchBadge } from "@/lib/batch-utils";

export interface Comment {
    text: string;
    author: string;
    createdAt: firebase.firestore.Timestamp;
}

export interface Post {
    id: string;
    content: string;
    authorEmail: string;
    authorName: string;
    tags: string[];
    likes: string[];
    createdAt: firebase.firestore.Timestamp;
    comments?: Comment[]; // Optional, might be fetched separately
}

interface PostCardProps {
    post: Post;
}

export default function PostCard({ post }: PostCardProps) {
    const { user } = useUser();
    const [likes, setLikes] = useState<string[]>(post.likes || []);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);

    const isLiked = user?.email ? likes.includes(user.email) : false;

    const handleLike = async () => {
        if (!user?.email) return;

        const postRef = db.collection("posts").doc(post.id);
        let newLikes = [...likes];

        if (isLiked) {
            newLikes = newLikes.filter((email) => email !== user.email);
        } else {
            newLikes.push(user.email);
        }

        setLikes(newLikes); // Optimistic update

        try {
            await postRef.update({
                likes: newLikes,
            });
        } catch (error) {
            console.error("Error updating like", error);
            setLikes(likes); // Revert on error
        }
    };

    const loadComments = async () => {
        if (showComments) {
            setShowComments(false);
            return;
        }

        setLoadingComments(true);
        setShowComments(true);

        try {
            const snapshot = await db
                .collection("posts")
                .doc(post.id)
                .collection("comments")
                .orderBy("createdAt", "asc")
                .get();

            const loadedComments = snapshot.docs.map(
                (doc: firebase.firestore.QueryDocumentSnapshot) => doc.data() as Comment
            );
            setComments(loadedComments);
        } catch (error) {
            console.error("Error loading comments", error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleAddComment = async () => {
        if (!user?.email || !newComment.trim()) return;

        const commentData: Comment = {
            text: newComment.trim(),
            author: user.email,
            createdAt: firebase.firestore.Timestamp.now(),
        };

        try {
            await db
                .collection("posts")
                .doc(post.id)
                .collection("comments")
                .add(commentData);

            setComments([...comments, commentData]);
            setNewComment("");
        } catch (error) {
            console.error("Error adding comment", error);
            alert("Failed to add comment.");
        }
    };

    return (
        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200">
            <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">
                        {post.authorName ? post.authorName[0].toUpperCase() : "U"}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900">
                                {post.authorName || post.authorEmail}
                            </p>
                            {(() => {
                                const badge = getBatchBadge(post.authorEmail);
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
                        <p className="text-xs text-gray-500">
                            {post.createdAt?.toDate().toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex gap-1">
                    {post.tags?.map((tag) => (
                        <span
                            key={tag}
                            className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>

            <p className="mb-4 text-sm text-gray-800 whitespace-pre-wrap">{post.content}</p>

            <div className="flex items-center gap-4 border-t pt-3">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-1 text-xs font-medium ${isLiked ? "text-red-600" : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    {isLiked ? "❤️" : "🤍"} {likes.length} Likes
                </button>
                <button
                    onClick={loadComments}
                    className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700"
                >
                    💬 Comments
                </button>
            </div>

            {showComments && (
                <div className="mt-4 space-y-3 border-t pt-3">
                    {loadingComments ? (
                        <p className="text-xs text-gray-500">Loading comments...</p>
                    ) : (
                        <div className="space-y-2">
                            {comments.map((comment, idx) => (
                                <div key={idx} className="rounded bg-gray-50 p-2 text-xs">
                                    <p className="font-semibold text-gray-700">{comment.author}</p>
                                    <p className="text-gray-600">{comment.text}</p>
                                </div>
                            ))}
                            {comments.length === 0 && (
                                <p className="text-xs text-gray-500">No comments yet.</p>
                            )}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:border-red-500"
                        />
                        <button
                            onClick={handleAddComment}
                            disabled={!newComment.trim()}
                            className="rounded bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-black disabled:opacity-50"
                        >
                            Post
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
