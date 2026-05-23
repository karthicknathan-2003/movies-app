import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaUser, FaSpinner, FaArrowLeft, FaUserPlus, FaUserCheck, FaList, FaMapMarkerAlt } from "react-icons/fa";
import { useAuth } from "@/components/context/AuthContext";
import { toast } from "sonner";
import { BreadCrumbs } from "@/utils/helper";
import { getUserByUsername, followUser, unfollowUser, getUserStats } from "@/api/userService";
import { watchlistGroupApi } from "@/api/tmdb";

export default function UserProfile() {
    const navigate = useNavigate();
    const { username } = useParams();
    const { user: currentUser } = useAuth();

    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followers, setFollowers] = useState(0);
    const [following, setFollowing] = useState(0);
    const [groups, setGroups] = useState([]);
    const [loadingWatchlists, setLoadingWatchlists] = useState(false);

    const loadUserWatchlists = useCallback(async (userId) => {
        setLoadingWatchlists(true);
        try {
            // This endpoint should return watchlists for a specific user.
            const res = await watchlistGroupApi.get(`/user/${userId}`);
            setGroups(res.data || []);
        } catch (error) {
            // Silently fail if public watchlists are not available.
            console.warn("Could not load user watchlists:", error);
        } finally {
            setLoadingWatchlists(false);
        }
    }, []);

    const loadUserProfile = useCallback(async () => {
        setLoading(true);
        try {
            // Get user by username.
            const userRes = await getUserByUsername(username);
            setUserProfile(userRes.data);
            setIsFollowing(userRes.data?.isFollowing || false);

            // Get user stats.
            const statsRes = await getUserStats(username);
            setFollowers(statsRes.data?.followers || 0);
            setFollowing(statsRes.data?.following || 0);

            // Load user's watchlists if available.
            if (userRes.data?.id) {
                await loadUserWatchlists(userRes.data.username);
            }
        } catch (error) {
            const message = error.response?.data?.message || "Failed to load user profile.";
            toast.error(message);
            navigate("/users");
        } finally {
            setLoading(false);
        }
    }, [loadUserWatchlists, navigate, username]);

    useEffect(() => {
        loadUserProfile();
    }, [loadUserProfile]);

    const handleFollow = useCallback(async () => {
        try {
            await followUser(username);
            setIsFollowing(true);
            setFollowers(prev => prev + 1);
            toast.success(`Following ${username}`);
        } catch (error) {
            const message = error.response?.data?.message || "Failed to follow user.";
            toast.error(message);
        }
    }, [username]);

    const handleUnfollow = useCallback(async () => {
        try {
            await unfollowUser(username);
            setIsFollowing(false);
            setFollowers(prev => Math.max(0, prev - 1));
            toast.success(`Unfollowed ${username}`);
        } catch (error) {
            const message = error.response?.data?.message || "Failed to unfollow user.";
            toast.error(message);
        }
    }, [username]);

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <BreadCrumbs
                    overlay={false}
                    paths={[
                        { name: "Home", to: "/" },
                        { name: "Users", to: "/users" },
                        { name: "Profile" },
                    ]}
                />
                <div className="flex justify-center py-20">
                    <FaSpinner className="animate-spin text-black/30 dark:text-white/30 text-3xl" />
                </div>
            </div>
        );
    }

    if (!userProfile) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <BreadCrumbs
                    overlay={false}
                    paths={[
                        { name: "Home", to: "/" },
                        { name: "Users", to: "/users" },
                        { name: "Profile" },
                    ]}
                />
                <div className="text-center py-20">
                    <p className="text-black/50 dark:text-white/50 mb-4">User not found</p>
                    <button
                        onClick={() => navigate("/users")}
                        className="text-blue-500 hover:underline"
                    >
                        Back to users
                    </button>
                </div>
            </div>
        );
    }

    const isOwnProfile = currentUser === username;
    return (
        window.scrollTo(0, 0),
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <BreadCrumbs
                overlay={false}
                paths={[
                    { name: "Home", to: "/" },
                    { name: "Users", to: "/users" },
                    { name: username },
                ]}
            />
            {/* Header with back button */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={() => navigate("/users")}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition text-black dark:text-white"
                >
                    <FaArrowLeft size={14} />
                    <span>Back</span>
                </button>
            </div>

            {/* User info section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between mb-8 gap-6 p-6 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-black/50">
                {/* LEFT: Avatar + Info */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 w-full">
                    {/* Avatar */}
                    <div className="flex justify-center w-full sm:w-auto">
                        <div className="w-24 h-24 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-black/10 dark:border-white/10 shadow-sm">
                            {userProfile.avatarUrl ? (
                                <img
                                    src={userProfile.avatarUrl}
                                    alt={userProfile.fullName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                    <FaUser className="text-white text-3xl sm:text-2xl" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="text-center sm:text-left">

                        <h1 className="text-2xl font-bold text-black dark:text-white">
                            {userProfile.fullName}
                        </h1>

                        <p className="text-sm text-black/60 dark:text-white/60">
                            @{username}
                        </p>

                        {/* Location */}
                        {userProfile.location && (
                            <p className="flex items-center justify-center sm:justify-start gap-1 text-sm mt-1 text-black/70 dark:text-white/70">
                                <FaMapMarkerAlt size={12} />
                                {userProfile.location}
                            </p>
                        )}

                        {/* Interests (Improved Chips UI) */}
                        {userProfile.interests && (
                            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                                {userProfile.interests.split(",").map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-1 text-xs rounded-full
                                       bg-blue-100 dark:bg-blue-900/40
                                       text-blue-600 dark:text-blue-300
                                       font-medium"
                                    >
                                        {tag.trim()}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Bio */}
                        {userProfile.bio && (
                            <p className="text-sm mt-2 max-w-md text-black/70 dark:text-white/70">
                                {userProfile.bio}
                            </p>
                        )}
                    </div>
                </div>

                {/* RIGHT: Follow Button */}
                {!isOwnProfile && (
                    <div className="flex justify-center sm:justify-end w-full sm:w-auto">
                        <button
                            onClick={() =>
                                isFollowing ? handleUnfollow() : handleFollow()
                            }
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition ${isFollowing
                                ? "bg-black/10 dark:bg-white/10 text-black dark:text-white hover:bg-black/20 dark:hover:bg-white/20"
                                : "bg-blue-500 text-white hover:bg-blue-600"
                                }`}
                        >
                            {isFollowing ? (
                                <>
                                    <FaUserCheck size={16} />
                                    Following
                                </>
                            ) : (
                                <>
                                    <FaUserPlus size={16} />
                                    Follow
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-black/60 dark:text-white/60 font-medium mb-1">Followers</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{followers}</p>

                    {isOwnProfile && (
                        <button
                            onClick={() => navigate(`/users/${username}/followers`)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2"
                        >
                            View all
                        </button>
                    )}
                </div>
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                    <p className="text-xs text-black/60 dark:text-white/60 font-medium mb-1">Following</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{following}</p>

                    {isOwnProfile && (
                        <button
                            onClick={() => navigate(`/users/${username}/following`)}
                            className="text-xs text-green-600 dark:text-green-400 hover:underline mt-2"
                        >
                            View all
                        </button>
                    )}
                </div>
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-black/60 dark:text-white/60 font-medium mb-1">Watchlists</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{groups.length}</p>
                </div>
            </div>

            {/* Watchlists section */}
            {!loadingWatchlists && groups.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-black dark:text-white mb-4 flex items-center gap-2">
                        <FaList className="text-blue-500" />
                        Watchlists ({groups.length})
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8">
                        {groups.map((group) => (
                            <div
                                key={group.id}
                                className="aspect-square flex flex-col items-center justify-center gap-2 rounded-xl p-3 border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:shadow-lg transition cursor-pointer"
                            >
                                <FaList className="text-xl text-blue-500" />
                                <div className="text-center px-1.5">
                                    <p className="text-xs font-semibold text-black dark:text-white line-clamp-2 leading-snug">
                                        {group.name}
                                    </p>
                                    <p className="text-[10px] text-black/40 dark:text-white/40 mt-0.5">
                                        {group.itemCount || 0} items
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Go to own profile button */}
            {isOwnProfile && (
                <div className="text-center">
                    <button
                        onClick={() => navigate("/profile")}
                        className="px-6 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black font-semibold hover:opacity-90 transition"
                    >
                        View My Full Profile
                    </button>
                </div>
            )}
        </div>
    );
}
