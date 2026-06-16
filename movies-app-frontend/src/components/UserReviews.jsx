import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { FaEdit, FaHeart, FaRegHeart, FaStar, FaTrash } from "react-icons/fa";
import { FiMessageSquare } from "react-icons/fi";
import Pagination from "@/components/Pagination";
import { useAuth } from "@/components/context/AuthContext";
import { createMediaReview, deleteReview, getMediaReviews, toggleReviewLike, updateReview } from "@/api/reviews";
import { Avatar, formatDate, getRatingColor, ReviewSkeleton } from "@/utils/reviewHelper";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const PAGE_SIZE = 6;
const COLLAPSED_LINES = 4;

const SORT_OPTS = [
    { value: "highest", label: "Best" },
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
];

const normalizeMediaType = (mediaType) => {
    if (mediaType === "MOVIE") return "movie";
    if (mediaType === "ANIME") return "anime";
    return "tv";
};

const updateReviewTree = (reviews, reviewId, updater) => reviews.map((review) => {
    if (review.id === reviewId) {
        return updater(review);
    }

    if (!review.replies?.length) {
        return review;
    }

    return {
        ...review,
        replies: updateReviewTree(review.replies, reviewId, updater),
    };
});

function ReviewComposer({
    username,
    submitting,
    onSubmit,
    onCancel,
    placeholder,
    submitLabel,
    showRating = false,
    compact = false,
}) {
    const [text, setText] = useState("");
    const [rating, setRating] = useState(8);
    const textareaRef = useRef(null);

    useEffect(() => {
        if (compact) {
            textareaRef.current?.focus();
        }
    }, [compact]);

    const handleSubmit = () => {
        const trimmed = text.trim();
        if (!trimmed || submitting) return;

        onSubmit({
            content: trimmed,
            rating: showRating ? rating : null,
        });
        setText("");
        setRating(8);
    };

    const handleKeyDown = (event) => {
        if (event.key === "Escape" && onCancel) {
            onCancel();
        }
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            handleSubmit();
        }
    };

    return (
        <div className={`rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 ${compact ? "p-3" : "p-4 sm:p-5"}`}>
            {username && (
                <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
                    Posting as <span className="font-semibold text-black dark:text-white">{username}</span>
                </p>
            )}

            <textarea
                ref={textareaRef}
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={compact ? 3 : 4}
                placeholder={placeholder}
                className="w-full resize-none rounded-xl border border-zinc-200 bg-transparent px-3 py-3 text-sm text-black outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:text-white dark:focus:border-zinc-500"
            />

            <div className={`mt-3 flex ${compact ? "flex-col gap-3" : "flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"}`}>
                {showRating ? (
                    <label className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        Rating
                        <select
                            value={rating}
                            onChange={(event) => setRating(Number(event.target.value))}
                            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm text-black outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                        >
                            {Array.from({ length: 10 }).map((_, index) => (
                                <option key={index + 1} value={index + 1}>
                                    {index + 1}/10
                                </option>
                            ))}
                        </select>
                    </label>
                ) : (
                    <div className="text-xs text-zinc-400 dark:text-zinc-500">
                        Replies keep the thread focused, so they do not carry a separate rating.
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-2">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!text.trim() || submitting}
                        className="rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/85"
                    >
                        {submitting ? "Saving..." : submitLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

function EditReviewDialog({ review, open, saving, onOpenChange, onSave }) {
    const [text, setText] = useState("");
    const [rating, setRating] = useState(8);
    const isReply = review?.parentReviewId != null;

    useEffect(() => {
        if (!review) return;
        setText(review.content || "");
        setRating(review.rating || 8);
    }, [review]);

    const handleSave = () => {
        if (!review || !text.trim()) return;
        onSave({
            content: text.trim(),
            rating: isReply ? null : rating,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{isReply ? "Edit Reply" : "Edit Review"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <Textarea
                        value={text}
                        onChange={(event) => setText(event.target.value)}
                        rows={6}
                        placeholder={isReply ? "Update your reply..." : "Update your review..."}
                        className="min-h-[150px] resize-none"
                    />

                    {!isReply && (
                        <label className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                            Rating
                            <select
                                value={rating}
                                onChange={(event) => setRating(Number(event.target.value))}
                                className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm text-black outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                            >
                                {Array.from({ length: 10 }).map((_, index) => (
                                    <option key={index + 1} value={index + 1}>
                                        {index + 1}/10
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!text.trim() || saving}
                            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/85"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ReviewNode({
    review,
    depth = 0,
    isAuthenticated,
    pendingLikeId,
    replyingToId,
    pendingReplyParentId,
    deletingReviewId,
    onToggleLike,
    onReplySubmit,
    onReplyToggle,
    onEditRequest,
    onDelete,
}) {
    const [expanded, setExpanded] = useState(false);
    const [overflows, setOverflows] = useState(false);
    const contentRef = useRef(null);
    const authorName = review.author?.fullName || review.author?.username || "Anonymous";
    const handleReplyClick = () => {
        if (!isAuthenticated) {
            toast.error("Please log in to reply.");
            return;
        }
        onReplyToggle(replyingToId === review.id ? null : review.id);
    };

    useEffect(() => {
        const element = contentRef.current;
        if (!element) return;

        const lineHeight = parseFloat(getComputedStyle(element).lineHeight) || 20;
        setOverflows(element.scrollHeight > lineHeight * COLLAPSED_LINES + 4);
    }, [review.content]);

    return (
        <div className={`${depth > 0 ? "ml-4 border-l border-zinc-200 pl-4 dark:border-zinc-800 sm:ml-6 sm:pl-5" : ""}`}>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
                <div className="flex gap-3">
                    <Avatar avatarPath={review.author?.avatarUrl} username={authorName} size={depth > 0 ? "sm" : "md"} />

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-black dark:text-white">{authorName}</span>
                            {review.author?.username && (
                                <span className="text-xs text-zinc-400 dark:text-zinc-500">@{review.author.username}</span>
                            )}
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">{formatDate(review.createdAt)}</span>
                            {review.rating != null && (
                                <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${getRatingColor(review.rating)}`}>
                                    <FaStar size={8} />
                                    {review.rating}/10
                                </span>
                            )}
                        </div>

                        <p
                            ref={contentRef}
                            className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-300"
                            style={!expanded ? {
                                WebkitLineClamp: COLLAPSED_LINES,
                                display: "-webkit-box",
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                            } : {}}
                        >
                            {review.content}
                        </p>

                        {overflows && (
                            <button
                                type="button"
                                onClick={() => setExpanded((value) => !value)}
                                className="mt-1 text-xs font-semibold text-zinc-500 transition hover:text-black dark:text-zinc-400 dark:hover:text-white"
                            >
                                {expanded ? "Show less" : "Read more"}
                            </button>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-4">
                            <button
                                type="button"
                                disabled={pendingLikeId === review.id}
                                onClick={() => onToggleLike(review.id)}
                                className={`inline-flex items-center gap-1.5 text-xs font-medium transition ${review.likedByCurrentUser ? "text-rose-500" : "text-zinc-500 hover:text-rose-500 dark:text-zinc-400"}`}
                            >
                                {review.likedByCurrentUser ? <FaHeart size={12} /> : <FaRegHeart size={12} />}
                                <span>{review.likeCount}</span>
                                <span>Like</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleReplyClick}
                                className={`inline-flex items-center gap-1.5 text-xs font-medium transition ${replyingToId === review.id ? "text-black dark:text-white" : "text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white"}`}
                            >
                                <FiMessageSquare size={12} />
                                <span>Reply</span>
                            </button>

                            {review.editableByCurrentUser && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => onEditRequest(review)}
                                        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-black dark:text-zinc-400 dark:hover:text-white"
                                    >
                                        <FaEdit size={11} />
                                        <span>Edit</span>
                                    </button>

                                    <button
                                        type="button"
                                        disabled={deletingReviewId === review.id}
                                        onClick={() => onDelete(review)}
                                        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-400 dark:hover:text-red-400"
                                    >
                                        <FaTrash size={11} />
                                        <span>{deletingReviewId === review.id ? "Deleting..." : "Delete"}</span>
                                    </button>
                                </>
                            )}
                        </div>

                        {replyingToId === review.id && (
                            <div className="mt-4">
                                <ReviewComposer
                                    username={null}
                                    submitting={pendingReplyParentId === review.id}
                                    onSubmit={(payload) => onReplySubmit(review.id, payload)}
                                    onCancel={() => onReplyToggle(null)}
                                    placeholder={`Reply to ${authorName}...`}
                                    submitLabel="Reply"
                                    compact
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {review.replies?.length > 0 && (
                <div className="mt-3 space-y-3">
                    {review.replies.map((reply) => (
                        <ReviewNode
                            key={reply.id}
                            review={reply}
                            depth={depth + 1}
                            isAuthenticated={isAuthenticated}
                            pendingLikeId={pendingLikeId}
                            replyingToId={replyingToId}
                            pendingReplyParentId={pendingReplyParentId}
                            deletingReviewId={deletingReviewId}
                            onToggleLike={onToggleLike}
                            onReplySubmit={onReplySubmit}
                            onReplyToggle={onReplyToggle}
                            onEditRequest={onEditRequest}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function UserReviews({ mediaType }) {
    const { id } = useParams();
    const { user, fullName, isAuthenticated } = useAuth();

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState("highest");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [pendingReplyParentId, setPendingReplyParentId] = useState(null);
    const [pendingLikeId, setPendingLikeId] = useState(null);
    const [replyingToId, setReplyingToId] = useState(null);
    const [editingReview, setEditingReview] = useState(null);
    const [savingEdit, setSavingEdit] = useState(false);
    const [deletingReviewId, setDeletingReviewId] = useState(null);

    const normalizedMediaType = useMemo(() => normalizeMediaType(mediaType), [mediaType]);

    const fetchReviews = useCallback(async () => {
        if (!id) return;

        setLoading(true);
        setError(false);
        try {
            const response = await getMediaReviews(normalizedMediaType, id);
            setReviews(response.data ?? []);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [id, normalizedMediaType]);

    useEffect(() => {
        setPage(1);
        setReplyingToId(null);
        fetchReviews();
    }, [fetchReviews]);

    useEffect(() => {
        setPage(1);
    }, [sortBy]);

    const sortedReviews = useMemo(() => {
        const nextReviews = [...reviews];

        if (sortBy === "highest") {
            return nextReviews.sort((left, right) => (right.rating ?? 0) - (left.rating ?? 0)
                || new Date(right.createdAt) - new Date(left.createdAt));
        }
        if (sortBy === "oldest") {
            return nextReviews.sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
        }
        return nextReviews.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
    }, [reviews, sortBy]);

    const totalPages = Math.ceil(sortedReviews.length / PAGE_SIZE);
    const pageStart = (page - 1) * PAGE_SIZE;
    const pageReviews = sortedReviews.slice(pageStart, pageStart + PAGE_SIZE);
    const ratedReviews = reviews.filter((review) => review.rating != null);
    const averageRating = ratedReviews.length
        ? (ratedReviews.reduce((sum, review) => sum + review.rating, 0) / ratedReviews.length).toFixed(1)
        : null;

    const handleCreateReview = async (payload) => {
        if (!isAuthenticated) {
            toast.error("Please log in to write a review.");
            return;
        }

        setSubmittingReview(true);
        try {
            await createMediaReview(normalizedMediaType, id, payload);
            await fetchReviews();
            toast.success("Review posted.");
        } catch (error) {
            toast.error(error.response?.data?.message || "Could not post the review.");
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleReplySubmit = async (parentReviewId, payload) => {
        setPendingReplyParentId(parentReviewId);
        try {
            await createMediaReview(normalizedMediaType, id, {
                content: payload.content,
                parentReviewId,
            });
            setReplyingToId(null);
            await fetchReviews();
            toast.success("Reply posted.");
        } catch (error) {
            toast.error(error.response?.data?.message || "Could not post the reply.");
        } finally {
            setPendingReplyParentId(null);
        }
    };

    const handleToggleLike = async (reviewId) => {
        if (!isAuthenticated) {
            toast.error("Please log in to like reviews.");
            return;
        }

        setPendingLikeId(reviewId);
        try {
            const response = await toggleReviewLike(reviewId);
            const { liked, likeCount } = response.data;

            setReviews((current) => updateReviewTree(current, reviewId, (review) => ({
                ...review,
                likedByCurrentUser: liked,
                likeCount,
            })));
        } catch (error) {
            toast.error(error.response?.data?.message || "Could not update the like.");
        } finally {
            setPendingLikeId(null);
        }
    };

    const handleEditSave = async (payload) => {
        if (!editingReview) return;

        setSavingEdit(true);
        try {
            await updateReview(editingReview.id, payload);
            setEditingReview(null);
            await fetchReviews();
            toast.success("Review updated.");
        } catch (error) {
            toast.error(error.response?.data?.message || "Could not update the review.");
        } finally {
            setSavingEdit(false);
        }
    };

    const handleDeleteReview = async (review) => {
        const label = review.parentReviewId ? "reply" : "review";
        if (!window.confirm(`Delete this ${label}?${review.replies?.length ? " This will also remove its replies." : ""}`)) {
            return;
        }

        setDeletingReviewId(review.id);
        try {
            await deleteReview(review.id);
            if (replyingToId === review.id) {
                setReplyingToId(null);
            }
            if (editingReview?.id === review.id) {
                setEditingReview(null);
            }
            await fetchReviews();
            toast.success("Deleted successfully.");
        } catch (error) {
            toast.error(error.response?.data?.message || "Could not delete the review.");
        } finally {
            setDeletingReviewId(null);
        }
    };

    const handlePageChange = (nextPage) => {
        setPage(nextPage);
        document.getElementById("reviews-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <section id="reviews-section" className="mt-12">
            <EditReviewDialog
                review={editingReview}
                open={Boolean(editingReview)}
                saving={savingEdit}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingReview(null);
                    }
                }}
                onSave={handleEditSave}
            />

            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-base font-bold text-black dark:text-white">
                        {reviews.length > 0 ? `${reviews.length} Review${reviews.length !== 1 ? "s" : ""}` : "Reviews"}
                    </h2>
                    {averageRating && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                            <FaStar className="text-yellow-400" size={11} />
                            Avg {averageRating}/10
                        </span>
                    )}
                </div>

                {reviews.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                        {SORT_OPTS.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setSortBy(option.value)}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${sortBy === option.value
                                    ? "border-transparent bg-black text-white dark:bg-white dark:text-black"
                                    : "border-zinc-200 text-zinc-500 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500"
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {isAuthenticated ? (
                <ReviewComposer
                    username={fullName || user}
                    submitting={submittingReview}
                    onSubmit={handleCreateReview}
                    placeholder="Share what you thought about this title..."
                    submitLabel="Post Review"
                    showRating
                />
            ) : (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                    Log in to write reviews, reply in threads, and like other users' thoughts.
                </div>
            )}

            {loading && (
                <div className="mt-6 space-y-5">
                    {Array.from({ length: 4 }).map((_, index) => <ReviewSkeleton key={index} />)}
                </div>
            )}

            {error && !loading && (
                <div className="mt-6 rounded-2xl border border-dashed border-red-200 bg-red-50 p-6 text-center dark:border-red-900/70 dark:bg-red-950/20">
                    <p className="text-sm text-red-500 dark:text-red-400">Failed to load reviews.</p>
                    <button
                        type="button"
                        onClick={fetchReviews}
                        className="mt-2 text-xs font-semibold text-red-500 hover:underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {!loading && !error && reviews.length === 0 && (
                <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 py-12 text-center dark:border-zinc-800">
                    <FiMessageSquare className="mx-auto mb-3 text-zinc-300 dark:text-zinc-600" size={24} />
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        No reviews yet for this title. Start the conversation.
                    </p>
                </div>
            )}

            {!loading && !error && reviews.length > 0 && (
                <div className="mt-6 space-y-4">
                    {pageReviews.map((review) => (
                        <ReviewNode
                            key={review.id}
                            review={review}
                            isAuthenticated={isAuthenticated}
                            pendingLikeId={pendingLikeId}
                            replyingToId={replyingToId}
                            pendingReplyParentId={pendingReplyParentId}
                            deletingReviewId={deletingReviewId}
                            onToggleLike={handleToggleLike}
                            onReplySubmit={handleReplySubmit}
                            onReplyToggle={setReplyingToId}
                            onEditRequest={setEditingReview}
                            onDelete={handleDeleteReview}
                        />
                    ))}
                </div>
            )}

            {!loading && totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                    <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
                </div>
            )}
        </section>
    );
}
