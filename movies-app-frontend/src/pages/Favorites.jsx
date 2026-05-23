import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/context/AuthContext";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { watchlistApi } from "@/api/watchlist";
import { Card, BreadCrumbs, useClickOutsideDropdown } from "@/utils/helper";
import { FaChevronDown, FaFilter, FaTrash } from "react-icons/fa";

const STATUS_META = {
    PLANNED: { label: "Planned", color: "bg-blue-600" },
    IN_PROGRESS: { label: "In Progress", color: "bg-yellow-500" },
    COMPLETED: { label: "Completed", color: "bg-green-600" },
    DROPPED: { label: "Dropped", color: "bg-red-600" },
};

const STATUS_ORDER = ["PLANNED", "IN_PROGRESS", "COMPLETED", "DROPPED"];

const SORT_OPTIONS = {
    DEFAULT: { label: "Default", order: ["PLANNED", "IN_PROGRESS", "COMPLETED", "DROPPED"] },
    IN_PROGRESS_FIRST: { label: "In Progress First", order: ["IN_PROGRESS", "PLANNED", "COMPLETED", "DROPPED"] },
    COMPLETED_FIRST: { label: "Completed First", order: ["COMPLETED", "IN_PROGRESS", "PLANNED", "DROPPED"] },
    DROPPED_FIRST: { label: "Dropped First", order: ["DROPPED", "PLANNED", "IN_PROGRESS", "COMPLETED"] },
};

const TYPE_OPTIONS = {
    ALL: { label: "All" },
    movie: { label: "Movies" },
    tv: { label: "Series" },
};

