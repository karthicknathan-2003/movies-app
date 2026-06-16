import { useMemo } from "react";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
} from "recharts";

function SeasonChartTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload;

    return (
        <div className="rounded-lg border border-black/10 bg-white/95 px-3 py-2 text-xs shadow-lg dark:border-white/10 dark:bg-zinc-950/95">
            <p className="font-semibold text-black dark:text-white">{data.name}</p>
            <p className="mt-1 text-black/65 dark:text-white/65">
                Avg rating: {data.averageRating.toFixed(1)}
            </p>
            <p className="text-black/65 dark:text-white/65">
                Episodes: {data.episodeCount}
            </p>
        </div>
    );
}

export default function EpisodeInsights({ seasonColumns = [] }) {
    // Recharts behaves more predictably with a small display-focused data shape.
    const seasonChartData = useMemo(
        () => seasonColumns.map((season) => ({
            name: `Season ${season.season}`,
            averageRating: Number((season.avg || 0).toFixed(1)),
            episodeCount: season.episodes?.length || 0,
        })),
        [seasonColumns],
    );

    if (!seasonColumns.length) return null;

    return (
        <section className="mt-8 min-w-0 rounded-xl border border-black/10 bg-white p-4 shadow-sm sm:p-5 dark:border-white/10 dark:bg-zinc-900">
            <div>
                <h3 className="text-sm font-semibold text-black dark:text-white">Season comparison</h3>
                <p className="mt-1 text-xs text-black/55 dark:text-white/55">
                    Average episode rating across each season.
                </p>
            </div>

            <div className="mt-4 h-[240px] w-full sm:h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={seasonChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.18)" />
                        <XAxis
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11 }}
                        />
                        <YAxis
                            domain={[0, 10]}
                            tickCount={6}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11 }}
                        />
                        <RechartsTooltip content={<SeasonChartTooltip />} />
                        {/* A single line chart keeps this section lighter now that the heatmap is removed. */}
                        <Line
                            type="monotone"
                            dataKey="averageRating"
                            stroke="#16a34a"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: "#16a34a" }}
                            activeDot={{ r: 6, fill: "#14532d" }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}
