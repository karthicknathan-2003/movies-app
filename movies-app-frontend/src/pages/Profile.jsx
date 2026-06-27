import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaHeart,
  FaList,
  FaPlus,
  FaTrash,
  FaSpinner,
  FaEdit,
  FaMapMarkerAlt,
  FaChartPie,
  FaClock,
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
  FaComment,
  FaStar,
} from "react-icons/fa";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import { useAuth } from "@/components/context/AuthContext";
import { toast } from "sonner";
import { BreadCrumbs, SEVEN_COLUMN_CARD_GRID_CLASS } from "@/utils/helper";
import { watchlistGroupApi } from "@/api/tmdb";
import { getCurrentUserProfile, getMyActivity, getUserStats, updateUserProfile } from "@/api/userService";
import ProfileEditModal from "@/components/ProfileEditModal";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/utils/reviewHelper";

const DEFAULT_GROUP_NAME = "Watchlist";

const STATUS_CONFIG = {
  PLANNED: { label: "Planned", color: "#2563eb" },
  IN_PROGRESS: { label: "In Progress", color: "#f59e0b" },
  COMPLETED: { label: "Completed", color: "#16a34a" },
  DROPPED: { label: "Dropped", color: "#dc2626" },
};

function AnimatedStat({ value = 0, decimals = 0, suffix = "" }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const duration = 900;
    const start = performance.now();

    let animationFrameId;

    const updateValue = (timestamp) => {
      const elapsed = Math.min((timestamp - start) / duration, 1);
      // Ease-out keeps the count-up readable instead of racing at the end.
      const easedProgress = 1 - ((1 - elapsed) ** 3);
      const nextValue = target * easedProgress;
      setDisplayValue(nextValue);

      if (elapsed < 1) {
        animationFrameId = window.requestAnimationFrame(updateValue);
      }
    };

    animationFrameId = window.requestAnimationFrame(updateValue);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [value]);

  return `${displayValue.toFixed(decimals)}${suffix}`;
}

function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <Skeleton className="h-24 w-24 rounded-full sm:h-20 sm:w-20" />
          <div className="space-y-3 text-center sm:text-left">
            <Skeleton className="h-6 w-40 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-4 w-48 rounded-md" />
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-lg" />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[380px] rounded-2xl" />
        <Skeleton className="h-[380px] rounded-2xl" />
      </div>

      <div className={`${SEVEN_COLUMN_CARD_GRID_CLASS} gap-3`}>
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="aspect-square rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function getActivityRoute(activity) {
  if (!activity?.mediaId || !activity?.mediaType) {
    return null;
  }

  if (activity.mediaType === "movie") {
    return `/movies/${activity.mediaId}`;
  }
  if (activity.mediaType === "anime") {
    return `/anime/${activity.mediaId}`;
  }
  return `/series/${activity.mediaId}`;
}

function getActivityIcon(type) {
  if (type === "RATED_TITLE") {
    return <FaStar className="text-amber-500" size={14} />;
  }
  if (type === "ADDED_REVIEW" || type === "REPLIED_TO_REVIEW") {
    return <FaComment className="text-emerald-500" size={14} />;
  }
  return <FaPlus className="text-blue-500" size={14} />;
}

