import React from "react";
import { useNavigate } from "react-router-dom";
import { FaFilm, FaTv, FaDragon, FaUsers } from "react-icons/fa";

const CATEGORIES = [
    {
        id: "movies",
        label: "Movies",
        icon: FaFilm,
        route: "/movies",
        iconColor: "text-blue-500",
        bg: "bg-blue-50 dark:bg-blue-950/30",
        border: "border-blue-200 dark:border-blue-800",
    },
    {
        id: "series",
        label: "Series",
        icon: FaTv,
        route: "/series",
        iconColor: "text-emerald-500",
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
        border: "border-emerald-200 dark:border-emerald-800",
    },
    {
        id: "anime",
        label: "Anime",
        icon: FaDragon,
        route: "/anime",
        iconColor: "text-rose-500",
        bg: "bg-rose-50 dark:bg-rose-950/30",
        border: "border-rose-200 dark:border-rose-800",
    },
    {
        id: "celebrities",
        label: "Celebrities",
        icon: FaUsers,
        route: "/celebrities",
        iconColor: "text-amber-500",
        bg: "bg-amber-50 dark:bg-amber-950/30",
        border: "border-amber-200 dark:border-amber-800",
    },
];

export default function Catalog() {
    const navigate = useNavigate();

    return (
        <div className="max-w-2xl mx-auto px-6 py-12">
            {/* <h1 className="text-2xl font-bold text-black dark:text-white mb-8 text-center">Catalog</h1> */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {CATEGORIES.map(({ id, label, icon: Icon, route, iconColor, bg, border }) => (
                    <button
                        key={id}
                        onClick={() => navigate(route)}
                        className={`aspect-square flex flex-col items-center justify-center gap-3 rounded-2xl border ${bg} ${border} hover:scale-105 active:scale-95 transition-transform duration-150 cursor-pointer`}
                    >
                        <Icon className={`text-3xl ${iconColor}`} />
                        <span className="text-sm font-semibold text-black dark:text-white">{label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}   