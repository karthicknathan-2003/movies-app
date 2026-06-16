import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaCheckCircle, FaHeart, FaReply, FaUserPlus } from "react-icons/fa";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { getNotifications, getUnreadNotificationCount, markAllNotificationsAsRead, markNotificationAsRead } from "@/api/notifications";
import { useAuth } from "@/components/context/AuthContext";
import { formatDate } from "@/utils/reviewHelper";
import { toast } from "sonner";

const getNotificationIcon = (type) => {
    if (type === "FOLLOW") return <FaUserPlus className="text-blue-500" size={13} />;
    if (type === "REVIEW_REPLY") return <FaReply className="text-emerald-500" size={13} />;
    return <FaHeart className="text-rose-500" size={13} />;
};

function NotificationAvatar({ actor }) {
    if (actor?.avatarUrl) {
        return (
            <img
                src={actor.avatarUrl}
                alt={actor.fullName || actor.username || "User"}
                className="h-10 w-10 rounded-full object-cover border border-black/10 dark:border-white/10"
            />
        );
    }

    const initialsSource = (actor?.fullName || actor?.username || "U").trim();
    const initials = initialsSource
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "U";

    return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-xs font-semibold text-white dark:bg-white dark:text-black">
            {initials}
        </div>
    );
}

export default function Notifications() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshUnreadCount = useCallback(async () => {
        if (!isAuthenticated) {
            setUnreadCount(0);
            return;
        }

        try {
            const response = await getUnreadNotificationCount();
            setUnreadCount(response.data?.unreadCount ?? 0);
        } catch {
            setUnreadCount(0);
        }
    }, [isAuthenticated]);

    const refreshNotifications = useCallback(async () => {
        if (!isAuthenticated) {
            setNotifications([]);
            return;
        }

        setLoading(true);
        try {
            const response = await getNotifications();
            setNotifications(response.data ?? []);
        } catch {
            toast.error("Could not load notifications.");
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        refreshUnreadCount();
    }, [refreshUnreadCount]);

    useEffect(() => {
        if (!isAuthenticated) return undefined;

        // Light polling keeps the navbar badge current without adding more shared app state.
        const intervalId = window.setInterval(() => {
            refreshUnreadCount();
            if (open) {
                refreshNotifications();
            }
        }, 30000);

        return () => window.clearInterval(intervalId);
    }, [isAuthenticated, open, refreshNotifications, refreshUnreadCount]);

    useEffect(() => {
        if (!open) return;
        refreshNotifications();
        refreshUnreadCount();
    }, [open, refreshNotifications, refreshUnreadCount]);

    const handleNotificationClick = async (notification) => {
        try {
            if (!notification.read) {
                await markNotificationAsRead(notification.id);
                setNotifications((current) => current.map((item) => (
                    item.id === notification.id ? { ...item, read: true } : item
                )));
                setUnreadCount((current) => Math.max(0, current - 1));
            }
        } catch {
            toast.error("Could not update the notification.");
        }

        if (notification.type === "FOLLOW" && notification.actor?.username) {
            setOpen(false);
            navigate(`/users/${notification.actor.username}`);
            return;
        }

        if (notification.mediaId && notification.mediaType) {
            const routeBase = notification.mediaType === "movie"
                ? "/movies"
                : notification.mediaType === "anime"
                    ? "/anime"
                    : "/series";
            setOpen(false);
            navigate(`${routeBase}/${notification.mediaId}#reviews-section`);
        }
    };

    const handleMarkAllAsRead = async () => {
        setMarkingAll(true);
        try {
            await markAllNotificationsAsRead();
            setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
            setUnreadCount(0);
        } catch {
            toast.error("Could not mark notifications as read.");
        } finally {
            setMarkingAll(false);
        }
    };

    const iconButtonClass = useMemo(() => (
        `flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition
        border-black/20 text-black hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10`
    ), []);

    if (!isAuthenticated) return null;

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={`${iconButtonClass} relative`}
                aria-label="Notifications"
                title="Notifications"
            >
                <FaBell size={16} />
                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[85vh] overflow-hidden p-0 sm:max-w-xl">
                    <DialogHeader className="px-5 pt-5">
                        <div className="flex items-center justify-between gap-3">
                            <DialogTitle>Notifications</DialogTitle>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-black/45 dark:text-white/45">
                                    {unreadCount} unread
                                </span>
                                <button
                                    type="button"
                                    disabled={markingAll || unreadCount === 0}
                                    onClick={handleMarkAllAsRead}
                                    className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/10"
                                >
                                    Mark all read
                                </button>
                            </div>
                        </div>
                    </DialogHeader>

                    <Separator className="mt-4" />

                    <div className="max-h-[68vh] overflow-y-auto px-3 py-3 sm:px-4">
                        {loading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="h-20 animate-pulse rounded-2xl bg-black/[0.04] dark:bg-white/[0.05]"
                                    />
                                ))}
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
                                    <FaCheckCircle className="text-black/30 dark:text-white/30" />
                                </div>
                                <p className="text-sm font-medium text-black/70 dark:text-white/70">
                                    You’re all caught up.
                                </p>
                                <p className="mt-1 text-xs text-black/45 dark:text-white/45">
                                    New follows, likes, and replies will show up here.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {notifications.map((notification) => (
                                    <button
                                        key={notification.id}
                                        type="button"
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`w-full rounded-2xl border px-3 py-3 text-left transition sm:px-4 ${notification.read
                                            ? "border-black/8 bg-white hover:bg-black/[0.02] dark:border-white/8 dark:bg-zinc-950 dark:hover:bg-white/[0.03]"
                                            : "border-blue-200 bg-blue-50/80 hover:bg-blue-50 dark:border-blue-900/70 dark:bg-blue-950/25 dark:hover:bg-blue-950/35"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <NotificationAvatar actor={notification.actor} />

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-2 py-1 text-[10px] font-semibold text-black/60 dark:bg-white/[0.06] dark:text-white/60">
                                                        {getNotificationIcon(notification.type)}
                                                        {notification.type === "FOLLOW"
                                                            ? "Follow"
                                                            : notification.type === "REVIEW_REPLY"
                                                                ? "Reply"
                                                                : "Like"}
                                                    </span>
                                                    {!notification.read && (
                                                        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
                                                    )}
                                                </div>

                                                <p className="mt-2 text-sm font-medium text-black dark:text-white">
                                                    {notification.message}
                                                </p>
                                                <p className="mt-1 text-xs text-black/45 dark:text-white/45">
                                                    {formatDate(notification.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
