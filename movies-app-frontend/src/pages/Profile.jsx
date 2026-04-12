import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaHeart, FaList, FaSignOutAlt, FaPlus, FaTrash, FaSpinner } from "react-icons/fa";
import { useAuth } from "@/components/context/AuthContext";
import { toast } from "sonner";
import { BreadCrumbs } from "@/utils/helper";
import { watchlistGroupApi } from "@/api/tmdb";

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

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoadingGroups(true);
      try {
        const res = await watchlistGroupApi.get("");
        let existing = res.data ?? [];

        const hasDefault = existing.some(
          (g) => g.name.toLowerCase() === DEFAULT_GROUP_NAME.toLowerCase()
        );
        if (!hasDefault) {
          const created = await watchlistGroupApi.post("", { name: DEFAULT_GROUP_NAME });
          existing = [created.data, ...existing];
        }

        existing.sort((a, b) => {
          if (a.name.toLowerCase() === DEFAULT_GROUP_NAME.toLowerCase()) return -1;
          if (b.name.toLowerCase() === DEFAULT_GROUP_NAME.toLowerCase()) return 1;
          return a.name.localeCompare(b.name);
        });

        setGroups(existing);
      } catch {
        toast.error("Failed to load watchlists.");
      } finally {
        setLoadingGroups(false);
      }
    };
    load();
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
    } catch {
      toast.error("Could not create watchlist.");
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
    } catch {
      toast.error("Could not delete watchlist.");
    } finally {
      setDeletingId(null);
    }
  };

  const isDefault = (name) => name.toLowerCase() === DEFAULT_GROUP_NAME.toLowerCase();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* Inline breadcrumb — overlay=false renders in document flow with muted text. */}
      <BreadCrumbs
        overlay={false}
        paths={[
          { name: "Home", to: "/" },
          { name: "Profile" },
        ]}
      />

      {/* User info */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
            <FaUser className="text-white dark:text-black text-sm" />
          </div>
          <div>
            <p className="text-base font-bold text-black dark:text-white leading-tight">{user}</p>
            <p className="text-xs text-black/50 dark:text-white/50">Movie &amp; Series Enthusiast 🎬</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg text-red-600 border border-red-600/30 hover:bg-red-600/10 transition"
        >
          <FaSignOutAlt size={11} />
          <span className="hidden sm:inline">Logout</span>
        </button>
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

              {isDefault(name) && (
                <span className="absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded-full
                                    bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-semibold leading-none">
                  Default
                </span>
              )}

              {!isDefault(name) && (
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
              )}
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