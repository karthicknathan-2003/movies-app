import axios from "axios";
import { navigationRef } from "@/utils/navigation";
import { clearStoredSession, saveRedirectAfterLogin } from "@/utils/authSession";

const notificationApi = axios.create({
    baseURL: import.meta.env.VITE_NOTIFICATION_API_URL,
    // Include the HttpOnly auth cookie for notification reads and mutations.
    withCredentials: true,
});

notificationApi.interceptors.response.use(
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

export const getNotifications = () => notificationApi.get("");

export const getUnreadNotificationCount = () => notificationApi.get("/unread-count");

export const markNotificationAsRead = (notificationId) => notificationApi.patch(`/${notificationId}/read`);

export const markAllNotificationsAsRead = () => notificationApi.patch("/read-all");

export default notificationApi;
