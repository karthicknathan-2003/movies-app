import { useNavigate } from "react-router-dom";
import { Card } from "@/utils/helper";
import { FaClock, FaTrash } from "react-icons/fa";

/**
 * Horizontally scrollable row of recently viewed titles.
 * Powered by useRecentlyViewed hook (localStorage).
 * Shown on the Home page below the search bar.
 *
 * @param {Array}    items    - from useRecentlyViewed().recentlyViewed
 * @param {Function} clearAll - from useRecentlyViewed().clearAll
 */
export default function RecentlyViewed({ items, clearAll }) {
    const navigate = useNavigate();

    if (!items || items.length === 0) return null;

    const handleSelect = (item) => {
        if (item.media_type === "movie") return navigate(`/movies/${item.id}`);
        if (item.media_type === "anime") return navigate(`/anime/${item.id}`);
        if (item.media_type === "person") return navigate(`/celebrities/${item.id}`);
        navigate(`/series/${item.id}`);
    };

    return (
        <div className="mt-8">
            {/* Section header */}
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-black dark:text-white
                               flex items-center gap-2">
                    <FaClock className="text-zinc-400" size={12} />
                    Recently Viewed
                </h2>
                <button
                    onClick={clearAll}
                    className="flex items-center gap-1 text-xs font-medium
                               text-zinc-400 hover:text-red-500 dark:hover:text-red-400
                               transition-colors"
                >
                    <FaTrash size={9} />
                    Clear
                </button>
            </div>

            {/* Horizontal scroll row — uses the shared Card component */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4">
                {items.slice(0, 15).map(item => (
                    <div key={`${item.media_type}-${item.id}`} className="group">
                        <Card
                            item={item}
                            showType={true}
                            showTitle={true}
                            onClick={() => handleSelect(item)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}