import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaHeart, FaList, FaPlus, FaTrash, FaSpinner, FaEdit, FaMapMarkerAlt } from "react-icons/fa";
import { useAuth } from "@/components/context/AuthContext";
import { toast } from "sonner";
import { BreadCrumbs } from "@/utils/helper";
import { watchlistGroupApi } from "@/api/tmdb";
import { getCurrentUserProfile, getUserStats, updateUserProfile } from "@/api/userService";
import ProfileEditModal from "@/components/ProfileEditModal";

const DEFAULT_GROUP_NAME = "Watchlist";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [profile, setProfile] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!user) return;
    getCurrentUserProfile()
      .then((res) => setProfile(res.data))
      .catch(console.error);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoadingGroups(true);
      try {
        const res = await watchlistGroupApi.get("");
        let existing = res.data ?? [];

        existing.sort((a, b) => {
          if (a.name.toLowerCase() === DEFAULT_GROUP_NAME.toLowerCase()) return -1;
          if (b.name.toLowerCase() === DEFAULT_GROUP_NAME.toLowerCase()) return 1;
          return a.name.localeCompare(b.name);
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

  // Fetch user stats (followers, following)
  useEffect(() => {
    if (!user) return;
    const loadStats = async () => {
      try {
        const res = await getUserStats(user);
        setFollowers(res.data?.followers || 0);
        setFollowing(res.data?.following || 0);
      } catch (error) {
        // Silently fail — stats are optional
        console.warn("Failed to load user stats:", error);
      }
    };
    loadStats();
  }, [user]);

  const handleLogout = useCallback(() => {
    logout();
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
        return updated.sort((a, b) => {
          if (a.name.toLowerCase() === DEFAULT_GROUP_NAME.toLowerCase()) return -1;
          if (b.name.toLowerCase() === DEFAULT_GROUP_NAME.toLowerCase()) return 1;
          return a.name.localeCompare(b.name);
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

  const handleDelete = async (e, groupId, groupName) => {
    e.stopPropagation();
    if (groupName.toLowerCase() === DEFAULT_GROUP_NAME.toLowerCase()) {
      toast.error(`The "${DEFAULT_GROUP_NAME}" watchlist cannot be deleted.`);
      return;
    }
    if (!window.confirm(`Delete "${groupName}" and all its items?`)) return;
    setDeletingId(groupId);
    try {
      await watchlistGroupApi.delete(`/${groupId}`);
      setGroups((prev) => prev.filter(g => g.id !== groupId));
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
      toast.success('Profile updated successfully.');
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to update profile.'
      );
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <ProfileEditModal
        open={editOpen}
        onOpenChange={setEditOpen}
        profile={profile}
        onSave={handleProfileSave}
        saving={savingProfile}
      />
      {/* Inline breadcrumb — overlay=false renders in document flow with muted text. */}
      <BreadCrumbs
        overlay={false}
        paths={[
          { name: "Home", to: "/" },
          { name: "Profile" },
        ]}
      />

      {/* User info */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between mb-8 gap-6">
        {/* LEFT: Avatar + Info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 w-full">
          {/* Avatar */}
          <div className="flex justify-center w-full sm:w-auto">
            <div className="w-24 h-24 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-black/10 dark:border-white/10 shadow-sm">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
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
            <p className="text-xl font-bold text-black dark:text-white">
              {profile?.fullName}
            </p>

            <p className="text-sm text-black/60 dark:text-white/60">
              @{user}
            </p>

            {/* Location */}
            {profile?.location && (
              <p className="flex items-center justify-center sm:justify-start gap-1 text-sm mt-1 text-black/70 dark:text-white/70">
                <FaMapMarkerAlt size={12} />
                {profile.location}
              </p>
            )}

            {/* Interests (Improved UI) */}
            {profile?.interests && (
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                {profile.interests.split(",").map((interest, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs rounded-full
                         bg-blue-100 dark:bg-blue-900/40
                         text-blue-600 dark:text-blue-300
                         font-medium"
                  >
                    {interest.trim()}
                  </span>
                ))}
              </div>
            )}

            {/* Bio */}
            {profile?.bio && (
              <p className="text-sm mt-2 max-w-md text-black/70 dark:text-white/70">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex gap-2">
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

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-black/60 dark:text-white/60 font-medium mb-1">Followers</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{followers}</p>
          <button
            onClick={() => navigate(`/users/${user}/followers`)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2"
          >
            View all
          </button>
        </div>
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
          <p className="text-xs text-black/60 dark:text-white/60 font-medium mb-1">Following</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{following}</p>
          <button
            onClick={() => navigate(`/users/${user}/following`)}
            className="text-xs text-green-600 dark:text-green-400 hover:underline mt-2"
          >
            View all
          </button>
        </div>
        <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
          <p className="text-xs text-black/60 dark:text-white/60 font-medium mb-1">Lists</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{groups.length}</p>
          <p className="text-xs text-black/40 dark:text-white/40 mt-2">Watchlists</p>
        </div>
      </div>


      {/* Section header */}
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

      {/* Inline create form */}
      {creating && (
        <div className="flex gap-2 mb-4">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") { setCreating(false); setNewName(""); }
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

      {/* Cards grid */}
      {loadingGroups ? (
        <div className="flex justify-center py-10">
          <FaSpinner className="animate-spin text-black/30 dark:text-white/30 text-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">

          {/* Favorites card — always first */}
          <button
            onClick={() => navigate("/profile/favorites")}
            className="aspect-square flex flex-col items-center justify-center gap-2 rounded-xl border
                            bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800
                            hover:scale-105 active:scale-95 transition-transform duration-150 cursor-pointer"
          >
            <FaHeart className="text-xl text-rose-500" />
            <span className="text-xs font-semibold text-black dark:text-white">Favorites</span>
          </button>

          {/* Watchlist group cards */}
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
                onClick={(e) => handleDelete(e, id, name)}
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

          {/* New list shortcut */}
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
      )}
    </div>
  );
}