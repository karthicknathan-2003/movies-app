import { BreadCrumbs } from "@/utils/helper";
import { useAppSettings } from "@/components/context/AppSettingsContext";
import { FaClock, FaMoon, FaSun, FaTrashAlt, FaLayerGroup } from "react-icons/fa";

function SettingCard({ icon, title, description, children }) {
    return (
        <div className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
            <div className="flex items-start gap-2.5">
                <div className="mt-0.5 text-blue-500">{icon}</div>
                <div className="flex-1">
                    <h2 className="text-sm font-semibold text-black dark:text-white">{title}</h2>
                    <p className="mt-1 text-xs text-black/55 dark:text-white/55">{description}</p>
                    <div className="mt-3">{children}</div>
                </div>
            </div>
        </div>
    );
}

export default function Settings() {
    const {
        theme,
        setTheme,
        defaultViewMode,
        setDefaultViewMode,
        recentlyViewedEnabled,
        setRecentlyViewedEnabled,
        clearRecentlyViewed,
    } = useAppSettings();

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                <BreadCrumbs
                    overlay={false}
                    paths={[
                        { name: "Home", to: "/" },
                        { name: "Settings" },
                    ]}
                />

                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Settings</h1>
                    <p className="mt-1.5 text-sm text-black/55 dark:text-white/55">
                        Generic app preferences live here so browsing feels consistent across pages and devices.
                    </p>
                </div>

                <div className="grid gap-3">
                    <SettingCard
                        icon={theme === "dark" ? <FaMoon /> : <FaSun />}
                        title="Appearance"
                        description="Choose the theme used throughout the app."
                    >
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: "light", label: "Light" },
                                { value: "dark", label: "Dark" },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setTheme(option.value)}
                                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition
                                        ${theme === option.value
                                            ? "border-transparent bg-black text-white dark:bg-white dark:text-black"
                                            : "border-black/15 text-black/70 hover:border-black/30 dark:border-white/15 dark:text-white/70 dark:hover:border-white/30"
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </SettingCard>

                    <SettingCard
                        icon={<FaLayerGroup />}
                        title="Default Browse Mode"
                        description="Choose how long catalog lists should open by default."
                    >
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: "pagination", label: "Pages", help: "Jump through fixed pages." },
                                { value: "infinite", label: "Infinite Scroll", help: "Load more while scrolling." },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setDefaultViewMode(option.value)}
                                    className={`rounded-lg border px-3 py-2.5 text-left transition
                                        ${defaultViewMode === option.value
                                            ? "border-transparent bg-black text-white dark:bg-white dark:text-black"
                                            : "border-black/15 text-black/70 hover:border-black/30 dark:border-white/15 dark:text-white/70 dark:hover:border-white/30"
                                        }`}
                                >
                                    <p className="text-sm font-medium">{option.label}</p>
                                    <p className={`mt-0.5 text-[11px] ${defaultViewMode === option.value ? "text-white/75 dark:text-black/70" : "text-black/45 dark:text-white/45"}`}>
                                        {option.help}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </SettingCard>

                    <SettingCard
                        icon={<FaClock />}
                        title="Recently Viewed"
                        description="Control whether the app keeps a local history of titles you opened."
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => setRecentlyViewedEnabled((value) => !value)}
                                className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition sm:min-w-[190px]
                                    ${recentlyViewedEnabled
                                        ? "border-transparent bg-black text-white dark:bg-white dark:text-black"
                                        : "border-black/15 text-black/70 hover:border-black/30 dark:border-white/15 dark:text-white/70 dark:hover:border-white/30"
                                    }`}
                            >
                                <span>{recentlyViewedEnabled ? "Enabled" : "Disabled"}</span>
                                <span className={`h-5 w-10 rounded-full p-0.5 transition ${recentlyViewedEnabled ? "bg-white/25 dark:bg-black/20" : "bg-black/10 dark:bg-white/10"}`}>
                                    <span className={`block h-4 w-4 rounded-full bg-white transition dark:bg-black ${recentlyViewedEnabled ? "translate-x-5 dark:bg-black" : "translate-x-0 dark:bg-white"}`} />
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={clearRecentlyViewed}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/25 px-3 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-500/10"
                            >
                                <FaTrashAlt size={12} />
                                Clear history
                            </button>
                        </div>
                    </SettingCard>
                </div>
            </div>
        </div>
    );
}