function getActivityMessage(activity) {
  if (activity.type === "RATED_TITLE") {
    return `Rated ${activity.title}`;
  }
  if (activity.type === "REPLIED_TO_REVIEW") {
    return `Replied on ${activity.title}`;
  }
  if (activity.type === "ADDED_REVIEW") {
    return `Reviewed ${activity.title}`;
  }
  return `Added ${activity.title} to Watchlist`;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [activityItems, setActivityItems] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoadingProfile(true);
    getCurrentUserProfile()
      .then((res) => setProfile(res.data))
      .catch(console.error)
      .finally(() => setLoadingProfile(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoadingGroups(true);
      try {
        const res = await watchlistGroupApi.get("");
        const existing = [...(res.data ?? [])].sort((left, right) => {
          if (left.name.toLowerCase() === DEFAULT_GROUP_NAME.toLowerCase()) return -1;
          if (right.name.toLowerCase() === DEFAULT_GROUP_NAME.toLowerCase()) return 1;
          return left.name.localeCompare(right.name);
        });
        setGroups(existing);
      } catch (error) {
        const message = error.response?.data?.message || "Failed to load watchlists.";
        toast.error(message);
      } finally {
        setLoadingGroups(false);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const loadStats = async () => {
      setLoadingStats(true);
      try {
        const res = await getUserStats(user);
        setStats(res.data);
      } catch (error) {
        console.warn("Failed to load user stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };
    loadStats();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const loadActivity = async () => {
      setLoadingActivity(true);
      try {
        const res = await getMyActivity();
        setActivityItems(res.data ?? []);
      } catch (error) {
        console.warn("Failed to load my activity:", error);
        setActivityItems([]);
      } finally {
        setLoadingActivity(false);
      }
    };

    loadActivity();
  }, [user]);

  const handleLogout = useCallback(async () => {
    // Await the logout request so the backend clears the HttpOnly cookie as well.
    await logout();
    navigate("/");
  }, [logout, navigate]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    if (newName.trim().toLowerCase() === DEFAULT_GROUP_NAME.toLowerCase()) {
      toast.error(`"${DEFAULT_GROUP_NAME}" already exists.`);
      return;
    }
    setSaving(true);
    try {
      const res = await watchlistGroupApi.post("", { name: newName.trim() });
      setGroups((prev) => {
        const updated = [...prev, res.data];
        return updated.sort((left, right) => {
          if (left.name.toLowerCase() === DEFAULT_GROUP_NAME.toLowerCase()) return -1;
          if (right.name.toLowerCase() === DEFAULT_GROUP_NAME.toLowerCase()) return 1;
          return left.name.localeCompare(right.name);
        });
      });
      setNewName("");
      setCreating(false);
      toast.success(`"${res.data.name}" created.`);
    } catch (error) {
      const message = error.response?.data?.message || "Could not create watchlist.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (event, groupId, groupName) => {
    event.stopPropagation();
    if (groupName.toLowerCase() === DEFAULT_GROUP_NAME.toLowerCase()) {
      toast.error(`The "${DEFAULT_GROUP_NAME}" watchlist cannot be deleted.`);
      return;
    }
    if (!window.confirm(`Delete "${groupName}" and all its items?`)) return;
    setDeletingId(groupId);
    try {
      await watchlistGroupApi.delete(`/${groupId}`);
      setGroups((prev) => prev.filter((group) => group.id !== groupId));
      toast.success(`"${groupName}" deleted.`);
    } catch (error) {
      const message = error.response?.data?.message || "Could not delete watchlist.";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleProfileSave = async (data) => {
    setSavingProfile(true);
    try {
      const res = await updateUserProfile(data);
      setProfile(res.data);
      setEditOpen(false);
      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const statusChartData = useMemo(() => ([
    { key: "PLANNED", name: STATUS_CONFIG.PLANNED.label, value: stats?.plannedCount ?? 0, fill: STATUS_CONFIG.PLANNED.color },
    { key: "IN_PROGRESS", name: STATUS_CONFIG.IN_PROGRESS.label, value: stats?.inProgressCount ?? 0, fill: STATUS_CONFIG.IN_PROGRESS.color },
    { key: "COMPLETED", name: STATUS_CONFIG.COMPLETED.label, value: stats?.completedCount ?? 0, fill: STATUS_CONFIG.COMPLETED.color },
    { key: "DROPPED", name: STATUS_CONFIG.DROPPED.label, value: stats?.droppedCount ?? 0, fill: STATUS_CONFIG.DROPPED.color },
  ]), [stats]);
  const activeStatusChartData = statusChartData.filter((item) => item.value > 0);
  const isInitialLoading = loadingProfile || loadingStats || loadingGroups;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <ProfileEditModal
        open={editOpen}
        onOpenChange={setEditOpen}
        profile={profile}
        onSave={handleProfileSave}
        saving={savingProfile}
      />

      <BreadCrumbs
        overlay={false}
        paths={[
          { name: "Home", to: "/" },
          { name: "Profile" },
        ]}
      />

      {isInitialLoading ? (
        <ProfileSkeleton />
      ) : (
        <>
          <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-8 gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 w-full">
          <div className="flex justify-center w-full sm:w-auto">
            <div className="w-24 h-24 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-black/10 dark:border-white/10 shadow-sm">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <FaUser className="text-white text-3xl sm:text-2xl" />
                </div>
              )}
            </div>
          </div>

          <div className="text-center sm:text-left">
            <p className="text-xl font-bold text-black dark:text-white">{profile?.fullName}</p>
            <p className="text-sm text-black/60 dark:text-white/60">@{user}</p>

            {profile?.location && (
              <p className="flex items-center justify-center sm:justify-start gap-1 text-sm mt-1 text-black/70 dark:text-white/70">
                <FaMapMarkerAlt size={12} />
                {profile.location}
              </p>
            )}

            {profile?.interests && (
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                {profile.interests.split(",").map((interest, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-medium"
                  >
                    {interest.trim()}
                  </span>
                ))}
              </div>
            )}

            {profile?.bio && (
              <p className="text-sm mt-2 max-w-md text-black/70 dark:text-white/70">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap justify-center sm:justify-end gap-2">
          <button
            onClick={() => setEditOpen(true)}
            className="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center gap-2"
          >
            <FaEdit size={12} />
            Edit
          </button>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg border text-red-500"
          >
            Logout
          </button>
        </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-black/60 dark:text-white/60 font-medium mb-1">Followers</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            <AnimatedStat value={stats?.followers ?? 0} />
          </p>
          <button
            onClick={() => navigate(`/users/${user}/followers`)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2"
          >
            View all
          </button>
        </div>

        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
          <p className="text-xs text-black/60 dark:text-white/60 font-medium mb-1">Following</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            <AnimatedStat value={stats?.following ?? 0} />
          </p>
          <button
            onClick={() => navigate(`/users/${user}/following`)}
            className="text-xs text-green-600 dark:text-green-400 hover:underline mt-2"
          >
            View all
          </button>
        </div>

        <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
          <p className="text-xs text-black/60 dark:text-white/60 font-medium mb-1">Watch Time</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            <AnimatedStat value={stats?.totalWatchMinutes ? stats.totalWatchMinutes / 60 : 0} decimals={1} suffix="h" />
          </p>
          <p className="text-xs text-black/40 dark:text-white/40 mt-2">Estimated from runtime</p>
        </div>

        <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
          <p className="text-xs text-black/60 dark:text-white/60 font-medium mb-1">Tracked Episodes</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            <AnimatedStat value={stats?.watchedEpisodeCount ?? 0} />
          </p>
          <p className="text-xs text-black/40 dark:text-white/40 mt-2">{stats?.trackedMediaCount ?? 0} saved titles</p>
        </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 mb-8">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <FaChartPie className="text-blue-500" />
            <h2 className="text-sm font-bold text-black dark:text-white">Completion Stats</h2>
          </div>

          {activeStatusChartData.length === 0 ? (
            <p className="text-sm text-black/50 dark:text-white/50 py-10 text-center">
              Add titles to your watchlist to see status charts.
            </p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activeStatusChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={3}
                  >
                    {activeStatusChartData.map((entry) => (
                      <Cell key={entry.key} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mt-2">
            {statusChartData.map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-lg bg-black/[0.03] px-3 py-2 dark:bg-white/[0.04]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-xs text-black/70 dark:text-white/70">{item.name}</span>
                </div>
                <span className="text-sm font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <FaCheckCircle className="text-emerald-500" />
            <h2 className="text-sm font-bold text-black dark:text-white">Watch Status Breakdown</h2>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {statusChartData.map((entry) => (
                    <Cell key={`${entry.key}-bar`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="rounded-lg bg-black/[0.03] p-3 dark:bg-white/[0.04]">
              <div className="flex items-center gap-2 text-xs text-black/55 dark:text-white/55">
                <FaClock />
                Runtime Estimate
              </div>
              <p className="mt-1 text-lg font-bold">
                <AnimatedStat value={stats?.totalWatchMinutes ? stats.totalWatchMinutes / 60 : 0} decimals={1} suffix=" hours" />
              </p>
            </div>
            <div className="rounded-lg bg-black/[0.03] p-3 dark:bg-white/[0.04]">
              <div className="flex items-center gap-2 text-xs text-black/55 dark:text-white/55">
                <FaList />
                Saved Titles
              </div>
              <p className="mt-1 text-lg font-bold">
                <AnimatedStat value={stats?.trackedMediaCount ?? 0} />
              </p>
            </div>
          </div>
        </div>
          </div>

          <div className="mb-8 rounded-2xl border border-black/10 bg-white p-4 sm:p-5 dark:border-white/10 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => setActivityOpen((current) => !current)}
              className="flex w-full flex-col gap-3 rounded-xl text-left transition hover:bg-black/[0.02] dark:hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FaClock className="shrink-0 text-indigo-500" />
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-black dark:text-white">My Activity</h2>
                  <p className="text-xs text-black/50 dark:text-white/50">
                    Reviews, ratings, and library updates
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="shrink-0 text-xs font-semibold text-black/45 dark:text-white/45">
                  {activityItems.length} item{activityItems.length === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-black/60 dark:bg-white/10 dark:text-white/60">
                  {activityOpen ? "Hide" : "Show"}
                  {activityOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                </span>
              </div>
            </button>

            {activityOpen && (
              <div className="mt-4">
                {loadingActivity ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton key={index} className="h-20 rounded-xl" />
                    ))}
                  </div>
                ) : activityItems.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-black/10 px-4 py-8 text-center text-sm text-black/50 dark:border-white/10 dark:text-white/50">
                    Start rating titles or adding reviews to build your activity feed.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activityItems.map((activity) => {
                      const route = getActivityRoute(activity);
                      const preview = activity.contentPreview?.trim();

                      return (
                        <button
                          key={activity.id}
                          type="button"
                          onClick={() => route && navigate(route)}
                          className={`w-full rounded-xl border border-black/5 bg-black/[0.02] px-4 py-3 text-left transition dark:border-white/5 dark:bg-white/[0.03] ${route
                            ? "hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                            : "cursor-default"
                            }`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/10">
                                  {getActivityIcon(activity.type)}
                                </span>
                                <p className="text-sm font-medium text-black dark:text-white">
                                  {getActivityMessage(activity)}
                                </p>
                              </div>

                              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                <span className="rounded-full bg-black/5 px-2 py-1 text-black/55 dark:bg-white/10 dark:text-white/55">
                                  {activity.type === "RATED_TITLE"
                                    ? `${activity.rating}/5 stars`
                                    : activity.type === "REPLIED_TO_REVIEW"
                                      ? "Reply"
                                      : activity.type === "ADDED_REVIEW"
                                        ? "Review"
                                        : "Watchlist"}
                                </span>
                                {activity.mediaType && (
                                  <span className="rounded-full bg-blue-500/10 px-2 py-1 text-blue-600 dark:text-blue-300">
                                    {activity.mediaType === "movie"
                                      ? "Movie"
                                      : activity.mediaType === "anime"
                                        ? "Anime"
                                        : "Series"}
                                  </span>
                                )}
                              </div>

                              {preview && (
                                <p className="mt-2 line-clamp-2 text-sm text-black/60 dark:text-white/60">
                                  {preview}
                                </p>
                              )}
                            </div>

                            <p className="shrink-0 text-xs font-medium text-black/45 dark:text-white/45">
                              {formatDate(activity.createdAt)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
          <FaList className="text-blue-500" size={12} />
          My Lists
        </h2>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1 text-xs font-semibold text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition"
        >
          <FaPlus size={9} /> New
        </button>
          </div>

          {creating && (
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleCreate();
              if (event.key === "Escape") { setCreating(false); setNewName(""); }
            }}
            placeholder="Watchlist name…"
            maxLength={50}
            className="flex-1 px-3 py-2 rounded-lg text-sm bg-black/5 dark:bg-white/10
              text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30
              outline-none border border-transparent focus:border-black/20 dark:focus:border-white/20 transition"
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim() || saving}
            className="px-3 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-semibold disabled:opacity-40 transition flex items-center gap-1.5"
          >
            {saving ? <FaSpinner className="animate-spin" size={11} /> : "Create"}
          </button>
          <button
            onClick={() => { setCreating(false); setNewName(""); }}
            className="px-3 py-2 rounded-lg text-xs text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition"
          >
            Cancel
          </button>
        </div>
          )}

          <div className={`${SEVEN_COLUMN_CARD_GRID_CLASS} gap-3`}>
            <button
              onClick={() => navigate("/profile/favorites")}
              className="aspect-square flex flex-col items-center justify-center gap-2 rounded-xl border
                bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800
                hover:scale-105 active:scale-95 transition-transform duration-150 cursor-pointer"
            >
              <FaHeart className="text-xl text-rose-500" />
              <span className="text-xs font-semibold text-black dark:text-white">Favorites</span>
            </button>

            {groups.map(({ id, name, itemCount }) => (
              <button
                key={id}
                onClick={() => navigate(`/profile/watchlist/${id}`)}
                className="relative aspect-square flex flex-col items-center justify-center gap-2 rounded-xl border
                  bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800
                  hover:scale-105 active:scale-95 transition-transform duration-150 cursor-pointer group"
              >
                <FaList className="text-xl text-blue-500" />
                <div className="text-center px-1.5">
                  <p className="text-xs font-semibold text-black dark:text-white line-clamp-2 leading-snug">{name}</p>
                  <p className="text-[10px] text-black/40 dark:text-white/40 mt-0.5">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </p>
                </div>

                <button
                  onClick={(event) => handleDelete(event, id, name)}
                  disabled={deletingId === id}
                  className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 p-0.5"
                >
                  {deletingId === id
                    ? <FaSpinner className="animate-spin" size={10} />
                    : <FaTrash size={10} />
                  }
                </button>
              </button>
            ))}

            {!creating && (
              <button
                onClick={() => setCreating(true)}
                className="aspect-square flex flex-col items-center justify-center gap-2 rounded-xl
                  border border-dashed border-black/15 dark:border-white/15
                  text-black/30 dark:text-white/30
                  hover:border-black/30 dark:hover:border-white/30
                  hover:text-black/50 dark:hover:text-white/50
                  transition duration-150 cursor-pointer"
              >
                <FaPlus className="text-lg" />
                <span className="text-[10px] font-medium">New list</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}