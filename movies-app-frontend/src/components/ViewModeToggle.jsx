export default function ViewModeToggle({ value, onChange }) {
    return (
        <div className="flex items-center overflow-hidden rounded-xl border border-black/15 dark:border-white/15">
            {[
                { value: "pagination", label: "Pages" },
                { value: "infinite", label: "Infinite" },
            ].map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={`px-3 py-2 text-xs font-semibold transition-colors
                        ${value === option.value
                            ? "bg-black text-white dark:bg-white dark:text-black"
                            : "text-black/55 hover:text-black dark:text-white/55 dark:hover:text-white"
                        }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
