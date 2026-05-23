import React, {
  useEffect, useState, useCallback, useRef,
} from "react";
import { useParams } from "react-router-dom";
import { tmdb } from "@/api/tmdb";
import {
  FaStar, FaHeart, FaRegHeart, FaFlag,
} from "react-icons/fa";
import { FiMessageSquare } from "react-icons/fi";
import Pagination from "@/components/Pagination";

import { useAuth } from "@/components/context/AuthContext";
import { Avatar, cleanContent, formatDate, getRatingColor, ReviewSkeleton } from "@/utils/reviewHelper";

const PAGE_SIZE = 6;
const COLLAPSED_LINES = 4;

const SORT_OPTS = [
  { value: "highest", label: "Best" },
  { value: "newest", label: "Newest" },
  { value: "lowest", label: "Oldest" },
];

/* ReplyBox — inline textarea that appears under
   a comment when the user clicks Reply. */
function ReplyBox({ replyingTo, onCancel, onSubmit }) {
  const [text, setText] = useState("");
  const ref = useRef(null);

  // Auto-focus the textarea as soon as the box appears.
  useEffect(() => { ref.current?.focus(); }, []);

  const handleSubmit = () => {
    if (!text.trim()) return;
    // In a real system, POST to your backend here.
    // TMDB API is read-only so we just call onSubmit with the text
    // so the parent can show an optimistic local reply.
    onSubmit(text.trim());
    setText("");
  };

  // Allow Escape to cancel and Ctrl+Enter to submit.
  const handleKey = (e) => {
    if (e.key === "Escape") onCancel();
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleSubmit();
  };

  return (
    <div className="mt-3 ml-12 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-900">
      <textarea
        ref={ref}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKey}
        placeholder={`Reply to ${replyingTo}...`}
        rows={3}
        className="w-full px-4 py-3 text-sm bg-transparent text-black dark:text-white
                           placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                           resize-none outline-none"
      />
      {/* Footer bar — matches the dark strip in the screenshot */}
      <div className="flex items-center justify-end gap-2 px-3 py-2
                            bg-zinc-100 dark:bg-zinc-800 border-t
                            border-zinc-200 dark:border-zinc-700">
        <button
          onClick={onCancel}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold
                               border border-zinc-300 dark:border-zinc-600
                               text-black dark:text-white
                               hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold
                               bg-zinc-800 dark:bg-zinc-200
                               text-white dark:text-black
                               hover:bg-black dark:hover:bg-white transition-colors
                               disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Reply
        </button>
      </div>
    </div>
  );
}

/* CommentInput — top-level comment box */
function CommentInput({ username }) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);

  const handleKey = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      // Would POST to backend — TMDB API is read-only.
    }
  };

  return (
    <div className="mb-6">
      {username && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
          Comment as{" "}
          <span className="font-semibold text-black dark:text-white">
            {username}
          </span>
        </p>
      )}
      <div className={`rounded-xl border overflow-hidden transition-colors duration-150
                ${focused
          ? "border-zinc-400 dark:border-zinc-500"
          : "border-zinc-200 dark:border-zinc-700"
        }`}
      >
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKey}
          placeholder="What are your thoughts?"
          rows={4}
          className="w-full px-4 py-3 text-sm bg-white dark:bg-zinc-900
                               text-black dark:text-white placeholder:text-zinc-400
                               dark:placeholder:text-zinc-500 resize-none outline-none"
        />
        {/* Footer bar with Comment button */}
        <div className="flex items-center justify-end px-3 py-2
                                bg-zinc-100 dark:bg-zinc-800 border-t
                                border-zinc-200 dark:border-zinc-700">
          <button
            disabled={!text.trim()}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold
                                   bg-zinc-800 dark:bg-zinc-200
                                   text-white dark:text-black
                                   hover:bg-black dark:hover:bg-white transition-colors
                                   disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Comment
          </button>
        </div>
      </div>
    </div>
  );
}

