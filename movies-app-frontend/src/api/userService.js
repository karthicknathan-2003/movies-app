import axios from "axios";
import { clearStoredSession, readToken } from "@/utils/authSession";

// Base Axios instance for user-related requests
const userAPI = axios.create({
    baseURL: import.meta.env.VITE_USER_API_URL || "http://localhost:8080/api/users",
});

// Attach JWT token to every request
userAPI.interceptors.request.use((config) => {
    const token = readToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 responses
userAPI.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401) {
            clearStoredSession();
            window.location.href = "/login";
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

export default userAPI;
