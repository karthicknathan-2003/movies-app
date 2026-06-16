import axios from "axios";
import { navigationRef } from "@/utils/navigation";
import { clearStoredSession, saveRedirectAfterLogin } from "@/utils/authSession";

const reviewApi = axios.create({
    baseURL: import.meta.env.VITE_REVIEW_API_URL || "http://localhost:8080/api/reviews",
    // Credentials keep like/edit state available without exposing the JWT to JavaScript.
    withCredentials: true,
});

reviewApi.interceptors.response.use(
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

export const getMediaReviews = (mediaType, mediaId) => reviewApi.get(`/${mediaType}/${mediaId}`);

export const createMediaReview = (mediaType, mediaId, payload) => reviewApi.post(`/${mediaType}/${mediaId}`, payload);

export const toggleReviewLike = (reviewId) => reviewApi.post(`/${reviewId}/likes/toggle`);

export const updateReview = (reviewId, payload) => reviewApi.patch(`/${reviewId}`, payload);

export const deleteReview = (reviewId) => reviewApi.delete(`/${reviewId}`);

export default reviewApi;
