import axios from "axios";
import { navigationRef } from "@/utils/navigation";
import { clearStoredSession, saveRedirectAfterLogin } from "@/utils/authSession";

// Base Axios instance for user-related requests
const userAPI = axios.create({
    baseURL: import.meta.env.VITE_USER_API_URL,
    // Include the HttpOnly auth cookie on both public and authenticated user requests.
    withCredentials: true,
});

// Handle 401 responses
userAPI.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401) {
            saveRedirectAfterLogin(window.location.pathname + window.location.search);
            clearStoredSession();
            navigationRef.navigate?.("/login", { replace: true });
        }
        return Promise.reject(error);
    }
);

// Get all users.
export const getAllUsers = () => userAPI.get("");

// Get user by username.
export const getUserByUsername = (username) => userAPI.get(`/${username}`);

// Get user stats (followers, following, etc.)
export const getUserStats = (username) => userAPI.get(`/${username}/stats`);

// Follow a user.
export const followUser = (username) => userAPI.post(`/${username}/follow`);

// Unfollow a user.
export const unfollowUser = (username) => userAPI.delete(`/${username}/follow`);

// Get followers of a user.
export const getFollowers = (username) => userAPI.get(`/${username}/followers`);

// Get following list of a user.
export const getFollowing = (username) => userAPI.get(`/${username}/following`);

// Update user profile.
export const updateUserProfile = (data) => userAPI.put('/profile', data);

// Get current logged-in user's profile.
export const getCurrentUserProfile = () => userAPI.get('/me');

// Get the signed-in user's profile activity feed.
export const getMyActivity = () => userAPI.get('/me/activity');

export default userAPI;
