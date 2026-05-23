import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FaUser,
    FaSpinner,
    FaSearch,
    FaArrowLeft,
    FaUserPlus,
    FaUserCheck,
} from "react-icons/fa";
import { useAuth } from "@/components/context/AuthContext";
import { toast } from "sonner";
import { BreadCrumbs } from "@/utils/helper";
import {
    getAllUsers,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
} from "@/api/userService";

export default function Users() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    /**
     * Route:
     * /users
     * /users/:username/:type
     */
    const { username, type } = useParams();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [followingSet, setFollowingSet] = useState(new Set());

    const buildFollowingSet = (list) => {
        const set = new Set();
        list.forEach((user) => {
            if (user.isFollowing) {
                set.add(user.username);
            }
        });
        setFollowingSet(set);
    };

    const loadAllUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAllUsers();
            const allUsers = (res.data || []).filter(
                (u) => u.username !== currentUser
            );
            setUsers(allUsers);
            buildFollowingSet(allUsers);
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to load users."
            );
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    const loadFollowers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getFollowers(username);
            const followers = (res.data || []).filter(
                (u) => u.username !== currentUser
            );
            setUsers(followers);
            buildFollowingSet(followers);
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to load followers."
            );
        } finally {
            setLoading(false);
        }
    }, [currentUser, username]);

    const loadFollowing = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getFollowing(username);
            const following = (res.data || []).filter(
                (u) => u.username !== currentUser
            );
            setUsers(following);
            setFollowingSet(
                new Set(following.map((u) => u.username))
            );
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to load following."
            );
        } finally {
            setLoading(false);
        }
    }, [currentUser, username]);

    useEffect(() => {
        if (username && type === "followers") {
            loadFollowers();
        } else if (username && type === "following") {
            loadFollowing();
        } else {
            loadAllUsers();
        }
    }, [loadAllUsers, loadFollowers, loadFollowing, type, username]);

    const handleFollow = useCallback(async (e, targetUser) => {
        e.stopPropagation();
        try {
            await followUser(targetUser);
            setFollowingSet((prev) => {
                const updated = new Set(prev);
                updated.add(targetUser);
                return updated;
            });
            toast.success(`Following ${targetUser}`);
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to follow user."
            );
        }
    }, []);

    const handleUnfollow = useCallback(async (e, targetUser) => {
        e.stopPropagation();
        try {
            await unfollowUser(targetUser);
            setFollowingSet((prev) => {
                const updated = new Set(prev);
                updated.delete(targetUser);
                return updated;
            });
            toast.success(`Unfollowed ${targetUser}`);
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to unfollow user."
            );
        }
    }, []);

    const filteredUsers = users.filter((u) =>
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getTitle = () => {
        if (type === "followers") {
            return `${username}'s Followers`;
        }
        if (type === "following") {
            return `${username} is Following`;
        }
        return "Browse Users";
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <BreadCrumbs
                overlay={false}
                paths={[
                    { name: "Home", to: "/" },
                    { name: getTitle() },
                ]}
            />

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white mb-2">
                        {getTitle()}
                    </h1>
                    <p className="text-sm text-black/60 dark:text-white/60">
                        {filteredUsers.length}{" "}
                        {filteredUsers.length === 1 ? "user" : "users"}
                    </p>
                </div>

                {(type === "followers" || type === "following") && (
                    <button
                        onClick={() => navigate(`/users/${username}`)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg
                                   bg-black/5 dark:bg-white/10
                                   hover:bg-black/10 dark:hover:bg-white/20
                                   transition"
                    >
                        <FaArrowLeft size={14} />
                        <span>Back to Profile</span>
                    </button>
                )}
            </div>

            <div className="mb-8">
                <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30" />

                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search users..."
                        className="w-full pl-10 pr-4 py-3 rounded-lg
                                   bg-black/5 dark:bg-white/10
                                   border border-black/10 dark:border-white/10
                                   focus:border-black/30 dark:focus:border-white/30
                                   outline-none transition"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <FaSpinner className="animate-spin text-3xl text-black/30 dark:text-white/30" />
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center py-20">
                    <FaUser className="mx-auto text-4xl text-black/20 dark:text-white/20 mb-4" />
                    <p className="text-black/50 dark:text-white/50">
                        No users found
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredUsers.map((u) => {
                        const isFollowing = followingSet.has(u.username);

                        return (
                            <div
                                key={u.username}
                                onClick={() => navigate(`/users/${u.username}`)}
                                className="p-4 rounded-xl border
                                           border-black/10 dark:border-white/10
                                           bg-white dark:bg-black/50
                                           hover:shadow-lg transition cursor-pointer"
                            >
                                <div className="w-full flex justify-center mb-2">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-black/10 dark:border-white/10">
                                        {u.avatarUrl ? (
                                            <img
                                                src={u.avatarUrl}
                                                alt={u.fullName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                                <FaUser className="text-white text-xl sm:text-3xl" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="text-center mb-4">
                                    <h3 className="font-semibold text-black dark:text-white">
                                        {u.fullName}
                                    </h3>

                                    <p className="text-xs text-black/50 dark:text-white/50">
                                        @{u.username}
                                    </p>
                                </div>

                                <div className="flex justify-around text-xs py-3 mb-4 border-y border-black/5 dark:border-white/10">
                                    <div className="text-center">
                                        <p className="text-black/50 dark:text-white/50">
                                            Followers
                                        </p>
                                        <p className="font-semibold">
                                            {u.followerCount || 0}
                                        </p>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-black/50 dark:text-white/50">
                                            Following
                                        </p>
                                        <p className="font-semibold">
                                            {u.followingCount || 0}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) =>
                                        isFollowing
                                            ? handleUnfollow(e, u.username)
                                            : handleFollow(e, u.username)
                                    }
                                    className={`w-full py-2 rounded-lg text-sm
                                               font-semibold flex items-center
                                               justify-center gap-2 transition
                                               ${isFollowing
                                            ? "bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20"
                                            : "bg-blue-500 text-white hover:bg-blue-600"
                                        }`}
                                >
                                    {isFollowing ? (
                                        <>
                                            <FaUserCheck size={12} />
                                            Following
                                        </>
                                    ) : (
                                        <>
                                            <FaUserPlus size={12} />
                                            Follow
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