export default function Favorites() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [filtersOpen, setFiltersOpen] = useState(false);

    const [openDropdown, setOpenDropdown] = useClickOutsideDropdown();

    const [sortMode, setSortMode] = useState("DEFAULT");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [genreFilter, setGenreFilter] = useState("ALL");

    const longPressTimer = useRef(null);

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            setLoading(true);
            try {
                const res = await watchlistApi.get("");
                setItems(
                    (res.data ?? [])
                        .filter(item => item.favorite)
                        .map(item => ({ ...item, status: item.status || "PLANNED" }))
                );
            } catch {
                toast.error("Failed to load favorites.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user]);

    const allGenres = items.reduce((acc, item) => {
        if (!Array.isArray(item.genres)) return acc;
        item.genres.forEach(g => { if (!acc.includes(g)) acc.push(g); });
        return acc;
    }, []);

    const updateStatus = useCallback(async (movieId, newStatus) => {
        const prev = [...items];
        setItems(list =>
            list.map(item => item.movieId === movieId ? { ...item, status: newStatus } : item)
        );
        setOpenDropdown(null);
        try {
            await watchlistApi.patch(`/${movieId}/status`, null, { params: { status: newStatus } });
        } catch (error) {
            setItems(prev);
            const message = error.response?.data?.message || "Failed to update status.";
            toast.error(message);
        }
    }, [items, setOpenDropdown]);

    const handleRemove = useCallback(async (e, movieId) => {
        e.stopPropagation();
        const prev = [...items];
        setItems(list => list.filter(i => i.movieId !== movieId));
        try {
            await watchlistApi.patch(`/${movieId}/favorite`, null, { params: { favorite: false } });
            toast.success("Removed from favorites.");
        } catch {
            setItems(prev);
            toast.error("Failed to remove from favorites.");
        }
    }, [items]);

    const handleTouchStart = useCallback((movieId) => {
        longPressTimer.current = setTimeout(() => setOpenDropdown(movieId), 500);
    }, [setOpenDropdown]);

    const handleTouchEnd = useCallback(() => {
        clearTimeout(longPressTimer.current);
    }, []);

    const handleCardClick = useCallback((item) => {
        navigate(item.mediaType === "movie" ? `/movies/${item.movieId}` : `/series/${item.movieId}`);
    }, [navigate]);

    const getDisplayItems = () => {
        let result = [...items];
        if (statusFilter !== "ALL") result = result.filter(i => i.status === statusFilter);
        if (typeFilter !== "ALL") result = result.filter(i => i.mediaType === typeFilter);
        if (genreFilter !== "ALL") result = result.filter(i => i.genres?.includes(genreFilter));
        const order = SORT_OPTIONS[sortMode].order;
        result.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
        return result;
    };

    const displayItems = getDisplayItems();
    const filtersActive = sortMode !== "DEFAULT" || statusFilter !== "ALL" || typeFilter !== "ALL" || genreFilter !== "ALL";

    if (loading) return <p className="text-center mt-10">Loading...</p>;

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                <BreadCrumbs
                    overlay={false}
                    paths={[
                        { name: "Home", to: "/" },
                        { name: "Profile", to: "/profile" },
                        { name: "Favorites" },
                    ]}
                />

                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold">Favorites</h1>
                    <button
                        onClick={() => setFiltersOpen(v => !v)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition sm:hidden
                            ${filtersActive
                                ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                                : "border-black/15 dark:border-white/15 text-black/60 dark:text-white/60"
                            }`}
                    >
                        <FaFilter size={10} />
                        {filtersActive ? "Filtered" : "Filter"}
                    </button>
                </div>

                <div className={`${filtersOpen ? "flex" : "hidden"} sm:flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mb-4`}>
                    <Select value={sortMode} onValueChange={setSortMode}>
                        <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Sort" /></SelectTrigger>
                        <SelectContent>
                            {Object.entries(SORT_OPTIONS).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
                        <SelectContent>
                            {Object.entries(TYPE_OPTIONS).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={genreFilter} onValueChange={setGenreFilter}>
                        <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Genre" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Genres</SelectItem>
                            {allGenres.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All</SelectItem>
                            {STATUS_ORDER.map(s => <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center justify-between mb-4 text-xs text-black/50 dark:text-white/40">
                    <span>{displayItems.length} {displayItems.length === 1 ? "item" : "items"}</span>
                    {filtersActive && (
                        <button
                            onClick={() => { setSortMode("DEFAULT"); setStatusFilter("ALL"); setTypeFilter("ALL"); setGenreFilter("ALL"); }}
                            className="text-red-500 hover:text-red-600 transition font-medium"
                        >
                            Reset filters
                        </button>
                    )}
                </div>

                {displayItems.length === 0 ? (
                    <p className="text-center opacity-60 py-12">No favorites yet ❤️</p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 sm:gap-6">
                        {displayItems.map(item => (
                            <div
                                key={item.movieId}
                                className="relative group"
                                onTouchStart={() => handleTouchStart(item.movieId)}
                                onTouchEnd={handleTouchEnd}
                            >
                                {/* Status badge — top-left. */}
                                <div className="status-dropdown-container">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenDropdown(openDropdown === item.movieId ? null : item.movieId);
                                        }}
                                        className={`absolute top-2 left-2 z-20 text-[10px] px-2 py-1 rounded-sm text-white font-medium flex items-center gap-1 ${STATUS_META[item.status].color}`}>
                                        {STATUS_META[item.status].label}
                                        {/* Chevron signals this is a dropdown — removes the "hidden gesture" problem */}
                                        <FaChevronDown size={8} className="opacity-70" />
                                    </button>

                                    {/* Status dropdown */}
                                    {openDropdown === item.movieId && (
                                        <div className="absolute top-9 left-2 z-30 bg-black/90 rounded-md overflow-hidden shadow-lg">
                                            {STATUS_ORDER.map(s => (
                                                <button
                                                    key={s}
                                                    onClick={(e) => { e.stopPropagation(); updateStatus(item.movieId, s); }}
                                                    className={`block w-full px-3 py-2 text-xs text-left hover:bg-white/10 text-white ${item.status === s ? "opacity-50" : ""}`}
                                                >
                                                    {STATUS_META[s].label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Card — showType=true keeps the Movie/TV badge top-right. */}
                                <Card
                                    item={{
                                        id: item.movieId,
                                        poster_path: item.posterPath,
                                        backdrop_path: item.backdropPath,
                                        media_type: item.mediaType,
                                        title: item.movieTitle,
                                    }}
                                    showType
                                    showTitle
                                    onClick={() => handleCardClick(item)}
                                />

                                {/* Remove button — below the title, full width, shown on hover. */}
                                <button
                                    onClick={(e) => handleRemove(e, item.movieId)}
                                    className="mt-1 w-full flex items-center justify-center gap-1.5 py-1 rounded
                                        text-[10px] font-medium text-red-500 hover:bg-red-500/10
                                        opacity-0 group-hover:opacity-100 transition-all duration-150"
                                >
                                    <FaTrash size={8} /> Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
