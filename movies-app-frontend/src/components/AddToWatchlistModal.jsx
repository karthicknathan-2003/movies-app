import { watchlistGroupApi } from "@/api/tmdb";
import { useEffect, useRef, useState } from "react";
import { FaTimes, FaPlus, FaCheck, FaSpinner } from "react-icons/fa";
import { toast } from "sonner";

/**
 * Modal that lets the user choose which watchlist group to add a media item to,
 * or create a new group on the fly.
 *
 * @param {boolean}  open      - Whether the modal is visible.
 * @param {Function} onClose   - Callback to close the modal.
 * @param {object}   mediaItem - The item being added: { movieId, movieTitle, mediaType, posterPath }.
 */
export default function AddToWatchlistModal({ open, onClose, mediaItem }) {
    const [groups, setGroups] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [addingTo, setAddingTo] = useState(null);   // groupId currently being added to.
    const [added, setAdded] = useState([]);     // groupIds successfully added.
    const [creating, setCreating] = useState(false);  // Whether the "new group" input is shown.
    const [newName, setNewName] = useState("");
    const [saving, setSaving] = useState(false);  // Creating-new-group in flight.

    const inputRef = useRef(null);

    /* Fetch groups whenever the modal opens. */
    useEffect(() => {
        if (!open) return;
        setAdded([]);
        setCreating(false);
        setNewName("");

        const load = async () => {
            setLoadingGroups(true);
            try {
                const res = await watchlistGroupApi.get("");
                setGroups(res.data ?? []);
            } catch (error) {
                const message = error.response?.data?.message || "Could not load your watchlists.";
                toast.error(message);
            } finally {
                setLoadingGroups(false);
            }
        };

        load();
    }, [open]);

    /* Auto-focus the new-group input when it appears. */
    useEffect(() => {
        if (creating) inputRef.current?.focus();
    }, [creating]);

    /* Close on Escape key. */
    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    if (!open) return null;

    /* Add the item to a chosen group. */
    const handleAdd = async (groupId, groupName) => {
        if (added.includes(groupId)) return; // Already added — no-op.
        setAddingTo(groupId);
        try {
            await watchlistGroupApi.post(`/${groupId}/items`, {
                movieId: mediaItem.movieId,
                movieTitle: mediaItem.movieTitle,
                mediaType: mediaItem.mediaType,
                posterPath: mediaItem.posterPath ?? null,
                favorite: false,
            });
            setAdded((prev) => [...prev, groupId]);
            const name = groupName || groups.find(g => g.id === groupId)?.name;
            toast.success(`Added to "${name}"`);
        } catch (error) {
            const message = error.response?.data?.message || "Already in this watchlist";
            toast.error(message);
        } finally {
            setAddingTo(null);
        }
    };

    /* Create a new group then immediately add the item to it. */
    const handleCreateAndAdd = async () => {
        if (!newName.trim()) return;
        setSaving(true);
        try {
            const res = await watchlistGroupApi.post("", { name: newName.trim() });
            const created = res.data;
            setGroups((prev) => [...prev, created]);
            setCreating(false);
            setNewName("");
            await handleAdd(created.id, created.name);
        } catch (error) {
            const message = error.response?.data?.message || "Could not create watchlist.";
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4"
            onClick={onClose}
        >
            {/* Panel — bottom sheet on mobile, centered card on sm+ */}
            <div
                className="w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl shadow-2xl
                    max-h-[80vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-black/10 dark:border-white/10">
                    <div>
                        <p className="text-xs text-black/50 dark:text-white/50 font-medium uppercase tracking-wider mb-0.5">
                            Add to watchlist
                        </p>
                        <h2 className="text-base font-bold text-black dark:text-white line-clamp-1">
                            {mediaItem?.movieTitle}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition ml-4 flex-shrink-0"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Group list */}
                <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
                    {loadingGroups ? (
                        <div className="flex justify-center py-8">
                            <FaSpinner className="animate-spin text-black/30 dark:text-white/30 text-xl" />
                        </div>
                    ) : groups.length === 0 && !creating ? (
                        <p className="text-center text-sm text-black/40 dark:text-white/40 py-6">
                            No watchlists yet. Create one below.
                        </p>
                    ) : (
                        groups.map((group) => {
                            const isAdded = added.includes(group.id);
                            const isLoading = addingTo === group.id;
                            return (
                                <button
                                    key={group.id}
                                    onClick={() => handleAdd(group.id)}
                                    disabled={isAdded || isLoading}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition
                                        ${isAdded
                                            ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 cursor-default"
                                            : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10"
                                        }`}
                                >
                                    <div className="text-left">
                                        <p className="text-sm font-semibold text-black dark:text-white">
                                            {group.name}
                                        </p>
                                        <p className="text-xs text-black/40 dark:text-white/40">
                                            {group.itemCount} {group.itemCount === 1 ? "item" : "items"}
                                        </p>
                                    </div>
                                    <span className={`text-sm ml-3 flex-shrink-0 ${isAdded ? "text-green-600" : "text-black/30 dark:text-white/30"}`}>
                                        {isLoading
                                            ? <FaSpinner className="animate-spin" />
                                            : isAdded
                                                ? <FaCheck />
                                                : <FaPlus />
                                        }
                                    </span>
                                </button>
                            );
                        })
                    )}

                    {/* Inline new-group form */}
                    {creating && (
                        <div className="flex gap-2 mt-1">
                            <input
                                ref={inputRef}
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleCreateAndAdd(); }}
                                placeholder="Watchlist name…"
                                maxLength={50}
                                className="flex-1 px-3 py-2 rounded-lg text-sm bg-black/5 dark:bg-white/10
                                    text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30
                                    outline-none border border-transparent focus:border-black/20 dark:focus:border-white/20 transition"
                            />
                            <button
                                onClick={handleCreateAndAdd}
                                disabled={!newName.trim() || saving}
                                className="px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black text-sm font-semibold
                                    disabled:opacity-40 transition flex items-center gap-1.5"
                            >
                                {saving ? <FaSpinner className="animate-spin" /> : "Add"}
                            </button>
                            <button
                                onClick={() => { setCreating(false); setNewName(""); }}
                                className="px-3 py-2 rounded-lg text-sm text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer — create new group trigger */}
                {!creating && (
                    <div className="px-5 py-4 border-t border-black/10 dark:border-white/10">
                        <button
                            onClick={() => setCreating(true)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                                border border-dashed border-black/20 dark:border-white/20
                                text-sm font-semibold text-black/60 dark:text-white/60
                                hover:border-black/40 dark:hover:border-white/40 hover:text-black dark:hover:text-white transition"
                        >
                            <FaPlus size={11} />
                            New watchlist
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