/* ReviewCard */
function ReviewCard({ review }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(
    review.author_details?.rating
      ? Math.floor(review.author_details.rating / 2) // visual placeholder
      : 0
  );
  // replyingOpen tracks whether the inline ReplyBox is visible for this card.
  const [replyingOpen, setReplyingOpen] = useState(false);
  // localReplies holds optimistic replies added while on the page.
  // They are not persisted — TMDB API is read-only.
  const [localReplies, setLocalReplies] = useState([]);
  const contentRef = useRef(null);

  const content = cleanContent(review.content);
  const rating = review.author_details?.rating;
  const avatar = review.author_details?.avatar_path;
  const author = (review.author || review.author_details?.username || "Anonymous")
    .replace(/^@/, "");
  const isEdited = review.updated_at && review.updated_at !== review.created_at;

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 20;
    setOverflows(el.scrollHeight > lh * COLLAPSED_LINES + 4);
  }, [content]);

  const handleLike = () => {
    setLikeCount(n => liked ? n - 1 : n + 1);
    setLiked(v => !v);
  };

  /* Add an optimistic reply locally.
     In a full implementation, POST to your backend first,
     then append the returned review object. */
  const handleReplySubmit = (text) => {
    setLocalReplies(prev => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        author: "You",
        content: text,
        created_at: new Date().toISOString(),
        author_details: { avatar_path: null, rating: null },
      },
    ]);
    setReplyingOpen(false);
  };

  return (
    <div className="flex gap-3">
      {/* Left column — avatar + vertical thread line */}
      <div className="flex flex-col items-center flex-shrink-0">
        <Avatar avatarPath={avatar} username={author} size="md" />
        {/* Thread line — only shown when there are replies or the ReplyBox is open */}
        {(replyingOpen || localReplies.length > 0) && (
          <div className="flex-1 w-px bg-zinc-200 dark:bg-zinc-700 mt-1 min-h-[8px]" />
        )}
      </div>

      {/* Right column — everything else */}
      <div className="flex-1 min-w-0 pb-4">
        {/* Username + timestamp + edited + rating pill */}
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 mb-1">
          <span className="text-sm font-bold text-black dark:text-white">
            {author}
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            · {formatDate(review.created_at)}
          </span>
          {isEdited && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500 italic">
              · edited
            </span>
          )}
          {rating != null && (
            <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md
                                          flex items-center gap-0.5 ${getRatingColor(rating)}`}>
              <FaStar size={8} />
              {rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Review text */}
        <p
          ref={contentRef}
          className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line"
          style={!expanded ? {
            WebkitLineClamp: COLLAPSED_LINES,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          } : {}}
        >
          {content}
        </p>

        {overflows && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="mt-1 text-xs font-semibold text-zinc-400 dark:text-zinc-500
                                   hover:text-black dark:hover:text-white transition-colors"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}

        {/* Action row */}
        <div className="flex items-center gap-4 mt-2">
          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors
                            ${liked
                ? "text-rose-500"
                : "text-zinc-400 dark:text-zinc-500 hover:text-rose-500"
              }`}
          >
            {liked ? <FaHeart size={12} /> : <FaRegHeart size={12} />}
            {likeCount > 0 && <span>{likeCount}</span>}
            <span>Like</span>
          </button>

          {/* Reply — toggles the inline ReplyBox */}
          <button
            onClick={() => setReplyingOpen(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors
                            ${replyingOpen
                ? "text-black dark:text-white"
                : "text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white"
              }`}
          >
            <FiMessageSquare size={12} />
            <span>Reply</span>
          </button>

          {/* Report */}
          <button
            className="flex items-center gap-1.5 text-xs font-medium
                                   text-zinc-400 dark:text-zinc-500
                                   hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <FaFlag size={10} />
            <span>Report</span>
          </button>
        </div>

        {/* Inline ReplyBox */}
        {replyingOpen && (
          <ReplyBox
            replyingTo={author}
            onCancel={() => setReplyingOpen(false)}
            onSubmit={handleReplySubmit}
          />
        )}

        {/* Nested local replies */}
        {localReplies.length > 0 && (
          <div className="mt-3 space-y-3">
            {localReplies.map(reply => (
              <NestedReply key={reply.id} reply={reply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* NestedReply — indented reply card. Kept separate from ReviewCard to stay simple —
   replies don't need their own reply boxes. */
function NestedReply({ reply }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const author = (reply.author || "Anonymous").replace(/^@/, "");
  const content = cleanContent(reply.content);

  return (
    <div className="flex gap-3 ml-4 pl-4 border-l-2 border-zinc-200 dark:border-zinc-700">
      <Avatar
        avatarPath={reply.author_details?.avatar_path}
        username={author}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-1.5 mb-1">
          <span className="text-sm font-bold text-black dark:text-white">
            {author}
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            · {formatDate(reply.created_at)}
          </span>
        </div>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {content}
        </p>
        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={() => {
              setLikeCount(n => liked ? n - 1 : n + 1);
              setLiked(v => !v);
            }}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors
                            ${liked
                ? "text-rose-500"
                : "text-zinc-400 dark:text-zinc-500 hover:text-rose-500"
              }`}
          >
            {liked ? <FaHeart size={11} /> : <FaRegHeart size={11} />}
            {likeCount > 0 && <span>{likeCount}</span>}
            <span>Like</span>
          </button>
          {/* Reply — toggles the inline ReplyBox */}
          <button
            // onClick={() => setReplyingOpen(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white"
              }`}
          >
            <FiMessageSquare size={12} />
            <span>Reply</span>
          </button>
          <button className="flex items-center gap-1.5 text-xs font-medium
                                       text-zinc-400 dark:text-zinc-500
                                       hover:text-red-500 transition-colors">
            <FaFlag size={10} />
            <span>Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserReviews({ mediaType }) {
  const { id } = useParams();
  const { fullName } = useAuth();

  const [allReviews, setAllReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("highest");

  const apiOrigin = import.meta.env.VITE_TMDB_API_URL
    ? new URL(import.meta.env.VITE_TMDB_API_URL).origin
    : "http://localhost:8080";

  const fetchReviews = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      let results = [];
      if (mediaType === "ANIME") {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${apiOrigin}/api/tmdb/anime/${id}/reviews?page=1`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        results = data?.results ?? [];
      } else {
        const tmdbType = mediaType === "MOVIE" ? "movie" : "tv";
        const res = await tmdb.get(`/${tmdbType}/${id}/reviews`, {
          params: { page: 1 },
        });
        results = res.data?.results ?? [];
      }
      setAllReviews(results);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [apiOrigin, id, mediaType]);

  useEffect(() => {
    setPage(1);
    setAllReviews([]);
    fetchReviews();
  }, [fetchReviews, id, mediaType]);

  useEffect(() => { setPage(1); }, [sortBy]);

  const sorted = [...allReviews].sort((a, b) => {
    if (sortBy === "highest")
      return (b.author_details?.rating ?? 0) - (a.author_details?.rating ?? 0);
    if (sortBy === "lowest")
      return (a.author_details?.rating ?? 0) - (b.author_details?.rating ?? 0);
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageReviews = sorted.slice(pageStart, pageStart + PAGE_SIZE);
  const hasReviews = sorted.length > 0;

  const rated = allReviews.filter(r => r.author_details?.rating != null);
  const avgRating = rated.length
    ? (rated.reduce((s, r) => s + r.author_details.rating, 0) / rated.length).toFixed(1)
    : null;

  const handlePageChange = (p) => {
    setPage(p);
    document
      .getElementById("reviews-section")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="reviews-section" className="mt-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-base font-bold text-black dark:text-white">
            {allReviews.length > 0
              ? `${allReviews.length} Comment${allReviews.length !== 1 ? "s" : ""}`
              : "Comments"
            }
          </h2>
          {avgRating && (
            <span className="flex items-center gap-1 text-xs font-semibold
                                         text-zinc-500 dark:text-zinc-400">
              <FaStar className="text-yellow-400" size={11} />
              Avg {avgRating}/10
            </span>
          )}
        </div>

        {/* Pill sort buttons */}
        {hasReviews && (
          <div className="flex items-center gap-1.5">
            {SORT_OPTS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors
                                    ${sortBy === opt.value
                    ? "bg-black dark:bg-white text-white dark:text-black border-transparent"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Top-level comment input */}
      <CommentInput username={fullName} />

      {/* Loading */}
      {loading && (
        <div className="space-y-5">
          {Array.from({ length: 4 }).map((_, i) => <ReviewSkeleton key={i} />)}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-xl border border-dashed border-red-200 dark:border-red-800
                                bg-red-50 dark:bg-red-950/20 p-6 text-center">
          <p className="text-sm text-red-500 dark:text-red-400">
            Failed to load reviews.
          </p>
          <button
            onClick={fetchReviews}
            className="mt-2 text-xs font-semibold text-red-500 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && !hasReviews && (
        <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700
                                py-12 text-center">
          <FiMessageSquare
            className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3"
            size={24}
          />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No reviews yet for this title.
          </p>
        </div>
      )}

      {/* Review list */}
      {!loading && hasReviews && (
        <div className="space-y-2">
          {pageReviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </section>
  );
}
