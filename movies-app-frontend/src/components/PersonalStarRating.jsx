import { FaStar } from "react-icons/fa";

export default function PersonalStarRating({
    value = 0,
    onChange,
    disabled = false,
}) {
    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => {
                const starValue = index + 1;
                const isActive = starValue <= value;

                return (
                    <button
                        key={starValue}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange?.(starValue === value ? null : starValue)}
                        className="rounded-sm p-0.5 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={value === starValue ? `Clear ${starValue} star rating` : `Set ${starValue} star rating`}
                    >
                        {/* Simple 1-5 rating to match the existing lightweight watchlist UX. */}
                        <FaStar
                            size={15}
                            className={isActive ? "text-amber-400" : "text-black/20 dark:text-white/20"}
                        />
                    </button>
                );
            })}
        </div>
    );
}
